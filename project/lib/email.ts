import nodemailer from 'nodemailer'
import { config } from '@/configs'

interface Transaction {
  hash: string
  from: string
  to: string
  value: string
  token: string
  timestamp: string
}

// 创建邮件传输器
function createTransporter() {
  if (!config.email.host || !config.email.auth.user || !config.email.auth.pass) {
    console.warn('Email configuration incomplete, using console logging fallback')
    return null
  }

  return nodemailer.createTransporter({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.auth.user,
      pass: config.email.auth.pass,
    },
  })
}

export async function sendNotificationEmail(email: string, transaction: Transaction): Promise<boolean> {
  try {
    const transporter = createTransporter()
    
    if (!transporter) {
      // 开发环境下的控制台日志回退
      console.log('=== 邮件通知 (开发模式) ===')
      console.log(`收件人: ${email}`)
      console.log(`交易哈希: ${transaction.hash}`)
      console.log(`发送方: ${transaction.from}`)
      console.log(`接收方: ${transaction.to}`)
      console.log(`金额: ${transaction.value} ${transaction.token}`)
      console.log(`时间: ${new Date(transaction.timestamp).toLocaleString()}`)
      console.log('==========================')
      return true
    }

    const emailContent = generateEmailContent(transaction)
    
    const mailOptions = {
      from: config.email.auth.user,
      to: email,
      subject: '🔔 钱包地址监控通知 - 检测到新交易',
      html: emailContent,
    }

    await transporter.sendMail(mailOptions)
    console.log(`邮件通知已发送到: ${email}`)
    return true

  } catch (error) {
    console.error('发送邮件失败:', error)
    return false
  }
}

function generateEmailContent(transaction: Transaction): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>钱包监控通知</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f8f9fa; }
        .transaction-details { background: white; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .label { font-weight: bold; color: #555; }
        .value { margin-left: 10px; font-family: monospace; background: #e9ecef; padding: 2px 5px; border-radius: 3px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .button { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔔 钱包地址监控通知</h1>
          <p>检测到新的区块链交易</p>
        </div>
        
        <div class="content">
          <div class="transaction-details">
            <h3>交易详情</h3>
            <p><span class="label">交易哈希:</span><span class="value">${transaction.hash}</span></p>
            <p><span class="label">发送方:</span><span class="value">${transaction.from}</span></p>
            <p><span class="label">接收方:</span><span class="value">${transaction.to}</span></p>
            <p><span class="label">金额:</span><span class="value">${transaction.value} ${transaction.token}</span></p>
            <p><span class="label">时间:</span><span class="value">${new Date(transaction.timestamp).toLocaleString('zh-CN')}</span></p>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="https://bscscan.com/tx/${transaction.hash}" class="button" target="_blank">
              在 BSCScan 上查看详情
            </a>
          </div>
        </div>
        
        <div class="footer">
          <p>此邮件由 Web3 工具站的钱包监控服务自动发送</p>
          <p>如需取消监控，请登录您的账户进行设置</p>
        </div>
      </div>
    </body>
    </html>
  `
}