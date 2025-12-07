import { describe, it, jest } from '@jest/globals'
import { emitDriverLocationUpdated, eventEmitter } from '@/lib/events'

// Create spy on event emitter
const emitSpy = jest.spyOn(eventEmitter, 'emit');

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

    // Check if the event was emitted with correct data
    expect(emitSpy).toHaveBeenCalledWith('driver_location_updated', {
      driverId,
      location: locationData,
      timestamp: expect.any(Date)
    })
  })
})