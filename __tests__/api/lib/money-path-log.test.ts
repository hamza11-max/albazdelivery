import { describe, expect, it, jest } from '@jest/globals'

import { logMoneyPathEvent } from '@/lib/observability/money-path-log'

describe('logMoneyPathEvent', () => {
  it('emits JSON with observability marker', () => {
    const logs: string[] = []
    const spy = jest.spyOn(console, 'info').mockImplementation((msg) => {
      logs.push(String(msg))
    })
    try {
      logMoneyPathEvent({
        component: 'test',
        action: 'ping',
        stripeEventId: 'evt_123',
      })
      expect(logs.length).toBe(1)
      const j = JSON.parse(logs[0]) as Record<string, unknown>
      expect(j.observability).toBe('money_path_v1')
      expect(j.component).toBe('test')
      expect(j.stripeEventId).toBe('evt_123')
    } finally {
      spy.mockRestore()
    }
  })
})
