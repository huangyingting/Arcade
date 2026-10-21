export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs' || process.env.NODE_ENV !== 'production') return;
  const secret = process.env.NEXTAUTH_SECRET || '';
  if (secret.length < 32 || /replace|clone|your-secret/i.test(secret)) throw new Error('NEXTAUTH_SECRET must be a unique random secret of at least 32 characters.');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
  const url = new URL(process.env.NEXTAUTH_URL || '');
  if (url.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new Error('NEXTAUTH_URL must use HTTPS for a public deployment.');
}
