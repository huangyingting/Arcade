import fs from 'node:fs/promises';
import path from 'node:path';
import {
  audioFormat, createJob, EngineScope, ProductionError, probeDuration, requireEngineScope, text,
} from './runtime';

export { ProductionError, withEngineScope } from './runtime';
export type { EngineScope } from './runtime';

export function getAzureOpenAiConfig() {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.trim().replace(/\/+$/, '');
  const apiKey = process.env.AZURE_OPENAI_API_KEY?.trim();
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT?.trim();
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION?.trim() || '2024-10-21';
  if (!endpoint || !apiKey || !deployment) return null;
  let parsed: URL;
  try { parsed = new URL(endpoint); }
  catch { throw new ProductionError('AZURE_OPENAI_ENDPOINT must be a valid HTTPS endpoint.', 'AI_CONFIGURATION', 503); }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/') {
    throw new ProductionError('AZURE_OPENAI_ENDPOINT must be an HTTPS origin without credentials or a path.', 'AI_CONFIGURATION', 503);
  }
  return { endpoint, apiKey, deployment, apiVersion };
}

export function getAzureSpeechConfig() {
  const key = process.env.AZURE_SPEECH_KEY?.trim();
  const region = process.env.AZURE_SPEECH_REGION?.trim();
  const defaultVoice = process.env.AZURE_SPEECH_VOICE?.trim() || 'en-US-AvaMultilingualNeural';
  if (!key || !region) return null;
  if (!/^[a-z][a-z0-9-]{1,40}$/.test(region) || !/^[a-zA-Z0-9-]{3,100}Neural$/.test(defaultVoice)) {
    throw new ProductionError('Set a valid AZURE_SPEECH_REGION and neural AZURE_SPEECH_VOICE.', 'SPEECH_CONFIGURATION', 503);
  }
  return { key, region, defaultVoice };
}

async function responseBytes(response: Response, limit: number): Promise<Buffer> {
  if (!response.body) throw new ProductionError('Azure returned an empty response.', 'PROVIDER_EMPTY_RESPONSE', 502);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) {
        await reader.cancel();
        throw new ProductionError('Azure response exceeded the allowed size.', 'PROVIDER_RESPONSE_TOO_LARGE', 502);
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks);
}

async function providerRequest(url: string, init: RequestInit, limit: number): Promise<Buffer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, redirect: 'error' });
    if (!response.ok) {
      await response.body?.cancel();
      throw new ProductionError(
        response.status === 429
          ? 'Azure rate limit reached. Retry later or increase the deployment quota.'
          : `Azure request failed (HTTP ${response.status}). Verify the configured credentials, deployment, region, and access permissions.`,
        'PROVIDER_REQUEST_FAILED', response.status === 429 ? 429 : 502,
      );
    }
    return await responseBytes(response, limit);
  } catch (error) {
    if (error instanceof ProductionError) throw error;
    throw new ProductionError('Azure is unavailable or timed out. Verify connectivity and provider configuration.', 'PROVIDER_UNAVAILABLE', 502);
  } finally { clearTimeout(timer); }
}

export async function callAzureOpenAiChat(
  systemPrompt: string, userPrompt: string, maxCompletionTokens = 2048,
): Promise<{ ok: boolean; text: string; model: string }> {
  text(systemPrompt, 'systemPrompt', 32_000, true);
  text(userPrompt, 'userPrompt', 100_000, true);
  if (!Number.isInteger(maxCompletionTokens) || maxCompletionTokens < 1 || maxCompletionTokens > 16_000) {
    throw new ProductionError('maxCompletionTokens must be an integer between 1 and 16000.', 'INVALID_INPUT', 400);
  }
  const cfg = getAzureOpenAiConfig();
  if (!cfg) {
    throw new ProductionError('Configure AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, and AZURE_OPENAI_DEPLOYMENT to use AI generation.', 'AI_NOT_CONFIGURED', 503);
  }
  const url = `${cfg.endpoint}/openai/deployments/${encodeURIComponent(cfg.deployment)}/chat/completions?api-version=${encodeURIComponent(cfg.apiVersion)}`;
  const buffer = await providerRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': cfg.apiKey },
    body: JSON.stringify({
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      max_completion_tokens: maxCompletionTokens,
    }),
  }, 2 * 1024 * 1024);
  let data;
  try { data = JSON.parse(buffer.toString('utf8')); }
  catch { throw new ProductionError('Azure returned invalid response JSON.', 'PROVIDER_INVALID_RESPONSE', 502); }
  const choice = data?.choices?.[0];
  if (choice?.finish_reason && choice.finish_reason !== 'stop') {
    throw new ProductionError('Azure generation was truncated or filtered. Shorten the request or review its content.', 'AI_INCOMPLETE_RESPONSE', 502);
  }
  const content = choice?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new ProductionError('Azure returned no generated content.', 'PROVIDER_EMPTY_RESPONSE', 502);
  }
  return { ok: true, text: content.trim(), model: typeof data.model === 'string' ? data.model : cfg.deployment };
}

