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

    // Calculate new totals - share market logic
    const updatedOrders = [...(existingPosition.orders || []), redeemOrder]
    const totalShares = currentShares - sharesToRedeem
    
    // Share market logic: When you sell shares, you keep the same average cost per share
    // So we reduce invested value proportionally to maintain the average cost basis
    const currentInvestedValue = existingPosition.totalInvestedValue || 0
    let totalInvestedValue = currentInvestedValue
    
    // Calculate average cost per share before redemption
    if (currentShares > 0 && currentInvestedValue > 0) {
      const averageCostPerShare = currentInvestedValue / currentShares
      
      // Reduce invested value by the proportion of shares redeemed
      // This maintains the same average cost per share for remaining shares
      const investedValueRedeemed = sharesToRedeem * averageCostPerShare
      totalInvestedValue = currentInvestedValue - investedValueRedeemed
      
      // Ensure it doesn't go negative
      if (totalInvestedValue < 0) {
        totalInvestedValue = 0
      }
      
      // If all shares are redeemed, invested value should be 0
      if (totalShares <= 0) {
        totalInvestedValue = 0
      }
    } else {
      // If no shares or no invested value, set to 0
      totalInvestedValue = 0
    }

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
