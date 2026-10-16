# Arcade (`www.arcade.software` & `app.arcade.software`) — Comprehensive Reverse-Engineering, Architecture & Clone Specification Report

> **Target Application**: `https://www.arcade.software` (Marketing & Public Site) + `https://app.arcade.software` (Core SaaS Web Application)
> **Live Test & Generation Target Used**: `https://whoami.genisisiq.com` (Used to generate a real Brand Kit, two AI Launch Videos, AI Social/Ad Visuals, and an Interactive Demo Flow)
> **Total Local Screenshots Captured**: **307 PNG screenshots** in `/home/azadmin/Arcade/screenshots/`

---

## Table of Contents

1. [Executive Summary & Product Pillars](#1-executive-summary--product-pillars)
2. [System Architecture & Tech Stack](#2-system-architecture--tech-stack)
3. [Authentication, Session Lifecycle & Token Refresh Protocol](#3-authentication-session-lifecycle--token-refresh-protocol)
4. [Complete Next.js Route Catalog (All 160 Routes)](#4-complete-nextjs-route-catalog-all-160-routes)
5. [Internal REST API Catalog (`/api/*`)](#5-internal-rest-api-catalog-api)
6. [Core Firestore & JSON Data Schemas](#6-core-firestore--json-data-schemas)
7. [Design System, Typography & CSS Token Specification](#7-design-system-typography--css-token-specification)
8. [Marketing Website (`www.arcade.software`) Specification](#8-marketing-website-wwwarcadesoftware-specification)
9. [Workspace Shell, Navigation, AI Composer & Onboarding (`app.arcade.software`)](#9-workspace-shell-navigation-ai-composer--onboarding-apparcadesoftware)
10. [Feature Pillar 1: Brand Kit 1-Minute AI Extractor & 13-Tab Brand Kit Editor (`whoami.genisisiq.com`)](#10-feature-pillar-1-brand-kit-1-minute-ai-extractor--13-tab-brand-kit-editor-whoamigenisisiqcom)
11. [Feature Pillar 2: Agentic AI Video Studio & Custom Code NLE Video Editor (`whoami.genisisiq.com`)](#11-feature-pillar-2-agentic-ai-video-studio--custom-code-nle-video-editor-whoamigenisisiqcom)
12. [Feature Pillar 3: Interactive Demo (`Flow`) Editor, Player, Guide & Insights](#12-feature-pillar-3-interactive-demo-flow-editor-player-guide--insights)
13. [Feature Pillar 4: AI Visuals Studio & Multi-Format Visual Canvas Editor (`whoami.genisisiq.com`)](#13-feature-pillar-4-ai-visuals-studio--multi-format-visual-canvas-editor-whoamigenisisiqcom)
14. [Feature Pillar 5: Collections, Team Insights, Settings & Billing/Plans](#14-feature-pillar-5-collections-team-insights-settings--billingplans)
15. [Complete Screenshot Catalog (`/home/azadmin/Arcade/screenshots/`)](#15-complete-screenshot-catalog-homeazadminarcadescreenshots)
16. [End-to-End Implementation Blueprint for Cloning Arcade](#16-end-to-end-implementation-blueprint-for-cloning-arcade)

---

## 1. Executive Summary & Product Pillars

**Arcade** has evolved from an interactive product demo recorder into a unified **AI Storytelling & Product Marketing Platform** centered around four core creation modalities ("What are we creating today?") powered by a shared **Brand Kit** and **AI Credit** engine:

1. **AI Video (`PromptVideo` / Custom Code Remotion Studio)**:
   - Converts a website URL (e.g., `https://whoami.genisisiq.com`), text prompt, and optional media/demos into a multi-scene, broadcast-ready launch video.
   - Uses a **7-stage autonomous AI Agent** (*Checked your memory → Researched → Gathered assets → Planned the video → Created audio → Built scenes → Reviewed and polished*) that writes programmatic React/Remotion scenes with custom schema-driven `Design` controls (`Canvas Background`, palette colors, per-scene typography/text props) and a **5-track NLE Timeline** (`Pan & Zoom`, `Voiceover` with 18+ ElevenLabs voices & pronunciation/script editors, `Scenes 1..N`, `Music` with auto-fit & ducking, and auto-timed `Sound effects` like `Slide`, `Click`, `Impact`, `Type`).
   - Renders server-side MP4 exports at `1080p` or `4K` (`24`/`30`/`60 FPS`) and hosts public share pages at `/share/videos/[pid]`.

2. **Interactive Demo (`Flow`)**:
   - Step-by-step interactive product walkthroughs captured via Chrome Extension, Desktop App (`macOS` Apple Silicon/Intel & `Windows`), HTML/DOM Capture, or uploaded screenshots/videos.
   - Full canvas editor (`/flows/[pid]/edit`) supporting **Hotspots**, **Callouts**, **Areas (Blur/Highlight)**, **Pan & Zoom**, **Synthetic Voiceover (ElevenLabs TTS)**, **Camera/Mic Recording**, **Chapters** (with `Buttons` or **Lead Capture Forms** + multi-path branching), **AI Translations** (30+ languages), **Dynamic Personalization Variables** (`{{first_name}}`), **Linear (Storyboard) View**, **Script View**, **Auto-Generated Step-by-Step Guide** (`/flows/[pid]/guide`), **HTML/React Embeds**, **Video/GIF Export**, and **Per-Flow Insights**.

3. **AI Visuals (`VisualProject`)**:
   - Generates branded social announcement, product benefit, feature highlight, and website hero graphics from a prompt, Brand Kit, and optional Interactive Demo capture (`/workspaces/[workspaceSlug]/start-with-ai/visuals`).
   - Opens into a multi-format **Visual Canvas Editor** (`/visual-projects/[pid]/edit`) supporting **28 social & ad aspect-ratio presets across 7 platforms** (LinkedIn, Facebook, Instagram, X, TikTok, YouTube, Google Ads), animated mode (`Animate`), Avery AI background/headline regeneration, Brand Kit color swatches, and PNG/MP4 export.

4. **Collections (`Collection`)**:
   - Multi-asset landing pages (`/collections/[pid]/edit` & `/share/collections/[pid]`) that bundle multiple Arcades/Videos behind a branded hero header, custom CTA button, theme toggle, and horizontal card carousel.

5. **Brand Kits (`BrandKit`)**:
   - "1-Minute Setup" AI crawler that extracts a company's visual and verbal identity from any URL (tested live with `https://whoami.genisisiq.com` → `BrandKit` ID `XE1uVIkZSLQJth6oUMJ0`) into a **13-section Brand Kit Editor**: `Home`, `Sources`, `Logos`, `Colors`, `Fonts`, `Photography`, `Backgrounds` (including AI-generated backgrounds), `Illustrations`, `Product` (Tagline, Description, ICP, Key Messaging), `Voice`, `Tones`, `Demo` theme defaults, `Share page` chrome, and `Custom elements`.

---

## 2. System Architecture & Tech Stack

| Layer | Technology / Service | Evidence & Role in `app.arcade.software` |
|---|---|---|
| **Marketing Site (`www.arcade.software`)** | **Webflow** + Custom JS + Embedded Arcade Players | Webflow CMS collections for `/blog`, `/case-studies`, `/changelog`, `/showcase`; embeds live interactive demos via `https://demo.arcade.software/<shareId>?embed`. |
| **Web App Framework (`app.arcade.software`)** | **Next.js (Pages Router)** + React 18 + TypeScript | 160 routes in `window.__BUILD_MANIFEST`, SSR via `getServerSideProps` (`__NEXT_DATA__`), dynamic chunk loading. |
| **Styling & UI Primitives** | **Tailwind CSS** + **Radix UI** (`@radix-ui/react-*`) + CSS Custom Properties | 279 semantic `--color-*` design tokens supporting `light` and `dark` themes (`bg-surface-*`, `text-content-*`, `border-*`). |
| **Authentication & Identity** | **Firebase Authentication** (`arcade-cf7d5`) + `next-firebase-auth` | Cookie-backed SSR auth (`ArcadeApp.AuthUserTokens`, `ArcadeApp.AuthUserTokensSig`) + client-side IndexedDB (`firebaseLocalStorageDb`). |
| **Real-Time Database & State** | **Google Cloud Firestore** (`arcade-cf7d5`) | Stores `users`, `workspaces`, `teams`, `flows`, `brandKits`, `promptVideos`, `visualProjects`, `collections`, and live AI agent sessions (`sessionId`). |
| **Multiplayer Collaboration & Presence** | **Liveblocks** (`/api/liveblocks/auth`, `/api/liveblocks/user-meta`) | Real-time co-editing, presence avatars, and cursor/comment sync inside Flow and Video editors. |
| **Search & Discovery** | **Algolia** | Instant `Command + K` workspace search across Flows, Videos, Visuals, and Collections, plus public Community Showcase search. |
| **Video Streaming & Processing** | **Mux** (`stream.mux.com`) + **Remotion** (Custom Code Video Studio) | Mux HLS streaming and MP4 renditions for recorded video steps; Remotion/HTML5 iframe canvas for programmatic AI launch videos + server-side 1080p/4K MP4 rendering. |
| **AI Voiceover & Audio** | **ElevenLabs** | 18+ studio voices (`Matilda`, `Hope`, `Bradford`, `Arabella`, `Sam`, `Jane`, `Liam`, `Brandon`, `Lauren B`, `Frank Brown`, `Hale`, `Waverly`, `Siren`, `Nixon`, `Cherie`, `Mark`, `Charlotte`, `Alistair`), pronunciation dictionary rules, and 30+ language translations. |
| **Analytics & Telemetry** | **PostHog** + **Segment** + **Sentry** + **BigQuery** | Product analytics, feature flags (`featureFlags` in SSR `pageProps`), and viewer engagement telemetry (`Flow Insights` & `Team Insights`). |
| **Billing & Subscriptions** | **Stripe** | Plan subscriptions (`Free`, `Pro $32-$38/mo`, `Growth $42.50-$50/mo`, `Enterprise`) and AI Credit packs (`/purchase-credits`). |

---

## 3. Authentication, Session Lifecycle & Token Refresh Protocol

### 3.1 Cookie Architecture (`next-firebase-auth`)
`app.arcade.software` uses `next-firebase-auth` with Firebase project **`arcade-cf7d5`**:
- **Firebase Web API Key**: `AIzaSyD4AnnBN7VwVpRrlzFpznD9P29yvF6qieA`
- **Primary Auth Cookie**: `ArcadeApp.AuthUserTokens`
  - Format: URL-encoded, double-JSON-stringified object:
    ```json
    "{\"idToken\":\"<JWT_ID_TOKEN>\",\"refreshToken\":\"<FIREBASE_REFRESH_TOKEN>\"}"
    ```
- **Signature Cookie**: `ArcadeApp.AuthUserTokensSig` (`HttpOnly`, `Secure`, `SameSite=Strict` by default).

### 3.2 Programmatic Token Refresh Flow
Firebase `idToken` JWTs expire after **3,600 seconds (1 hour)**. To refresh programmatic sessions (such as Playwright automation):
1. **Exchange `refreshToken` for a fresh `id_token`**:
   ```bash
   curl -s -X POST "https://securetoken.googleapis.com/v1/token?key=AIzaSyD4AnnBN7VwVpRrlzFpznD9P29yvF6qieA" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=refresh_token&refresh_token=<REFRESH_TOKEN>"
   ```
2. **Mint fresh signed `ArcadeApp.AuthUserTokens` + `ArcadeApp.AuthUserTokensSig` cookies**:
   ```bash
   curl -i -s -X POST "https://app.arcade.software/api/login" \
     -H "Authorization: <NEW_ID_TOKEN>" \
     -H "Content-Type: application/json"
   ```
3. **Browser / Playwright Hydration Quirk (`SameSite` & IndexedDB)**:
   - `/api/login` sets `SameSite=Strict` on `ArcadeApp.AuthUserTokens`. In headless Chromium (`context.addCookies`), set `sameSite: "Lax"` so top-level `page.goto()` requests always include the auth cookies.
   - Client-side Firestore listeners read credentials from `IndexedDB` (`firebaseLocalStorageDb`). On a fresh browser context, navigating to `/workspaces/[workspaceSlug]/home` and waiting ~4 seconds allows `next-firebase-auth` to sync the cookie token into `firebaseLocalStorageDb` before navigating to Firestore-heavy routes (`/prompt-videos/custom/[pid]/edit`, `/visual-projects/[pid]/edit`, `/settings/brand-kits/[id]`).

---

## 4. Complete Next.js Route Catalog (All 160 Routes)

Extracted directly from `window.__BUILD_MANIFEST.sortedPages` on `app.arcade.software`:

### 4.1 Workspace & Dashboard Routes (`/workspaces/[workspaceSlug]/*`)
| Route Pattern | Purpose & UI View |
|---|---|
| `/workspaces/[workspaceSlug]` | Redirects to `/workspaces/[workspaceSlug]/home` |
| `/workspaces/[workspaceSlug]/home` | **Workspace Home**: Greeting, 4-tab AI Composer (`Video`, `Demo`, `Visuals`, `Collection`), Feed tabs (`Recent`, `Trending`, `Review and Refresh`, `Pending Approval`), Starter Templates |
| `/workspaces/[workspaceSlug]/library` | **My Library (`Just me`)**: Folder tree + grid/list table of Arcades, Videos, Visuals, and Collections |
| `/workspaces/[workspaceSlug]/shared` | **Shared With Me**: Cross-user shared assets |
| `/workspaces/[workspaceSlug]/projects` | **Projects**: Project-level grouping view |
| `/workspaces/[workspaceSlug]/videos` | **Videos Library**: Dedicated view for AI Launch Videos |
| `/workspaces/[workspaceSlug]/inbox` | **Inbox**: Notifications, review requests, and comments |
| `/workspaces/[workspaceSlug]/insights` | **Team Insights**: Workspace-wide analytics (`Activity`, `Audience`, `Arcades` tabs, CSV export, date & folder filters) |
| `/workspaces/[workspaceSlug]/leads` | **Viewer Leads**: Revealed leads, companies, and CRM sync table |
| `/workspaces/[workspaceSlug]/showcase` | **Community Showcase**: In-app browsable gallery of featured community Arcades |
| `/workspaces/[workspaceSlug]/deleted` | **Recently Deleted (Trash)**: Soft-deleted flows/videos/visuals with 30-day restore |
| `/workspaces/[workspaceSlug]/archived` | **Archived**: Archived flows and collections |
| `/workspaces/[workspaceSlug]/memory` | **AI Memory**: Persistent workspace context used by AI agents |
| `/workspaces/[workspaceSlug]/connectors` | **Connectors**: External data & workflow connectors |
| `/workspaces/[workspaceSlug]/impact-analysis` | **Impact Analysis**: Pipeline and conversion attribution dashboard |
| `/workspaces/[workspaceSlug]/usage` | **Usage**: Credit consumption & seat usage analytics |
| `/workspaces/[workspaceSlug]/purchase-credits` | **Purchase AI Credits**: Self-serve AI credit top-up |
| `/workspaces/[workspaceSlug]/referral` | **Referral Program**: Invite peers to earn free credits/months |
| `/workspaces/[workspaceSlug]/resources` | **Resources Hub**: Onboarding guides, templates, and documentation |
| `/workspaces/[workspaceSlug]/start-with-ai/video` | **AI Video Studio Launcher**: Full-screen prompt + Brand Kit + Media launcher |
| `/workspaces/[workspaceSlug]/start-with-ai/visuals` | **AI Visuals Studio**: Prompt + Interactive Demo attachment + Brand Kit + 4 category tabs (`Social Announcement`, `Product Benefits`, `Feature Highlight`, `Website Hero`) |
| `/workspaces/[workspaceSlug]/teams/[teamId]/library` | **Team Library**: Shared team folders and Arcades |
| `/workspaces/[workspaceSlug]/teams/[teamId]/insights` | **Team-Scoped Insights**: Analytics filtered to a specific team |
| `/workspaces/[workspaceSlug]/teams/[teamId]/leads` | **Team-Scoped Leads**: Leads captured by a specific team's Arcades |

### 4.2 Workspace & Team Settings Routes (`/workspaces/[workspaceSlug]/settings/*`)
| Route Pattern | Purpose & UI View |
|---|---|
| `/workspaces/[workspaceSlug]/settings/general` | **General Settings**: Workspace name, slug, icon, default access permissions |
| `/workspaces/[workspaceSlug]/settings/privacy` | **Privacy & Security**: Viewer anonymity, cookie consent, data retention |
| `/workspaces/[workspaceSlug]/settings/brand-kits` | **Brand Kits Directory**: List of Brand Kits + `New Brand Kit` 1-Minute AI extractor |
| `/workspaces/[workspaceSlug]/settings/brand-kits/[brandKitId]` | **Brand Kit Editor (`Home` Overview)** |
| `/workspaces/[workspaceSlug]/settings/brand-kits/[brandKitId]/[section]` | **13-Tab Brand Kit Editor**: `sources`, `logos`, `colors`, `fonts`, `photography`, `backgrounds`, `illustrations`, `product`, `voice`, `tones`, `demo`, `share-page`, `custom-elements` |
| `/workspaces/[workspaceSlug]/settings/members` | **Members**: Seat management, roles (`Admin`, `Editor`, `Viewer`), invites |
| `/workspaces/[workspaceSlug]/settings/teams` | **Teams Management**: Create/manage sub-teams |
| `/workspaces/[workspaceSlug]/settings/billing` | **Billing**: Current plan, payment method, invoices |
| `/workspaces/[workspaceSlug]/settings/plans` | **Plans**: Plan comparison & upgrade flow |
| `/workspaces/[workspaceSlug]/settings/upgrade` | **Upgrade Checkout**: Pro (`$38/mo`) & Growth (`$50/mo`) self-serve upgrade (`?plan=pro_v4` / `?plan=growth_v2`) |
| `/workspaces/[workspaceSlug]/settings/integrations` | **Integrations**: HubSpot, Salesforce, Marketo, Slack, Google Analytics, Segment, Intercom, Zapier, Clearbit, Webhook |
| `/workspaces/[workspaceSlug]/settings/translations` | **Translations Settings**: Default target languages & glossary |
| `/workspaces/[workspaceSlug]/settings/custom-links` | **Custom Links & Domains**: Custom CNAME share domains & link shorteners |
| `/workspaces/[workspaceSlug]/settings/SyntheticVoices` | **Synthetic Voices**: Custom ElevenLabs voice clones & defaults |
| `/workspaces/[workspaceSlug]/settings/advanced` | **Advanced Settings**: SSO/SAML, SCIM provisioning, workspace deletion |

### 4.3 Interactive Demo (`Flow`) Routes (`/flows/*`)
| Route Pattern | Purpose & UI View |
|---|---|
| `/flows/new/edit` | Creates a new Flow and redirects to `/flows/[pid]/edit` |
| `/flows/[pid]` | Internal authenticated Flow preview |
| `/flows/[pid]/edit` | **Core Interactive Demo (`Flow`) Editor**: Canvas, step rail, Design panel, Hotspot/Callout/Area/Pan&Zoom/Voiceover/Recording tools, Chapters, Translations AI, Variables, Menu, Linear View, Script View |
| `/flows/[pid]/guide` | **Step-by-Step Guide View**: Auto-generated article/documentation view of the Flow with numbered screenshots and callouts |
| `/flows/[pid]/insights` | **Per-Flow Insights**: Views, completion rate, drop-off funnel per step, viewer breakdown |

### 4.4 AI Video Studio & Custom Code Video Editor Routes (`/prompt-videos/*`)
| Route Pattern | Purpose & UI View |
|---|---|
| `/prompt-videos/new/edit` | **AI Video Studio**: Prompt composer, Brand Kit selector, Aspect Ratio (`16:9`, `9:16`, `1:1`), Duration (`15s`, `30s`, `60s`), Media attachment |
| `/prompt-videos/[pid]` | Authenticated AI Video preview |
| `/prompt-videos/[pid]/edit` | Standard AI Video Editor (redirects to `/prompt-videos/custom/[pid]/edit?sessionId=...` for custom code videos) |
| `/prompt-videos/[pid]/insights` | Per-Video viewer analytics |
| `/prompt-videos/custom/[pid]` | Custom Code AI Video preview |
| `/prompt-videos/custom/[pid]/edit` | **Custom Code AI Video Editor**: Left `Chat` (7-stage AI agent log + `@scene` chat) & `Design` (schema-driven scene props) tabs, Center Remotion player canvas, Bottom **5-track NLE Timeline** (`Pan & Zoom`, `Voiceover`, `Scenes`, `Music`, `Sound effects`), Top-right `Share` & `Export` (`1080p`/`4K` MP4) |
| `/prompt-videos/custom/[pid]/render` | Headless Remotion render endpoint used by server-side MP4 export worker |

### 4.5 AI Visuals Studio & Visual Canvas Editor Routes (`/visual-projects/*`)
| Route Pattern | Purpose & UI View |
|---|---|
| `/visual-projects/new/edit` | Creates a new Visual Project |
| `/visual-projects/[pid]` | Visual Project preview |
| `/visual-projects/[pid]/edit` | **Visual Canvas Editor**: Left multi-visual rail (`+ Add visual` with 28 social/ad sizes), Center interactive canvas, Right inspector (`Template`, `Animate`, `Logo`, `Background Image/Color` + Avery AI generator, `Text` + Avery AI headline generator, `Call to action`, `Shadows`, `Export`) |
| `/visual-projects/[pid]/template-matrix` | Multi-template comparison matrix |

### 4.6 Collections, Public Share & Embed Player Routes (`/collections/*`, `/share/*`)
| Route Pattern | Purpose & UI View |
|---|---|
| `/collections/new/edit` & `/collections/[pid]/edit` | **Collection Editor**: Branded hero header (`Edit Header`), `+ Add Arcades` modal, theme selector, `Preview`, `Share` |
| `/share/[pid]` | **Public Interactive Demo Share Page**: Header chrome, CTA button, interactive player, reactions, view counter |
| `/share/[pid]/guide` | **Public Step-by-Step Guide Page**: Scrollable documentation view with `Interactive` / `Step-by-step` switcher |
| `/share/[pid]/export` | Headless player route used for server-side Video/GIF rendering |
| `/share/collections/[pid]` | **Public Collection Share Page** |
| `/share/videos/[pid]` | **Public AI Video Share Page**: Hosted MP4/HLS video player with Brand Kit styling (`140_whoami_video_share_player_ready.png`) |

### 4.7 Account, Onboarding, Auth & Internal Admin/Eval Routes
- **Auth & Onboarding**: `/login`, `/signup`, `/OTPVerification`, `/extension-sign-in`, `/desktop-sign-in`, `/onboarding`, `/account`
- **OAuth & Third-Party Callbacks**: `/hubspot/authorize`, `/salesforce/authorize`, `/slack/authorize`, `/intercom/install`, `/google-drive-picker`
- **Internal Admin & AI Eval Suite** (`/admin/*` — discovered via build manifest):
  - `/admin`, `/admin/lookup`, `/admin/design-system`, `/admin/prompts`, `/admin/evals/brand-eq`, `/admin/evals/brand-insights`, `/admin/evals/brandkit-v2`, `/admin/evals/chassis`, `/admin/evals/custom-code-video`, `/admin/evals/flow-generation`, `/admin/evals/image-edit`, `/admin/evals/ScenePlanning`, `/admin/evals/visuals-v1`, `/admin/evals/voiceover`.

---

## 5. Internal REST API Catalog (`/api/*`)

Extracted from client chunks (`bundle_analysis.json`) and live network traffic:

| Category | Endpoint | Method | Description |
|---|---|---|---|
| **Auth** | `/api/login` | `POST` | Exchanges Firebase `idToken` (`Authorization` header) for signed `ArcadeApp.AuthUserTokens` cookies |
| **Auth** | `/api/logout` | `POST` | Clears auth cookies |
| **User** | `/api/users` | `GET/POST/PUT` | User profile, onboarding checklist state, and credit claim actions |
| **Flows** | `/api/flows/create-empty` | `POST` | Creates a new `Flow` document in Firestore and returns `{ id }` |
| **Flows** | `/api/flows/[id]/duplicate` | `POST` | Deep-clones a Flow and its media references |
| **Flows** | `/api/flows/[id]/lock` | `POST` | Locks/unlocks Flow editing |
| **Flows** | `/api/flows/[id]/translate` | `POST` | Translates all Callout, Chapter, Hotspot, and Voiceover strings into target locales (`es`, `fr`, `de`, `ja`, `zh`, etc.) |
| **Flows** | `/api/flows/[id]/export` | `POST` | Triggers server-side MP4 (`360p`/`540p`/`720p`/`1080p`, `15`/`24`/`30`/`60 FPS`) or animated GIF render |
| **Flows** | `/api/flows/upload-url` | `POST` | Generates signed GCS upload URLs for screenshot/video/audio assets |
| **AI Generation** | `/api/ai/brand-kit` | `POST` | Crawls target URL (`https://whoami.genisisiq.com`), extracts DOM styles/logos/screenshots, and synthesizes Brand Kit via LLM + image generation |
| **AI Video** | `/api/prompt-videos/create` | `POST` | Initializes a `PromptVideo` + agent `sessionId` and starts the 7-stage Custom Code Video agent |
| **AI Video** | `/api/prompt-videos/[id]/export` | `POST` | Starts server-side Remotion MP4 rendering (`1080p`/`4K`, `24`/`30`/`60 FPS`) |
| **AI Visuals** | `/api/visual-projects/generate` | `POST` | Generates branded visual templates using Avery AI + Brand Kit (costs 50 AI credits) |
| **Voiceover** | `/api/voiceover/synthesize` | `POST` | Calls ElevenLabs TTS API to synthesize per-step or per-scene audio clips |
| **Collaboration** | `/api/liveblocks/auth` | `POST` | Issues scoped Liveblocks room tokens for real-time co-editing |
| **Collaboration** | `/api/liveblocks/user-meta` | `GET` | Resolves collaborator names and avatars |
| **Integrations** | `/api/integrations/[provider]/*` | `POST` | OAuth token exchange & webhook dispatch for HubSpot, Salesforce, Slack, Marketo, Zapier |

---

## 6. Core Firestore & JSON Data Schemas

### 6.1 User, Workspace & Team Schema (Extracted from SSR `__NEXT_DATA__`)
```json
{
  "user": {
    "id": "Y5iX9f2L...",
    "name": "jack wolf",
    "email": "wlfjck@gmail.com",
    "workspaceOrder": ["fBtA4gu4pOa2JSDRyFh0"],
    "completedOnboarding": true
  },
  "workspace": {
    "id": "fBtA4gu4pOa2JSDRyFh0",
    "slug": "workspace-5p8xcsfv",
    "name": "jack wolf's workspace",
    "plan": "free",
    "aiCredits": {
      "balance": 200,
      "onboardingBonusClaimed": true
    },
    "defaultBrandKitId": "XE1uVIkZSLQJth6oUMJ0"
  },
  "team": {
    "id": "IRCpFYa92u1D4JNMQTaJ",
    "workspaceId": "fBtA4gu4pOa2JSDRyFh0",
    "name": "Default Team",
    "isDefault": true
  }
}
```

### 6.2 Interactive Demo (`Flow`) Schema (`/flows/4fLyMFzH8BjqgKQF4Bd6/edit`)
```json
{
  "id": "4fLyMFzH8BjqgKQF4Bd6",
  "shareId": "319HqogqYEOZH11srxTM",
  "workspaceId": "fBtA4gu4pOa2JSDRyFh0",
  "teamId": "IRCpFYa92u1D4JNMQTaJ",
  "name": "Untitled (Thu Oct 15 2026)",
  "status": "PUBLISHED",
  "shareAccess": "PUBLIC",
  "aspectRatio": 1.6,
  "theme": {
    "primaryColor": "#6366F1",
    "textColor": "#FFFFFF",
    "wrapper": { "type": "BROWSER", "style": "LIGHT", "padding": "MEDIUM", "urlBarText": "https://whoami.genisisiq.com" },
    "background": { "type": "GRADIENT", "value": "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)" },
    "cursor": { "style": "DEFAULT", "size": "MEDIUM", "clickEffect": true, "magicCursor": false },
    "watermark": { "enabled": true, "logoUrl": null, "position": "BOTTOM_RIGHT" },
    "playerControls": { "showProgressBar": true, "showStepCounter": true, "showFullscreen": true }
  },
  "autoplay": { "enabled": false, "delaySeconds": 4 },
  "autoPanAndZoom": true,
  "optimizeForMobile": true,
  "backgroundAudio": { "url": null, "volume": 0.3, "loop": true },
  "syntheticVoice": { "voiceId": "callum", "enabled": false },
  "translations": { "defaultLocale": "en", "enabledLocales": [] },
  "variables": [
    { "key": "first_name", "fallback": "there" }
  ],
  "menu": {
    "enabled": false,
    "showChapters": true,
    "links": [{ "label": "Portfolio", "url": "https://whoami.genisisiq.com" }]
  },
  "steps": [
    {
      "id": "step_chapter_1",
      "type": "CHAPTER",
      "title": "Welcome to whoami.genisisiq.com",
      "subtitle": "Interactive Cloud & AI Solution Architecture Portfolio",
      "theme": "LIGHT",
      "alignment": "CENTER",
      "showLogo": true,
      "previewStyle": "INSET",
      "interactionType": "BUTTONS",
      "buttons": [
        { "id": "btn_1", "label": "Start Walkthrough", "style": "PRIMARY", "targetStepId": "step_img_1" }
      ],
      "form": {
        "enabled": false,
        "fields": [{ "name": "email", "label": "Work Email", "required": true }],
        "submitButtonLabel": "Continue",
        "targetStepId": "step_img_1"
      }
    },
    {
      "id": "step_img_1",
      "type": "IMAGE",
      "name": "Step 1 — Hero Overview",
      "assetUrl": "https://storage.googleapis.com/arcade-cf7d5.appspot.com/...",
      "width": 1440,
      "height": 900,
      "skipStep": false,
      "hideFromNavigation": false,
      "autoplay": null,
      "voiceover": { "script": "Explore 20+ years of cloud and AI engineering.", "audioUrl": null },
      "hotspots": [
        {
          "id": "hs_1",
          "type": "HOTSPOT",
          "x": 0.52,
          "y": 0.48,
          "style": "BEACON",
          "color": "#6366F1",
          "tooltipText": "Click to inspect the interactive resume",
          "tooltipPosition": "BOTTOM",
          "trigger": "CLICK",
          "targetStepId": "NEXT"
        }
      ],
      "callouts": [
        {
          "id": "co_1",
          "type": "CALLOUT",
          "x": 0.35,
          "y": 0.30,
          "text": "Hi {{first_name}}, notice the Bauhaus design system!",
          "theme": "DARK",
          "pointerDirection": "BOTTOM"
        }
      ],
      "areas": [
        {
          "id": "area_1",
          "type": "AREA",
          "x": 0.1,
          "y": 0.1,
          "width": 0.25,
          "height": 0.12,
          "effect": "BLUR",
          "intensity": 12
        }
      ],
      "panAndZoom": {
        "enabled": true,
        "scale": 1.35,
        "centerX": 0.52,
        "centerY": 0.48,
        "easing": "EASE_IN_OUT",
        "delayMs": 300
      }
    }
  ]
}
```

### 6.3 Brand Kit Schema (`XE1uVIkZSLQJth6oUMJ0` generated from `https://whoami.genisisiq.com`)
Extracted from `/workspaces/workspace-5p8xcsfv/settings/brand-kits/XE1uVIkZSLQJth6oUMJ0/*`:
```json
{
  "id": "XE1uVIkZSLQJth6oUMJ0",
  "workspaceId": "fBtA4gu4pOa2JSDRyFh0",
  "name": "whoami.genisisiq.com",
  "isDefault": true,
  "sources": {
    "websiteUrl": "https://whoami.genisisiq.com",
    "guidelinesPdfUrl": null,
    "socialLinks": []
  },
  "logos": {
    "fullLogos": [
      { "id": "logo_light", "url": "https://...", "theme": "LIGHT" },
      { "id": "logo_dark", "url": "https://...", "theme": "DARK" }
    ],
    "icons": [
      { "id": "icon_light", "url": "https://...", "theme": "LIGHT" },
      { "id": "icon_dark", "url": "https://...", "theme": "DARK" }
    ]
  },
  "colors": {
    "primary": "#D4AF37",
    "text": "#111111",
    "background": "#F4EFE6",
    "secondary": "#C42B1C",
    "accent": "#0047AB"
  },
  "fonts": {
    "heading": { "family": "Inter", "weight": "Bold", "source": "GOOGLE" },
    "body": { "family": "Inter", "weight": "Regular", "source": "GOOGLE" }
  },
  "backgrounds": [
    { "id": "bg_1", "url": "https://...", "source": "AI_GENERATED" },
    { "id": "bg_2", "url": "https://...", "source": "AI_GENERATED" },
    { "id": "bg_3", "url": "https://...", "source": "AI_GENERATED" },
    { "id": "bg_4", "url": "https://...", "source": "AI_GENERATED" },
    { "id": "bg_5", "url": "https://...", "source": "AI_GENERATED" }
  ],
  "product": {
    "tagline": "Doers, not talkers.",
    "description": "whoami.genisisiq.com is an interactive personal portfolio and resume website for Yingting Huang, a Senior Cloud Solution Architect at Microsoft with over 20 years of engineering experience. The site showcases his hands-on expertise in cloud architecture, AI-enabled applications, and modern data platforms, backed by over 120 verified technical badges and certifications. Visitors can explore his professional journey, view featured projects like an AI Use Case Hub with 2,300+ indexed scenarios, and interact with a multi-theme design system featuring Bauhaus, Cyberpunk, and Tron aesthetics.",
    "icp": [
      "Technical Recruiters and Hiring Managers at enterprise technology companies",
      "Engineering Leaders and CTOs looking for Principal or Senior Cloud & AI Architects",
      "Enterprise clients and peers verifying Microsoft Azure, AI, and security credentials",
      "Developer community members exploring his open-source AI projects and technical blog"
    ],
    "keyMessaging": [
      "Hands-on builder mentality ('Doers, not talkers') with 20+ years of coding and architecture experience.",
      "Deep, verified multi-domain expertise evidenced by 120+ Credly badges across Azure, AI, Security (SC-100), and Kubernetes.",
      "Proven track record of building practical, scalable AI tools, such as indexing 2,300+ real-world AI use cases.",
      "Creative full-stack engineering capability demonstrated directly through the portfolio's interactive, multi-palette UI."
    ]
  },
  "voice": {
    "description": "The brand voice is confident, pragmatic, and technically authoritative, anchored by the motto 'Doers, not talkers.' It avoids corporate fluff and buzzwords in favor of concrete metrics, verified credentials, and direct demonstrations of work. At the same time, it carries a creative, slightly playful builder's spirit—blending rigorous enterprise cloud architecture with bold, retro-futuristic design themes like Bauhaus, Cyberpunk, and Tron.",
    "writingGuidelines": "Lead with action and verifiable proof rather than abstract claims. Use crisp, punchy sentences, active verbs, and specific numbers (e.g., '20+ years,' '120+ badges,' '2,300+ use cases'). Keep labels and calls-to-action concise and functional."
  },
  "tones": [
    {
      "name": "Default",
      "rules": [
        "Direct & Pragmatic — Prioritize clear, no-nonsense statements that focus on what was built and how it works.",
        "Evidence-Backed — Anchor claims in specific metrics, certifications (e.g., SC-100, AZ-305), and live links.",
        "Confident Builder — Write from the perspective of a seasoned practitioner who still writes code daily.",
        "Crisp & Scannable — Use short, high-impact phrases, structured metadata labels, and clean typography."
      ]
    }
  ]
}
```

### 6.4 Custom Code AI Video Schema (`qGe4L499rr5AsLtm6F4q` & `RFY3pPzp6G8E5xJXINUh`)
```json
{
  "id": "qGe4L499rr5AsLtm6F4q",
  "sessionId": "wLLiAAjLy8qImE6MDdSr",
  "workspaceId": "fBtA4gu4pOa2JSDRyFh0",
  "brandKitId": "XE1uVIkZSLQJth6oUMJ0",
  "name": "whoami.genisisiq.com Launch",
  "aspectRatio": "16:9",
  "durationSeconds": 30,
  "fps": 30,
  "version": "v1",
  "designSchema": {
    "colors": {
      "canvasBackground": "#F4EFE6",
      "text": "#111111",
      "goldSlab": "#D4AF37",
      "redSlab": "#C42B1C",
      "blueSlab": "#0047AB"
    },
    "scenes": [
      {
        "sceneIndex": 1,
        "name": "Opening",
        "startTime": 0.0,
        "duration": 5.0,
        "props": {
          "title": "YINGTING HUANG",
          "role": "Senior Cloud Solution Architect",
          "subtitle": "An interactive engineering résumé"
        },
        "voiceover": {
          "voiceName": "Bradford",
          "script": "Meet Yingting Huang—Senior Cloud Solution Architect, builder, and doer."
        }
      }
    ]
  },
  "timeline": {
    "panAndZoom": [],
    "voiceoverTrack": [
      { "id": "vo_1", "sceneIndex": 1, "voice": "Bradford", "startSec": 0.2, "durationSec": 4.5 },
      { "id": "vo_2", "sceneIndex": 2, "voice": "Bradford", "startSec": 5.1, "durationSec": 4.6 },
      { "id": "vo_3", "sceneIndex": 3, "voice": "Bradford", "startSec": 10.1, "durationSec": 4.7 },
      { "id": "vo_4", "sceneIndex": 4, "voice": "Bradford", "startSec": 15.1, "durationSec": 4.6 },
      { "id": "vo_5", "sceneIndex": 5, "voice": "Bradford", "startSec": 20.1, "durationSec": 4.7 },
      { "id": "vo_6", "sceneIndex": 6, "voice": "Bradford", "startSec": 25.1, "durationSec": 4.5 }
    ],
    "musicTrack": {
      "trackName": "Bauhaus Motion",
      "volume": 0.26,
      "durationMode": "FIT_TO_VIDEO"
    },
    "sfxTrack": [
      { "id": "sfx_1", "type": "Slide", "timeSec": 0.3 },
      { "id": "sfx_2", "type": "Impact", "timeSec": 1.8 },
      { "id": "sfx_3", "type": "Click", "timeSec": 5.2 },
      { "id": "sfx_4", "type": "Type", "timeSec": 10.4 }
    ]
  },
  "exports": [
    {
      "resolution": "1080p",
      "fps": 30,
      "sizeBytes": 8200192,
      "status": "COMPLETED",
      "downloadUrl": "https://storage.googleapis.com/...",
      "shareUrl": "https://app.arcade.software/share/videos/qGe4L499rr5AsLtm6F4q"
    }
  ]
}
```

---

## 7. Design System, Typography & CSS Token Specification

Extracted from `document.styleSheets` on `app.arcade.software` (279 CSS custom properties in `bundle_analysis.json`):

### 7.1 Typography
- **UI Sans Font**: `Inter`, `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Display / Marketing Font**: `Plus Jakarta Sans` / `Cabinet Grotesk` (used on `www.arcade.software` headlines)
- **Monospace Font**: `JetBrains Mono`, `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`
- **Type Scale**:
  - `text-xs`: `12px` / `line-height: 16px` ( badges, keyboard shortcuts, timeline rulers )
  - `text-sm`: `13px–14px` / `line-height: 20px` ( sidebar nav items, inspector labels, buttons )
  - `text-base`: `15px–16px` / `line-height: 24px` ( prompt composer input, body copy )
  - `text-xl`: `20px` / `line-height: 28px` / `font-weight: 600` ( modal titles, section headers )
  - `text-2xl`: `24px–28px` / `line-height: 34px` / `font-weight: 600` ( `"Good morning, jack — What are we creating today?"` )

### 7.2 Color Tokens (`app.arcade.software`)
| Semantic Token | Light Mode Value | Dark Editor / Timeline Value | Usage |
|---|---|---|---|
| `--color-surface-primary` | `#FFFFFF` | `#0F1117` | Main page / panel background |
| `--color-surface-secondary` | `#F8FAFC` (`slate-50`) | `#161922` | App sidebar, canvas surround, card background |
| `--color-surface-tertiary` | `#F1F5F9` (`slate-100`) | `#1E2230` | Hover states, pill backgrounds, input fills |
| `--color-content-primary` | `#0F172A` (`slate-900`) | `#F8FAFC` | Primary headings & body text |
| `--color-content-secondary` | `#475569` (`slate-600`) | `#94A3B8` | Muted labels, timestamps, metadata |
| `--color-content-tertiary` | `#94A3B8` (`slate-400`) | `#64748B` | Placeholders, disabled icons |
| `--color-brand-primary` | `#4F46E5` / `#6366F1` (Indigo) | `#6366F1` | Primary CTA buttons (`Share`, `Export`, `Generate`), active tab indicator |
| `--color-ai-accent` | `linear-gradient(135deg, #6366F1, #A855F7, #EC4899)` | Same | Avery AI sparkles, credit badges, AI generation progress |
| `--color-border-subtle` | `#E2E8F0` (`slate-200`) | `#262B3D` | 1px panel dividers, card borders, input outlines |
| `--color-status-success` | `#10B981` (Emerald) | `#34D399` | Published badge, completed agent checkmarks |
| `--color-status-warning` | `#F59E0B` (Amber) | `#FBBF24` | Credit warnings, pending review |
| `--color-status-danger` | `#EF4444` (Red) | `#F87171` | Delete actions, recording indicator dot |

### 7.3 Layout & Elevation Geometry
- **Left Workspace Sidebar**: Fixed `240px` width (`border-r border-slate-200 bg-slate-50/60`), collapsible in editors.
- **Top Editor Header Bar**: Fixed `56px` height (`h-14`), containing Breadcrumb / Back button on left, mode switcher or tool rail in center, and `Preview` / `Share` / `Export` / `Options (...)` on right.
- **Right Inspector Panel**: Fixed `288px`–`320px` width (`border-l border-slate-200 bg-white`).
- **Border Radii**: `rounded-lg` (`8px`) for buttons/inputs, `rounded-xl` (`12px`) for cards/modals, `rounded-2xl` (`16px`) for the Home AI Composer box.
- **Shadows**: Soft layered shadows (`0 1px 3px rgba(15,23,42,0.06), 0 4px 12px rgba(15,23,42,0.04)`) on cards and floating toolbars.

---

## 8. Marketing Website (`www.arcade.software`) Specification

Captured across `01_www_*` through `26_demo_embed_player.png`:

1. **Global Navigation Bar**:
   - **Product Dropdown**: `Interactive Demos`, `AI Video`, `Visuals`, `Personalization`, `Brand Kit`, `Agents`, `Collections`, `Insights`.
   - **Solutions Dropdown**: By Role (`Product Marketing`, `Growth Marketing`, `Product Management`, `Sales Engineering`, `Customer Success`, `Enablement`) & Use Case.
   - **Resources Dropdown**: `Blog`, `Case Studies`, `Showcase`, `Changelog`, `Guides`, `Events`, `State of AI Video`, `Security`.
   - **Direct Links**: `Pricing`, `Enterprise`, `Log in` (`https://app.arcade.software/login`), `Sign up free` (`https://app.arcade.software/signup`).
2. **Homepage (`01_www_home_*`)**:
   - Hero section with dual-mode interactive preview switcher (`AI Video` vs `Interactive Demo`) and embedded live player (`26_demo_embed_player.png`).
   - 5 interactive use-case tabs (`01_www_home_usecase_tab_1..5.png`) demonstrating Launch Videos, Product Tours, Personalized Demos, Social Visuals, and Multi-Asset Collections.
3. **Pricing Page (`07_www_pricing*.png`)**:
   - Billing cycle toggle (`Annual - Save 20%` vs `Monthly`).
   - **4 Tiers**:
     - **Free (`$0`)**: Up to 3 published Arcades, basic camera/screen capture, 200 starter AI credits, Arcade watermark.
     - **Pro (`$32/mo` annual / `$38/mo` monthly)**: Unlimited Arcades, custom branding (no watermark), Chapters, Pan & Zoom, Video/GIF export, Step-by-Step Guides.
     - **Growth (`$42.50/user/mo` annual / `$50/user/mo` monthly, up to 10 creators)**: Multi-user collaboration, Branching paths, Custom variables, Translations AI, Audience Reveal, CRM Integrations, Collections.
     - **Enterprise (`Custom`)**: Unlimited creators, SSO/SAML, SCIM, Custom domains, Private sharing permissions, Dedicated CSM, Security review.

---

## 9. Workspace Shell, Navigation, AI Composer & Onboarding (`app.arcade.software`)

Captured in `30_app_home_*` through `64_app_starter_demo_player_modal.png` and `152a`..`152c`:

### 9.1 Left Sidebar Navigation
- **Workspace Switcher & Credit Pill** (top-left): Avatar badge (`J` — `jack wolf's workspace`) + AI Credit pill (`200` / `0` with sparkle icon; clicking opens the **AI Credits Popover** `42_app_sidebar_ai_credits_popover.png` showing credit balance, usage breakdown, and `Buy more credits`).
- **Primary Action Button**: `+ Create` (`43_app_sidebar_create_menu.png`) opening a creation menu:
  - `Interactive Demo` (Chrome Extension / Upload media / Desktop app)
  - `Video` (Generate with AI)
  - `Visuals` (Generate social & ad assets)
  - `Collection` (Bundle multiple Arcades)
- **Quick Search (`Search ⌃K`)**: Opens the Algolia-powered **Command Palette Modal** (`44_app_search_command_palette.png`) with instant filtering by type (`All`, `Arcades`, `Videos`, `Visuals`, `Collections`).
- **Core Navigation Links**:
  - `Home` (`/workspaces/[slug]/home`)
  - `Brand Kits` (`/workspaces/[slug]/settings/brand-kits`)
- **Personal & Team Spaces**:
  - `Just me` → `Library` (`/workspaces/[slug]/library`) and `Insights` (`/workspaces/[slug]/insights`)
  - `Teams` → `+ Create a team` (`Upgrade` badge on Free plan)
- **Onboarding Checklist Widget (`Get set up`)**:
  - 5-step interactive checklist with progress bar (`141a`, `152a`, `152b`):
    1. `Generate a Brand Kit`
    2. `Record a demo`
    3. `Generate a video`
    4. `Create a visual`
    5. `Share a demo`
  - Completing all 5 steps unlocks the **`Claim 200 credits`** button (`152a_home_with_all_4_whoami_assets.png` → `152b_home_claimed_200_credits.png`), which immediately credits `+200` AI credits to the workspace!
- **Plan Quota Footer**: `Free Plan 1/3 — You can publish up to 3 files for free. Need more? Upgrade` + `Recently deleted` trash link.

### 9.2 Home Unified AI Creation Composer ("What are we creating today?")
Centered at the top of `/workspaces/[slug]/home` is a tabbed omni-composer with 4 mode tabs:
1. **`Video` Tab (`30_app_home_video_tab.png`)**:
   - Prompt textarea (`Describe the video you want to create...`)
   - Bottom toolbar pills:
     - `Brand Kit` selector (`whoami.genisisiq.com` or `+ New Brand Kit`)
     - `Media` attachment picker (`33_app_home_video_media_picker.png` — attach existing Arcades or upload files)
     - `Aspect Ratio` dropdown (`31_app_home_video_aspect_ratio_menu.png` — `16:9 Landscape`, `9:16 Vertical`, `1:1 Square`)
     - `Duration` dropdown (`32_app_home_video_length_menu.png` — `15s`, `30s`, `60s`)
     - Submit button showing credit cost (`50` credits)
   - 6 Quick-Prompt Chips below: `Walkthrough of a new feature`, `Product overview`, `Customer success story`, `Onboarding flow demo`, `How-to tutorial`, `Product launch teaser`.
2. **`Demo` Tab (`34_app_home_demo_tab.png`)**:
   - 3 cards: `Record browser tab` (via Chrome Extension), `Record desktop app` (`70b_app_demo_desktop_app_modal.png`), `Start from scratch` (`70_app_demo_start_from_scratch_state.png` — upload images/videos or import from Google Drive).
3. **`Visuals` Tab (`35_app_home_visuals_tab.png`)**:
   - Prompt input + `Brand Kit` selector + `Add Interactive Demo` + quick template category pills (`Social Announcement`, `Product Benefits`, `Feature Highlight`, `Website Hero`).
4. **`Collection` Tab (`36_app_home_collection_tab.png`)**:
   - Launches Collection creation (`/collections/new/edit` or Growth upgrade modal `90_app_collection_editor_initial.png`).

---

## 10. Feature Pillar 1: Brand Kit 1-Minute AI Extractor & 13-Tab Brand Kit Editor (`whoami.genisisiq.com`)

Captured end-to-end in `120_brand_kit_setup_modal.png` through `123_brand_kit_generated_result.png` and `142a`..`144_brand_kit_custom_elements.png` using **`https://whoami.genisisiq.com`**:

### 10.1 1-Minute AI Brand Kit Extraction Pipeline
1. Clicking `New Brand Kit` opens the **"1-Minute Setup — Generate your Brand Kit"** modal (`120_brand_kit_setup_modal.png`) with URL input (`https://whoami.genisisiq.com`) and optional PDF Brand Guidelines upload (`121_brand_kit_url_entered.png`).
2. Clicking `Generate` runs a multi-step scraper & LLM synthesis pipeline (`122_whoami_brand_kit_step_1..6.png`):
   - Crawls `https://whoami.genisisiq.com` HTML, CSS stylesheets, OpenGraph tags, favicons, and rendered screenshots.
   - Extracts the Bauhaus color palette (`#D4AF37`, `#111111`, `#F4EFE6`, `#C42B1C`, `#0047AB`), typography (`Inter Bold` & `Inter Regular`), and logos.
   - Generates 5 custom abstract brand backgrounds via image diffusion.
   - Synthesizes structured Product Positioning (`Tagline`, `Product Description`, `ICP`, `Key Messaging`), `Brand Voice`, `Writing Guidelines`, and `Tone Rules`.

### 10.2 All 13 Sections of the Brand Kit Editor (`/settings/brand-kits/XE1uVIkZSLQJth6oUMJ0/[section]`)
| Tab / Route | Captured Screenshot | Key Controls & Extracted `whoami.genisisiq.com` Values |
|---|---|---|
| **1. Home (Overview)** | `142b_brand_kit_editor_whoami_top.png` | Summary dashboard of Logos, Colors, Fonts, Backgrounds, Product Tagline (`"Doers, not talkers."`), and Voice |
| **2. Sources** | `144_brand_kit_sources.png` | `Website URL` (`https://whoami.genisisiq.com`), `Brand guidelines` PDF dropzone, `Social profiles`, and `Resync` trigger |
| **3. Logos** | `144_brand_kit_logos.png` | `Full logo` (Light & Dark variants) and `Icon` (Light & Dark variants) uploaders with transparent checkerboard preview |
| **4. Colors** | `144_brand_kit_colors.png` | `Primary` (`#D4AF37`), `Text` (`#111111`), `Background` (`#F4EFE6`), `Secondary` (`#C42B1C`), `Accent` (`#0047AB`) + `+ Add color` |
| **5. Fonts** | `144_brand_kit_fonts.png` | `Heading` (`Inter Bold`), `Body` (`Inter Regular`), and custom font uploader (`.ttf`, `.otf`, `.woff`, `.woff2`) |
| **6. Photography** | `144_brand_kit_photography.png` | Brand photography library for AI Video & Visuals scenes |
| **7. Backgrounds** | `144_brand_kit_backgrounds.png` | 5 AI-generated brand backgrounds + custom background uploader |
| **8. Illustrations** | `144_brand_kit_illustrations.png` | Brand vector/illustration asset dropzone |
| **9. Product** | `144_brand_kit_product.png` | `Tagline` (`"Doers, not talkers."`), `Product description`, `Ideal Customer Profile (ICP)` (4 bullets), `Key messaging` (4 bullets) |
| **10. Voice** | `144_brand_kit_voice.png` | `Voice description` and `Writing guidelines` textareas |
| **11. Tones** | `144_brand_kit_tones.png` | `Default` tone card (`Direct & Pragmatic`, `Evidence-Backed`, `Confident Builder`, `Crisp & Scannable`) + `+ Add tone` |
| **12. Demo** | `144_brand_kit_demo.png` | Default Interactive Demo (`Flow`) styling: Hotspot color, Callout theme, Wrapper style, Cursor, and Watermark |
| **13. Share page & Custom elements** | `144_brand_kit_share_page.png`, `144_brand_kit_custom_elements.png` | Public share page header/background defaults and custom reusable React/HTML overlay elements |

---

## 11. Feature Pillar 2: Agentic AI Video Studio & Custom Code NLE Video Editor (`whoami.genisisiq.com`)

Tested live by generating **two complete AI Launch Videos** from `https://whoami.genisisiq.com`:
1. **`whoami.genisisiq.com Launch`** (`qGe4L499rr5AsLtm6F4q`, 30 seconds, 6 scenes, exported to a `7.82 MB` 1080p@30fps MP4 — `128_whoami_prompt_video_edit.png` through `140_whoami_video_share_player_ready.png`)
2. **`whoami Launch Film`** (`RFY3pPzp6G8E5xJXINUh`, 16 seconds, 4 scenes — `150a_whoami_launch_film_16s_editor.png` through `150c_whoami_launch_film_scene_4.png`)

### 11.1 The 7-Stage Autonomous AI Video Agent Pipeline (`Chat` Tab)
When a user submits a video prompt (`124d_ai_video_prompt_whoami_typed.png`), Arcade creates a Firestore session (`?sessionId=wLLiAAjLy8qImE6MDdSr`) and streams a 7-stage collapsible execution log (`125_whoami_video_step_1..16.png`, `128_whoami_prompt_video_edit.png`):
1. **`Checked your memory`** — Loads workspace AI Memory and Brand Kit (`XE1uVIkZSLQJth6oUMJ0`).
2. **`Researched`** — Inspects `https://whoami.genisisiq.com` live DOM, metadata, and portfolio achievements (`20+ years`, `120+ Credly badges`, `SC-100`, `2,300+ AI use cases`).
3. **`Gathered assets`** — Pulls Brand Kit colors (`#F4EFE6`, `#111111`, `#D4AF37`, `#C42B1C`, `#0047AB`), fonts, and screenshots.
4. **`Planned the video`** — Writes a 6-scene storyboard (`Scene 1: Opening`, `Scene 2: The Builder Manifesto`, `Scene 3: 120+ Verified Credentials`, `Scene 4: 2,300+ AI Use Cases Hub`, `Scene 5: Multi-Theme Engineering`, `Scene 6: Call to Action`).
5. **`Created audio`** — Synthesizes 6 ElevenLabs voiceover clips (`Bradford` voice), selects background music (`Fit to video` at `26%` volume), and places 12 frame-accurate sound effects (`Slide`, `Click`, `Impact`, `Type`).
6. **`Built scenes`** — Generates custom programmatic React/Remotion code for all 6 scenes (`30s` @ `30fps` = 900 frames) with Bauhaus geometric motion graphics.
7. **`Reviewed and polished`** — Verifies visual layout, timing alignment, and caption synchronization, then outputs a summary with version selector (`v1`).

Users can iterate conversationally in the `Chat` box (`"Describe a change, or type @ to mention a scene..."`), attach new media (`+`), or scope edits to a specific scene via the `@Scene` picker (`133_whoami_video_scene_picker_menu.png`).

### 11.2 Schema-Driven `Design` Inspector Tab (`132_whoami_video_design_tab.png`, `132a`..`132d`)
Switching the left panel from `Chat` to `Design` exposes an auto-generated GUI form bound directly to the Remotion composition's props:
- **Global Color Palette Pickers**:
  - `Canvas Background` (`#F4EFE6`)
  - `Text` (`#111111`)
  - `Gold slab` (`#D4AF37`)
  - `Red slab` (`#C42B1C`)
  - `Blue slab` (`#0047AB`)
- **Per-Scene Text & Prop Controls** (e.g., `Opening` scene dropdown `132d_whoami_video_design_scene_dropdown.png`):
  - Editable text inputs for `YINGTING HUANG`, `Senior Cloud Solution Architect`, `An interactive engineering résumé`, metrics counters, badge titles, and CTA URL (`whoami.genisisiq.com`). Editing any field hot-updates the live Remotion canvas immediately without re-running the LLM agent.

### 11.3 Multi-Track NLE Timeline Editor (`139a_whoami_video_multitrack_timeline.png`)
Clicking the timeline expand button (`x: 500, y: 747`) transforms the bottom scene strip into a **5-track Non-Linear Editor (NLE)** with a frame-accurate playhead (`00:00.00 / 00:30.00`), zoom slider, and track inspectors:
1. **Track 1 — `Add Pan & Zoom` (`139d_whoami_video_pan_zoom_inspector.png`)**:
   - Keyframe blocks defining camera zoom scale and focal target over any scene range.
2. **Track 2 — `Voiceover` (`139b_whoami_video_voiceover_inspector.png`)**:
   - Displays individual waveform/script clips per scene (`Bradford`).
   - Clicking a clip opens the **Voiceover Inspector** on the left:
     - **Voice Selector**: 18+ ElevenLabs voices (`Matilda`, `Hope`, `Bradford`, `Arabella`, `Sam`, `Jane`, `Liam`, `Brandon`, `Lauren B`, `Frank Brown`, `Hale`, `Waverly`, `Siren`, `Nixon`, `Cherie`, `Mark`, `Charlotte`, `Alistair`) with audio preview buttons.
     - **Script Textarea**: Edit narration for the selected scene (`Regenerate voiceover`).
     - **`Edit pronunciation` Modal (`139g_whoami_video_edit_pronunciation.png`)**: Define phonetic overrides (e.g., `"genisisiq"` → `"Genesis IQ"`).
     - **`Edit all scripts` View (`139h_whoami_video_edit_all_scripts.png`)**: Batch-edit all 6 scene scripts in a single view.
3. **Track 3 — `Scenes 1..6` (`135_whoami_video_add_scene_modal.png`, `135a`)**:
   - Visual scene blocks with trim handles, hover `...` menu (`Duplicate`, `Delete`), and `+` insertion buttons between scenes (`Add a scene here`).
4. **Track 4 — `Music` (`132_design_scene2.png`)**:
   - Background music waveform track with **Music Inspector** (`Track` selector, `Volume` slider `26%`, `Duration: Fit to video`).
5. **Track 5 — `Sound effects` (`139c_whoami_video_sfx_inspector.png`)**:
   - 12 individual SFX clips (`Slide`, `Click`, `Impact`, `Type`) with **SFX Inspector** (`Effect` library picker, `Volume` slider, `Duplicate`, `Delete`).

### 11.4 Server-Side MP4 Export & Public Video Share Page (`137`, `139e`, `140`)
- **Export Popover (`137_whoami_video_export_modal.png`)**:
  - `Resolution`: `1080p` (Full HD) or `4K` (Ultra HD)
  - `Frame rate`: `24 FPS`, `30 FPS`, or `60 FPS`
  - Clicking `Export` triggers server-side headless rendering (`Rendering video...` → `Export completed · 7.82 MB` in `139e_whoami_video_export_completed.png`) with one-click `.mp4` download.
- **Public Video Share Player (`140_whoami_video_share_player_ready.png`)**:
  - Hosted at `https://app.arcade.software/share/videos/qGe4L499rr5AsLtm6F4q`, featuring the rendered MP4 video, playback controls, captions toggle, and Brand Kit styling.

---

## 12. Feature Pillar 3: Interactive Demo (`Flow`) Editor, Player, Guide & Insights

Captured exhaustively across `70_app_demo_*` through `96_flow_public_share_guide.png` on our real multi-step Flow (`4fLyMFzH8BjqgKQF4Bd6`, public share ID `319HqogqYEOZH11srxTM`):

### 12.1 Flow Editor Layout (`/flows/[pid]/edit`)
- **Left Step Rail**:
  - Vertical list of numbered step thumbnails (`Step 1`, `Step 2`, `Chapter`, etc.) with drag-and-drop reordering.
  - Hovering a step reveals a pencil quick-edit button (`82h`, `82i`) and a `...` context menu (`82e_flow_editor_step_menu_open.png`) with 9 actions and keyboard shortcuts:
    1. `Rename`
    2. `Copy` (`⌃C`)
    3. `Duplicate` (`⌃D`)
    4. `Copy link to step`
    5. `Download image`
    6. `Skip step`
    7. `Hide from navigation` (`⌃⇧H`)
    8. `Enable autoplay` (`⌃⇧P`)
    9. `Delete` (`⌫`)
  - Bottom `+` button (`82c_flow_editor_add_step_menu.png`): `Add chapter`, `Upload media`, or `Import from Library`.

### 12.2 Top Center Canvas Tool Bar (6 Tools)
| Tool | Screenshot | Capabilities & Inspector Controls |
|---|---|---|
| **1. Hotspot** | `77_flow_editor_tool_hotspot.png` | Places an interactive beacon/pulse/spotlight on the canvas. Controls: Style (`Beacon`, `Callout`, `Spotlight`), Color picker, Tooltip text, Position (`Top`/`Bottom`/`Left`/`Right`/`Auto`), Trigger (`Click` or `Hover`), Target destination (`Next step`, `Previous step`, specific `Step #`, or `External URL`). |
| **2. Callout** | `78_flow_editor_tool_callout.png` | Rich-text annotation card with optional pointer arrow, `Light`/`Dark`/`Custom` theme, dynamic variable insertion (`{{first_name}}`), and CTA button. |
| **3. Area** | `79_flow_editor_tool_area.png` | Rectangular region overlay for PII redaction (`Blur`) or focal emphasis (`Highlight` / `Spotlight`) with adjustable blur intensity. |
| **4. Pan and zoom** | `80_flow_editor_tool_pan_and_zoom.png` | Smooth camera zoom into a bounding box on step entry. Controls: Zoom target box, `Easing` curve (`Ease in-out`, `Linear`, `Spring`), and `Delay` (`ms`). |
| **5. Voiceover** | `81_flow_editor_tool_voiceover.png` | Per-step synthetic narration powered by ElevenLabs (`Callum`, `Charlotte`, etc.) or uploaded `.mp3`/`.wav` audio file, with auto-advance on audio completion. |
| **6. Recording** | `82_flow_editor_tool_recording.png` | Picture-in-picture webcam video bubble or microphone voiceover recorder overlaid on the step corner. |

### 12.3 Chapter Steps & Lead Capture Forms (`82d`, `82g`)
Adding a **Chapter Step** inserts a full-screen title/interstitial slide with a dedicated **Chapter Inspector**:
- **Interaction Mode**:
  - `Buttons` (`82d_flow_editor_chapter_inspector.png`): One or more buttons (`Primary` / `Secondary` / `Outline`), each routable to any step (enabling **multi-path branching demos**) or an external URL.
  - `Form` (`82g_flow_editor_chapter_lead_form.png`): Embedded **Lead Capture Gate** (`Work Email`, `First Name`, `Company`, custom fields) that gates demo progression and pipes revealed leads to `/workspaces/[slug]/leads` and CRM integrations.
- **Visual Controls**: `Title`, `Subtitle`, `Theme` (`Light` / `Dark` / `Brand Kit`), `Alignment` (`Left` / `Center`), `Logo` toggle, and `Preview` background (`Full`, `Inset`, `None`).

### 12.4 Right Vertical Icon Rail (7 Workspace Panels)
1. **`Design` (`72`..`74_flow_editor_design_panel_*.png`)**:
   - `Theme` color & Brand Kit presets, `Wrapper` (Browser chrome, Padding, Rounded corners, Shadow, URL bar text), `Background` (Gradient/Solid/Image), `Cursor` (Style, Size, Click ring, **Magic Cursor**), `Watermark`, `Font` upload, `Player controls`, `Metadata` (Title/Description/OG image), `Background Audio`, `Auto Pan & Zoom`, `Autoplay`, `Optimize for mobile`.
2. **`Library` (`83_flow_editor_rail_library.png`)**:
   - Reusable step/asset vault with `Upload Media` and `Google Drive` import.
3. **`Translations AI` (`84_flow_editor_rail_translations_ai.png`)**:
   - One-click localization of the Flow into 30+ languages, creating a language switcher in the public player.
4. **`Variables` (`85_flow_editor_rail_variables.png`)**:
   - Defines dynamic URL-parameter tokens (`{{first_name}}`, `{{company_name}}`) with fallback defaults for 1:1 sales personalization (`?first_name=Sarah&company_name=Acme`).
5. **`Menu` (`86_flow_editor_rail_menu.png`)**:
   - Configures a floating table-of-contents drawer in the player listing all Chapters plus external resource links.
6. **`Linear view` (`87_flow_editor_linear_view.png`)**:
   - Full-screen storyboard grid showing all steps, chapters, and branching connections simultaneously.
7. **`Script view` (`88_flow_editor_script_view.png`)**:
   - Side-by-side two-column table pairing each step's visual thumbnail with its Callout text and Voiceover narration script for rapid copyediting.

### 12.5 Sharing, Embeds, Video/GIF Export, Guide & Insights (`91`..`96`)
- **`Share` Popover (`91_flow_editor_share_popover.png`)**:
  - Visibility toggle (`Public` vs `Private`), `Copy link`, `+ New link` (creates tracked custom links per prospect/campaign), `Feature on Community`, `Invite to collaborate`, `Embed`, `Video & GIF`, `Step-by-Step Guide`, and `Generate with AI` (`Video` | `Visuals`).
- **`Embed` Modal (`91c_flow_share_embed_modal.png`)**:
  - `Inline` vs `Popout` modal trigger, `HTML` iframe vs `React` component snippet, responsive wrapper code.
- **`Video & GIF` Export Modal (`91d_flow_share_video_gif_modal.png`)**:
  - Format (`Video MP4` or `Animated GIF`), Resolution (`360p`, `540p`, `720p`, `1080p`), Frame rate (`15 FPS`, `24 FPS`).
- **Auto-Generated Step-by-Step Guide (`94_flow_step_by_step_guide.png` & `96_flow_public_share_guide.png`)**:
  - Converts every step and hotspot into a clean, printable/shareable documentation guide (`/flows/[pid]/guide` and `/share/[shareId]/guide`).
- **Per-Flow Insights (`93_flow_insights_page.png`)**:
  - Tracks `Unique viewers`, `Total views`, `Completion rate`, `Average time spent`, step-by-step drop-off bar chart, and individual viewer sessions.

---

## 13. Feature Pillar 4: AI Visuals Studio & Multi-Format Visual Canvas Editor (`whoami.genisisiq.com`)

Tested live with our `whoami.genisisiq.com` Brand Kit and Interactive Demo (`148a`..`148e`, `151a`..`151k`, `152d`..`152e`) on project `mVkkeVB4j15x799NHwBH`:

1. **AI Visuals Studio (`/workspaces/[slug]/start-with-ai/visuals`)**:
   - First-time **Welcome Modal** (`148a_ai_visuals_welcome_modal.png`: *"Welcome to Visuals (Early Access) — Turn product moments into scroll-stopping visuals"*).
   - **Left Composer Panel**:
     - Prompt textarea + **`+ Add Interactive Demo`** button (opens `Select Interactive Demo` modal `148c_ai_visuals_add_demo_picker.png` to pull real product screenshots from any Flow).
     - 4 Category Tabs: `Social Announcement`, `Product Benefits`, `Feature Highlight`, `Website Hero`.
     - `Brand Kit` selector (`whoami.genisisiq.com`).
     - `Generate 50` / `Regenerate 50` button (50 AI credits).
   - **Right Live Preview & Template Grid (`151a`..`151e`)**:
     - Generates branded copy tailored to `whoami.genisisiq.com` (e.g., *"2,300+ AI use cases indexed. Verify SC‑100 ↗ — Build AI-enabled cloud solutions backed by 120+ verified badges and 2,300+ indexed use cases. Explore AI."*) and renders it across multiple layout templates (`Capture`, `Spotlight`, `Split`, `Minimal`, etc.).
2. **Visual Canvas Editor (`/visual-projects/mVkkeVB4j15x799NHwBH/edit` — `151g`..`151j`, `152d`..`152e`)**:
   - **Left Multi-Format Rail**:
     - Lists all visual sizes in the project (e.g., `Instagram post square 1080×1080`, `Linkedin post landscape 1200×626` in `152e_whoami_visual_multi_format_linkedin.png`).
     - **`+ Add visual` Popover (`151i_whoami_visual_add_visual_popover.png`)**: Provides **28 size presets across 7 platforms**:
       - **LinkedIn (8)**: Ad square (`1200×1200`), Ad landscape (`1200×628`), Ad portrait (`720×900`), Post square (`1080×1080`), Post landscape (`1200×626`), Post portrait (`626×1200`), Profile banner (`1584×396`), Article banner (`1920×1080`)
       - **Facebook (5)**: Ad square (`1440×1440`), Ad portrait (`1440×1800`), Post (`1200×630`), Stories (`1080×1920`), Cover (`851×315`)
       - **Instagram (5)**: Ad (`1440×1440`), Post square (`1080×1080`), Post portrait (`1080×1350`), Stories (`1080×1920`), Reels (`1080×1920`)
       - **X (2)**: Post (`1200×675`), Banner (`1500×500`)
       - **TikTok (1)**: Post (`1080×1920`)
       - **YouTube (2)**: Shorts (`1080×1920`), Thumbnail (`1280×720`)
       - **Google Ads (5)**: Leaderboard (`728×90`), Large rectangle (`336×280`), Medium rectangle (`300×250`), Mobile banner (`300×50`), Wide skyscraper (`160×600`)
   - **Right Inspector Panel (`151g`, `151h`, `152d`)**:
     - `Template` picker (`151h_whoami_visual_template_picker.png`: `Capture - Best for announcements`, etc.)
     - `Animate` switch (`152d_whoami_visual_animated_mode.png` — turns static social cards into animated motion visuals)
     - `Logo` toggle
     - `Background` (`Image` | `Color` tabs, 5 Brand Kit backgrounds, and **`Generate background with Avery`** AI button)
     - `Text` (Headline input, **`Generate headline with Avery`** AI button, and 6 Brand Kit color swatches)
     - `Call to action` (`Label` input, `Background` color swatches, `Text` color swatches)
     - `Shadows` toggle & `Delete` button
     - Top-right `Export` button (`PNG` / `MP4` download).

---

## 14. Feature Pillar 5: Collections, Team Insights, Settings & Billing/Plans

### 14.1 Collections Editor (`/collections/new/edit` — `90b`, `147a`..`147c`)
- Bundles multiple Interactive Demos and AI Videos into a single branded microsite:
  - **Hero Header (`147b_collection_edit_header_modal.png`)**: Customizable Logo, Title, Subtitle, Primary CTA button (`Label` + `URL`), and Background style.
  - **`+ Add Arcades` Modal (`147c_collection_add_arcades_modal.png`)**: Multi-select picker to add/reorder Flows and Videos into the collection carousel.
  - Top bar: `Theme` selector, `Preview`, and `Share` (`/share/collections/[pid]`).

### 14.2 Team Insights (`/workspaces/[slug]/insights` — `48`, `97`, `146a`..`146b`)
- Workspace-wide analytics dashboard with global filters (`Folder`, `Date range: Last 30 days`) and `Export CSV`:
  - **`Activity` Tab (`146a`, `146b`)**: KPI summary cards (`Arcades created`, `Arcades viewed`, `Unique viewers`, `Completion rate`, `Total views`), time-series engagement chart, and `Engagement by Arcade` leaderboard.
  - **`Audience` Tab (`146_team_insights_audience.png`)**: De-anonymized company/visitor reveal table, geographic distribution, and device breakdown.
  - **`Arcades` Tab (`146_team_insights_arcades.png`)**: Per-asset performance comparison table.

### 14.3 Workspace Settings, Onboarding & Upgrade Checkout (`100`..`115`, `145z`)
- **General (`100_settings_general.png`)**: Workspace name (`jack wolf's workspace`), slug (`workspace-5p8xcsfv`), and workspace avatar.
- **Privacy (`145z_settings_privacy_page.png`)**: Viewer analytics collection toggle, cookie banner controls, GDPR compliance settings.
- **Billing & Plans (`101_settings_billing.png`)**: Monthly/Annual (`-15%`) toggle comparing `Free ($0/mo)`, `Growth ($42.50/mo per seat)`, and `Enterprise (Custom)` feature tiers.
- **Advanced (`115_settings_advanced_page.png`)**: SAML SSO configuration, SCIM directory sync, and workspace deletion.
- **Create Team (`106_workspace_create_team.png`, `106_workspace_create_team_step_2.png`)**: 4-step team creation wizard (`What's your team name?`) with live sidebar preview and Growth trial check.
- **Welcome Onboarding (`109_welcome_onboarding.png`) & Create Workspace (`110_workspaces_create.png`)**: Multi-step onboarding survey (`Get started -> Set up your brand -> Get the extension -> Create your first demo`) and new workspace creation form.
- **Self-Serve Upgrade Pages**:
  - **Upgrade to Pro (`113_upgrade_pro_page.png`)**: `$38/month` (or `$32/month` billed annually) with Stripe checkout summary.
  - **Upgrade to Growth (`114_upgrade_growth_page.png`)**: `$50/user/month` (or `$42.50/user/month` billed annually) with seat counter and Stripe checkout summary.

---

## 15. Complete Screenshot Catalog (`/home/azadmin/Arcade/screenshots/`)

All **314 screenshots** are saved in `/home/azadmin/Arcade/screenshots/`:

| File Range | Count | Coverage Description |
|---|---|---|
| `00_probe_app.png` | 1 | Initial authenticated workspace probe |
| `01_www_*` – `26_demo_embed_player.png` | 30 | **Marketing Site (`www.arcade.software`)**: Hero tabs, 5 use-case tabs, Interactive Demo product page, AI Video page, Personalization, Agents, Brand page, Pricing (Annual/Monthly/Table/FAQ), Enterprise, Integrations, Showcase grid, Download page, Changelog, 4 Solutions pages, Case Studies, Blog, Security, Contact Sales, State of AI Video, Guides, Events, Careers, Terms, and Embedded Player |
| `30_app_*` – `66d_ai_visual_project_populated.png` | 39 | **Workspace Shell & Studios (`app.arcade.software`)**: Home Composer (`Video`, `Demo`, `Visuals`, `Collection` tabs), Aspect Ratio/Length/Media menus, Sort & List views, Starter Templates, AI Credits popover, `+ Create` menu, `⌃K` Search Command Palette, Help menu, Library, Team Insights, Leads, Inbox, Projects, Videos, Shared, AI Memory, Connectors, Impact Analysis, Usage, Purchase Credits, Referral, Resources, Trash, Archived, Community Showcase, Starter Player modal, AI Video Studio, AI Visuals Studio |
| `70_app_*` – `97_insights_tab_activity.png` | 39 | **Interactive Demo (`Flow`) Editor & Player (`4fLyMFzH8BjqgKQF4Bd6`)**: Start from scratch, Desktop app modal, Flow Editor main canvas, Design inspector (top/mid/bottom), Generate with AI modal, Uploaded screenshot steps, `Hotspot`, `Callout`, `Area`, `Pan and zoom`, `Voiceover`, `Recording` tools, `+ Add step` menu, `Chapter` step (`Buttons` & `Lead Form` variants), Step `...` context menu, `Library` modal, `Translations AI`, `Variables`, `Menu`, `Linear view`, `Script view`, `Options` menu, `Collection` editor, `Share` popover, `Embed` modal, `Video & GIF` export modal, `Preview` mode, `Flow Insights`, `Step-by-Step Guide`, and Public Share Player & Guide (`/share/319HqogqYEOZH11srxTM`) |
| `100_settings_*` – `115_settings_advanced_page.png` | 10 | **Settings, Billing, Onboarding & Upgrade Checkout**: General settings, Billing & Plans comparison, Create Team 4-step wizard, Extension installed state, Welcome onboarding survey, Create Workspace page, Pro upgrade checkout, Growth upgrade checkout, and Advanced settings |
| `120_brand_kit_*` – `140_whoami_video_share_player_ready.png` | 145 | **`whoami.genisisiq.com` Brand Kit & 30s AI Launch Video (`qGe4L499rr5AsLtm6F4q`)**: Brand Kit 1-Minute Setup modal, URL entry, AI extraction progress, AI Video prompt & menus, all 16 live steps of the 7-stage AI Video Agent pipeline, Custom Code AI Video Editor, all 6 rendered Bauhaus portfolio scenes, live playback frames, `Design` tab color & scene text inspectors across all 6 scenes, `@Scene` picker, `v1` version menu, `+ Add scene` modal, `Share` modal, `Export` modal (`1080p`/`4K`, `24`/`30`/`60 FPS`), **5-Track NLE Timeline** (`Pan & Zoom`, `Voiceover` inspector with 18+ ElevenLabs voices, `Edit pronunciation`, `Edit all scripts`, `Music` inspector, `SFX` inspector), completed `7.82 MB` MP4 export, and live `/share/videos/qGe4L499rr5AsLtm6F4q` player |
| `141_*` – `147c_collection_add_arcades_modal.png` | 26 | **13-Tab `whoami.genisisiq.com` Brand Kit Editor (`XE1uVIkZSLQJth6oUMJ0`), Privacy, Team Insights & Collection Modals**: Populated Home & Recent feed, Brand Kits list, and all 13 Brand Kit Editor sections (`Home`, `Sources`, `Logos`, `Colors`, `Fonts`, `Photography`, `Backgrounds`, `Illustrations`, `Product`, `Voice`, `Tones`, `Demo`, `Share page`, `Custom elements`), Privacy settings, Team Insights (`Activity`, `Audience`, `Arcades`), and Collection Editor (`Edit Header` & `Add Arcades` modals) |
| `148a_*` – `152e_whoami_visual_multi_format_linkedin.png` | 24 | **`whoami.genisisiq.com` Second AI Launch Film (`RFY3pPzp6G8E5xJXINUh`), AI Visuals Studio & Visual Canvas Editor (`mVkkeVB4j15x799NHwBH`)**: AI Visuals Welcome modal, Interactive Demo attachment picker, generated `whoami.genisisiq.com` cards across `Social Announcement`, `Product Benefits`, `Feature Highlight`, and `Website Hero`, `whoami Launch Film` (16s, 4 scenes), **Visual Canvas Editor** (`Template` picker, `+ Add visual` 28-preset multi-platform menu, `Export`, `Animate` mode, multi-format `LinkedIn post landscape`), and claiming the **200 bonus AI credits** on Workspace Home |

---

## 16. End-to-End Implementation Blueprint for Cloning Arcade

To build a full-fidelity clone of Arcade based on this specification:

1. **Database & Storage Layer (PostgreSQL/Prisma or Firestore + S3/GCS)**:
   - Implement the 7 core entities documented in Section 6: `Workspace`, `User`, `BrandKit`, `Flow` (with polymorphic `steps[]` supporting `IMAGE`, `VIDEO`, `CHAPTER` and overlays `hotspots[]`, `callouts[]`, `areas[]`, `panAndZoom`), `PromptVideo` (with `sessionId`, `designSchema`, and 5-track `timeline`), `VisualProject` (with multi-aspect-ratio `visuals[]`), and `Collection`.
2. **Brand Kit AI Extractor (`/api/ai/brand-kit`)**:
   - Use Playwright headless browser to render the target URL, extract computed colors/fonts/logos/screenshots, generate 5 brand background textures via an image generation model, and prompt an LLM to output the structured JSON for `Product` (`tagline`, `description`, `icp[]`, `keyMessaging[]`), `Voice`, and `Tones`.
3. **Interactive Demo (`Flow`) Editor & Player (`/flows/[pid]/edit` & `/share/[shareId]`)**:
   - Build a normalized percentage-coordinate (`x: 0..1, y: 0..1`) stage canvas so Hotspots, Callouts, Blur Areas, and Pan-and-Zoom bounding boxes scale losslessly across desktop, embed iframes, and mobile viewports.
   - Auto-derive the `/guide` view by iterating over `steps[]`, rendering each step screenshot with a numbered badge at `hotspot.{x,y}` and its `tooltipText` below.
4. **Agentic AI Video Studio & Remotion NLE (`/prompt-videos/custom/[pid]/edit`)**:
   - Implement the 7-stage agent state machine streaming status updates to the `Chat` tab while generating a `@remotion/player` composition + JSON `designSchema` (driving the `Design` tab color pickers and text inputs) and a 5-track timeline (`Pan & Zoom`, ElevenLabs `Voiceover`, `Scenes`, `Music`, `SFX`).
   - Use `@remotion/renderer` in a background worker to export `1080p`/`4K` MP4 files and publish them to `/share/videos/[pid]`.
5. **AI Visuals Studio & Multi-Format Canvas (`/visual-projects/[pid]/edit`)**:
   - Combine Brand Kit tokens + Flow screenshots + LLM headline generation into parameterized HTML/CSS/Canvas templates resizable across all 28 social/ad aspect ratios (`1080×1080`, `1200×628`, `1080×1920`, etc.) with static PNG and animated MP4 export.
