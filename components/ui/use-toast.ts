// Re-export from hooks to avoid duplication and initialization issues
// This ensures a single source of truth for useToast
export { useToast, toast, reducer } from '@/hooks/use-toast'
