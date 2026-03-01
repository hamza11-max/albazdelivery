'use client'

import { useQuery } from '@tanstack/react-query'
import { walletAPI } from '../lib/api-client'

export function useWalletBalanceQuery() {
  return useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: async () => {
      try {
        const res = await walletAPI.getBalance()
        return (res.data as { balance?: number })?.balance ?? 0
      } catch {
        return 0
      }
    },
    staleTime: 1000 * 60,
  })
}
