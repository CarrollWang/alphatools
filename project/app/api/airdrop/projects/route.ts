import { NextResponse } from 'next/server'
import type { AirdropProject } from '@/types'

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
    startTime: Date.now() - 7 * 24 * 60 * 60 * 1000,
    endTime: Date.now() + 7 * 24 * 60 * 60 * 1000,
    claimStartTime: Date.now() - 2 * 24 * 60 * 60 * 1000,
    claimEndTime: Date.now() + 2 * 24 * 60 * 60 * 1000,
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

export async function GET() {
  try {
    // 在实际应用中，这里应该调用币安的API或从数据库获取数据
    return NextResponse.json(mockProjects)
  } catch (error) {
    console.error('Error fetching airdrop projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch airdrop projects' },
      { status: 500 }
    )
  }
}