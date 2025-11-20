"use client"

import React, { useEffect, useState, useRef } from 'react'
import { Card } from './card'
import { Badge } from './badge'
import { Button } from './button'
import { Spinner } from './spinner'
import { useSSE } from '@/lib/use-sse'
import { MapPin, Navigation, Phone, Clock } from 'lucide-react'

interface MapTrackingProps {
  orderId: string
  customerLocation?: {
    lat: number
    lng: number
  }
}

interface DriverLocation {
  id: string
  latitude: number
  longitude: number
  heading: number
  speed: number
  accuracy: number
  status: string
  updatedAt: string
  driver: {
    id: string
    name: string
    phone: string
    vehicleType: string
    photoUrl: string
  }
}

interface TrackingData {
  order: {
    id: string
    status: string
    estimatedDeliveryTime: string
  }
  tracking: {
    currentLocation: DriverLocation
    locationHistory: Array<{
      latitude: number
      longitude: number
      timestamp: string
    }>
    lastUpdated: string
  } | null
}

export function MapTracking({ orderId, customerLocation }: MapTrackingProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Subscribe to real-time updates
  const { data: locationUpdate } = useSSE(`/api/sse/driver-location?orderId=${orderId}`, true)
  
  // Handle incoming SSE messages
  useEffect(() => {
    if (locationUpdate) {
      try {
        const parsedData = typeof locationUpdate === 'string' ? JSON.parse(locationUpdate) : locationUpdate
        if (parsedData && trackingData) {
          setTrackingData(prev => {
            if (!prev) return prev
            return {
              ...prev,
              tracking: {
                ...prev.tracking!,
                currentLocation: {
                  ...prev.tracking!.currentLocation,
                  latitude: parsedData.lat,
                  longitude: parsedData.lng,
                  heading: parsedData.heading,
                  speed: parsedData.speed,
                  updatedAt: parsedData.timestamp
                }
              }
            }
          })
          updateMarkerPosition(parsedData.lat, parsedData.lng, parsedData.heading)
        }
      } catch (e) {
        console.error("Error parsing SSE data:", e)
      }
    }
  })

  // Fetch initial tracking data
  useEffect(() => {
    const fetchTrackingData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/orders/track?orderId=${orderId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch tracking data')
        }
        const data = await response.json()
        setTrackingData(data)
        setLoading(false)
      } catch (err) {
        setError('Could not load tracking information')
        setLoading(false)
      }
    }

    fetchTrackingData()
  }, [orderId])

  // Initialize map when tracking data is available
  useEffect(() => {
    if (!trackingData?.tracking?.currentLocation || !mapRef.current) return

    const initMap = async () => {
      if (!window.google) {
        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
        script.async = true
        script.defer = true
        document.head.appendChild(script)
        
        return new Promise<void>((resolve) => {
          script.onload = () => resolve()
        })
      }
      return Promise.resolve()
    }

    const createMap = () => {
      const { latitude, longitude } = trackingData.tracking!.currentLocation
      
      const mapOptions = {
        center: { lat: latitude, lng: longitude },
        zoom: 15,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        zoomControl: true
      }

      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions)
      
      // Create driver marker
      const driverIcon = {
        path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 6,
        fillColor: "#4285F4",
        fillOpacity: 1,
        strokeWeight: 2,
        rotation: trackingData.tracking!.currentLocation.heading || 0
      }
      
      markerRef.current = new window.google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: mapInstanceRef.current,
        icon: driverIcon,
        title: "Driver Location"
      })
      
      // Add customer marker if available
      if (customerLocation) {
        new window.google.maps.Marker({
          position: { lat: customerLocation.lat, lng: customerLocation.lng },
          map: mapInstanceRef.current,
          icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
          },
          title: "Delivery Location"
        })
      }
      
      // Draw path if location history is available
      if (trackingData.tracking!.locationHistory?.length > 1) {
        const path = trackingData.tracking!.locationHistory.map(point => ({
          lat: point.latitude,
          lng: point.longitude
        }))
        
        new window.google.maps.Polyline({
          path,
          geodesic: true,
          strokeColor: '#4285F4',
          strokeOpacity: 0.8,
          strokeWeight: 3,
          map: mapInstanceRef.current
        })
      }
    }

    initMap().then(createMap)
  }, [trackingData, customerLocation])

  // Update marker position when location changes
  const updateMarkerPosition = (lat: number, lng: number, heading: number) => {
    if (!markerRef.current || !mapInstanceRef.current) return
    
    const newPosition = new window.google.maps.LatLng(lat, lng)
    markerRef.current.setPosition(newPosition)
    
    // Update marker rotation based on heading
    if (heading !== undefined) {
      const icon = markerRef.current.getIcon()
      markerRef.current.setIcon({
        ...icon,
        rotation: heading
      })
    }
    
    // Center map on new position
    mapInstanceRef.current.panTo(newPosition)
  }

  // Calculate ETA
  const formatETA = () => {
    if (!trackingData?.order?.estimatedDeliveryTime) return 'Calculating...'
    
    const eta = new Date(trackingData.order.estimatedDeliveryTime)
    const now = new Date()
    
    if (eta < now) return 'Arriving soon'
    
    const diffMs = eta.getTime() - now.getTime()
    const diffMins = Math.round(diffMs / 60000)
    
    return diffMins <= 1 ? 'Arriving now' : `${diffMins} minutes`
  }

  if (loading) {
    return (
      <Card className="p-4 flex flex-col items-center justify-center h-64">
        <Spinner className="h-8 w-8" />
        <p className="mt-4 text-gray-500">Loading tracking information...</p>
      </Card>
    )
  }

  if (error || !trackingData) {
    return (
      <Card className="p-4 flex flex-col items-center justify-center h-64">
        <p className="text-red-500">{error || 'Could not load tracking information'}</p>
        <Button 
          onClick={() => window.location.reload()} 
          className="mt-4"
        >
          Retry
        </Button>
      </Card>
    )
  }

  if (!trackingData.tracking) {
    return (
      <Card className="p-4 flex flex-col items-center justify-center h-64">
        <p className="text-gray-500">Driver has not yet been assigned to this order.</p>
        <p className="text-gray-500 mt-2">Please check back later.</p>
      </Card>
    )
  }

  const { currentLocation } = trackingData.tracking

  return (
    <Card className="overflow-hidden">
      <div className="h-64 w-full" ref={mapRef} />
      
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-medium">Order #{orderId.slice(-6)}</h3>
            <Badge variant={
              trackingData.order.status === 'DELIVERED' ? 'secondary' :
              trackingData.order.status === 'IN_TRANSIT' ? 'default' :
              'outline'
            }>
              {trackingData.order.status.replace('_', ' ')}
            </Badge>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1 text-gray-500" />
            <span className="text-sm font-medium">{formatETA()}</span>
          </div>
        </div>
        
        <div className="flex items-center mb-2">
          <div className="h-10 w-10 rounded-full bg-gray-200 mr-3 overflow-hidden">
            {currentLocation.driver.photoUrl ? (
              <img 
                src={currentLocation.driver.photoUrl} 
                alt={currentLocation.driver.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-primary text-white">
                {currentLocation.driver.name.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <p className="font-medium">{currentLocation.driver.name}</p>
            <p className="text-sm text-gray-500">{currentLocation.driver.vehicleType}</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-auto"
            onClick={() => window.open(`tel:${currentLocation.driver.phone}`)}
          >
            <Phone className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="text-xs text-gray-500 mt-2">
          Last updated: {new Date(currentLocation.updatedAt).toLocaleTimeString()}
        </div>
      </div>
    </Card>
  )
}
