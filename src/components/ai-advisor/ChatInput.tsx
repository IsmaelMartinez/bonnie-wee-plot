'use client'

import { useRef, useState } from 'react'
import { Send, Camera, X, Clock } from 'lucide-react'
import Image from 'next/image'

interface RateLimitInfo {
  cooldownMs: number
  remainingRequests: number
}

interface ChatInputProps {
  onSubmit: (message: string, image?: File) => void
  isLoading: boolean
  rateLimitInfo?: RateLimitInfo
}

export default function ChatInput({ onSubmit, isLoading, rateLimitInfo }: ChatInputProps) {
  const [input, setInput] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError(null)
    const file = event.target.files?.[0]
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        setValidationError('Please select an image file')
        return
      }

      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setValidationError('Image must be smaller than 5MB')
        return
      }

      setSelectedImage(file)
      
      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() || selectedImage) {
      onSubmit(input, selectedImage || undefined)
      setInput('')
      removeImage()
    }
  }

  return (
    <div className="border-t border-gray-200 p-4">
      {/* Image preview */}
      {imagePreview && (
        <div className="mb-4 relative inline-block">
          <Image 
            src={imagePreview} 
            alt="Plant for analysis"
            className="max-w-xs h-auto rounded border"
            style={{ maxHeight: '150px' }}
            width={300}
            height={150}
            unoptimized={true}
          />
          <button
            onClick={removeImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
            title="Remove image"
            aria-label="Remove uploaded image"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col gap-2">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about planting, pests, soil, weather, or any garden question..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isLoading}
              aria-label="Type your gardening question"
            />

            {/* Image upload button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-green-600 text-white px-3 sm:px-4 py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2 min-h-[44px]"
              disabled={isLoading}
              title="Upload plant photo"
              aria-label="Upload a plant photo for visual diagnosis"
            >
              <Camera className="w-5 h-5" aria-hidden="true" />
            </button>

            <button
              type="submit"
              disabled={isLoading || (!input.trim() && !selectedImage)}
              className="bg-primary-600 text-white px-3 sm:px-4 py-2.5 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition min-h-[44px]"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Validation error - displayed below upload button in red text */}
          {validationError && (
            <div
              role="alert"
              aria-live="polite"
              className="text-sm text-red-600"
            >
              {validationError}
            </div>
          )}
        </div>

        {/* Helper text and rate limit status */}
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-500">
            {validationError ? null : selectedImage ? (
              <span className="text-green-600">📷 Image ready for analysis</span>
            ) : (
              <span>💡 Tip: Upload a plant photo for visual diagnosis</span>
            )}
          </div>
          
          {rateLimitInfo && rateLimitInfo.cooldownMs > 0 && (
            <div className="flex items-center gap-1 text-amber-600">
              <Clock className="w-4 h-4" aria-hidden="true" />
              <span>Wait {Math.ceil(rateLimitInfo.cooldownMs / 1000)}s</span>
            </div>
          )}
        </div>
      </form>

      {/* Hidden file input - aria-hidden because users interact via the upload button */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
        capture="environment"
        aria-hidden="true"
      />
    </div>
  )
}

export { ChatInput }

