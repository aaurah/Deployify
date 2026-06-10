---
name: Deployment simulation
description: How the fake deployment build process works in the API server.
---

`simulateDeployment()` in `artifacts/api-server/src/routes/deployments.ts`:

- 15% chance of failure (two scenarios: missing module, TypeScript errors)
- 40% chance of warnings injected into success builds (peer dep warnings or circular dep + deprecation)
- Success builds have realistic multi-line output with timing (`▶ step... → detail`)
- Failed builds set `status: "error"` and populate `errorMessage` with the last log line

**Why:** Realistic failures let the AI Build Analyzer actually have something to analyze, making the feature demonstrable.

**How to apply:** Do not increase failure rate above ~20% — too many failures look broken to the user. Add new failure scenarios by appending to `FAILURE_SCENARIOS` array.
