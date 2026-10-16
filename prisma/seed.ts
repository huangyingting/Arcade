import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes, scrypt as nodeScrypt } from 'node:crypto';

const prisma = new PrismaClient();

function hashOpaqueToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('base64url');
}

async function hashScryptPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash: Buffer = await new Promise((resolve, reject) => {
    nodeScrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
  return ['scrypt', '16384', '8', '1', salt.toString('base64url'), hash.toString('base64url')].join('$');
}

async function main() {
  console.log('Seeding Arcade SQLite/Postgres database with whoami.genisisiq.com assets & ReadWise Invite-Only Admission...');

  const defaultPasswordHash = await hashScryptPassword('arcade-demo-2026');

  // 1. User: jack wolf (Admin)
  const user = await prisma.user.upsert({
    where: { email: 'wlfjck@gmail.com' },
    update: {
      name: 'jack wolf',
      role: 'Admin',
      passwordHash: defaultPasswordHash,
      emailVerified: new Date(),
    },
    create: {
      id: 'u_jack_wolf',
      email: 'wlfjck@gmail.com',
      name: 'jack wolf',
      role: 'Admin',
      emailVerified: new Date(),
      passwordHash: defaultPasswordHash,
      onboardingRole: 'AI-Enabled Cloud Solutions Architect',
      onboardingGoalsJson: JSON.stringify(['Interactive Demos', 'AI Videos', 'AI Visuals']),
    },
  });

  await prisma.passwordCredential.upsert({
    where: { userId: user.id },
    update: { passwordHash: defaultPasswordHash },
    create: {
      userId: user.id,
      passwordHash: defaultPasswordHash,
    },
  });

  // Seed ReadWise-style Account Invitations (1 Accepted for wlfjck@gmail.com, 1 Pending for invited@genisisiq.com with token "demo-invite-token-2026")
  await prisma.accountEmailOutbox.deleteMany({});
  await prisma.accountInvitation.deleteMany({});
  await prisma.accountInvitation.createMany({
    data: [
      {
        id: 'inv_accepted_jack',
        email: 'wlfjck@gmail.com',
        normalizedEmail: 'wlfjck@gmail.com',
        activeForEmail: null,
        tokenHash: null,
        status: 'ACCEPTED',
        invitedById: user.id,
        acceptedById: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        acceptedAt: new Date(),
      },
      {
        id: 'inv_pending_demo',
        email: 'invited@genisisiq.com',
        normalizedEmail: 'invited@genisisiq.com',
        activeForEmail: 'invited@genisisiq.com',
        tokenHash: hashOpaqueToken('demo-invite-token-2026'),
        status: 'PENDING',
        invitedById: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // 2. Workspace: workspace-5p8xcsfv
  const workspace = await prisma.workspace.upsert({
    where: { slug: 'workspace-5p8xcsfv' },
    update: {},
    create: {
      id: 'fBtA4gu4pOa2JSDRyFh0',
      name: "jack wolf's workspace",
      slug: 'workspace-5p8xcsfv',
      planTier: 'FREE',
      billingInterval: 'annual',
      monthlyCreditsQuota: 200,
      bonusCreditsBalance: 200,
      usedCreditsThisCycle: 100,
      onboardingChecklistJson: JSON.stringify({
        brandKit: true,
        video: true,
        demo: true,
        visuals: true,
        share: true,
        claimedBonus: true,
      }),
      pronunciationRulesJson: JSON.stringify([
        { id: 'pr1', word: 'SC-100', replacement: 'S C One Hundred' },
        { id: 'pr2', word: 'genisisiq', replacement: 'Genesis I Q' },
        { id: 'pr3', word: 'AZ-305', replacement: 'A Z Three Oh Five' },
      ]),
    },
  });

  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      userId: user.id,
      role: 'OWNER',
    },
  });

  // 3. Personal Team: "me"
  const team = await prisma.team.upsert({
    where: {
      workspaceId_slug: {
        workspaceId: workspace.id,
        slug: 'me',
      },
    },
    update: {},
    create: {
      id: 'IRCpFYa92u1D4JNMQTaJ',
      workspaceId: workspace.id,
      name: 'Just me',
      slug: 'me',
      iconColor: '#4F46E5',
      isPersonal: true,
    },
  });

  await prisma.teamMember.upsert({
    where: {
      teamId_userId: {
        teamId: team.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      teamId: team.id,
      userId: user.id,
      role: 'ADMIN',
    },
  });

  // 4. Brand Kit: whoami.genisisiq.com (ID: XE1uVIkZSLQJth6oUMJ0) with all 13 sections
  const brandKit = await prisma.brandKit.upsert({
    where: { id: 'XE1uVIkZSLQJth6oUMJ0' },
    update: {},
    create: {
      id: 'XE1uVIkZSLQJth6oUMJ0',
      workspaceId: workspace.id,
      name: 'whoami.genisisiq.com',
      sourceUrl: 'https://whoami.genisisiq.com',
      isDefault: true,
      status: 'READY',
      sourcesJson: JSON.stringify([
        {
          id: 'src_1',
          url: 'https://whoami.genisisiq.com',
          type: 'Website',
          status: 'Synced',
          lastSyncedAt: '2026-10-15T08:00:00Z',
          pagesIndexed: 6,
        },
      ]),
      logosJson: JSON.stringify({
        lightLogoUrl: '/media/scene1.png',
        darkLogoUrl: '/media/scene1.png',
        iconText: 'W',
        brandMonogram: 'YI-TING HUANG',
      }),
      colorsJson: JSON.stringify([
        { id: 'c1', role: 'Primary Accent', name: 'Bauhaus Gold', hex: '#D4AF37' },
        { id: 'c2', role: 'Background Primary', name: 'Obsidian Ink', hex: '#111111' },
        { id: 'c3', role: 'Background Secondary', name: 'Warm Bauhaus Ivory', hex: '#F4EFE6' },
        { id: 'c4', role: 'Accent Secondary', name: 'Bauhaus Crimson', hex: '#C42B1C' },
        { id: 'c5', role: 'Accent Tertiary', name: 'Bauhaus Cobalt Blue', hex: '#0047AB' },
        { id: 'c6', role: 'Text Secondary', name: 'Architectural Slate', hex: '#9CA3AF' },
      ]),
      fontsJson: JSON.stringify({
        headingFont: 'Inter',
        headingWeight: '700 (Bold)',
        bodyFont: 'Inter',
        bodyWeight: '400 (Regular)',
        monoFont: 'JetBrains Mono',
      }),
      photographyJson: JSON.stringify([
        { id: 'ph1', title: 'Portfolio Hero & Bauhaus Palette', url: '/media/scene1.png' },
        { id: 'ph2', title: '120+ Verified AI & Cloud Badges', url: '/media/scene2.png' },
        { id: 'ph3', title: '2,300+ Indexed AI Use Cases Explorer', url: '/media/scene3.png' },
        { id: 'ph4', title: 'SC-100 & AZ-305 Credential Verification', url: '/media/scene4.png' },
      ]),
      backgroundsJson: JSON.stringify([
        { id: 'bg1', name: 'Bauhaus Obsidian Grid', style: 'linear-gradient(135deg, #111111 0%, #1F2937 100%)', hex: '#111111' },
        { id: 'bg2', name: 'Warm Ivory Paper', style: 'linear-gradient(135deg, #F4EFE6 0%, #E5DEC9 100%)', hex: '#F4EFE6' },
        { id: 'bg3', name: 'Gold & Cobalt Geometric', style: 'linear-gradient(135deg, #0047AB 0%, #111111 65%, #D4AF37 100%)', hex: '#0047AB' },
        { id: 'bg4', name: 'Crimson Studio Spotlight', style: 'linear-gradient(135deg, #111111 0%, #C42B1C 100%)', hex: '#C42B1C' },
        { id: 'bg5', name: 'Midnight Gold Horizon', style: 'linear-gradient(135deg, #0D0E12 0%, #D4AF37 100%)', hex: '#D4AF37' },
      ]),
      illustrationsJson: JSON.stringify([
        { id: 'il1', name: 'Bauhaus Geometric Circle & Cross', style: 'Bauhaus Vector' },
        { id: 'il2', name: 'Cloud Architecture Nodes', style: 'Isometric Blueprint' },
        { id: 'il3', name: 'Credential Verification Shield', style: 'Line Art Gold' },
      ]),
      productJson: JSON.stringify({
        productName: 'whoami.genisisiq.com — Yi-Ting Huang Portfolio',
        tagline: 'Doers, not talkers.',
        description:
          'Interactive executive & engineering portfolio for Yi-Ting Huang — AI-Enabled Cloud Solutions Architect backed by 120+ verified Credly badges, 2,300+ indexed enterprise AI use cases, and live SC-100 / AZ-305 credential verification.',
        icp: [
          {
            id: 'icp1',
            role: 'VP of Cloud & AI Engineering',
            painPoint: 'Needs architects who build production GenAI & cloud security systems rather than slide decks.',
          },
          {
            id: 'icp2',
            role: 'Enterprise CTO / Hiring Executive',
            painPoint: 'Wants instant, verifiable proof of 120+ cloud/AI certifications and shipped architectures.',
          },
          {
            id: 'icp3',
            role: 'Technical Program & Solutions Leaders',
            painPoint: 'Searches across 2,300+ real-world AI use cases and cloud patterns.',
          },
        ],
        keyMessaging: [
          { id: 'km1', title: 'Doers, Not Talkers', body: 'Production-tested AI and multi-cloud architectures with live demos.' },
          { id: 'km2', title: '120+ Verified Badges', body: 'Every certification from Microsoft SC-100 & AZ-305 to GenAI is 1-click verifiable on Credly.' },
          { id: 'km3', title: '2,300+ AI Use Cases Indexed', body: 'Searchable intelligence catalog spanning enterprise GenAI, security, and cloud scale.' },
        ],
      }),
      voiceJson: JSON.stringify({
        summary: 'Direct, architectural, evidence-driven, and high-craft with zero fluff.',
        traits: ['Authoritative', 'Concise', 'Builder-First', 'Bauhaus Precision'],
        dos: [
          'Lead with quantifiable proof (120+ verified badges, 2,300+ AI use cases).',
          'Use active, execution-focused verbs ("Verify SC-100", "Explore AI Use Cases").',
          'Keep copy crisp like an Apple / Bauhaus design specification.',
        ],
        donts: [
          'Never use vague buzzwords without a verifiable metric or link.',
          'Avoid long walls of text; distill insights into structured visual cards.',
        ],
      }),
      tonesJson: JSON.stringify([
        { id: 't1', name: 'Product Launch Film', description: 'Bold, high-contrast kinetic statements with rhythmic pacing.' },
        { id: 't2', name: 'Interactive Demo Walkthrough', description: 'Clear, action-oriented tooltips guiding viewers to click and verify.' },
        { id: 't3', name: 'Social Announcement', description: 'Punchy metric-led headlines optimized for LinkedIn and X.' },
        { id: 't4', name: 'Executive Briefing', description: 'Architectural clarity focused on security (SC-100) and scale.' },
      ]),
      demoSettingsJson: JSON.stringify({
        hotspotColor: '#D4AF37',
        hotspotStyle: 'beacon',
        calloutTheme: 'dark',
        wrapperStyle: 'browser_dark',
        showProgressBar: true,
      }),
      sharePageJson: JSON.stringify({
        showBrandLogo: true,
        primaryCtaLabel: 'Verify Credentials ↗',
        primaryCtaUrl: 'https://whoami.genisisiq.com',
        backgroundTheme: 'obsidian_gold',
      }),
      customElementsJson: JSON.stringify([
        { id: 'ce1', name: 'SC-100 Verified Corner Badge', type: 'Badge', position: 'bottom-right' },
        { id: 'ce2', name: 'whoami.genisisiq.com Lower Third', type: 'Overlay', position: 'bottom-left' },
      ]),
    },
  });

  // 5. Interactive Demo (Flow ID: 4fLyMFzH8BjqgKQF4Bd6, shareId: 319HqogqYEOZH11srxTM)
  const flowSteps = [
    {
      id: 'step_cover',
      order: 0,
      type: 'CHAPTER',
      title: 'Welcome to whoami.genisisiq.com',
      mediaUrl: '/media/scene1.png',
      mediaWidth: 1440,
      mediaHeight: 900,
      hotspots: [],
      callouts: [],
      areas: [],
      panAndZoom: { enabled: false, x: 0.1, y: 0.1, width: 0.8, height: 0.8, scale: 1.0 },
      voiceover: {
        enabled: true,
        script: 'Welcome to whoami.genisisiq.com — the interactive AI and Cloud Architecture portfolio of Yi-Ting Huang.',
        voiceId: 'ava-natural',
        speed: 1.0,
        audioUrl: '/media/voiceover-sample.wav',
        durationSec: 5,
      },
      chapter: {
        title: 'Doers, not talkers.',
        subtitle: 'Explore 120+ verified AI & Cloud certifications and 2,300+ indexed AI use cases in 60 seconds.',
        alignment: 'center',
        backgroundStyle: 'blur_step',
        backgroundValue: '#111111',
        showLogo: true,
        interactionMode: 'buttons',
        buttons: [
          { id: 'btn_start', label: 'Start Interactive Tour →', variant: 'primary', action: 'next_step' },
          { id: 'btn_site', label: 'Visit Live Site ↗', variant: 'secondary', action: 'external_url', targetUrl: 'https://whoami.genisisiq.com' },
        ],
        formFields: [
          { id: 'ff1', key: 'email', label: 'Work Email', placeholder: 'you@company.com', required: true },
          { id: 'ff2', key: 'fullName', label: 'Full Name', placeholder: 'Alex Rivera', required: false },
          { id: 'ff3', key: 'company', label: 'Company', placeholder: 'Acme Cloud', required: false },
        ],
        formSubmitLabel: 'Unlock Full Architecture Demo',
        allowSkipForm: true,
      },
    },
    {
      id: 'step_1',
      order: 1,
      type: 'IMAGE',
      title: 'Switch Bauhaus Multi-Palette Themes',
      mediaUrl: '/media/scene1.png',
      mediaWidth: 1440,
      mediaHeight: 900,
      hotspots: [
        {
          id: 'hs_1',
          x: 0.72,
          y: 0.28,
          style: 'beacon',
          color: '#D4AF37',
          tooltipText: 'Click here to switch between Bauhaus Gold, Cobalt, and Ivory palettes ({{company_name}} preview)',
          tooltipPosition: 'bottom',
          trigger: 'click',
          targetType: 'next_step',
        },
      ],
      callouts: [
        {
          id: 'co_1',
          x: 0.24,
          y: 0.72,
          title: '1. Dynamic Multi-Palette UI',
          body: 'Distills executive credentials into concise visual cards with dynamic animations and multi-palette theme support.',
          theme: 'dark',
          pointerDirection: 'top',
          showNavButtons: true,
          primaryButtonLabel: 'Next: Verify 120+ Badges',
        },
      ],
      areas: [
        {
          id: 'ar_1',
          mode: 'highlight',
          x: 0.08,
          y: 0.12,
          width: 0.84,
          height: 0.76,
          intensity: 0.35,
        },
      ],
      panAndZoom: { enabled: true, x: 0.15, y: 0.15, width: 0.7, height: 0.7, scale: 1.35 },
      voiceover: {
        enabled: true,
        script: 'First, explore the Bauhaus multi-palette hero cards designed for instant executive clarity.',
        voiceId: 'ava-natural',
        speed: 1.0,
        audioUrl: '/media/voiceover-sample.wav',
        durationSec: 4,
      },
    },
    {
      id: 'step_2',
      order: 2,
      type: 'IMAGE',
      title: 'Verify 120+ Cloud & AI Badges (SC-100 / AZ-305)',
      mediaUrl: '/media/scene2.png',
      mediaWidth: 1440,
      mediaHeight: 900,
      hotspots: [
        {
          id: 'hs_2',
          x: 0.52,
          y: 0.54,
          style: 'beacon',
          color: '#C42B1C',
          tooltipText: 'Click to verify Microsoft SC-100 Cybersecurity Architect & 120+ Credly badges',
          tooltipPosition: 'top',
          trigger: 'click',
          targetType: 'next_step',
        },
      ],
      callouts: [
        {
          id: 'co_2',
          x: 0.22,
          y: 0.22,
          title: '2. 120+ Live Credly Certifications',
          body: 'Every badge links directly to cryptographic verification on Credly and Microsoft Learn.',
          theme: 'brand',
          pointerDirection: 'right',
          showNavButtons: true,
          primaryButtonLabel: 'Next: 2,300+ AI Use Cases',
        },
      ],
      areas: [],
      panAndZoom: { enabled: true, x: 0.2, y: 0.2, width: 0.65, height: 0.65, scale: 1.4 },
      voiceover: {
        enabled: true,
        script: 'Click any of the 120 plus verified badges including Microsoft S C One Hundred to inspect live credentials.',
        voiceId: 'ava-natural',
        speed: 1.0,
        audioUrl: '/media/voiceover-sample.wav',
        durationSec: 5,
      },
    },
    {
      id: 'step_3',
      order: 3,
      type: 'IMAGE',
      title: 'Search 2,300+ Indexed AI Use Cases',
      mediaUrl: '/media/scene3.png',
      mediaWidth: 1440,
      mediaHeight: 900,
      hotspots: [
        {
          id: 'hs_3',
          x: 0.64,
          y: 0.46,
          style: 'beacon',
          color: '#0047AB',
          tooltipText: 'Filter 2,300+ enterprise AI use cases by industry, cloud provider, and architecture pattern',
          tooltipPosition: 'left',
          trigger: 'click',
          targetType: 'next_step',
        },
      ],
      callouts: [],
      areas: [
        {
          id: 'ar_blur_1',
          mode: 'blur',
          x: 0.82,
          y: 0.04,
          width: 0.14,
          height: 0.06,
          intensity: 10,
        },
      ],
      panAndZoom: { enabled: false, x: 0.1, y: 0.1, width: 0.8, height: 0.8, scale: 1.0 },
      voiceover: {
        enabled: true,
        script: 'Browse over 2,300 indexed AI use cases ready for enterprise deployment.',
        voiceId: 'ava-natural',
        speed: 1.0,
        audioUrl: '/media/voiceover-sample.wav',
        durationSec: 4,
      },
    },
    {
      id: 'step_lead_chapter',
      order: 4,
      type: 'CHAPTER',
      title: 'Connect with Yi-Ting Huang',
      mediaUrl: '/media/scene6.png',
      mediaWidth: 1440,
      mediaHeight: 900,
      hotspots: [],
      callouts: [],
      areas: [],
      panAndZoom: { enabled: false, x: 0.1, y: 0.1, width: 0.8, height: 0.8, scale: 1.0 },
      voiceover: {
        enabled: false,
        script: '',
        voiceId: 'ava-natural',
        speed: 1.0,
      },
      chapter: {
        title: 'Ready to build AI-enabled cloud solutions?',
        subtitle: 'Request the full architecture blueprint or jump straight to whoami.genisisiq.com.',
        alignment: 'center',
        backgroundStyle: 'gradient',
        backgroundValue: 'linear-gradient(135deg, #111111 0%, #0047AB 100%)',
        showLogo: true,
        interactionMode: 'form',
        buttons: [
          { id: 'btn_replay', label: 'Replay Interactive Demo', variant: 'secondary', action: 'replay' },
          { id: 'btn_open', label: 'Open whoami.genisisiq.com ↗', variant: 'primary', action: 'external_url', targetUrl: 'https://whoami.genisisiq.com' },
        ],
        formFields: [
          { id: 'f_email', key: 'email', label: 'Work Email', placeholder: 'architect@enterprise.io', required: true },
          { id: 'f_name', key: 'fullName', label: 'Your Name', placeholder: 'Jordan Lee', required: false },
          { id: 'f_comp', key: 'company', label: 'Company', placeholder: 'Contoso AI', required: false },
        ],
        formSubmitLabel: 'Get Architecture Blueprint →',
        allowSkipForm: true,
      },
    },
  ];

  await prisma.flow.upsert({
    where: { id: '4fLyMFzH8BjqgKQF4Bd6' },
    update: {
      stepsJson: JSON.stringify(flowSteps),
    },
    create: {
      id: '4fLyMFzH8BjqgKQF4Bd6',
      shareId: '319HqogqYEOZH11srxTM',
      workspaceId: workspace.id,
      teamId: team.id,
      brandKitId: brandKit.id,
      createdById: user.id,
      name: 'whoami.genisisiq.com Interactive Tour',
      description: 'Interactive walkthrough of Yi-Ting Huang portfolio: Bauhaus themes, 120+ verified badges, and 2,300+ AI use cases.',
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      aspectRatio: '16:9',
      thumbnailUrl: '/media/scene1.png',
      stepsJson: JSON.stringify(flowSteps),
      designJson: JSON.stringify({
        wrapperStyle: 'browser_dark',
        backgroundType: 'gradient',
        backgroundColor: '#111111',
        padding: 32,
        borderRadius: 16,
        shadow: 'xl',
        cursorStyle: 'pointer_ring',
        showProgressBar: true,
        showWatermark: true,
        watermarkText: 'whoami.genisisiq.com',
        primaryColor: '#D4AF37',
      }),
      variablesJson: JSON.stringify([
        { key: 'first_name', label: 'Viewer First Name', fallbackValue: 'Builder' },
        { key: 'company_name', label: 'Target Company', fallbackValue: 'Enterprise Cloud' },
        { key: 'role', label: 'Viewer Role', fallbackValue: 'Cloud Architect' },
      ]),
      translationsJson: JSON.stringify({
        es: { name: 'Recorrido Interactivo de whoami.genisisiq.com', localeLabel: 'Spanish (Español)', status: 'Synced' },
        fr: { name: 'Visite Interactive whoami.genisisiq.com', localeLabel: 'French (Français)', status: 'Synced' },
        de: { name: 'Interaktive Tour whoami.genisisiq.com', localeLabel: 'German (Deutsch)', status: 'Synced' },
        ja: { name: 'whoami.genisisiq.com インタラクティブツアー', localeLabel: 'Japanese (日本語)', status: 'Synced' },
      }),
      menuJson: JSON.stringify({
        enabled: true,
        title: 'Tour Chapters',
        items: [
          { stepId: 'step_cover', label: '1. Welcome & Overview' },
          { stepId: 'step_1', label: '2. Bauhaus Multi-Palette UI' },
          { stepId: 'step_2', label: '3. Verify 120+ Credly Badges' },
          { stepId: 'step_3', label: '4. 2,300+ Indexed AI Use Cases' },
          { stepId: 'step_lead_chapter', label: '5. Request Blueprint' },
        ],
      }),
      tagsJson: JSON.stringify(['Portfolio', 'AI Architecture', 'Launch']),
      viewsCount: 148,
      completionsCount: 112,
    },
  });

  // 6. AI Launch Video 1: qGe4L499rr5AsLtm6F4q ("whoami.genisisiq.com Launch", 30s, 6 scenes)
  const video1Scenes = [
    {
      sceneId: 'scene_1',
      sceneNumber: 1,
      title: 'Scene 1: Hero Hook',
      archetype: 'HERO_SPLIT',
      durationSec: 5,
      screenshotUrl: '/media/scene1.png',
    },
    {
      sceneId: 'scene_2',
      sceneNumber: 2,
      title: 'Scene 2: 120+ Verified Badges',
      archetype: 'METRIC_BENTO',
      durationSec: 5,
      screenshotUrl: '/media/scene2.png',
    },
    {
      sceneId: 'scene_3',
      sceneNumber: 3,
      title: 'Scene 3: 2,300+ AI Use Cases',
      archetype: 'BROWSER_SPOTLIGHT',
      durationSec: 5,
      screenshotUrl: '/media/scene3.png',
    },
    {
      sceneId: 'scene_4',
      sceneNumber: 4,
      title: 'Scene 4: Core Architecture Pillars',
      archetype: 'FEATURE_CARDS',
      durationSec: 5,
      screenshotUrl: '/media/scene4.png',
    },
    {
      sceneId: 'scene_5',
      sceneNumber: 5,
      title: 'Scene 5: Bauhaus Design Manifesto',
      archetype: 'KINETIC_STATEMENT',
      durationSec: 5,
      screenshotUrl: '/media/scene5.png',
    },
    {
      sceneId: 'scene_6',
      sceneNumber: 6,
      title: 'Scene 6: Call to Action End Card',
      archetype: 'END_CARD_CTA',
      durationSec: 5,
      screenshotUrl: '/media/scene6.png',
    },
  ];

  const video1DesignSchema = {
    colors: [
      { key: 'BackgroundPrimary', label: 'Background Primary', defaultHex: '#111111' },
      { key: 'BackgroundSecondary', label: 'Background Secondary', defaultHex: '#F4EFE6' },
      { key: 'TextPrimary', label: 'Text Primary', defaultHex: '#F4EFE6' },
      { key: 'TextSecondary', label: 'Text Secondary', defaultHex: '#9CA3AF' },
      { key: 'AccentPrimary', label: 'Accent Primary (Gold)', defaultHex: '#D4AF37' },
      { key: 'AccentSecondary', label: 'Accent Secondary (Crimson)', defaultHex: '#C42B1C' },
    ],
    scenes: [
      {
        sceneId: 'scene_1',
        sceneNumber: 1,
        title: 'Scene 1 Text',
        archetype: 'HERO_SPLIT',
        fields: [
          { key: 'BadgeText', label: 'Top Badge', type: 'text' },
          { key: 'TitleText', label: 'Headline', type: 'text' },
          { key: 'SubtitleText', label: 'Subtitle', type: 'textarea' },
        ],
      },
      {
        sceneId: 'scene_2',
        sceneNumber: 2,
        title: 'Scene 2 Text',
        archetype: 'METRIC_BENTO',
        fields: [
          { key: 'SectionTitle', label: 'Section Title', type: 'text' },
          { key: 'Metric1Value', label: 'Metric 1 Value', type: 'text' },
          { key: 'Metric1Label', label: 'Metric 1 Label', type: 'text' },
          { key: 'Metric2Value', label: 'Metric 2 Value', type: 'text' },
          { key: 'Metric2Label', label: 'Metric 2 Label', type: 'text' },
          { key: 'Metric3Value', label: 'Metric 3 Value', type: 'text' },
          { key: 'Metric3Label', label: 'Metric 3 Label', type: 'text' },
        ],
      },
      {
        sceneId: 'scene_3',
        sceneNumber: 3,
        title: 'Scene 3 Text',
        archetype: 'BROWSER_SPOTLIGHT',
        fields: [
          { key: 'SpotlightTitle', label: 'Spotlight Title', type: 'text' },
          { key: 'SpotlightBody', label: 'Spotlight Caption', type: 'textarea' },
          { key: 'BrowserUrl', label: 'Browser Bar URL', type: 'url' },
        ],
      },
      {
        sceneId: 'scene_4',
        sceneNumber: 4,
        title: 'Scene 4 Text',
        archetype: 'FEATURE_CARDS',
        fields: [
          { key: 'Card1Title', label: 'Pillar 1 Title', type: 'text' },
          { key: 'Card1Body', label: 'Pillar 1 Detail', type: 'text' },
          { key: 'Card2Title', label: 'Pillar 2 Title', type: 'text' },
          { key: 'Card2Body', label: 'Pillar 2 Detail', type: 'text' },
          { key: 'Card3Title', label: 'Pillar 3 Title', type: 'text' },
          { key: 'Card3Body', label: 'Pillar 3 Detail', type: 'text' },
        ],
      },
      {
        sceneId: 'scene_5',
        sceneNumber: 5,
        title: 'Scene 5 Text',
        archetype: 'KINETIC_STATEMENT',
        fields: [
          { key: 'QuoteText', label: 'Manifesto Quote', type: 'textarea' },
          { key: 'AuthorText', label: 'Attribution', type: 'text' },
        ],
      },
      {
        sceneId: 'scene_6',
        sceneNumber: 6,
        title: 'Scene 6 Text',
        archetype: 'END_CARD_CTA',
        fields: [
          { key: 'CtaHeadline', label: 'Closing Headline', type: 'text' },
          { key: 'CtaButtonText', label: 'CTA Button Label', type: 'text' },
          { key: 'CtaUrl', label: 'Destination URL', type: 'url' },
        ],
      },
    ],
  };

  const video1DesignValues = {
    colors: {
      BackgroundPrimary: '#111111',
      BackgroundSecondary: '#F4EFE6',
      TextPrimary: '#F4EFE6',
      TextSecondary: '#9CA3AF',
      AccentPrimary: '#D4AF37',
      AccentSecondary: '#C42B1C',
    },
    scenes: {
      scene_1: {
        BadgeText: 'YI-TING HUANG • AI & CLOUD ARCHITECT',
        TitleText: 'DOERS, NOT TALKERS.',
        SubtitleText: 'Production-grade AI & Multi-Cloud Architecture backed by verifiable credentials.',
      },
      scene_2: {
        SectionTitle: 'VERIFIED AT ENTERPRISE SCALE',
        Metric1Value: '120+',
        Metric1Label: 'Verified Credly Badges',
        Metric2Value: '2,300+',
        Metric2Label: 'Indexed AI Use Cases',
        Metric3Value: 'SC-100',
        Metric3Label: 'Cybersecurity Architect',
      },
      scene_3: {
        SpotlightTitle: 'Interactive AI Use Case Intelligence',
        SpotlightBody: 'Search, filter, and deploy from 2,300+ real-world enterprise GenAI patterns.',
        BrowserUrl: 'https://whoami.genisisiq.com',
      },
      scene_4: {
        Card1Title: 'Cloud Security (SC-100)',
        Card1Body: 'Zero-trust identity, governance, and compliance across Azure & multi-cloud.',
        Card2Title: 'GenAI Systems Architecture',
        Card2Body: 'Agentic workflows, RAG pipelines, and multi-modal production systems.',
        Card3Title: 'Bauhaus Interactive UX',
        Card3Body: 'Concise visual cards with dynamic animations and multi-palette themes.',
      },
      scene_5: {
        QuoteText: '“Skip static resumes. Inspect live architectures, verified badges, and 2,300+ AI use cases.”',
        AuthorText: 'YI-TING HUANG — WHOAMI.GENISISIQ.COM',
      },
      scene_6: {
        CtaHeadline: 'Verify Every Credential Live.',
        CtaButtonText: 'Explore whoami.genisisiq.com ↗',
        CtaUrl: 'https://whoami.genisisiq.com',
      },
    },
  };

  const video1Timeline = {
    totalDurationSec: 30,
    fps: 30,
    panZoomTrack: [
      { id: 'pz_1', sceneId: 'scene_1', startSec: 1.0, endSec: 4.2, scale: 1.45, targetX: 0.52, targetY: 0.45, width: 0.55, height: 0.55 },
      { id: 'pz_2', sceneId: 'scene_3', startSec: 10.5, endSec: 14.5, scale: 1.6, targetX: 0.58, targetY: 0.48, width: 0.5, height: 0.5 },
      { id: 'pz_3', sceneId: 'scene_6', startSec: 25.5, endSec: 29.2, scale: 1.35, targetX: 0.5, targetY: 0.55, width: 0.6, height: 0.6 },
    ],
    voiceoverTrack: [
      {
        id: 'vo_1',
        sceneId: 'scene_1',
        sceneNumber: 1,
        startSec: 0,
        endSec: 5,
        script: 'Most portfolios talk. Yi-Ting Huang builds. Welcome to whoami.genisisiq.com.',
        voiceId: 'ava-natural',
        voiceName: 'Ava (Natural)',
        speed: 1.0,
        volume: 100,
        audioUrl: '/media/voiceover-sample.wav',
      },
      {
        id: 'vo_2',
        sceneId: 'scene_2',
        sceneNumber: 2,
        startSec: 5,
        endSec: 10,
        script: 'Backed by over 120 verified Credly badges and Microsoft S C One Hundred cybersecurity certification.',
        voiceId: 'ava-natural',
        voiceName: 'Ava (Natural)',
        speed: 1.0,
        volume: 100,
        audioUrl: '/media/voiceover-sample.wav',
      },
      {
        id: 'vo_3',
        sceneId: 'scene_3',
        sceneNumber: 3,
        startSec: 10,
        endSec: 15,
        script: 'Explore an interactive catalog of 2,300 plus indexed enterprise AI use cases.',
        voiceId: 'ava-natural',
        voiceName: 'Ava (Natural)',
        speed: 1.0,
        volume: 100,
        audioUrl: '/media/voiceover-sample.wav',
      },
      {
        id: 'vo_4',
        sceneId: 'scene_4',
        sceneNumber: 4,
        startSec: 15,
        endSec: 20,
        script: 'Combining cloud security, agentic GenAI workflows, and Bauhaus visual precision.',
        voiceId: 'ava-natural',
        voiceName: 'Ava (Natural)',
        speed: 1.0,
        volume: 100,
        audioUrl: '/media/voiceover-sample.wav',
      },
      {
        id: 'vo_5',
        sceneId: 'scene_5',
        sceneNumber: 5,
        startSec: 20,
        endSec: 25,
        script: 'No walls of text—just concise, dynamic cards engineered for builders and leaders.',
        voiceId: 'ava-natural',
        voiceName: 'Ava (Natural)',
        speed: 1.0,
        volume: 100,
        audioUrl: '/media/voiceover-sample.wav',
      },
      {
        id: 'vo_6',
        sceneId: 'scene_6',
        sceneNumber: 6,
        startSec: 25,
        endSec: 30,
        script: 'Verify every badge and explore the portfolio today at whoami.genisisiq.com.',
        voiceId: 'ava-natural',
        voiceName: 'Ava (Natural)',
        speed: 1.0,
        volume: 100,
        audioUrl: '/media/voiceover-sample.wav',
      },
    ],
    scenesTrack: video1Scenes.map((s, idx) => ({
      id: s.sceneId,
      sceneNumber: s.sceneNumber,
      title: s.title,
      archetype: s.archetype,
      startSec: idx * 5,
      durationSec: 5,
      screenshotUrl: s.screenshotUrl,
    })),
    musicTrack: [
      {
        id: 'mus_1',
        trackName: 'Bauhaus Minimal Pulse (120 BPM)',
        genre: 'Electronic / Product Launch',
        startSec: 0,
        durationSec: 30,
        volume: 35,
        audioUrl: '/media/voiceover-sample.wav',
      },
    ],
    sfxTrack: [
      { id: 'sfx_1', effectType: 'Whoosh', startSec: 0.2, durationSec: 0.8, volume: 75, audioUrl: '/media/voiceover-sample.wav' },
      { id: 'sfx_2', effectType: 'Click', startSec: 5.0, durationSec: 0.4, volume: 80, audioUrl: '/media/voiceover-sample.wav' },
      { id: 'sfx_3', effectType: 'Pop', startSec: 10.0, durationSec: 0.5, volume: 70, audioUrl: '/media/voiceover-sample.wav' },
      { id: 'sfx_4', effectType: 'Swoosh', startSec: 15.0, durationSec: 0.7, volume: 75, audioUrl: '/media/voiceover-sample.wav' },
      { id: 'sfx_5', effectType: 'Riser', startSec: 20.0, durationSec: 1.0, volume: 70, audioUrl: '/media/voiceover-sample.wav' },
      { id: 'sfx_6', effectType: 'Chime', startSec: 25.0, durationSec: 0.9, volume: 85, audioUrl: '/media/voiceover-sample.wav' },
    ],
  };

  await prisma.promptVideo.upsert({
    where: { id: 'qGe4L499rr5AsLtm6F4q' },
    update: {
      scenesJson: JSON.stringify(video1Scenes),
      designSchemaJson: JSON.stringify(video1DesignSchema),
      designValuesJson: JSON.stringify(video1DesignValues),
      timelineJson: JSON.stringify(video1Timeline),
    },
    create: {
      id: 'qGe4L499rr5AsLtm6F4q',
      shareId: 'qGe4L499rr5AsLtm6F4q',
      workspaceId: workspace.id,
      brandKitId: brandKit.id,
      createdById: user.id,
      name: 'whoami.genisisiq.com Launch',
      prompt: 'Create a high-impact 30s product launch video for https://whoami.genisisiq.com highlighting Yi-Ting Huang, 120+ verified AI & Cloud badges, SC-100 verification, and 2,300+ indexed AI use cases.',
      sourceUrl: 'https://whoami.genisisiq.com',
      aspectRatio: '16:9',
      durationSec: 30,
      fps: 30,
      status: 'PUBLISHED',
      currentVersion: 1,
      thumbnailUrl: '/media/scene1.png',
      scenesJson: JSON.stringify(video1Scenes),
      designSchemaJson: JSON.stringify(video1DesignSchema),
      designValuesJson: JSON.stringify(video1DesignValues),
      timelineJson: JSON.stringify(video1Timeline),
      pronunciationJson: JSON.stringify([
        { id: 'pr1', word: 'SC-100', replacement: 'S C One Hundred' },
        { id: 'pr2', word: 'genisisiq', replacement: 'Genesis I Q' },
      ]),
      exportsJson: JSON.stringify([
        {
          id: 'exp_1080p_1',
          resolution: '1080p',
          fps: 30,
          status: 'READY',
          fileUrl: '/media/whoami-launch.mp4',
          fileSize: '7.82 MB',
          createdAt: '2026-10-15T08:40:00Z',
        },
      ]),
      viewsCount: 92,
    },
  });

  await prisma.promptVideoSession.upsert({
    where: { id: 'sess_whoami_1' },
    update: {},
    create: {
      id: 'sess_whoami_1',
      promptVideoId: 'qGe4L499rr5AsLtm6F4q',
      versionNumber: 1,
      state: 'COMPLETED',
      stagesJson: JSON.stringify([
        { id: 'understand', number: 1, title: 'Understand', description: 'Understand the request and gather context from whoami.genisisiq.com', status: 'completed', durationSec: 8 },
        { id: 'storyboard', number: 2, title: 'Storyboard', description: 'Plan the 6-scene Bauhaus narrative and visual direction (30s, 16:9)', status: 'completed', durationSec: 11 },
        { id: 'script', number: 3, title: 'Script', description: 'Write the voiceover narration and on-screen typography copy', status: 'completed', durationSec: 9 },
        {
          id: 'generate_scenes',
          number: 4,
          title: 'Generate Scenes',
          description: "Build each scene's Remotion visuals and animations",
          status: 'completed',
          durationSec: 24,
          substeps: ['Scene 1: Hero Hook', 'Scene 2: 120+ Verified Badges', 'Scene 3: 2,300+ AI Use Cases', 'Scene 4: Core Architecture Pillars', 'Scene 5: Bauhaus Manifesto', 'Scene 6: End Card CTA'],
        },
        { id: 'review', number: 5, title: 'Review', description: 'Verify Bauhaus contrast ratios, typography hierarchy, and timing', status: 'completed', durationSec: 6 },
        { id: 'voiceover', number: 6, title: 'Voiceover', description: 'Generate and sync ElevenLabs narration audio across 6 scenes', status: 'completed', durationSec: 10 },
        { id: 'sfx', number: 7, title: 'Sound Effects', description: 'Add sound effects (Whoosh, Click, Pop, Chime) and background music', status: 'completed', durationSec: 5 },
      ]),
      messagesJson: JSON.stringify([
        {
          id: 'm1',
          role: 'user',
          content: 'Create a high-impact 30s product launch video for https://whoami.genisisiq.com highlighting Yi-Ting Huang, 120+ verified AI & Cloud badges, SC-100 verification, and 2,300+ indexed AI use cases.',
          createdAt: '2026-10-15T08:30:00Z',
        },
        {
          id: 'm2',
          role: 'assistant',
          content: 'I have generated a 6-scene, 30-second Bauhaus launch video for **whoami.genisisiq.com** using your Brand Kit palette (`#111111`, `#D4AF37`, `#F4EFE6`, `#C42B1C`). You can customize any color or text in the **Design** tab or fine-tune the 5-track NLE timeline below.',
          createdAt: '2026-10-15T08:31:15Z',
        },
      ]),
      summaryText: 'Created a 30s 6-scene launch video for whoami.genisisiq.com with synchronized ElevenLabs voiceover, camera pan & zoom keyframes, and Bauhaus typography.',
    },
  });

  // 7. Second AI Launch Film: RFY3pPzp6G8E5xJXINUh ("whoami Launch Film", 16s, 4 scenes)
  await prisma.promptVideo.upsert({
    where: { id: 'RFY3pPzp6G8E5xJXINUh' },
    update: {},
    create: {
      id: 'RFY3pPzp6G8E5xJXINUh',
      shareId: 'RFY3pPzp6G8E5xJXINUh',
      workspaceId: workspace.id,
      brandKitId: brandKit.id,
      createdById: user.id,
      name: 'whoami Launch Film',
      prompt: 'Create a fast-paced 15s social teaser for https://whoami.genisisiq.com',
      sourceUrl: 'https://whoami.genisisiq.com',
      aspectRatio: '16:9',
      durationSec: 16,
      fps: 30,
      status: 'PUBLISHED',
      currentVersion: 1,
      thumbnailUrl: '/media/film_scene1.png',
      scenesJson: JSON.stringify(video1Scenes.slice(0, 4)),
      designSchemaJson: JSON.stringify({
        colors: video1DesignSchema.colors,
        scenes: video1DesignSchema.scenes.slice(0, 4),
      }),
      designValuesJson: JSON.stringify(video1DesignValues),
      timelineJson: JSON.stringify({
        ...video1Timeline,
        totalDurationSec: 16,
        scenesTrack: video1Timeline.scenesTrack.slice(0, 4),
        voiceoverTrack: video1Timeline.voiceoverTrack.slice(0, 4),
      }),
      exportsJson: JSON.stringify([
        {
          id: 'exp_16s',
          resolution: '1080p',
          fps: 30,
          status: 'READY',
          fileUrl: '/media/whoami-launch.mp4',
          fileSize: '4.15 MB',
          createdAt: '2026-10-15T08:50:00Z',
        },
      ]),
      viewsCount: 41,
    },
  });

  // 8. AI Visual Project: mVkkeVB4j15x799NHwBH ("whoami.genisisiq.com Visuals")
  const visualsItems = [
    {
      id: 'vis_ig_sq',
      presetId: 'ig-post-sq',
      platform: 'Instagram',
      presetName: 'Instagram post square',
      width: 1080,
      height: 1080,
      templateId: 'capture',
      isAnimated: true,
      showLogo: true,
      backgroundType: 'image',
      backgroundImageUrl: 'linear-gradient(135deg, #111111 0%, #1E293B 60%, #D4AF37 100%)',
      backgroundColor: '#111111',
      headline: '2,300+ AI use cases indexed. Verify SC‑100 ↗',
      subheadline: 'Build AI-enabled cloud solutions backed by 120+ verified badges and 2,300+ indexed use cases.',
      headlineColor: '#F4EFE6',
      ctaLabel: 'Explore AI ↗',
      ctaBgColor: '#D4AF37',
      ctaTextColor: '#111111',
      showShadows: true,
      screenshotUrl: '/media/scene1.png',
    },
    {
      id: 'vis_li_land',
      presetId: 'li-post-land',
      platform: 'LinkedIn',
      presetName: 'Linkedin post landscape',
      width: 1200,
      height: 626,
      templateId: 'spotlight',
      isAnimated: true,
      showLogo: true,
      backgroundType: 'image',
      backgroundImageUrl: 'linear-gradient(135deg, #0D0E12 0%, #0047AB 65%, #D4AF37 100%)',
      backgroundColor: '#0047AB',
      headline: 'Doers, not talkers: 120+ Verified AI & Cloud Badges',
      subheadline: 'Interactive portfolio & architecture hub at whoami.genisisiq.com',
      headlineColor: '#F4EFE6',
      ctaLabel: 'Verify SC-100 ↗',
      ctaBgColor: '#C42B1C',
      ctaTextColor: '#FFFFFF',
      showShadows: true,
      screenshotUrl: '/media/scene2.png',
    },
  ];

  await prisma.visualProject.upsert({
    where: { id: 'mVkkeVB4j15x799NHwBH' },
    update: {
      visualsJson: JSON.stringify(visualsItems),
    },
    create: {
      id: 'mVkkeVB4j15x799NHwBH',
      workspaceId: workspace.id,
      brandKitId: brandKit.id,
      createdById: user.id,
      name: 'whoami.genisisiq.com Social & Launch Visuals',
      category: 'social_announcement',
      prompt: 'Announce whoami.genisisiq.com — 2,300+ AI use cases indexed and 120+ verified cloud/AI badges.',
      sourceFlowId: '4fLyMFzH8BjqgKQF4Bd6',
      status: 'PUBLISHED',
      thumbnailUrl: '/media/visual_preview.png',
      visualsJson: JSON.stringify(visualsItems),
      templatesJson: JSON.stringify([
        { id: 'capture', name: 'Capture', description: 'Best for announcements', category: 'social_announcement' },
        { id: 'spotlight', name: 'Spotlight', description: 'High-contrast product focus', category: 'product_benefits' },
        { id: 'split', name: 'Split', description: 'Side-by-side metric & screenshot', category: 'feature_highlight' },
        { id: 'minimal', name: 'Minimal', description: 'Clean Bauhaus frame', category: 'website_hero' },
        { id: 'bento', name: 'Bento', description: 'Multi-card architectural grid', category: 'product_benefits' },
      ]),
    },
  });

  // 9. Collection: col_whoami_showcase
  await prisma.collection.upsert({
    where: { id: 'col_whoami_showcase' },
    update: {},
    create: {
      id: 'col_whoami_showcase',
      shareId: 'whoami-showcase',
      workspaceId: workspace.id,
      createdById: user.id,
      name: 'whoami.genisisiq.com Executive Launch Hub',
      status: 'PUBLISHED',
      headerJson: JSON.stringify({
        title: 'whoami.genisisiq.com — Doers, Not Talkers',
        subtitle: 'Interactive tour, 30s AI launch video, and 16s teaser film for Yi-Ting Huang.',
        logoUrl: '/media/scene1.png',
        ctaLabel: 'Open Live Portfolio ↗',
        ctaUrl: 'https://whoami.genisisiq.com',
        bgStyle: 'obsidian_gold',
      }),
      itemsJson: JSON.stringify([
        { id: 'ci_1', assetType: 'FLOW', assetId: '4fLyMFzH8BjqgKQF4Bd6', order: 0 },
        { id: 'ci_2', assetType: 'VIDEO', assetId: 'qGe4L499rr5AsLtm6F4q', order: 1 },
        { id: 'ci_3', assetType: 'VIDEO', assetId: 'RFY3pPzp6G8E5xJXINUh', order: 2 },
      ]),
      viewsCount: 64,
    },
  });

  // 10. Analytics Events, Leads, AI Memories, Connectors, Integrations & Notifications
  const existingLeads = await prisma.leadCapture.count({ where: { workspaceId: workspace.id } });
  if (existingLeads === 0) {
    await prisma.leadCapture.createMany({
      data: [
        {
          workspaceId: workspace.id,
          flowId: '4fLyMFzH8BjqgKQF4Bd6',
          flowTitle: 'whoami.genisisiq.com Interactive Tour',
          email: 'sarah.chen@microsoft.com',
          fullName: 'Sarah Chen',
          company: 'Microsoft Cloud AI',
          role: 'Principal Partner Director',
          stepsCompleted: 5,
          totalSteps: 5,
          syncedToCrm: true,
        },
        {
          workspaceId: workspace.id,
          flowId: '4fLyMFzH8BjqgKQF4Bd6',
          flowTitle: 'whoami.genisisiq.com Interactive Tour',
          email: 'marcus.vance@databricks.com',
          fullName: 'Marcus Vance',
          company: 'Databricks',
          role: 'VP Solutions Architecture',
          stepsCompleted: 5,
          totalSteps: 5,
          syncedToCrm: true,
        },
        {
          workspaceId: workspace.id,
          flowId: '4fLyMFzH8BjqgKQF4Bd6',
          flowTitle: 'whoami.genisisiq.com Interactive Tour',
          email: 'elena.rostova@stripe.com',
          fullName: 'Elena Rostova',
          company: 'Stripe',
          role: 'Head of Security Engineering',
          stepsCompleted: 4,
          totalSteps: 5,
          syncedToCrm: false,
        },
      ],
    });

    await prisma.analyticsEvent.createMany({
      data: [
        {
          workspaceId: workspace.id,
          assetType: 'FLOW',
          assetId: '4fLyMFzH8BjqgKQF4Bd6',
          assetTitle: 'whoami.genisisiq.com Interactive Tour',
          visitorId: 'vis_msft_1',
          visitorEmail: 'sarah.chen@microsoft.com',
          companyName: 'Microsoft',
          companyDomain: 'microsoft.com',
          country: 'United States',
          deviceType: 'Desktop',
          eventType: 'COMPLETE',
          stepIndex: 4,
          durationMs: 68400,
        },
        {
          workspaceId: workspace.id,
          assetType: 'VIDEO',
          assetId: 'qGe4L499rr5AsLtm6F4q',
          assetTitle: 'whoami.genisisiq.com Launch',
          visitorId: 'vis_dbx_2',
          visitorEmail: 'marcus.vance@databricks.com',
          companyName: 'Databricks',
          companyDomain: 'databricks.com',
          country: 'United States',
          deviceType: 'Desktop',
          eventType: 'COMPLETE',
          stepIndex: 6,
          durationMs: 30000,
        },
        {
          workspaceId: workspace.id,
          assetType: 'FLOW',
          assetId: '4fLyMFzH8BjqgKQF4Bd6',
          assetTitle: 'whoami.genisisiq.com Interactive Tour',
          visitorId: 'vis_strp_3',
          visitorEmail: 'elena.rostova@stripe.com',
          companyName: 'Stripe',
          companyDomain: 'stripe.com',
          country: 'United Kingdom',
          deviceType: 'Desktop',
          eventType: 'HOTSPOT_CLICK',
          stepIndex: 3,
          durationMs: 42100,
        },
      ],
    });

    await prisma.workspaceMemory.createMany({
      data: [
        {
          workspaceId: workspace.id,
          category: 'Product Fact',
          title: '120+ Verified Cloud & AI Certifications',
          content: 'Yi-Ting Huang holds 120+ verified Credly badges including Microsoft Certified: Cybersecurity Architect Expert (SC-100) and Azure Solutions Architect Expert (AZ-305).',
          source: 'whoami.genisisiq.com Brand Kit AI',
        },
        {
          workspaceId: workspace.id,
          category: 'Product Fact',
          title: '2,300+ Indexed Enterprise AI Use Cases',
          content: 'whoami.genisisiq.com indexes over 2,300 real-world AI use cases categorized by architecture pattern, industry vertical, and cloud platform.',
          source: 'whoami.genisisiq.com Brand Kit AI',
        },
        {
          workspaceId: workspace.id,
          category: 'Style Rule',
          title: 'Bauhaus Multi-Palette Design Philosophy',
          content: 'Use high-contrast Bauhaus palettes (#D4AF37 Gold, #111111 Obsidian, #F4EFE6 Ivory, #C42B1C Crimson, #0047AB Cobalt) and concise visual cards instead of text dumps.',
          source: 'whoami.genisisiq.com Brand Kit AI',
        },
      ],
    });

    await prisma.workspaceConnector.createMany({
      data: [
        { workspaceId: workspace.id, provider: 'github', name: 'GitHub (@huangyingting)', status: 'CONNECTED', lastSyncAt: new Date() },
        { workspaceId: workspace.id, provider: 'figma', name: 'Figma Brand & UI Kit', status: 'CONNECTED', lastSyncAt: new Date() },
        { workspaceId: workspace.id, provider: 'notion', name: 'Notion Architecture Wiki', status: 'CONNECTED', lastSyncAt: new Date() },
        { workspaceId: workspace.id, provider: 'linear', name: 'Linear Product Roadmap', status: 'DISCONNECTED' },
        { workspaceId: workspace.id, provider: 'slack', name: 'Slack Launch Alerts', status: 'CONNECTED', lastSyncAt: new Date() },
        { workspaceId: workspace.id, provider: 'gdrive', name: 'Google Drive Media Assets', status: 'DISCONNECTED' },
      ],
    });

    await prisma.workspaceIntegration.createMany({
      data: [
        { workspaceId: workspace.id, provider: 'hubspot', status: 'CONNECTED', configJson: JSON.stringify({ syncLeads: true, portalId: '8841920' }) },
        { workspaceId: workspace.id, provider: 'slack', status: 'CONNECTED', configJson: JSON.stringify({ channel: '#arcade-leads' }) },
        { workspaceId: workspace.id, provider: 'salesforce', status: 'DISCONNECTED', configJson: '{}' },
        { workspaceId: workspace.id, provider: 'ga4', status: 'CONNECTED', configJson: JSON.stringify({ measurementId: 'G-WHOAMI2026' }) },
        { workspaceId: workspace.id, provider: 'segment', status: 'DISCONNECTED', configJson: '{}' },
        { workspaceId: workspace.id, provider: 'zapier', status: 'CONNECTED', configJson: '{}' },
        { workspaceId: workspace.id, provider: 'webhook', status: 'CONNECTED', configJson: JSON.stringify({ endpointUrl: 'https://whoami.genisisiq.com/api/webhook' }) },
      ],
    });

    await prisma.creditTransaction.createMany({
      data: [
        { workspaceId: workspace.id, actorEmail: 'wlfjck@gmail.com', actionType: 'MONTHLY_QUOTA', creditsDelta: 200, description: 'Monthly Free Plan AI Credit Allocation' },
        { workspaceId: workspace.id, actorEmail: 'wlfjck@gmail.com', actionType: 'VIDEO_GENERATION', creditsDelta: -50, description: 'Generated 30s AI Video: whoami.genisisiq.com Launch' },
        { workspaceId: workspace.id, actorEmail: 'wlfjck@gmail.com', actionType: 'VISUALS_GENERATION', creditsDelta: -50, description: 'Generated AI Visuals: whoami.genisisiq.com Social & Launch Visuals' },
        { workspaceId: workspace.id, actorEmail: 'wlfjck@gmail.com', actionType: 'ONBOARDING_BONUS_CLAIM', creditsDelta: 200, description: 'Claimed 5/5 Getting Started Onboarding Bonus (+200 AI Credits)' },
      ],
    });

    await prisma.inboxNotification.createMany({
      data: [
        {
          workspaceId: workspace.id,
          userId: user.id,
          type: 'VIDEO_READY',
          title: '1080p MP4 Export Ready: whoami.genisisiq.com Launch',
          body: 'Your 30-second Bauhaus launch video (7.82 MB, 1080p@30fps) has finished rendering and is ready to download or share.',
          actionUrl: '/prompt-videos/custom/qGe4L499rr5AsLtm6F4q/edit',
          isRead: false,
        },
        {
          workspaceId: workspace.id,
          userId: user.id,
          type: 'LEAD_CAPTURED',
          title: 'New Lead Captured: sarah.chen@microsoft.com',
          body: 'Sarah Chen (Microsoft Cloud AI) completed 100% of whoami.genisisiq.com Interactive Tour and requested the Architecture Blueprint.',
          actionUrl: '/workspaces/workspace-5p8xcsfv/teams/me/leads',
          isRead: false,
        },
        {
          workspaceId: workspace.id,
          userId: user.id,
          type: 'CREDITS_CLAIMED',
          title: '+200 Bonus AI Credits Added',
          body: 'You completed all 5 Getting Started steps (Brand Kit, AI Video, Demo, AI Visuals, Share) and claimed 200 bonus AI credits.',
          actionUrl: '/workspaces/workspace-5p8xcsfv/usage',
          isRead: true,
        },
      ],
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
