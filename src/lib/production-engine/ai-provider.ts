import path from 'node:path';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

let envLoaded = false;
function ensureEnvLoaded() {
  if (envLoaded) return;
  envLoaded = true;
  for (const file of ['.env.local', '.env']) {
    const p = path.join(process.cwd(), file);
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf8');
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const k = trimmed.slice(0, eqIdx).trim();
          const v = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
          if (!process.env[k]) {
            process.env[k] = v;
          }
        }
      }
    }
  }
}

export function getAzureOpenAiConfig() {
  ensureEnvLoaded();
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.trim().replace(/\/+$/, '');
  const apiKey = process.env.AZURE_OPENAI_API_KEY?.trim();
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT?.trim() || 'gpt-5-mini';
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION?.trim() || '2025-01-01-preview';
  if (!endpoint || !apiKey) return null;
  return { endpoint, apiKey, deployment, apiVersion };
}

export function getAzureSpeechConfig() {
  ensureEnvLoaded();
  const key = process.env.AZURE_SPEECH_KEY?.trim();
  const region = process.env.AZURE_SPEECH_REGION?.trim();
  const defaultVoice = process.env.AZURE_SPEECH_VOICE?.trim() || 'en-US-AndrewMultilingualNeural';
  if (!key || !region) return null;
  return { key, region, defaultVoice };
}

export async function callAzureOpenAiChat(
  systemPrompt: string,
  userPrompt: string,
  maxCompletionTokens = 2048
): Promise<{ ok: boolean; text: string; model: string }> {
  const cfg = getAzureOpenAiConfig();
  if (!cfg) {
    return { ok: false, text: '', model: 'unconfigured' };
  }

  const url = `${cfg.endpoint}/openai/deployments/${cfg.deployment}/chat/completions?api-version=${cfg.apiVersion}`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': cfg.apiKey,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_completion_tokens: maxCompletionTokens,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      return { ok: false, text: '', model: cfg.deployment };
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content?.trim() || '';
    return { ok: Boolean(content), text: content, model: data?.model || cfg.deployment };
  } catch {
    return { ok: false, text: '', model: cfg.deployment };
  }
}

export async function callAzureOpenAiJson<T>(
  systemPrompt: string,
  userPrompt: string,
  fallback: T
): Promise<{ data: T; provider: 'azure-openai' | 'fallback'; model: string }> {
  const res = await callAzureOpenAiChat(
    `${systemPrompt}\nRespond ONLY with valid JSON. Do not wrap in markdown code fences if possible.`,
    userPrompt,
    2500
  );
  if (!res.ok || !res.text) {
    return { data: fallback, provider: 'fallback', model: res.model };
  }
  try {
    const cleaned = res.text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
    return {
      data: JSON.parse(cleaned) as T,
      provider: 'azure-openai',
      model: res.model,
    };
  } catch {
    return { data: fallback, provider: 'fallback', model: res.model };
  }
}

const STUDIO_VOICE_TO_AZURE_NEURAL: Record<string, string> = {
  'ava-natural': 'en-US-AvaMultilingualNeural',
  'marcus-exec': 'en-US-AndrewMultilingualNeural',
  'elena-warm': 'en-US-EmmaMultilingualNeural',
  'liam-crisp': 'en-US-BrianMultilingualNeural',
  'sophia-studio': 'en-US-AriaNeural',
  'noah-calm': 'en-US-GuyNeural',
  'chloe-bright': 'en-US-JennyNeural',
  'julian-british': 'en-GB-RyanNeural',
  'maya-conversational': 'en-GB-SoniaNeural',
  'mateo-global': 'en-US-SteffanNeural',
  'aria-narrative': 'en-AU-NatashaNeural',
  'xiaoxiao-zh': 'zh-CN-XiaoxiaoMultilingualNeural',
  'yunxi-zh': 'zh-CN-YunxiNeural',
  'nanami-ja': 'ja-JP-NanamiNeural',
  'keita-ja': 'ja-JP-KeitaNeural',
  'sunhi-ko': 'ko-KR-SunHiNeural',
  'injoon-ko': 'ko-KR-InJoonNeural',
};

const LOCALE_DEFAULT_NEURAL_VOICE: Record<string, { xmlLang: string; voice: string }> = {
  en: { xmlLang: 'en-US', voice: 'en-US-AvaMultilingualNeural' },
  'en-US': { xmlLang: 'en-US', voice: 'en-US-AvaMultilingualNeural' },
  'zh-CN': { xmlLang: 'zh-CN', voice: 'zh-CN-XiaoxiaoMultilingualNeural' },
  zh: { xmlLang: 'zh-CN', voice: 'zh-CN-XiaoxiaoMultilingualNeural' },
  'zh-TW': { xmlLang: 'zh-TW', voice: 'zh-TW-HsiaoChenNeural' },
  ja: { xmlLang: 'ja-JP', voice: 'ja-JP-NanamiNeural' },
  'ja-JP': { xmlLang: 'ja-JP', voice: 'ja-JP-NanamiNeural' },
  ko: { xmlLang: 'ko-KR', voice: 'ko-KR-SunHiNeural' },
  'ko-KR': { xmlLang: 'ko-KR', voice: 'ko-KR-SunHiNeural' },
  es: { xmlLang: 'es-ES', voice: 'es-ES-ElviraNeural' },
  fr: { xmlLang: 'fr-FR', voice: 'fr-FR-DeniseNeural' },
  de: { xmlLang: 'de-DE', voice: 'de-DE-KatjaNeural' },
  pt: { xmlLang: 'pt-BR', voice: 'pt-BR-FranciscaNeural' },
};

