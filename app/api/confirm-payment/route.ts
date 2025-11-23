/**
 * Payment confirmation API route
 * Verifies the payment transaction on-chain
 */

import { NextRequest, NextResponse } from 'next/server'
import { MiniAppPaymentSuccessPayload } from '@worldcoin/minikit-js'

export const runtime = 'nodejs'
export const maxDuration = 30

interface IRequestPayload {
  payload: MiniAppPaymentSuccessPayload
}

export async function POST(req: NextRequest) {
  try {
    const requestData = await req.json()
    const payload = requestData.payload || requestData // Support both formats

    // Validate payload structure
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid request: missing payload', success: false },
        { status: 400 }
      )
    }

    if (!payload.transaction_id) {
      console.error('Payment payload missing transaction_id:', payload)
      return NextResponse.json(
        { error: 'Invalid payment payload: missing transaction_id', success: false },
        { status: 400 }
      )
    }

    // Get environment variables
    const app_id = process.env.APP_ID as `app_${string}`
    const dev_portal_api_key = process.env.DEV_PORTAL_API_KEY

    if (!app_id) {
      return NextResponse.json(
        { error: 'APP_ID not configured', success: false },
        { status: 500 }
      )
    }

    if (!dev_portal_api_key) {
      return NextResponse.json(
        { error: 'DEV_PORTAL_API_KEY not configured', success: false },
        { status: 500 }
      )
    }

    // IMPORTANT: In production, fetch the reference from your database
    // to ensure the transaction we are verifying is the same one we initiated
    // For now, we'll verify using the transaction_id from the payload

    // Verify the payment via Developer Portal API
    const response = await fetch(
      `https://developer.worldcoin.org/api/v2/minikit/transaction/${payload.transaction_id}?app_id=${app_id}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${dev_portal_api_key}`,
        },
      }
    )

    if (!response.ok) {
      console.error('Payment verification failed:', response.status, await response.text())
      return NextResponse.json(
        { error: 'Payment verification failed', success: false },
        { status: 400 }
      )
    }

    const transaction = await response.json()

    // Check if transaction matches and is successful
    // We optimistically confirm if status is not 'failed'
    // You can also poll until status == 'mined' for more certainty
    if (transaction.reference === payload.reference && transaction.status !== 'failed') {
      return NextResponse.json({ success: true, transaction })
    } else {
      return NextResponse.json(
        { error: 'Transaction verification failed', success: false, transaction },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Payment confirmation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to confirm payment', success: false },
      { status: 500 }
    )
  }
}

