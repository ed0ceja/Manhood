"use client"

import { useState } from "react"
import { BotTab } from "@/components/bot-tab"
import { ChallengeTab } from "@/components/challenge-tab"

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"challenge" | "chat">("challenge")

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-center">
          <h1 className="text-xl font-semibold text-red-600">Manhood</h1>
        </div>
      </header>

      {/* Tab switcher */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("challenge")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === "challenge"
              ? "text-foreground border-b-2 border-foreground"
              : "text-muted-foreground"
          }`}
        >
          Daily Challenge
        </button>
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === "chat"
              ? "text-foreground border-b-2 border-foreground"
              : "text-muted-foreground"
          }`}
        >
          Ask the Book
        </button>
      </div>

      {/* Tab content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === "challenge" ? <ChallengeTab /> : <BotTab />}
      </main>
    </div>
  )
}
