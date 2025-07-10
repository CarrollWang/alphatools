'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ExternalLink, Clock, Users, Gift, TrendingUp } from 'lucide-react'
import { motion } from 'motion/react'
import type { AirdropProject, UserAirdropInfo, AlphaPointsInfo } from '@/types'
import dayjs from '@/lib/dayjs'

interface AirdropOverviewProps {
  projects: AirdropProject[]
  userInfo: UserAirdropInfo[]
  alphaPoints: AlphaPointsInfo
  isLoading?: boolean
}

export default function AirdropOverview({ 
  projects, 
  userInfo, 
  alphaPoints,
  isLoading 
}: AirdropOverviewProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'claiming')
  const eligibleProjects = userInfo.filter(u => u.isEligible).length
  const claimedProjects = userInfo.filter(u => u.hasClaimed).length
  const totalRewards = userInfo.reduce((sum, u) => sum + Number(u.claimAmount || 0), 0)

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Alpha 积分
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alphaPoints.totalPoints}</div>
              <p className="text-xs text-muted-foreground">
                即将过期: {alphaPoints.expiringPoints}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                活跃项目
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeProjects.length}</div>
              <p className="text-xs text-muted-foreground">
                总项目数: {projects.length}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                符合条件
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{eligibleProjects}</div>
              <p className="text-xs text-muted-foreground">
                已领取: {claimedProjects}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Gift className="h-4 w-4" />
                总奖励
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRewards.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                代币数量
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* 空投项目列表 */}
      <div className="space-y-4">
        {projects.map((project, index) => {
          const userProjectInfo = userInfo.find(u => u.projectId === project.id)
          const isEligible = userProjectInfo?.isEligible || false
          const hasClaimed = userProjectInfo?.hasClaimed || false
          const progress = project.maxParticipants 
            ? (project.participantCount / project.maxParticipants) * 100 
            : 0

          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                        {project.symbol.charAt(0)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {project.symbol}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        project.status === 'active' ? 'default' :
                        project.status === 'claiming' ? 'secondary' :
                        project.status === 'upcoming' ? 'outline' : 'destructive'
                      }>
                        {project.status === 'active' ? '进行中' :
                         project.status === 'claiming' ? '领取中' :
                         project.status === 'upcoming' ? '即将开始' : '已结束'}
                      </Badge>
                      {isEligible && (
                        <Badge variant="secondary">
                          符合条件
                        </Badge>
                      )}
                      {hasClaimed && (
                        <Badge variant="default">
                          已领取
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {project.description}
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="font-medium">所需积分</div>
                        <div className="text-muted-foreground">{project.requiredPoints}</div>
                      </div>
                      <div>
                        <div className="font-medium">空投总量</div>
                        <div className="text-muted-foreground">{project.airdropAmount}</div>
                      </div>
                      <div>
                        <div className="font-medium">参与人数</div>
                        <div className="text-muted-foreground">{project.participantCount.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="font-medium">
                          {project.status === 'claiming' ? '领取截止' : '项目结束'}
                        </div>
                        <div className="text-muted-foreground">
                          {dayjs(project.status === 'claiming' ? project.claimEndTime : project.endTime).format('MM-DD HH:mm')}
                        </div>
                      </div>
                    </div>

                    {project.maxParticipants && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>参与进度</span>
                          <span>{progress.toFixed(1)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    )}

                    {userProjectInfo && (
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-medium">我的积分</div>
                            <div className="text-muted-foreground">{userProjectInfo.alphaPoints}</div>
                          </div>
                          {userProjectInfo.claimAmount && (
                            <div>
                              <div className="font-medium">可领取数量</div>
                              <div className="text-muted-foreground">{userProjectInfo.claimAmount}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {project.website && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={project.website} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            网站
                          </a>
                        </Button>
                      )}
                      {project.twitter && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={project.twitter} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Twitter
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}