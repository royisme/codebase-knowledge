import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react'
import type { Entity } from '@/types/graph-query'
import type { RagMessage, RagSession } from '@/types/rag'
import type { DoneEvent } from '@/types/streaming'
import {
  AlertCircle,
  FileText,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Send,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { cn } from '@/lib/utils'
import { useStreamingQuery } from '@/hooks/useStreamingQuery'
import { GraphRAGResponse } from '@/components/graphrag-response'
import { EvidenceList } from '@/components/evidence-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { useRagConsoleStore } from './store'

const IMPORTANCE_STYLES: Record<NonNullable<Entity['importance']>, string> = {
  high: 'border-emerald-400/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  medium: 'border-amber-300/40 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  low: 'border-muted-foreground/20 bg-muted text-muted-foreground',
}

// 置信度配色方案
const getConfidenceBadgeStyle = (confidence?: number): string => {
  if (!confidence) return 'border-muted-foreground/30 bg-muted/50 text-muted-foreground'
  const score = Math.round(confidence * 100)
  if (score >= 90) return 'border-emerald-400/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
  if (score >= 60) return 'border-blue-400/40 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
  return 'border-muted-foreground/30 bg-muted text-muted-foreground'
}

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })

const extractConfidence = (value?: number) =>
  typeof value === 'number' ? `${Math.round(value * 100)}%` : '—'

interface MessageBubbleProps {
  message: RagMessage
}

const MessageBubble = memo(function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  
  return (
    <div
      className={cn(
        'flex w-full gap-3',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10'>
          <Sparkles className='h-4 w-4 text-blue-600 dark:text-blue-400' />
        </div>
      )}
      <div
        className={cn(
          'max-w-[70%] rounded-2xl px-4 py-3 shadow-sm',
          isUser
            ? 'bg-blue-600 text-white dark:bg-blue-500'
            : 'border border-border bg-card'
        )}
      >
        {/* 消息头部：角色 + 时间 + 置信度 */}
        <div className='flex items-center gap-2 mb-2'>
          <span
            className={cn(
              'text-xs font-medium uppercase tracking-wide',
              isUser ? 'text-blue-100' : 'text-muted-foreground'
            )}
          >
            {isUser ? '用户' : 'GraphRAG'}
          </span>
          <span
            className={cn(
              'text-[11px]',
              isUser ? 'text-blue-200' : 'text-muted-foreground/60'
            )}
          >
            {formatTime(message.createdAt)}
          </span>
          {!isUser && message.metadata?.confidenceScore !== undefined && (
            <Badge
              variant='outline'
              className={getConfidenceBadgeStyle(message.metadata.confidenceScore)}
            >
              置信度 {extractConfidence(message.metadata.confidenceScore)}
            </Badge>
          )}
        </div>

        {/* 消息内容 */}
        {!isUser && message.content ? (
          <>
            <div className='text-sm leading-relaxed text-card-foreground'>
              <GraphRAGResponse
                content={message.content}
                streaming={!isUser && message.status === 'streaming'}
              />
            </div>
            
            {/* 证据来源 */}
            {message.evidence && message.evidence.length > 0 && (
              <div className='mt-4 pt-3 border-t border-border/50'>
                <EvidenceList evidence={message.evidence} />
              </div>
            )}
          </>
        ) : (
          <p
            className={cn(
              'text-sm leading-relaxed whitespace-pre-wrap',
              isUser ? 'text-white' : 'text-foreground'
            )}
          >
            {message.content ||
              (message.status === 'streaming' ? '正在生成…' : '无内容')}
          </p>
        )}

        {message.status === 'error' && message.error && (
          <div className='border-destructive/40 bg-destructive/10 text-destructive mt-3 flex items-center gap-2 rounded-md border px-3 py-2 text-xs'>
            <AlertCircle className='h-3 w-3' />
            <span>{message.error}</span>
          </div>
        )}
      </div>
    </div>
  )
})

interface InsightPanelProps {
  message: RagMessage | null
  isStreaming: boolean
  onQuickAction: (question: string) => void
}

