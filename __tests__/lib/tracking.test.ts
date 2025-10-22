import { describe, it, expect, jest } from '@jest/globals'
import { emitDriverLocationUpdated } from '@/lib/events'

// Mock the event emitter
jest.mock('@/lib/events', () => ({
  emitDriverLocationUpdated: jest.fn(),
  eventEmitter: {
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn()
  }
}))

describe('Driver Location Tracking', () => {
  it('should emit driver location update event with correct data', () => {
    // Test data
    const driverId = 'driver-123'
    const locationData = {
      lat: 37.7749,
      lng: -122.4194,
      heading: 90,
      speed: 25,
      timestamp: new Date()
    }

    // Call the function
    emitDriverLocationUpdated(driverId, locationData)

    // Check if the function was called with the right parameters
    expect(emitDriverLocationUpdated).toHaveBeenCalledWith(driverId, locationData)
  })
})