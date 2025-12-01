"use client"

import { MiniKitProvider } from "@worldcoin/minikit-js/minikit-provider"
import { useEffect, useState } from "react"

export function SafeMiniKitProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Only render MiniKitProvider after client-side hydration
    setMounted(true)
  }, [])

  // During SSR or before mount, render without MiniKitProvider
  if (!mounted) {
    return <>{children}</>
  }

  // After mount, wrap with MiniKitProvider
  // ErrorBoundary in layout.tsx will catch any errors
  return <MiniKitProvider>{children}</MiniKitProvider>
}