const InsightPanel = memo(function InsightPanel({
  message,
  isStreaming,
  onQuickAction,
}: InsightPanelProps) {
  const entities = message?.entities ?? []
  const actions = message?.nextActions ?? []
  const metadata = message?.metadata

  return (
    <div className='flex w-full flex-col gap-4'>
      {/* 执行详情卡片 */}
      <Card className='shadow-sm'>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2 text-sm font-semibold text-foreground'>
            <Sparkles className='h-4 w-4 text-blue-600 dark:text-blue-400' />
            执行详情
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-2.5 text-xs'>
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground'>置信度</span>
            <Badge
              variant='outline'
              className={getConfidenceBadgeStyle(metadata?.confidenceScore)}
            >
              {extractConfidence(metadata?.confidenceScore)}
            </Badge>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground'>耗时</span>
            <span className='font-medium text-blue-600 dark:text-blue-400'>
              {metadata?.processingTimeMs
                ? `${metadata.processingTimeMs} ms`
                : '—'}
            </span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground'>命中知识源</span>
            <span className='font-medium text-blue-600 dark:text-blue-400'>
              {metadata?.sourcesQueried ?? '—'}
            </span>
          </div>
          {isStreaming && (
            <div className='mt-2 flex items-center gap-2 text-amber-600 dark:text-amber-400'>
              <Loader2 className='h-3 w-3 animate-spin' />
              <span>持续生成中…</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 快速提问卡片 */}
      <Card className='shadow-sm'>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2 text-sm font-semibold text-foreground'>
            <Zap className='h-4 w-4 text-amber-600 dark:text-amber-400' />
            快速提问
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col gap-2'>
            {actions.length > 0 ? (
              actions.map((action, index) => (
                <Button
                  key={index}
                  variant='outline'
                  size='sm'
                  className='justify-start text-left text-xs font-normal hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 dark:hover:bg-blue-950/30 dark:hover:text-blue-400'
                  onClick={() => onQuickAction(action)}
                  disabled={isStreaming}
                >
                  <Zap className='mr-2 h-3 w-3 shrink-0' />
                  <span className='line-clamp-2'>{action}</span>
                </Button>
              ))
            ) : (
              <p className='text-xs text-muted-foreground/80 px-1'>
                当前暂无推荐问题，完成一次查询后将自动生成。
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 关联实体卡片 */}
      <Card className='shadow-sm'>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2 text-sm font-semibold text-foreground'>
            <FileText className='h-4 w-4 text-emerald-600 dark:text-emerald-400' />
            关联实体
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col gap-3 pr-2 max-h-[400px] overflow-y-auto'>
            {entities.length > 0 ? (
                entities.map((entity, index) => (
                  <div
                    key={`${entity.type}-${entity.name}-${index}`}
                    className='rounded-lg border border-border bg-background p-3 shadow-sm hover:shadow-md transition-shadow'
                  >
                    <div className='flex items-start justify-between gap-2'>
                      <div className='flex-1'>
                        <p className='text-sm font-semibold text-foreground'>
                          {entity.name || '-'}
                        </p>
                        <p className='text-xs text-muted-foreground mt-0.5'>
                          {entity.type?.toUpperCase()}
                        </p>
                      </div>
                      {entity.importance && (
                        <span
                          className={cn(
                            'rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase shrink-0',
                            IMPORTANCE_STYLES[entity.importance]
                          )}
                        >
                          {entity.importance === 'high'
                            ? '高'
                            : entity.importance === 'medium'
                              ? '中'
                              : '低'}
                        </span>
                      )}
                    </div>
                    {entity.detail && (
                      <p className='mt-2 text-xs leading-relaxed text-muted-foreground'>
                        {entity.detail}
                      </p>
                    )}
                    {entity.link && (
                      <Button
                        asChild
                        variant='ghost'
                        size='sm'
                        className='mt-2 h-auto px-0 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
                      >
                        <a href={entity.link}>查看详情 →</a>
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <div className='flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-6 text-center'>
                  <FileText className='h-6 w-6 text-muted-foreground/70' />
                  <p className='text-xs text-muted-foreground'>
                    等待查询完成后，将展示关联文件、提交与模块信息。
                  </p>
                </div>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

interface SessionListProps {
  sessions: RagSession[]
  activeSessionId: string | null
  searchQuery: string
  onSearchChange: (value: string) => void
  onCreate: () => void
  onSelect: (sessionId: string) => void
}

const SessionList = memo(function SessionList({
  sessions,
  activeSessionId,
  searchQuery,
  onSearchChange,
  onCreate,
  onSelect,
}: SessionListProps) {
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) {
      return sessions
    }
    return sessions.filter((session) =>
      session.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [sessions, searchQuery])

  return (
    <Card className='shadow-sm bg-slate-50/50 dark:bg-slate-900/30'>
      <CardHeader className='space-y-4 pb-4'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-base font-semibold'>对话列表</CardTitle>
          <Button
            variant='outline'
            size='icon'
            className='h-8 w-8 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 dark:hover:bg-blue-950/30'
            onClick={onCreate}
          >
            <Plus className='h-4 w-4' />
          </Button>
        </div>
        <div className='relative'>
          <Search className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder='搜索历史对话'
            className='pl-9'
          />
        </div>
      </CardHeader>
      <CardContent className='p-0'>
        <ScrollArea className='h-[calc(100vh-28rem)]'>
          <div className='space-y-1.5 p-3'>
            {filteredSessions.length > 0 ? (
              filteredSessions.map((session) => {
                const lastMessage =
                  session.messages[session.messages.length - 1]
                return (
                  <button
                    key={session.id}
                    type='button'
                    onClick={() => onSelect(session.id)}
                    className={cn(
                      'w-full rounded-lg border border-transparent px-3 py-2.5 text-left transition-all hover:border-blue-200 hover:bg-blue-50/50 dark:hover:border-blue-800 dark:hover:bg-blue-950/20',
                      session.id === activeSessionId &&
                        'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/30'
                    )}
                  >
                    <div className='flex items-center justify-between mb-1.5'>
                      <span className='text-sm font-semibold text-foreground line-clamp-1'>
                        {session.title || '未命名对话'}
                      </span>
                      <span className='text-[11px] text-muted-foreground shrink-0 ml-2'>
                        {formatTime(session.updatedAt)}
                      </span>
                    </div>
                    <p className='text-xs text-muted-foreground line-clamp-2'>
                      {lastMessage?.content || '暂无对话内容'}
                    </p>
                  </button>
                )
              })
            ) : (
              <div className='flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 px-3 py-6 text-center'>
                <MessageSquare className='h-6 w-6 text-muted-foreground/70' />
                <p className='text-sm text-muted-foreground'>
                  暂无匹配对话，创建新的交流吧。
                </p>
                <Button size='sm' onClick={onCreate}>
                  <Plus className='mr-2 h-4 w-4' />
                  新建对话
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
})

export function RAGConsole() {
  const {
    sessions,
    selectedSessionId,
    isStreaming,
    error,
    queueUserMessage,
    beginAssistantMessage,
    appendAssistantContent,
    appendAssistantEntity,
    appendAssistantEvidence,
    updateAssistantMetadata,
    finalizeAssistantMessage,
    updateNextActions,
    selectSession,
    createSession,
    registerFailure,
    retryLastMessage,
    resetPending,
    clearError,
  } = useRagConsoleStore(
    useShallow((state) => ({
      sessions: state.sessions,
      selectedSessionId: state.selectedSessionId,
      isStreaming: state.isStreaming,
      error: state.error,
      queueUserMessage: state.queueUserMessage,
      beginAssistantMessage: state.beginAssistantMessage,
      appendAssistantContent: state.appendAssistantContent,
      appendAssistantEntity: state.appendAssistantEntity,
      appendAssistantEvidence: state.appendAssistantEvidence,
      updateAssistantMetadata: state.updateAssistantMetadata,
      finalizeAssistantMessage: state.finalizeAssistantMessage,
      updateNextActions: state.updateNextActions,
      selectSession: state.selectSession,
      createSession: state.createSession,
      registerFailure: state.registerFailure,
      retryLastMessage: state.retryLastMessage,
      resetPending: state.resetPending,
      clearError: state.clearError,
    }))
  )

  const [searchQuery, setSearchQuery] = useState('')
  const [composerValue, setComposerValue] = useState('')

  const activeSession = useMemo(
    () =>
      sessions.find((session) => session.id === selectedSessionId) ??
      sessions[0] ??
      null,
    [sessions, selectedSessionId]
  )
  const activeMessages = useMemo(
    () => activeSession?.messages ?? [],
    [activeSession]
  )
  const latestAssistantMessage = useMemo(() => {
    const assistantMessages = activeMessages.filter(
      (message) => message.role === 'assistant'
    )
    return assistantMessages[assistantMessages.length - 1] ?? null
  }, [activeMessages])

  const sessionRef = useRef<string | null>(null)
  const messageRef = useRef<string | null>(null)

  const { query, abort } = useStreamingQuery({
    onText: (chunk) => {
      if (!sessionRef.current || !messageRef.current) return
      appendAssistantContent(sessionRef.current, messageRef.current, chunk)
    },
    onEntity: (entity) => {
      if (!sessionRef.current || !messageRef.current) return
      appendAssistantEntity(sessionRef.current, messageRef.current, entity)
    },
    onEvidence: (evidence) => {
      if (!sessionRef.current || !messageRef.current) return
      appendAssistantEvidence(sessionRef.current, messageRef.current, evidence)
    },
    onMetadata: (metadata) => {
      if (!sessionRef.current || !messageRef.current || !metadata) return
      updateAssistantMetadata(sessionRef.current, messageRef.current, {
        confidenceScore: metadata.confidence_score,
        processingTimeMs: metadata.execution_time_ms,
        sourcesQueried: metadata.sources_queried,
      })
    },
    onDone: (event: DoneEvent) => {
      if (!sessionRef.current || !messageRef.current) return
      finalizeAssistantMessage(sessionRef.current, messageRef.current, {
        queryId: event.query_id,
        actions: event.next_actions ?? [],
        confidenceScore: event.confidence_score,
        processingTimeMs: event.processing_time_ms,
        sourcesQueried: event.sources_queried,
        summary: event.summary,
      })
      updateNextActions(
        sessionRef.current,
        messageRef.current,
        event.next_actions ?? []
      )
      resetPending()
      sessionRef.current = null
      messageRef.current = null
    },
    onError: (event) => {
      registerFailure(event.message)
      sessionRef.current = null
      messageRef.current = null
    },
  })

  useEffect(() => {
    if (!selectedSessionId && sessions.length > 0) {
      const targetId = sessions[0].id
      if (targetId !== selectedSessionId) {
        selectSession(targetId)
      }
    }
  }, [selectSession, selectedSessionId, sessions])

  const handleCreateSession = useCallback(() => {
    const sessionId = createSession()
    setSearchQuery('')
    sessionRef.current = null
    messageRef.current = null
    setComposerValue('')
    selectSession(sessionId)
  }, [createSession, selectSession])

  const executeQuery = useCallback(
    (question: string) => {
      const trimmed = question.trim()
      if (!trimmed) {
        return
      }

      const queued = queueUserMessage(trimmed)
      if (!queued) {
        return
      }
      const assistant = beginAssistantMessage(queued.sessionId)
      if (!assistant) {
        registerFailure('无法创建对话，请稍后重试。')
        return
      }

      sessionRef.current = queued.sessionId
      messageRef.current = assistant.messageId
      setComposerValue('')
      clearError()

      void query({
        question: trimmed,
        source_ids: [],
        retrieval_mode: 'hybrid',
        top_k: 8,
        timeout: 120, // 2 分钟超时
        session_id: queued.sessionId,
      })
    },
    [
      beginAssistantMessage,
      clearError,
      query,
      queueUserMessage,
      registerFailure,
    ]
  )

  const handleSubmit = useCallback(() => {
    if (isStreaming) {
      return
    }
    executeQuery(composerValue)
  }, [composerValue, executeQuery, isStreaming])

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> =
    useCallback(
      (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault()
          handleSubmit()
        }
      },
      [handleSubmit]
    )

  const handleRetry = useCallback(() => {
    const pending = retryLastMessage()
    if (!pending) {
      return
    }
    executeQuery(pending.message)
  }, [executeQuery, retryLastMessage])

  const handleQuickAction = useCallback(
    (question: string) => {
      if (isStreaming) return
      executeQuery(question)
    },
    [executeQuery, isStreaming]
  )

  const stopStreaming = useCallback(() => {
    abort()
    registerFailure('已手动终止流式回答。')
    sessionRef.current = null
    messageRef.current = null
  }, [abort, registerFailure])

  return (
    <div className='flex flex-col gap-4 lg:flex-row'>
      {/* 左侧对话列表 */}
      <div className='w-full lg:w-60'>
        <SessionList
          sessions={sessions}
          activeSessionId={activeSession?.id ?? null}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCreate={handleCreateSession}
          onSelect={(sessionId) => selectSession(sessionId)}
        />
      </div>

      {/* 中间主内容区 */}
      <div className='flex flex-1 flex-col gap-4'>
        <Card className='flex flex-col shadow-sm'>
          {/* 顶部标题栏 */}
          <CardHeader className='border-b border-border/50 bg-gradient-to-r from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-blue-950/20'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <div>
                <CardTitle className='text-xl font-semibold text-foreground'>
                  GraphRAG 调试台
                </CardTitle>
                <p className='text-sm text-muted-foreground mt-1'>
                  输入问题，实时查看生成过程与关联知识。
                </p>
              </div>
              {isStreaming ? (
                <Button 
                  variant='outline' 
                  size='sm' 
                  onClick={stopStreaming}
                  className='border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30'
                >
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  停止生成
                </Button>
              ) : (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleCreateSession}
                  className='hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 dark:hover:bg-blue-950/30'
                >
                  <Plus className='mr-2 h-4 w-4' />
                  新建对话
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className='flex flex-col p-0'>
            {/* 聊天区域 */}
            <div className='flex flex-1 flex-col bg-background'>
              <ScrollArea className='h-[calc(100vh-28rem)] px-6 py-4'>
                <div className='flex flex-col gap-3'>
                  {activeMessages.length > 0 ? (
                    activeMessages.map((message) => (
                      <MessageBubble key={message.id} message={message} />
                    ))
                  ) : (
                    <div className='flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 py-20 text-center'>
                      <Sparkles className='mb-4 h-10 w-10 text-blue-600 dark:text-blue-400' />
                      <h3 className='text-lg font-semibold text-foreground'>
                        欢迎使用 GraphRAG 调试台
                      </h3>
                      <p className='mt-2 max-w-md text-sm text-muted-foreground'>
                        输入任何关于代码或知识库的问题，即可实时获取图谱增强回答、关联证据与下一步建议。
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <Separator />

              {/* 输入区域 - 优化间距 */}
              <div className='space-y-3 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/30'>
                {error && (
                  <div className='flex items-center justify-between rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive'>
                    <div className='flex items-center gap-2'>
                      <AlertCircle className='h-4 w-4' />
                      <span>{error}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Button variant='outline' size='sm' onClick={handleRetry}>
                        重新发送
                      </Button>
                      <Button variant='ghost' size='sm' onClick={clearError}>
                        忽略
                      </Button>
                    </div>
                  </div>
                )}

                <div className='flex items-end gap-2.5'>
                  <Textarea
                    value={composerValue}
                    onChange={(event) => setComposerValue(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      isStreaming
                        ? '等待当前回答完成…'
                        : '请输入问题，按 Enter 发送（Shift + Enter 换行）'
                    }
                    disabled={isStreaming}
                    className='min-h-[80px] flex-1 resize-none'
                  />
                  <Button
                    size='lg'
                    disabled={isStreaming || !composerValue.trim()}
                    onClick={handleSubmit}
                    className='h-[80px] w-[80px] rounded-xl'
                  >
                    {isStreaming ? (
                      <Loader2 className='h-5 w-5 animate-spin' />
                    ) : (
                      <Send className='h-5 w-5' />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 右侧洞察面板 - 独立侧边栏 */}
      <div className='w-full lg:w-80'>
        <div className='sticky top-4'>
          <InsightPanel
            message={latestAssistantMessage}
            isStreaming={isStreaming}
            onQuickAction={handleQuickAction}
          />
        </div>
      </div>
    </div>
  )
}
