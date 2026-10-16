# Arcade Platform Clone — Complete Engineering Documentation Suite

This directory contains the complete engineering specification suite to implement a 100% feature-complete clone of **Arcade** (`https://www.arcade.software` and `https://app.arcade.software`), backed by **314 verified screenshots** in `/home/azadmin/Arcade/screenshots/`.

---

## Documentation Index

| # | Document | Path | Size / Scope |
|---|---|---|---|
| **0** | **Reverse-Engineering & Feature Architecture Report** | [`../ARCADE_FEATURE_ARCHITECTURE_DESIGN_REPORT.md`](../ARCADE_FEATURE_ARCHITECTURE_DESIGN_REPORT.md) | 16-section empirical reverse-engineering report covering all 160 routes, 35+ APIs, 279 CSS tokens, Firestore schemas, and live `whoami.genisisiq.com` Brand Kit, AI Videos, Flow Demo, and AI Visuals tests. |
| **1** | **Architecture Decision Records (ADR)** | [`./01_ADR_ARCHITECTURE_DECISION_RECORDS.md`](./01_ADR_ARCHITECTURE_DECISION_RECORDS.md) | **12 ADRs** (`ADR-001` through `ADR-012`): Next.js unified monorepo, PostgreSQL/SQLite + Prisma JSONB persistence, `[0..1]` normalized Flow coordinate space, Remotion programmatic video engine + `designSchema` inspector, 7-stage SSE AI Video Agent, 5-track NLE timeline, Playwright + LLM Brand Kit extractor, 28-preset Multi-Format Visuals engine, TTS + Pronunciation + Translations AI, RBAC & Credit Ledger, 3-layer Design Tokens, and Share Player + Auto-Guide + Telemetry. |
| **2** | **Product & Functional Requirements (PRD)** | [`./02_REQUIREMENTS_SPECIFICATION.md`](./02_REQUIREMENTS_SPECIFICATION.md) | **10 Functional Modules + NFRs** (`REQ-MKT-*`, `REQ-AUTH-*`, `REQ-WS-*`, `REQ-BRAND-*`, `REQ-FLOW-*`, `REQ-VIDEO-*`, `REQ-VISUAL-*`, `REQ-COLL-*`, `REQ-DATA-*`, `REQ-SET-*`, `REQ-NFR-*`) with explicit acceptance criteria and screenshot references (`00`–`152e`). |
| **3** | **System & UI/UX Design Document** | [`./03_SYSTEM_AND_UI_UX_DESIGN.md`](./03_SYSTEM_AND_UI_UX_DESIGN.md) | Complete system architecture diagram, CSS custom properties across Marketing / Workspace / Dynamic Brand Kit themes, **5 Master UI Layout Shells** with viewport geometry wireframes, Zustand store architecture, Interactive State Machines, coordinate/zoom/timeline math formulas, and a **29-item Modal/Popover Catalog**. |
| **4** | **Technical Implementation Specification** | [`./04_TECHNICAL_IMPLEMENTATION_SPEC.md`](./04_TECHNICAL_IMPLEMENTATION_SPEC.md) | Production-ready **`prisma/schema.prisma`** (19 models), **`src/types/domain.ts`** JSONB TypeScript interfaces, **38 REST/SSE API endpoint contracts**, 6 Remotion scene archetypes + `designSchema` binding spec, all **28 Multi-Format Visual presets**, complete **Next.js `src/app` route tree**, and a **6-Phase Implementation Plan**. |

---

## Visual Reference Library (`../screenshots/`)

All **314 PNG screenshots** captured during live exploration and `whoami.genisisiq.com` feature testing are stored in `/home/azadmin/Arcade/screenshots/`:

- `01_www_*` – `26_demo_embed_player.png` (30 screenshots): Marketing website (`www.arcade.software`)
- `30_app_*` – `66d_ai_visual_project_populated.png` (39 screenshots): Workspace Home, 4-tab AI Composer, Sidebar menus, `⌃K` Command Palette, Library, Insights, Leads, Inbox, Memory, Connectors, Impact Analysis, Usage, Credits, Studios
- `70_app_*` – `97_insights_tab_activity.png` (39 screenshots): Interactive Demo (`Flow`) Editor, 6 Canvas Tools, Chapters (`Buttons` & `Lead Form`), Built-in Image Editor, 7 Right-Rail Panels, Share/Embed/Export modals, Flow Insights, Step-by-Step Guide, Public Share Player
- `100_settings_*` – `115_settings_advanced_page.png` & `145z` (11 screenshots): Workspace Settings (`General`, `Privacy`, `Billing & Plans`, `Advanced`), `Create Team`, `Welcome`, `Create Workspace`, `Pro` & `Growth` Upgrade Checkouts
- `120_brand_kit_*` – `140_whoami_video_share_player_ready.png` & `150a`–`150c` (150 screenshots): `whoami.genisisiq.com` Brand Kit AI Setup, 7-Stage AI Video Agent (`30s` & `16s` Launch Videos), Custom Code Remotion Scene Previews, `Design` Inspector, **5-Track NLE Timeline** (`Pan & Zoom`, `Voiceover` + Pronunciation + All Scripts, `Scenes`, `Music`, `SFX`), 1080p MP4 Export, and `/share/videos/[pid]` Player
- `141_*` – `147c_*` (25 screenshots): All **13 Sections of the Brand Kit Editor**, Team Insights (`Activity`, `Audience`, `Arcades`), and Collection Editor (`Edit Header` & `Add Arcades` modals)
- `148a_*` – `152e_*` (20 screenshots): `whoami.genisisiq.com` AI Visuals Studio (4 categories) & **Multi-Format Visual Canvas Editor** (28 presets across 7 platforms, `Template` picker, `Animate` mode, Avery AI, Export) + Claiming 200 Bonus AI Credits
