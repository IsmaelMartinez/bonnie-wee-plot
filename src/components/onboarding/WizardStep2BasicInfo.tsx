'use client'

import { useState, useEffect } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { useLocation } from '@/hooks/useLocation'

interface WizardStep2BasicInfoProps {
  allotmentName: string
  allotmentLocation: string
  onAllotmentNameChange: (name: string) => void
  onAllotmentLocationChange: (location: string) => void
  onNext: () => void
  onBack: () => void
}

export default function WizardStep2BasicInfo({
  allotmentName,
  allotmentLocation,
  onAllotmentNameChange,
  onAllotmentLocationChange,
  onNext,
  onBack
}: WizardStep2BasicInfoProps) {
  const { userLocation, detectUserLocation, isDetecting } = useLocation()
  const [nameError, setNameError] = useState('')

  // Update location field when userLocation changes
  useEffect(() => {
    if (userLocation) {
      const locationString = userLocation.city && userLocation.country
        ? `${userLocation.city}, ${userLocation.country}`
        : userLocation.country || ''
      onAllotmentLocationChange(locationString)
    }
  }, [userLocation, onAllotmentLocationChange])

  const handleDetectLocation = async () => {
    await detectUserLocation()
    // Location will be set via useEffect when userLocation updates
  }

  const handleNext = () => {
    if (!allotmentName.trim()) {
      setNameError('Please enter a name for your allotment')
      return
    }
    setNameError('')
    onNext()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-display text-zen-ink-800 mb-2">
          Basic Information
        </h2>
        <p className="text-zen-stone-600">
          Tell us about your allotment
        </p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label htmlFor="allotment-name" className="block text-sm font-medium text-zen-ink-700 mb-2">
            Allotment Name <span className="text-red-500">*</span>
          </label>
          <input
            id="allotment-name"
            type="text"
            value={allotmentName}
            onChange={(e) => {
              onAllotmentNameChange(e.target.value)
              if (nameError) setNameError('')
            }}
            placeholder="e.g., My Community Garden, Plot 42A"
            className={`w-full px-4 py-3 border rounded-zen-lg focus:outline-none focus:ring-2 focus:ring-zen-moss-500 ${
              nameError ? 'border-red-500' : 'border-zen-stone-300'
            }`}
          />
          {nameError && (
            <p className="text-sm text-red-600 mt-1">{nameError}</p>
          )}
        </div>

        <div>
          <label htmlFor="allotment-location" className="block text-sm font-medium text-zen-ink-700 mb-2">
            Location (Optional)
          </label>
          <div className="flex gap-2">
            <input
              id="allotment-location"
              type="text"
              value={allotmentLocation}
              onChange={(e) => onAllotmentLocationChange(e.target.value)}
              placeholder="e.g., Edinburgh, Scotland"
              className="flex-1 px-4 py-3 border border-zen-stone-300 rounded-zen-lg focus:outline-none focus:ring-2 focus:ring-zen-moss-500"
            />
            <button
              onClick={handleDetectLocation}
              disabled={isDetecting}
              className="px-4 py-3 bg-zen-stone-100 text-zen-stone-700 rounded-zen-lg hover:bg-zen-stone-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title="Detect my location"
            >
              {isDetecting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <MapPin className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-zen-stone-500 mt-1">
            Adding your location helps Aitor give you season-specific advice
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="flex-1 px-4 py-3 border border-zen-stone-300 text-zen-stone-700 rounded-zen-lg hover:bg-zen-stone-50 transition font-medium"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          className="flex-1 px-4 py-3 bg-zen-moss-600 text-white rounded-zen-lg hover:bg-zen-moss-700 transition font-medium"
        >
          Continue →
        </button>
      </div>
    </div>
  )
}
