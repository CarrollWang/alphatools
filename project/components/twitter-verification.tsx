'use client'

import { useState } from 'react'
import { Twitter, ExternalLink, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface TwitterVerificationProps {
  twitterHandle: string
  onVerificationSuccess: () => void
}

export default function TwitterVerification({ 
  twitterHandle, 
  onVerificationSuccess 
}: TwitterVerificationProps) {
  const [userTwitter, setUserTwitter] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isFollowed, setIsFollowed] = useState(false)

  const handleVerification = async () => {
    if (!userTwitter.trim()) {
      toast.error('请输入您的 Twitter 用户名')
      return
    }

    setIsVerifying(true)
    
    try {
      // 模拟验证过程（实际项目中需要调用 Twitter API）
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 简单验证逻辑（实际项目中需要真实的 API 验证）
      const hasFollowed = Math.random() > 0.3 // 70% 成功率模拟
      
      if (hasFollowed) {
        setIsFollowed(true)
        toast.success('验证成功！感谢您的关注')
        setTimeout(() => {
          onVerificationSuccess()
        }, 1500)
      } else {
        toast.error('验证失败，请确认您已关注我们的 Twitter 账号')
      }
    } catch (error) {
      toast.error('验证过程中出现错误，请稍后重试')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleFollowClick = () => {
    window.open(`https://twitter.com/${twitterHandle}`, '_blank')
  }

  if (isFollowed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-green-600">验证成功！</CardTitle>
            <CardDescription>
              感谢您关注我们的 Twitter 账号，正在为您跳转...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
            <Twitter className="w-8 h-8 text-blue-500" />
          </div>
          <CardTitle>欢迎使用 Web3 工具站</CardTitle>
          <CardDescription>
            为了获得最佳体验和最新资讯，请先关注我们的 Twitter 账号
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">
              请先关注我们的 Twitter 账号：
            </p>
            <Button 
              variant="outline" 
              onClick={handleFollowClick}
              className="w-full"
            >
              <Twitter className="w-4 h-4 mr-2" />
              关注 @{twitterHandle}
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              关注完成后，请输入您的 Twitter 用户名进行验证：
            </p>
            <Input
              placeholder="请输入您的 Twitter 用户名"
              value={userTwitter}
              onChange={(e) => setUserTwitter(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerification()}
            />
          </div>
          
          <Button 
            onClick={handleVerification}
            disabled={isVerifying || !userTwitter.trim()}
            className="w-full"
          >
            {isVerifying ? '验证中...' : '验证关注状态'}
          </Button>
          
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>• 关注后可获得最新项目动态和工具更新</p>
            <p>• 我们不会获取您的任何私人信息</p>
            <p>• 验证通过后即可正常使用所有功能</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}