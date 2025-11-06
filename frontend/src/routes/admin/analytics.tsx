import { createFileRoute } from '@tanstack/react-router'
import {
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  Search,
  Brain,
  Clock,
  Activity,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function AnalyticsPage() {
  return (
    <div className='space-y-6'>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>总检索次数</CardTitle>
            <Search className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>12,543</div>
            <p className='text-muted-foreground text-xs'>+20.1% 较上月</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>活跃用户</CardTitle>
            <Users className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>2,843</div>
            <p className='text-muted-foreground text-xs'>+15.3% 较上月</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>知识文档</CardTitle>
            <FileText className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>8,234</div>
            <p className='text-muted-foreground text-xs'>+8.2% 较上月</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>平均响应时间</CardTitle>
            <Clock className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>1.2s</div>
            <p className='text-muted-foreground text-xs'>-12.5% 较上月</p>
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <BarChart3 className='h-5 w-5' />
              使用趋势分析
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <p className='text-muted-foreground text-sm'>
              详细的知识库使用趋势分析，包括热门检索词、用户行为模式等。
            </p>
            <div className='flex flex-wrap gap-2'>
              <Badge variant='outline'>趋势分析</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <TrendingUp className='h-5 w-5' />
              性能指标监控
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <p className='text-muted-foreground text-sm'>
              实时监控系统性能，包括响应时间、成功率、资源使用率等。
            </p>
            <div className='flex flex-wrap gap-2'>
              <Badge variant='outline'>实时监控</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Brain className='h-5 w-5' />
              AI 洞察报告
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <p className='text-muted-foreground text-sm'>
              基于AI的智能分析报告，提供知识库优化建议和用户行为洞察。
            </p>
            <div className='flex flex-wrap gap-2'>
              <Badge variant='outline'>智能分析</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Activity className='h-5 w-5' />
            功能特性
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-3'>
              <h4 className='font-medium'>用户行为分析</h4>
              <ul className='text-muted-foreground space-y-1 text-sm'>
                <li>• 检索热词统计</li>
                <li>• 用户活跃度分析</li>
                <li>• 内容偏好分析</li>
                <li>• 访问时间模式</li>
              </ul>
            </div>
            <div className='space-y-3'>
              <h4 className='font-medium'>知识库洞察</h4>
              <ul className='text-muted-foreground space-y-1 text-sm'>
                <li>• 文档使用频率</li>
                <li>• 知识关联分析</li>
                <li>• 内容质量评估</li>
                <li>• 缺失内容识别</li>
              </ul>
            </div>
            <div className='space-y-3'>
              <h4 className='font-medium'>系统性能</h4>
              <ul className='text-muted-foreground space-y-1 text-sm'>
                <li>• 响应时间趋势</li>
                <li>• 系统负载监控</li>
                <li>• 错误率分析</li>
                <li>• 容量规划建议</li>
              </ul>
            </div>
            <div className='space-y-3'>
              <h4 className='font-medium'>AI驱动功能</h4>
              <ul className='text-muted-foreground space-y-1 text-sm'>
                <li>• 智能报告生成</li>
                <li>• 异常检测预警</li>
                <li>• 趋势预测分析</li>
                <li>• 优化建议推荐</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export const Route = createFileRoute('/admin/analytics')({
  component: AnalyticsPage,
})
