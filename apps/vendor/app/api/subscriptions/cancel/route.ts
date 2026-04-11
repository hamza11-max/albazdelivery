import { NextRequest } from 'next/server'
import { handleSubscriptionsCancelPost } from '@/root/lib/api-subscriptions'

export async function POST(request: NextRequest) {
  return handleSubscriptionsCancelPost(request)
}
