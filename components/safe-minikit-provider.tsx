"use client"

import { MiniKitProvider } from "@worldcoin/minikit-js/minikit-provider"

export function SafeMiniKitProvider({ children }: { children: React.ReactNode }) {
  // Always render MiniKitProvider to prevent hydration mismatches
  // MiniKitProvider handles cases where it's not in World App gracefully
  // This prevents the getComputedStyle error from hydration mismatches
  return <MiniKitProvider>{children}</MiniKitProvider>
}

