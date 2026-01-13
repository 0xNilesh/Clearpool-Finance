import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.get('userAddress')

    if (!userAddress) {
      return NextResponse.json(
        { error: 'userAddress query parameter is required' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const collection = db.collection('user_vault_positions')

    const positions = await collection
      .find({
        userAddress: userAddress.toLowerCase(),
      })
      .toArray()

    // Remove MongoDB _id from response
    const positionsData = positions.map(({ _id, ...position }) => position)

    return NextResponse.json({
      success: true,
      positions: positionsData,
      totalVaults: positionsData.length,
    })
  } catch (error: any) {
    console.error('Error fetching positions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch positions', details: error.message },
      { status: 500 }
    )
  }
}
