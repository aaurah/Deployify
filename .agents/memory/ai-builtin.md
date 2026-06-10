---
name: AI built-in features
description: Deployify's pattern-based AI engine for build analysis and project insights — no external API required.
---

Two AI endpoints in `artifacts/api-server/src/routes/ai.ts`:

- `GET /api/ai/analyze-deployment/:id` — Parses build logs against 14 error patterns (dependency, TypeScript, OOM, port, syntax, file-not-found, circular deps, bundle size, timeout, deprecation), returns `AIAnalysis` with summary, issues + fix instructions, build pipeline stages, and health score 0–100.
- `GET /api/ai/project-insights/:projectId` — Calculates 30-day health score, letter grade (A+/A/B/C/D), trend (improving/stable/degrading), and actionable recommendations.

**Why:** Replit AI integration requires a paid plan upgrade; deterministic pattern matching delivers the same UX at zero cost.

**How to apply:** If user wants GPT-powered analysis in future, replace the pattern matching in `ai.ts` with an OpenAI call — the response shape is already defined in the OpenAPI spec and codegen'd.

Frontend integration:
- `AIAnalysisCard` component in `deployments/detail.tsx` — lazy-loads on click (user presses "Analyze"), shows health ring, build pipeline, expandable issues.
- `useGetProjectInsights` in `projects/detail.tsx` — auto-fetches, shows grade + trend card + recommendations in Overview tab.
