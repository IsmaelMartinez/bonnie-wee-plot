'use client'

import { Shield } from 'lucide-react'

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
  // Handle paste - this is the primary way to enter the API key
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    onTokenChange(pastedText.trim())
  }

  // Block direct typing - only allow paste, delete, and navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter
    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X (and Cmd on Mac)
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End']
    const isModifierKey = e.ctrlKey || e.metaKey

    if (allowedKeys.includes(e.key) || isModifierKey) {
      return
    }

    // Block all other typing
    e.preventDefault()
  }

  return (
    <section
      className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8"
      aria-labelledby="token-settings-heading"
    >
      <div className="flex items-center mb-4">
        <Shield className="w-5 h-5 text-blue-600 mr-2" aria-hidden="true" />
        <h3 id="token-settings-heading" className="text-lg font-semibold text-gray-800">API Token Configuration</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="openai-token" className="block text-sm font-medium text-gray-700 mb-2">
            OpenAI API Key
          </label>
          <div className="relative">
            <input
              id="openai-token"
              type="password"
              value={token}
              onChange={(e) => onTokenChange(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
              placeholder="Paste your API key here"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent select-none"
              aria-describedby="token-help-text token-privacy-notice"
              autoComplete="off"
            />
          </div>

          <div id="token-help-text" className="mt-2 text-xs text-gray-500">
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

        <div id="token-privacy-notice" className="bg-yellow-50 border border-yellow-200 rounded-md p-3" role="note">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Shield className="w-4 h-4 text-yellow-600 mt-0.5" aria-hidden="true" />
            </div>
            <div className="ml-2">
              <p className="text-sm text-yellow-800">
                <strong>Privacy Notice:</strong> Your token is stored only in your browser session and never saved permanently.
                It&apos;s sent securely to OpenAI only when making requests.
              </p>
            </div>
          </div>
        </div>

        <div className="flex space-x-3" role="group" aria-label="Token actions">
          <button
            onClick={onSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors min-h-[44px]"
          >
            Save Configuration
          </button>
          <button
            onClick={onClear}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors min-h-[44px]"
          >
            Clear Token
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors min-h-[44px]"
          >
            Cancel
          </button>
        </div>
      </div>
    </section>
  )
}




