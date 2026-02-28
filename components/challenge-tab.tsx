"use client"

import { useEffect, useState } from "react"
import { Button } from "./ui/button"

interface Challenge {
  id: string
  challenge_text: string
  source_passage: string
  challenge_date: string
}

export function ChallengeTab() {
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [completionCount, setCompletionCount] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [nullifier, setNullifier] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('nullifier')
    setNullifier(stored)
    fetchChallenge(stored)
  }, [])

  const fetchChallenge = async (nullifierHash: string | null) => {
    try {
      const params = nullifierHash ? `?nullifier=${nullifierHash}` : ''
      const res = await fetch(`/api/challenge${params}`)
      const data = await res.json()
      setChallenge(data.challenge)
      setCompletionCount(data.completion_count ?? 0)
      setCompleted(data.completed ?? false)
    } catch (error) {
      console.error('Failed to fetch challenge:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async () => {
    if (!challenge || !nullifier || completing || completed) return
    setCompleting(true)
    try {
      const res = await fetch('/api/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nullifier, challenge_id: challenge.id }),
      })
      const data = await res.json()
      if (data.success) {
        setCompleted(true)
        setCompletionCount(data.completion_count)
      }
    } catch (error) {
      console.error('Failed to complete challenge:', error)
    } finally {
      setCompleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">Loading today's challenge...</p>
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="flex items-center justify-center h-full px-6">
        <div className="text-center space-y-2">
          <p className="text-2xl">🌅</p>
          <p className="font-semibold">No challenge yet today</p>
          <p className="text-sm text-muted-foreground">Check back soon — a new challenge drops every day.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full p-5 space-y-6">

      {/* Date */}
      <p className="text-xs text-muted-foreground uppercase tracking-widest">
        {new Date(challenge.challenge_date + 'T00:00:00').toLocaleDateString('en-US', {
          weekday: 'long', month: 'long', day: 'numeric'
        })}
      </p>

      {/* Challenge */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Today's Challenge</p>
        <p className="text-xl font-semibold leading-snug">{challenge.challenge_text}</p>
      </div>

      {/* Source passage */}
      {challenge.source_passage && (
        <div className="border-l-2 border-border pl-4">
          <p className="text-sm text-muted-foreground italic">"{challenge.source_passage}"</p>
          <p className="text-xs text-muted-foreground mt-1">— Steve Biddulph, Manhood</p>
        </div>
      )}

      {/* Completion count */}
      <div className="flex items-center gap-2">
        <span className="text-lg">👥</span>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{completionCount}</span>{' '}
          {completionCount === 1 ? 'man has' : 'men have'} completed this today
        </p>
      </div>

      {/* Action button */}
      <div className="pt-2">
        {completed ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-muted">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-sm">Challenge complete</p>
              <p className="text-xs text-muted-foreground">Well done. See you tomorrow.</p>
            </div>
          </div>
        ) : (
          <Button
            onClick={handleComplete}
            disabled={completing || !nullifier}
            className="w-full h-12 text-base font-medium"
          >
            {completing ? 'Marking complete...' : 'Mark as Complete'}
          </Button>
        )}
        {!nullifier && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Verify your identity to track your progress
          </p>
        )}
      </div>
    </div>
  )
}
