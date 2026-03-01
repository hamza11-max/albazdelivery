'use client'

import { useQuery } from '@tanstack/react-query'
import { deliveryFeeAPI } from '../lib/api-client'

export function useDeliveryFeeQuery(city: string | null) {
  return useQuery({
    queryKey: ['deliveryFee', city],
    queryFn: async () => {
      if (!city) return { fee: 500, city: null, estimatedTime: null }
      const res = await deliveryFeeAPI.getByCity(city)
      return res.data as { fee: number; city: string | null; estimatedTime: number | null }
    },
    enabled: !!city,
    staleTime: 1000 * 60 * 5,
  })
}
