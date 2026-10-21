# Architecture Decision Records (ADR) — Arcade Platform Clone

> Historical research/proposed architecture, not an implementation-completion statement. Current decisions and deployment contracts: [Production operations](05_PRODUCTION_OPERATIONS.md).

**Project**: Arcade Full-Stack Platform (`www.arcade.software` + `app.arcade.software`)  
**Status**: Approved for Implementation  
**Date**: 2026-10-15  
**Reference Artifacts**: `/home/azadmin/Arcade/ARCADE_FEATURE_ARCHITECTURE_DESIGN_REPORT.md` & `/home/azadmin/Arcade/screenshots/` (`00`–`152e`, 314 screenshots)

---

## Table of Contents

1. [ADR-001: Unified Next.js Full-Stack Monorepo Architecture](#adr-001-unified-nextjs-full-stack-monorepo-architecture)
2. [ADR-002: Hybrid Relational + JSONB Document Persistence (PostgreSQL + Prisma)](#adr-002-hybrid-relational--jsonb-document-persistence-postgresql--prisma)
3. [ADR-003: Normalized Coordinate System (`[0..1]`) for Interactive Demo (`Flow`) Canvas](#adr-003-normalized-coordinate-system-01-for-interactive-demo-flow-canvas)
4. [ADR-004: Programmatic Video Engine with Remotion & Schema-Driven `Design` Inspector](#adr-004-programmatic-video-engine-with-remotion--schema-driven-design-inspector)
5. [ADR-005: 7-Stage AI Video Agent Pipeline & Real-Time SSE Streaming](#adr-005-7-stage-ai-video-agent-pipeline--real-time-sse-streaming)
6. [ADR-006: 5-Track NLE Timeline Architecture (`Pan & Zoom`, `Voiceover`, `Scenes`, `Music`, `SFX`)](#adr-006-5-track-nle-timeline-architecture-pan--zoom-voiceover-scenes-music-sfx)
7. [ADR-007: Automated 1-Minute Brand Kit Extractor via Playwright + LLM Synthesis](#adr-007-automated-1-minute-brand-kit-extractor-via-playwright--llm-synthesis)
8. [ADR-008: Multi-Format AI Visuals Engine (28 Aspect-Ratio Presets + Motion Mode)](#adr-008-multi-format-ai-visuals-engine-28-aspect-ratio-presets--motion-mode)
9. [ADR-009: AI Voiceover Synthesis, Phonetic Dictionary & Multi-Language Translation Engine](#adr-009-ai-voiceover-synthesis-phonetic-dictionary--multi-language-translation-engine)
10. [ADR-010: Multi-Tenant Workspace, Team RBAC, Plan Gating & AI Credit Ledger](#adr-010-multi-tenant-workspace-team-rbac-plan-gating--ai-credit-ledger)
11. [ADR-011: Dual-Surface Design System Tokens & Dynamic Brand Kit CSS Variable Injection](#adr-011-dual-surface-design-system-tokens--dynamic-brand-kit-css-variable-injection)
12. [ADR-012: Public Share Player, Auto-Derived Step-by-Step Guide & Analytics Pipeline](#adr-012-public-share-player-auto-derived-step-by-step-guide--analytics-pipeline)

---

## ADR-001: Unified Next.js Full-Stack Monorepo Architecture

### Status
Accepted

### Context
Production Arcade separates its marketing surface (`www.arcade.software`, built in Webflow) from its web application (`app.arcade.software`, built in Next.js + React 18). However, maintaining two separate frameworks introduces duplicate components (such as embedded interactive demo players on marketing pages, shared pricing tables, and shared authentication state). Furthermore, the application requires four distinct route groups:
1. **Marketing Site (`/`, `/product/*`, `/solutions/*`, `/pricing`, `/showcase`, etc.)** — captured in `01_www_*` through `26_demo_embed_player.png`.
2. **Authenticated Workspace Shell (`/workspaces/[workspaceSlug]/*`)** — captured in `30_app_*` through `66d_*`, `100`–`115`, `141`–`146`.
3. **Full-Screen Creative Studios (`/flows/[pid]/edit`, `/prompt-videos/custom/[pid]/edit`, `/visual-projects/[pid]/edit`, `/collections/[pid]/[view]`)** — captured in `71`–`92`, `126`–`139h`, `147a`–`152e`.
4. **Public & Embeddable Players (`/share/[pid]`, `/share/[pid]/guide`, `/share/videos/[pid]`, `/share/collections/[pid]`, `/embed/[pid]`)** — captured in `26`, `95`, `96`, `140`.

### Decision
We will implement the entire platform inside a **single Next.js (TypeScript) application** using Next.js Route Groups:
- `(marketing)/*`: Public marketing pages (`01_www_*`–`25_www_*`) styled with the Warm Cream Editorial theme.
- `(auth)/*`: `/auth`, `/welcome` (`109_welcome_onboarding.png`), `/workspaces/create` (`110_workspaces_create.png`).
- `(workspace)/workspaces/[workspaceSlug]/*`: 240px left-sidebar shell (`Home`, `Brand Kits`, `Library`, `Insights`, `Leads`, `Settings/*`, `Upgrade/*`).
- `(studios)/flows/[pid]/*`, `(studios)/prompt-videos/custom/[pid]/edit`, `(studios)/visual-projects/[pid]/*`, `(studios)/collections/[pid]/*`: Full-viewport (`100vw × 100vh`) canvas editors.
- `(public)/share/*` and `(public)/embed/*`: Framing-free, fast-loading SSR/CSR players with `X-Frame-Options: ALLOWALL` / permissive `frame-ancestors` CSP headers for iframe embedding.

### Consequences
- **Positive**: Zero cross-repo synchronization overhead; the marketing site's interactive hero tabs (`01_www_home_hero.png`, `01_www_home_hero_demo_tab.png`) can directly mount the real `<FlowPlayer />` and `<VideoPlayer />` components.
- **Positive**: Single deployment artifact and unified TypeScript types across frontend UI, API routes, and background workers.
- **Negative**: Requires scoped CSS variables so marketing dark/cream tokens do not bleed into the light SaaS workspace shell (addressed in ADR-011).

---

## ADR-002: Hybrid Relational + JSONB Document Persistence (PostgreSQL + Prisma)

### Status
Accepted

### Context
Production Arcade uses Google Cloud Firestore (`arcade-cf7d5`) to store deeply nested, polymorphic documents (`flows`, `brandKits`, `promptVideos`, `visualProjects`, `collections`) alongside relational constructs (`workspaces`, `teams`, `members`, `leads`, `analyticsEvents`). While Firestore simplifies document storage, relational queries (such as Team Insights aggregations across date ranges in `146a_team_insights_activity_populated.png`, folder hierarchies, RBAC joins, and transactional AI credit deductions in `42_app_sidebar_ai_credits_popover.png`) are significantly cleaner and more portable in SQL.

### Decision
We will use **PostgreSQL (or SQLite for zero-config local development) with Prisma ORM**, combining **strict relational tables** for core entities and foreign keys with **strongly-typed JSON/JSONB columns** (validated at runtime via **Zod** schemas) for rich canvas documents:
- **Relational Tables**: `User`, `Workspace`, `WorkspaceMember`, `Team`, `TeamMember`, `Folder`, `BrandKit`, `Flow`, `FlowVersion`, `PromptVideo`, `PromptVideoSession`, `VisualProject`, `Collection`, `CollectionItem`, `AnalyticsEvent`, `LeadCapture`, `CreditTransaction`, `IntegrationConnection`, `CustomLink`.
- **Zod-Validated JSONB Columns**:
  - `Flow.steps`: Polymorphic array of `ImageStep | VideoStep | ChapterStep` including nested `hotspots[]`, `callouts[]`, `areas[]`, `panAndZoom`, and `voiceover` (`76`–`82g`).
  - `Flow.design`, `Flow.variables`, `Flow.translations`, `Flow.menu`: Flow-level configuration objects (`72`–`74`, `84`–`86`).
  - `BrandKit.colors`, `BrandKit.fonts`, `BrandKit.logos`, `BrandKit.backgrounds`, `BrandKit.product`, `BrandKit.voice`, `BrandKit.tones`, `BrandKit.demoSettings`, `BrandKit.sharePageSettings`, `BrandKit.customElements` (`144_brand_kit_*`).
  - `PromptVideo.scenes`, `PromptVideo.designSchema`, `PromptVideo.designValues`, `PromptVideo.timeline` (`130_*`, `132_*`, `139a`–`139h`).
  - `VisualProject.visuals`: Multi-format array of parameterized social/ad cards (`151a`–`152e`).

### Consequences
- **Positive**: Gives Firestore-like flexibility for instant full-document canvas saves (`PUT /api/flows/[pid]`) and undo/redo snapshots while preserving ACID transactions for billing, AI credits, and SQL-powered analytics queries (`Team Insights`).
- **Positive**: Every JSONB payload has a 1:1 TypeScript + Zod definition shared between the editor state store (`Zustand`) and the API layer.

---

## ADR-003: Normalized Coordinate System (`[0..1]`) for Interactive Demo (`Flow`) Canvas

### Status
Accepted

### Context
In the Interactive Demo (`Flow`) Editor (`71_app_flow_editor_main.png` – `82g_flow_editor_chapter_lead_form.png`), creators place interactive overlays (**Hotspots**, **Callouts**, **Blur/Highlight Areas**, and **Pan & Zoom target boxes**) on top of uploaded or recorded screenshots/videos. Those demos are subsequently viewed in:
- The 3-pane Flow Editor stage (`77`–`80`)
- Fullscreen Preview mode (`92_flow_editor_preview_mode.png`)
- Public Share Page (`/share/[pid]` — `95_flow_public_share_page.png`)
- Auto-Generated Step-by-Step Guide (`/share/[pid]/guide` — `94`, `96`)
- Responsive Embedded Iframes (`26_demo_embed_player.png`, mobile viewports)

If overlay coordinates were stored in raw screen pixels, resizing the player container would misalign hotspots from the underlying UI buttons in the screenshot.

### Decision
All spatial coordinates on a `FlowStep` MUST be stored in **normalized unit coordinates (`0.0` to `1.0`)** relative to the intrinsic width and height of the step's media asset (`mediaWidth`, `mediaHeight`):
- **Point Overlays (`Hotspot`, `Callout` anchor)**:
  - `x: number` (`0.0 <= x <= 1.0`, rendered as `left: ${x * 100}%`)
  - `y: number` (`0.0 <= y <= 1.0`, rendered as `top: ${y * 100}%`)
- **Rectangular Overlays (`Area` blur/highlight/crop, `PanAndZoom` focus box)**:
  - `x: number`, `y: number`, `width: number`, `height: number` (all in `[0.0, 1.0]`)
- **Pan & Zoom Transform Math**:
  - Given a focus box `(x, y, width, height)` in `[0..1]`, the CSS scale factor is `scale = clamp(1 / Math.max(width, height), 1.1, 4.0)` and the focal center is `(cx, cy) = (x + width / 2, y + height / 2)`, producing a deterministic CSS transform:
    `transform: scale(${scale}) translate(${(0.5 - cx) * 100}%, ${(0.5 - cy) * 100}%)` with `cubic-bezier(0.22, 1, 0.36, 1)` transition timing.

### Consequences
- **Positive**: Overlays remain pixel-accurate at any viewport size, aspect ratio, or zoom level without recalculating layout coordinates.
- **Positive**: The Step-by-Step Guide (`94_flow_step_by_step_guide.png`) can automatically crop or badge the exact click coordinate (`x, y`) on static thumbnails.

---

## ADR-004: Programmatic Video Engine with Remotion & Schema-Driven `Design` Inspector

### Status
Accepted

### Context
Reverse-engineering of `/prompt-videos/custom/[pid]/edit` (`126_whoami_video_completed_editor.png` through `139h_whoami_video_edit_all_scripts.png`, and `150a`–`150c`) revealed that Arcade's AI Video Studio does **not** generate opaque raster video blobs via a diffusion model. Instead:
1. It generates **programmatic React/Remotion scenes** (kinetic typography, 3D perspective browser mockups, animated cursors, SVG metric cards, split-screen feature showcases, CTA end-cards) styled with the selected Brand Kit (`130_scene2_whoami_video.png` – `130_scene6_whoami_video.png`).
2. It exposes a **Schema-Driven `Design` Tab** (`132a`–`132d`, `132_scene1_design_inspector.png` – `132_scene6_design_inspector.png`) where global `Colors` (`BackgroundPrimary`, `BackgroundSecondary`, `TextPrimary`, `TextSecondary`, `AccentPrimary`, `AccentSecondary`) and per-scene `Scene N Text` fields (`TitleText`, `SubtitleText`, `BadgeText`, `Metric1Value`, `Card1Title`, `CtaUrl`, etc.) update the video canvas in real time at 30/60 FPS.

### Decision
We will implement the AI Video Studio canvas and export pipeline using **Remotion (`@remotion/core`, `@remotion/player`, `@remotion/renderer`)** paired with a **Dynamic JSON `designSchema` Engine**:
1. **Modular Scene Archetype Library**:
   - Build a library of parameterized Remotion scene components (`HeroSplitScene`, `BrowserSpotlightScene`, `MetricBentoScene`, `FeatureCardsScene`, `KineticStatementScene`, `EndCardCtaScene`) that accept `colors: BrandColorMap`, `typography: BrandFontMap`, `sceneProps: Record<string, string>`, and `cameraKeyframes: PanZoomSpan[]`.
2. **Dynamic `designSchema` & `designValues` Contract**:
   - Every `PromptVideo` stores a `designSchema` defining:
     - `colors`: Array of `{ key, label, defaultHex }`
     - `scenes`: Array of `{ sceneId, sceneNumber, title, durationFrames, templateType, fields: Array<{ key, label, type: 'text' | 'textarea' | 'url' | 'media' }> }`
   - Editing any color swatch or text input in the `Design` tab mutates `designValues` in the Zustand store, which passes directly as `inputProps` to `<Player />` for zero-latency 60fps updates.
3. **MP4 Export Pipeline (`137_whoami_video_export_modal.png`, `139e_whoami_video_export_completed.png`)**:
   - Clicking `Export` (`720p`/`1080p`/`4K`, `24`/`30`/`60 FPS`) triggers a server-side render job (using `@remotion/renderer` or headless Playwright + FFmpeg frame capture) that outputs a standard H.264 `.mp4` file with mixed multi-track audio (`Voiceover` + `Music` + `SFX`) and updates the export dropdown to `Ready` with a direct `Download` trigger.

### Consequences
- **Positive**: Exact 1:1 behavioral parity with Arcade's Custom Code AI Video Studio (`130_*`, `132_*`, `150_*`).
- **Positive**: Crisp vector typography and UI mockups at 1080p/4K with instant user customization of every text string and brand color.

---

## ADR-005: 7-Stage AI Video Agent Pipeline & Real-Time SSE Streaming

### Status
Accepted

### Context
When a user submits a prompt or URL (e.g., `https://whoami.genisisiq.com`) in the AI Video Studio (`124_ai_video_prompt_whoami_entered.png`), the left panel transitions into a real-time conversational agent log (`125_whoami_video_step_1.png` through `125_whoami_video_step_16.png`) showing 7 distinct stages:
1. `Understand` — *"Understand the request and gather context"* (crawls target URL / reads Brand Kit + attached Flow demos)
2. `Storyboard` — *"Plan the narrative and visual direction"* (plans 4–6 scenes matching target duration `15s`/`30s`/`45s`/`60s` and aspect ratio `16:9`/`9:16`/`1:1`)
3. `Script` — *"Write the voiceover and on-screen copy"*
4. `Generate Scenes` — *"Build each scene's visuals and animations"* (populated with per-scene checkmarks `Scene 1`..`Scene N`)
5. `Review` — *"Verify quality and fix any issues"* (self-checks layout contrast and timing)
6. `Voiceover` — *"Generate and sync the narration audio"* (synthesizes TTS audio per scene)
7. `Sound Effects` — *"Add sound effects and background music"* (places ambient music & transition whooshes/clicks on the timeline)

 Users can also send follow-up prompts in the `Chat` tab targeting the whole video or a specific `@Scene` (`133_whoami_video_scene_picker_menu.png`) and switch between generated versions (`v1`, `v2` in `134_whoami_video_v1_options_menu.png`).

### Decision
We will implement the AI Video Agent as an **event-driven 7-stage state machine** backed by `PromptVideoSession` records and streamed to the client via **Server-Sent Events (`GET /api/prompt-videos/[pid]/stream`)**:
- Each stage emits structured progress events (`{ stage, status: 'running' | 'completed', message, substeps[], progressPercent, snapshotVersion }`).
- If an external LLM/TTS API key (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`) is configured, the orchestrator calls the live crawler + LLM + TTS provider; if running in local/offline mode without external keys, a deterministic high-fidelity synthesis engine crawls the target URL via Playwright, extracts real DOM headlines/metrics/colors/screenshots, and populates all 7 stages, scenes, voiceover audio tracks, and sound effects automatically.

### Consequences
- **Positive**: Works reliably out-of-the-box for any URL (including `https://whoami.genisisiq.com`) both with external LLM keys and in self-contained local environments.
- **Positive**: Supports `@Scene` scoped edits and `v1`/`v2` version branching (`Duplicate to new video`, `Revert to this version`).

---

## ADR-006: 5-Track NLE Timeline Architecture (`Pan & Zoom`, `Voiceover`, `Scenes`, `Music`, `SFX`)

### Status
Accepted

### Context
Clicking the expand chevron on the bottom transport bar of the AI Video Editor opens the full **Multi-Track Non-Linear Editor (NLE) Timeline** (`139a_whoami_video_multitrack_timeline.png` through `139h_whoami_video_edit_all_scripts.png`). It contains 5 synchronized horizontal tracks across a time ruler (`0s` to `totalDurationSec`) with a draggable red playhead and timeline zoom slider:
1. **`Pan & Zoom` Track**: Purple camera keyframe spans (`Pan & Zoom`) that open the `Pan & Zoom` right-hand inspector (`139d`: `Scale %` slider, `Target X/Y` draggable bounding box over the preview stage, `Delete`).
2. **`Voiceover` Track**: Segmented narration clips aligned to each scene that open the `Voiceover` inspector (`139b`: `Voice` selector with 18+ ElevenLabs voices + play preview, `Speed` `0.5x`–`2.0x`, `Volume`, per-scene `Script` textarea, `Edit pronunciation` dictionary modal `139g`, and `Edit all scripts` bulk modal `139h`).
3. **`Scenes` Track**: Proportional visual scene blocks (`Scene 1`..`Scene 6`) with drag handles to trim/extend duration, `+` insertion buttons (`135_whoami_video_add_scene_modal.png`), and per-scene `...` menus (`Duplicate`, `Delete`).
4. **`Music` Track**: Full-width background music waveform strip (`Upbeat Corporate`, `Bauhaus Minimal`, etc.) with volume ducking, fade-in/out, and track replacement.
5. **`Sound effects` Track**: Discrete SFX markers (`Whoosh`, `Click`, `Pop`, `Chime`, `Swoosh`, `Riser`) opening the `Sound Effect` inspector (`139c`).

### Decision
We will model the NLE timeline as a single normalized `VideoTimeline` JSON structure inside `PromptVideo.timeline` using **seconds (`float`) and frames (`int` at 30fps)** as the canonical time base:
- Playhead state (`currentFrame`, `isPlaying`, `timelineZoom`, `isTimelineExpanded`, `selectedTrackItem`) is managed in a dedicated Zustand slice synchronized bi-directionally with the Remotion `<Player ref={playerRef} />` via `frameupdate` listeners.
- Clicking any clip on any of the 5 tracks sets `selectedTrackItem = { trackType, itemId }`, which switches the right-hand inspector panel to the corresponding specialized inspector (`PanZoomInspector`, `VoiceoverInspector`, `SceneInspector`, `MusicInspector`, or `SfxInspector`).

### Consequences
- **Positive**: Frame-accurate synchronization between the 5 timeline tracks, the central video stage, and the contextual right-hand inspector.

---

## ADR-007: Automated 1-Minute Brand Kit Extractor via Playwright + LLM Synthesis

### Status
Accepted

### Context
Arcade's Brand Kit system (`120_brand_kit_setup_modal.png` – `123_brand_kit_generated_result.png` and `142a` – `144_brand_kit_*`) takes a website URL (e.g., `https://whoami.genisisiq.com`) and within ~60 seconds populates a **13-section Brand Kit** (`Home`, `Sources`, `Logos`, `Colors`, `Fonts`, `Photography`, `Backgrounds`, `Illustrations`, `Product`, `Voice`, `Tones`, `Demo`, `Share page`, `Custom elements`).

### Decision
We will implement the Brand Kit AI Extractor (`POST /api/brand-kits/extract`) using a 6-step pipeline matching the exact UI progress steps (`122_whoami_brand_kit_step_1.png` – `step_6.png`):
1. **Step 1 — Headless Playwright DOM & Computed Style Extraction**:
   - Navigate to the target URL, capture a full-page screenshot, extract `<title>`, meta tags, OpenGraph images, `<svg>` / `<img>` logos, favicons, computed `backgroundColor` / `color` / `borderColor` frequency histograms across visible DOM nodes, and `@font-face` / `fontFamily` declarations.
2. **Step 2 — Brand Color Role Classification**:
   - Map extracted hex values into semantic roles: `Primary`, `Secondary`, `Background Primary`, `Background Secondary`, `Text Primary`, `Text Secondary`, `Accent 1`, `Accent 2` (`144_brand_kit_colors.png`).
3. **Step 3 — Typography Pairing**:
   - Identify primary heading and body fonts (`Heading Font`, `Body Font`, `Monospace Font`, weights, and fallbacks in `144_brand_kit_fonts.png`).
4. **Step 4 — Procedural Brand Background & Asset Generation**:
   - Generate 5 high-resolution abstract/geometric brand backgrounds using the extracted palette (`144_brand_kit_backgrounds.png`) and capture key product/section screenshots (`144_brand_kit_photography.png`).
5. **Step 5 — Product Intelligence, ICP, Key Messaging, Voice & Tones Synthesis**:
   - Analyze extracted page copy via LLM (with deterministic structured parser fallback) to populate:
     - `Product` (`144_brand_kit_product.png`): `Product Name`, `Tagline`, `Description`, `Ideal Customer Profile (ICP)` cards, and `Key Messaging` pillars.
     - `Voice` (`144_brand_kit_voice.png`): Voice summary, persona traits, `Dos` and `Don'ts`.
     - `Tones` (`144_brand_kit_tones.png`): Channel-specific tone rules (`Product Launch`, `Social Media`, `Sales Enablement`, `Technical Documentation`).
6. **Step 6 — Demo & Share Page Default Theme Binding**:
   - Populate `Demo` (`144_brand_kit_demo.png`: Hotspot color, Callout theme, Player frame) and `Share page` (`144_brand_kit_share_page.png`: Header logo, CTA button, background).

### Consequences
- **Positive**: Any URL entered into `Set up Brand Kit` produces a rich, immediately usable 13-tab Brand Kit that automatically themes downstream Flows, AI Videos, and AI Visuals.

---

## ADR-008: Multi-Format AI Visuals Engine (28 Aspect-Ratio Presets + Motion Mode)

### Status
Accepted

### Context
The AI Visuals Studio (`/workspaces/[slug]/start-with-ai/visuals` in `148a`–`151e`) and Visual Canvas Editor (`/visual-projects/[pid]/edit` in `151f`–`152e`) allow users to generate branded marketing cards across 4 categories (`Social Announcement`, `Product Benefits`, `Feature Highlight`, `Website Hero`) and resize/adapt a single visual across **28 social/ad size presets spanning 7 platforms** (`LinkedIn`, `Facebook`, `Instagram`, `X`, `TikTok`, `YouTube`, `Google Ads` in `151i_whoami_visual_add_visual_popover.png`), plus toggle **`Animate`** (`152d_whoami_visual_animated_mode.png`) and copy/background generation with **Avery** (Arcade's AI assistant).

### Decision
We will build a **Responsive Container-Query Visual Layout Engine**:
1. Each Visual Template (`Capture`, `Spotlight`, `Split`, `Minimal`, `Bento`, `HeroBanner`) is implemented as a declarative React component that adapts its internal grid (`flex-col` for portrait `9:16` / square `1:1`, `grid-cols-12` for landscape `16:9` / `1.91:1`, compact strip for Google Ads `728×90` leaderboard) based on the target preset's `(width, height)` aspect ratio.
2. Each `VisualItem` inside a `VisualProject` stores its preset metadata (`platform`, `presetName`, `width`, `height`) and shares or overrides the project's `templateId`, `isAnimated`, `showLogo`, `background` (`image` or `color` + Avery AI generator), `headline` (text + color + Avery AI generator), `cta` (`label`, `bgColor`, `textColor`), and `shadows`.
3. **Export (`151j_whoami_visual_export_modal.png`)**:
   - Static mode exports pixel-exact `.png` at the preset's native resolution (`width × height`) using HTML5 Canvas / SVG foreignObject or Playwright element screenshot.
   - `Animate` mode (`isAnimated: true`) renders a smooth CSS/Remotion loop (floating browser card, entrance text stagger, subtle background shimmer) and exports either `.mp4` or `.gif`.

### Consequences
- **Positive**: Adding any of the 28 social/ad presets (`151i`, `152e`) immediately lays out the headline, logo, product screenshot, and CTA pill cleanly without text clipping or manual repositioning.

---

## ADR-009: AI Voiceover Synthesis, Phonetic Dictionary & Multi-Language Translation Engine

### Status
Accepted

### Context
Both the Interactive Demo (`Flow`) Editor (`81_flow_editor_tool_voiceover.png`, `84_flow_editor_rail_translations_ai.png`) and the AI Video Studio (`139b_whoami_video_voiceover_inspector.png`, `139g_whoami_video_edit_pronunciation.png`, `139h_whoami_video_edit_all_scripts.png`) rely on:
- **Synthetic Voices**: 18+ curated voices (`Ava`, `Marcus`, `Elena`, `Liam`, `Sophia`, `Noah`, etc.) with gender/accent tags, voice preview samples, speed (`0.5x`–`2.0x`), and volume controls.
- **Pronunciation Rules (`139g`)**: Workspace/project-level phonetic replacements (`word -> replacement`, e.g., `"SC-100" -> "S C One Hundred"`, `"GenisisIQ" -> "Genesis I Q"`).
- **Translations AI (`84`)**: One-click translation of all Flow callouts, hotspots, chapters, and voiceover scripts into 30+ languages while preserving the original Flow layout and generating localized voiceover audio.

### Decision
We will implement a unified **`VoiceAndTranslationService`**:
1. Before synthesizing any script text, the service applies all active `PronunciationRule` regex replacements from the project/workspace dictionary.
2. For TTS generation, it supports pluggable providers: ElevenLabs API (`ELEVENLABS_API_KEY`), OpenAI Audio Speech API (`OPENAI_API_KEY`), or a built-in WebAudio/WAV synthesis fallback so every voiceover clip has a valid playable `.mp3`/`.wav` URL and waveform array in local development.
3. For `Translations AI`, translating a Flow into language `locale` (`es`, `fr`, `de`, `ja`, `zh-CN`, `pt`, etc.) creates an entry in `Flow.translations[locale]` containing localized overrides for every step's `title`, `subtitle`, `hotspots[].label`, `callouts[].text`, and `voiceover.script`, selectable via a language switcher pill in the Public Share Player (`95_flow_public_share_page.png`).

### Consequences
- **Positive**: Complete functional parity for voiceover generation, bulk script editing (`139h`), phonetic pronunciation rules (`139g`), and multi-language Flow players (`84`).

---

## ADR-010: Multi-Tenant Workspace, Team RBAC, Plan Gating & AI Credit Ledger

### Status
Accepted

### Context
Every resource in `app.arcade.software` belongs to a `Workspace` (`/workspaces/[workspaceSlug]/*`) and optionally a `Team` (`/workspaces/[workspaceSlug]/teams/[teamSlug]/*`). The UI prominently tracks:
- **AI Credits (`42_app_sidebar_ai_credits_popover.png`, `57_app_usage.png`, `58_app_purchase_credits.png`, `152b_home_claimed_200_credits.png`)**:
  - Monthly credit allowance (e.g., `200` on Free, `800` on Growth) + bonus credits (e.g., `+200 credits` claimed by completing the 5-step Getting Started checklist in `152b_home_claimed_200_credits.png`).
  - Credit costs per AI action: `50 credits` for AI Video generation (`124`), `50 credits` for AI Visuals generation (`148d`), `10 credits` for Flow AI Polish/Translation (`75`, `84`).
- **Subscription Tiers (`101_settings_billing.png`, `113_upgrade_pro_page.png`, `114_upgrade_growth_page.png`)**:
  - `FREE` (`$0/mo`), `PRO` (`$38/mo` or `$32/mo` annual), `GROWTH` (`$50/seat/mo` or `$42.50/seat/mo` annual), `ENTERPRISE` (`Custom`).

### Decision
We will implement a **Transactional Credit Ledger & Plan Entitlement System**:
- `Workspace` stores `planTier`, `monthlyCreditsQuota`, `bonusCreditsBalance`, `usedCreditsThisCycle`, and `onboardingStepsCompleted: string[]`.
- Every AI generation endpoint logs a `CreditTransaction` (`amount`, `actionType`, `resourceId`, `actorId`) and updates the workspace balance in real time so the sidebar `AI Credits` progress bar and popover (`42_app_sidebar_ai_credits_popover.png`) reflect live usage.
- Completing all 5 onboarding tasks (`create_brand_kit`, `generate_video`, `create_demo`, `generate_visuals`, `share_asset`) unlocks the `Claim 200 credits` action (`POST /api/workspaces/[slug]/claim-onboarding-credits` — `152b_home_claimed_200_credits.png`).
- Unlike the restricted Free tier on production where certain Team/Enterprise settings return 404, our clone will **render all Workspace & Team Settings pages (`General`, `Privacy`, `Brand Kits`, `Billing & Plans`, `Members`, `Teams`, `Integrations`, `Translations`, `Custom Links`, `Synthetic Voices`, `Advanced`)** with interactive UI and plan-tier badges so every feature can be tested and used directly.

### Consequences
- **Positive**: Users can experience both the exact Free/Pro/Growth upgrade flows (`101`, `113`, `114`) AND use all workspace/team settings without hitting plan-gated 404s.

---

## ADR-011: Dual-Surface Design System Tokens & Dynamic Brand Kit CSS Variable Injection

### Status
Accepted

### Context
Reverse-engineering extracted 279 CSS custom properties across two distinct visual themes, plus user Brand Kit theming:
1. **Marketing Site (`www.arcade.software` — `01`..`25`)**: Warm editorial cream palette (`--bg-cream: #F6F4EE`, `--bg-card: #EFECE4`, `--bg-dark: #0D0E12`, `--accent-blue: #2563EB`, `--accent-indigo: #4F46E5`, display serif/geometric headlines + `Inter` body + `JetBrains Mono` tags).
2. **Application Studio (`app.arcade.software` — `30`..`152e`)**: High-craft light SaaS workspace (`--app-bg: #F8FAFC`, `--surface: #FFFFFF`, `--border: #E2E8F0`, `--text-primary: #0F172A`, `--text-secondary: #475569`, `--primary: #4F46E5`, `--radius-card: 12px`, `--radius-pill: 9999px`) paired with dark-canvas NLE timeline drawers (`#111827`).
3. **Brand Kit Injection (`144_brand_kit_colors.png`, `132_whoami_video_design_tab.png`)**: For example, the `whoami.genisisiq.com` Brand Kit injects Bauhaus Gold `#D4AF37`, Obsidian `#111111`, Warm Ivory `#F4EFE6`, Crimson `#C42B1C`, and Cobalt `#0047AB`.

### Decision
We will define a **3-Layer CSS Variable Token System** in Tailwind CSS:
- **Layer 1 (`[data-theme="marketing"]`)**: Warm cream editorial tokens for all `(marketing)` routes.
- **Layer 2 (`[data-theme="workspace"]`)**: Clean slate/indigo SaaS tokens for all `(workspace)` and `(studios)` routes.
- **Layer 3 (`<BrandKitThemeProvider brandKit={activeBrandKit}>`)**: Scopes `--brand-primary`, `--brand-secondary`, `--brand-bg-primary`, `--brand-bg-secondary`, `--brand-text-primary`, `--brand-text-secondary`, `--brand-font-heading`, and `--brand-font-body` directly onto the Flow Stage, Remotion Video Player, Visual Canvas, and Public Share Page.

### Consequences
- **Positive**: Switching a project's Brand Kit immediately restyles the Flow Player, AI Video scenes, Visual cards, and Share Page with zero component code changes.

---

## ADR-012: Public Share Player, Auto-Derived Step-by-Step Guide & Analytics Pipeline

### Status
Accepted

### Context
When a creator shares an Interactive Demo (`/share/[pid]` — `95_flow_public_share_page.png`), Arcade provides:
1. **Interactive Player View (`/share/[pid]`)**: Top bar with Brand Logo, Flow Title, view mode toggle (`Interactive` | `Step-by-step guide`), Language selector, CTA button, and fullscreen toggle; bottom progress bar with chapter segments; floating comment/reaction sidebar.
2. **Auto-Derived Step-by-Step Guide (`/share/[pid]/guide` — `94_flow_step_by_step_guide.png`, `96_flow_public_share_guide.png`)**: Automatically renders a scrollable documentation article where every interactive step becomes a numbered card (`1`, `2`, `3`...) showing the screenshot with a highlighted click ring at `(hotspot.x, hotspot.y)` and the step's callout text underneath, plus `Copy link` / `Export PDF`.
3. **Telemetry & Lead Ingestion (`93_flow_insights_page.png`, `146a_team_insights_activity_populated.png`, `49_app_team_leads.png`)**: Every view, step progression, hotspot click, completion, and Chapter Lead Form submission (`82g_flow_editor_chapter_lead_form.png`) is recorded and aggregated in `Flow Insights`, `Team Insights`, and `Leads`.

### Decision
1. **Zero-Duplication Guide Renderer**: `/share/[pid]/guide` and `/flows/[pid]/guide` read the exact same `Flow.steps` array as the interactive player—filtering for steps with hotspots/chapters and rendering an annotated `<GuideStepCard />` for each step.
2. **Client Telemetry Beacon (`POST /api/analytics/events`)**:
   - The `<FlowPlayer />` and `<VideoSharePlayer />` emit lightweight beacon events (`SESSION_START`, `STEP_VIEW`, `HOTSPOT_CLICK`, `CHAPTER_CTA_CLICK`, `LEAD_SUBMITTED`, `FLOW_COMPLETE`, `VIDEO_PLAY`, `VIDEO_COMPLETE`) with a visitor `sessionId`, `stepIndex`, `durationMs`, `deviceType`, `country`, and inferred company domain.
   - Submitting a Chapter Lead Form (`82g`) creates a `LeadCapture` record (`email`, `name`, `company`, `flowId`, `workspaceId`) and links the visitor's anonymous `sessionId` to their identity so `Leads` (`49`), `Audience` (`146_team_insights_audience.png`), and `Impact Analysis` (`56`) populate immediately.

### Consequences
- **Positive**: Updating any step or hotspot in the Flow Editor automatically updates both the Interactive Demo and the Step-by-Step Guide, and interacting with any shared link populates real-time charts in `Flow Insights` and `Team Insights`.

---

## ADR-013: Invite-Only Account Admission & Scrypt Password Credentials (ReadWise Architecture)

### Status
Accepted

### Context
To prevent unauthorized public sign-ups while supporting enterprise-grade self-hosted and cloud deployments, account creation and credential authentication must follow the exact **Invite-Only Account Admission** architecture established in `../ReadWise`:
- Public `/register` must block uninvited sign-ups when `ACCOUNT_ADMISSION_MODE="invitation-only"` (the default).
- Administrators issue one-time cryptographic invitation links (`/invite/[token]`) bound to a normalized recipient email (`activeForEmail`) with an expiration timestamp (`expiresAt`, default 7 days).
- Only the SHA-256 hash (`tokenHash`) of the 32-byte base64url opaque token is persisted in the database (`AccountInvitation`), so database read access never leaks active invite links.
- Passwords are hashed using `node:crypto` `scrypt` (`N=16384, r=8, p=1`, 64-byte key, 16-byte random salt, stored in `PasswordCredential.passwordHash` as `scrypt$16384$8$1$<salt>$<hash>`) and verified in constant time via `timingSafeEqual` against a dummy hash when an account does not exist.

### Decision
We implement the ReadWise `src/lib/account-admission/` subsystem and Prisma models (`PasswordCredential`, `PendingRegistration`, `AccountInvitation`, `AccountEmailOutbox`):
1. **Admin Invitation Management (`/admin/invitations` & `/api/admin/invitations`)**:
   - Create one-time invitations (`POST /api/admin/invitations`), returning the `acceptUrl` (`/invite/[token]`) once.
   - Rotate a pending invitation's token (`POST /api/admin/invitations/[id]/rotate`) or revoke it (`DELETE /api/admin/invitations/[id]`).
2. **One-Time Invitation Inspection & Registration (`/invite/[token]`, `/api/auth/invitation`, `/api/auth/register`)**:
   - Inspects the token hash and returns `{ status, maskedEmail, expiresAt }`.
   - Verifies that the submitted email matches `invitation.normalizedEmail` and password satisfies the 12–128 character policy, creates `User` + `PasswordCredential` + `WorkspaceMember`, transitions `AccountInvitation` to `ACCEPTED` (clearing `activeForEmail` and `tokenHash`), and sets the HttpOnly database session cookie (`next-auth.session-token`).
3. **Scrypt Password Login & Reset (`/signin`, `/api/auth/password/login`, `/api/auth/password/forgot`, `/api/auth/password/reset`)**:
   - Authenticates credentials using `verifyPassword` + `timingSafeEqual` and issues a 30-day database `Session` cookie.

### Consequences
- **Positive**: Identical security posture and UX to `../ReadWise`, zero uninvited account creation in `invitation-only` mode, and full compatibility with both SQLite (`prisma/schema.prisma`) and PostgreSQL (`prisma/schema.postgres.prisma`).
