type EventType =
  | "order_created"
  | "order_updated"
  | "order_assigned"
  | "order_delivered"
  | "delivery_created"
  | "delivery_updated"
  | "driver_location_updated"
  | "notification_sent"
  | "payment_processed"
  | "loyalty_points_earned"

type EventListener = (data: any) => void

class EventEmitter {
  private listeners: Map<EventType, Set<EventListener>> = new Map()

  on(event: EventType, listener: EventListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(listener)
  }

  off(event: EventType, listener: EventListener) {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.delete(listener)
    }
  }

  emit(event: EventType, data: any) {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(data)
        } catch (error) {
          console.error("[v0] Error in event listener:", error)
        }
      })
    }
    console.log("[v0] Event emitted:", event, data)
  }

  removeAllListeners(event?: EventType) {
    if (event) {
      this.listeners.delete(event)
    } else {
      this.listeners.clear()
    }
  }
}

export const eventEmitter = new EventEmitter()

export function emitOrderCreated(order: any) {
  eventEmitter.emit("order_created", { order, timestamp: new Date() })
}

export function emitOrderUpdated(order: any) {
  eventEmitter.emit("order_updated", { order, timestamp: new Date() })
}

export function emitOrderAssigned(order: any, driverId: string) {
  eventEmitter.emit("order_assigned", { order, driverId, timestamp: new Date() })
}

export function emitOrderDelivered(order: any) {
  eventEmitter.emit("order_delivered", { order, timestamp: new Date() })
}

export function emitDeliveryCreated(delivery: any) {
  eventEmitter.emit("delivery_created", { delivery, timestamp: new Date() })
}

export function emitDeliveryUpdated(delivery: any) {
  eventEmitter.emit("delivery_updated", { delivery, timestamp: new Date() })
}

export function emitDriverLocationUpdated(driverId: string, location: { lat: number; lng: number }) {
  eventEmitter.emit("driver_location_updated", { driverId, location, timestamp: new Date() })
}

export function emitNotificationSent(notification: any) {
  eventEmitter.emit("notification_sent", { notification, timestamp: new Date() })
}

export function emitPaymentProcessed(payment: any) {
  eventEmitter.emit("payment_processed", { payment, timestamp: new Date() })
}

export function emitLoyaltyPointsEarned(customerId: string, points: number) {
  eventEmitter.emit("loyalty_points_earned", { customerId, points, timestamp: new Date() })
}
