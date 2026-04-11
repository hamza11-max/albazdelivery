import { NextRequest } from 'next/server'
import {
  handleSubscriptionsGet,
  handleSubscriptionsPost,
} from '@/root/lib/api-subscriptions'

export async function GET(request: NextRequest) {
  return handleSubscriptionsGet(request)
}

export async function POST(request: NextRequest) {
  return handleSubscriptionsPost(request)
}
