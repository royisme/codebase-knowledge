import { useCallback, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Search,
  Plus,
  Send,
  FileText,
  Clock,
  GitBranch,
  MessageSquare,
  Brain,
  Loader2,
  Info,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { type RagSession } from '@/types'
import { buildAssistantMessage, useRagChatStore } from './store'

interface RAGConsoleProps {
  className?: string
}

export function RAGConsole({ className }: RAGConsoleProps) {
  const sessions = useRagChatStore((state) => state.sessions)
  const selectedSessionId = useRagChatStore((state) => state.selectedSessionId)
  const selectSession = useRagChatStore((state) => state.selectSession)
  const queueUserMessage = useRagChatStore((state) => state.queueUserMessage)
  const completeAssistantMessage = useRagChatStore((state) => state.completeAssistantMessage)
  const registerFailure = useRagChatStore((state) => state.registerFailure)
  const retryLastMessage = useRagChatStore((state) => state.retryLastMessage)
  const isLoading = useRagChatStore((state) => state.isLoading)
  const error = useRagChatStore((state) => state.error)
  const lastQueryIds = useRagChatStore((state) => state.lastQueryIds)
  const pendingMessage = useRagChatStore((state) => state.pendingMessage)
  const [searchQuery, setSearchQuery] = useState('')
  const [inputMessage, setInputMessage] = useState('')

  const selectedSession = useMemo<RagSession | null>(() => {
    if (!selectedSessionId) {
      return null
    }

    return sessions.find((session) => session.id === selectedSessionId) ?? null
  }, [selectedSessionId, sessions])

  const lastQueryId = useMemo(() => {
    if (!selectedSessionId) {
      return null
    }

    return lastQueryIds[selectedSessionId] ?? null
  }, [lastQueryIds, selectedSessionId])

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const mockGraphQuery = useCallback(async (content: string) => {
    await new Promise((resolve) => setTimeout(resolve, 800))

    return `这是针对「${content}」的示例回答。后端接入 GraphRAG 服务后会返回真实结果，并附带 query_id。`
  }, [])

  const handleSendMessage = useCallback(async () => {
    const trimmed = inputMessage.trim()
    if (!trimmed) {
      return
    }

    const queued = queueUserMessage(trimmed)
    if (!queued) {
      return
    }

    setInputMessage('')

    try {
      const responseContent = await mockGraphQuery(trimmed)
      const assistantMessage = buildAssistantMessage(responseContent)
      const nextQueryId = `graph-query-${assistantMessage.id}`

      completeAssistantMessage({
        sessionId: queued.sessionId,
        message: assistantMessage,
        lastQueryId: nextQueryId,
      })
    } catch (err) {
      registerFailure(err instanceof Error ? err.message : '请求失败，请稍后重试')
    }
  }, [completeAssistantMessage, inputMessage, mockGraphQuery, queueUserMessage, registerFailure])

  const handleRetry = useCallback(async () => {
    const pending = retryLastMessage()
    if (!pending) {
      return
    }

    try {
      const responseContent = await mockGraphQuery(pending.message)
      const assistantMessage = buildAssistantMessage(responseContent)
      const nextQueryId = `graph-query-${assistantMessage.id}`

      completeAssistantMessage({
        sessionId: pending.sessionId,
        message: assistantMessage,
        lastQueryId: nextQueryId,
      })
    } catch (err) {
      registerFailure(err instanceof Error ? err.message : '请求失败，请稍后重试')
    }
  }, [completeAssistantMessage, mockGraphQuery, registerFailure, retryLastMessage])

  return (
    <div className={cn('flex h-full gap-4', className)}>
      {/* Left Sidebar - Session List */}
      <div className='w-80 flex flex-col border-r'>
        <div className='p-4 border-b'>
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-2'>
              <Brain className='h-5 w-5' />
              <h2 className='font-semibold'>RAG 会话</h2>
            </div>
            <Button size='sm' variant='outline'>
              <Plus className='h-4 w-4 mr-1' />
              新建
            </Button>
          </div>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='搜索会话...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-10'
            />
          </div>
        </div>

        <ScrollArea className='flex-1 p-2'>
          {filteredSessions.map((session) => (
            <button
              key={session.id}
              onClick={() => selectSession(session.id)}
              className={cn(
                'w-full text-left p-3 rounded-lg mb-2 transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                selectedSession?.id === session.id && 'bg-accent text-accent-foreground'
              )}
            >
              <div className='flex items-start justify-between'>
                <div className='flex-1 min-w-0'>
                  <h3 className='font-medium truncate'>{session.title}</h3>
                  <p className='text-sm text-muted-foreground mt-1'>
                    {session.messages.length} 条消息
                  </p>
                </div>
                <div className='flex flex-col items-end text-xs text-muted-foreground ml-2'>
                  <Clock className='h-3 w-3' />
                  {new Date(session.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </button>
          ))}
        </ScrollArea>
      </div>

      {/* Middle Column - Chat Interface */}
      <div className='flex-1 flex flex-col'>
        {selectedSession ? (
          <>
            <div className='p-4 border-b flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between'>
              <div>
                <h1 className='text-xl font-semibold'>{selectedSession.title}</h1>
                <p className='text-sm text-muted-foreground'>
                  知识库: {selectedSession.repositoryId}
                </p>
              </div>
              {lastQueryId && (
                <Badge variant='secondary' className='self-start'>
                  最近 query_id: {lastQueryId}
                </Badge>
              )}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant='ghost' size='sm' className='gap-2 self-start lg:self-auto'>
                    <Info className='h-4 w-4' />
                    使用说明
                  </Button>
                </PopoverTrigger>
                <PopoverContent align='end' className='w-80 text-sm leading-relaxed'>
                  <p className='font-medium mb-2'>GraphRAG 多轮查询提示</p>
                  <ol className='list-decimal list-inside space-y-2 text-muted-foreground'>
                    <li>首轮提问后会返回 <code>query_id</code>，继续追问会自动回传该 ID。</li>
                    <li>命中缓存时答案会参考上一轮的摘要和关联实体，帮助保持上下文。</li>
                    <li>缓存默认保留 10 分钟，可在后端通过 <code>GRAPHRAG_QUERY_CACHE_TTL_SECONDS</code> 调整。</li>
                    <li>若看到“上下文失效”提示，可重新开始或继续追问，系统会自动恢复。</li>
                  </ol>
                  <p className='mt-3 text-xs text-muted-foreground'>详见 <code>docs/frontend/graph-query.md</code> 获取完整指南。</p>
                </PopoverContent>
              </Popover>
            </div>

            <ScrollArea className='flex-1 p-4'>
              <div className='space-y-4'>
                {selectedSession.messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[70%] rounded-lg p-3',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      <p className='text-sm'>{message.content}</p>
                      <p className='text-xs opacity-70 mt-1'>
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className='flex justify-start'>
                    <div className='bg-muted rounded-lg p-3'>
                      <Loader2 className='h-4 w-4 animate-spin' />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className='p-4 border-t'>
              {error && (
                <div className='mb-3 flex items-center justify-between rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive'>
                  <div className='flex items-center gap-2'>
                    <AlertCircle className='h-4 w-4' />
                    <span>{error}</span>
                  </div>
                  {pendingMessage && (
                    <Button variant='outline' size='sm' onClick={handleRetry}>
                      重新发送
                    </Button>
                  )}
                </div>
              )}
              <div className='flex gap-2'>
                <Input
                  placeholder='输入您的问题...'
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className='flex-1'
                />
                <Button onClick={handleSendMessage} disabled={isLoading}>
                  <Send className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className='flex-1 flex items-center justify-center'>
            <div className='text-center space-y-4'>
              <MessageSquare className='h-12 w-12 mx-auto text-muted-foreground' />
              <h3 className='text-lg font-medium'>选择一个会话开始</h3>
              <p className='text-sm text-muted-foreground'>
                从左侧选择一个现有会话，或创建新的会话开始 RAG 查询
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Evidence Panel */}
      <div className='w-80 flex flex-col border-l'>
        <div className='p-4 border-b'>
          <div className='flex items-center gap-2'>
            <FileText className='h-5 w-5' />
            <h2 className='font-semibold'>证据来源</h2>
          </div>
        </div>

        <ScrollArea className='flex-1 p-4'>
          {selectedSession?.messages
            .filter(msg => msg.citations && msg.citations.length > 0)
            .map((message) => (
              <div key={message.id} className='mb-6'>
                <h4 className='font-medium text-sm mb-3 text-muted-foreground'>
                  回答证据
                </h4>
                <div className='space-y-2'>
                  {message.citations?.map((citation) => (
                    <Card key={citation.id} className='p-3'>
                      <div className='flex items-start justify-between mb-2'>
                        <div className='flex-1 min-w-0'>
                          <p className='font-medium text-sm truncate'>
                            {citation.label}
                          </p>
                          <p className='text-xs text-muted-foreground mt-1 truncate'>
                            {citation.resourceUri}
                          </p>
                        </div>
                        <Badge variant='secondary' className='ml-2'>
                          {Math.round(citation.score * 100)}%
                        </Badge>
                      </div>
                      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                        <GitBranch className='h-3 w-3' />
                        <span>相关度: {citation.score.toFixed(2)}</span>
                      </div>
                    </Card>
                  ))}
                </div>
                <Separator className='mt-4' />
              </div>
            ))}

          {(!selectedSession || !selectedSession.messages.some(msg => msg.citations && msg.citations.length > 0)) && (
            <div className='text-center space-y-3 py-8'>
              <FileText className='h-8 w-8 mx-auto text-muted-foreground' />
              <p className='text-sm text-muted-foreground'>
                暂无证据来源
              </p>
              <p className='text-xs text-muted-foreground'>
                AI 回答时会显示支撑证据和引用来源
              </p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
