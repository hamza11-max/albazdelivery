import React from 'react';

export const signIn = jest.fn();
export const signOut = jest.fn();
export const useSession = jest.fn(() => ({
  data: {
    user: {
      id: 'test-user',
      name: 'Test User',
      email: 'test@test.com',
      role: 'customer'
    },
    expires: new Date(Date.now() + 2 * 86400).toISOString()
  },
  status: 'authenticated'
}));

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}