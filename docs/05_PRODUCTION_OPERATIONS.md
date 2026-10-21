# Production operations and implementation decisions

## Current architecture

- Next.js 16 App Router serves the application and authenticated APIs; NextAuth uses Prisma-backed database sessions. Password login issues the same session cookies consumed by NextAuth. Passwords use scrypt; invitation/reset tokens are hashed and claimed transactionally.
- Invitation-only admission is an invariant, not a public-registration environment switch. Bootstrap administrators are created only through `npm run bootstrap:admin`.
- Workspace membership is checked for every private resource. OWNER/ADMIN manage workspace settings; EDITOR can create/edit content; VIEWER is read-only. Platform administrator status does not grant implicit access to someone else's workspace.
- SQLite and PostgreSQL have separate generated migration baselines under `prisma/migrations/`. JSON content is stored as bounded serialized JSON, not native JSONB columns.
- Capture uses actual Chromium with public-network validation and DNS pinning. AI/speech require configured Azure services. Rendering uses bundled fonts, real captured/uploaded media and FFmpeg; there is no Remotion execution, arbitrary generated-code execution, simulated export or AI fallback content.
- Generation and rendering are bounded synchronous operations, not durable distributed background jobs. The UI reports actual processing and failures; it does not invent progress percentages. Configure reverse-proxy timeouts for long-running exports and size the host for Chromium/FFmpeg.
- Media is stored outside `public/`. `/api/media` authorizes workspace members or files referenced by genuinely published content, supports byte ranges, and revokes anonymous access after unpublication. Do not put the private storage directory on a public CDN or directly expose it through a reverse proxy.
- Public players read explicit publication projections. They never fall back to another asset. Viewer analytics respects DNT and workspace collection preferences; an optional consent banner gates collection. VIEW/COMPLETED counters deduplicate each visitor per UTC day. They measure activity, not verified identities or marketing attribution.
- Leads require an actual published form step and explicit consent; consent time is retained. No automatic CRM synchronization is claimed.

## Fresh SQLite deployment

Use a persistent local disk for both SQLite and private media. Run one application instance with SQLite; do not put its database on an unreliable network filesystem.

1. Copy `.env.example`, generate a unique session secret, and configure the application's canonical URL.
2. Install dependencies, FFmpeg/FFprobe, and Chromium with its OS dependencies.
3. `npm run db:setup` generates the client and deploys the empty-database baseline. It does not seed data.
4. Create an administrator through the deployment CLI, then build/start the application.
5. Terminate public TLS at a trusted reverse proxy. Set `NEXTAUTH_URL` to the public HTTPS URL; secure-cookie behavior is based on that origin.

Production startup rejects missing/known-placeholder secrets, missing database configuration, and non-HTTPS public origins. HTTP loopback remains available for local verification. Persist the database and media volume across releases; back them up together.

## Fresh PostgreSQL deployment

Set the values from `.env.production.example` in the deployment environment:

```sh
export PRISMA_SCHEMA_PATH=prisma/schema.postgres.prisma
# DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET and ARCADE_STORAGE_DIR must also be set.
npm ci
npm run db:migrate:postgres
npm run build
npm run bootstrap:admin -- --email you@your-domain.example --password-stdin
npm start
```

`PRISMA_SCHEMA_PATH` must remain set during **build** so `prisma generate` does not overwrite the PostgreSQL client with a SQLite client. The application chooses its adapter from `DATABASE_URL`; the generated client must match it. PostgreSQL schema/migration SQL is provided, but PostgreSQL infrastructure must be provisioned and validated in your deployment environment.

## Upgrading a pre-migration installation

The earlier prototype had no migration history and used seeded data and public uploads. **Do not blindly deploy the empty-database baseline into a populated database, reset a database, or approve data-loss flags without reviewing the target and SQL.**

1. Stop application writes and take verified backups of the database and old uploads.
2. Generate/review the schema difference against your existing database. Apply only the reviewed non-destructive changes needed to reach the current schema; in particular, consent tracking and analytics-deduplication fields/indexes are new.
3. Once the actual database matches the current baseline, record it with `prisma migrate resolve --applied 20260720000000_initial` using the correct schema/environment. `migrate resolve` records history; it does not apply missing schema changes.
4. Run `npm run db:remove-demo`. This targets the known prototype workspace/invitations only, not arbitrary customer workspaces. A seed account with a real password credential is preserved for operator review. Legacy public upload subdirectories are moved to a private quarantine, not destroyed.
5. Review preserved accounts/quarantined files, restore needed user content through authenticated upload, and verify private/public access before reopening the service.

`npm run db:remove-demo -- --files-only` can quarantine old public uploads without modifying database records. This is useful while a database upgrade awaits approval. Removal is explicit and never runs implicitly at application startup.

## Optional services

| Configuration | Behavior |
|---|---|
| `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT`, optional `AZURE_OPENAI_API_VERSION` | Real storyboards, copy refinement and content translation. Missing/unreachable/malformed responses are errors. |
| `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`, optional `AZURE_SPEECH_VOICE` | Real neural speech; workspace `{word,replacement}` pronunciation rules are supplied. Select a voice compatible with the content language. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Verified Google email sign-in, still invitation-gated for new accounts. Configure the NextAuth callback URL with Google. |
| `EMAIL_DELIVERY_URL`, `EMAIL_DELIVERY_TOKEN` | Password-reset delivery through a trusted HTTPS webhook accepting `{to,subject,text}` with Bearer authentication. Failure returns unavailable; reset links are never returned by the public API. |

Invitations use manual private link delivery. The UI never says an email was queued when no delivery occurred. Provider credentials stay server-side. Use secrets management rather than checked-in environment files.

## Maintenance and recovery

- Run `npm run db:maintain` on a deployment scheduler daily. It expires sessions/rate-limit keys/registration remnants/invitations/reset tokens and deletes analytics/leads older than each workspace's configured 1–730-day retention.
- Exported files and captures are retained until operator-managed storage cleanup. Back up first; do not delete referenced files. An automated orphan-media collector is not implemented.
- Back up the database and storage together, rehearse restoration, monitor free disk/CPU/memory, and collect application logs. Unexpected API failures are logged server-side while clients receive a generic error.
- Do not run multiple long exports per CPU core without deployment-level resource limits. Horizontal rendering queues, payment processing, SSO/SCIM, CRM sync, custom voice training and an authenticated recording extension remain separate work, not hidden mock implementations.

## Verification contract

`npm run lint` performs Next route type generation, TypeScript checks and `git diff --check`; it is not an ESLint rule set. `npm run build` validates a production bundle. `npm test` exercises isolated engine and product tests with actual Chromium/FFmpeg outputs, authentication/session revocation, invitations, workspace isolation, viewer roles, private media/publication revocation, real collections, analytics/lead consent, export invalidation and desktop/mobile browser flows.

`npm run test:providers -- <authorized-public-url>` additionally calls configured live Azure AI/Speech, captures the supplied public website and renders a real narrated video. It consumes provider quota, uses temporary private storage, and leaves no sample projects in the application database.
