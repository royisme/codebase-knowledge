import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Search,
  Plus,
  Send,
  FileText,
  Clock,
  GitBranch,
  MessageSquare,
  Brain,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { type RagSession } from '@/types'
import { ragFixtures } from '@/lib/api-mock/fixtures/rag'

// Mock data - will be replaced with real API calls
const mockSessions: RagSession[] = ragFixtures.sessions

interface RAGConsoleProps {
  className?: string
}

export function RAGConsole({ className }: RAGConsoleProps) {
  const [sessions] = useState<RagSession[]>(mockSessions)
  const [selectedSession, setSelectedSession] = useState<RagSession | null>(mockSessions[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !selectedSession) return

    setIsLoading(true)
    // Mock API call - will be replaced with real implementation
    setTimeout(() => {
      setIsLoading(false)
      setInputMessage('')
    }, 1000)
  }

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
              onClick={() => setSelectedSession(session)}
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
            <div className='p-4 border-b'>
              <h1 className='text-xl font-semibold'>{selectedSession.title}</h1>
              <p className='text-sm text-muted-foreground'>
                知识库: {selectedSession.repositoryId}
              </p>
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