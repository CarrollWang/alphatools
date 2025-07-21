import { createHmac, timingSafeEqual } from 'crypto'
import { config } from '@/configs'

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret?: string
): boolean {
  try {
    const webhookSecret = secret || config.security.webhookSecret
    
    if (!webhookSecret) {
      console.error('Webhook secret not configured')
      return false
    }

    // 支持多种签名格式
    let expectedSignature: string
    
    if (signature.startsWith('sha256=')) {
      // GitHub/类似格式: sha256=<hash>
      const hash = signature.split('=')[1]
      expectedSignature = createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex')
      
      return timingSafeEqual(
        Buffer.from(hash, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      )
    } else {
      // 简单 HMAC-SHA256 格式
      expectedSignature = createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex')
      
      return timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      )
    }
  } catch (error) {
    console.error('Error verifying webhook signature:', error)
    return false
  }
}

export function generateWebhookSignature(payload: string, secret?: string): string {
  const webhookSecret = secret || config.security.webhookSecret
  
  if (!webhookSecret) {
    throw new Error('Webhook secret not configured')
  }

  return createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex')
}

// 验证时间戳防止重放攻击
export function verifyWebhookTimestamp(
  timestamp: string | number,
  toleranceSeconds: number = 300 // 5分钟容差
): boolean {
  try {
    const webhookTime = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp
    const currentTime = Math.floor(Date.now() / 1000)
    
    return Math.abs(currentTime - webhookTime) <= toleranceSeconds
  } catch (error) {
    console.error('Error verifying webhook timestamp:', error)
    return false
  }
}