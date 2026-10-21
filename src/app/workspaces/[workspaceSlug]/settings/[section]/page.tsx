'use client';

import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';
import { ELEVENLABS_VOICES, TRANSLATION_LOCALES } from '@/types/domain';

const sections = [
  ['general', 'General'], ['members', 'Members'], ['brand-kits', 'Brand kits'],
  ['billing', 'Plan & usage'], ['security', 'Security'], ['privacy', 'Privacy preferences'],
  ['integrations', 'Integrations'], ['translations', 'Languages'], ['pronunciation', 'Pronunciation'],
  ['synthetic-voices', 'Voice previews'], ['advanced', 'Export preferences'],
];
type Rule = { id: string; word: string; replacement: string };
type MemberRole = 'ADMIN' | 'EDITOR' | 'VIEWER';
type Member = { id: string; role: string; user: { id: string; name: string | null; email: string | null } };
type Config = Record<string, any>;
type Workspace = {
  slug: string; name: string; role: string; planTier: string;
  monthlyCreditsQuota: number; bonusCreditsBalance: number; usedCreditsThisCycle: number;
  privacySettingsJson: string; translationSettingsJson: string; advancedSettingsJson: string; pronunciationRulesJson: string;
  members: Member[];
  brandKits: Array<{ id: string; name: string; sourceUrl?: string; status: string }>;
};
function parse<T,>(value: string | undefined, fallback: T): T {
  try { return value ? JSON.parse(value) ?? fallback : fallback; } catch { return fallback; }
}

