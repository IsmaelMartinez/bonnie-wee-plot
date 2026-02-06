'use client'

import { useState, ReactNode } from 'react'

export interface Tab {
  id: string
  label: string
  icon?: ReactNode
  content: ReactNode
}

interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
}

export default function Tabs({ tabs, defaultTab }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

  const activeTabData = tabs.find(tab => tab.id === activeTab)

  return (
    <div className="flex flex-col h-full">
      {/* Tab buttons */}
      <div className="flex border-b border-zen-stone-200 -mx-6 px-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 min-h-[44px] text-sm font-medium whitespace-nowrap transition border-b-2 -mb-[1px] ${
              activeTab === tab.id
                ? 'text-zen-moss-600 border-zen-moss-600'
                : 'text-zen-stone-500 border-transparent hover:text-zen-stone-700 hover:border-zen-stone-300'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 pt-6 overflow-y-auto">
        {activeTabData?.content}
      </div>
    </div>
  )
}
