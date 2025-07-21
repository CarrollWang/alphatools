'use client'

import { HeartIcon } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 品牌信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Web3 工具站</h3>
            <p className="text-sm text-muted-foreground">
              一站式 Web3 工具平台，为区块链用户提供专业的数据分析和实用工具。
            </p>
          </div>

          {/* 工具分类 */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">交易工具</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>币安 Alpha 统计</li>
              <li>交易分析</li>
              <li>收益计算</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">DeFi 工具</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>流动性分析</li>
              <li>收益农场</li>
              <li>风险评估</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">钱包工具</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>地址分析</li>
              <li>资产追踪</li>
              <li>安全检测</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center justify-center text-sm text-muted-foreground/80 gap-1">
              <HeartIcon size={12} className="text-rose-500" />
              <span>
                Made with love by
                {' '}
                <a
                  href="https://github.com/holazz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-primary transition-colors"
                >
                  holazz
                </a>
              </span>
            </div>
            <div className="text-sm text-muted-foreground mt-4 md:mt-0">
              © 2025 Web3 工具站. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}