import { NextRequest, NextResponse } from 'next/server'
import type { Hex } from 'viem'
import { getDatabaseService } from '@/lib/database-service'
import { sendNotificationEmail } from '@/lib/email'
import { verifyWebhookSignature, verifyWebhookTimestamp } from '@/lib/webhook-security'
import { withApiProtection, withCors } from '@/lib/middleware'

const databaseService = getDatabaseService()

// Webhook 接收器，用于接收区块链事件通知
async function handleWebhook(request: NextRequest) {
  try {
    // 获取原始请求体用于签名验证
    const rawBody = await request.text()
    let payload: any
    
    try {
      payload = JSON.parse(rawBody)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }
    
    // 验证 Webhook 签名
    const signature = request.headers.get('x-signature') || 
                     request.headers.get('x-hub-signature-256') ||
                     request.headers.get('signature')
    
    if (!signature) {
      return NextResponse.json({ error: 'Missing webhook signature' }, { status: 401 })
    }

    const isValidSignature = verifyWebhookSignature(rawBody, signature)
    if (!isValidSignature) {
      console.warn('Invalid webhook signature received')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // 验证时间戳防止重放攻击
    const timestamp = request.headers.get('x-timestamp') || payload.timestamp
    if (timestamp && !verifyWebhookTimestamp(timestamp)) {
      return NextResponse.json({ error: 'Request too old' }, { status: 401 })
    }

    // 处理不同类型的区块链事件
    switch (payload.type) {
      case 'ADDRESS_ACTIVITY':
        await handleAddressActivity(payload)
        break
      case 'TOKEN_TRANSFER':
        await handleTokenTransfer(payload)
        break
      case 'TRANSACTION_CONFIRMED':
        await handleTransactionConfirmed(payload)
        break
      default:
        console.warn(`Unknown webhook event type: ${payload.type}`)
        return NextResponse.json({ error: 'Unknown event type' }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully',
      eventType: payload.type
    })
  } catch (error) {
    console.error('Webhook 处理失败:', error)
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

async function handleAddressActivity(payload: any) {
  try {
    const { address, transaction } = payload
    
    if (!address || !transaction) {
      console.error('Invalid ADDRESS_ACTIVITY payload:', payload)
      return
    }

    // 查找监控此地址的配置
    const configs = await databaseService.getWalletMonitors()
    const relevantConfigs = configs.filter(
      config => config.isActive && 
               config.walletAddress.toLowerCase() === address.toLowerCase()
    )

    if (relevantConfigs.length === 0) {
      console.log(`No active monitoring configs found for address: ${address}`)
      return
    }

    // 为每个监控配置发送通知
    for (const config of relevantConfigs) {
      await sendNotificationEmail(config.email, {
        hash: transaction.hash || 'N/A',
        from: transaction.from || 'N/A',
        to: transaction.to || address,
        value: transaction.value?.toString() || '0',
        token: transaction.tokenSymbol || 'ETH',
        timestamp: transaction.timestamp || new Date().toISOString(),
      })
    }

    console.log(`Processed ADDRESS_ACTIVITY for ${address}, sent ${relevantConfigs.length} notifications`)
  } catch (error) {
    console.error('Error handling ADDRESS_ACTIVITY:', error)
  }
}

async function handleTokenTransfer(payload: any) {
  try {
    const { from, to, value, token, hash, timestamp } = payload
    
    if (!from || !to) {
      console.error('Invalid TOKEN_TRANSFER payload:', payload)
      return
    }

    const configs = await databaseService.getWalletMonitors()
    const relevantAddresses = [from.toLowerCase(), to.toLowerCase()]
    
    const relevantConfigs = configs.filter(
      config => config.isActive && 
               relevantAddresses.includes(config.walletAddress.toLowerCase())
    )

    if (relevantConfigs.length === 0) {
      console.log(`No active monitoring configs found for addresses: ${relevantAddresses.join(', ')}`)
      return
    }

    // 为相关地址发送通知
    for (const config of relevantConfigs) {
      const isIncoming = config.walletAddress.toLowerCase() === to.toLowerCase()
      
      await sendNotificationEmail(config.email, {
        hash: hash || 'N/A',
        from,
        to,
        value: value?.toString() || '0',
        token: token?.symbol || 'Unknown',
        timestamp: timestamp || new Date().toISOString(),
      })
    }

    console.log(`Processed TOKEN_TRANSFER, sent ${relevantConfigs.length} notifications`)
  } catch (error) {
    console.error('Error handling TOKEN_TRANSFER:', error)
  }
}

async function handleTransactionConfirmed(payload: any) {
  try {
    const { transaction } = payload
    
    if (!transaction || !transaction.hash) {
      console.error('Invalid TRANSACTION_CONFIRMED payload:', payload)
      return
    }

    console.log(`Transaction confirmed: ${transaction.hash}`)
    
    // 可以在这里添加额外的确认逻辑
    // 比如更新数据库状态等
  } catch (error) {
    console.error('Error handling TRANSACTION_CONFIRMED:', error)
  }
}

// 应用中间件保护的路由处理器
export const POST = withCors(
  withApiProtection(handleWebhook, {
    rateLimit: { windowMs: 60000, maxRequests: 1000 }, // 每分钟最多1000个webhook请求
  }),
  { 
    origin: '*', // Webhook 可能来自任何地方，但依赖签名验证
    methods: ['POST', 'OPTIONS'] 
  }
)