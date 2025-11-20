"use client"

import React, { useState, useEffect } from 'react'
import { Switch } from './switch'
import { Label } from './label'
import { Shield, ShieldAlert } from 'lucide-react'

interface PrivacyToggleProps {
  driverId: string
}

export function PrivacyToggle({ driverId }: PrivacyToggleProps) {
  const [isActive, setIsActive] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPrivacySettings = async () => {
      try {
        const response = await fetch('/api/driver/privacy')
        if (response.ok) {
          const data = await response.json()
          setIsActive(data.isActive)
        }
        setLoading(false)
      } catch (error) {
        console.error('Error fetching privacy settings:', error)
        setLoading(false)
      }
    }

    fetchPrivacySettings()
  }, [])

  const togglePrivacy = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/driver/privacy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (response.ok) {
        const data = await response.json()
        setIsActive(data.isActive)
      }
    } catch (error) {
      console.error('Error updating privacy settings:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
      <div className="mr-2">
        {isActive ? (
          <Shield className="h-5 w-5 text-green-500" />
        ) : (
          <ShieldAlert className="h-5 w-5 text-amber-500" />
        )}
      </div>
      <div className="flex-1">
        <Label htmlFor="location-tracking" className="text-sm font-medium">
          Location Tracking
        </Label>
        <p className="text-xs text-gray-500">
          {isActive
            ? 'Your location is being shared during deliveries'
            : 'Your location is private'}
        </p>
      </div>
      <Switch
        id="location-tracking"
        checked={isActive}
        onCheckedChange={togglePrivacy}
        disabled={loading}
      />
    </div>
  )
}
