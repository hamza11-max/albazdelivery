PR update (automated)

- Date: 2025-11-24
- Branch: feature/enable-claude-sonnet-3.5
- Summary: Added LLM adapter (Anthropic/Claude), wired chatbot endpoint to call the adapter when enabled, added unit tests for the adapter, and applied small TypeScript/test fixes so the test suite runs cleanly. Also tidied MSW test warnings.
- Test status: Jest suites and coverage were run locally; all Jest suites passed and coverage report generated. Playwright e2e will run in CI as part of `test:ci`.

If you need me to adjust the PR description or include additional operational notes (rate limits, per-client enable flags), tell me and I will update the PR.
