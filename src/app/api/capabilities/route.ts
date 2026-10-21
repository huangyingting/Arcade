import { NextResponse } from 'next/server';
import { api, requireUser } from '@/lib/api';

export const GET = api(async () => {
  await requireUser();
  return NextResponse.json({
    ai: Boolean(process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_DEPLOYMENT),
    speech: Boolean(process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION),
    email: Boolean(process.env.EMAIL_DELIVERY_URL && process.env.EMAIL_DELIVERY_TOKEN),
    billing: false, integrations: false,
  });
});
