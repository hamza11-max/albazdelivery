# Enabling Claude (Sonnet 3.5) in Production

This project includes a minimal LLM adapter and a guarded integration that will use Anthropic's Claude (Sonnet 3.5) when enabled via environment variables.

Important: this change does not add any API keys or secrets to the repo. You must provide the Anthropic API key in deployment (e.g., Vercel/Heroku/Render) as a secure secret.

Environment variables

- LLM_PROVIDER=anthropic
- LLM_DEFAULT_MODEL=claude-sonnet-3.5
- LLM_API_KEY=<your-anthropic-api-key> (set this as a secret in your deployment)

How it works

- The backend adapter is implemented at `lib/llm.ts`. It reads `LLM_PROVIDER` and `LLM_DEFAULT_MODEL` and calls Anthropic's REST `v1/complete` endpoint when `LLM_PROVIDER` is set to `anthropic`.
- The chatbot endpoint `app/api/chat/chatbot/route.ts` will call the adapter when `LLM_PROVIDER` is configured and will fall back to the existing static responses if the adapter fails or no provider is set.

Deployment steps (example)

1. Add the three environment variables to your production environment (set `LLM_API_KEY` as a secret).
2. Deploy the app. The chatbot endpoint will use Claude automatically for incoming messages when the provider and key are present.

Security and cost notes

- Anthropic API calls are billable. Monitor usage and set limits or rate-limiting as needed.
- Do not commit `LLM_API_KEY` to source control. Use your cloud provider's secret management.
- Consider restricting the feature to authenticated users or adding usage quotas to prevent abuse.

Rollback

- To disable, remove `LLM_PROVIDER` or set it to an empty string in production; the service will fall back to the static rule-based chatbot.

Contact

If you need changes to prompt engineering, multi-model routing, or per-client model selection, open an issue or PR describing the desired behavior.
