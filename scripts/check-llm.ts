import generateText from '../lib/llm'

async function main() {
  console.log('Running quick LLM adapter smoke check')
  process.env.LLM_PROVIDER = 'anthropic'
  process.env.LLM_API_KEY = 'test-key'
  process.env.LLM_DEFAULT_MODEL = 'claude-sonnet-3.5'

  ;(global as any).fetch = async (url: string, opts: any) => {
    console.log('mock fetch called:', url)
    console.log('mock fetch body:', opts?.body)
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ completion: 'mocked-llm-response' }),
    }
  }

  const out = await generateText('Smoke test prompt', { maxTokens: 10 })
  console.log('Adapter output:', out)
}

main().catch((err) => {
  console.error('Smoke check failed:', err)
  process.exit(1)
})
