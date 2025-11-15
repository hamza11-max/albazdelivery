import { NextRequest, NextResponse } from 'next/server'
import { signIn } from '@/lib/auth'
import { loginSchema } from '@/lib/validations/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { identifier, password, callbackUrl = '/', redirect = false } = body

    // Validate input
    const validated = loginSchema.safeParse({ identifier, password })
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 400 }
      )
    }

    // Sign in using Next-Auth v5
    const result = await signIn('credentials', {
      identifier: validated.data.identifier,
      password: validated.data.password,
      redirect: redirect as boolean,
    })

    // If redirect is false, signIn returns a result object
    // If redirect is true, signIn returns a redirect Response
    if (result instanceof Response) {
      // If it's a redirect, return success
      return NextResponse.json({ 
        success: true,
        url: callbackUrl 
      })
    }

    // Check for errors in the result
    if (result && typeof result === 'object' && 'error' in result) {
      return NextResponse.json(
        { error: result.error === 'CredentialsSignin' ? 'Invalid email or password' : String(result.error) },
        { status: 401 }
      )
    }

    // Success
    return NextResponse.json({ 
      success: true,
      url: callbackUrl 
    })
  } catch (error: any) {
    console.error('[SignIn] Error:', error)
    
    // Handle specific Next-Auth errors
    if (error.type === 'CredentialsSignin' || error.message?.includes('CredentialsSignin')) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'An error occurred during sign in' },
      { status: 500 }
    )
  }
}

