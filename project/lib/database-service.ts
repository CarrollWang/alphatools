import { Hex } from 'viem'
import { DatabaseService, WalletMonitorConfig } from './database'

// In-memory fallback implementation for development
// TODO: Replace with actual database implementation (PostgreSQL/MongoDB)
class InMemoryDatabaseService implements DatabaseService {
  private walletMonitors: WalletMonitorConfig[] = []
  private idCounter = 1

  async createWalletMonitor(config: Omit<WalletMonitorConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<WalletMonitorConfig> {
    const newConfig: WalletMonitorConfig = {
      ...config,
      id: this.idCounter.toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.idCounter++
    this.walletMonitors.push(newConfig)
    return newConfig
  }

  async getWalletMonitors(): Promise<WalletMonitorConfig[]> {
    return [...this.walletMonitors]
  }

  async getWalletMonitorById(id: string): Promise<WalletMonitorConfig | null> {
    return this.walletMonitors.find(config => config.id === id) || null
  }

  async updateWalletMonitor(id: string, updates: Partial<WalletMonitorConfig>): Promise<WalletMonitorConfig> {
    const index = this.walletMonitors.findIndex(config => config.id === id)
    if (index === -1) {
      throw new Error(`Wallet monitor with id ${id} not found`)
    }
    
    this.walletMonitors[index] = {
      ...this.walletMonitors[index],
      ...updates,
      updatedAt: new Date(),
    }
    
    return this.walletMonitors[index]
  }

  async deleteWalletMonitor(id: string): Promise<boolean> {
    const index = this.walletMonitors.findIndex(config => config.id === id)
    if (index === -1) {
      return false
    }
    
    this.walletMonitors.splice(index, 1)
    return true
  }

  async checkDuplicateWalletMonitor(walletAddress: Hex, email: string): Promise<WalletMonitorConfig | null> {
    return this.walletMonitors.find(
      config => config.walletAddress.toLowerCase() === walletAddress.toLowerCase() && 
               config.email.toLowerCase() === email.toLowerCase()
    ) || null
  }
}

// Singleton instance
let databaseService: DatabaseService

export function getDatabaseService(): DatabaseService {
  if (!databaseService) {
    // TODO: Implement actual database service based on DATABASE_URL
    // For now, use in-memory fallback
    console.warn('Using in-memory database service. This should be replaced with a real database in production.')
    databaseService = new InMemoryDatabaseService()
  }
  return databaseService
}

export { type DatabaseService, type WalletMonitorConfig }