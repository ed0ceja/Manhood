/**
 * Payment initiation API route
 * Creates a unique reference ID for the payment transaction
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    // Generate a unique reference ID for this payment
    const uuid = crypto.randomUUID().replace(/-/g, '')
    
    // TODO: Store the ID field in your database so you can verify the payment later
    // For now, we'll just return it. In production, store this in a database.
    
    return NextResponse.json({ id: uuid })
  } catch (error: any) {
    console.error('Payment initiation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to initiate payment', status: 500 },
      { status: 500 }
    )
  }
}

