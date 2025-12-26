describe('Jest global.fetch wrapper', () => {
  beforeEach(() => {
    // Clear any existing mock implementations between tests
    jest.clearAllMocks()
  })

  it('wraps assigned fetch implementations into a jest mock with helpers', async () => {
    // Initially ensure fetch is available and is a function
    expect(typeof globalThis.fetch).toBe('function')

    // Assign a plain function (non-mock) to global.fetch
    const plainFetch = () => Promise.resolve({ ok: true, json: async () => ({ value: 'original' }) })
    // Use the setter - our setup should wrap this value into a Jest mock
    ;(globalThis as any).fetch = plainFetch

    // After assignment, fetch should be a Jest mock (have _isMockFunction)
    // and should expose mockResolvedValueOnce / mockRejectedValueOnce
    const f: any = globalThis.fetch
    expect(typeof f).toBe('function')
    expect(f._isMockFunction).toBeTruthy()
    expect(typeof f.mockResolvedValueOnce).toBe('function')
    expect(typeof f.mockRejectedValueOnce).toBe('function')

    // Use mockResolvedValueOnce to override the next response
    f.mockResolvedValueOnce({ ok: true, json: async () => ({ value: 'mocked' }) })
    const res = await fetch('/test')
    const json = await res.json()
    expect(json.value).toBe('mocked')
  })

  it('mockRejectedValueOnce causes the fetch promise to reject', async () => {
    ;(globalThis as any).fetch = () => Promise.resolve({ ok: true, json: async () => ({}) })
    const f: any = globalThis.fetch
    f.mockRejectedValueOnce(new Error('Network fail'))
    await expect(fetch('/x')).rejects.toThrow('Network fail')
  })
})
