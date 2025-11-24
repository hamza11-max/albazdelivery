import generateText from '@/lib/llm'

describe('lib/llm adapter', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
    ;(global as any).fetch = undefined
  })

  afterEach(() => {
    process.env = OLD_ENV
    jest.restoreAllMocks()
  })

  test('throws when LLM_PROVIDER is not configured', async () => {
    delete process.env.LLM_PROVIDER
    await expect(generateText('hello')).rejects.toThrow(/LLM provider not configured/i)
  })

  test('throws when API key is missing for Anthropic', async () => {
    process.env.LLM_PROVIDER = 'anthropic'
    delete process.env.LLM_API_KEY
    await expect(generateText('hello')).rejects.toThrow(/LLM API key missing/i)
  })

  test('calls Anthropic endpoint and returns completion', async () => {
    process.env.LLM_PROVIDER = 'anthropic'
    process.env.LLM_API_KEY = 'test-key'
    process.env.LLM_DEFAULT_MODEL = 'claude-sonnet-3.5'

    const fakeResponse = {
      ok: true,
      json: async () => ({ completion: 'LLM response' }),
      status: 200,
      statusText: 'OK',
    }

    ;(global as any).fetch = jest.fn().mockResolvedValue(fakeResponse)

    const out = await generateText('Tell me a joke', { maxTokens: 10 })
    expect(out).toBe('LLM response')
    expect((global as any).fetch).toHaveBeenCalledTimes(1)

    const [url, opts] = (global as any).fetch.mock.calls[0]
    expect(String(url)).toMatch(/anthropic\.com/)
    const body = JSON.parse(opts.body)
    expect(body.model).toBe('claude-sonnet-3.5')
    expect(body.prompt).toBe('Tell me a joke')
  })

  test('throws when Anthropic returns non-OK response', async () => {
    process.env.LLM_PROVIDER = 'anthropic'
    process.env.LLM_API_KEY = 'test-key'

    const bad = {
      ok: false,
      status: 500,
      statusText: 'Server Error',
      text: async () => 'internal error',
    }

    ;(global as any).fetch = jest.fn().mockResolvedValue(bad)

    await expect(generateText('something')).rejects.toThrow(/Anthropic API error/i)
  })

  test('propagates network errors (fetch rejects)', async () => {
    process.env.LLM_PROVIDER = 'anthropic'
    process.env.LLM_API_KEY = 'test-key'

    ;(global as any).fetch = jest.fn().mockRejectedValue(new Error('network timeout'))

    await expect(generateText('hello')).rejects.toThrow(/network timeout/i)
  })
})
