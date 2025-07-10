# 邮件配置指南

钱包监控系统需要配置邮件服务来发送交易通知。支持三种邮件服务提供商：

## 1. SMTP 配置（推荐用于开发）

### Gmail 配置
```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME="Web3 监控系统"
```

**Gmail 应用专用密码设置：**
1. 开启 2FA 两步验证
2. 前往 [Google 账户设置](https://myaccount.google.com/security)
3. 生成应用专用密码
4. 使用生成的密码作为 `SMTP_PASS`

### QQ 邮箱配置
```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=your-email@qq.com
SMTP_PASS=your-authorization-code
SMTP_FROM_NAME="Web3 监控系统"
```

### 163 邮箱配置
```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.163.com
SMTP_PORT=587
SMTP_USER=your-email@163.com
SMTP_PASS=your-authorization-code
SMTP_FROM_NAME="Web3 监控系统"
```

## 2. SendGrid 配置（推荐用于生产）

```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME="Web3 监控系统"
```

**SendGrid 设置步骤：**
1. 注册 [SendGrid 账户](https://sendgrid.com/)
2. 验证发件人身份
3. 生成 API 密钥
4. 配置域名认证（可选）

## 3. AWS SES 配置

```env
EMAIL_PROVIDER=ses
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
SES_FROM_EMAIL=noreply@yourdomain.com
```

**AWS SES 设置步骤：**
1. 在 AWS Console 中启用 SES
2. 验证发件人邮箱/域名
3. 申请移出沙盒模式（生产环境）
4. 创建 IAM 用户并授予 SES 权限

## 测试邮件配置

配置完成后，使用以下方式测试：

### 1. API 测试
```bash
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com", "type": "test"}'
```

### 2. 检查配置状态
```bash
curl http://localhost:3000/api/email/test
```

### 3. 测试交易通知
```bash
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com", "type": "transaction"}'
```

## 常见问题

### SMTP 认证失败
- 检查用户名和密码是否正确
- 确保启用了应用专用密码
- 验证 SMTP 服务器地址和端口

### SendGrid 发送失败
- 检查 API 密钥是否有效
- 确认发件人邮箱已验证
- 检查是否达到发送限额

### AWS SES 权限问题
- 确保 IAM 用户有 SES 发送权限
- 检查区域设置是否正确
- 验证发件人邮箱状态

## 生产环境建议

1. **使用 SendGrid** 或 **AWS SES** 获得更好的送达率
2. **配置 DKIM** 和 **SPF** 记录提高邮件信誉
3. **设置退信处理** 机制
4. **监控发送统计** 和失败率
5. **限制发送频率** 避免被标记为垃圾邮件

## 安全提示

- 不要在代码中硬编码邮件密码
- 使用环境变量存储敏感信息
- 定期更换 API 密钥
- 监控异常发送行为