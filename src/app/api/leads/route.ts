import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { api, body, HttpError, integer, text, throttle, workspaceAccess, workspaceQuery } from '@/lib/api';
import { isValidAccountEmail } from '@/lib/account-admission/policy';
import { publishedFlow } from '@/lib/published';
import type { FlowStep } from '@/types/domain';

export const GET = api(async (request) => {
  const { workspace } = await workspaceAccess(workspaceQuery(request), false, true);
  const leads = await prisma.leadCapture.findMany({ where: { workspaceId: workspace.id }, orderBy: { createdAt: 'desc' }, take: 500 });
  return NextResponse.json({ leads });
});
export const POST = api(async (request) => {
  const input = await body(request);
  const flow = await publishedFlow(text(input.flowId, 'Published demo', 100));
  const steps: FlowStep[] = JSON.parse(flow.stepsJson);
  const stepIndex = integer(input.stepIndex, 'Step index', 0, Math.max(0, steps.length - 1));
  if (steps[stepIndex]?.chapter?.interactionMode !== 'form') throw new HttpError(400, 'This demo does not collect leads at this step.');
  if (input.consent !== true) throw new HttpError(400, 'Consent is required to submit your contact information.');
  const email = text(input.email, 'Email', 254).toLowerCase();
  if (!isValidAccountEmail(email)) throw new HttpError(400, 'Enter a valid email address.');
  await throttle(`lead:${createHash('sha256').update(flow.id + email).digest('hex')}`, 3, 3600);
  const fields = steps[stepIndex].chapter?.formFields || [];
  for (const field of fields.filter((f) => f.required)) text(input[field.key], field.label, 254);
  await prisma.leadCapture.create({ data: {
    workspaceId: flow.workspaceId, flowId: flow.id, flowTitle: flow.name, email,
    fullName: text(input.fullName, 'Name', 200, false) || null,
    company: text(input.company, 'Company', 200, false) || null,
    role: text(input.role, 'Role', 200, false) || null,
    stepsCompleted: stepIndex + 1, totalSteps: steps.length, syncedToCrm: false, consentAt: new Date(),
  } });
  return NextResponse.json({ ok: true }, { status: 201 });
});
