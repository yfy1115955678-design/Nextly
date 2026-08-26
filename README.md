# Nextly 2.0 — AI-assisted Product Development Workflow Demo

Nextly is a front-end portfolio prototype that demonstrates how AI analysis, human decisions, and shared product state can work together across a product development workflow.

The core flow is:

**Opportunity Discovery → Market Research → Product Definition → Feasibility Validation → Review & Decision**

## What the demo proves

The AquaPure S1 scenario contains one end-to-end change loop:

1. Product Definition v1 requires the whole product to be dishwasher-safe.
2. Feasibility validation finds that the pump and PCB cannot enter a dishwasher.
3. AI identifies the conflict, proposes a revision, and lists the affected modules.
4. A human accepts, edits, or rejects the recommendation.
5. Acceptance creates Product Definition v2 and synchronizes feasibility, review, overview, and the Decision Log.
6. The user can make a conditional decision to proceed to prototyping.

AI handles analysis and impact detection. Humans retain decision authority. The workflow stores state and propagates confirmed changes.

## Key product concepts

- Shared Project State across every route
- Human-in-the-loop decision gates
- Version diff from Product Definition v1 to v2
- Clear separation of blockers, proceed conditions, and informational risks
- Traceable decisions with rationale and downstream impact
- Context-aware AI assistant drawer
- Mock incremental refresh after importing market data, supplier quotes, or test reports

## Demo boundary

This is a front-end-only portfolio demo:

- all product and market data is preloaded;
- no real LLM is called;
- selected files are not uploaded or transmitted;
- file names are used only to simulate impact analysis;
- project state is stored locally in the browser;
- Reset Demo restores the initial conflict state.

## Run locally

```bash
npm --prefix webapp/frontend install
npm --prefix webapp/frontend run dev
```

Production build:

```bash
npm --prefix webapp/frontend run build
```

## Stack

React 18, TypeScript, React Router, Vite, and CSS.
