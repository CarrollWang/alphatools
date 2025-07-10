import type { Hex } from 'viem'
import { NextResponse } from 'next/server'
import type { AirdropProject, UserAirdropInfo, AlphaPointsInfo } from '@/types'

// 模拟数据 - 在实际项目中应该从币安API或数据库获取
const mockProjects: AirdropProject[] = [
  {
    id: 'cross-token',
    name: 'Cross Token',
    symbol: 'CROSS',
    description: 'Cross Chain Infrastructure Protocol enabling seamless multi-chain operations',
    iconUrl: '/images/cross-token.png',
    totalSupply: '1000000000',
    airdropAmount: '50000000',
    requiredPoints: 140,
    startTime: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7天前开始
    endTime: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7天后结束
    claimStartTime: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2天前开始领取
    claimEndTime: Date.now() + 2 * 24 * 60 * 60 * 1000, // 2天后结束领取
    status: 'claiming',
    participantCount: 85432,
    maxParticipants: 100000,
    website: 'https://cross-protocol.io',
    twitter: 'https://twitter.com/cross_protocol'
  },
  {
    id: 'infinity-ground',
    name: 'Infinity Ground',
    symbol: 'AIN',
    description: 'Next-generation AI-powered DeFi platform with advanced yield farming strategies',
    iconUrl: '/images/infinity-ground.png',
    totalSupply: '500000000',
    airdropAmount: '25000000',
    requiredPoints: 200,
    startTime: Date.now() - 5 * 24 * 60 * 60 * 1000,
    endTime: Date.now() + 10 * 24 * 60 * 60 * 1000,
    claimStartTime: Date.now() + 5 * 24 * 60 * 60 * 1000,
    claimEndTime: Date.now() + 7 * 24 * 60 * 60 * 1000,
    status: 'active',
    participantCount: 62145,
    maxParticipants: 80000,
    website: 'https://infinity-ground.io',
    twitter: 'https://twitter.com/infinity_ground'
  },
  {
    id: 'giant-protocol',
    name: 'Giant Protocol',
    symbol: 'GIANT',
    description: 'Decentralized infrastructure protocol for large-scale blockchain applications',
    iconUrl: '/images/giant-protocol.png',
    totalSupply: '2000000000',
    airdropAmount: '100000000',
    requiredPoints: 300,
    startTime: Date.now() + 3 * 24 * 60 * 60 * 1000,
    endTime: Date.now() + 20 * 24 * 60 * 60 * 1000,
    claimStartTime: Date.now() + 15 * 24 * 60 * 60 * 1000,
    claimEndTime: Date.now() + 17 * 24 * 60 * 60 * 1000,
    status: 'upcoming',
    participantCount: 0,
    maxParticipants: 150000,
    website: 'https://giant-protocol.com',
    twitter: 'https://twitter.com/giant_protocol'
  },
  {
    id: 'soon-token',
    name: 'Soon Token',
    symbol: 'SOON',
    description: 'Fast transaction processing network with ultra-low fees',
    iconUrl: '/images/soon-token.png',
    totalSupply: '10000000000',
    airdropAmount: '500000000',
    requiredPoints: 100,
    startTime: Date.now() - 30 * 24 * 60 * 60 * 1000,
    endTime: Date.now() - 15 * 24 * 60 * 60 * 1000,
    claimStartTime: Date.now() - 20 * 24 * 60 * 60 * 1000,
    claimEndTime: Date.now() - 18 * 24 * 60 * 60 * 1000,
    status: 'ended',
    participantCount: 245678,
    maxParticipants: 250000,
    website: 'https://soon-network.io',
    twitter: 'https://twitter.com/soon_network'
  }
]

// 模拟用户空投信息
function getMockUserInfo(address: string): UserAirdropInfo[] {
  // 基于地址生成一致的随机数
  const seed = address.slice(2, 8)
  const random = parseInt(seed, 16) / 0xffffff
  
  return mockProjects.map(project => {
    const userRandom = (random + parseInt(project.id.slice(0, 2), 16) / 255) % 1
    const alphaPoints = Math.floor(userRandom * 500) + 50
    const isEligible = alphaPoints >= project.requiredPoints
    const hasClaimed = isEligible && userRandom > 0.7 && project.status === 'claiming'
    
    return {
      projectId: project.id,
      userAddress: address as Hex,
      alphaPoints,
      isEligible,
      hasClaimed,
      claimAmount: isEligible ? Math.floor(userRandom * 1000 + 100).toString() : undefined,
      claimTxHash: hasClaimed ? `0x${Math.random().toString(16).slice(2)}` as Hex : undefined,
      eligibilitySnapshot: isEligible ? {
        timestamp: Date.now() - 24 * 60 * 60 * 1000,
        points: alphaPoints,
        rank: Math.floor(userRandom * 10000) + 1
      } : undefined
    }
  })
}

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
    const userInfo = getMockUserInfo(address)
    const alphaPoints = getMockAlphaPoints(address)
    
    return NextResponse.json({
      projects: mockProjects,
      userInfo,
      alphaPoints
    })
  } catch (error) {
    console.error('Error fetching airdrop data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch airdrop data' },
      { status: 500 }
    )
  }
}