export async function callAzureOpenAiJson<T>(
  systemPrompt: string, userPrompt: string, _fallback?: T,
): Promise<{ data: T; provider: 'azure-openai'; model: string }> {
  const result = await callAzureOpenAiChat(`${systemPrompt}\nRespond only with valid JSON, without markdown fences.`, userPrompt, 4000);
  let data: T;
  try { data = JSON.parse(result.text) as T; }
  catch { throw new ProductionError('Azure did not return valid JSON. Retry generation.', 'AI_INVALID_JSON', 502); }
  if (data === null || typeof data !== 'object') {
    throw new ProductionError('Azure returned a JSON primitive instead of a structured result.', 'AI_INVALID_JSON', 502);
  }
  return { data, provider: 'azure-openai', model: result.model };
}

const voices: Record<string, string> = {
  'ava-natural': 'en-US-AvaMultilingualNeural', 'marcus-exec': 'en-US-AndrewMultilingualNeural',
  'elena-warm': 'en-US-EmmaMultilingualNeural', 'liam-crisp': 'en-US-BrianMultilingualNeural',
  'sophia-studio': 'en-US-AriaNeural', 'noah-calm': 'en-US-GuyNeural',
  'chloe-bright': 'en-US-JennyNeural', 'julian-british': 'en-GB-RyanNeural',
  'maya-conversational': 'en-GB-SoniaNeural', 'mateo-global': 'en-US-SteffanNeural',
  'aria-narrative': 'en-AU-NatashaNeural', 'xiaoxiao-zh': 'zh-CN-XiaoxiaoMultilingualNeural',
  'yunxi-zh': 'zh-CN-YunxiNeural', 'nanami-ja': 'ja-JP-NanamiNeural',
  'keita-ja': 'ja-JP-KeitaNeural', 'sunhi-ko': 'ko-KR-SunHiNeural', 'injoon-ko': 'ko-KR-InJoonNeural',
};
function xml(value: string) {
  return value.replace(/[<>&"']/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[character]!);
}

export async function synthesizeSpeechAudio(
  rawScript: string, voiceId = 'ava-natural',
  pronunciations: Array<{ word: string; replacement: string }> = [],
  locale?: string, scope?: EngineScope,
): Promise<{
  audioUrl: string; processedScript: string; durationSec: number;
  provider: 'azure-speech'; neuralVoice: string; xmlLang: string;
}> {
  requireEngineScope(scope);
  let processedScript = text(rawScript, 'script', 6000, true);
  if (!Array.isArray(pronunciations) || pronunciations.length > 100) {
    throw new ProductionError('At most 100 pronunciation rules are allowed.', 'INVALID_INPUT', 400);
  }
  for (const rule of pronunciations) {
    const word = text(rule?.word, 'pronunciation word', 100, true);
    const replacement = text(rule?.replacement, 'pronunciation replacement', 200, true);
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    processedScript = processedScript.replace(new RegExp(escaped, 'gi'), () => replacement);
    text(processedScript, 'processed script', 6000, true);
  }
  const cfg = getAzureSpeechConfig();
  if (!cfg) {
    throw new ProductionError('Configure AZURE_SPEECH_KEY and AZURE_SPEECH_REGION to generate neural speech.', 'SPEECH_NOT_CONFIGURED', 503);
  }
  const neuralVoice = voices[voiceId] || (voiceId === 'default' ? cfg.defaultVoice : voiceId);
  if (typeof neuralVoice !== 'string' || !/^[a-z]{2}-[A-Z]{2}-[a-zA-Z0-9]+Neural$/.test(neuralVoice)) {
    throw new ProductionError('Select a supported Azure neural voice.', 'INVALID_VOICE', 400);
  }
  const languageAliases: Record<string, string> = { en: 'en-US', zh: 'zh-CN', ja: 'ja-JP', ko: 'ko-KR', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', pt: 'pt-BR' };
  const xmlLang = locale ? languageAliases[locale] || locale : neuralVoice.split('-').slice(0, 2).join('-');
  if (!/^[a-z]{2,3}-[A-Z]{2}$/.test(xmlLang)) {
    throw new ProductionError('locale must be a supported language-region code such as en-US.', 'INVALID_LOCALE', 400);
  }
  const audio = await providerRequest(`https://${cfg.region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': cfg.key, 'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3', 'User-Agent': 'ArcadeStudio',
    },
    body: `<speak version="1.0" xml:lang="${xml(xmlLang)}"><voice name="${xml(neuralVoice)}">${xml(processedScript)}</voice></speak>`,
  }, 4 * 1024 * 1024);
  const job = await createJob(scope);
  try {
    const output = path.join(job.directory, 'speech.mp3');
    await fs.writeFile(output, audio, { mode: 0o600, flag: 'wx' });
    const format = audioFormat(audio);
    if (format !== 'mp3') throw new ProductionError('Azure did not return the requested MP3 audio.', 'PROVIDER_INVALID_RESPONSE', 502);
    const durationSec = await probeDuration(output, 'mp3');
    const audioUrl = await job.publish('speech.mp3', 'audio');
    await job.cleanup();
    return { audioUrl, processedScript, durationSec, provider: 'azure-speech', neuralVoice, xmlLang };
  } catch (error) {
    await job.cleanup();
    throw error;
  }
}
