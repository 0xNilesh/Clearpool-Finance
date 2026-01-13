import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function GET(
  request: NextRequest,
  { params }: { params: { vaultAddress: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.get('userAddress')

    if (!userAddress) {
      return NextResponse.json(
        { error: 'userAddress query parameter is required' },
        { status: 400 }
      )
    }

    const vaultAddress = params.vaultAddress
    const db = await getDb()
    const collection = db.collection('user_vault_positions')

    const position = await collection.findOne({
      userAddress: userAddress.toLowerCase(),
      vaultAddress: vaultAddress.toLowerCase(),
    })

    if (!position) {
      return NextResponse.json({
        success: true,
        position: null,
        message: 'No position found',
      })
    }

    // Remove MongoDB _id from response
    const { _id, ...positionData } = position

    return NextResponse.json({
      success: true,
      position: positionData,
    })
  } catch (error: any) {
    console.error('Error fetching position:', error)
    return NextResponse.json(
      { error: 'Failed to fetch position', details: error.message },
      { status: 500 }
    )
  }
}
