'use client'

import { useState } from 'react'
import { Bell, Mail, Plus, Trash2, Eye, EyeOff } from 'lucide-react'
import { isAddress } from 'viem'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { formatAddress } from '@/lib/utils'

interface MonitorConfig {
  id: string
  address: string
  email: string
  label: string
  isActive: boolean
  createdAt: string
  lastNotification?: string
}

export default function WalletMonitorPage() {
  const [monitors, setMonitors] = useLocalStorage<MonitorConfig[]>('walletMonitors', [])
  const [newAddress, setNewAddress] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddMonitor = async () => {
    if (!newAddress.trim()) {
      toast.error('请输入钱包地址！')
      return
    }
    
    if (!isAddress(newAddress)) {
      toast.error('钱包地址格式无效！')
      return
    }

    if (!newEmail.trim()) {
      toast.error('请输入邮箱地址！')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      toast.error('邮箱地址格式无效！')
      return
    }

    // 检查是否已存在相同的监控配置
    const exists = monitors.some(m => 
      m.address.toLowerCase() === newAddress.toLowerCase() && 
      m.email.toLowerCase() === newEmail.toLowerCase()
    )
    
    if (exists) {
      toast.error('该地址和邮箱的监控配置已存在！')
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/wallet-monitor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: newAddress,
          email: newEmail,
          label: newLabel.trim() || formatAddress(newAddress),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '添加监控失败')
      }

      const newMonitor: MonitorConfig = {
        id: Date.now().toString(),
        address: newAddress,
        email: newEmail,
        label: newLabel.trim() || formatAddress(newAddress),
        isActive: true,
        createdAt: new Date().toISOString(),
      }

      setMonitors([...monitors, newMonitor])
      setNewAddress('')
      setNewEmail('')
      setNewLabel('')
      toast.success('监控配置添加成功！')
    } catch (error: any) {
      toast.error(error.message || '添加监控失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleMonitor = async (id: string) => {
    const monitor = monitors.find(m => m.id === id)
    if (!monitor) return

    try {
      const response = await fetch('/api/wallet-monitor', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          isActive: !monitor.isActive,
        }),
      })

      if (!response.ok) {
        throw new Error('更新监控状态失败')
      }

      setMonitors(monitors.map(m => 
        m.id === id ? { ...m, isActive: !m.isActive } : m
      ))
      
      toast.success(monitor.isActive ? '监控已暂停' : '监控已启用')
    } catch (error: any) {
      toast.error(error.message || '更新监控状态失败')
    }
  }

  const handleDeleteMonitor = async (id: string) => {
    try {
      const response = await fetch('/api/wallet-monitor', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      })

      if (!response.ok) {
        throw new Error('删除监控失败')
      }

      setMonitors(monitors.filter(m => m.id !== id))
      toast.success('监控配置已删除')
    } catch (error: any) {
      toast.error(error.message || '删除监控失败')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold tracking-tight mb-4">钱包地址监控</h1>
            <p className="text-muted-foreground text-lg">
              实时监控钱包地址的代币转入转出，第一时间邮件通知
            </p>
          </div>

          {/* 添加监控配置 */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                添加监控配置
              </CardTitle>
              <CardDescription>
                输入要监控的钱包地址和接收通知的邮箱
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">钱包地址</label>
                  <Input
                    placeholder="0x..."
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">邮箱地址</label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">备注标签（可选）</label>
                <Input
                  placeholder="例如：主钱包、交易钱包等"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleAddMonitor} 
                disabled={isSubmitting}
                className="w-full md:w-auto"
              >
                {isSubmitting ? '添加中...' : '添加监控'}
              </Button>
            </CardContent>
          </Card>

          {/* 监控列表 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                监控列表
                <Badge variant="secondary">{monitors.length}</Badge>
              </CardTitle>
              <CardDescription>
                管理您的钱包监控配置
              </CardDescription>
            </CardHeader>
            <CardContent>
              {monitors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>暂无监控配置</p>
                  <p className="text-sm">添加您的第一个钱包监控配置</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {monitors.map((monitor) => (
                    <div
                      key={monitor.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium truncate">{monitor.label}</h3>
                          <Badge variant={monitor.isActive ? 'default' : 'secondary'}>
                            {monitor.isActive ? '监控中' : '已暂停'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-2">
                            <span>地址:</span>
                            <code className="text-xs bg-muted px-1 rounded">
                              {formatAddress(monitor.address)}
                            </code>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            <span>{monitor.email}</span>
                          </div>
                          <div className="text-xs">
                            创建时间: {new Date(monitor.createdAt).toLocaleString()}
                          </div>
                          {monitor.lastNotification && (
                            <div className="text-xs">
                              最后通知: {new Date(monitor.lastNotification).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleMonitor(monitor.id)}
                          title={monitor.isActive ? '暂停监控' : '启用监控'}
                        >
                          {monitor.isActive ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMonitor(monitor.id)}
                          className="text-destructive hover:text-destructive"
                          title="删除监控"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 功能说明 */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>功能说明</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-foreground mb-2">监控范围</h4>
                  <ul className="space-y-1">
                    <li>• ERC-20 代币转入转出</li>
                    <li>• ETH/BNB 等原生代币转账</li>
                    <li>• NFT 转移（ERC-721/ERC-1155）</li>
                    <li>• DeFi 协议交互</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">通知内容</h4>
                  <ul className="space-y-1">
                    <li>• 交易哈希和区块信息</li>
                    <li>• 转账金额和代币类型</li>
                    <li>• 发送方和接收方地址</li>
                    <li>• 交易时间和 Gas 费用</li>
                  </ul>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-xs">
                  <strong>注意：</strong>
                  监控服务基于区块链事件实时推送，通常在交易确认后 1-3 分钟内发送邮件通知。
                  请确保邮箱地址正确，并检查垃圾邮件文件夹。
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}