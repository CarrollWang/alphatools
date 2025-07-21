import { NextRequest, NextResponse } from 'next/server'
import type { Hex } from 'viem'
import { isAddress } from 'viem'
import { getDatabaseService } from '@/lib/database-service'
import { sendNotificationEmail } from '@/lib/email'
import { withApiProtection, withCors } from '@/lib/middleware'

const databaseService = getDatabaseService()

// 添加监控配置
async function handlePOST(request: NextRequest) {
  try {
    const { address, email, label } = await request.json()

    if (!address || !isAddress(address)) {
      return NextResponse.json({ error: '无效的钱包地址' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json({ error: '无效的邮箱地址' }, { status: 400 })
    }

    // 检查是否已存在
    const existingConfig = await databaseService.checkDuplicateWalletMonitor(
      address.toLowerCase() as Hex, 
      email.toLowerCase()
    )

    if (existingConfig) {
      return NextResponse.json({ error: '该监控配置已存在' }, { status: 409 })
    }

    const newConfig = await databaseService.createWalletMonitor({
      walletAddress: address.toLowerCase() as Hex,
      email: email.toLowerCase(),
      isActive: true,
    })

    // 启动实际的区块链监控服务
    await startMonitoring(newConfig)

    return NextResponse.json({ 
      message: '监控配置添加成功',
      config: {
        id: newConfig.id,
        address: newConfig.walletAddress,
        email: newConfig.email,
        label: label || newConfig.walletAddress,
        isActive: newConfig.isActive,
        createdAt: newConfig.createdAt.toISOString(),
      }
    })
  } catch (error) {
    console.error('添加监控配置失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// 更新监控配置
async function handlePATCH(request: NextRequest) {
  try {
    const { id, isActive } = await request.json()

    const existingConfig = await databaseService.getWalletMonitorById(id)
    if (!existingConfig) {
      return NextResponse.json({ error: '监控配置不存在' }, { status: 404 })
    }

    const updatedConfig = await databaseService.updateWalletMonitor(id, { isActive })

    if (isActive) {
      await startMonitoring(updatedConfig)
    } else {
      await stopMonitoring(id)
    }

    return NextResponse.json({ 
      message: '监控状态更新成功',
      config: {
        id: updatedConfig.id,
        address: updatedConfig.walletAddress,
        email: updatedConfig.email,
        isActive: updatedConfig.isActive,
        updatedAt: updatedConfig.updatedAt.toISOString(),
      }
    })
  } catch (error) {
    console.error('更新监控配置失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// 删除监控配置
async function handleDELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    const deleted = await databaseService.deleteWalletMonitor(id)
    if (!deleted) {
      return NextResponse.json({ error: '监控配置不存在' }, { status: 404 })
    }

    await stopMonitoring(id)

    return NextResponse.json({ message: '监控配置删除成功' })
  } catch (error) {
    console.error('删除监控配置失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// 获取监控配置列表
async function handleGET(request: NextRequest) {
  try {
    const configs = await databaseService.getWalletMonitors()
    
    return NextResponse.json({ 
      configs: configs.map(config => ({
        id: config.id,
        address: config.walletAddress,
        email: config.email,
        isActive: config.isActive,
        createdAt: config.createdAt.toISOString(),
        updatedAt: config.updatedAt.toISOString(),
      }))
    })
  } catch (error) {
    console.error('获取监控配置失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// 启动监控服务
async function startMonitoring(config: any) {
  console.log(`启动监控: ${config.walletAddress} -> ${config.email}`)
  
  // 这里应该实现实际的区块链事件监听
  // 例如使用 WebSocket 连接到区块链节点
  // 或者使用第三方服务如 Alchemy、Infura 的 Webhook
  
  // 示例：模拟监控逻辑（仅用于开发测试）
  if (process.env.NODE_ENV === 'development') {
    setTimeout(async () => {
      // 模拟检测到交易
      const mockTransaction = {
        hash: '0x1234567890abcdef',
        from: '0xabcdef1234567890',
        to: config.walletAddress,
        value: '1.5',
        token: 'USDT',
        timestamp: new Date().toISOString(),
      }
      
      await sendNotificationEmail(config.email, mockTransaction)
    }, 10000) // 10秒后发送测试邮件
  }
}

// 停止监控服务
async function stopMonitoring(id: string) {
  console.log(`停止监控: ${id}`)
  // 这里应该清理相关的监听器和定时器
}

// 应用中间件保护的路由处理器
export const POST = withCors(
  withApiProtection(handlePOST, {
    rateLimit: { windowMs: 60000, maxRequests: 10 }, // 每分钟最多10次请求
  }),
  { origin: ['http://localhost:3000'], methods: ['POST', 'OPTIONS'] }
)

export const PATCH = withCors(
  withApiProtection(handlePATCH, {
    rateLimit: { windowMs: 60000, maxRequests: 20 },
  }),
  { origin: ['http://localhost:3000'], methods: ['PATCH', 'OPTIONS'] }
)

export const DELETE = withCors(
  withApiProtection(handleDELETE, {
    rateLimit: { windowMs: 60000, maxRequests: 20 },
  }),
  { origin: ['http://localhost:3000'], methods: ['DELETE', 'OPTIONS'] }
)

export const GET = withCors(
  withApiProtection(handleGET, {
    rateLimit: { windowMs: 60000, maxRequests: 100 },
  }),
  { origin: ['http://localhost:3000'], methods: ['GET', 'OPTIONS'] }
)