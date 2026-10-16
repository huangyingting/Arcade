# System & UI/UX Design Document — Arcade Platform Clone

**Project**: Arcade Full-Stack Platform (`www.arcade.software` + `app.arcade.software`)  
**Version**: 1.0  
**Date**: 2026-10-15  
**Reference Screenshots**: `/home/azadmin/Arcade/screenshots/` (`00`–`152e`, 314 screenshots)

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Design System & CSS Token Specification](#2-design-system--css-token-specification)
3. [Master UI Layout Shells & Viewport Geometry](#3-master-ui-layout-shells--viewport-geometry)
4. [Component Hierarchy & Frontend State Architecture](#4-component-hierarchy--frontend-state-architecture)
5. [Interactive State Machines](#5-interactive-state-machines)
6. [Spatial Coordinate, Camera Zoom & NLE Timeline Math](#6-spatial-coordinate-camera-zoom--nle-timeline-math)
7. [Complete Modal, Popover & Context Menu Catalog](#7-complete-modal-popover--context-menu-catalog)

---

## 1. System Architecture Overview

```
+---------------------------------------------------------------------------------------------------+
|                                   CLIENT BROWSER (React 18 / Next.js)                             |
|                                                                                                   |
|  +--------------------+  +----------------------+  +--------------------+  +-------------------+  |
|  |  Marketing Surface |  |   Workspace Shell    |  |  Creative Studios  |  |  Public Players   |  |
|  |  (www routes)      |  |  (/workspaces/[slug])|  |  - Flow Editor     |  |  - /share/[pid]   |  |
|  |  - Home Hero Tabs  |  |  - 4-Tab AI Composer |  |  - AI Video NLE    |  |  - /share/videos  |  |
|  |  - 5 Use-Case Tabs |  |  - Library & Folders |  |  - Visual Canvas   |  |  - /share/guide   |  |
|  |  - Pricing & FAQ   |  |  - Team Insights     |  |  - Brand Kit 13Tab |  |  - /embed/[pid]   |  |
|  +---------+----------+  +----------+-----------+  +---------+----------+  +---------+---------+  |
|            |                        |                        |                       |            |
+------------+------------------------+------------------------+-----------------------+------------+
             | SSR / REST             | REST / JSON            | SSE Stream / PUT      | Beacon API
             v                        v                        v                       v
+---------------------------------------------------------------------------------------------------+
|                               NEXT.JS API & ORCHESTRATION LAYER                                   |
|                                                                                                   |
|  +------------------------+  +-------------------------+  +------------------------------------+  |
|  | Auth & Workspace API   |  | AI Orchestration Engine |  | Media & Export Pipeline            |  |
|  | - /api/login           |  | - Brand Kit Scraper     |  | - Remotion Server Renderer (MP4)   |  |
|  | - /api/workspaces/*    |  | - 7-Stage Video Agent   |  | - Flow Video/GIF Exporter          |  |
|  | - Credit Ledger        |  | - Avery Visuals Agent   |  | - Visual Multi-Preset PNG/MP4      |  |
|  | - RBAC & Plan Entitlements| - Translations & TTS    |  | - Asset Upload & Thumbnailer       |  |
|  +-----------+------------+  +------------+------------+  +-----------------+------------------+  |
+--------------|----------------------------|---------------------------------|---------------------+
               |                            |                                 |
               v                            v                                 v
+------------------------------+  +-----------------------------+  +--------------------------------+
| PostgreSQL / SQLite (Prisma) |  | Headless Playwright + LLMs  |  | Object Storage (/public/media) |
| - Relational + JSONB Schemas |  | - Live DOM/CSS Extraction   |  | - Step Screenshots & Videos    |
| - Analytics & Leads Tables   |  | - OpenAI / ElevenLabs /     |  | - Generated Voiceovers & SFX   |
| - Real-Time Session Logs     |  |   Deterministic Synthesis   |  | - Exported 1080p/4K MP4s       |
+------------------------------+  +-----------------------------+  +--------------------------------+
```

---

## 2. Design System & CSS Token Specification

Extracted from the 279 production CSS custom properties across `www.arcade.software` and `app.arcade.software`:

### 2.1 Surface 1: Marketing Website Theme (`[data-surface="marketing"]` — `01_www_*`–`25_www_*`)
```css
[data-surface="marketing"] {
  /* Backgrounds */
  --mkt-bg-cream: #F6F4EE;
  --mkt-bg-cream-elevated: #EFECE4;
  --mkt-bg-white: #FFFFFF;
  --mkt-bg-obsidian: #0D0E12;
  --mkt-bg-slate-card: #16181F;

  /* Typography & Ink */
  --mkt-text-primary: #111215;
  --mkt-text-secondary: #4A4D55;
  --mkt-text-muted: #767A85;
  --mkt-text-on-dark: #F9FAFB;

  /* Brand Accents */
  --mkt-accent-blue: #2563EB;
  --mkt-accent-indigo: #4F46E5;
  --mkt-accent-violet: #7C3AED;
  --mkt-accent-coral: #F97316;
  --mkt-accent-emerald: #10B981;

  /* Borders & Shadows */
  --mkt-border-subtle: rgba(17, 18, 21, 0.08);
  --mkt-border-strong: rgba(17, 18, 21, 0.16);
  --mkt-shadow-hero: 0 24px 64px -12px rgba(15, 23, 42, 0.14);
  --mkt-radius-card: 20px;
  --mkt-radius-pill: 9999px;
}
```

### 2.2 Surface 2: Application Workspace & Studio Theme (`[data-surface="app"]` — `30_app_*`–`152e_*`)
```css
[data-surface="app"] {
  /* App Shell & Canvas */
  --app-bg-canvas: #F8FAFC;         /* Main workspace & studio canvas backdrop */
  --app-bg-sidebar: #F8FAFC;        /* 240px left navigation sidebar */
  --app-bg-surface: #FFFFFF;        /* Cards, modals, inspectors, popovers */
  --app-bg-subtle: #F1F5F9;         /* Hover pills, secondary buttons, input wells */
  --app-bg-active: #EEF2FF;         /* Active sidebar nav item & selected tabs */
  --app-bg-timeline-dark: #0F172A;  /* NLE timeline drawer & dark video chrome */

  /* Text Hierarchy */
  --app-text-primary: #0F172A;      /* Primary headings & labels */
  --app-text-secondary: #475569;    /* Body descriptions & secondary controls */
  --app-text-muted: #94A3B8;        /* Placeholders, timestamps, disabled state */

  /* Primary Interactive & Semantic Colors */
  --app-primary: #4F46E5;           /* Primary CTA buttons, active rings, hotspots */
  --app-primary-hover: #4338CA;
  --app-blue-cta: #1D4ED8;          /* Upgrade & high-emphasis action buttons */
  --app-success: #10B981;           /* Completed agent stages, published status */
  --app-warning: #F59E0B;           /* Credit threshold warnings */
  --app-danger: #EF4444;            /* Delete actions & NLE playhead cursor */
  --app-track-panzoom: #8B5CF6;     /* NLE Pan & Zoom track clips */
  --app-track-voiceover: #3B82F6;   /* NLE Voiceover track clips */
  --app-track-scene: #10B981;       /* NLE Scene blocks */
  --app-track-music: #EC4899;       /* NLE Music waveform strip */
  --app-track-sfx: #F59E0B;         /* NLE Sound effect markers */

  /* Borders, Radii & Elevation */
  --app-border: #E2E8F0;
  --app-border-focus: #6366F1;
  --app-radius-xs: 6px;
  --app-radius-sm: 8px;
  --app-radius-md: 12px;
  --app-radius-lg: 16px;
  --app-radius-pill: 9999px;
  --app-shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.05);
  --app-shadow-md: 0 4px 12px rgba(15, 23, 42, 0.08);
  --app-shadow-popover: 0 12px 32px -4px rgba(15, 23, 42, 0.15);
}
```

### 2.3 Surface 3: Dynamic Brand Kit Theme Injection (`<BrandKitScope />`)
When a Brand Kit is active (e.g., `whoami.genisisiq.com` Brand Kit `XE1uVIkZSLQJth6oUMJ0` captured in `144_brand_kit_colors.png` and `132a_whoami_video_design_scene1.png`), `<BrandKitScope />` injects:
```css
.brand-kit-scope {
  --brand-bg-primary: #111111;      /* Obsidian Dark */
  --brand-bg-secondary: #F4EFE6;    /* Bauhaus Warm Ivory */
  --brand-text-primary: #F4EFE6;    /* Ivory on Dark */
  --brand-text-secondary: #9CA3AF;  /* Muted Slate */
  --brand-accent-primary: #D4AF37;  /* Bauhaus Gold */
  --brand-accent-secondary: #C42B1C;/* Bauhaus Crimson */
  --brand-accent-tertiary: #0047AB; /* Bauhaus Cobalt Blue */
  --brand-font-heading: 'Inter', sans-serif;
  --brand-font-body: 'Inter', sans-serif;
}
```

---

## 3. Master UI Layout Shells & Viewport Geometry

### 3.1 Shell A: Workspace Dashboard Shell (`240px` Left Sidebar + Scrollable Main Stage)
Used by `/workspaces/[slug]/home`, `/teams/me/arcades` (Library), `/insights`, `/leads`, `/inbox`, `/memory`, `/connectors`, `/impact-analysis`, `/usage`, `/purchase-credits`, `/referral`, `/deleted`, `/archived` (`30`–`63`, `141a`–`146b`, `152a`–`152c`).

```
+--------------------------------------------------------------------------------------------------+
| [J] jack wolf's workspace v  [+]   |                                                             |
| ---------------------------------- |          Welcome to Arcade, jack!                           |
| [ + Create                      ]  |          What would you like to create?                     |
| [ Search                     ^K ]  |                                                             |
|                                    |       ( Video )  ( Demo )  ( Visuals )  ( Collection )      |
|  Home                              |   +-----------------------------------------------------+   |
|  Brand Kits                        |   | Describe the video you want to create...            |   |
|                                    |   |                                                     |   |
|  Just me                           |   | [+ Add media] [16:9 v] [30s v] [Brand Kit v]   [->] |   |
|    Library                         |   +-----------------------------------------------------+   |
|    Insights                        |                                                             |
|                                    |   Getting started (5/5 completed)     [Claim 200 credits]   |
|  Teams                             |   +---------+ +---------+ +---------+ +---------+ +-------+ |
|    + Create a team                 |   |Brand Kit| |AI Video | |  Demo   | | Visuals | | Share | |
|                                    |   +---------+ +---------+ +---------+ +---------+ +-------+ |
| ---------------------------------- |                                                             |
|  Upgrade (Free Plan 1/3)           |   Recent                     [Last modified v] [Grid|List]  |
|  AI Credits (300 left)        [>]  |   +------------------+ +------------------+ +-------------+ |
|  Trash                             |   | whoami Visuals   | | whoami Launch    | | whoami Demo | |
|  Help & resources             [?]  |   +------------------+ +------------------+ +-------------+ |
+--------------------------------------------------------------------------------------------------+
|<------------ 240px --------------->|<-------------------- calc(100vw - 240px) ------------------>|
```

### 3.2 Shell B: Interactive Demo (`Flow`) Editor Shell (`56px` Top Bar + `200px` Step Rail + Stage + `320px` Inspector + `48px` Tool Rail)
Used by `/flows/[pid]/edit` (`71_app_flow_editor_main.png` – `92_flow_editor_preview_mode.png`).

```
+--------------------------------------------------------------------------------------------------+
| [<-] Demo Title [v] [Undo][Redo] | (Hotspot)(Callout)(Area)(Pan&Zoom)(Voice)(Rec) | [Preview][Share]|
+--------------------------------------------------------------------------------------------------+
| Steps (4) [+] |                                                     | Hotspot Inspector  | [Des] |
| ------------- |   +---------------------------------------------+   | ------------------ | [Lib] |
| [Start]       |   |  [Browser Wrapper: whoami.genisisiq.com]    |   | Style: [Beacon v]  | [Trn] |
|  Cover        |   |                                             |   | Color: [#D4AF37 ]  | [Var] |
|               |   |            ( * ) <-- Pulsing Hotspot        |   | Text:              | [Mnu] |
| [1] Step 1 .. |   |            +---------------------------+    |   | [Verify SC-100  ]  | [Lin] |
|  1 hotspot    |   |            | Click to verify SC-100    |    |   | Position: [Auto v] | [Scr] |
|               |   |            +---------------------------+    |   | Target:            |       |
| [2] Step 2 .. |   |                                             |   | [Next step      v] |       |
|  Chapter      |   +---------------------------------------------+   | [x] Autoplay       |       |
|               |                                                     | [Delete hotspot]   |       |
+---------------+-----------------------------------------------------+--------------------+-------+
|<--- 200px --->|<----------- Flex 1 Center Canvas Stage ------------>|<----- 320px ------>|<-48px>|
```

### 3.3 Shell C: Custom Code AI Video Studio & 5-Track NLE Shell (`52px` Top Bar + `380px` Left Agent/Design Panel + Center Remotion Stage + Expandable Bottom 5-Track NLE + Contextual Right Track Inspector)
Used by `/prompt-videos/custom/[pid]/edit` (`126`–`139h`, `150a`–`150c`).

```
+--------------------------------------------------------------------------------------------------+
| [<-] whoami.genisisiq.com Launch  [v1 v]                        [Share]  [Export v]  [...]       |
+--------------------------------------------------------------------------------------------------+
| ( Chat )  ( Design )            |                                           | Voiceover Inspector|
| ------------------------------- |   +-----------------------------------+   | ------------------ |
| Colors                          |   |                                   |   | Voice:             |
|  [#111] [#F4E] [#D4A] [#C42]    |   |     DOERS, NOT TALKERS.           |   | [Ava (Natural)  v] |
|                                 |   |     120+ Verified AI Badges       |   | Speed:  [1.0x ===] |
| [All scenes                 v]  |   |     2,300+ AI Use Cases           |   | Volume: [100% ===] |
| Scene 1 Text                    |   |                                   |   | Script (Scene 1):  |
|  TitleText:                     |   |   [Subtitles: Doers, not talkers] |   | [Most portfolios..]|
|  [DOERS, NOT TALKERS.        ]  |   +-----------------------------------+   | [Edit pronunciat.] |
|  SubtitleText:                  |     [>|] 0:04 / 0:30   [CC] [16:9] [^]    | [Edit all scripts] |
|  [AI-Enabled Cloud Architect ]  +-------------------------------------------+--------------------+
|  Metric1Value: [120+         ]  | 0s       5s       10s      15s      20s      25s      30s      |
|  Metric2Value: [2,300+       ]  | Pan&Zoom |  [=== Pan & Zoom ===]     [=== Pan & Zoom ===]      |
|                                 | Voiceover| [VO Scene 1] [VO Scene 2] [VO Scene 3] [VO Scene 4] |
| [@Scene] [Ask AI to edit... ->] | Scenes   | [ Scene 1  ] [ Scene 2  ] [ Scene 3  ] [ Scene 4  ] |
|                                 | Music    | [~~~~~~~~~~~ Upbeat Bauhaus Synth ~~~~~~~~~~~~~~~~] |
|                                 | SFX      |   [Whoosh]      [Click]      [Pop]        [Chime]   |
+---------------------------------+----------------------------------------------------------------+
|<------------ 380px ------------>|<------------------- Flex 1 Stage + NLE ----------------------->|
```

### 3.4 Shell D: Multi-Format Visual Canvas Editor Shell (`56px` Top Bar + `260px` Left Multi-Format List + Center Responsive Stage + `340px` Right Inspector)
Used by `/visual-projects/[pid]/edit` (`151f`–`152e`).

```
+--------------------------------------------------------------------------------------------------+
| [<-] Visual project                                                                 [Export]     |
+--------------------------------------------------------------------------------------------------+
| Visuals        [+ Add visual] |                                       | Template: [Capture    v] |
| ----------------------------- |     +---------------------------+     | Animate:  (o) On         |
| +---------------------------+ |     | [W] whoami.genisisiq.com  |     | Logo:     (o) On         |
| | [1:1 Preview]             | |     |                           |     | ------------------------ |
| | Instagram post square     | |     | 2,300+ AI use cases       |     | Background (Image|Color) |
| | 1080 x 1080               | |     | indexed. Verify SC-100 ↗  |     | [Bg1][Bg2][Bg3][Bg4][Bg5]|
| +---------------------------+ |     |                           |     | [Generate bg with Avery] |
| +---------------------------+ |     | +-----------------------+ |     | ------------------------ |
| | [1.91:1 Preview]          | |     | | [Portfolio Preview]   | |     | Text                     |
| | Linkedin post landscape   | |     | +-----------------------+ |     | [2,300+ AI use cases...] |
| | 1200 x 626                | |     |       ( Verify Now )      |     | [Generate with Avery]    |
| +---------------------------+ |     +---------------------------+     | Call to action           |
|                               |             [ - ] 75% [ + ]           | Label: [Verify Now     ] |
+-------------------------------+---------------------------------------+--------------------------+
|<----------- 260px ----------->|<----------- Center Stage ------------>|<-------- 340px --------->|
```

### 3.5 Shell E: 13-Tab Brand Kit Editor Shell (`240px` Brand Kit Sub-Nav + Scrollable Section Editor)
Used by `/workspaces/[slug]/settings/brand-kits/[id]/[[...tab]]` (`142b`–`144_brand_kit_*`).
- **Left Sub-Navigation**:
  - Back link `<- Brand Kits`
  - Brand selector header (`whoami.genisisiq.com` + `Default` badge)
  - `Home`
  - **Foundations**: `Sources`, `Logos`, `Colors`, `Fonts`
  - **Visuals**: `Photography`, `Backgrounds`, `Illustrations`
  - **Messaging**: `Product`, `Voice`, `Tones`
  - **Templates**: `Demo`, `Share page`, `Custom elements`

---

## 4. Component Hierarchy & Frontend State Architecture

### 4.1 Core Zustand State Stores

1. **`useWorkspaceStore`**:
   - Holds `currentUser`, `activeWorkspace`, `teams[]`, `credits: { quota, used, bonus, remaining }`, `onboardingChecklist: { brandKit, video, demo, visuals, share, claimedBonus }`, `isCommandPaletteOpen`, `isCreateModalOpen`.
2. **`useFlowEditorStore`**:
   - Holds `flow: FlowDocument`, `selectedStepId: string`, `activeTool: 'select' | 'hotspot' | 'callout' | 'area' | 'pan_zoom' | 'voiceover' | 'recording'`, `selectedOverlayId: string | null`, `activeRightRailPanel: 'design' | 'library' | 'translations' | 'variables' | 'menu' | 'linear' | 'script' | null`, `activeLocale: string`, `undoStack: FlowDocument[]`, `redoStack: FlowDocument[]`, `isImageEditorOpen: boolean`.
3. **`useVideoEditorStore`**:
   - Holds `video: PromptVideoDocument`, `session: PromptVideoSession`, `leftTab: 'chat' | 'design'`, `selectedSceneFilter: 'all' | string`, `currentFrame: number`, `fps: 30`, `isPlaying: boolean`, `showCaptions: boolean`, `isTimelineExpanded: boolean`, `timelineZoom: number`, `selectedTrackItem: { track: 'panZoom' | 'voiceover' | 'scenes' | 'music' | 'sfx', itemId: string } | null`, `exportState: { status: 'idle' | 'rendering' | 'ready', resolution: '720p' | '1080p' | '4k', fps: 24 | 30 | 60, downloadUrl?: string }`.
4. **`useVisualEditorStore`**:
   - Holds `project: VisualProjectDocument`, `selectedVisualId: string`, `canvasZoom: number`, `isTemplatePickerOpen: boolean`, `isAddVisualPopoverOpen: boolean`, `isGeneratingWithAvery: { background: boolean, headline: boolean }`.

---

## 5. Interactive State Machines

### 5.1 Interactive Demo (`Flow`) Player State Machine
```
[STEP_LOADED]
   |
   +--> If step.type === 'CHAPTER':
   |       |-- If chapter.mode === 'BUTTONS' --> Wait for user CTA button click
   |       |       |-- action === 'NEXT'       --> Transition to stepIndex + 1
   |       |       |-- action === 'JUMP_STEP'  --> Transition to targetStepId
   |       |       |-- action === 'URL'        --> Open external URL + log CHAPTER_CTA_CLICK
   |       |       +-- action === 'REPLAY'     --> Transition to stepIndex = 0
   |       +-- If chapter.mode === 'FORM'    --> Validate inputs -> POST /api/leads -> Transition to stepIndex + 1
   |
   +--> If step.type === 'IMAGE':
   |       |-- Apply step.panAndZoom camera transform (if enabled)
   |       |-- Autoplay step.voiceover audio (if unmuted)
   |       +-- Render step.areas[], step.hotspots[], step.callouts[]
   |               |-- On Hotspot Click/Hover or Callout 'Next' --> Advance to targetStepId or stepIndex + 1
   |
   +--> If step.type === 'VIDEO':
           |-- Play HTML5 <video> from trimStartSec to trimEndSec at playbackRate
           +-- On video 'ended' --> Auto-advance to stepIndex + 1 (or pause if hotspot overlay exists)
```

### 5.2 7-Stage AI Video Agent State Machine (`PromptVideoSession`)
```
[IDLE]
  | (POST /api/prompt-videos/generate with { prompt, url, aspectRatio, durationSec, brandKitId })
  v
[STAGE 1: UNDERSTAND]      -> Crawls target URL / loads Brand Kit & attached Flow assets
  v
[STAGE 2: STORYBOARD]      -> Allocates N scenes (e.g. 4 scenes for 15s, 6 scenes for 30s) & templates
  v
[STAGE 3: SCRIPT]          -> Generates per-scene voiceover narration & on-screen copy
  v
[STAGE 4: GENERATE_SCENES] -> Emits Scene 1..N Remotion props + builds JSON `designSchema`
  v
[STAGE 5: REVIEW]          -> Verifies contrast ratios, text lengths & frame durations
  v
[STAGE 6: VOICEOVER]       -> Synthesizes per-scene TTS audio clips + word-level caption timestamps
  v
[STAGE 7: SOUND_EFFECTS]   -> Places background Music track + transition SFX markers (`Whoosh`, `Click`, `Pop`)
  v
[COMPLETED]                -> Unlocks `Design` tab, 5-track NLE timeline, `Share`, and `Export`
```

---

## 6. Spatial Coordinate, Camera Zoom & NLE Timeline Math

### 6.1 Flow Canvas Normalized Coordinates (`[0..1]`)
Given a stage container element with bounding client rect `(stageLeft, stageTop, stageWidth, stageHeight)`:
- **Pointer Event to Normalized Coordinate**:
  ```ts
  const normX = Math.min(1, Math.max(0, (clientX - stageLeft) / stageWidth));
  const normY = Math.min(1, Math.max(0, (clientY - stageTop) / stageHeight));
  ```
- **Tooltip Auto-Placement (`position === 'auto'`)**:
  - If `normY < 0.28` -> place tooltip `bottom`
  - Else if `normY > 0.72` -> place tooltip `top`
  - Else if `normX > 0.65` -> place tooltip `left`
  - Else -> place tooltip `right`

### 6.2 Pan & Zoom CSS Matrix Interpolation
For a `PanAndZoom` region `{ x, y, width, height }` in `[0..1]`:
```ts
const scale = Math.min(3.5, Math.max(1.15, Number((1 / Math.max(width, height)).toFixed(2))));
const centerX = x + width / 2;
const centerY = y + height / 2;
const translateXPercent = (0.5 - centerX) * 100;
const translateYPercent = (0.5 - centerY) * 100;
const style = {
  transformOrigin: '50% 50%',
  transform: isZoomActive
    ? `scale(${scale}) translate(${translateXPercent}%, ${translateYPercent}%)`
    : 'scale(1) translate(0%, 0%)',
  transition: 'transform 650ms cubic-bezier(0.22, 1, 0.36, 1)',
};
```

### 6.3 5-Track NLE Timeline Frame-to-Pixel Mapping
Given `totalDurationSec` (e.g., `30`), `fps = 30` (`totalFrames = 900`), base scale `basePxPerSec = 36`, and `timelineZoom` (`0.5` to `3.0`):
```ts
const pxPerSec = basePxPerSec * timelineZoom;
const timeToPx = (sec: number) => sec * pxPerSec;
const pxToTime = (px: number) => Math.max(0, Math.min(totalDurationSec, px / pxPerSec));
const frameToPx = (frame: number) => (frame / fps) * pxPerSec;
```

---

## 7. Complete Modal, Popover & Context Menu Catalog

Every modal and popover captured across the 314 screenshots is included in the component library:

| Component Name | Trigger Location | Key Controls & Behavior | Screenshot Ref |
|---|---|---|---|
| `<AspectRatioMenu />` | Home Video Composer & Video Studio | `16:9 Landscape`, `9:16 Portrait`, `1:1 Square` | `31`, `124a` |
| `<VideoLengthMenu />` | Home Video Composer & Video Studio | `15s`, `30s`, `45s`, `60s` | `32`, `124b` |
| `<AddMediaModal />` | Home Video Composer & Visuals Studio | Tabs: `Arcades` (existing Flows), `Uploads`, `Brand Kit assets` | `33`, `148c` |
| `<AiCreditsPopover />` | Left Sidebar `AI Credits` bar | Remaining credits progress ring, cycle reset date, `Purchase credits`, `Upgrade` | `42` |
| `<CreateAssetMenu />` | Left Sidebar `+ Create` button | `Interactive demo`, `Video`, `Visuals`, `Collection` | `43` |
| `<CommandPaletteModal />` | `⌃K` / `⌘K` or Sidebar `Search` | Instant fuzzy search across all workspace assets + quick actions | `44` |
| `<HelpResourcesMenu />` | Bottom-left `?` button | `Help center`, `Keyboard shortcuts`, `Download Chrome extension`, `Download desktop app`, `What's new` | `45` |
| `<StarterDemoModal />` | Home `Starter templates` cards | Interactive playable Flow preview + `Use template` button | `64` |
| `<DesktopAppModal />` | Home Demo tab `Record desktop app` | Download macOS/Windows desktop recorder + deep-link launcher | `70b` |
| `<GenerateWithAiModal />` | Flow Editor right rail `Generate with AI` | Prompt box + tone selector to auto-generate callouts, chapters & voiceover | `75`, `91e` |
| `<AddStepPopover />` | Flow Editor left rail `+` button | `Upload media`, `Add chapter`, `Paste from clipboard`, `From Library` | `82c` |
| `<StepContextMenu />` | Flow Editor step thumbnail `...` | `Duplicate`, `Save to library`, `Replace background`, `Edit image`, `Delete` | `82e` |
| `<StepImageEditorModal />` | Flow Editor step thumbnail pencil icon | Crop, Blur/Redact rectangle, Arrow, Rectangle, Text annotation, Padding | `82h`, `82i` |
| `<FlowSharePopover />` | Flow Editor top-right `Share` button | Visibility toggle (`Public`/`Private`), `Copy link`, `Embed`, `Export Video/GIF` | `91` |
| `<FlowEmbedModal />` | Flow Share Popover -> `Embed` | Code tabs (`HTML/Iframe`, `React`, `Next.js`, `Webflow`, `Notion`, `HubSpot`) + `Copy code` | `91c` |
| `<FlowVideoExportModal />` | Flow Share Popover -> `Video or GIF` | Format (`MP4` / `GIF`), Quality (`720p` / `1080p` / `4K`), `Export` progress | `91d` |
| `<BrandKitSetupModal />` | Home checklist / Brand Kits `+ New` | URL input (`https://whoami.genisisiq.com`) -> 6-step AI extraction progress -> Result summary | `120`–`123` |
| `<SceneTagPickerMenu />` | AI Video Chat `@Scene` button | `@Scene 1` .. `@Scene N` selector to scope AI follow-up edits | `133` |
| `<VideoVersionMenu />` | AI Video top bar `v1` pill | Version history list, `Duplicate to new video`, `Revert to this version` | `134` |
| `<AddSceneModal />` | AI Video timeline `+` between scenes | Prompt or Scene Template picker (`Hero`, `Browser Demo`, `Metrics`, `Cards`, `CTA`) | `135` |
| `<VideoShareModal />` | AI Video top-right `Share` button | Public link copy (`/share/videos/[pid]`), access toggle, embed snippet | `136` |
| `<VideoExportPopover />` | AI Video top-right `Export` button | Resolution (`720p`/`1080p`/`4K`), Frame rate (`24`/`30`/`60 FPS`), `Export Video` -> `Download` | `137`, `139e` |
| `<PronunciationModal />` | Voiceover Inspector `Edit pronunciation` | List of `{ word, replacement }` phonetic rules + `+ Add rule` | `139g` |
| `<EditAllScriptsModal />` | Voiceover Inspector `Edit all scripts` | Unified modal listing `Scene 1`..`Scene N` scripts for bulk editing & regeneration | `139h` |
| `<CollectionHeaderModal />`| Collection Editor `Edit header` | Logo, Title, Subtitle, CTA button label & URL, Header background picker | `147b` |
| `<CollectionAddModal />` | Collection Editor `+ Add Arcades` | Multi-select modal of workspace Demos and AI Videos | `147c` |
| `<VisualTemplatePopover />`| Visual Canvas Editor `Template` field | Visual layout template cards (`Capture`, `Spotlight`, `Split`, `Minimal`, `Bento`) | `151h` |
| `<AddVisualPresetPopover />`| Visual Canvas Editor `+ Add visual` | 7 platform accordions (`LinkedIn`, `Facebook`, `Instagram`, `X`, `TikTok`, `YouTube`, `Google Ads`) with 28 size presets | `151i` |
| `<VisualExportModal />` | Visual Canvas Editor `Export` button | Multi-select formats (`PNG` / `MP4`), resolution scale (`1x`/`2x`), `Download` | `151j` |