function detectScriptLocale(text: string, explicitLocale?: string): { xmlLang: string; voice?: string } {
  if (explicitLocale && LOCALE_DEFAULT_NEURAL_VOICE[explicitLocale]) {
    return LOCALE_DEFAULT_NEURAL_VOICE[explicitLocale];
  }
  // Hangul syllables -> Korean
  if (/[\uac00-\ud7af]/.test(text)) {
    return LOCALE_DEFAULT_NEURAL_VOICE.ko;
  }
  // Hiragana / Katakana -> Japanese
  if (/[\u3040-\u30ff]/.test(text)) {
    return LOCALE_DEFAULT_NEURAL_VOICE.ja;
  }
  // CJK Unified Ideographs -> Chinese
  if (/[\u4e00-\u9fff]/.test(text)) {
    return LOCALE_DEFAULT_NEURAL_VOICE['zh-CN'];
  }
  return { xmlLang: 'en-US' };
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function synthesizeSpeechAudio(
  rawScript: string,
  voiceId: string = 'ava-natural',
  pronunciations: Array<{ word: string; replacement: string }> = [],
  locale?: string
): Promise<{
  audioUrl: string;
  processedScript: string;
  durationSec: number;
  provider: 'azure-speech' | 'ffmpeg-fallback';
  neuralVoice: string;
  xmlLang: string;
}> {
  let processedScript = (rawScript || 'Welcome to Arcade interactive product studio.').trim();
  for (const rule of pronunciations) {
    if (rule.word && rule.replacement) {
      const escaped = rule.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      processedScript = processedScript.replace(new RegExp(escaped, 'gi'), rule.replacement);
    }
  }

  const cjkChars = (processedScript.match(/[\u3040-\u9fff\uac00-\ud7af]/g) || []).length;
  const words = processedScript.split(/\s+/).filter(Boolean);
  const durationSec = Math.max(
    2,
    Math.min(20, cjkChars > 4 ? Math.ceil(cjkChars / 4.2) : Math.ceil(words.length / 2.6))
  );
  const audioDir = path.join(process.cwd(), 'public', 'uploads', 'audio');
  fs.mkdirSync(audioDir, { recursive: true });

  const speechCfg = getAzureSpeechConfig();
  const detected = detectScriptLocale(processedScript, locale);
  const neuralVoice =
    detected.voice ||
    STUDIO_VOICE_TO_AZURE_NEURAL[voiceId] ||
    speechCfg?.defaultVoice ||
    'en-US-AvaMultilingualNeural';
  const xmlLang = detected.xmlLang || 'en-US';

  if (speechCfg) {
    try {
      const ssml = `<speak version='1.0' xml:lang='${xmlLang}'><voice xml:lang='${xmlLang}' name='${neuralVoice}'>${escapeXml(
        processedScript
      )}</voice></speak>`;

      const ttsUrl = `https://${speechCfg.region}.tts.speech.microsoft.com/cognitiveservices/v1`;
      const res = await fetch(ttsUrl, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': speechCfg.key,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
          'User-Agent': 'ArcadeStudio/2.0',
        },
        body: ssml,
      });

      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        if (arrayBuf.byteLength > 256) {
          const fileName = `neural-${xmlLang.toLowerCase()}-${Date.now()}.mp3`;
          const filePath = path.join(audioDir, fileName);
          fs.writeFileSync(filePath, Buffer.from(arrayBuf));
          return {
            audioUrl: `/uploads/audio/${fileName}`,
            processedScript,
            durationSec,
            provider: 'azure-speech',
            neuralVoice,
            xmlLang,
          };
        }
      }
    } catch {
      // Fall through to ffmpeg synthesis
    }
  }

  // Fallback local WAV synthesis
  const fileName = `voiceover-${voiceId}-${Date.now()}.wav`;
  const filePath = path.join(audioDir, fileName);
  const baseFreq = voiceId.includes('marcus') || voiceId.includes('julian') ? 165 : 215;

  execFileSync(
    'ffmpeg',
    [
      '-y',
      '-f',
      'lavfi',
      '-i',
      `sine=frequency=${baseFreq}:sample_rate=44100:duration=${durationSec}`,
      '-af',
      'tremolo=f=4.5:d=0.65,volume=0.28,afade=t=in:st=0:d=0.15,afade=t=out:st=' +
        Math.max(0.2, durationSec - 0.3) +
        ':d=0.25',
      filePath,
    ],
    { stdio: 'ignore' }
  );

  return {
    audioUrl: `/uploads/audio/${fileName}`,
    processedScript,
    durationSec,
    provider: 'ffmpeg-fallback',
    neuralVoice,
    xmlLang,
  };
}
