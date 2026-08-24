# Program Risk Monitor

A proof-of-concept dashboard for reviewing program-site risk and driving follow-up
action, built with React, Azure Functions, Cosmos DB, and the Claude API, and hosted on Azure Static Apps.
All data is entirely synthetic — no real client, patient, or personnel
information.

I built this to get hands-on with a specific stack (Azure Functions, Cosmos
DB, and calling an LLM API directly, rather than only using AI coding tools)
ahead of a Front-End Developer interview, and kept building on it past the
interview itself.

## Live demo

**[orange-meadow-04bcb011e.7.azurestaticapps.net](https://orange-meadow-04bcb011e.7.azurestaticapps.net/)**

The app is gated behind Microsoft (Entra ID) sign-in — any Microsoft
account works, work/school or personal. It's deliberately registered this
broadly (rather than single-tenant) so an outside reviewer can sign in
without needing an invite into my tenant first. Single-tenant,
scoped to just the organization's own accounts, is the more correct
choice for an actual production deployment — this is loosened
specifically for demo reviewability, not how I'd ship it. The
[Local setup](#local-setup) section below is the other way to run it,
without any sign-in at all.

## What it does

- Lists synthetic program sites with operational metrics (missed check-ins,
  days since last required assessment, incidents, staffing turnover),
  each carrying a precomputed baseline risk tier.
- Selecting a site calls Claude for two independent things:
  - A **structured risk assessment** — score, tier, rationale, and flagged
    factors — scored against an explicit rubric, returned via forced
    tool-use so it parses reliably into the UI. Cached in Cosmos DB and
    reused on future visits; a "Re-run assessment" action forces a fresh
    call.
  - A **streamed narrative summary**, rendered token-by-token via
    Server-Sent Events, also cached and re-run on demand.
- A data-driven follow-up workflow: a site the AI assesses as high risk can
  be flagged, acknowledged, and resolved — a linear state machine validated
  on the server, not just the client — and a resolved site can always be
  reopened later if new problems come up.
- Sign-in via Entra ID (Azure Static Web Apps' built-in auth provider), no
  custom auth code.

## Architecture

```
frontend/   React + Vite + TypeScript — deployed to Azure Static Web Apps
api/        Azure Functions (Node.js v4 model, TypeScript)
  GET  /api/sites                      list sites from Cosmos DB
  POST /api/sites/{id}/risk-score      structured risk assessment (cached, ?force=true to refresh)
  GET  /api/sites/{id}/summary/stream  streamed narrative summary (cached, ?force=true to refresh)
  POST /api/sites/{id}/action          advance the flag/acknowledge/resolve workflow
```

## Technical highlights

A few decisions worth calling out, since the "why" matters more than the
diff here:

- **Structured output vs. streaming, deliberately different.** The risk
  score uses forced tool-use/JSON because it feeds UI components and has to
  parse reliably every time. The narrative summary streams because it's
  meant to be read as prose, not parsed.
- **Cost- and consistency-aware by design, not by accident.** The list view
  never calls the LLM — only the on-demand detail view does, and both AI
  outputs are cached in Cosmos DB and reused rather than recomputed on
  every visit, with an explicit re-run action instead of silent
  recomputation. Server-side writes use Cosmos's `patch` API rather than
  full-document `replace`, since the risk-assessment and narrative-summary
  endpoints write to the same document independently and can run
  concurrently — `replace` would risk one overwriting the other.
- **A rubric turns the AI score into something explainable.** Each metric
  maps to explicit concern bands (see `api/src/llm/llmClient.ts`) rather
  than leaving the model to invent its own scoring logic per call — the
  same site produces a consistent tier across runs, and the rationale
  traces back to specific thresholds instead of reading like a black box.
- **Accessibility and responsiveness were treated as functional
  requirements, not polish.** The site table (the app's primary navigation
  surface) is fully keyboard-operable, not mouse-only; the two-column
  layout collapses to one below 900px with a horizontally-scrollable table
  rather than the naive CSS Grid behavior, which silently overlaps content
  instead of shrinking.

## Local setup

### 1. Azure resources (free tier)

- A Cosmos DB account with Free Tier enabled (Core/SQL API).
- An Anthropic API key from console.anthropic.com.
- Azure Functions Core Tools, to run the API locally.

### 2. API

```
cd api
npm install
cp local.settings.json.example local.settings.json   # fill in Cosmos + Anthropic values
# also create api/.env with the same COSMOS_ENDPOINT / COSMOS_KEY / COSMOS_DATABASE / COSMOS_CONTAINER values
# (local.settings.json is used by the Functions host; .env is used by the standalone seed script)
npm run seed     # seeds ~8 synthetic sites into Cosmos DB
npm start        # runs Azure Functions locally on :7071
```

### 3. Frontend

```
cd frontend
npm install
npm run dev      # Vite dev server, proxies /api to :7071
```

Local dev bypasses the Entra ID gate automatically (there's no `/.auth/*`
outside a real Static Web Apps deployment) — you'll land straight on the
dashboard as a stubbed local user.

### Tooling

```
npm install   # from the repo root — installs shared lint/format tooling
npm run lint
npm run format
```

A pre-commit hook (Husky + lint-staged) runs ESLint, Prettier, and both
test suites automatically. Tests alone: `npm test` from the repo root, or
`npm test` inside either `api/` or `frontend/` individually.

## Known limitations

- **Streaming doesn't fully stream on the live deployment.** Azure Static
  Web Apps' managed API proxy buffers the SSE response rather than
  forwarding it live, so the narrative summary appears all at once instead
  of token-by-token in production, even though the code streams correctly
  (and does stream locally against the Functions host directly). A
  standalone Function App would likely fix this; I hit an Azure subscription
  quota wall partway through that path and left it for later.
- **Test coverage is intentionally narrow, not exhaustive.** It covers the
  action-workflow state machine (`api/src/domain/actionWorkflow.ts`),
  `formatRelativeTime`, and badge rendering — the places with real,
  pure logic worth protecting. UI flows, the API handlers themselves, and
  the LLM prompts aren't covered.
- **Entra ID accepts any Microsoft account, not just the organization's
  own**, so reviewers can sign in without an invite (see the live-demo
  note above). A real deployment would scope this down to single-tenant.

## Possible next steps

- A standalone Azure Function App to fix streaming in production.
- A portfolio-level KPI summary (counts by tier, sites overdue on
  assessment) above the per-site table.
- Broader test coverage — the API handlers and key UI flows are the
  natural next layer, beyond the current unit tests.
- Real-time updates via WebSockets/SignalR instead of on-demand fetches.
