// Helper to bypass authentication for Electron app
// In production, this should be removed and proper authentication should be used
export function getBypassAuth() {
  // For Electron app, bypass authentication
  return {
    user: {
      id: 'electron-user',
      role: 'ADMIN' as const,
      email: 'electron@local',
      name: 'Electron User',
      status: 'APPROVED' as const,
    },
    isAdmin: true,
    isVendor: false,
  }
}

