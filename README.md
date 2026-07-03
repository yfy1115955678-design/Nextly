# Nexly — Agentic Product Discovery Workspace

## What it is

Nexly is an AI-assisted product discovery workspace that turns Amazon marketplace data into structured Product Briefs through a multi-agent analysis pipeline — from raw BSR listings and competitor reviews to a human-reviewed, iteration-ready go-to-market document.

## Why I built it

Amazon sellers and product managers face a recurring problem: marketplace data is abundant (Best Seller Rank lists, thousands of customer reviews, pricing and sales metrics) but insight is scarce. The typical workflow involves:

- Manual spreadsheet sorting to find pricing gaps
- Skimming hundreds of reviews for recurring complaints
- Guessing at feature priorities based on intuition rather than evidence

Nexly closes this loop. It parses spreadsheets, tags reviews for pain points and needs, clusters them into structured problems, cross-references those against market gaps, and generates a Product Brief — all with human decision checkpoints at every stage so you stay in control of the direction.

## What the demo shows

| Page | Purpose |
|------|---------|
| Data Upload | Phase 0 file type detection, review distribution by star and ASIN, BSR category summary, quality warnings |
| Opportunity Insight | Phase -1 category judgment → Phase 1 dual-tagging (reviews + BSR) → Phase 2 pain-point clustering + market clustering → Phase 3 gap matrix with opportunity scores |
| Brief Workbench | Phase 0 brainstorming (5-axis decision lock-in) → Agent A generates 12-chapter brief → Agent B 8-dimension review → Auto-revise iteration loop → Version diff → Markdown export |
| Review & Memory | Conversation timeline per phase, decision logs, review records, workflow audit trail |

The demo also includes portfolio showcase pages accessible from the top-right **Showcase ▾** menu:

- **Run Trace** — Per-agent input/output/duration/status timeline demonstrating agent observability design
- **Evaluation** — Cross-category quality scoring across 7 dimensions (pain-point coverage, brief completeness, red-risk count, human confirmation count, etc.)
- **Prompt & Schema** — Input/output schema definitions and system prompt excerpts for each agent in the pipeline

## Important note

> **This is a front-end-only portfolio demo with mock data.** All API calls are intercepted by `mockFetch.ts` and return preloaded data from `demoData.ts`. There is no backend, no database, no API key, and no live LLM call. The demo is designed to showcase product workflow and interaction design, not to function as a production system.

## Key workflow

```
 ┌──────────────┐    ┌───────────────────┐    ┌─────────────────┐    ┌──────────────┐
 │ Data Upload  │───▶│ Opportunity Insight│───▶│ Brief Workbench │───▶│   Review &   │
 │  Phase 0     │    │  -1 → 1 → 2 → 3   │    │  0 → 1 → 2 → 3 │    │   Memory     │
 └──────────────┘    └───────────────────┘    └─────────────────┘    └──────────────┘
       │                      │                       │                      │
       ▼                      ▼                       ▼                      ▼
  File detection      Non-linear tabs         Human direction lock    Conversation audit
  Quality warnings    Decision checkpoint     Agent A → Agent B      Decision trace
  Sample data         Review chat panel       Auto-revise loop       Version history
```

Throughout the pipeline, every analysis decision is persisted as: `ConversationMemory` (chat per phase) → `DecisionLog` (checkpoint approvals) → `ReviewRecord` (brief iterations).

## Agentic design

### Multi-agent architecture

| Agent | Role | Trigger | Output |
|-------|------|---------|--------|
| **Category Judge** (Phase -1) | Analyzes BSR data for market structure, pricing bands, competitive intensity | User uploads BSR file | Dimension scores, verdict, key findings |
| **Review Tagger** (Phase 1A) | Tags every review excerpt as pain-point / need / opportunity signal | User executes Phase 1 | 18+ tagged categories with frequency and severity |
| **BSR Tagger** (Phase 1B) | Tags BSR listings by type, price band, and value proposition cluster | User executes Phase 1 | 9 market clusters with key metrics |
| **Cluster Analyst** (Phase 2) | Aggregates Phase 1 tags into 7-10 pain-point clusters and 9 market clusters, with causal chains and coverage opportunities | Phase 1 completion | Structured cluster JSON with evidence |
| **Gap Scorer** (Phase 3) | Cross-references pain-points × market gaps to produce an opportunity matrix with multi-dimensional scores | Phase 2 completion | 9×9 gap matrix + Top 3 opportunities |
| **Brainstormer** (Brief-0) | Generates 5-axis direction-locking questions from the gap matrix | User enters Brief Workbench | Product direction, MVP scope, target user, pricing, key differentiators |
| **Agent A — Brief Writer** (Brief-1) | Generates 12-chapter structured Product Brief using locked direction + full analysis context | User confirms direction lock | Complete Product Brief (Executive Summary through A+ Content) |
| **Agent B — Brief Reviewer** (Brief-2) | Reviews against 8 quality dimensions, flags issues as 🔴/🟡/🟢 | Agent A completes | Review report with issue counts and specific fix suggestions |
| **Agent A — Auto-Revise** (Brief-3) | Rewrites the brief incorporating Agent B's review feedback | User triggers auto-revise | Incremented brief version with reduced risk count |

