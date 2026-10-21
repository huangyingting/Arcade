# Arcade Studio documentation

Start with the [application README](../README.md) and [production operations](05_PRODUCTION_OPERATIONS.md) for the implemented behavior, configuration, deployment and known boundaries.

The original ADR, requirements, design and technical-specification documents below preserve the research backlog. They describe a broader target product, not verified current capabilities. In particular, historical references to seeded identities, free-credit rewards, simulated integrations, Remotion/SSE agents and a packaged extension are not deployment instructions.

| Document | Purpose |
|---|---|
| [Architecture decisions](01_ADR_ARCHITECTURE_DECISION_RECORDS.md) | Original architectural proposals; current decisions are recorded in the operations document. |
| [Requirements](02_REQUIREMENTS_SPECIFICATION.md) | Research requirements and acceptance targets, including unimplemented integrations. |
| [System and UI design](03_SYSTEM_AND_UI_UX_DESIGN.md) | Historical screen inventory; the current interface uses the editorial design documented in the README. |
| [Technical specification](04_TECHNICAL_IMPLEMENTATION_SPEC.md) | Original proposed contracts; current route implementations and regression tests are authoritative. |
| [Account admission research](NEXTAUTH_INVITE_ONLY_SPEC.md) | Historical account design research. Arcade now always enforces invite-only admission and CLI-only bootstrap. |
| [Production operations](05_PRODUCTION_OPERATIONS.md) | Current architecture, migration/deployment procedure, provider configuration, retention and limitations. |

The `screenshots/` directory contains historical research evidence only. No application page, creation endpoint, renderer or seed script loads those images as user content.