export default function WorkspaceSettingsPage({ params }: { params: Promise<{ workspaceSlug: string; section: string }> }) {
  const { workspaceSlug, section } = use(params);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [platformAdmin, setPlatformAdmin] = useState(false);
  const [name, setName] = useState('');
  const [privacy, setPrivacy] = useState<Config>({});
  const [translations, setTranslations] = useState<Config>({});
  const [advanced, setAdvanced] = useState<Config>({});
  const [rules, setRules] = useState<Rule[]>([]);
  const [word, setWord] = useState('');
  const [replacement, setReplacement] = useState('');
  const [brandUrl, setBrandUrl] = useState('');
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [playing, setPlaying] = useState<string | null>(null);
  const [speechAvailable, setSpeechAvailable] = useState<boolean | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [memberEmail, setMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<MemberRole>('VIEWER');
  const [memberRoles, setMemberRoles] = useState<Record<string, MemberRole>>({});
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const canManage = workspace?.role === 'OWNER' || workspace?.role === 'ADMIN';
  const readOnly = !canManage || pending;

  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setWorkspace(null); setCurrentUserId(null);
    setMemberRoles({}); setRemoveMemberId(null); setMemberEmail(''); setNewMemberRole('VIEWER');
    void (async () => {
      try {
        const response = await fetch(`/api/workspaces/${encodeURIComponent(workspaceSlug)}`);
        const data = await response.json();
        if (!response.ok || !data.workspace) throw new Error(data.error || 'Unable to load workspace settings.');
        if (active) {
          const ws = data.workspace;
          setWorkspace(ws); setName(ws.name);
          setCurrentUserId(data.user?.id || null);
          setPrivacy(parse(ws.privacySettingsJson, {}));
          setTranslations(parse(ws.translationSettingsJson, {}));
          setAdvanced(parse(ws.advancedSettingsJson, {}));
          setRules(parse(ws.pronunciationRulesJson, []));
        }
      } catch (error) { if (active) setError(error instanceof Error ? error.message : 'Unable to load settings.'); }
      finally { if (active) setLoading(false); }
    })();
    void fetch('/api/me').then(async response => {
      if (!response.ok) return;
      const data = await response.json();
      if (active) {
        setPlatformAdmin(data.user?.role === 'Admin');
        setCurrentUserId(data.user?.id || null);
      }
    }).catch(() => {});
    return () => { active = false; audio.current?.pause(); };
  }, [workspaceSlug]);
  useEffect(() => { setMessage(''); }, [section]);
  useEffect(() => {
    if (section !== 'synthetic-voices') return;
    let active = true;
    setSpeechAvailable(null);
    void (async () => {
      try {
        const response = await fetch('/api/capabilities');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to check speech availability.');
        if (active) setSpeechAvailable(Boolean(data.speech));
      } catch (error) {
        if (active) { setSpeechAvailable(false); setError(error instanceof Error ? error.message : 'Unable to check speech availability.'); }
      }
    })();
    return () => { active = false; };
  }, [section]);

  async function save(patch: Record<string, unknown>) {
    if (!canManage) return;
    setPending(true); setError(''); setMessage('');
    try {
      const response = await fetch(`/api/workspaces/${encodeURIComponent(workspaceSlug)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
      const data = await response.json();
      if (!response.ok || !data.workspace) throw new Error(data.error || 'Your changes could not be saved.');
      setWorkspace(data.workspace);
      setMessage('Changes saved.');
      return true;
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to save settings.'); return false; }
    finally { setPending(false); }
  }
  function canEditMember(member: Member) {
    return canManage && Boolean(currentUserId) && member.user.id !== currentUserId &&
      member.role !== 'OWNER' && (workspace?.role === 'OWNER' || member.role !== 'ADMIN');
  }
  async function updateMembership(
    method: 'POST' | 'PATCH',
    input: { email: string; role: MemberRole } | { memberId: string; role: MemberRole } | { memberId: string; remove: true }
  ) {
    if (!canManage || pending) return;
    if ('role' in input && input.role === 'ADMIN' && workspace?.role !== 'OWNER') return;
    if ('memberId' in input) {
      const member = workspace?.members.find(item => item.id === input.memberId);
      if (!member || !canEditMember(member)) return;
    }
    setPending(true); setError(''); setMessage('');
    try {
      const response = await fetch(`/api/workspaces/${encodeURIComponent(workspaceSlug)}/members`, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to update workspace membership.');
      if ('remove' in input) {
        if (data.ok !== true) throw new Error('The member removal response was incomplete. Refresh before retrying.');
        setWorkspace(current => current ? { ...current, members: current.members.filter(member => member.id !== input.memberId) } : current);
        setRemoveMemberId(null);
        setMessage('Workspace access removed. Their account has not been deleted.');
      } else {
        const member = data.member as Member | undefined;
        if (!member?.id || !member.user?.id) throw new Error('The membership response was incomplete. Refresh before retrying.');
        setWorkspace(current => current ? {
          ...current, members: current.members.some(item => item.id === member.id)
            ? current.members.map(item => item.id === member.id ? member : item)
            : [...current.members, member],
        } : current);
        setMemberRoles(current => {
          const next = { ...current };
          delete next[member.id];
          return next;
        });
        if (method === 'POST') { setMemberEmail(''); setNewMemberRole('VIEWER'); }
        setMessage(method === 'POST' ? 'Member added to this workspace. No account invitation email was sent.' : 'Workspace role updated.');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to update workspace membership.');
    } finally { setPending(false); }
  }
  async function createBrand(event: React.FormEvent) {
    event.preventDefault();
    if (!canManage) return;
    setPending(true); setError(''); setMessage('');
    try {
      const response = await fetch(`/api/workspaces/${encodeURIComponent(workspaceSlug)}/brand-kits`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: brandUrl, workspaceSlug }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to create a brand kit.');
      if (!data.brandKit?.id) throw new Error('The brand kit response was incomplete.');
      setWorkspace(current => current ? { ...current, brandKits: [data.brandKit, ...current.brandKits] } : current);
      setBrandUrl(''); setMessage('Brand kit created. Open it to review the extracted details.');
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to create a brand kit.'); }
    finally { setPending(false); }
  }
  async function previewVoice(id: string, voiceName: string) {
    audio.current?.pause();
    setPlaying(id); setError('');
    try {
      const response = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workspaceSlug, voiceId: id, script: `Hello, I am ${voiceName}. Here is a preview of this voice for your product story.`, pronunciations: rules }) });
      const data = await response.json();
      if (!response.ok || !data.audioUrl) throw new Error(data.error || 'Voice preview is not available.');
      const player = new Audio(data.audioUrl);
      audio.current = player;
      player.onended = () => setPlaying(null);
      player.onerror = () => { setPlaying(null); setError('The generated preview could not be played.'); };
      await player.play();
    } catch (error) { setPlaying(null); setError(error instanceof Error ? error.message : 'Unable to preview this voice.'); }
  }
  function checkboxes(config: Config, update: (value: Config) => void, options: Array<[string, string]>) {
    return options.map(([key, label]) => <label key={key} className="flex items-center justify-between gap-6 border-b border-slate-200 py-4 text-sm"><span>{label}</span><input type="checkbox" disabled={readOnly} checked={Boolean(config[key])} onChange={event => update({ ...config, [key]: event.target.checked })} className="h-4 w-4 accent-orange-700" /></label>);
  }
  const saveButton = (patch: Record<string, unknown>) => <button type="button" disabled={readOnly} onClick={() => void save(patch)} className="btn-primary mt-6">{pending ? 'Saving…' : 'Save changes'}</button>;
  return <WorkspaceShell workspaceSlug={workspaceSlug}>
    <main className="page-wrap">
      <header className="mb-8"><p className="eyebrow">06 / Workspace settings</p><h1 className="page-title mt-3">Make it your own.</h1><p className="page-intro mt-4">The essentials behind your workspace, your brand, and your team.</p></header>
      <nav aria-label="Workspace settings" className="mb-8 flex flex-wrap gap-2 border-b border-slate-200 pb-5">{sections.map(([id, label]) => <Link key={id} href={`/workspaces/${workspaceSlug}/settings/${id}`} aria-current={section === id ? 'page' : undefined} className={section === id ? 'btn-primary' : 'btn-quiet'}>{label}</Link>)}</nav>
      {error && <p className="status-error mb-5" role="alert">{error}</p>}
      {message && <p className="status-success mb-5" role="status">{message}</p>}
      {loading ? <p role="status">Loading workspace settings…</p> : workspace && <section className="panel max-w-4xl">
        <h2 className="panel-heading">{sections.find(([id]) => id === section)?.[1] || 'Unknown settings section'}</h2>
        {!canManage && <p className="mt-3 text-sm text-slate-500">Read-only access. Workspace owners and administrators can change these settings.</p>}
        {section === 'general' && <form onSubmit={event => { event.preventDefault(); void save({ name: name.trim() }); }} className="mt-6 space-y-5"><label htmlFor="workspace-name" className="field-label block">Workspace name<input id="workspace-name" className="field mt-2 w-full" required maxLength={100} disabled={readOnly} value={name} onChange={event => setName(event.target.value)} /></label><label htmlFor="workspace-slug" className="field-label block">Workspace address<input id="workspace-slug" className="field mt-2 w-full font-mono" readOnly value={workspace.slug} /></label><button disabled={readOnly || !name.trim()} className="btn-primary">{pending ? 'Saving…' : 'Save workspace name'}</button></form>}
        {section === 'members' && <>
          <p className="mt-3 text-sm text-slate-500">Manage access to this workspace. Editors can create and edit projects; viewers have read-only access. Only the owner can appoint or change administrators.</p>
          <aside className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="font-semibold">Account invitation first. Workspace access second.</h3>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-600">
              <li>A platform administrator must invite the person to Arcade. They must accept the invitation and finish registering with a verified email.</li>
              <li>A workspace owner or administrator can then add that registered email below. This does not send an invitation or create a new account.</li>
            </ol>
            {platformAdmin ? <Link href="/admin/invitations" className="btn-secondary mt-5">Manage account invitations ↗</Link> : <p className="mt-4 text-sm text-slate-500">Need a new account? Ask your platform administrator to issue an invitation first.</p>}
          </aside>
          {canManage && <form onSubmit={event => {
            event.preventDefault();
            void updateMembership('POST', { email: memberEmail.trim(), role: newMemberRole });
          }} className="mt-7 grid items-end gap-4 md:grid-cols-[minmax(0,1fr)_auto_auto]">
            <label htmlFor="member-email" className="field-label">Registered account email
              <input id="member-email" type="email" autoComplete="off" required maxLength={254} disabled={pending} value={memberEmail} onChange={event => setMemberEmail(event.target.value)} className="field mt-2 w-full" />
            </label>
            <label htmlFor="new-member-role" className="field-label">Workspace role
              <select id="new-member-role" className="field mt-2 w-full" disabled={pending} value={newMemberRole} onChange={event => setNewMemberRole(event.target.value as MemberRole)}>
                <option value="VIEWER">Viewer</option><option value="EDITOR">Editor</option>{workspace.role === 'OWNER' && <option value="ADMIN">Administrator</option>}
              </select>
            </label>
            <button className="btn-primary mb-2" disabled={pending || !memberEmail.trim()}>{pending ? 'Updating…' : 'Add member'}</button>
          </form>}
          {pending && <p className="mt-4 text-sm text-slate-500" role="status">Updating workspace membership…</p>}
          <div className="mt-7 divide-y divide-slate-200" aria-busy={pending}>
            {(workspace.members || []).map(member => {
              const selectedRole = memberRoles[member.id] || member.role as MemberRole;
              return <article key={member.id} className="flex flex-wrap items-center justify-between gap-5 py-5">
                <div className="min-w-0">
                  <p className="break-words font-medium">{member.user.name || member.user.email || 'Member'}{member.user.id === currentUserId && <span className="ml-2 text-xs text-slate-500">(you)</span>}</p>
                  {member.user.email && <p className="mt-1 break-all text-sm text-slate-500">{member.user.email}</p>}
                </div>
                {canEditMember(member) ? <div className="flex flex-wrap items-center gap-3">
                  <label htmlFor={`role-${member.id}`} className="sr-only">Workspace role for {member.user.email || member.user.name || 'member'}</label>
                  <select id={`role-${member.id}`} className="field" disabled={pending} value={selectedRole} onChange={event => setMemberRoles(current => ({ ...current, [member.id]: event.target.value as MemberRole }))}>
                    <option value="VIEWER">Viewer</option><option value="EDITOR">Editor</option>{workspace.role === 'OWNER' && <option value="ADMIN">Administrator</option>}
                  </select>
                  <button type="button" className="btn-secondary" disabled={pending || selectedRole === member.role} onClick={() => void updateMembership('PATCH', { memberId: member.id, role: selectedRole })}>Save role</button>
                  {removeMemberId === member.id ? <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm">Remove workspace access?</span>
                    <button type="button" className="btn-secondary" disabled={pending} onClick={() => void updateMembership('PATCH', { memberId: member.id, remove: true })}>Confirm removal</button>
                    <button type="button" className="btn-quiet" disabled={pending} onClick={() => setRemoveMemberId(null)}>Cancel</button>
                  </div> : <button type="button" className="btn-quiet" disabled={pending} onClick={() => setRemoveMemberId(member.id)}>Remove</button>}
                </div> : <span className="tag">{member.role}</span>}
              </article>;
            })}
          </div>
          {!workspace.members?.length && <p className="empty-state mt-5">No members returned for this workspace.</p>}
          {canManage && <p className="mt-5 text-sm text-slate-500">Your own membership and the workspace owner cannot be changed here. Removing someone revokes workspace and team access, not their Arcade account.</p>}
        </>}
        {section === 'brand-kits' && <><p className="mt-3 text-sm text-slate-500">Review your colors, typography, and product direction before using them in a project.</p>{canManage && <form onSubmit={createBrand} className="mt-6 flex flex-wrap items-end gap-3"><label htmlFor="brand-url" className="field-label flex-1">Brand website<input id="brand-url" type="url" required value={brandUrl} onChange={event => setBrandUrl(event.target.value)} placeholder="https://your-company.com" className="field mt-2 w-full" disabled={pending} /></label><button className="btn-primary" disabled={pending}>{pending ? 'Extracting brand…' : 'Create brand kit'}</button></form>}<div className="mt-6 divide-y divide-slate-200">{(workspace.brandKits || []).map(kit => <Link key={kit.id} href={`/workspaces/${workspaceSlug}/settings/brand-kits/${kit.id}`} className="flex flex-wrap justify-between gap-3 py-5"><div><p className="font-semibold">{kit.name}</p><p className="mt-1 text-sm text-slate-500">{kit.sourceUrl}</p></div><span className="tag">{kit.status} ↗</span></Link>)}</div>{!workspace.brandKits?.length && <p className="empty-state mt-5">No brand kits yet. Add your website to create one.</p>}</>}
        {section === 'billing' && <><p className="mt-4 text-sm text-slate-500">Recorded plan</p><p className="mt-2 text-3xl font-semibold">{workspace.planTier}</p><dl className="mt-6 grid gap-4 sm:grid-cols-3">{[['Monthly quota', workspace.monthlyCreditsQuota], ['Bonus balance', workspace.bonusCreditsBalance], ['Used this cycle', workspace.usedCreditsThisCycle]].map(([label, value]) => <div key={label}><dt className="text-sm text-slate-500">{label}</dt><dd className="stat-number mt-2">{value}</dd></div>)}</dl><p className="mt-6 text-sm text-slate-500">Online checkout, credit purchases, and plan changes are not available. These balances are not a payment confirmation.</p><Link href={`/workspaces/${workspaceSlug}/usage`} className="btn-secondary mt-5">View usage ledger →</Link></>}
        {section === 'security' && <div className="mt-5 space-y-5"><p>Account registration is invitation-only. Workspace settings cannot change platform admission rules.</p><div className="empty-state"><h3 className="font-semibold">SSO and directory sync are not available</h3><p className="mt-2 text-sm">SAML, SCIM, and identity provider provisioning are not connected. No security policy is activated by this page.</p></div><Link href="/forgot-password" className="btn-secondary">Password recovery</Link></div>}
        {section === 'privacy' && <>
          <p className="mt-3 text-sm text-slate-500">Control viewer event collection and save workspace preferences. These are not a compliance certification. Review each project before sharing; data residency is not configured here.</p>
          <label className="mt-5 flex items-center justify-between gap-6 border-b border-slate-200 py-4 text-sm"><span>Collect viewer analytics on published walkthroughs</span><input type="checkbox" disabled={readOnly} checked={privacy.collectViewerAnalytics !== false} onChange={event => setPrivacy({ ...privacy, collectViewerAnalytics: event.target.checked })} className="h-4 w-4 accent-orange-700" /></label>
          <label htmlFor="analytics-retention" className="field-label mt-6 block">Analytics retention · days
            <input id="analytics-retention" type="number" min={1} max={730} step={1} disabled={readOnly} value={privacy.retentionDays ?? 365} onChange={event => setPrivacy({ ...privacy, retentionDays: event.target.value === '' ? '' : Number(event.target.value) })} aria-describedby="retention-note" className="field mt-2 w-full sm:max-w-48" />
          </label>
          <p id="retention-note" className="mt-2 text-sm text-slate-500">Choose 1–730 days. Retention is applied when the deployment operator runs the analytics maintenance command. Scheduling is managed outside this page; saving a preference does not run cleanup immediately.</p>
          <div>{checkboxes(privacy, setPrivacy, [['anonymizeViewerIp', 'Prefer anonymized viewer IP addresses'], ['autoRedactEmailsInDom', 'Prefer email redaction during capture'], ['cookielessAnalytics', 'Prefer cookie-less viewer analytics'], ['allowSearchEngineIndexing', 'Allow indexing of public share pages']])}</div>
          <button type="button" disabled={readOnly || !Number.isInteger(privacy.retentionDays ?? 365) || (privacy.retentionDays ?? 365) < 1 || (privacy.retentionDays ?? 365) > 730} onClick={() => void save({ privacySettings: { ...privacy, retentionDays: privacy.retentionDays ?? 365 } })} className="btn-primary mt-6">{pending ? 'Saving…' : 'Save privacy preferences'}</button>
        </>}
        {section === 'integrations' && <div className="empty-state mt-6"><h3 className="font-semibold">No live integrations available</h3><p className="mt-2 text-sm">CRM synchronization, Slack delivery, and third-party connectors are not configured. Leads remain in your workspace; saving a preference does not connect an account.</p><Link href={`/workspaces/${workspaceSlug}/leads`} className="btn-secondary mt-5">View captured leads</Link></div>}
        {section === 'translations' && <><p className="mt-3 text-sm text-slate-500">Choose your workspace language preferences. Translation and audio generation require a configured provider and an explicit project action.</p><label htmlFor="default-locale" className="field-label mt-6 block">Default language<select id="default-locale" disabled={readOnly} className="field mt-2 w-full" value={translations.defaultLocale || ''} onChange={event => setTranslations({ ...translations, defaultLocale: event.target.value })}><option value="">Not set</option>{TRANSLATION_LOCALES.map(locale => <option key={locale.code} value={locale.code}>{locale.name}</option>)}</select></label>{checkboxes(translations, setTranslations, [['autoDetectBrowserLocale', 'Prefer the viewer’s browser language'], ['translateVoiceoverAudio', 'Include voiceover in translation requests']])}<fieldset disabled={readOnly} className="mt-6"><legend className="field-label mb-4">Enabled languages</legend><div className="grid gap-3 sm:grid-cols-3">{TRANSLATION_LOCALES.map(locale => <label key={locale.code} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={(translations.enabledLocales || []).includes(locale.code)} onChange={event => setTranslations({ ...translations, enabledLocales: event.target.checked ? [...(translations.enabledLocales || []), locale.code] : (translations.enabledLocales || []).filter((code: string) => code !== locale.code) })} />{locale.name}</label>)}</div></fieldset>{saveButton({ translationSettings: translations })}</>}
        {section === 'pronunciation' && <><p className="mt-3 text-sm text-slate-500">Tell voice generation how to say your product names and abbreviations.</p>{canManage && <form onSubmit={async event => { event.preventDefault(); const next = [...rules, { id: crypto.randomUUID(), word: word.trim(), replacement: replacement.trim() }]; if (await save({ pronunciationRules: next })) { setRules(next); setWord(''); setReplacement(''); } }} className="mt-6 grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]"><label htmlFor="word" className="field-label">Word<input id="word" required value={word} onChange={event => setWord(event.target.value)} className="field mt-2 w-full" disabled={pending} /></label><label htmlFor="replacement" className="field-label">Spoken as<input id="replacement" required value={replacement} onChange={event => setReplacement(event.target.value)} className="field mt-2 w-full" disabled={pending} /></label><button className="btn-primary" disabled={pending || !word.trim() || !replacement.trim()}>{pending ? 'Saving…' : 'Add rule'}</button></form>}<div className="mt-6 divide-y divide-slate-200">{rules.map(rule => <div key={rule.id} className="flex items-center justify-between gap-4 py-4"><p><span className="font-mono">{rule.word}</span><span className="mx-3 text-slate-400">→</span>{rule.replacement}</p>{canManage && <button className="btn-quiet" disabled={pending} aria-label={`Remove pronunciation for ${rule.word}`} onClick={async () => { const next = rules.filter(item => item.id !== rule.id); if (await save({ pronunciationRules: next })) setRules(next); }}>Remove</button>}</div>)}</div>{!rules.length && <p className="empty-state mt-5">No pronunciation rules yet.</p>}</>}
        {section === 'synthetic-voices' && <><p className="mt-3 text-sm text-slate-500">Voice presets require a configured speech provider. Preview generation may consume credits.</p>{speechAvailable === null ? <p className="mt-4 text-sm" role="status">Checking speech availability…</p> : !speechAvailable && <p className="empty-state mt-5">Speech previews are unavailable in this deployment. Ask your administrator to configure a speech provider.</p>}<div className="mt-6 divide-y divide-slate-200">{ELEVENLABS_VOICES.map(voice => <div key={voice.id} className="flex items-center justify-between gap-4 py-4"><div><p className="font-medium">{voice.name}</p><p className="text-sm text-slate-500">{voice.style}</p></div><button className="btn-secondary" disabled={readOnly || playing !== null || !speechAvailable} onClick={() => void previewVoice(voice.id, voice.name)}>{playing === voice.id ? 'Previewing…' : 'Preview'}</button></div>)}</div>{playing && <button className="btn-quiet mt-4" onClick={() => { audio.current?.pause(); setPlaying(null); }}>Stop playback</button>}</>}
        {section === 'advanced' && <><p className="mt-3 text-sm text-slate-500">Choose export settings within each project. Workspace-level export defaults, custom domains, and outbound webhooks are not currently supported.</p><div className="empty-state mt-6"><h3 className="font-semibold">Workspace export defaults are unavailable.</h3><p className="mt-2 text-sm">Available render formats depend on the project and configured engine. No deployment setting is activated here.</p></div>{(advanced.defaultExportResolution || advanced.defaultExportFps) && <dl className="mt-6 grid gap-5 sm:grid-cols-2"><div><dt className="text-sm text-slate-500">Previously recorded resolution</dt><dd className="mt-2 font-mono">{advanced.defaultExportResolution || 'Not set'}</dd></div><div><dt className="text-sm text-slate-500">Previously recorded frame rate</dt><dd className="mt-2 font-mono">{advanced.defaultExportFps || 'Not set'}</dd></div></dl>}</>}
        {!sections.some(([id]) => id === section) && <p className="empty-state mt-5">Choose a settings section above.</p>}
      </section>}
    </main>
  </WorkspaceShell>;
}
