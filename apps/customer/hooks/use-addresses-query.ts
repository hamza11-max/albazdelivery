'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { addressesAPI } from '../lib/api-client'

export function useAddressesQuery() {
  return useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const res = await addressesAPI.list()
      return (res.data as { addresses: Array<{ id: string; label: string; address: string; city: string; isDefault: boolean }> }).addresses
    },
  })
}

export function useCreateAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { label: string; address: string; city: string; isDefault?: boolean }) =>
      addressesAPI.create(data).then((r) => (r.data as { address: unknown }).address),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] }),
  })
}

export function useUpdateAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { label?: string; address?: string; city?: string; isDefault?: boolean } }) =>
      addressesAPI.update(id, data).then((r) => (r.data as { address: unknown }).address),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] }),
  })
}

export function useDeleteAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => addressesAPI.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] }),
  })
}
