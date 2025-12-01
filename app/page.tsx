"use client"

import dynamic from "next/dynamic"

// Dynamically import the page content with SSR disabled to prevent hydration errors
// This ensures the component only renders on the client side, avoiding getComputedStyle errors
const WelcomePageContent = dynamic(() => import("./page-wrapper"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md mx-auto flex flex-col items-center text-center space-y-6">
        <div className="relative w-40 h-60 bg-muted animate-pulse rounded-lg" />
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
      </div>
    </div>
  ),
})

export default function WelcomePage() {
  return <WelcomePageContent />
}
