import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearch } from '@tanstack/react-router'
import {
  ChevronDown,
  ChevronUp,
  Send,
  Loader2,
  BookMarked,
  Network,
  FileText,
  XCircle,
  Sparkles,
  MessageSquare,
} from 'lucide-react'
import { toast } from 'sonner'
import { useKnowledgeNoteStore } from '@/stores/knowledge-note-store'
import { apiClient } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/lib/api-endpoints'
import { upsertKnowledgeNote } from '@/lib/knowledge-notes-service'
import { useStreamingQuery } from '@/hooks/useStreamingQuery'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/layout/page-header'
import { StreamingMarkdown } from '@/components/streaming-markdown'

interface KnowledgeSource {
  id: string
  name: string
  alias: string
}

const fetchKnowledgeSources = async (): Promise<KnowledgeSource[]> => {
  const data = await apiClient<
    Array<{ id: string; name: string; alias: string }>
  >({
    endpoint: API_ENDPOINTS.knowledge.sources,
  })
  return data.map((s) => ({ id: s.id, name: s.name, alias: s.alias }))
}

export const KnowledgeQueryPage = () => {
  const queryClient = useQueryClient()
  const search = useSearch({
    from: '/_authenticated/knowledge-graph-query',
  }) as {
    sourceId?: string
    question?: string
  }

  const [question, setQuestion] = useState(search.question || '')
  const [selectedSourceId, setSelectedSourceId] = useState(
    search.sourceId || ''
  )
  const [retrievalMode, setRetrievalMode] = useState<
    'graph' | 'vector' | 'hybrid'
  >('hybrid')
  const [topK, setTopK] = useState(8)
  const [timeout, setTimeout] = useState(120) // 增加到 120 秒
  const [showAdvanced, setShowAdvanced] = useState(false)

  const { addNote, addToHistory } = useKnowledgeNoteStore()

  const { data: sources, isLoading: sourcesLoading } = useQuery({
    queryKey: ['knowledge', 'sources'],
    queryFn: fetchKnowledgeSources,
  })

  const { text, entities, metadata, isStreaming, error, query, abort, reset } =
    useStreamingQuery({
      onDone: (_queryId) => {
        const sourceName =
          sources?.find((s) => s.id === selectedSourceId)?.alias || '未知'
        addToHistory({
          question,
          sourceId: selectedSourceId,
          sourceName,
          answer: text,
          executionTimeMs: metadata?.execution_time_ms || 0,
        })
      },
      onError: (error) => {
        if (
          error.message.includes('timeout') ||
          error.message.includes('超时')
        ) {
          toast.warning('模型响应超时，请缩小问题范围或稍后重试。')
        } else {
          toast.error(`查询失败: ${error.message}`)
        }
      },
    })

  const handleSubmit = () => {
    if (!question.trim()) {
      toast.error('请输入问题')
      return
    }
    if (!selectedSourceId) {
      toast.error('请选择知识源')
      return
    }

    query({
      question,
      source_ids: [selectedSourceId],
      retrieval_mode: retrievalMode,
      top_k: topK,
      timeout,
    })
  }

  const handleStop = () => {
    abort()
    toast.info('已停止生成')
  }

  const handleSaveToLibrary = async () => {
    if (!text) return
    if (!selectedSourceId) {
      toast.error('请先选择知识源')
      return
    }

    const source = sources?.find((s) => s.id === selectedSourceId)

    try {
      const noteId = await upsertKnowledgeNote({
        sourceId: selectedSourceId,
        question,
        answerSummary: text,
      })

      addNote({
        id: noteId,
        question,
        answerSummary: text,
        sourceId: selectedSourceId,
        sourceName: source?.alias ?? selectedSourceId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      void queryClient.invalidateQueries({ queryKey: ['knowledge', 'notes'] })
      toast.success('已保存到知识库')
    } catch {
      toast.error('保存失败，请稍后重试')
    }
  }

  const handleNewQuery = () => {
    reset()
    setQuestion('')
  }

  const hasResult = text.length > 0 || entities.length > 0

  return (
    <div className='h-full overflow-y-auto'>
      <div className='mx-auto max-w-7xl space-y-6 pb-6'>
        {/* Header */}
        <PageHeader
          title='智能问答'
          description='基于 GraphRAG 的智能代码问答系统（流式传输）'
          icon={<MessageSquare className='h-6 w-6' />}
        />

        {/* 两栏布局 */}
        <div className='flex flex-col gap-6 lg:flex-row'>
          {/* 左侧主内容区 */}
          <div className='flex-1 space-y-6'>
            {/* 提问表单 */}
        <Card>
          <CardHeader>
            <CardTitle>提出你的问题</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label>选择知识源 *</Label>
              {sourcesLoading ? (
                <Skeleton className='h-10 w-full' />
              ) : (
                <Select
                  value={selectedSourceId}
                  onValueChange={setSelectedSourceId}
                  disabled={isStreaming}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='请选择一个代码仓库' />
                  </SelectTrigger>
                  <SelectContent>
                    {sources?.map((source) => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.alias} ({source.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className='space-y-2'>
              <Label>你的问题 *</Label>
              <Textarea
                placeholder='例如: 支付失败时如何记录审计?'
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={4}
                disabled={isStreaming}
              />
            </div>

            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button variant='ghost' size='sm' disabled={isStreaming}>
                  高级选项
                  {showAdvanced ? (
                    <ChevronUp className='ml-2 h-4 w-4' />
                  ) : (
                    <ChevronDown className='ml-2 h-4 w-4' />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className='space-y-4 pt-4'>
                <div className='grid grid-cols-3 gap-4'>
                  <div className='space-y-2'>
                    <Label>检索模式</Label>
                    <Select
                      value={retrievalMode}
                      onValueChange={(v) =>
                        setRetrievalMode(v as 'graph' | 'vector' | 'hybrid')
                      }
                      disabled={isStreaming}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='hybrid'>混合检索</SelectItem>
                        <SelectItem value='graph'>图检索</SelectItem>
                        <SelectItem value='vector'>向量检索</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <Label>Top-K</Label>
                    <Select
                      value={topK.toString()}
                      onValueChange={(v) => setTopK(Number(v))}
                      disabled={isStreaming}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='5'>5</SelectItem>
                        <SelectItem value='8'>8</SelectItem>
                        <SelectItem value='10'>10</SelectItem>
                        <SelectItem value='15'>15</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <Label>超时时间 (秒)</Label>
                    <Select
                      value={timeout.toString()}
                      onValueChange={(v) => setTimeout(Number(v))}
                      disabled={isStreaming}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='60'>60秒 (快速)</SelectItem>
                        <SelectItem value='120'>120秒 (标准)</SelectItem>
                        <SelectItem value='180'>180秒 (复杂)</SelectItem>
                        <SelectItem value='300'>300秒 (详细)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className='flex gap-2'>
              {isStreaming ? (
                <Button
                  onClick={handleStop}
                  variant='destructive'
                  size='lg'
                  className='flex-1'
                >
                  <XCircle className='mr-2 h-5 w-5' />
                  停止生成
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!question.trim() || !selectedSourceId}
                  size='lg'
                  className='flex-1'
                >
                  <Send className='mr-2 h-5 w-5' />
                  提交问题
                </Button>
              )}
              {hasResult && !isStreaming && (
                <Button onClick={handleNewQuery} variant='outline' size='lg'>
                  新问题
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 错误提示 */}
        {error && (
          <Card className='border-destructive'>
            <CardContent className='pt-6'>
              <div className='text-destructive flex items-start gap-3'>
                <XCircle className='mt-0.5 h-5 w-5' />
                <div>
                  <p className='font-medium'>查询出错</p>
                  <p className='text-sm'>{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 流式结果 */}
        {(hasResult || isStreaming) && (
          <div className='space-y-6'>
            {/* 答案卡片 */}
            <Card>
              <CardHeader>
                <div className='flex items-start justify-between'>
                  <CardTitle className='flex items-center gap-2'>
                    <Sparkles className='text-primary h-5 w-5' />
                    答案
                  </CardTitle>
                  {!isStreaming && text && (
                    <Button onClick={handleSaveToLibrary} size='sm'>
                      <BookMarked className='mr-2 h-4 w-4' />
                      保存到知识库
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <StreamingMarkdown content={text} streaming={isStreaming} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* 空状态 */}
        {!hasResult && !isStreaming && !error && (
          <Card className='border-dashed'>
            <CardContent className='pt-12 pb-12 text-center'>
              <FileText className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
              <h3 className='mb-2 text-lg font-medium'>开始提问</h3>
              <p className='text-muted-foreground mx-auto max-w-md text-sm'>
                选择一个知识源并输入你的问题，系统将通过 GraphRAG
                技术实时生成答案
              </p>
            </CardContent>
          </Card>
        )}
          </div>

          {/* 右侧侧边栏 */}
          <div className='w-full space-y-6 lg:w-80'>
            {/* 查询元数据卡片 */}
            {(hasResult || isStreaming) && (
              <Card className='shadow-sm'>
                <CardHeader className='pb-3'>
                  <CardTitle className='flex items-center gap-2 text-sm font-semibold'>
                    <Sparkles className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                    查询详情
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-2.5 text-xs'>
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground'>执行时间</span>
                    <span className='font-medium text-blue-600 dark:text-blue-400'>
                      {metadata?.execution_time_ms
                        ? `${metadata.execution_time_ms} ms`
                        : '—'}
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground'>检索模式</span>
                    <Badge variant='outline'>
                      {metadata?.retrieval_mode || retrievalMode}
                    </Badge>
                  </div>
                  {metadata?.from_cache && (
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground'>缓存状态</span>
                      <Badge variant='secondary'>已缓存</Badge>
                    </div>
                  )}
                  {metadata?.confidence_score && (
                    <div className='flex items-center justify-between'>
                      <span className='text-muted-foreground'>置信度</span>
                      <Badge variant='secondary'>
                        {(metadata.confidence_score * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  )}
                  {isStreaming && (
                    <div className='mt-2 flex items-center gap-2 text-amber-600 dark:text-amber-400'>
                      <Loader2 className='h-3 w-3 animate-spin' />
                      <span>生成中...</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 关联实体卡片 */}
            {(hasResult || isStreaming) && (
              <Card className='shadow-sm'>
                <CardHeader className='pb-3'>
                  <CardTitle className='flex items-center gap-2 text-sm font-semibold'>
                    <Network className='h-4 w-4 text-emerald-600 dark:text-emerald-400' />
                    关联实体 ({entities.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex max-h-[500px] flex-col gap-3 overflow-y-auto pr-2'>
                    {entities.length > 0 ? (
                      entities.map((entity, idx) => (
                        <div
                          key={idx}
                          className='border-border bg-background rounded-lg border p-3 shadow-sm transition-shadow hover:shadow-md'
                        >
                          <div className='flex items-start justify-between gap-2'>
                            <div className='flex-1'>
                              <h4 className='text-foreground text-sm font-semibold'>
                                {entity.link ? (
                                  <a
                                    href={entity.link}
                                    className='text-primary hover:underline'
                                    target='_blank'
                                    rel='noopener noreferrer'
                                  >
                                    {entity.name || '-'}
                                  </a>
                                ) : (
                                  entity.name || '-'
                                )}
                              </h4>
                              <p className='text-muted-foreground mt-0.5 text-xs'>
                                {entity.type?.toUpperCase()}
                              </p>
                            </div>
                            {entity.importance && (
                              <Badge
                                variant={
                                  entity.importance === 'high'
                                    ? 'default'
                                    : entity.importance === 'medium'
                                      ? 'secondary'
                                      : 'outline'
                                }
                                className='shrink-0 text-[10px]'
                              >
                                {entity.importance === 'high'
                                  ? '高'
                                  : entity.importance === 'medium'
                                    ? '中'
                                    : '低'}
                              </Badge>
                            )}
                          </div>
                          {entity.detail && (
                            <p className='text-muted-foreground mt-2 text-xs leading-relaxed'>
                              {entity.detail}
                            </p>
                          )}
                          {entity.author && (
                            <p className='text-muted-foreground mt-1 text-xs'>
                              作者: {entity.author}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className='border-muted-foreground/30 bg-muted/30 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center'>
                        {isStreaming ? (
                          <>
                            <Loader2 className='h-6 w-6 animate-spin text-blue-600 dark:text-blue-400' />
                            <p className='text-muted-foreground text-xs'>
                              正在检索关联实体...
                            </p>
                          </>
                        ) : (
                          <>
                            <FileText className='text-muted-foreground/70 h-6 w-6' />
                            <p className='text-muted-foreground text-xs'>
                              暂无关联实体
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
