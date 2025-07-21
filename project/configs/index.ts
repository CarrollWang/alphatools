function getApiKeysFromEnv(envVar: string): string[] {
  const keys = process.env[envVar]
  if (!keys) {
    throw new Error(`Missing environment variable: ${envVar}`)
  }
  return keys.split(',').map(key => key.trim()).filter(Boolean)
}

export const apiKeys = {
  default: getApiKeysFromEnv('ETHERSCAN_API_KEYS_DEFAULT'),
  txlist: getApiKeysFromEnv('ETHERSCAN_API_KEYS_TXLIST'),
  txlistinternal: getApiKeysFromEnv('ETHERSCAN_API_KEYS_TXLISTINTERNAL'),
  tokentx: getApiKeysFromEnv('ETHERSCAN_API_KEYS_TOKENTX'),
}

export const config = {
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  email: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
  security: {
    jwtSecret: process.env.JWT_SECRET,
    webhookSecret: process.env.WEBHOOK_SECRET,
    apiRateLimit: Number(process.env.API_RATE_LIMIT || 100),
  },
}
