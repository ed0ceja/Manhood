/**
 * Verification API route for World ID proof verification
 * This must be done server-side for security
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyCloudProof, IVerifyResponse, ISuccessResult } from '@worldcoin/minikit-js'

export const runtime = 'nodejs'
export const maxDuration = 30

interface IRequestPayload {
  payload: ISuccessResult
  action: string
  signal?: string
}

export async function POST(req: NextRequest) {
  try {
    const { payload, action, signal } = (await req.json()) as IRequestPayload

    // Get APP_ID from environment variables
    const app_id = process.env.APP_ID as `app_${string}`
    
    if (!app_id) {
      console.error('APP_ID is not set in environment variables')
      return NextResponse.json(
        { error: 'Server configuration error: APP_ID not set', status: 500 },
        { status: 500 }
      )
    }

    // Validate payload structure
    if (!payload || !payload.proof || !action) {
      return NextResponse.json(
        { error: 'Invalid request: missing required fields', status: 400 },
        { status: 400 }
      )
    }

    // Verify the proof using World ID's verification service
    const verifyRes = (await verifyCloudProof(payload, app_id, action, signal)) as IVerifyResponse

    if (verifyRes.success) {
      // Verification successful - this is where you could:
      // - Store verification status in database
      // - Create user session
      // - Grant access to protected features
      return NextResponse.json({ 
        verifyRes, 
        status: 200,
        message: 'Verification successful'
      })
    } else {
      // Verification failed - common reasons:
      // - User already verified (nullifier already used)
      // - Invalid proof
      // - Action mismatch
      console.error('Verification failed:', verifyRes)
      return NextResponse.json(
        { 
          verifyRes, 
          status: 400,
          message: verifyRes.detail || 'Verification failed'
        },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Verification API error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error during verification',
        status: 500
      },
      { status: 500 }
    )
  }
}

