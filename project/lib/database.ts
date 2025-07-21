import { Hex } from 'viem'

export interface WalletMonitorConfig {
  id: string
  walletAddress: Hex
  email: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface DatabaseService {
  // Wallet Monitor operations
  createWalletMonitor(config: Omit<WalletMonitorConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<WalletMonitorConfig>
  getWalletMonitors(): Promise<WalletMonitorConfig[]>
  getWalletMonitorById(id: string): Promise<WalletMonitorConfig | null>
  updateWalletMonitor(id: string, updates: Partial<WalletMonitorConfig>): Promise<WalletMonitorConfig>
  deleteWalletMonitor(id: string): Promise<boolean>
  
  // Check for duplicates
  checkDuplicateWalletMonitor(walletAddress: Hex, email: string): Promise<WalletMonitorConfig | null>
}