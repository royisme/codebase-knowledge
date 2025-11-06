import { useState } from 'react'
import type { JobLog } from '@/types/job'
import { Info, AlertTriangle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface JobLogViewerProps {
  logs: JobLog[]
}

const LOG_LEVEL_CONFIG = {
  info: {
    icon: Info,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950',
  },
  error: {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950',
  },
}

export function JobLogViewer({ logs }: JobLogViewerProps) {
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [stageFilter, setStageFilter] = useState<string>('all')

  // 获取所有唯一的阶段
  const stages = Array.from(new Set(logs.map((log) => log.stage)))

  // 过滤日志
  const filteredLogs = logs.filter((log) => {
    const levelMatch = levelFilter === 'all' || log.level === levelFilter
    const stageMatch = stageFilter === 'all' || log.stage === stageFilter
    return levelMatch && stageMatch
  })

  // 按时间倒序
  const sortedLogs = [...filteredLogs].reverse()

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>任务日志</CardTitle>
          <div className='flex items-center gap-2'>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className='w-[120px]'>
                <SelectValue placeholder='日志级别' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>全部级别</SelectItem>
                <SelectItem value='info'>Info</SelectItem>
                <SelectItem value='warning'>Warning</SelectItem>
                <SelectItem value='error'>Error</SelectItem>
              </SelectContent>
            </Select>

            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className='w-[140px]'>
                <SelectValue placeholder='阶段' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>全部阶段</SelectItem>
                {stages.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className='h-[400px] w-full rounded-md border p-4'>
          {sortedLogs.length === 0 ? (
            <p className='text-muted-foreground py-8 text-center'>暂无日志</p>
          ) : (
            <div className='space-y-2'>
              {sortedLogs.map((log, index) => {
                const config = LOG_LEVEL_CONFIG[log.level]
                const Icon = config.icon

                return (
                  <div
                    key={index}
                    className={cn('space-y-1 rounded-md p-3', config.bgColor)}
                  >
                    <div className='flex items-center gap-2'>
                      <Icon className={cn('h-4 w-4', config.color)} />
                      <Badge variant='outline' className='text-xs'>
                        {log.stage}
                      </Badge>
                      <span className='text-muted-foreground font-mono text-xs'>
                        {new Date(log.timestamp).toLocaleTimeString('zh-CN')}
                      </span>
                    </div>
                    <p className='pl-6 text-sm'>{log.message}</p>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
