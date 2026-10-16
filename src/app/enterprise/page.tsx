import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, Globe, Users, CheckCircle2, ArrowRight } from 'lucide-react';
import { MarketingHeader, MarketingFooter } from '@/components/marketing/MarketingChrome';

export default function EnterprisePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <MarketingHeader />
      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-3xl bg-slate-950 p-12 text-white shadow-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3.5 py-1 text-xs font-semibold text-indigo-300">
            <ShieldCheck className="h-4 w-4" /> Enterprise-Grade Security & Governance
          </span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Built for global product & security teams
          </h1>
          <p className="mt-4 max-w-2xl text-slate-300">
            SOC 2 Type II certified, Invitation-Only account admission, SAML 2.0 SSO, SCIM provisioning, and automated PII redaction.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/workspaces/workspace-5p8xcsfv/settings/security"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Configure Enterprise SSO <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/admin/invitations"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Manage Invite-Only Access
            </Link>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              icon: Lock,
              title: 'SAML SSO & Invitation-Only Admission',
              desc: 'Enforce Okta, Azure AD, or Google Workspace SSO and cryptographic one-time invitation links.',
            },
            {
              icon: Globe,
              title: 'Custom CNAME Domains & White-Label',
              desc: 'Host demos and videos on demos.yourcompany.com with custom Brand Kit themes.',
            },
            {
              icon: Users,
              title: 'Team RBAC & Audit Logs',
              desc: 'Granular workspace, team, and folder permissions with full security audit trails.',
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 p-6">
              <item.icon className="h-6 w-6 text-indigo-600" />
              <h3 className="mt-4 font-bold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
