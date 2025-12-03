'use server'

import { signIn } from '@/root/lib/auth'
// Note: This file may not be used - sign-in is handled via API endpoint
// If redirect is needed, use NextResponse.redirect() in API routes instead

export async function signInAction(identifier: string, password: string) {
  try {
    const result = await signIn('credentials', {
      identifier,
      password,
      redirect: false,
    })
    // Return success - redirect should be handled by the caller
    return { success: true }
  } catch (error) {
    return { error: 'Invalid credentials' }
  }
}

