// 访问控制和权限管理
import crypto from 'crypto'

interface UserPermissions {
  userId: string
  permissions: string[]
  apiQuota: number
  usedQuota: number
  lastReset: number
  isActive: boolean
}

interface RateLimitRule {
  endpoint: string
  windowMs: number
  maxRequests: number
  userLevel: string
}

export class AccessControlManager {
  private userPermissions = new Map<string, UserPermissions>()
  private rateLimitRules: RateLimitRule[] = []
  private requestLog = new Map<string, number[]>()

  constructor() {
    this.initializeRateLimitRules()
  }

  private initializeRateLimitRules() {
    // 定义不同用户级别的限流规则
    this.rateLimitRules = [
      {
        endpoint: '/api/wallet-monitor',
        windowMs: 60 * 1000, // 1分钟
        maxRequests: 10,
        userLevel: 'basic',
      },
      {
        endpoint: '/api/wallet-monitor',
        windowMs: 60 * 1000,
        maxRequests: 50,
        userLevel: 'premium',
      },
      {
        endpoint: '/api/wallet-monitor/webhook',
        windowMs: 60 * 1000,
        maxRequests: 100,
        userLevel: 'basic',
      },
      {
        endpoint: '/api/transactions',
        windowMs: 60 * 1000,
        maxRequests: 20,
        userLevel: 'basic',
      },
      {
        endpoint: '/api/transactions',
        windowMs: 60 * 1000,
        maxRequests: 100,
        userLevel: 'premium',
      },
    ]
  }

  // 生成 API 令牌
  generateAPIToken(userId: string): string {
    const timestamp = Date.now()
    const payload = { userId, timestamp }
    const secret = process.env.JWT_SECRET || 'default-secret'
    
    const token = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex')
    
    return `${Buffer.from(JSON.stringify(payload)).toString('base64')}.${token}`
  }

  // 验证 API 令牌
  verifyAPIToken(token: string): { userId: string; timestamp: number } | null {
    try {
      const [payloadStr, signature] = token.split('.')
      const payload = JSON.parse(Buffer.from(payloadStr, 'base64').toString())
      
      const secret = process.env.JWT_SECRET || 'default-secret'
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex')
      
      if (signature !== expectedSignature) {
        return null
      }
      
      // 检查令牌是否过期 (24小时)
      const tokenAge = Date.now() - payload.timestamp
      if (tokenAge > 24 * 60 * 60 * 1000) {
        return null
      }
      
      return payload
    } catch (error) {
      console.error('Token verification failed:', error)
      return null
    }
  }

  // 创建用户权限
  createUser(userId: string, permissions: string[] = [], apiQuota: number = 1000): boolean {
    if (this.userPermissions.has(userId)) {
      return false
    }

    this.userPermissions.set(userId, {
      userId,
      permissions: [...permissions, 'basic_access'],
      apiQuota,
      usedQuota: 0,
      lastReset: Date.now(),
      isActive: true,
    })

    console.log(`User created: ${userId} with quota: ${apiQuota}`)
    return true
  }

  // 检查用户权限
  hasPermission(userId: string, permission: string): boolean {
    const user = this.userPermissions.get(userId)
    if (!user || !user.isActive) {
      return false
    }

    return user.permissions.includes(permission) || user.permissions.includes('admin')
  }

  // 检查 API 配额
  checkAPIQuota(userId: string): boolean {
    const user = this.userPermissions.get(userId)
    if (!user || !user.isActive) {
      return false
    }

    // 重置每日配额
    const now = Date.now()
    const daysSinceReset = (now - user.lastReset) / (24 * 60 * 60 * 1000)
    
    if (daysSinceReset >= 1) {
      user.usedQuota = 0
      user.lastReset = now
    }

    return user.usedQuota < user.apiQuota
  }

  // 消费 API 配额
  consumeAPIQuota(userId: string, amount: number = 1): boolean {
    const user = this.userPermissions.get(userId)
    if (!user || !user.isActive) {
      return false
    }

    if (user.usedQuota + amount > user.apiQuota) {
      return false
    }

    user.usedQuota += amount
    return true
  }

  // 检查限流
  checkRateLimit(userId: string, endpoint: string, userLevel: string = 'basic'): boolean {
    const rule = this.rateLimitRules.find(r => 
      r.endpoint === endpoint && r.userLevel === userLevel
    )
    
    if (!rule) {
      return true // 没有规则则允许
    }

    const key = `${userId}:${endpoint}`
    const now = Date.now()
    const windowStart = now - rule.windowMs
    
    // 获取当前窗口内的请求记录
    let requests = this.requestLog.get(key) || []
    requests = requests.filter(time => time > windowStart)
    
    if (requests.length >= rule.maxRequests) {
      return false
    }
    
    // 记录此次请求
    requests.push(now)
    this.requestLog.set(key, requests)
    
    return true
  }

  // 获取用户信息
  getUserInfo(userId: string) {
    const user = this.userPermissions.get(userId)
    if (!user) {
      return null
    }

    return {
      userId: user.userId,
      permissions: user.permissions,
      apiQuota: user.apiQuota,
      usedQuota: user.usedQuota,
      remainingQuota: user.apiQuota - user.usedQuota,
      isActive: user.isActive,
      lastReset: new Date(user.lastReset).toISOString(),
    }
  }

  // 更新用户权限
  updateUserPermissions(userId: string, permissions: string[]): boolean {
    const user = this.userPermissions.get(userId)
    if (!user) {
      return false
    }

    user.permissions = permissions
    console.log(`User permissions updated: ${userId}`)
    return true
  }

  // 禁用用户
  deactivateUser(userId: string): boolean {
    const user = this.userPermissions.get(userId)
    if (!user) {
      return false
    }

    user.isActive = false
    console.log(`User deactivated: ${userId}`)
    return true
  }

  // 激活用户
  activateUser(userId: string): boolean {
    const user = this.userPermissions.get(userId)
    if (!user) {
      return false
    }

    user.isActive = true
    console.log(`User activated: ${userId}`)
    return true
  }

  // 清理过期的请求记录
  cleanupRequestLog() {
    const now = Date.now()
    const maxAge = 60 * 60 * 1000 // 1小时

    this.requestLog.forEach((requests, key) => {
      const filteredRequests = requests.filter(time => now - time < maxAge)
      if (filteredRequests.length === 0) {
        this.requestLog.delete(key)
      } else {
        this.requestLog.set(key, filteredRequests)
      }
    })
  }

  // 获取系统统计信息
  getSystemStats() {
    const users = Array.from(this.userPermissions.values())
    const activeUsers = users.filter(u => u.isActive)
    const totalQuotaUsed = users.reduce((sum, u) => sum + u.usedQuota, 0)
    const totalQuotaAllocated = users.reduce((sum, u) => sum + u.apiQuota, 0)

    return {
      totalUsers: users.length,
      activeUsers: activeUsers.length,
      totalQuotaUsed,
      totalQuotaAllocated,
      quotaUtilization: totalQuotaAllocated > 0 ? (totalQuotaUsed / totalQuotaAllocated) * 100 : 0,
      rateLimitRules: this.rateLimitRules.length,
    }
  }
}

export const accessControlManager = new AccessControlManager()

// 定期清理请求日志
setInterval(() => {
  accessControlManager.cleanupRequestLog()
}, 60 * 60 * 1000) // 每小时清理一次