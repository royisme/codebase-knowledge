import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import {
  Search,
  Database,
  GitBranch,
  Clock,
  Users,
  MessageCircleQuestion,
  AlertTriangle,
  Compass,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/lib/api-endpoints'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/layout/page-header'

// 匹配后端 /api/v1/knowledge/sources 返回的数据结构
interface KnowledgeSource {
  id: string
  name: string
  alias: string
  description?: string
  branch: string
  language: string
  tags: string[]
  status: 'healthy' | 'outdated' | 'indexing' | 'failed'
  lastFullIndex: string | null
  lastIncremental: string | null
  lastSyncedAt: string | null
  createdAt: string
  updatedAt: string
  maintainers: Array<{ name: string; email: string }>
  recommendedQuestions: string[]
  isActive: boolean
  queryCount7d: number
  nodeCount: number | null
  relationCount: number | null
}

const fetchKnowledgeSources = async (): Promise<KnowledgeSource[]> => {
  return apiClient<KnowledgeSource[]>({
    endpoint: API_ENDPOINTS.knowledge.sources,
  })
}

const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<
    string,
    {
      variant: 'default' | 'secondary' | 'outline' | 'destructive'
      label: string
    }
  > = {
    healthy: { variant: 'default', label: '健康' },
    outdated: { variant: 'secondary', label: '过期' },
    indexing: { variant: 'outline', label: '索引中' },
    failed: { variant: 'destructive', label: '失败' },
  }

  const config = variants[status] || variants.healthy
  return <Badge variant={config.variant}>{config.label}</Badge>
}

const isIndexOutdated = (lastSyncedAt?: string | null): boolean => {
  if (!lastSyncedAt) return true
  const daysDiff =
    (new Date().getTime() - new Date(lastSyncedAt).getTime()) /
    (1000 * 60 * 60 * 24)
  return daysDiff > 7
}

