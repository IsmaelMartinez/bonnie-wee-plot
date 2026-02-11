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
  contentClassName?: string
}

export default function Tabs({ tabs, defaultTab, contentClassName }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

  const activeTabData = tabs.find(tab => tab.id === activeTab)

  return (
    <div className="flex flex-col h-full">
      {/* Tab buttons */}
      <div className="flex border-b border-zen-stone-200 -mx-6 px-6 overflow-x-auto" role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
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
      <div
        className={contentClassName || "flex-1 pt-6 overflow-y-auto"}
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
        {activeTabData?.content}
      </div>
    </div>
  )
}
