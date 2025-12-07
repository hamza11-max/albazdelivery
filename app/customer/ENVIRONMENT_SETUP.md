# Environment Setup Guide

## Required Environment Variables

### Development
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/albazdelivery"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Optional: WebSocket URL (defaults to same host)
NEXT_PUBLIC_WS_URL="ws://localhost:3000"
```

### Production
```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/albazdelivery"

# NextAuth
NEXTAUTH_SECRET="your-production-secret-key"
NEXTAUTH_URL="https://your-domain.com"

# WebSocket (use wss:// for secure connections)
NEXT_PUBLIC_WS_URL="wss://your-domain.com"
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
```bash
# Copy example file
cp .env.example .env.local

# Edit .env.local with your values
```

### 3. Database Setup
```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```

## Feature Flags

### React Query DevTools
Automatically enabled in development mode. Access via:
- React Query DevTools panel (bottom of screen)

### WebSocket
- Enabled by default when `NEXT_PUBLIC_WS_URL` is set
- Falls back gracefully if WebSocket server is unavailable
- Uses SSE (Server-Sent Events) as fallback for notifications

### Real-time Updates
- Automatically enabled when user is authenticated
- Requires WebSocket server at `/api/ws` endpoint
- Works with existing SSE infrastructure

## Troubleshooting

### WebSocket Connection Issues
If WebSocket fails to connect:
1. Check `NEXT_PUBLIC_WS_URL` is set correctly
2. Verify WebSocket server is running
3. Check browser console for errors
4. App will continue to work with SSE fallback

### React Query Cache Issues
If data seems stale:
1. Check cache times in `providers/query-provider.tsx`
2. Use React Query DevTools to inspect cache
3. Manually invalidate queries if needed:
   ```typescript
   queryClient.invalidateQueries({ queryKey: ['stores'] })
   ```

### Type Errors
If you see TypeScript errors:
```bash
# Run type check
npm run type-check

# Regenerate Prisma types
npm run db:generate
```

## Performance Tuning

### Cache Times
Adjust in `providers/query-provider.tsx`:
- `staleTime`: How long data is considered fresh
- `gcTime`: How long unused data stays in cache
- `refetchInterval`: Auto-refetch interval (for active orders)

### WebSocket Reconnection
Adjust in `hooks/use-websocket.ts`:
- `reconnectInterval`: Time between reconnection attempts
- `maxReconnectAttempts`: Maximum reconnection attempts

---

**Last Updated:** 2024  
**Version:** 2.0.0

