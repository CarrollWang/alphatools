// 邮件服务工具类
// 支持多种邮件服务提供商

import type { TransactionAlertInfo } from '../types'

interface EmailConfig {
  provider: 'sendgrid' | 'ses' | 'smtp'
  apiKey?: string
  smtpConfig?: {
    host: string
    port: number
    secure: boolean
    auth: {
      user: string
      pass: string
    }
  }
}

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export class EmailService {
  private config: EmailConfig

  constructor(config: EmailConfig) {
    this.config = config
  }

  async sendTransactionAlert(
    to: string,
    walletLabel: string,
    transaction: TransactionAlertInfo
  ) {
    const template = this.generateTransactionTemplate(walletLabel, transaction)
    
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })
  }

  private generateTransactionTemplate(walletLabel: string, transaction: TransactionAlertInfo): EmailTemplate {
    const isIncoming = transaction.type === 'incoming'
    const direction = isIncoming ? '转入' : '转出'
    const emoji = isIncoming ? '📈' : '📉'
    
    const subject = `${emoji} ${walletLabel} - 检测到${direction}交易`
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>钱包监控通知</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .transaction { background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; }
            .amount { font-size: 24px; font-weight: bold; color: ${isIncoming ? '#28a745' : '#dc3545'}; }
            .details { margin-top: 20px; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f8f9fa; }
            .label { font-weight: bold; }
            .value { font-family: monospace; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 12px; color: #6c757d; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>${emoji} 钱包监控通知</h2>
              <p>您监控的钱包 <strong>${walletLabel}</strong> 检测到新的${direction}交易</p>
            </div>
            
            <div class="transaction">
              <div class="amount">${isIncoming ? '+' : '-'}${transaction.value} ${transaction.token}</div>
              
              <div class="details">
                <div class="detail-row">
                  <span class="label">交易哈希:</span>
                  <span class="value">${transaction.hash}</span>
                </div>
                <div class="detail-row">
                  <span class="label">发送方:</span>
                  <span class="value">${transaction.from}</span>
                </div>
                <div class="detail-row">
                  <span class="label">接收方:</span>
                  <span class="value">${transaction.to}</span>
                </div>
                <div class="detail-row">
                  <span class="label">时间:</span>
                  <span class="value">${new Date(transaction.timestamp).toLocaleString()}</span>
                </div>
              </div>
              
              <div style="margin-top: 20px;">
                <a href="https://bscscan.com/tx/${transaction.hash}" 
                   style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
                  查看交易详情
                </a>
              </div>
            </div>
            
            <div class="footer">
              <p>这是一封自动发送的邮件，请勿回复。</p>
              <p>如需停止监控，请登录 Web3 工具站进行管理。</p>
            </div>
          </div>
        </body>
      </html>
    `
    
    const text = `
      钱包监控通知
      
      您监控的钱包 ${walletLabel} 检测到新的${direction}交易
      
      金额: ${isIncoming ? '+' : '-'}${transaction.value} ${transaction.token}
      交易哈希: ${transaction.hash}
      发送方: ${transaction.from}
      接收方: ${transaction.to}
      时间: ${new Date(transaction.timestamp).toLocaleString()}
      
      查看详情: https://bscscan.com/tx/${transaction.hash}
    `
    
    return { subject, html, text }
  }

  public async sendEmail(params: {
    to: string
    subject: string
    html: string
    text: string
  }) {
    switch (this.config.provider) {
      case 'sendgrid':
        return this.sendWithSendGrid(params)
      case 'ses':
        return this.sendWithSES(params)
      case 'smtp':
        return this.sendWithSMTP(params)
      default:
        throw new Error('Unsupported email provider')
    }
  }

  private async sendWithSendGrid(params: any) {
    if (!this.config.apiKey) {
      throw new Error('SendGrid API key is required')
    }

    try {
      // 实际实现需要安装 @sendgrid/mail
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: params.to }],
            subject: params.subject,
          }],
          from: {
            email: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com',
            name: process.env.SENDGRID_FROM_NAME || 'Web3 监控系统',
          },
          content: [
            {
              type: 'text/html',
              value: params.html,
            },
            {
              type: 'text/plain',
              value: params.text,
            },
          ],
        }),
      })

      if (!response.ok) {
        throw new Error(`SendGrid API error: ${response.status}`)
      }

      console.log('邮件发送成功 (SendGrid):', params.subject)
      return { success: true, provider: 'sendgrid' }
    } catch (error) {
      console.error('SendGrid 发送失败:', error)
      throw error
    }
  }

  private async sendWithSES(params: any) {
    try {
      // 实际实现需要安装 @aws-sdk/client-ses
      const response = await fetch('https://email.us-east-1.amazonaws.com/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.0',
          'X-Amz-Target': 'AWSSimpleEmailService.SendEmail',
          'Authorization': `AWS4-HMAC-SHA256 Credential=${process.env.AWS_ACCESS_KEY_ID}`,
        },
        body: JSON.stringify({
          Source: process.env.SES_FROM_EMAIL || 'noreply@example.com',
          Destination: {
            ToAddresses: [params.to],
          },
          Message: {
            Subject: {
              Data: params.subject,
              Charset: 'UTF-8',
            },
            Body: {
              Html: {
                Data: params.html,
                Charset: 'UTF-8',
              },
              Text: {
                Data: params.text,
                Charset: 'UTF-8',
              },
            },
          },
        }),
      })

      console.log('邮件发送成功 (AWS SES):', params.subject)
      return { success: true, provider: 'ses' }
    } catch (error) {
      console.error('AWS SES 发送失败:', error)
      throw error
    }
  }

  private async sendWithSMTP(params: any) {
    if (!this.config.smtpConfig) {
      throw new Error('SMTP configuration is required')
    }

    try {
      // 实际实现需要安装 nodemailer
      const nodemailer = require('nodemailer')
      
      const transporter = nodemailer.createTransporter({
        host: this.config.smtpConfig.host,
        port: this.config.smtpConfig.port,
        secure: this.config.smtpConfig.secure,
        auth: {
          user: this.config.smtpConfig.auth.user,
          pass: this.config.smtpConfig.auth.pass,
        },
      })

      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || 'Web3 监控系统'}" <${this.config.smtpConfig.auth.user}>`,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      }

      const info = await transporter.sendMail(mailOptions)
      console.log('邮件发送成功 (SMTP):', info.messageId)
      return { success: true, provider: 'smtp', messageId: info.messageId }
    } catch (error) {
      console.error('SMTP 发送失败:', error)
      throw error
    }
  }

  // 验证邮件配置
  async validateConfig(): Promise<boolean> {
    try {
      switch (this.config.provider) {
        case 'sendgrid':
          return !!this.config.apiKey
        case 'ses':
          return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
        case 'smtp':
          return !!(this.config.smtpConfig?.host && this.config.smtpConfig?.auth?.user)
        default:
          return false
      }
    } catch {
      return false
    }
  }
}

// 根据环境变量创建邮件服务实例
function createEmailService(): EmailService {
  const provider = (process.env.EMAIL_PROVIDER as any) || 'smtp'
  
  switch (provider) {
    case 'sendgrid':
      return new EmailService({
        provider: 'sendgrid',
        apiKey: process.env.SENDGRID_API_KEY,
      })
    case 'ses':
      return new EmailService({
        provider: 'ses',
      })
    case 'smtp':
    default:
      return new EmailService({
        provider: 'smtp',
        smtpConfig: {
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_PORT === '465',
          auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || '',
          },
        },
      })
  }
}

// 默认邮件服务实例
export const emailService = createEmailService()