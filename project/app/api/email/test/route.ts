import { NextResponse } from 'next/server'
import { emailService } from '@/lib/email'

// 邮件测试 API
export async function POST(request: Request) {
  try {
    const { to, subject = '测试邮件', type = 'test' } = await request.json()

    if (!to) {
      return NextResponse.json({ error: '收件人邮箱地址必填' }, { status: 400 })
    }

    if (type === 'test') {
      // 发送测试邮件
      await emailService.sendEmail({
        to,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>📧 邮件配置测试</h2>
            <p>恭喜！您的邮件配置已成功设置。</p>
            <p>此邮件用于测试 Web3 监控系统的邮件发送功能。</p>
            <hr>
            <p style="color: #666; font-size: 12px;">
              发送时间: ${new Date().toLocaleString()}<br>
              系统: Web3 钱包监控系统
            </p>
          </div>
        `,
        text: `
          邮件配置测试
          
          恭喜！您的邮件配置已成功设置。
          此邮件用于测试 Web3 监控系统的邮件发送功能。
          
          发送时间: ${new Date().toLocaleString()}
          系统: Web3 钱包监控系统
        `,
      })
    } else if (type === 'transaction') {
      // 发送交易测试邮件
      const mockTransaction = {
        hash: '0x1234567890abcdef1234567890abcdef12345678',
        from: '0xabcdef1234567890abcdef1234567890abcdef12',
        to: '0x9876543210fedcba9876543210fedcba98765432',
        value: '1.5',
        token: 'BNB',
        timestamp: new Date().toISOString(),
        type: 'incoming' as const,
      }

      await emailService.sendTransactionAlert(to, '测试钱包', mockTransaction)
    }

    return NextResponse.json({ 
      success: true, 
      message: '测试邮件发送成功' 
    })
  } catch (error) {
    console.error('邮件发送测试失败:', error)
    return NextResponse.json({ 
      error: '邮件发送失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

// 获取邮件配置状态
export async function GET() {
  try {
    const provider = process.env.EMAIL_PROVIDER || 'smtp'
    const config = {
      provider,
      configured: false,
      details: {} as any,
    }

    switch (provider) {
      case 'sendgrid':
        config.configured = !!process.env.SENDGRID_API_KEY
        config.details = {
          apiKey: process.env.SENDGRID_API_KEY ? '已配置' : '未配置',
          fromEmail: process.env.SENDGRID_FROM_EMAIL || '未配置',
          fromName: process.env.SENDGRID_FROM_NAME || '未配置',
        }
        break
      case 'ses':
        config.configured = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
        config.details = {
          accessKey: process.env.AWS_ACCESS_KEY_ID ? '已配置' : '未配置',
          secretKey: process.env.AWS_SECRET_ACCESS_KEY ? '已配置' : '未配置',
          region: process.env.AWS_REGION || 'us-east-1',
          fromEmail: process.env.SES_FROM_EMAIL || '未配置',
        }
        break
      case 'smtp':
        config.configured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
        config.details = {
          host: process.env.SMTP_HOST || '未配置',
          port: process.env.SMTP_PORT || '587',
          user: process.env.SMTP_USER || '未配置',
          pass: process.env.SMTP_PASS ? '已配置' : '未配置',
          fromName: process.env.SMTP_FROM_NAME || 'Web3 监控系统',
        }
        break
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('获取邮件配置失败:', error)
    return NextResponse.json({ 
      error: '获取配置失败' 
    }, { status: 500 })
  }
}