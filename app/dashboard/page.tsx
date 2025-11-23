"use client"

import { BotTab } from "@/components/bot-tab"

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-center">
          <h1 className="text-xl font-semibold text-red-600">Manhood</h1>
        </div>
      </header>

      {/* Main Content - Just the bot chat */}
      <main className="flex-1 overflow-hidden">
        <BotTab />
      </main>
    </div>
  )
}