export const KnowledgeExplorePage = () => {
  const navigate = useNavigate()
  const search = useSearch({ from: '/_authenticated/knowledge-explore' }) as {
    sourceId?: string
  }

  const [searchText, setSearchText] = useState('')
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(
    search.sourceId || null
  )

  const {
    data: sources,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['knowledge', 'sources'],
    queryFn: fetchKnowledgeSources,
  })

  // Show error toast when query fails
  useEffect(() => {
    if (error) {
      toast.error('加载知识源失败，请稍后重试')
    }
  }, [error])

  const filteredSources = sources?.filter((source) => {
    if (!source) return false
    if (!searchText) return true
    const lower = searchText.toLowerCase()
    return (
      source.name?.toLowerCase().includes(lower) ||
      source.alias?.toLowerCase().includes(lower) ||
      source.description?.toLowerCase().includes(lower) ||
      source.tags?.some((tag) => tag.toLowerCase().includes(lower))
    )
  })

  const selectedSource = sources?.find((s) => s.id === selectedSourceId)

  const handleQuestionClick = (question: string) => {
    navigate({
      to: '/knowledge-graph-query',
      search: { sourceId: selectedSourceId, question },
    })
  }

  const handleAskQuestion = () => {
    navigate({
      to: '/knowledge-graph-query',
      search: { sourceId: selectedSourceId },
    })
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <PageHeader
        title='知识源导航'
        description='浏览可用的代码仓库，选择后查看详情与推荐问题'
        icon={<Compass className='h-6 w-6' />}
      />

      {/* Content - 左右分栏 */}
      <div className='flex gap-6'>
        {/* 左侧列表 */}
        <div className='flex w-80 flex-shrink-0 flex-col gap-4'>
          <div className='relative'>
            <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
            <Input
              placeholder='搜索知识源...'
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className='pl-10'
            />
          </div>

          <ScrollArea className='h-[calc(100vh-280px)]'>
            <div className='space-y-2 pr-4'>
              {error ? (
                <Card className='border-destructive'>
                  <CardContent className='py-8 text-center'>
                    <AlertTriangle className='text-destructive mx-auto mb-2 h-12 w-12' />
                    <p className='text-destructive mb-2 font-medium'>
                      加载知识源失败
                    </p>
                    <p className='text-muted-foreground text-sm'>
                      {error instanceof Error ? error.message : '未知错误'}
                    </p>
                  </CardContent>
                </Card>
              ) : isLoading ? (
                <>
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className='h-24 w-full' />
                  ))}
                </>
              ) : filteredSources && filteredSources.length > 0 ? (
                filteredSources.map((source) => {
                  if (!source) return null

                  return (
                    <Card
                      key={source.id}
                      className={`cursor-pointer transition-all ${
                        selectedSourceId === source.id
                          ? 'border-primary shadow-sm'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedSourceId(source.id)}
                    >
                      <CardContent className='p-4'>
                        <div className='flex items-start justify-between gap-2'>
                          <div className='min-w-0 flex-1'>
                            <div className='mb-1 flex items-center gap-2'>
                              <h4 className='truncate font-medium'>
                                {source.alias || source.name || '未命名'}
                              </h4>
                            </div>
                            <p className='text-muted-foreground truncate text-xs'>
                              {source.name || '无描述'}
                            </p>
                          </div>
                          <StatusBadge status={source.status} />
                        </div>
                        <div className='text-muted-foreground mt-2 flex items-center gap-2 text-xs'>
                          <Database className='h-3 w-3' />
                          <span>{source.language || '未知'}</span>
                          <span>·</span>
                          <span>{source.queryCount7d || 0} 次提问</span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              ) : (
                <Card className='border-dashed'>
                  <CardContent className='py-8 text-center'>
                    <Database className='text-muted-foreground/50 mx-auto mb-2 h-12 w-12' />
                    <p className='text-muted-foreground text-sm'>
                      {searchText ? '未找到匹配的知识源' : '暂无知识源'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* 右侧详情 */}
        <div className='flex min-w-0 flex-1 flex-col'>
          {!selectedSource ? (
            <Card className='flex h-full items-center justify-center border-2 border-dashed'>
              <CardContent className='py-12 text-center'>
                <Database className='text-muted-foreground/50 mx-auto mb-4 h-16 w-16' />
                <p className='text-muted-foreground text-lg'>
                  请从左侧选择一个知识源查看详情
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className='h-[calc(100vh-280px)]'>
              <div className='space-y-6 pr-4'>
                {/* 基本信息 */}
                <Card>
                  <CardHeader>
                    <div className='flex items-start justify-between'>
                      <div>
                        <CardTitle className='text-2xl'>
                          {selectedSource.alias || selectedSource.name}
                        </CardTitle>
                        <p className='text-muted-foreground mt-1 text-sm'>
                          {selectedSource.name}
                        </p>
                      </div>
                      <StatusBadge status={selectedSource.status} />
                    </div>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    {selectedSource.description && (
                      <div>
                        <h4 className='mb-2 text-sm font-medium'>仓库简介</h4>
                        <p className='text-muted-foreground text-sm'>
                          {selectedSource.description}
                        </p>
                      </div>
                    )}

                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <div className='text-muted-foreground mb-1 flex items-center gap-2 text-sm'>
                          <GitBranch className='h-4 w-4' />
                          <span>分支</span>
                        </div>
                        <p className='text-sm font-medium'>
                          {selectedSource.branch || '未知'}
                        </p>
                      </div>
                      <div>
                        <div className='text-muted-foreground mb-1 flex items-center gap-2 text-sm'>
                          <Database className='h-4 w-4' />
                          <span>语言</span>
                        </div>
                        <p className='text-sm font-medium'>
                          {selectedSource.language || '未知'}
                        </p>
                      </div>
                      <div>
                        <div className='text-muted-foreground mb-1 flex items-center gap-2 text-sm'>
                          <Clock className='h-4 w-4' />
                          <span>最后更新</span>
                        </div>
                        <p className='text-sm font-medium'>
                          {selectedSource.lastSyncedAt
                            ? new Date(
                                selectedSource.lastSyncedAt
                              ).toLocaleString('zh-CN')
                            : '未知'}
                        </p>
                      </div>
                      <div>
                        <div className='text-muted-foreground mb-1 flex items-center gap-2 text-sm'>
                          <Clock className='h-4 w-4' />
                          <span>创建时间</span>
                        </div>
                        <p className='text-sm font-medium'>
                          {selectedSource.createdAt
                            ? new Date(selectedSource.createdAt).toLocaleString(
                                'zh-CN'
                              )
                            : '未知'}
                        </p>
                      </div>
                    </div>

                    {selectedSource.nodeCount !== null &&
                      selectedSource.relationCount !== null && (
                        <div className='border-t pt-4'>
                          <div className='flex items-center gap-6 text-sm'>
                            <div>
                              <span className='text-muted-foreground'>
                                节点数:{' '}
                              </span>
                              <span className='font-medium'>
                                {selectedSource.nodeCount.toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className='text-muted-foreground'>
                                关系数:{' '}
                              </span>
                              <span className='font-medium'>
                                {selectedSource.relationCount.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                    {selectedSource.tags && selectedSource.tags.length > 0 && (
                      <div>
                        <h4 className='mb-2 text-sm font-medium'>标签</h4>
                        <div className='flex flex-wrap gap-2'>
                          {selectedSource.tags.map((tag) => (
                            <Badge key={tag} variant='outline'>
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedSource.maintainers &&
                      selectedSource.maintainers.length > 0 && (
                        <div>
                          <div className='mb-2 flex items-center gap-2 text-sm font-medium'>
                            <Users className='h-4 w-4' />
                            <span>维护人</span>
                          </div>
                          <div className='space-y-1'>
                            {selectedSource.maintainers.map((maintainer) => (
                              <div
                                key={maintainer.email}
                                className='text-muted-foreground text-sm'
                              >
                                {maintainer.name} · {maintainer.email}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </CardContent>
                </Card>

                {/* 索引状态提醒 */}
                {(isIndexOutdated(selectedSource.lastSyncedAt) ||
                  selectedSource.status === 'failed' ||
                  !selectedSource.isActive) && (
                  <Card className='border-yellow-200 bg-yellow-50'>
                    <CardContent className='pt-6'>
                      <div className='flex items-start gap-3'>
                        <AlertTriangle className='mt-0.5 h-5 w-5 text-yellow-600' />
                        <div>
                          <h4 className='font-medium text-yellow-900'>
                            索引状态异常
                          </h4>
                          <p className='mt-1 text-sm text-yellow-700'>
                            {selectedSource.status === 'failed'
                              ? '索引任务失败，请联系管理员处理'
                              : !selectedSource.isActive
                                ? '该知识源已被禁用，请联系管理员处理'
                                : '索引已过期超过 7 天，本次回答可能缺少最新代码'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 推荐问题 */}
                <Card>
                  <CardHeader>
                    <div className='flex items-center gap-2'>
                      <MessageCircleQuestion className='h-5 w-5' />
                      <CardTitle>推荐问题</CardTitle>
                    </div>
                    <p className='text-muted-foreground text-sm'>
                      点击问题直接跳转到问答页面
                    </p>
                  </CardHeader>
                  <CardContent className='space-y-2'>
                    {selectedSource.recommendedQuestions &&
                    selectedSource.recommendedQuestions.length > 0 ? (
                      selectedSource.recommendedQuestions.map(
                        (question, idx) => (
                          <Button
                            key={idx}
                            variant='outline'
                            className='h-auto w-full justify-start px-4 py-3 text-left'
                            onClick={() => handleQuestionClick(question)}
                          >
                            <span className='text-muted-foreground mr-2'>
                              {idx + 1}.
                            </span>
                            {question}
                          </Button>
                        )
                      )
                    ) : (
                      <p className='text-muted-foreground text-sm'>
                        暂无推荐问题
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* 操作按钮 */}
                <div className='flex gap-3'>
                  <Button
                    size='lg'
                    className='flex-1'
                    onClick={handleAskQuestion}
                  >
                    <MessageCircleQuestion className='mr-2 h-5 w-5' />
                    立即提问
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  )
}
