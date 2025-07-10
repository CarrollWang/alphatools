import type { Hex } from 'viem'
import { NextResponse } from 'next/server'
import type { AlphaPointsInfo } from '@/types'

// 模拟Alpha积分信息
function getMockAlphaPoints(address: string): AlphaPointsInfo {
  const seed = address.slice(2, 8)
  const random = parseInt(seed, 16) / 0xffffff
  
  const balancePoints = Math.floor(random * 300) + 50
  const volumePoints = Math.floor(random * 200) + 30
  const totalPoints = balancePoints + volumePoints
  const expiringPoints = Math.floor(random * 50)
  
  return {
    totalPoints,
    balancePoints,
    volumePoints,
    expiringPoints,
    lastUpdated: Date.now()
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get('address')

  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 })
  }

  try {
    // 在实际应用中，这里应该调用币安的API或从数据库获取数据
    const alphaPoints = getMockAlphaPoints(address)
    
    return NextResponse.json(alphaPoints)
  } catch (error) {
    console.error('Error fetching alpha points:', error)
    return NextResponse.json(
      { error: 'Failed to fetch alpha points' },
      { status: 500 }
    )
  }
}