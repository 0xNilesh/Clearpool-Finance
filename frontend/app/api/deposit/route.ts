import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userAddress, vaultAddress, amount, shares, transactionHash, blockNumber, timestamp } = body

    // Validate required fields
    if (!userAddress || !vaultAddress || !amount || !shares || !transactionHash) {
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

    const now = timestamp || new Date()

    // Create deposit order
    const depositOrder = {
      orderId: new ObjectId(),
      type: 'deposit',
      amount: parseFloat(amount),
      shares: parseFloat(shares),
      transactionHash,
      blockNumber: blockNumber || null,
      timestamp: now,
    }

    if (existingPosition) {
      // Update existing position - weighted average cost basis
      const updatedOrders = [...(existingPosition.orders || []), depositOrder]
      
      // Add new shares and invested amount (weighted average happens automatically)
      const currentShares = existingPosition.totalShares || 0
      const currentInvestedValue = existingPosition.totalInvestedValue || 0
      const newShares = parseFloat(shares)
      const newInvestedValue = parseFloat(amount)
      
      const totalShares = currentShares + newShares
      const totalInvestedValue = currentInvestedValue + newInvestedValue
      // Average cost per share = totalInvestedValue / totalShares (calculated automatically)

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
        message: 'Deposit logged successfully',
        position: {
          totalShares,
          totalInvestedValue,
          orderCount: updatedOrders.length,
        },
      })
    } else {
      // Create new position
      const newPosition = {
        userAddress: userAddress.toLowerCase(),
        vaultAddress: vaultAddress.toLowerCase(),
        orders: [depositOrder],
        totalShares: parseFloat(shares),
        totalInvestedValue: parseFloat(amount),
        createdAt: now,
        updatedAt: now,
      }

      await collection.insertOne(newPosition)

      return NextResponse.json({
        success: true,
        message: 'Deposit logged successfully',
        position: {
          totalShares: parseFloat(shares),
          totalInvestedValue: parseFloat(amount),
          orderCount: 1,
        },
      })
    }
  } catch (error: any) {
    console.error('Error logging deposit:', error)
    return NextResponse.json(
      { error: 'Failed to log deposit', details: error.message },
      { status: 500 }
    )
  }
}
