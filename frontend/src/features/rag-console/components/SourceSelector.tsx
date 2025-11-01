import { useQuery } from '@tanstack/react-query'
import { ChevronDown, AlertCircle, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import type { Repository } from '@/types'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { listRepositories } from '@/lib/repository-service'

interface SourceSelectorProps {
  selectedSource: Repository | null
  onSelect: (source: Repository | null) => void
}

// 获取主要语言标签
function getPrimaryLanguage(languages?: Record<string, number>): string | null {
  if (!languages || Object.keys(languages).length === 0) return null
  
  const sorted = Object.entries(languages).sort(([, a], [, b]) => b - a)
  return sorted[0][0]
}

// 格式化语言名称
function formatLanguage(lang: string): string {
  const map: Record<string, string> = {
    python: 'Python',
    typescript: 'TypeScript',
    javascript: 'JavaScript',
    go: 'Go',
    java: 'Java',
    rust: 'Rust',
  }
  return map[lang.toLowerCase()] || lang
}

export function SourceSelector({
  selectedSource,
  onSelect,
}: SourceSelectorProps) {
  const [open, setOpen] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['repositories', 'indexed'],
    queryFn: () => listRepositories({ statuses: ['indexed'] }),
    staleTime: 5 * 60 * 1000, // 5 分钟
  })

  // 只显示已索引的代码仓库
  const sources = (data?.items || []).filter(
    (repo) => repo.source_type === 'code' && repo.source_metadata?.index_version
  )

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          加载知识源失败，请刷新页面重试
        </AlertDescription>
      </Alert>
    )
  }

  if (!isLoading && sources.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          暂无可用知识源，请联系管理员添加代码仓库
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">知识源</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={isLoading}
          >
            {isLoading ? (
              '加载中...'
            ) : selectedSource ? (
              <span className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                {selectedSource.name}
                {selectedSource.source_metadata?.languages && (
                  <Badge variant="secondary" className="text-xs">
                    {formatLanguage(
                      getPrimaryLanguage(selectedSource.source_metadata.languages) || ''
                    )}
                  </Badge>
                )}
              </span>
            ) : (
              '选择代码仓库'
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput placeholder="搜索代码仓库..." />
            <CommandEmpty>未找到代码仓库</CommandEmpty>
            <CommandList>
              <CommandGroup>
                {sources?.map((source) => {
                  const primaryLang = getPrimaryLanguage(
                    source.source_metadata?.languages
                  )
                  
                  return (
                    <CommandItem
                      key={source.id}
                      value={source.name}
                      onSelect={() => {
                        onSelect(
                          selectedSource?.id === source.id ? null : source
                        )
                        setOpen(false)
                      }}
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex flex-1 items-center justify-between">
                              <div className="flex items-center gap-2">
                                <GitBranch
                                  className={cn(
                                    'h-4 w-4',
                                    selectedSource?.id === source.id
                                      ? 'opacity-100'
                                      : 'opacity-40'
                                  )}
                                />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                      {source.name}
                                    </span>
                                    {primaryLang && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {formatLanguage(primaryLang)}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-muted-foreground text-xs">
                                    {source.connection_config.branch}
                                  </div>
                                </div>
                              </div>
                              {source.last_synced_at && (
                                <div className="text-muted-foreground text-xs">
                                  {new Date(
                                    source.last_synced_at
                                  ).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <div className="space-y-1 text-xs">
                              <div>
                                <strong>文件：</strong>
                                {source.source_metadata?.total_files || 0}
                              </div>
                              <div>
                                <strong>函数：</strong>
                                {source.source_metadata?.total_functions || 0}
                              </div>
                              <div>
                                <strong>最后更新：</strong>
                                {source.last_synced_at
                                  ? new Date(
                                      source.last_synced_at
                                    ).toLocaleString()
                                  : '未知'}
                              </div>
                              {source.source_metadata?.languages && (
                                <div>
                                  <strong>语言分布：</strong>
                                  {Object.entries(
                                    source.source_metadata.languages
                                  )
                                    .map(
                                      ([lang, pct]) =>
                                        `${formatLanguage(lang)} ${pct}%`
                                    )
                                    .join(', ')}
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedSource && (
        <div className="text-muted-foreground text-xs">
          已选择：{selectedSource.name} ({selectedSource.connection_config.branch})
          {selectedSource.source_metadata && (
            <>
              {' '}
              | {selectedSource.source_metadata.total_files || 0} 文件 |{' '}
              {selectedSource.source_metadata.total_functions || 0} 函数
            </>
          )}
        </div>
      )}
    </div>
  )
}
