import { NextResponse } from 'next/server'
import type { Hex } from 'viem'
import crypto from 'crypto'

interface WebhookPayload {
  type: 'ADDRESS_ACTIVITY' | 'TOKEN_TRANSFER'
  timestamp: number
  [key: string]: any
}

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'default-secret'
const TIMESTAMP_TOLERANCE = 300 // 5分钟

function verifyWebhookSignature(
  payload: string,
  signature: string,
  timestamp: string
): boolean {
  try {
    // 验证时间戳，防止重放攻击
    const requestTime = parseInt(timestamp)
    const currentTime = Math.floor(Date.now() / 1000)
    
    if (Math.abs(currentTime - requestTime) > TIMESTAMP_TOLERANCE) {
      console.warn('Webhook timestamp too old or too new')
      return false
    }

    // 计算期望的签名
    const expectedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(`${timestamp}.${payload}`)
      .digest('hex')

    // 使用安全的比较方法防止时序攻击
    const providedSignature = signature.replace('sha256=', '')
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(providedSignature)
    )
  } catch (error) {
    console.error('Signature verification failed:', error)
    return false
  }
}

function validatePayload(payload: any): payload is WebhookPayload {
  return (
    payload &&
    typeof payload === 'object' &&
    ['ADDRESS_ACTIVITY', 'TOKEN_TRANSFER'].includes(payload.type) &&
    typeof payload.timestamp === 'number'
  )
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-signature')
    const timestamp = request.headers.get('x-timestamp')
    const userAgent = request.headers.get('user-agent')

    // 基本安全检查
    if (!signature || !timestamp) {
      console.warn('Missing security headers', { signature: !!signature, timestamp: !!timestamp })
      return NextResponse.json({ error: 'Missing security headers' }, { status: 401 })
    }

    // 验证来源
    const allowedUserAgents = ['Alchemy-Webhooks', 'Moralis-Webhooks', 'QuickNode-Webhooks']
    if (userAgent && !allowedUserAgents.some(ua => userAgent.includes(ua))) {
      console.warn(`Suspicious user agent: ${userAgent}`)
    }

    // 验证签名
    if (!verifyWebhookSignature(rawBody, signature, timestamp)) {
      console.warn('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload = JSON.parse(rawBody)
    
    // 验证载荷格式
    if (!validatePayload(payload)) {
      console.warn('Invalid payload format:', payload)
      return NextResponse.json({ error: 'Invalid payload format' }, { status: 400 })
    }

    // 记录请求信息用于审计
    console.log('Webhook received:', {
      type: payload.type,
      timestamp: payload.timestamp,
      userAgent,
      source: request.headers.get('x-forwarded-for') || 'unknown'
    })

    // 处理不同类型的区块链事件
    if (payload.type === 'ADDRESS_ACTIVITY') {
      await handleAddressActivity(payload)
    } else if (payload.type === 'TOKEN_TRANSFER') {
      await handleTokenTransfer(payload)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook 处理失败:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleAddressActivity(payload: any) {
  try {
    const { address, transaction } = payload
    
    if (!address || !transaction) {
      console.warn('Invalid address activity payload:', payload)
      return
    }

    console.log(`地址活动: ${address}`, transaction)
    
    // TODO: 实现真实的监控配置查询和邮件通知
    // 当前为演示版本，实际生产环境需要：
    // 1. 从数据库查询监控配置
    // 2. 调用邮件服务发送通知
    // 3. 记录通知历史
    
    return { success: true, message: 'Address activity processed' }
  } catch (error) {
    console.error('处理地址活动失败:', error)
    throw error
  }
}

async function handleTokenTransfer(payload: any) {
  try {
    const { from, to, value, token, hash } = payload
    
    if (!from || !to || !hash) {
      console.warn('Invalid token transfer payload:', payload)
      return
    }
    
    console.log(`代币转账: ${from} -> ${to}`, { value, token, hash })
    
    // TODO: 实现真实的转账监控逻辑
    // 当前为演示版本，实际生产环境需要：
    // 1. 检查是否有监控这些地址
    // 2. 发送相应的通知
    // 3. 更新监控统计
    
    return { success: true, message: 'Token transfer processed' }
  } catch (error) {
    console.error('处理代币转账失败:', error)
    throw error
  }
}

async function sendNotification(address: Hex, transaction: any) {
  try {
    console.log(`发送通知: ${address}`, transaction)
    
    // TODO: 集成真实的邮件服务
    // 当前为演示版本，实际生产环境需要：
    // 1. 调用邮件服务发送通知
    // 2. 处理发送失败的情况
    // 3. 记录通知状态
    
    return { success: true, message: 'Notification sent' }
  } catch (error) {
    console.error('发送通知失败:', error)
    throw error
  }
}