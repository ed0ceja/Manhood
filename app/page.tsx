"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { 
  MiniKit, 
  VerifyCommandInput, 
  VerificationLevel, 
  ISuccessResult 
} from "@worldcoin/minikit-js"

/**
 * Action ID for World ID verification
 * This should match the action ID created in the World ID Developer Portal
 */
const ACTION_ID = process.env.NEXT_PUBLIC_WORLD_ACTION_ID || 'chat'

export default function WelcomePage() {
  const router = useRouter()
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isWorldApp, setIsWorldApp] = useState<boolean | null>(null)

  // Check if running in World App on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if MiniKit is available
      // We'll only check when the user actually tries to verify
      // This avoids errors when not in World App
      const checkMiniKit = () => {
        try {
          // Default to false - we'll check when user clicks the button
          setIsWorldApp(false)
        } catch (error) {
          console.error('Error checking MiniKit:', error)
          setIsWorldApp(false)
        }
      }
      
      // Check after a short delay to allow MiniKitProvider to initialize
      const timeoutId = setTimeout(checkMiniKit, 100)
      
      return () => clearTimeout(timeoutId)
    } else {
      setIsWorldApp(false)
    }
  }, [])

  const handleJoinBrotherhood = async () => {
    // For demo/presentation: Always show verification flow
    // Check if MiniKit is installed (running in World App)
    // Only check when user clicks, not on page load to avoid console errors
    let isInstalled = false
    try {
      // Check if MiniKit exists before calling isInstalled
      if (typeof MiniKit === 'undefined' || !MiniKit || typeof MiniKit.isInstalled !== 'function') {
        setError("Please open this app in World App to verify your identity and join the brotherhood.")
        setIsWorldApp(false)
        return
      }
      
      // Now safely call isInstalled
      isInstalled = MiniKit.isInstalled()
    } catch (error: any) {
      // MiniKit not available - not running in World App
      setError("Please open this app in World App to verify your identity and join the brotherhood.")
      setIsWorldApp(false)
      return
    }

    if (!isInstalled) {
      setError("Please open this app in World App to verify your identity and join the brotherhood.")
      setIsWorldApp(false)
      return
    }

    setIsVerifying(true)
    setError(null)

    try {
      // Prepare verification payload
      const verifyPayload: VerifyCommandInput = {
        action: ACTION_ID,
        verification_level: VerificationLevel.Orb, // Use Orb for highest security
      }

      // Trigger verification - World App will show a drawer
      const { finalPayload } = await MiniKit.commandsAsync.verify(verifyPayload)

      // Check if user cancelled or there was an error
      if (finalPayload.status === 'error') {
        // Check if error is because user already verified
        // For demo purposes, treat "already verified" as success
        const errorDetail = finalPayload.detail || ''
        if (errorDetail.toLowerCase().includes('already verified') || 
            errorDetail.toLowerCase().includes('nullifier')) {
          // User already verified - for demo, show as success and redirect
          // This allows the verification flow to be shown again for presentations
          router.push('/dashboard')
          return
        }
        
        setError(finalPayload.detail || 'Verification was cancelled or failed. Please try again.')
        setIsVerifying(false)
        return
      }

      // Verification successful - now verify the proof on the backend
      const verifyResponse = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payload: finalPayload as ISuccessResult,
          action: ACTION_ID,
        }),
      })

      const verifyResponseJson = await verifyResponse.json()

      if (verifyResponseJson.status === 200) {
        // Verification successful - redirect to dashboard
        router.push('/dashboard')
      } else {
        // Check if backend says already verified
        // For demo purposes, treat "already verified" as success
        const errorMsg = verifyResponseJson.message || ''
        if (errorMsg.toLowerCase().includes('already verified') || 
            verifyResponseJson.verifyRes?.detail?.toLowerCase().includes('already verified')) {
          // User already verified - for demo, show as success and redirect
          router.push('/dashboard')
        } else {
          // Backend verification failed for other reason
          setError(verifyResponseJson.message || 'Verification failed. Please try again.')
          setIsVerifying(false)
        }
      }
    } catch (error: any) {
      console.error('Verification error:', error)
      // Check if error message indicates already verified
      // For demo purposes, treat "already verified" as success
      const errorMsg = error.message || ''
      if (errorMsg.toLowerCase().includes('already verified') || 
          errorMsg.toLowerCase().includes('nullifier')) {
        // User already verified - for demo, show as success and redirect
        router.push('/dashboard')
      } else {
        setError(error.message || 'An error occurred during verification. Please try again.')
        setIsVerifying(false)
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md mx-auto flex flex-col items-center text-center space-y-6">
        <div className="relative w-40 h-60">
          <Image
            src="/images/manhood-book.jpg"
            alt="Manhood by Steve Biddulph"
            fill
            sizes="160px"
            className="object-contain rounded-lg shadow-lg"
          />
        </div>

        <div className="space-y-2">
          <p className="text-2xl font-semibold tracking-tight text-foreground leading-relaxed text-balance">
            Men Supporting Men
          </p>
        </div>

        <div className="w-full pt-2 space-y-3">
          <Button 
            onClick={handleJoinBrotherhood}
            disabled={isVerifying}
            size="lg" 
            className="w-full h-14 text-base font-medium"
          >
            {isVerifying ? "Verifying..." : "Join the Brotherhood"}
          </Button>

          {/* Error message */}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Info message if not in World App */}
          {isWorldApp === false && !error && (
            <p className="text-xs text-muted-foreground">
              Open this app in World App to verify your identity
            </p>
          )}
        </div>

        <p className="text-sm text-muted-foreground pt-2">
          Inspired by Steve Biddulph's <span className="italic">Manhood</span>
        </p>
      </div>
    </div>
  )
}
