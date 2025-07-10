import type { Hex } from 'viem'
import type { AirdropProject, UserAirdropInfo, AlphaPointsInfo } from '@/types'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

interface AirdropData {
  projects: AirdropProject[]
  userInfo: UserAirdropInfo[]
  alphaPoints: AlphaPointsInfo
}

export function useAirdrop(address?: Hex) {
  return useQuery<AirdropData>({
    queryKey: ['airdrop', address],
    queryFn: async () => {
      const { data } = await axios.get<AirdropData>('/api/airdrop', {
        params: { address },
      })
      return data
    },
    enabled: !!address,
    refetchInterval: 30000, // 30秒自动刷新
  })
}

export function useAirdropProjects() {
  return useQuery<AirdropProject[]>({
    queryKey: ['airdrop-projects'],
    queryFn: async () => {
      const { data } = await axios.get<AirdropProject[]>('/api/airdrop/projects')
      return data
    },
    refetchInterval: 60000, // 1分钟自动刷新
  })
}

export function useAlphaPoints(address?: Hex) {
  return useQuery<AlphaPointsInfo>({
    queryKey: ['alpha-points', address],
    queryFn: async () => {
      const { data } = await axios.get<AlphaPointsInfo>('/api/airdrop/points', {
        params: { address },
      })
      return data
    },
    enabled: !!address,
    refetchInterval: 30000, // 30秒自动刷新
  })
}