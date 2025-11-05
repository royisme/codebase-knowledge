import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { useRagConsoleStore } from './store'

const IMPORTANCE_STYLES: Record<NonNullable<Entity['importance']>, string> = {
  high: 'border-destructive/40 bg-destructive/10 text-destructive',
  medium: 'border-amber-300 bg-amber-50 text-amber-700',
  low: 'border-muted-foreground/20 bg-muted text-muted-foreground',
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

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const bubbleClasses = cn(
    'max-w-[70%] rounded-xl px-4 py-3 shadow-sm transition-all',
    isUser
      ? 'ml-auto bg-primary text-primary-foreground'
      : 'bg-muted border border-muted-foreground/20 text-muted-foreground-foreground'
  )

  return (
    <div
      className={cn(
        'flex w-full gap-3',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className='bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full'>
          <Sparkles className='text-primary h-4 w-4' />
        </div>
      )}
      <div className={bubbleClasses}>
        <div className='flex items-center gap-3'>
          <span className='text-muted-foreground/80 text-xs font-medium tracking-wide uppercase'>
            {isUser ? '用户' : 'GraphRAG'}
          </span>
          <span className='text-muted-foreground/60 text-[11px]'>
            {formatTime(message.createdAt)}
          </span>
          {!isUser && message.metadata?.confidenceScore !== undefined && (
            <Badge
              variant='outline'
              className='border-primary/40 bg-primary/5 text-primary'
            >
              置信度 {extractConfidence(message.metadata?.confidenceScore)}
            </Badge>
          )}
        </div>
        <p className='text-foreground mt-2 text-sm leading-relaxed whitespace-pre-wrap'>
          {message.content ||
            (message.status === 'streaming' ? '正在生成…' : '无内容')}
        </p>

        {!isUser && message.status === 'streaming' && (
          <div className='text-muted-foreground mt-3 flex items-center gap-2 text-xs'>
            <Loader2 className='h-3 w-3 animate-spin' />
            <span>持续生成中…</span>
          </div>
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
}

interface InsightPanelProps {
  message: RagMessage | null
  isStreaming: boolean
  onQuickAction: (question: string) => void
}

function InsightPanel({
  message,
  isStreaming,
  onQuickAction,
}: InsightPanelProps) {
  const entities = message?.entities ?? []
  const actions = message?.nextActions ?? []
  const metadata = message?.metadata

  return (
    <div className='flex w-full flex-col gap-4'>
      <Card>
        <CardHeader className='pb-4'>
          <CardTitle className='flex items-center gap-2 text-sm font-semibold'>
            <Sparkles className='text-primary h-4 w-4' />
            实时洞察
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <section>
            <h3 className='text-muted-foreground mb-2 text-xs font-semibold uppercase'>
              执行详情
            </h3>
            <div className='border-muted-foreground/20 bg-muted/30 space-y-3 rounded-lg border p-3 text-xs'>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground'>置信度</span>
                <span className='text-foreground font-medium'>
                  {extractConfidence(metadata?.confidenceScore)}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground'>耗时</span>
                <span className='text-foreground font-medium'>
                  {metadata?.processingTimeMs
                    ? `${metadata.processingTimeMs} ms`
                    : '—'}
                </span>
              </div>
              <div>
                <span className='text-muted-foreground'>命中知识源</span>
                <div className='mt-2 flex flex-wrap gap-2'>
                  {(metadata?.sourcesQueried ?? []).length > 0 ? (
                    metadata?.sourcesQueried?.map((source) => (
                      <Badge
                        key={source}
                        variant='outline'
                        className='border-border text-xs'
                      >
                        {source}
                      </Badge>
                    ))
                  ) : (
                    <span className='text-muted-foreground/80'>暂无信息</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className='mb-2 flex items-center justify-between'>
              <h3 className='text-muted-foreground text-xs font-semibold uppercase'>
                快捷追问
              </h3>
              <Badge
                variant='outline'
                className='border-primary/30 text-primary text-[10px]'
              >
                智能推荐
              </Badge>
            </div>
            <div className='flex flex-wrap gap-2'>
              {actions.length > 0 ? (
                actions.map((action) => (
                  <Button
                    key={action}
                    variant='outline'
                    size='sm'
                    disabled={isStreaming}
                    className='border-muted-foreground/40 h-auto border-dashed px-3 py-1 text-xs'
                    onClick={() => onQuickAction(action)}
                  >
                    <Zap className='text-primary mr-2 h-3 w-3' />
                    {action}
                  </Button>
                ))
              ) : (
                <p className='text-muted-foreground/80 text-xs'>
                  当前暂无推荐问题，完成一次查询后将自动生成。
                </p>
              )}
            </div>
          </section>

          <section>
            <h3 className='text-muted-foreground mb-2 text-xs font-semibold uppercase'>
              关联实体
            </h3>
            <div className='flex max-h-64 flex-col gap-3 overflow-y-auto pr-1'>
              {entities.length > 0 ? (
                entities.map((entity, index) => (
                  <div
                    key={`${entity.type}-${entity.name}-${index}`}
                    className='border-muted-foreground/20 bg-background rounded-lg border p-3 shadow-sm'
                  >
                    <div className='flex items-start justify-between gap-2'>
                      <div>
                        <p className='text-foreground text-sm font-semibold'>
                          {entity.name || '-'}
                        </p>
                        <p className='text-muted-foreground text-xs'>
                          {entity.type?.toUpperCase()}
                        </p>
                      </div>
                      {entity.importance && (
                        <span
                          className={cn(
                            'rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase',
                            IMPORTANCE_STYLES[entity.importance]
                          )}
                        >
                          {entity.importance === 'high'
                            ? '高优先级'
                            : entity.importance === 'medium'
                              ? '中等'
                              : '低'}
                        </span>
                      )}
                    </div>
                    {entity.detail && (
                      <p className='text-muted-foreground mt-2 text-xs leading-relaxed'>
                        {entity.detail}
                      </p>
                    )}
                    {entity.link && (
                      <Button
                        asChild
                        variant='ghost'
                        size='sm'
                        className='text-primary mt-2 h-auto px-0 text-xs'
                      >
                        <a href={entity.link}>查看详情 →</a>
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <div className='border-muted-foreground/30 bg-muted/30 flex flex-col items-center justify-center gap-2 rounded-md border border-dashed p-6 text-center'>
                  <FileText className='text-muted-foreground/70 h-6 w-6' />
                  <p className='text-muted-foreground text-xs'>
                    等待查询完成后，将展示关联文件、提交与模块信息。
                  </p>
                </div>
              )}
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}

interface SessionListProps {
  sessions: RagSession[]
  activeSessionId: string | null
  searchQuery: string
  onSearchChange: (value: string) => void
  onCreate: () => void
  onSelect: (sessionId: string) => void
}

function SessionList({
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
    <Card className='w-full'>
      <CardHeader className='space-y-4'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-base font-semibold'>对话列表</CardTitle>
          <Button
            variant='outline'
            size='icon'
            className='h-8 w-8'
            onClick={onCreate}
          >
            <Plus className='h-4 w-4' />
          </Button>
        </div>
        <div className='relative'>
          <Search className='text-muted-foreground absolute top-2.5 left-3 h-4 w-4' />
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
          <div className='space-y-1 p-2'>
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
                      'hover:border-primary/40 hover:bg-primary/5 w-full rounded-lg border border-transparent px-3 py-3 text-left transition',
                      session.id === activeSessionId &&
                        'border-primary/50 bg-primary/5'
                    )}
                  >
                    <div className='flex items-center justify-between'>
                      <span className='text-foreground text-sm font-semibold'>
                        {session.title || '未命名对话'}
                      </span>
                      <span className='text-muted-foreground text-[11px]'>
                        {formatTime(session.updatedAt)}
                      </span>
                    </div>
                    <p className='text-muted-foreground mt-2 line-clamp-2 text-xs'>
                      {lastMessage?.content || '暂无对话内容'}
                    </p>
                  </button>
                )
              })
            ) : (
              <div className='border-muted-foreground/30 bg-muted/30 flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-3 py-6 text-center'>
                <MessageSquare className='text-muted-foreground/70 h-6 w-6' />
                <p className='text-muted-foreground text-sm'>
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
}

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
    onMetadata: (metadata) => {
      if (!sessionRef.current || !messageRef.current) return
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
        timeout: 45,
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
      <div className='w-full lg:w-72'>
        <SessionList
          sessions={sessions}
          activeSessionId={activeSession?.id ?? null}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCreate={handleCreateSession}
          onSelect={(sessionId) => selectSession(sessionId)}
        />
      </div>

      <div className='flex flex-1 flex-col gap-4'>
        <Card className='flex flex-col'>
          <CardHeader className='border-border/50 bg-muted/40 flex flex-col gap-2 border-b'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <div>
                <CardTitle className='text-foreground text-xl font-semibold'>
                  GraphRAG 调试台
                </CardTitle>
                <p className='text-muted-foreground text-sm'>
                  输入问题，实时查看生成过程与关联知识。
                </p>
              </div>
              {isStreaming ? (
                <Button variant='outline' size='sm' onClick={stopStreaming}>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  停止生成
                </Button>
              ) : (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleCreateSession}
                >
                  <Plus className='mr-2 h-4 w-4' />
                  新建对话
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className='flex flex-col gap-4 p-0 lg:flex-row'>
            <div className='flex flex-1 flex-col'>
              <ScrollArea className='h-[calc(100vh-28rem)] p-6'>
                <div className='flex flex-col gap-4'>
                  {activeMessages.length > 0 ? (
                    activeMessages.map((message) => (
                      <MessageBubble key={message.id} message={message} />
                    ))
                  ) : (
                    <div className='border-muted-foreground/30 bg-muted/30 flex h-full flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center'>
                      <Sparkles className='text-primary mb-4 h-10 w-10' />
                      <h3 className='text-foreground text-lg font-semibold'>
                        欢迎使用 GraphRAG 调试台
                      </h3>
                      <p className='text-muted-foreground mt-2 max-w-md text-sm'>
                        输入任何关于代码或知识库的问题，即可实时获取图谱增强回答、关联证据与下一步建议。
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <Separator />

              <div className='space-y-3 p-6 pt-4'>
                {error && (
                  <div className='border-destructive/40 bg-destructive/10 text-destructive flex items-center justify-between rounded-md border px-3 py-2 text-sm'>
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

                <div className='flex items-end gap-3'>
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
                    className='min-h-[90px] flex-1 resize-none'
                  />
                  <Button
                    size='lg'
                    disabled={isStreaming || !composerValue.trim()}
                    onClick={handleSubmit}
                    className='h-[90px] px-4'
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

            <Separator orientation='vertical' className='hidden lg:block' />

            <div className='border-border/50 bg-muted/30 w-full overflow-y-auto border-t p-4 lg:w-80 lg:max-h-[calc(100vh-28rem)] lg:border-t-0 lg:border-l'>
              <InsightPanel
                message={latestAssistantMessage}
                isStreaming={isStreaming}
                onQuickAction={handleQuickAction}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
