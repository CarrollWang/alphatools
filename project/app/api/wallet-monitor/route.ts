import { NextResponse } from 'next/server'
import type { Hex } from 'viem'
import { isAddress } from 'viem'

// 模拟数据库存储（实际项目中应使用真实数据库）
let monitorConfigs: Array<{
  id: string
  address: Hex
  email: string
  label: string
  isActive: boolean
  createdAt: string
  lastNotification?: string
}> = []

// 添加监控配置
export async function POST(request: Request) {
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
    const exists = monitorConfigs.some(
      config => config.address.toLowerCase() === address.toLowerCase() && 
                config.email.toLowerCase() === email.toLowerCase()
    )

    if (exists) {
      return NextResponse.json({ error: '该监控配置已存在' }, { status: 409 })
    }

    const newConfig = {
      id: Date.now().toString(),
      address: address.toLowerCase() as Hex,
      email: email.toLowerCase(),
      label: label || address,
      isActive: true,
      createdAt: new Date().toISOString(),
    }

    monitorConfigs.push(newConfig)

    // 这里应该启动实际的区块链监控服务
    await startMonitoring(newConfig)

    return NextResponse.json({ 
      message: '监控配置添加成功',
      config: newConfig 
    })
  } catch (error) {
    console.error('添加监控配置失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// 更新监控配置
export async function PATCH(request: Request) {
  try {
    const { id, isActive } = await request.json()

    const configIndex = monitorConfigs.findIndex(config => config.id === id)
    if (configIndex === -1) {
      return NextResponse.json({ error: '监控配置不存在' }, { status: 404 })
    }

    monitorConfigs[configIndex].isActive = isActive

    if (isActive) {
      await startMonitoring(monitorConfigs[configIndex])
    } else {
      await stopMonitoring(id)
    }

    return NextResponse.json({ 
      message: '监控状态更新成功',
      config: monitorConfigs[configIndex]
    })
  } catch (error) {
    console.error('更新监控配置失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// 删除监控配置
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()

    const configIndex = monitorConfigs.findIndex(config => config.id === id)
    if (configIndex === -1) {
      return NextResponse.json({ error: '监控配置不存在' }, { status: 404 })
    }

    await stopMonitoring(id)
    monitorConfigs.splice(configIndex, 1)

    return NextResponse.json({ message: '监控配置删除成功' })
  } catch (error) {
    console.error('删除监控配置失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// 获取监控配置列表
export async function GET() {
  try {
    return NextResponse.json({ configs: monitorConfigs })
  } catch (error) {
    console.error('获取监控配置失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// 启动监控服务
async function startMonitoring(config: any) {
  console.log(`启动监控: ${config.address} -> ${config.email}`)
  
  // 这里应该实现实际的区块链事件监听
  // 例如使用 WebSocket 连接到区块链节点
  // 或者使用第三方服务如 Alchemy、Infura 的 Webhook
  
  // 示例：模拟监控逻辑
  if (typeof window === 'undefined') {
    // 只在服务端执行
    setTimeout(() => {
      // 模拟检测到交易
      sendNotificationEmail(config, {
        hash: '0x1234567890abcdef',
        from: '0xabcdef1234567890',
        to: config.address,
        value: '1.5',
        token: 'USDT',
        timestamp: new Date().toISOString(),
      })
    }, 10000) // 10秒后发送测试邮件
  }
}

// 停止监控服务
async function stopMonitoring(id: string) {
  console.log(`停止监控: ${id}`)
  // 这里应该清理相关的监听器和定时器
}

// 发送邮件通知
async function sendNotificationEmail(config: any, transaction: any) {
  try {
    // 这里应该集成真实的邮件服务
    // 例如 SendGrid、AWS SES、Nodemailer 等
    
    console.log(`发送邮件通知到: ${config.email}`)
    console.log('交易信息:', transaction)
    
    // 更新最后通知时间
    const configIndex = monitorConfigs.findIndex(c => c.id === config.id)
    if (configIndex !== -1) {
      monitorConfigs[configIndex].lastNotification = new Date().toISOString()
    }
    
    // 模拟邮件发送
    const emailContent = `
      钱包地址监控通知
      
      监控地址: ${config.address}
      标签: ${config.label}
      
      检测到新交易:
      - 交易哈希: ${transaction.hash}
      - 发送方: ${transaction.from}
      - 接收方: ${transaction.to}
      - 金额: ${transaction.value} ${transaction.token}
      - 时间: ${new Date(transaction.timestamp).toLocaleString()}
      
      查看详情: https://bscscan.com/tx/${transaction.hash}
    `
    
    console.log('邮件内容:', emailContent)
    
    return true
  } catch (error) {
    console.error('发送邮件失败:', error)
    return false
  }
}