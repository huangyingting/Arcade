# Technical Implementation Specification — Arcade Platform Clone

> Original proposed contracts, not current runtime documentation. The implementation now uses Next.js 16, database sessions, private media, real Chromium/FFmpeg rendering and explicit provider failures; see [current operations](05_PRODUCTION_OPERATIONS.md).

**Project**: Arcade Full-Stack Platform (`www.arcade.software` + `app.arcade.software`)  
**Version**: 1.0  
**Date**: 2026-10-15  
**Target Stack**: Next.js 14/15 (App Router, TypeScript), Tailwind CSS, Zustand, Prisma ORM (PostgreSQL / SQLite), Remotion (`@remotion/player` + `@remotion/renderer`), Playwright (Brand Kit & URL Scraper)

---

## Table of Contents

1. [Complete Prisma Database Schema (`prisma/schema.prisma`)](#1-complete-prisma-database-schema-prismaschemaprisma)
2. [TypeScript Domain & JSONB Schema Interfaces (`src/types/domain.ts`)](#2-typescript-domain--jsonb-schema-interfaces-srctypesdomaints)
3. [Complete REST & SSE API Specification (38 Endpoints)](#3-complete-rest--sse-api-specification-38-endpoints)
4. [Programmatic Video Scene Engine & `designSchema` Binding Specification](#4-programmatic-video-scene-engine--designschema-binding-specification)
5. [Multi-Format Visual Preset Catalog (All 28 Presets Across 7 Platforms)](#5-multi-format-visual-preset-catalog-all-28-presets-across-7-platforms)
6. [Complete Next.js Source Tree & Route Mapping](#6-complete-nextjs-source-tree--route-mapping)
7. [Phased Implementation & Verification Plan](#7-phased-implementation--verification-plan)

---

## 1. Complete Prisma Database Schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // Or "sqlite" for zero-config local execution
  url      = env("DATABASE_URL")
}

enum PlanTier {
  FREE
  PRO
  GROWTH
  ENTERPRISE
}

enum MemberRole {
  OWNER
  ADMIN
  EDITOR
  VIEWER
}

enum AssetStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
  DELETED
}

enum VideoSessionState {
  QUEUED
  UNDERSTAND
  STORYBOARD
  SCRIPT
  GENERATE_SCENES
  REVIEW
  VOICEOVER
  SOUND_EFFECTS
  COMPLETED
  FAILED
}

model User {
  id                 String            @id @default(cuid())
  email              String            @unique
  name               String
  avatarUrl          String?
  passwordHash       String?
  onboardingRole     String?
  onboardingGoalsJson String           @default("[]") // ["demos", "videos", "visuals"]
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt

  memberships        WorkspaceMember[]
  teamMemberships    TeamMember[]
  createdFlows       Flow[]
  createdVideos      PromptVideo[]
  createdVisuals     VisualProject[]
  createdCollections Collection[]
  notifications      InboxNotification[]
}

model Workspace {
  id                        String            @id @default(cuid())
  name                      String
  slug                      String            @unique
  iconUrl                   String?
  planTier                  PlanTier          @default(FREE)
  billingInterval           String            @default("annual") // "monthly" | "annual"
  monthlyCreditsQuota       Int               @default(200)
  bonusCreditsBalance       Int               @default(0)
  usedCreditsThisCycle      Int               @default(0)
  onboardingChecklistJson   String            @default("{\"brandKit\":false,\"video\":false,\"demo\":false,\"visuals\":false,\"share\":false,\"claimedBonus\":false}")
  privacySettingsJson       String            @default("{\"collectViewerAnalytics\":true,\"showCookieBanner\":false,\"anonymizeIp\":false,\"retentionDays\":365}")
  translationSettingsJson   String            @default("{\"defaultLocale\":\"en\",\"targetLocales\":[\"es\",\"fr\",\"de\",\"ja\"],\"glossary\":[]}")
  pronunciationRulesJson    String            @default("[]") // Array<{ word: string, replacement: string }>
  syntheticVoicesJson       String            @default("{\"defaultVoiceId\":\"ava-natural\",\"customVoices\":[]}")
  advancedSettingsJson      String            @default("{\"ssoEnabled\":false,\"samlEntryPoint\":\"\",\"scimEnabled\":false}")
  createdAt                 DateTime          @default(now())
  updatedAt                 DateTime          @updatedAt

  members                   WorkspaceMember[]
  teams                     Team[]
  folders                   Folder[]
  brandKits                 BrandKit[]
  flows                     Flow[]
  promptVideos              PromptVideo[]
  visualProjects            VisualProject[]
  collections               Collection[]
  leads                     LeadCapture[]
  analyticsEvents           AnalyticsEvent[]
  creditTransactions        CreditTransaction[]
  memories                  WorkspaceMemory[]
  connectors                WorkspaceConnector[]
  integrations              WorkspaceIntegration[]
  customLinks               CustomLink[]
  notifications             InboxNotification[]
}

model WorkspaceMember {
  id          String     @id @default(cuid())
  workspaceId String
  userId      String
  role        MemberRole @default(OWNER)
  joinedAt    DateTime   @default(now())

  workspace   Workspace  @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, userId])
}

model Team {
  id          String       @id @default(cuid())
  workspaceId String
  name        String
  slug        String       // e.g. "me" for personal team or "marketing"
  iconColor   String       @default("#4F46E5")
  isPersonal  Boolean      @default(false)
  createdAt   DateTime     @default(now())

  workspace   Workspace    @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  members     TeamMember[]
  folders     Folder[]
  flows       Flow[]

  @@unique([workspaceId, slug])
}

model TeamMember {
  id        String     @id @default(cuid())
  teamId    String
  userId    String
  role      MemberRole @default(ADMIN)

  team      Team       @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([teamId, userId])
}

model Folder {
  id          String    @id @default(cuid())
  workspaceId String
  teamId      String?
  name        String
  parentId    String?
  createdAt   DateTime  @default(now())

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  team        Team?     @relation(fields: [teamId], references: [id], onDelete: SetNull)
  flows       Flow[]
}

model BrandKit {
  id                  String    @id @default(cuid())
  workspaceId         String
  name                String
  sourceUrl           String
  isDefault           Boolean   @default(false)
  status              String    @default("READY") // "EXTRACTING" | "READY"
  sourcesJson         String    @default("[]")    // Section 1: Sources
  logosJson           String    @default("{}")    // Section 2: Logos (light, dark, icon)
  colorsJson          String    @default("[]")    // Section 3: Colors (Primary, Secondary, Background, Accents)
  fontsJson           String    @default("{}")    // Section 4: Fonts (Heading, Body, Monospace)
  photographyJson     String    @default("[]")    // Section 5: Photography
  backgroundsJson     String    @default("[]")    // Section 6: 5 AI Brand Backgrounds
  illustrationsJson   String    @default("[]")    // Section 7: Illustrations
  productJson         String    @default("{}")    // Section 8: Product Name, Tagline, Description, ICP[], KeyMessaging[]
  voiceJson           String    @default("{}")    // Section 9: Voice overview, Traits[], Dos[], Donts[]
  tonesJson           String    @default("[]")    // Section 10: Tones (Launch, Social, Technical, Sales)
  demoSettingsJson    String    @default("{}")    // Section 11: Default Flow Hotspot/Callout/Wrapper styles
  sharePageJson       String    @default("{}")    // Section 12: Default Share Page header logo, CTA, theme
  customElementsJson  String    @default("[]")    // Section 13: Watermarks, badges, overlays
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  workspace           Workspace       @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  flows               Flow[]
  promptVideos        PromptVideo[]
  visualProjects      VisualProject[]
}

model Flow {
  id               String      @id @default(cuid())
  shareId          String      @unique @default(cuid())
  workspaceId      String
  teamId           String?
  folderId         String?
  brandKitId       String?
  createdById      String
  name             String      @default("Untitled Demo")
  description      String?
  status           AssetStatus @default(PUBLISHED)
  visibility       String      @default("PUBLIC") // "PUBLIC" | "LINK_ONLY" | "PRIVATE"
  aspectRatio      String      @default("16:9")
  thumbnailUrl     String?
  stepsJson        String      @default("[]")     // Polymorphic FlowStep[]
  designJson       String      @default("{}")     // Wrapper, background, padding, shadow, cursor, watermark
  variablesJson    String      @default("[]")     // Array<{ key, label, fallbackValue }>
  translationsJson String      @default("{}")     // Record<locale, LocalizedFlowContent>
  menuJson         String      @default("{\"enabled\":true,\"items\":[]}")
  tagsJson         String      @default("[]")
  viewsCount       Int         @default(0)
  completionsCount Int         @default(0)
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt

  workspace        Workspace   @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  team             Team?       @relation(fields: [teamId], references: [id], onDelete: SetNull)
  folder           Folder?     @relation(fields: [folderId], references: [id], onDelete: SetNull)
  brandKit         BrandKit?   @relation(fields: [brandKitId], references: [id], onDelete: SetNull)
  createdBy        User        @relation(fields: [createdById], references: [id], onDelete: Cascade)
  versions         FlowVersion[]
}

model FlowVersion {
  id            String   @id @default(cuid())
  flowId        String
  versionNumber Int
  stepsJson     String
  designJson    String
  createdAt     DateTime @default(now())

  flow          Flow     @relation(fields: [flowId], references: [id], onDelete: Cascade)
}

model PromptVideo {
  id                 String               @id @default(cuid())
  shareId            String               @unique @default(cuid())
  workspaceId        String
  brandKitId         String?
  createdById        String
  name               String               @default("Untitled AI Video")
  prompt             String
  sourceUrl          String?
  aspectRatio        String               @default("16:9") // "16:9" | "9:16" | "1:1"
  durationSec        Int                  @default(30)     // 15 | 30 | 45 | 60
  fps                Int                  @default(30)     // 24 | 30 | 60
  status             AssetStatus          @default(PUBLISHED)
  currentVersion     Int                  @default(1)
  thumbnailUrl       String?
  scenesJson         String               @default("[]")   // PromptVideoScene[]
  designSchemaJson   String               @default("{}")   // Colors & per-scene field descriptors
  designValuesJson   String               @default("{}")   // Current color hexes & per-scene text values
  timelineJson       String               @default("{}")   // 5-Track NLE: panZoom[], voiceover[], scenes[], music[], sfx[]
  pronunciationJson  String               @default("[]")   // Video-scoped phonetic rules
  exportsJson        String               @default("[]")   // Array<{ id, resolution, fps, status, fileUrl, fileSize, createdAt }>
  viewsCount         Int                  @default(0)
  createdAt          DateTime             @default(now())
  updatedAt          DateTime             @updatedAt

  workspace          Workspace            @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  brandKit           BrandKit?            @relation(fields: [brandKitId], references: [id], onDelete: SetNull)
  createdBy          User                 @relation(fields: [createdById], references: [id], onDelete: Cascade)
  sessions           PromptVideoSession[]
}

model PromptVideoSession {
  id            String            @id @default(cuid())
  promptVideoId String
  versionNumber Int               @default(1)
  state         VideoSessionState @default(UNDERSTAND)
  stagesJson    String            @default("[]") // 7 stages with status, substeps[], timestamps
  messagesJson  String            @default("[]") // Conversational messages & @Scene prompts
  summaryText   String?
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  promptVideo   PromptVideo       @relation(fields: [promptVideoId], references: [id], onDelete: Cascade)
}

model VisualProject {
  id             String      @id @default(cuid())
  workspaceId    String
  brandKitId     String?
  createdById    String
  name           String      @default("Visual project")
  category       String      @default("social_announcement") // "social_announcement" | "product_benefits" | "feature_highlight" | "website_hero"
  prompt         String
  sourceFlowId   String?
  status         AssetStatus @default(PUBLISHED)
  thumbnailUrl   String?
  visualsJson    String      @default("[]") // Array<VisualCanvasItem> across 28 social/ad presets
  templatesJson  String      @default("[]") // Generated candidate cards in Visuals Studio
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  workspace      Workspace   @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  brandKit       BrandKit?   @relation(fields: [brandKitId], references: [id], onDelete: SetNull)
  createdBy      User        @relation(fields: [createdById], references: [id], onDelete: Cascade)
}

model Collection {
  id           String      @id @default(cuid())
  shareId      String      @unique @default(cuid())
  workspaceId  String
  createdById  String
  name         String      @default("Untitled Collection")
  status       AssetStatus @default(PUBLISHED)
  headerJson   String      @default("{\"title\":\"Product Collection\",\"subtitle\":\"Explore our interactive demos and launch videos\",\"logoUrl\":\"\",\"ctaLabel\":\"Get Started\",\"ctaUrl\":\"https://\",\"bgStyle\":\"gradient\"}")
  itemsJson    String      @default("[]") // Array<{ id, assetType: 'FLOW' | 'VIDEO', assetId, order }>
  viewsCount   Int         @default(0)
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  workspace    Workspace   @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  createdBy    User        @relation(fields: [createdById], references: [id], onDelete: Cascade)
}

model AnalyticsEvent {
  id            String    @id @default(cuid())
  workspaceId   String
  assetType     String    // "FLOW" | "VIDEO" | "COLLECTION"
  assetId       String
  assetTitle    String
  visitorId     String
  visitorEmail  String?
  companyName   String?
  companyDomain String?
  country       String    @default("United States")
  deviceType    String    @default("Desktop")
  eventType     String    // "VIEW" | "STEP_VIEW" | "HOTSPOT_CLICK" | "COMPLETE" | "CTA_CLICK"
  stepIndex     Int?
  durationMs    Int       @default(0)
  createdAt     DateTime  @default(now())

  workspace     Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
}

model LeadCapture {
  id             String    @id @default(cuid())
  workspaceId    String
  flowId         String
  flowTitle      String
  email          String
  fullName       String?
  company        String?
  role           String?
  stepsCompleted Int       @default(1)
  totalSteps     Int       @default(1)
  syncedToCrm    Boolean   @default(false)
  createdAt      DateTime  @default(now())

  workspace      Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
}

model CreditTransaction {
  id          String    @id @default(cuid())
  workspaceId String
  actorEmail  String
  actionType  String    // "VIDEO_GENERATION" | "VISUALS_GENERATION" | "FLOW_AI_POLISH" | "ONBOARDING_BONUS_CLAIM" | "CREDIT_TOPUP"
  creditsDelta Int      // e.g. -50 or +200
  description String
  createdAt   DateTime  @default(now())

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
}

model WorkspaceMemory {
  id          String    @id @default(cuid())
  workspaceId String
  category    String    // "Product Fact" | "Terminology" | "ICP" | "Style Rule"
  title       String
  content     String
  source      String    @default("Brand Kit AI")
  createdAt   DateTime  @default(now())

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
}

model WorkspaceConnector {
  id          String    @id @default(cuid())
  workspaceId String
  provider    String    // "github" | "linear" | "notion" | "figma" | "slack" | "gdrive" | "intercom" | "zendesk"
  name        String
  status      String    @default("DISCONNECTED") // "CONNECTED" | "DISCONNECTED"
  lastSyncAt  DateTime?
  configJson  String    @default("{}")

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
}

model WorkspaceIntegration {
  id          String    @id @default(cuid())
  workspaceId String
  provider    String    // "hubspot" | "salesforce" | "marketo" | "slack" | "ga4" | "segment" | "zapier" | "webhook"
  status      String    @default("DISCONNECTED")
  configJson  String    @default("{}")
  updatedAt   DateTime  @updatedAt

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
}

model CustomLink {
  id          String    @id @default(cuid())
  workspaceId String
  assetType   String    // "FLOW" | "VIDEO" | "COLLECTION"
  assetId     String
  slug        String    @unique
  recipient   String?
  viewsCount  Int       @default(0)
  createdAt   DateTime  @default(now())

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
}

model InboxNotification {
  id          String    @id @default(cuid())
  workspaceId String
  userId      String?
  type        String    // "VIDEO_READY" | "LEAD_CAPTURED" | "COMMENT" | "CREDITS_CLAIMED"
  title       String
  body        String
  actionUrl   String?
  isRead      Boolean   @default(false)
  createdAt   DateTime  @default(now())

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user        User?     @relation(fields: [userId], references: [id], onDelete: SetNull)
}
```

---

## 2. TypeScript Domain & JSONB Schema Interfaces (`src/types/domain.ts`)

```ts
// ============================================================================
// 1. INTERACTIVE DEMO (FLOW) STEP & OVERLAY SCHEMAS
// ============================================================================

export type FlowStepType = 'IMAGE' | 'VIDEO' | 'CHAPTER';

export interface HotspotOverlay {
  id: string;
  x: number; // Normalized [0.0 .. 1.0]
  y: number; // Normalized [0.0 .. 1.0]
  style: 'beacon' | 'highlight' | 'invisible';
  color: string; // e.g. "#D4AF37" or "#4F46E5"
  tooltipText: string;
  tooltipPosition: 'auto' | 'top' | 'bottom' | 'left' | 'right';
  trigger: 'click' | 'hover';
  targetType: 'next_step' | 'specific_step' | 'external_url';
  targetStepId?: string;
  targetUrl?: string;
  autoplayDelayMs?: number;
}

export interface CalloutOverlay {
  id: string;
  x: number; // Normalized [0.0 .. 1.0]
  y: number; // Normalized [0.0 .. 1.0]
  title: string;
  body: string;
  theme: 'light' | 'dark' | 'brand';
  pointerDirection: 'none' | 'top' | 'bottom' | 'left' | 'right';
  showNavButtons: boolean;
  primaryButtonLabel: string;
}

export interface AreaOverlay {
  id: string;
  mode: 'blur' | 'highlight' | 'crop';
  x: number;      // Normalized [0.0 .. 1.0]
  y: number;      // Normalized [0.0 .. 1.0]
  width: number;  // Normalized [0.0 .. 1.0]
  height: number; // Normalized [0.0 .. 1.0]
  intensity: number; // Blur radius px (e.g. 12) or dim opacity (0.65)
}

export interface PanAndZoomConfig {
  enabled: boolean;
  x: number;      // Focus box left [0.0 .. 1.0]
  y: number;      // Focus box top [0.0 .. 1.0]
  width: number;  // Focus box width [0.0 .. 1.0]
  height: number; // Focus box height [0.0 .. 1.0]
  scale: number;  // 1.15 to 3.5
}

export interface StepVoiceoverConfig {
  enabled: boolean;
  script: string;
  voiceId: string; // e.g. "ava-natural"
  speed: number;   // 0.5 .. 2.0
  audioUrl?: string;
  durationSec?: number;
}

export interface ChapterButtonItem {
  id: string;
  label: string;
  variant: 'primary' | 'secondary';
  action: 'next_step' | 'jump_to_step' | 'external_url' | 'replay';
  targetStepId?: string;
  targetUrl?: string;
}

export interface ChapterFormField {
  id: string;
  key: 'email' | 'fullName' | 'company' | 'role';
  label: string;
  placeholder: string;
  required: boolean;
}

export interface ChapterConfig {
  title: string;
  subtitle: string;
  alignment: 'center' | 'left';
  backgroundStyle: 'blur_step' | 'solid' | 'gradient' | 'brand_image';
  backgroundValue: string;
  showLogo: boolean;
  interactionMode: 'buttons' | 'form';
  buttons: ChapterButtonItem[];
  formFields: ChapterFormField[];
  formSubmitLabel: string;
  allowSkipForm: boolean;
}

export interface FlowStep {
  id: string;
  order: number;
  type: FlowStepType;
  title: string;
  mediaUrl?: string;
  mediaWidth: number;
  mediaHeight: number;
  // Video recording trim controls (if type === 'VIDEO')
  trimStartSec?: number;
  trimEndSec?: number;
  playbackRate?: number;
  muted?: boolean;
  // Interactive overlays
  hotspots: HotspotOverlay[];
  callouts: CalloutOverlay[];
  areas: AreaOverlay[];
  panAndZoom: PanAndZoomConfig;
  voiceover: StepVoiceoverConfig;
  // Chapter config (if type === 'CHAPTER')
  chapter?: ChapterConfig;
}

// ============================================================================
// 2. AI VIDEO STUDIO, DESIGN SCHEMA & 5-TRACK NLE TIMELINE SCHEMAS
// ============================================================================

export type VideoSceneArchetype =
  | 'HERO_SPLIT'
  | 'BROWSER_SPOTLIGHT'
  | 'METRIC_BENTO'
  | 'FEATURE_CARDS'
  | 'KINETIC_STATEMENT'
  | 'END_CARD_CTA';

export interface DesignSchemaColorField {
  key: 'BackgroundPrimary' | 'BackgroundSecondary' | 'TextPrimary' | 'TextSecondary' | 'AccentPrimary' | 'AccentSecondary';
  label: string;
  defaultHex: string;
}

export interface DesignSchemaSceneField {
  key: string; // e.g. "TitleText", "SubtitleText", "BadgeText", "Metric1Value", "Metric1Label", "CtaUrl"
  label: string;
  type: 'text' | 'textarea' | 'url' | 'image';
}

export interface PromptVideoDesignSchema {
  colors: DesignSchemaColorField[];
  scenes: Array<{
    sceneId: string;
    sceneNumber: number;
    title: string;
    archetype: VideoSceneArchetype;
    fields: DesignSchemaSceneField[];
  }>;
}

export interface PromptVideoDesignValues {
  colors: Record<string, string>; // key -> hex
  scenes: Record<string, Record<string, string>>; // sceneId -> { fieldKey: value }
}

export interface NlePanZoomItem {
  id: string;
  sceneId: string;
  startSec: number;
  endSec: number;
  scale: number;  // 1.15 .. 3.0
  targetX: number; // 0.0 .. 1.0
  targetY: number; // 0.0 .. 1.0
  width: number;   // 0.2 .. 0.9
  height: number;  // 0.2 .. 0.9
}

export interface NleVoiceoverItem {
  id: string;
  sceneId: string;
  sceneNumber: number;
  startSec: number;
  endSec: number;
  script: string;
  voiceId: string;
  voiceName: string;
  speed: number;
  volume: number; // 0..100
  audioUrl: string;
}

export interface NleSceneItem {
  id: string;
  sceneNumber: number;
  title: string;
  archetype: VideoSceneArchetype;
  startSec: number;
  durationSec: number;
  screenshotUrl?: string;
}

export interface NleMusicItem {
  id: string;
  trackName: string;
  genre: string;
  startSec: number;
  durationSec: number;
  volume: number; // 0..100
  audioUrl: string;
}

export interface NleSfxItem {
  id: string;
  effectType: 'Whoosh' | 'Click' | 'Pop' | 'Chime' | 'Swoosh' | 'Riser';
  startSec: number;
  durationSec: number;
  volume: number; // 0..100
  audioUrl: string;
}

export interface VideoTimeline {
  totalDurationSec: number;
  fps: number;
  panZoomTrack: NlePanZoomItem[];
  voiceoverTrack: NleVoiceoverItem[];
  scenesTrack: NleSceneItem[];
  musicTrack: NleMusicItem[];
  sfxTrack: NleSfxItem[];
}
```

---

## 3. Complete REST & SSE API Specification (38 Endpoints)

### 3.1 Authentication, User & Workspace Routes
| Method | Endpoint | Purpose & Payload Contract |
|---|---|---|
| `POST` | `/api/login` | Validates credentials / Firebase token, sets `ArcadeApp.AuthUserTokens` cookie, returns `{ user, defaultWorkspace }`. |
| `POST` | `/api/logout` | Clears session cookies and redirects to `/auth`. |
| `POST` | `/api/welcome` | Saves onboarding role & product goals (`Interactive Demos`, `AI Videos`, `AI Visuals`). |
| `GET` | `/api/workspaces` | Lists all workspaces for the current user. |
| `POST` | `/api/workspaces` | Creates a new workspace (`{ name, slug, iconUrl }`) with default Free plan & 200 AI credits. |
| `GET` | `/api/workspaces/[slug]` | Returns workspace metadata, credit balance, onboarding checklist, and recent assets (`flows`, `videos`, `visuals`, `collections`). |
| `PATCH` | `/api/workspaces/[slug]/settings` | Updates `General`, `Privacy`, `Translations`, `SyntheticVoices`, or `Advanced` settings. |
| `POST` | `/api/workspaces/[slug]/claim-credits` | Verifies 5-step Getting Started checklist completion and adds `+200` bonus credits (`152b_home_claimed_200_credits.png`). |
| `POST` | `/api/workspaces/[slug]/upgrade` | Upgrades workspace plan (`PRO` or `GROWTH`, `monthly` or `annual`) and updates credit quota (`101`, `113`, `114`). |
| `POST` | `/api/workspaces/[slug]/purchase-credits` | Tops up bonus AI credits (`+500`, `+2000`, `+5000` in `58_app_purchase_credits.png`). |
| `GET` | `/api/search` | Global `Command+K` (`⌃K`) search across Flows, Videos, Visuals, Collections, Brand Kits, and folders (`44`). |

### 3.2 Brand Kit 1-Minute AI Extractor & 13-Tab Editor Routes
| Method | Endpoint | Purpose & Payload Contract |
|---|---|---|
| `GET` | `/api/workspaces/[slug]/brand-kits` | Lists all Brand Kits in the workspace (`142a`). |
| `POST` | `/api/workspaces/[slug]/brand-kits/extract` | Accepts `{ url: string }` (e.g., `https://whoami.genisisiq.com`). Crawls DOM, styles, logos, screenshots, palette, fonts, ICP, messaging, voice, and tones across all 13 sections (`120`–`123`). |
| `GET` | `/api/brand-kits/[id]` | Fetches full 13-section Brand Kit document (`142b`–`144_brand_kit_*`). |
| `PATCH` | `/api/brand-kits/[id]` | Updates any of the 13 Brand Kit sections (`sources`, `logos`, `colors`, `fonts`, `photography`, `backgrounds`, `illustrations`, `product`, `voice`, `tones`, `demoSettings`, `sharePage`, `customElements`). |

### 3.3 Interactive Demo (`Flow`) Editor & Player Routes
| Method | Endpoint | Purpose & Payload Contract |
|---|---|---|
| `POST` | `/api/flows` | Creates a new Flow (`Start from scratch`, `Upload media`, or `Starter template`) and returns `{ id, shareId }`. |
| `GET` | `/api/flows/[pid]` | Returns full `Flow` document including `steps[]`, `design`, `variables`, `translations`, `menu`, and `brandKit`. |
| `PUT` | `/api/flows/[pid]` | Saves step edits, hotspots, callouts, blur areas, pan & zoom, voiceovers, chapters, or step reordering (`71`–`88`). |
| `POST` | `/api/flows/[pid]/ai-generate` | Auto-generates step callout copy, chapter intros/outros, and voiceover scripts (`75`, `91e`). |
| `POST` | `/api/flows/[pid]/translate` | Translates all Flow text & voiceovers into target locales (`84_flow_editor_rail_translations_ai.png`). |
| `POST` | `/api/flows/[pid]/export-video` | Renders the Interactive Demo into a downloadable `.mp4` or `.gif` (`91d_flow_share_video_gif_modal.png`). |

### 3.4 Agentic AI Video Studio, 5-Track NLE & MP4 Export Routes
| Method | Endpoint | Purpose & Payload Contract |
|---|---|---|
| `POST` | `/api/prompt-videos/generate` | Accepts `{ prompt, sourceUrl, aspectRatio, durationSec, brandKitId, attachedFlowIds }` (`124`). Deducts 50 credits, creates `PromptVideo` + `PromptVideoSession`, and starts the 7-stage agent pipeline. |
| `GET` | `/api/prompt-videos/[pid]` | Returns full `PromptVideo` (`scenes`, `designSchema`, `designValues`, `timeline`, `pronunciation`, `exports`) and active `PromptVideoSession`. |
| `GET` | `/api/prompt-videos/[pid]/stream` | Server-Sent Events (SSE) stream emitting real-time 7-stage agent updates (`Understand` -> `Storyboard` -> `Script` -> `Generate Scenes` -> `Review` -> `Voiceover` -> `Sound Effects` in `125_whoami_video_step_1`..`16`). |
| `POST` | `/api/prompt-videos/[pid]/chat` | Submits a follow-up prompt (with optional `@Scene N` scope from `133`) to refine scenes, colors, or copy and creates version `v2` (`134`). |
| `PATCH` | `/api/prompt-videos/[pid]/design` | Updates `designValues` (`Colors` hexes or `Scene N Text` fields from `132a`–`132d`) or 5-track NLE `timeline` (`139a`–`139h`). |
| `POST` | `/api/prompt-videos/[pid]/voiceover` | Regenerates single-scene or bulk `Edit all scripts` (`139h`) TTS audio applying `pronunciation` rules (`139g`). |
| `POST` | `/api/prompt-videos/[pid]/export` | Starts an MP4 render job (`720p`/`1080p`/`4K` at `24`/`30`/`60 FPS` in `137`, `139e`) and returns downloadable `.mp4` URL. |

### 3.5 AI Visuals Studio & Multi-Format Canvas Editor Routes
| Method | Endpoint | Purpose & Payload Contract |
|---|---|---|
| `POST` | `/api/visual-projects/generate` | Accepts `{ category, prompt, brandKitId, sourceFlowId }` (`148d`). Generates branded visual template candidates across `Social Announcement`, `Product Benefits`, `Feature Highlight`, and `Website Hero` (`151a`–`151e`). |
| `GET` | `/api/visual-projects/[pid]` | Returns `VisualProject` and its multi-format `visuals[]` array (`151g`, `152e`). |
| `PATCH` | `/api/visual-projects/[pid]` | Updates visual templates, adds any of the 28 social/ad presets (`151i`), toggles `Animate` (`152d`), or updates background/text/CTA. |
| `POST` | `/api/visual-projects/[pid]/avery` | Executes `Generate background with Avery` or `Generate headline with Avery` (`151g`). |
| `POST` | `/api/visual-projects/[pid]/export` | Exports selected multi-format visuals as `.png` or animated `.mp4` (`151j`). |

### 3.6 Collections, Analytics, Leads, Memory & Connectors Routes
| Method | Endpoint | Purpose & Payload Contract |
|---|---|---|
| `POST` / `PUT` | `/api/collections` & `/api/collections/[pid]` | Creates/updates a Collection microsite (`header` + bundled `items[]` of Flows and Videos in `147a`–`147c`). |
| `POST` | `/api/analytics/events` | Ingests viewer telemetry events from `/share/*` and `/embed/*` (`93`, `146a`). |
| `GET` | `/api/workspaces/[slug]/insights` | Returns aggregated KPI cards, time-series activity, audience company table, and per-arcade metrics (`146`–`146b`). |
| `POST` / `GET` | `/api/leads` | Captures Chapter Lead Form submissions (`82g`) and lists workspace leads (`49_app_team_leads.png`). |
| `GET` / `POST` | `/api/workspaces/[slug]/memory` & `/connectors` | Manages AI Memory facts (`54`) and external product Connectors (`55`). |

---

## 4. Programmatic Video Scene Engine & `designSchema` Binding Specification

To replicate the exact behavior captured in `130_scene2_whoami_video.png` – `130_scene6_whoami_video.png`, `132_scene1_design_inspector.png` – `132_scene6_design_inspector.png`, and `150a`–`150c`:

1. **6 Parameterized Remotion Scene Archetypes**:
   - **`Scene 1 — HERO_SPLIT`**: Bold kinetic headline (`TitleText`), subtitle (`SubtitleText`), top badge pill (`BadgeText`), and animated 3D browser frame displaying the site hero screenshot with Brand Kit accent glow.
   - **`Scene 2 — METRIC_BENTO`**: 3 animated counter cards (`Metric1Value` / `Metric1Label`, `Metric2Value` / `Metric2Label`, `Metric3Value` / `Metric3Label`) with Bauhaus geometric accent bars (e.g., `120+ Verified AI Badges`, `2,300+ AI Use Cases`, `SC-100 Security Verified`).
   - **`Scene 3 — BROWSER_SPOTLIGHT`**: Smooth camera pan-and-zoom across the target site's core interactive workflow with an animated cursor clicking a highlighted CTA.
   - **`Scene 4 — FEATURE_CARDS`**: 3 staggered feature pillars (`Card1Title`/`Card1Body`, `Card2Title`/`Card2Body`, `Card3Title`/`Card3Body`) with animated SVG icons.
   - **`Scene 5 — KINETIC_STATEMENT`**: High-contrast full-bleed typographic manifesto (`QuoteText`, `AuthorText`) with subtle particle/grid motion.
   - **`Scene 6 — END_CARD_CTA`**: Brand logo lockup, closing headline (`CtaHeadline`), action button pill (`CtaButtonText`), and URL badge (`CtaUrl`, e.g., `whoami.genisisiq.com`).

2. **Two-Way Binding Between `Design` Tab and Canvas**:
   - Every scene reads its colors from `designValues.colors` (`BackgroundPrimary`, `BackgroundSecondary`, `TextPrimary`, `TextSecondary`, `AccentPrimary`, `AccentSecondary`) and its text strings from `designValues.scenes[sceneId]`.
   - Changing any color picker or text field in `<VideoDesignInspector />` (`132a`–`132d`) immediately updates `designValues` in `useVideoEditorStore`, re-rendering the current frame in `<RemotionVideoStage />` within `< 16ms`.

---

## 5. Multi-Format Visual Preset Catalog (All 28 Presets Across 7 Platforms)

Extracted from `151i_whoami_visual_add_visual_popover.png` for `src/lib/visual-presets.ts`:

```ts
export const VISUAL_SIZE_PRESETS = [
  // LinkedIn (8)
  { id: 'li-ad-sq', platform: 'LinkedIn', name: 'Ad square', width: 1200, height: 1200 },
  { id: 'li-ad-land', platform: 'LinkedIn', name: 'Ad landscape', width: 1200, height: 628 },
  { id: 'li-ad-port', platform: 'LinkedIn', name: 'Ad portrait', width: 720, height: 900 },
  { id: 'li-post-sq', platform: 'LinkedIn', name: 'Post square', width: 1080, height: 1080 },
  { id: 'li-post-land', platform: 'LinkedIn', name: 'Post landscape', width: 1200, height: 626 },
  { id: 'li-post-port', platform: 'LinkedIn', name: 'Post portrait', width: 626, height: 1200 },
  { id: 'li-banner-prof', platform: 'LinkedIn', name: 'Profile banner', width: 1584, height: 396 },
  { id: 'li-banner-art', platform: 'LinkedIn', name: 'Article banner', width: 1920, height: 1080 },
  // Facebook (5)
  { id: 'fb-ad-sq', platform: 'Facebook', name: 'Ad square', width: 1440, height: 1440 },
  { id: 'fb-ad-port', platform: 'Facebook', name: 'Ad portrait', width: 1440, height: 1800 },
  { id: 'fb-post', platform: 'Facebook', name: 'Post', width: 1200, height: 630 },
  { id: 'fb-stories', platform: 'Facebook', name: 'Stories', width: 1080, height: 1920 },
  { id: 'fb-cover', platform: 'Facebook', name: 'Cover', width: 851, height: 315 },
  // Instagram (5)
  { id: 'ig-ad', platform: 'Instagram', name: 'Ad', width: 1440, height: 1440 },
  { id: 'ig-post-sq', platform: 'Instagram', name: 'Post square', width: 1080, height: 1080 },
  { id: 'ig-post-port', platform: 'Instagram', name: 'Post portrait', width: 1080, height: 1350 },
  { id: 'ig-stories', platform: 'Instagram', name: 'Stories', width: 1080, height: 1920 },
  { id: 'ig-reels', platform: 'Instagram', name: 'Reels', width: 1080, height: 1920 },
  // X (2)
  { id: 'x-post', platform: 'X', name: 'Post', width: 1200, height: 675 },
  { id: 'x-banner', platform: 'X', name: 'Banner', width: 1500, height: 500 },
  // TikTok (1)
  { id: 'tt-post', platform: 'TikTok', name: 'Post', width: 1080, height: 1920 },
  // YouTube (2)
  { id: 'yt-shorts', platform: 'YouTube', name: 'Shorts', width: 1080, height: 1920 },
  { id: 'yt-thumb', platform: 'YouTube', name: 'Thumbnail', width: 1280, height: 720 },
  // Google Ads (5)
  { id: 'ga-leader', platform: 'Google Ads', name: 'Leaderboard', width: 728, height: 90 },
  { id: 'ga-lg-rect', platform: 'Google Ads', name: 'Large rectangle', width: 336, height: 280 },
  { id: 'ga-md-rect', platform: 'Google Ads', name: 'Medium rectangle', width: 300, height: 250 },
  { id: 'ga-mob-ban', platform: 'Google Ads', name: 'Mobile banner', width: 300, height: 50 },
  { id: 'ga-sky', platform: 'Google Ads', name: 'Wide skyscraper', width: 160, height: 600 },
] as const;
```

---

## 6. Complete Next.js Source Tree & Route Mapping

```text
src/
├── app/
│   ├── (marketing)/                           # www.arcade.software routes (01_www_* .. 25_www_*)
│   │   ├── layout.tsx                         # Marketing header mega-menus + footer
│   │   ├── page.tsx                           # Home hero (AI Video/Demo switcher) + 5 use-case tabs
│   │   ├── product/
│   │   │   ├── interactive-demo/page.tsx      # 02_www_product_interactive_demo.png
│   │   │   ├── ai-video/page.tsx              # 03_www_product_ai_video.png
│   │   │   └── personalization/page.tsx       # 04_www_product_personalization.png
│   │   ├── agents/page.tsx                    # 05_www_agents.png
│   │   ├── brand/page.tsx                     # 06_www_brand.png
│   │   ├── pricing/page.tsx                   # 07_www_pricing.png (Monthly/Annual, matrix, FAQ)
│   │   ├── enterprise/page.tsx                # 08_www_enterprise.png
│   │   ├── integrations/page.tsx              # 09_www_integrations.png
│   │   ├── showcase/page.tsx                  # 10_www_showcase.png
│   │   ├── download/page.tsx                  # 11_www_download.png
│   │   ├── changelog/page.tsx                 # 12_www_changelog.png
│   │   ├── solutions/[slug]/page.tsx          # 13..16 (PMM, Growth, PM, Sales Eng)
│   │   └── [resourceSlug]/page.tsx            # 17..25 (case-studies, blog, security, contact-sales, etc.)
│   │
│   ├── (auth)/                                # Onboarding & Workspace Creation
│   │   ├── auth/page.tsx                      # Sign in / Sign up
│   │   ├── welcome/page.tsx                   # 109_welcome_onboarding.png (4-step survey)
│   │   └── workspaces/create/page.tsx         # 110_workspaces_create.png
│   │
│   ├── (workspace)/workspaces/[workspaceSlug]/# 240px Sidebar App Shell (30_app_* .. 63_app_*)
│   │   ├── layout.tsx                         # Sidebar + Command+K palette + AI Credits popover
│   │   ├── home/page.tsx                      # 4-Tab AI Composer, 5-step checklist, Recent feed
│   │   ├── start-with-ai/
│   │   │   ├── video/page.tsx                 # 65, 124_ai_video_prompt_whoami_entered.png
│   │   │   └── visuals/page.tsx               # 66, 148a..151e AI Visuals Studio
│   │   ├── teams/[teamSlug]/
│   │   │   ├── arcades/page.tsx               # 47, 152c Unified Library (All/Demos/Videos/Visuals/Collections)
│   │   │   ├── insights/page.tsx              # 48, 146a..146b Team Insights (Activity/Audience/Arcades)
│   │   │   └── leads/page.tsx                 # 49_app_team_leads.png
│   │   ├── create-team/page.tsx               # 106_workspace_create_team.png (4-step wizard)
│   │   ├── inbox/page.tsx                     # 50_app_inbox.png
│   │   ├── projects/page.tsx                  # 51_app_projects.png
│   │   ├── videos/page.tsx                    # 52_app_videos.png
│   │   ├── shared/page.tsx                    # 53_app_shared.png
│   │   ├── memory/page.tsx                    # 54_app_memory.png
│   │   ├── connectors/page.tsx                # 55_app_connectors.png
│   │   ├── impact-analysis/page.tsx           # 56_app_impact_analysis.png
│   │   ├── usage/page.tsx                     # 57_app_usage.png
│   │   ├── purchase-credits/page.tsx          # 58_app_purchase_credits.png
│   │   ├── referral/page.tsx                  # 59_app_referral.png
│   │   ├── resources/page.tsx                 # 60_app_resources.png
│   │   ├── upgrade/[plan]/page.tsx            # 113_upgrade_pro_page.png, 114_upgrade_growth_page.png
│   │   └── settings/
│   │       ├── page.tsx                       # 100_settings_general.png
│   │       ├── privacy/page.tsx               # 145z_settings_privacy_page.png
│   │       ├── billing/page.tsx               # 101_settings_billing.png
│   │       ├── advanced/page.tsx              # 115_settings_advanced_page.png
│   │       ├── members/page.tsx               # Workspace Members & Invites
│   │       ├── integrations/page.tsx          # CRM/Analytics/Slack Integrations
│   │       ├── translations/page.tsx          # Translation defaults & glossary
│   │       ├── custom-links/page.tsx          # Custom domains & links
│   │       ├── synthetic-voices/page.tsx      # ElevenLabs voice management
│   │       └── brand-kits/
│   │           ├── page.tsx                   # 142a_settings_brand_kits_populated.png
│   │           └── [id]/[[...tab]]/page.tsx   # 142b..144_brand_kit_* (All 13 Brand Kit Editor sections)
│   │
│   ├── (studios)/                             # Full-Screen Creative Studios
│   │   ├── flows/[pid]/
│   │   │   ├── edit/page.tsx                  # 71..92 Flow Editor (6 tools, Chapters, 7 right-rail panels)
│   │   │   ├── insights/page.tsx              # 93_flow_insights_page.png
│   │   │   └── guide/page.tsx                 # 94_flow_step_by_step_guide.png
│   │   ├── prompt-videos/custom/[pid]/edit/
│   │   │   └── page.tsx                       # 125..139h AI Video Studio (Chat, Design, 5-track NLE, Export)
│   │   ├── visual-projects/[pid]/edit/
│   │   │   └── page.tsx                       # 151f..152e Visual Canvas Editor (28 presets, Animate, Avery)
│   │   └── collections/[pid]/[view]/
│   │       └── page.tsx                       # 90, 147a..147c Collections Microsite Editor
│   │
│   ├── (public)/                              # Public Share & Embed Players
│   │   ├── share/[pid]/
│   │   │   ├── page.tsx                       # 95_flow_public_share_page.png
│   │   │   └── guide/page.tsx                 # 96_flow_public_share_guide.png
│   │   ├── share/videos/[pid]/page.tsx        # 140_whoami_video_share_player_ready.png
│   │   ├── share/collections/[pid]/page.tsx   # Public Collection microsite player
│   │   └── embed/[pid]/page.tsx               # 26_demo_embed_player.png
│   │
│   └── api/                                   # All 38 REST & SSE API route handlers
```

---

## 7. Phased Implementation & Verification Plan

### Phase 1: Foundation, Database, Auth & Seeded `whoami.genisisiq.com` Workspace
- Initialize Next.js + TypeScript + Tailwind CSS + Prisma + Zustand.
- Apply `prisma/schema.prisma` and seed the authenticated workspace (`workspace-5p8xcsfv`, user `jack wolf`) pre-populated with the real `whoami.genisisiq.com` Brand Kit (`XE1uVIkZSLQJth6oUMJ0`), Interactive Demo (`4fLyMFzH8BjqgKQF4Bd6`), AI Launch Videos (`qGe4L499rr5AsLtm6F4q` & `RFY3pPzp6G8E5xJXINUh`), and AI Visual Project (`mVkkeVB4j15x799NHwBH`) PLUS live generation endpoints so creating new assets from any URL works end-to-end.

### Phase 2: Marketing Site (`www`) & Workspace Shell (`app`)
- Implement all Marketing routes (`01_www_*`–`26_demo_embed_player.png`) with interactive hero tabs, 5 use-case tabs, pricing toggle, comparison table, and showcase grid.
- Implement the 240px Workspace Sidebar, 4-tab AI Composer (`Video`, `Demo`, `Visuals`, `Collection`), 5-step Getting Started checklist with `Claim 200 credits`, `Command+K` search palette, Library, Trash, Archive, Inbox, Memory, Connectors, Impact Analysis, Usage, Purchase Credits, Referral, and all Settings/Upgrade pages.

### Phase 3: 1-Minute Brand Kit AI Extractor & 13-Tab Brand Kit Editor
- Implement `POST /api/workspaces/[slug]/brand-kits/extract` (Playwright scraper + synthesis) and the 6-step extraction progress modal (`120`–`123`).
- Implement all 13 sections of `/workspaces/[slug]/settings/brand-kits/[id]/[[...tab]]` (`Home`, `Sources`, `Logos`, `Colors`, `Fonts`, `Photography`, `Backgrounds`, `Illustrations`, `Product`, `Voice`, `Tones`, `Demo`, `Share page`, `Custom elements` — `142a`–`144`).

### Phase 4: Interactive Demo (`Flow`) Editor, Image Annotator, Guide & Public Player
- Build `/flows/[pid]/edit` (`71`–`92`) with step strip, upload/paste, all 6 canvas tools (`Hotspot`, `Callout`, `Area`, `Pan and zoom`, `Voiceover`, `Recording`), `Chapter` steps (`Buttons` & `Form` lead capture), built-in Screenshot Image Editor (`82h`–`82i`), and all 7 right-rail panels (`Design`, `Library`, `Translations AI`, `Variables`, `Menu`, `Linear view`, `Script view`).
- Build Share popover, Embed code modal, Video/GIF exporter, `/flows/[pid]/insights`, `/flows/[pid]/guide`, and public `/share/[pid]` + `/share/[pid]/guide`.

### Phase 5: Agentic AI Video Studio, Schema-Driven `Design` Tab & 5-Track NLE
- Build `/workspaces/[slug]/start-with-ai/video` and `/prompt-videos/custom/[pid]/edit` (`124`–`140`, `150a`–`150c`):
  - 7-stage SSE agent log (`Understand`, `Storyboard`, `Script`, `Generate Scenes`, `Review`, `Voiceover`, `Sound Effects`), `@Scene` tag picker, and `v1`/`v2` version selector.
  - 6 Remotion scene archetypes + live `Design` tab (`Colors` + `Scene 1..N Text`).
  - Expandable 5-track NLE timeline (`Pan & Zoom`, `Voiceover` with 18+ voices + `Edit pronunciation` + `Edit all scripts`, `Scenes`, `Music`, `Sound effects`).
  - MP4 video exporter (`720p`/`1080p`/`4K`, `24`/`30`/`60 FPS`) and `/share/videos/[pid]` public player.

### Phase 6: AI Visuals Studio, Multi-Format Canvas Editor, Collections & Insights
- Build `/workspaces/[slug]/start-with-ai/visuals` (`148a`–`151e`) and `/visual-projects/[pid]/edit` (`151f`–`152e`) with all 4 categories, 28 multi-platform aspect-ratio presets, `Template` picker, `Animate` toggle, Avery AI background/headline generators, and PNG/MP4 export.
- Build Collections Editor (`/collections/[pid]/[view]` — `147a`–`147c`), Team Insights (`Activity`, `Audience`, `Arcades` — `146a`–`146b`), and Leads directory (`49`).
