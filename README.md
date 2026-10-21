# Arcade Studio

An invite-only product storytelling workspace: interactive walkthroughs, AI-assisted launch films, campaign graphics and published collections.

The application starts empty. There are no sample accounts, stock projects, complimentary-credit simulations or mock exports. Drafts and uploaded media are private; explicit publication creates public share access.

## Run a new installation

Requires Node.js 22+, FFmpeg/FFprobe and Playwright Chromium. SQLite is supported for a single application instance. Use PostgreSQL for a managed database deployment.

```sh
npm ci
cp .env.example .env
openssl rand -base64 48
# Put the generated value in NEXTAUTH_SECRET. Configure NEXTAUTH_URL.
npx playwright install --with-deps chromium
npm run db:setup
npm run bootstrap:admin -- --email you@your-domain.example --name "Studio owner" --password-stdin
npm run build
npm start
```

The bootstrap command reads a password from standard input; supply a strong password and finish input with EOF. There is intentionally **no HTTP bootstrap-admin endpoint**. For development, use `npm run dev`.

Sign in, create your workspace, and create your own projects. Platform administrators create account invitations; share the returned invitation link privately. Workspace owners/admins can then add accepted accounts as editors or viewers.

**Existing installations:** do not run initial migrations against an existing nonempty database without an upgrade/baseline procedure. `npm run db:upgrade:legacy` previews the five supported additive SQLite changes; adding `-- --apply` backs up the database, preserves/verifies all rows and records the baseline. Other schema differences are refused. See [operations](docs/05_PRODUCTION_OPERATIONS.md).

## Real capabilities and boundaries

| Capability | Implementation |
|---|---|
| Interactive demos | Blank drafts or actual public-site captures, uploaded screenshots/MP4s, hotspots, callouts, chapters, consented lead forms, narration and public players/guides. |
| Launch films | Configured Azure OpenAI creates copy/storyboards; edit scenes, upload product imagery, generate actual Azure speech, and render MP4s with Chromium/FFmpeg. Composition changes invalidate old exports/publication. |
| Campaign visuals | User-authored or captured content, multiple exact-size canvases, palette editing, real PNG/MP4 export, optional provider-backed copy refinement/translation. |
| Brand kits | Actual extracted colors, font names and captured imagery; editable identity, palette, assets and editorial direction. New projects can use the selected/default brand. |
| Collections | Ordered selections of actually published demos/videos; unpublished assets are excluded from public delivery. |
| Accounts and data | Verified invite-only admission, database sessions, workspace roles, scoped search, real viewer events and consented leads. |

Azure OpenAI, Azure Speech, Google sign-in and password-reset email are optional, explicitly configured services. Missing providers return actionable errors, never stock output. The navigation supports English, Chinese, Japanese and Korean; **the entire interface is not fully localized**. Content translation uses the configured AI provider, and share viewers use saved translations without triggering anonymous AI generation.

Billing, purchases, SAML/SCIM, CRM connectors, custom voices and a packaged browser-recording extension are **not implemented integrations**. Their former simulated success paths are removed or explicitly unavailable. Hosting this application does not provision these external services.

## Verification

```sh
npm run lint          # Route/type validation and whitespace checks
npm run build
npm test             # Actual engine exports plus isolated API/browser regression tests
# Optional: exercises configured paid providers and a website you may capture.
npm run test:providers -- https://your-public-website.example
```

Product tests create a temporary migrated database and private storage, start their own server, then clean up. They do not seed or modify your application database.

## Design

An editorial parchment canvas, deep olive studio/navigation, terracotta accent and strong typographic hierarchy replace the generic demo dashboard. Typography follows the font families published by [genisisiq.com](https://genisisiq.com): self-hosted **Mona Sans** and **JetBrains Mono**, with **Noto Sans SC** as a CJK fallback. Font licenses are in `public/fonts/`; CJK webfont CSS is loaded from Google Fonts, with system fallbacks if unavailable.

Historical feature research remains in `docs/` and `screenshots/`. It is a design/reference backlog, **not a claim that every researched feature has shipped**.
