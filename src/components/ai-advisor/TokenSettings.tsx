'use client'

import { useState } from 'react'
import { Shield, Eye, EyeOff } from 'lucide-react'

interface TokenSettingsProps {
  token: string
  onTokenChange: (token: string) => void
  onSave: () => void
  onClear: () => void
  onClose: () => void
}

export default function TokenSettings({
  token,
  onTokenChange,
  onSave,
  onClear,
  onClose
}: TokenSettingsProps) {
  const [showToken, setShowToken] = useState(false)

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
      <div className="flex items-center mb-4">
        <Shield className="w-5 h-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-800">API Token Configuration</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="openai-token" className="block text-sm font-medium text-gray-700 mb-2">
            OpenAI API Key
          </label>
          <div className="relative">
            <input
              id="openai-token"
              type={showToken ? 'text' : 'password'}
              value={token}
              onChange={(e) => onTokenChange(e.target.value)}
              placeholder="sk-xxxxxxxxxxxxxxxxxx or your API key"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showToken ? (
                <EyeOff className="w-4 h-4 text-gray-400" />
              ) : (
                <Eye className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
          
          <div className="mt-2 text-xs text-gray-500">
            <p>
              Your OpenAI API key from the OpenAI dashboard.{' '}
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:underline"
              >
                Get one here
              </a>
            </p>
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Shield className="w-4 h-4 text-yellow-600 mt-0.5" />
            </div>
            <div className="ml-2">
              <p className="text-sm text-yellow-800">
                <strong>Privacy Notice:</strong> Your token is stored only in your browser session and never saved permanently. 
                It&apos;s sent securely to OpenAI only when making requests.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={onSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Save Configuration
          </button>
          <button
            onClick={onClear}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Clear Token
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}



