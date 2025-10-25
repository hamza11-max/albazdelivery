import { NextRequest, NextResponse } from 'next/server';
import { nextCsrf } from 'next-csrf';

const { csrf, setup } = nextCsrf({
  secret: process.env.CSRF_SECRET || 'your-super-secret-key-min-32-chars',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production'
  }
});

// Export the CSRF middleware and setup functions
export { csrf, setup };