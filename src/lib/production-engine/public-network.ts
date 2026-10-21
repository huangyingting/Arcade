import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import http from 'node:http';
import https from 'node:https';
import { ProductionError } from './runtime';

export function isPublicAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a, b, c] = address.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
      (a === 192 && b === 0) || (a === 192 && b === 88 && c === 99) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
      (a === 203 && b === 0 && c === 113));
  }
  if (isIP(address) === 6) {
    const [first, second] = address.toLowerCase().split(':').map((part) => Number.parseInt(part || '0', 16));
    return first >= 0x2000 && first <= 0x3fff && first !== 0x2002 &&
      !(first === 0x2001 && (second < 0x200 || second === 0xdb8)) &&
      first !== 0x3fff;
  }
  return false;
}

export function parsePublicUrl(raw: string): URL {
  if (typeof raw !== 'string' || !raw.trim() || raw.length > 2048 || /[\u0000-\u0020\\]/.test(raw)) {
    throw new ProductionError('Provide a valid public HTTP(S) URL.', 'UNSAFE_URL', 400);
  }
  let url: URL;
  try { url = new URL(raw); }
  catch { throw new ProductionError('Provide a complete public URL including https://.', 'UNSAFE_URL', 400); }
  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase().replace(/\.$/, '');
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      (url.port && url.port !== (url.protocol === 'https:' ? '443' : '80')) ||
      !host || host === 'localhost' || /\.(localhost|local|internal|lan|home|onion|test|invalid)$/.test(host) ||
      (isIP(host) ? !isPublicAddress(host) : !host.includes('.'))) {
    throw new ProductionError('Only public HTTP(S) sites on standard ports without URL credentials are allowed.', 'UNSAFE_URL', 400);
  }
  url.hash = '';
  return url;
}

export async function resolvePublicUrl(raw: string) {
  const url = parsePublicUrl(raw);
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  let addresses;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    addresses = isIP(hostname)
      ? [{ address: hostname, family: isIP(hostname) }]
      : await Promise.race([
        lookup(hostname, { all: true, verbatim: true }),
        new Promise<never>((_resolve, reject) => {
          timer = setTimeout(() => reject(new Error('DNS resolution timed out')), 5000);
        }),
      ]);
  } catch {
    throw new ProductionError('The website hostname could not be resolved.', 'CRAWL_DNS_FAILED', 422);
  } finally { if (timer) clearTimeout(timer); }
  if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) {
    throw new ProductionError('The website resolves to an internal, reserved, or unsafe network address.', 'UNSAFE_URL', 400);
  }
  return { url, address: addresses[0] };
}

export interface NetworkBudget { requests: number; bytes: number; deadline: number }

export async function fetchPublicResource(rawUrl: string, budget: NetworkBudget, redirects = 0): Promise<{
  status: number; headers: Record<string, string>; body: Buffer; finalUrl: string;
}> {
  if (++budget.requests > 100 || Date.now() > budget.deadline || redirects > 5) {
    throw new ProductionError('Website capture exceeded its request, time, or redirect limit.', 'CRAWL_LIMIT_EXCEEDED', 422);
  }
  const { url, address } = await resolvePublicUrl(rawUrl);
  const result = await new Promise<{ status: number; headers: http.IncomingHttpHeaders; body: Buffer }>((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const fail = (error: Error) => {
      if (timer) clearTimeout(timer);
      reject(error);
    };
    // Pin the validated address for the actual socket; never let the browser re-resolve it.
    const request = (url.protocol === 'https:' ? https : http).request(url, {
      method: 'GET',
      agent: false,
      lookup: (_hostname, options, callback) => {
        if (options.all) callback(null, [address]);
        else callback(null, address.address, address.family);
      },
      headers: { 'User-Agent': 'ArcadeCapture/1.0', Accept: '*/*', 'Accept-Encoding': 'identity' },
    }, (response) => {
      const status = response.statusCode || 502;
      if (status >= 300 && status <= 399 && response.headers.location) {
        if (timer) clearTimeout(timer);
        response.destroy();
        resolve({ status, headers: response.headers, body: Buffer.alloc(0) });
        return;
      }
      const chunks: Buffer[] = [];
      let bytes = 0;
      response.on('data', (chunk: Buffer) => {
        bytes += chunk.length;
        budget.bytes += chunk.length;
        if (bytes > 8 * 1024 * 1024 || budget.bytes > 40 * 1024 * 1024) {
          response.destroy(new ProductionError('Website resource exceeded capture size limits.', 'CRAWL_LIMIT_EXCEEDED', 422));
        } else chunks.push(chunk);
      });
      response.on('end', () => {
        if (timer) clearTimeout(timer);
        resolve({ status, headers: response.headers, body: Buffer.concat(chunks) });
      });
      response.on('error', fail);
    });
    const timeout = Math.max(1, Math.min(10_000, budget.deadline - Date.now()));
    timer = setTimeout(() => request.destroy(new Error('Capture request timed out')), timeout);
    request.setTimeout(timeout, () => request.destroy(new Error('Capture request timed out')));
    request.on('error', fail);
    request.end();
  });
  if (result.status >= 300 && result.status <= 399 && result.headers.location) {
    return fetchPublicResource(new URL(result.headers.location, url).toString(), budget, redirects + 1);
  }
  const headers: Record<string, string> = {};
  for (const key of ['content-type', 'content-language', 'content-encoding']) {
    const value = result.headers[key];
    if (typeof value === 'string') headers[key] = value;
  }
  return { status: result.status, headers, body: result.body, finalUrl: url.toString() };
}
