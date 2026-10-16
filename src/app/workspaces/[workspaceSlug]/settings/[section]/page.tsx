'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Settings,
  CreditCard,
  Users,
  Shield,
  EyeOff,
  Plug,
  Languages,
  Volume2,
  Mic,
  Sliders,
  Palette,
  Save,
  Check,
  KeyRound,
  Plus,
  Trash2,
  Play,
  ExternalLink,
} from 'lucide-react';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';
import { ELEVENLABS_VOICES, TRANSLATION_LOCALES } from '@/types/domain';

const SETTINGS_SECTIONS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
  { id: 'members', label: 'Members & Invites', icon: Users },
  { id: 'brand-kits', label: 'Brand Kits (13-Tab)', icon: Palette },
  { id: 'security', label: 'Security & SSO', icon: Shield },
  { id: 'privacy', label: 'Viewer Privacy', icon: EyeOff },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'translations', label: 'Translations (36)', icon: Languages },
  { id: 'pronunciation', label: 'Pronunciation', icon: Volume2 },
  { id: 'synthetic-voices', label: 'Synthetic Voices', icon: Mic },
  { id: 'advanced', label: 'Advanced', icon: Sliders },
] as const;

export default function WorkspaceSettingsSectionPage({
  params: rawParams,
}: {
  params: Promise<{ workspaceSlug: string; section: string }>;
}) {
  const { workspaceSlug, section } = React.use(rawParams);
  const [workspace, setWorkspace] = useState<any>(null);
  const [wsName, setWsName] = useState("jack wolf's workspace");
  const [wsSlugInput, setWsSlugInput] = useState(workspaceSlug);

  // Pronunciation dictionary
  const [pronRules, setPronRules] = useState<Array<{ id: string; word: string; replacement: string }>>([
    { id: 'pr1', word: 'SC-100', replacement: 'S C One Hundred' },
    { id: 'pr2', word: 'genisisiq', replacement: 'Genesis I Q' },
    { id: 'pr3', word: 'AZ-305', replacement: 'A Z Three Oh Five' },
  ]);
  const [newWord, setNewWord] = useState('');
  const [newReplacement, setNewReplacement] = useState('');

  // Security & SSO state
  const [securityConfig, setSecurityConfig] = useState({
    enforceInviteOnly: true,
    samlEnabled: false,
    idpEntityId: 'https://sts.windows.net/whoami-genisisiq/',
    ssoLoginUrl: 'https://login.microsoftonline.com/whoami-genisisiq/saml2',
    scimProvisioning: true,
    sessionTimeoutHours: 24,
  });

  // Viewer Privacy state
  const [privacyConfig, setPrivacyConfig] = useState({
    cookielessAnalytics: false,
    anonymizeViewerIp: true,
    autoRedactEmailsInDom: true,
    euGdprDataResidency: true,
    allowSearchEngineIndexing: true,
  });

  // Translations state
  const [translationConfig, setTranslationConfig] = useState({
    defaultLocale: 'en',
    autoDetectBrowserLocale: true,
    translateVoiceoverAudio: true,
    enabledLocales: ['en', 'zh-CN', 'ja', 'de', 'fr', 'es', 'ko', 'pt-BR'],
  });

  // Advanced state
  const [advancedConfig, setAdvancedConfig] = useState({
    customCnameDomain: 'demos.genisisiq.com',
    webhookUrl: 'https://whoami.genisisiq.com/api/webhooks/arcade',
    defaultExportFps: 60,
    defaultExportResolution: '1080p',
    enableHtmlPageMorphing: true,
  });

  // Synthetic Voice Preview state
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/workspaces/${workspaceSlug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.workspace) {
          const ws = data.workspace;
          setWorkspace(ws);
          setWsName(ws.name);
          setWsSlugInput(ws.slug);
          try {
            const parsedPron = JSON.parse(ws.pronunciationRulesJson || '[]');
            if (parsedPron.length) setPronRules(parsedPron);
          } catch {}
          try {
            const parsedPriv = JSON.parse(ws.privacySettingsJson || '{}');
            if (Object.keys(parsedPriv).length) setPrivacyConfig((p) => ({ ...p, ...parsedPriv }));
          } catch {}
          try {
            const parsedTrans = JSON.parse(ws.translationSettingsJson || '{}');
            if (Object.keys(parsedTrans).length) setTranslationConfig((p) => ({ ...p, ...parsedTrans }));
          } catch {}
          try {
            const parsedAdv = JSON.parse(ws.advancedSettingsJson || '{}');
            if (Object.keys(parsedAdv).length) {
              setAdvancedConfig((p) => ({ ...p, ...parsedAdv }));
              if (parsedAdv.securityConfig) {
                setSecurityConfig((s) => ({ ...s, ...parsedAdv.securityConfig }));
              }
            }
          } catch {}
        }
      });
  }, [workspaceSlug]);

  async function saveWorkspacePatch(patch: Record<string, unknown>) {
    const res = await fetch(`/api/workspaces/${workspaceSlug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (data.workspace) setWorkspace(data.workspace);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function previewSyntheticVoice(voiceId: string, voiceName: string) {
    setPlayingVoiceId(voiceId);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: `Hello, I am ${voiceName}. Welcome to whoami.genisisiq.com interactive cloud architecture studio.`,
          voiceId,
          pronunciations: pronRules,
        }),
      });
      const data = await res.json();
      if (data.audioUrl) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        const audio = new Audio(data.audioUrl);
        audioRef.current = audio;
        audio.onended = () => setPlayingVoiceId(null);
        await audio.play().catch(() => setPlayingVoiceId(null));
      } else {
        setPlayingVoiceId(null);
      }
    } catch {
      setPlayingVoiceId(null);
    }
  }

  return (
    <WorkspaceShell workspaceSlug={workspaceSlug}>
      <div className="flex h-full flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 capitalize">
              Workspace Settings — {section.replace('-', ' ')}
            </h1>
            <p className="text-xs text-slate-500">
              Manage workspace preferences, billing, Invite-Only admissions, Brand Kits, and AI voice settings.
            </p>
          </div>
          {saved && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <Check className="h-3.5 w-3.5" /> Saved changes
            </span>
          )}
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Settings Sub-nav */}
          <div className="w-60 shrink-0 overflow-y-auto border-r border-slate-200 bg-slate-50/60 p-3 space-y-1">
            {SETTINGS_SECTIONS.map((item) => {
              const active = section === item.id;
              return (
                <Link
                  key={item.id}
                  href={
                    item.id === 'brand-kits'
                      ? `/workspaces/${workspaceSlug}/settings/brand-kits/XE1uVIkZSLQJth6oUMJ0`
                      : `/workspaces/${workspaceSlug}/settings/${item.id}`
                  }
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition ${
                    active
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Settings Content */}
          <div className="flex-1 overflow-y-auto p-8">
            {/* 1. GENERAL */}
            {section === 'general' && (
              <div className="max-w-xl space-y-5">
                <h2 className="text-lg font-bold text-slate-900">General Workspace Settings</h2>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    value={wsName}
                    onChange={(e) => setWsName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500">
                    Workspace Slug
                  </label>
                  <input
                    type="text"
                    value={wsSlugInput}
                    readOnly
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs text-slate-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => saveWorkspacePatch({ name: wsName })}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  <Save className="h-3.5 w-3.5" /> Save General Settings
                </button>
              </div>
            )}

            {/* 2. BILLING */}
            {section === 'billing' && (
              <div className="max-w-2xl space-y-6">
                <h2 className="text-lg font-bold text-slate-900">Plan & Credit Balance</h2>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold uppercase text-indigo-600">Current Tier</div>
                      <div className="text-2xl font-extrabold text-slate-900">
                        {workspace?.planTier || 'FREE'} PLAN
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Monthly Quota: {workspace?.monthlyCreditsQuota ?? 200} credits • Bonus Pool:{' '}
                        {workspace?.bonusCreditsBalance ?? 200} credits • Used:{' '}
                        {workspace?.usedCreditsThisCycle ?? 100} credits
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/workspaces/${workspaceSlug}/purchase-credits`}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                      >
                        Buy Credit Pack
                      </Link>
                      <Link
                        href={`/workspaces/${workspaceSlug}/upgrade`}
                        className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                      >
                        Upgrade Plan
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. MEMBERS & INVITES */}
            {section === 'members' && (
              <div className="max-w-3xl space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Workspace Members & Invite-Only Admission
                    </h2>
                    <p className="text-xs text-slate-500">
                      Create one-time cryptographic invitation links via the ReadWise admission engine.
                    </p>
                  </div>
                  <Link
                    href="/admin/invitations"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    <KeyRound className="h-3.5 w-3.5" /> Open Invitation Admin Console
                  </Link>
                </div>

                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white p-4">
                  {(workspace?.members || []).map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <div className="font-bold text-sm text-slate-900">
                          {m.user?.name || 'jack wolf'} ({m.user?.email || 'wlfjck@gmail.com'})
                        </div>
                        <div className="text-xs text-slate-500">
                          Workspace {m.role} • Active Session Verified
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                        {m.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. SECURITY & SSO */}
            {section === 'security' && (
              <div className="max-w-2xl space-y-5">
                <h2 className="text-lg font-bold text-slate-900">Enterprise Security & SAML 2.0 SSO</h2>
                <p className="text-xs text-slate-500">
                  Configure ReadWise Invitation-Only account admission, SAML 2.0 Single Sign-On, and SCIM directory sync.
                </p>

                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
                  <label className="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span>Enforce Invitation-Only Account Registration (ReadWise Admission)</span>
                    <input
                      type="checkbox"
                      checked={securityConfig.enforceInviteOnly}
                      onChange={(e) =>
                        setSecurityConfig({ ...securityConfig, enforceInviteOnly: e.target.checked })
                      }
                      className="h-4 w-4 accent-indigo-600"
                    />
                  </label>
                  <label className="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span>Enable SAML 2.0 Single Sign-On (Microsoft Entra ID / Okta)</span>
                    <input
                      type="checkbox"
                      checked={securityConfig.samlEnabled}
                      onChange={(e) =>
                        setSecurityConfig({ ...securityConfig, samlEnabled: e.target.checked })
                      }
                      className="h-4 w-4 accent-indigo-600"
                    />
                  </label>
                  <label className="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span>Enable SCIM 2.0 Automated Role Provisioning</span>
                    <input
                      type="checkbox"
                      checked={securityConfig.scimProvisioning}
                      onChange={(e) =>
                        setSecurityConfig({ ...securityConfig, scimProvisioning: e.target.checked })
                      }
                      className="h-4 w-4 accent-indigo-600"
                    />
                  </label>

                  <div className="pt-2">
                    <label className="block text-[11px] font-semibold uppercase text-slate-500">
                      IdP Entity ID / Issuer URL
                    </label>
                    <input
                      type="text"
                      value={securityConfig.idpEntityId}
                      onChange={(e) =>
                        setSecurityConfig({ ...securityConfig, idpEntityId: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-500">
                      SAML 2.0 SSO Login Endpoint
                    </label>
                    <input
                      type="text"
                      value={securityConfig.ssoLoginUrl}
                      onChange={(e) =>
                        setSecurityConfig({ ...securityConfig, ssoLoginUrl: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-xs"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    saveWorkspacePatch({
                      advancedSettings: { ...advancedConfig, securityConfig },
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  <Save className="h-3.5 w-3.5" /> Save Security & SSO Policy
                </button>
              </div>
            )}

            {/* 5. VIEWER PRIVACY */}
            {section === 'privacy' && (
              <div className="max-w-2xl space-y-5">
                <h2 className="text-lg font-bold text-slate-900">Viewer Privacy & GDPR Governance</h2>
                <p className="text-xs text-slate-500">
                  Control how viewer telemetry, IP addresses, and captured DOM PII are handled across shared players.
                </p>

                <div className="space-y-3.5 rounded-2xl border border-slate-200 bg-white p-5">
                  {[
                    {
                      key: 'anonymizeViewerIp',
                      label: 'Anonymize Viewer IPv4/IPv6 Addresses Before Persistence',
                    },
                    {
                      key: 'autoRedactEmailsInDom',
                      label: 'Automatically Blur / Redact Detected Emails & Tokens During Capture',
                    },
                    {
                      key: 'cookielessAnalytics',
                      label: 'Strict Cookie-less Telemetry Mode (Session-Only Viewer IDs)',
                    },
                    {
                      key: 'euGdprDataResidency',
                      label: 'Enforce GDPR / CCPA Compliant Data Retention (90-Day Auto-Purge)',
                    },
                    {
                      key: 'allowSearchEngineIndexing',
                      label: 'Allow Search Engines to Index Public Share & Guide Pages',
                    },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center justify-between text-xs font-semibold text-slate-800"
                    >
                      <span>{item.label}</span>
                      <input
                        type="checkbox"
                        checked={Boolean((privacyConfig as any)[item.key])}
                        onChange={(e) =>
                          setPrivacyConfig({ ...privacyConfig, [item.key]: e.target.checked })
                        }
                        className="h-4 w-4 accent-indigo-600"
                      />
                    </label>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => saveWorkspacePatch({ privacySettings: privacyConfig })}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  <Save className="h-3.5 w-3.5" /> Save Viewer Privacy Settings
                </button>
              </div>
            )}

            {/* 6. INTEGRATIONS */}
            {section === 'integrations' && (
              <div className="max-w-3xl space-y-5">
                <h2 className="text-lg font-bold text-slate-900">GTM & CRM Integrations</h2>
                <p className="text-xs text-slate-500">
                  Toggle live integrations to sync viewer telemetry, captured leads, and Slack notifications.
                </p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {(workspace?.integrations || []).map((integ: any) => {
                    const isConn = integ.status === 'CONNECTED';
                    return (
                      <div
                        key={integ.id}
                        className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs"
                      >
                        <div>
                          <div className="text-sm font-bold text-slate-900">{integ.provider}</div>
                          <div className="text-[11px] text-slate-500">{integ.category}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => saveWorkspacePatch({ toggleIntegrationId: integ.id })}
                          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                            isConn
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-900 text-white hover:bg-slate-800'
                          }`}
                        >
                          {isConn ? 'Connected ✓' : 'Connect'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 7. TRANSLATIONS (36 LOCALES) */}
            {section === 'translations' && (
              <div className="max-w-3xl space-y-5">
                <h2 className="text-lg font-bold text-slate-900">
                  Multi-Language Auto-Localization (36 Locales)
                </h2>
                <p className="text-xs text-slate-500">
                  Configure default locale, browser language auto-detection, and AI voiceover dubbing across 36 languages.
                </p>

                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
                  <label className="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span>Auto-detect viewer browser language (`Accept-Language`) on Share Player</span>
                    <input
                      type="checkbox"
                      checked={translationConfig.autoDetectBrowserLocale}
                      onChange={(e) =>
                        setTranslationConfig({
                          ...translationConfig,
                          autoDetectBrowserLocale: e.target.checked,
                        })
                      }
                      className="h-4 w-4 accent-indigo-600"
                    />
                  </label>
                  <label className="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span>Synthesize localized ElevenLabs voiceover narration per language</span>
                    <input
                      type="checkbox"
                      checked={translationConfig.translateVoiceoverAudio}
                      onChange={(e) =>
                        setTranslationConfig({
                          ...translationConfig,
                          translateVoiceoverAudio: e.target.checked,
                        })
                      }
                      className="h-4 w-4 accent-indigo-600"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {TRANSLATION_LOCALES.map((loc) => {
                    const enabled = translationConfig.enabledLocales.includes(loc.code);
                    return (
                      <button
                        key={loc.code}
                        type="button"
                        onClick={() => {
                          const next = enabled
                            ? translationConfig.enabledLocales.filter((c) => c !== loc.code)
                            : [...translationConfig.enabledLocales, loc.code];
                          setTranslationConfig({ ...translationConfig, enabledLocales: next });
                        }}
                        className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-xs transition ${
                          enabled
                            ? 'border-indigo-600 bg-indigo-50/70 font-semibold text-indigo-900'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">{loc.name}</span>
                        <span className="font-mono text-[10px] uppercase text-slate-400">
                          {loc.code}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => saveWorkspacePatch({ translationSettings: translationConfig })}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  <Save className="h-3.5 w-3.5" /> Save Localization Preferences
                </button>
              </div>
            )}

            {/* 8. PRONUNCIATION */}
            {section === 'pronunciation' && (
              <div className="max-w-2xl space-y-5">
                <h2 className="text-lg font-bold text-slate-900">
                  AI Voiceover Pronunciation Dictionary
                </h2>
                <p className="text-xs text-slate-500">
                  Define phonetic replacements for technical acronyms (e.g. SC-100, AZ-305, genisisiq).
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Acronym / Word (e.g. CISSP)"
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Spoken Phonetic (e.g. C I S S P)"
                    value={newReplacement}
                    onChange={(e) => setNewReplacement(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newWord.trim() || !newReplacement.trim()) return;
                      const next = [
                        ...pronRules,
                        { id: `pr_${Date.now()}`, word: newWord.trim(), replacement: newReplacement.trim() },
                      ];
                      setPronRules(next);
                      setNewWord('');
                      setNewReplacement('');
                      saveWorkspacePatch({ pronunciationRules: next });
                    }}
                    className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Rule
                  </button>
                </div>

                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
                  {pronRules.map((r) => (
                    <div key={r.id} className="flex items-center justify-between px-4 py-3 text-xs">
                      <div>
                        <span className="font-mono font-bold text-slate-900">{r.word}</span>
                        <span className="ml-3 text-slate-500">Spoken as → &ldquo;{r.replacement}&rdquo;</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const next = pronRules.filter((item) => item.id !== r.id);
                          setPronRules(next);
                          saveWorkspacePatch({ pronunciationRules: next });
                        }}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 9. SYNTHETIC VOICES */}
            {section === 'synthetic-voices' && (
              <div className="max-w-3xl space-y-4">
                <h2 className="text-lg font-bold text-slate-900">11 ElevenLabs Studio Voices</h2>
                <p className="text-xs text-slate-500">
                  Click Preview on any voice to synthesize and play a real WAV voiceover sample with your pronunciation rules applied.
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {ELEVENLABS_VOICES.map((v) => {
                    const isPlaying = playingVoiceId === v.id;
                    return (
                      <div
                        key={v.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900">{v.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {v.accent} • {v.style}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => previewSyntheticVoice(v.id, v.name)}
                          className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100"
                        >
                          <Play className="h-3 w-3" />
                          {isPlaying ? 'Playing...' : 'Preview WAV'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 10. ADVANCED */}
            {section === 'advanced' && (
              <div className="max-w-2xl space-y-5">
                <h2 className="text-lg font-bold text-slate-900">
                  Advanced CNAME, Webhooks & Render Defaults
                </h2>
                <p className="text-xs text-slate-500">
                  Configure custom white-label CNAME domains, outbound webhook endpoints, and FFmpeg video export defaults.
                </p>

                <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500">
                      Custom Share CNAME Domain
                    </label>
                    <input
                      type="text"
                      value={advancedConfig.customCnameDomain}
                      onChange={(e) =>
                        setAdvancedConfig({ ...advancedConfig, customCnameDomain: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500">
                      Outbound Lead & Telemetry Webhook URL
                    </label>
                    <input
                      type="text"
                      value={advancedConfig.webhookUrl}
                      onChange={(e) =>
                        setAdvancedConfig({ ...advancedConfig, webhookUrl: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-500">
                        Default Video Resolution
                      </label>
                      <select
                        value={advancedConfig.defaultExportResolution}
                        onChange={(e) =>
                          setAdvancedConfig({
                            ...advancedConfig,
                            defaultExportResolution: e.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                      >
                        <option value="720p">720p HD</option>
                        <option value="1080p">1080p Full HD</option>
                        <option value="4K">4K Ultra HD</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-500">
                        Default Frame Rate
                      </label>
                      <select
                        value={advancedConfig.defaultExportFps}
                        onChange={(e) =>
                          setAdvancedConfig({
                            ...advancedConfig,
                            defaultExportFps: Number(e.target.value),
                          })
                        }
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                      >
                        <option value={30}>30 FPS</option>
                        <option value={60}>60 FPS</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => saveWorkspacePatch({ advancedSettings: advancedConfig })}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  <Save className="h-3.5 w-3.5" /> Save Advanced Configuration
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}
