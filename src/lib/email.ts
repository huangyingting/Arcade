import { HttpError } from '@/lib/api';

export function requireEmailDelivery() {
  if (!process.env.EMAIL_DELIVERY_URL || !process.env.EMAIL_DELIVERY_TOKEN) {
    throw new HttpError(503, 'Email delivery is not configured. Contact your administrator for account recovery.');
  }
  const url = new URL(process.env.EMAIL_DELIVERY_URL);
  if (url.protocol !== 'https:') throw new HttpError(503, 'Email delivery requires an HTTPS endpoint.');
  return url;
}

export async function sendEmail(message: { to: string; subject: string; text: string }) {
  const url = requireEmailDelivery();
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.EMAIL_DELIVERY_TOKEN}` },
    body: JSON.stringify(message), signal: AbortSignal.timeout(15000), redirect: 'error',
  });
  if (!response.ok) throw new HttpError(503, 'Email could not be delivered. Please try again later.');
}
