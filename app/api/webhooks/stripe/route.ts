import { NextRequest } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/root/lib/prisma'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = (await headers()).get('stripe-signature')

  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return new Response('Webhook secret not configured', { status: 500 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err: any) {
    console.error('[Webhook] Signature verification failed:', err.message)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  try {
    // Handle events
    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: subscription.status === 'active' ? 'ACTIVE' : 
                   subscription.status === 'canceled' ? 'CANCELLED' :
                   subscription.status === 'past_due' ? 'PAST_DUE' : 'EXPIRED',
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
          },
        })
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any
        const subscription = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: invoice.subscription },
        })
        
        if (subscription) {
          await prisma.subscriptionPayment.create({
            data: {
              subscriptionId: subscription.id,
              amount: invoice.amount_paid / 100,
              currency: invoice.currency,
              status: 'COMPLETED',
              stripePaymentId: invoice.payment_intent,
              invoiceUrl: invoice.hosted_invoice_url,
              paidAt: new Date(),
            },
          })

          // Update subscription status
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: 'ACTIVE' },
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any
        const subscription = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: invoice.subscription },
        })
        
        if (subscription) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: 'PAST_DUE' },
          })
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (error) {
    console.error('[Webhook] Error processing event:', error)
    return new Response('Webhook processing failed', { status: 500 })
  }
}

