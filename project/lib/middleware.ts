import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { config } from '@/configs'

interface RateLimitEntry {
  count: number
  resetTime: number
}

// 简单的内存速率限制器（生产环境应使用 Redis）
const rateLimitMap = new Map<string, RateLimitEntry>()

export function createRateLimiter(windowMs: number = 60000, maxRequests: number = 100) {
  return (identifier: string): boolean => {
    const now = Date.now()
    const entry = rateLimitMap.get(identifier)

    // 清理过期的条目
    if (entry && now > entry.resetTime) {
      rateLimitMap.delete(identifier)
    }

    const currentEntry = rateLimitMap.get(identifier)
    
    if (!currentEntry) {
      // 首次访问
      rateLimitMap.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      })
      return true
    }

    if (currentEntry.count >= maxRequests) {
      return false // 超过限制
    }

    // 更新计数
    currentEntry.count++
    return true
  }
}

// JWT 验证
export function verifyToken(token: string): { userId?: string; error?: string } {
  try {
    if (!config.security.jwtSecret) {
      return { error: 'JWT secret not configured' }
    }
    
    const decoded = jwt.verify(token, config.security.jwtSecret) as any
    return { userId: decoded.userId }
  } catch (error) {
    return { error: 'Invalid token' }
  }
}

// 生成 JWT Token
export function generateToken(userId: string, expiresIn: string = '24h'): string {
  if (!config.security.jwtSecret) {
    throw new Error('JWT secret not configured')
  }
  
  return jwt.sign({ userId }, config.security.jwtSecret, { expiresIn })
}

// 获取客户端标识符
export function getClientIdentifier(request: NextRequest): string {
  // 优先使用 X-Forwarded-For，然后使用 IP
  const forwardedFor = request.headers.get('x-forwarded-for')
  const ip = forwardedFor?.split(',')[0]?.trim() || 
            request.headers.get('x-real-ip') || 
            request.ip || 
            'unknown'
  
  // 如果有用户认证，使用 user ID；否则使用 IP
  const authorization = request.headers.get('authorization')
  if (authorization?.startsWith('Bearer ')) {
    const token = authorization.slice(7)
    const { userId } = verifyToken(token)
    if (userId) {
      return `user:${userId}`
    }
  }
  
  return `ip:${ip}`
}

// API 保护中间件
export function withApiProtection(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean
    rateLimit?: { windowMs: number; maxRequests: number }
  } = {}
) {
  const rateLimiter = options.rateLimit 
    ? createRateLimiter(options.rateLimit.windowMs, options.rateLimit.maxRequests)
    : null

  return async (request: NextRequest, context?: any) => {
    try {
      // 速率限制检查
      if (rateLimiter) {
        const clientId = getClientIdentifier(request)
        if (!rateLimiter(clientId)) {
          return NextResponse.json(
            { error: 'Rate limit exceeded' },
            { 
              status: 429,
              headers: {
                'Retry-After': '60',
                'X-RateLimit-Limit': options.rateLimit!.maxRequests.toString(),
                'X-RateLimit-Remaining': '0',
              }
            }
          )
        }
      }

      // 身份验证检查
      if (options.requireAuth) {
        const authorization = request.headers.get('authorization')
        
        if (!authorization?.startsWith('Bearer ')) {
          return NextResponse.json(
            { error: 'Missing or invalid authorization header' },
            { status: 401 }
          )
        }

        const token = authorization.slice(7)
        const { userId, error } = verifyToken(token)
        
        if (error || !userId) {
          return NextResponse.json(
            { error: 'Invalid or expired token' },
            { status: 401 }
          )
        }

        // 将用户信息添加到请求上下文
        const contextWithUser = { ...context, userId }
        return handler(request, contextWithUser)
      }

      return handler(request, context)
    } catch (error) {
      console.error('API protection middleware error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// CORS 中间件
export function withCors(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  options: {
    origin?: string | string[]
    methods?: string[]
    headers?: string[]
  } = {}
) {
  return async (request: NextRequest, context?: any) => {
    const origin = request.headers.get('origin')
    const allowedOrigins = Array.isArray(options.origin) ? options.origin : [options.origin || '*']
    const allowedMethods = options.methods || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    const allowedHeaders = options.headers || ['Content-Type', 'Authorization']

    // 预检请求
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': allowedOrigins.includes('*') || allowedOrigins.includes(origin || '') ? origin || '*' : 'null',
          'Access-Control-Allow-Methods': allowedMethods.join(', '),
          'Access-Control-Allow-Headers': allowedHeaders.join(', '),
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    const response = await handler(request, context)
    
    // 添加 CORS 头部
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin || '')) {
      response.headers.set('Access-Control-Allow-Origin', origin || '*')
    }
    response.headers.set('Access-Control-Allow-Methods', allowedMethods.join(', '))
    response.headers.set('Access-Control-Allow-Headers', allowedHeaders.join(', '))
    
    return response
  }
}