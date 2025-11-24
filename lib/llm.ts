// Intentionally do not import RequestInit from node-fetch to avoid
// type conflicts between @types/node-fetch and the global fetch types
// provided by Node >= 20. We'll rely on the global fetch typing.

export type LLMOptions = {
  model?: string
  maxTokens?: number
  temperature?: number
}

/**
 * Minimal LLM adapter.
 * Currently supports Anthropic (Claude) via direct REST call.
 * Controlled by env vars: LLM_PROVIDER, LLM_DEFAULT_MODEL, LLM_API_KEY
 */
export async function generateText(prompt: string, opts: LLMOptions = {}): Promise<string> {
  const provider = (process.env.LLM_PROVIDER || '').toLowerCase()
  const model = opts.model || process.env.LLM_DEFAULT_MODEL || 'claude-sonnet-3.5'

  if (!provider) {
    throw new Error('LLM provider not configured. Set LLM_PROVIDER to "anthropic" to use Claude.')
  }

  if (provider === 'anthropic' || provider === 'claude' || provider === 'anthropic.ai') {
    const apiKey = process.env.LLM_API_KEY
    if (!apiKey) throw new Error('LLM API key missing. Set LLM_API_KEY in environment.')

    const endpoint = 'https://api.anthropic.com/v1/complete'

    const body = {
      model,
      prompt,
      max_tokens_to_sample: opts.maxTokens ?? 512,
      temperature: opts.temperature ?? 0.0,
    }

    // Use global fetch (Node 18+) — available in the repo environment requirement (node >=20)
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Anthropic API error: ${res.status} ${res.statusText} ${text}`)
    }

    const data = await res.json().catch(() => ({})) as any
    // Anthropic returns `completion` for v1/complete
    const completion = data?.completion ?? data?.text ?? ''
    return String(completion || '')
  }

  throw new Error(`Unsupported LLM provider: ${provider}`)
}

export default generateText
