import { useState } from 'react'

export interface LoadingState {
  [key: string]: boolean
}

export function useLoadingState(initialState: LoadingState = {}) {
  const [loadingState, setLoadingState] = useState<LoadingState>(initialState)

  const setLoading = (key: keyof LoadingState, value: boolean) => {
    setLoadingState(prev => ({ ...prev, [key]: value }))
  }

  return { loadingState, setLoading }
}