### Human-in-the-loop checkpoints

1. **Decision Axis** (after Phase -1) — User selects product direction and target price band before deeper analysis begins
2. **Phase Approval** (after Phase 1, 2, 3) — Each phase has an explicit "Approve & Continue" checkpoint with a dedicated review chat panel
3. **Direction Lock** (Phase 0) — User must confirm all 5 direction axes before Agent A generates the brief
4. **Auto-Revise Review** — After Agent B flags issues, user decides: fix manually, auto-revise, or iterate again

### Memory & observability

- All chat conversations are bound to their phase and persisted
- Decision logs record every checkpoint approval with timestamp
- Version history tracks every brief iteration (Agent A → Agent B → manual edit → auto-revise)
- Run Trace page simulates per-agent observability (input, output, duration, status)

## Demo vs Production

| Capability | Portfolio Demo (Current) | Production Version (Planned) |
|------------|--------------------------|------------------------------|
| File parsing | Mocked results from `demoData.ts` | `openpyxl` + raw XML fallback for WPS/namespace-polluted xlsx |
| LLM calls | Pre-baked JSON responses | DeepSeek/Claude API with retry, timeout, and rate limiting |
| Data persistence | In-memory React state | PostgreSQL + Redis (project state, trace logs, eval results) |
| Agent orchestration | Sequential mock `jsonResponse()` | Multi-agent pipeline with dependency resolution and error recovery |
| Conversation memory | Mocked chat history | `ConversationMemory` table with role, phase, type, content |
| Version history | Static demo entries | `ReviewRecord` table tracking Agent A/B/user iterations |
| Tracing | Simulated `traceEntries` array | `TraceLogger` middleware capturing payloads, tokens, timing per call |
| Evaluation | 3-category static score cards | CI-gated `eval-harness` validating pain-point coverage, brief completeness, schema compliance |
| Evidence citation | Embedded `evidences` in cluster data | Automatic source linking from review excerpts to cluster IDs |
| Deployment | Vite SPA on Vercel (static) | Dockerized FastAPI + React, cloud-deployable with CI/CD |

## Screenshots

| Page | Preview |
|------|---------|
| **Data Upload** | ![Upload](screenshots/upload.png) |
| **Opportunity Insight** | ![Insight](screenshots/insight.png) |
| **Brief Workbench** | ![Brief](screenshots/brief.png) |

## Production roadmap

The demo captures the interaction model and multi-agent flow. A production-ready version would add:

| Phase | Component | Description |
|-------|-----------|-------------|
| **1** | Real backend | FastAPI with async SQLAlchemy, structured API routes for upload, analysis, brief, and chat |
| **2** | LLM orchestration | Multi-provider routing (DeepSeek, Claude, GPT), prompt versioning, response schema validation, retry with exponential backoff |
| **3** | Evaluation harness | Automated quality scoring per agent output: pain-point coverage rate, brief chapter completeness, review red-risk count. CI gate integration. |
| **4** | Tracing & observability | `TraceLogger` middleware per agent call: input snapshot, output snapshot, token count, wall-clock timing. Exportable to dashboards. |
| **5** | Evidence citation | Pair every clustered insight and brief claim with source review excerpts and ASIN references for full auditability |
| **6** | Database persistence | Migrate from in-memory state to PostgreSQL: project lifecycle, analysis results, conversation memory, review records, evaluation scores |
| **7** | Multi-tenancy | Multiple projects, cross-category comparison, evaluation leaderboard, team collaboration |
