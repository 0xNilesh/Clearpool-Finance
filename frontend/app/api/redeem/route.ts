import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userAddress, vaultAddress, shares, amount, transactionHash, blockNumber, timestamp } = body

    // Validate required fields
    if (!userAddress || !vaultAddress || !shares || !transactionHash) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const collection = db.collection('user_vault_positions')

    // Find existing user position for this vault
    const existingPosition = await collection.findOne({
      userAddress: userAddress.toLowerCase(),
      vaultAddress: vaultAddress.toLowerCase(),
    })

    if (!existingPosition) {
      return NextResponse.json(
        { error: 'No position found for this user and vault' },
        { status: 404 }
      )
    }

    const currentShares = existingPosition.totalShares || 0
    const sharesToRedeem = parseFloat(shares)

    // Validate sufficient shares
    if (sharesToRedeem > currentShares) {
      return NextResponse.json(
        { error: 'Insufficient shares to redeem' },
        { status: 400 }
      )
    }

    const now = timestamp || new Date()

    // Create redeem order
    const redeemOrder = {
      orderId: new ObjectId(),
      type: 'redeem',
      shares: sharesToRedeem,
      amount: amount ? parseFloat(amount) : null, // Amount received (may be null if not provided)
      transactionHash,
      blockNumber: blockNumber || null,
      timestamp: now,
    }

    // Calculate new totals
    const updatedOrders = [...(existingPosition.orders || []), redeemOrder]
    const totalShares = currentShares - sharesToRedeem
    // For invested value, we keep it the same (we don't reduce it on redeem)
    // Or we could calculate based on the amount received
    const totalInvestedValue = existingPosition.totalInvestedValue || 0

    await collection.updateOne(
      { _id: existingPosition._id },
      {
        $set: {
          orders: updatedOrders,
          totalShares,
          totalInvestedValue,
          updatedAt: now,
        },
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Redeem logged successfully',
      position: {
        totalShares,
        totalInvestedValue,
        orderCount: updatedOrders.length,
      },
    })
  } catch (error: any) {
    console.error('Error logging redeem:', error)
    return NextResponse.json(
      { error: 'Failed to log redeem', details: error.message },
      { status: 500 }
    )
  }
}
