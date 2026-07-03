# AI Debugging / Refactor Prompt for Nexly

Use this prompt when asking a coding agent to work on Nexly.

```text
You are helping me improve Nexly, a portfolio demo for an AI-assisted Amazon category research workflow.

Important context:
- This is currently a front-end-only Vite + React + TypeScript demo.
- It is intentionally running in mock/demo mode.
- API calls are intercepted in `webapp/frontend/src/lib/mockFetch.ts`.
- Preloaded demo data is in `webapp/frontend/src/lib/demoData.ts`.
- The product workflow is: Data Upload -> Opportunity Insight -> Brief Workbench -> Review & Memory.
- Do not convert it into a real backend unless I explicitly ask.

Before changing code:
1. Read `README.md`.
2. Inspect `webapp/frontend/package.json`.
3. Run or reason through `npm run build`.
4. Identify whether the issue is TypeScript, runtime UI behavior, routing, mock API shape, or product copy.

Rules:
- Keep the portfolio demo working without backend/API keys.
- Do not remove the demo/mock mode warning.
- Do not weaken TypeScript by changing the build command to only `vite build` unless there is a strong reason.
- Prefer fixing types and data shapes over suppressing errors.
- Keep UI changes conservative unless I ask for redesign.
- After changes, run `npm run build` and report the exact result.

Current priorities:
1. Build reliability: `npm run build` must pass.
2. Demo transparency: clearly show this is mock/demo mode.
3. Maintainability: reduce large-file risk by extracting reusable components/hooks only when safe.
4. Portfolio credibility: document what is real, what is mocked, and what a real MVP would require.

When reporting back, use this format:
- What I changed
- Why I changed it
- Files touched
- Build/test result
- Remaining risks or recommended next step
```

## Good task examples

```text
Fix all TypeScript errors without changing product behavior. Run npm run build and summarize the files touched.
```

```text
Refactor `BriefWorkbench.tsx` by extracting only the chat panel and self-check panel into components. Do not change the UI or behavior. Run npm run build afterwards.
```

```text
Add a clear demo-mode banner and update README so portfolio reviewers understand this is a mocked front-end demo, not a live LLM product.
```

```text
Create a minimal backend implementation plan for replacing `mockFetch.ts` with real endpoints. Do not write backend code yet.
```
