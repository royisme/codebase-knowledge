import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BookMarked,
  Clock,
  Copy,
  Trash2,
  Database,
  MessageCircleQuestion,
  Library as LibraryIcon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { useKnowledgeNoteStore } from '@/stores/knowledge-note-store'
import {
  deleteKnowledgeNote,
  listKnowledgeNotes,
  type KnowledgeNoteDTO,
} from '@/lib/knowledge-notes-service'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ErrorState } from '@/components/ui/error-state'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/layout/page-header'
import { StreamingMarkdown } from '@/components/streaming-markdown'

export const KnowledgeLibraryPage = () => {
  const queryClient = useQueryClient()
  const { notes, history, setNotes, removeNote, clearNotes, clearHistory } =
    useKnowledgeNoteStore()
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null)
  const [showClearDialog, setShowClearDialog] = useState<
    'notes' | 'history' | null
  >(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const notesQuery = useQuery<KnowledgeNoteDTO[], Error>({
    queryKey: ['knowledge', 'notes'] as const,
    queryFn: async () => {
      const data = await listKnowledgeNotes()
      setNotes(
        data.map((item) => ({
          id: item.id,
          question: item.question,
          answerSummary: item.answerSummary,
          sourceId: item.sourceId ?? null,
          sourceName: item.sourceId ?? undefined,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          tags: item.tags,
          note: item.note ?? null,
        }))
      )
      return data
    },
  })

  useEffect(() => {
    if (notesQuery.isError) {
      toast.error('加载收藏数据失败，已回退至本地缓存')
    }
  }, [notesQuery.isError])

  const noteList = notes

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleCopyAnswer = (answer: string) => {
    navigator.clipboard.writeText(answer)
    toast.success('已复制到剪贴板')
  }

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteKnowledgeNote(id)
      removeNote(id)
      void queryClient.invalidateQueries({ queryKey: ['knowledge', 'notes'] })
      toast.success('已删除收藏')
    } catch {
      toast.error('删除收藏失败，请稍后重试')
    } finally {
      setDeleteNoteId(null)
    }
  }

  const handleClearAll = async () => {
    if (showClearDialog === 'notes') {
      try {
        await Promise.all(noteList.map((note) => deleteKnowledgeNote(note.id)))
        clearNotes()
        void queryClient.invalidateQueries({ queryKey: ['knowledge', 'notes'] })
        toast.success('已清空所有收藏')
      } catch {
        toast.error('清空收藏失败，请稍后重试')
      }
    } else if (showClearDialog === 'history') {
      clearHistory()
      toast.success('已清空历史记录')
    }
    setShowClearDialog(null)
  }

  return (
    <div className='h-full overflow-y-auto'>
      <div className='mx-auto max-w-7xl space-y-8'>
        <PageHeader
          title='知识摘录'
          description='管理您的代码知识摘录和提问历史'
          icon={<BookMarked className='h-6 w-6' />}
        />

        <Tabs defaultValue='history' className='w-full'>
          <TabsList className='grid w-full max-w-md grid-cols-2'>
            <TabsTrigger value='history'>
              <Clock className='mr-2 h-4 w-4' />
              最近提问 ({history.length})
            </TabsTrigger>
            <TabsTrigger value='notes'>
              <BookMarked className='mr-2 h-4 w-4' />
              收藏条目 ({noteList.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value='history' className='mt-6'>
            <div className='mb-4 flex items-center justify-between'>
              <p className='text-muted-foreground text-sm'>
                展示最近 100 条提问记录
              </p>
              {history.length > 0 && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setShowClearDialog('history')}
                >
                  清空历史
                </Button>
              )}
            </div>

            {history.length === 0 ? (
              <Card>
                <CardContent className='flex flex-col items-center justify-center py-12'>
                  <MessageCircleQuestion className='text-muted-foreground mb-4 h-12 w-12' />
                  <p className='text-muted-foreground'>暂无提问历史</p>
                  <p className='text-muted-foreground mt-1 text-sm'>
                    前往代码问答页面开始你的第一个提问
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className='space-y-3'>
                {history.map((item) => {
                  const isExpanded = expandedItems.has(item.id)
                  return (
                    <Card key={item.id}>
                      <CardHeader>
                        <div className='flex items-start justify-between gap-4'>
                          <div className='min-w-0 flex-1'>
                            <div className='mb-2 flex items-center gap-2'>
                              <Database className='text-muted-foreground h-4 w-4 flex-shrink-0' />
                              <span className='text-muted-foreground text-sm'>
                                {item.sourceName}
                              </span>
                              <span className='text-muted-foreground text-sm'>
                                ·
                              </span>
                              <span className='text-muted-foreground text-xs'>
                                {new Date(item.timestamp).toLocaleString(
                                  'zh-CN'
                                )}
                              </span>
                            </div>
                            <CardTitle className='text-base'>
                              {item.question}
                            </CardTitle>
                          </div>
                          <Badge variant='outline'>
                            {item.executionTimeMs}ms
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Collapsible
                          open={isExpanded}
                          onOpenChange={() => toggleExpanded(item.id)}
                        >
                          <div className='relative'>
                            <div
                              className={
                                isExpanded ? '' : 'max-h-32 overflow-hidden'
                              }
                            >
                              <StreamingMarkdown content={item.answer} />
                            </div>
                            {!isExpanded && (
                              <div className='bg-gradient-to-t from-background to-transparent pointer-events-none absolute bottom-0 left-0 right-0 h-12' />
                            )}
                          </div>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='mt-2 w-full'
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className='mr-2 h-4 w-4' />
                                  收起
                                </>
                              ) : (
                                <>
                                  <ChevronDown className='mr-2 h-4 w-4' />
                                  展开完整回答
                                </>
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        </Collapsible>
                        <div className='mt-4 flex gap-2'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleCopyAnswer(item.answer)}
                          >
                            <Copy className='mr-2 h-4 w-4' />
                            复制回答
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value='notes' className='mt-6'>
            <div className='mb-4 flex items-center justify-between'>
              <p className='text-muted-foreground text-sm'>你收藏的知识片段</p>
              {noteList.length > 0 && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setShowClearDialog('notes')}
                >
                  清空收藏
                </Button>
              )}
            </div>

            {notesQuery.isLoading ? (
              <Card>
                <CardContent className='text-muted-foreground py-12 text-center'>
                  正在加载收藏信息…
                </CardContent>
              </Card>
            ) : noteList.length === 0 ? (
              notesQuery.isError ? (
                <Card>
                  <CardContent>
                    <ErrorState
                      title='无法加载收藏内容'
                      description='暂时无法从服务器获取收藏数据，稍后再试或联系平台团队。'
                      onRetry={() => void notesQuery.refetch()}
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className='flex flex-col items-center justify-center py-12'>
                    <LibraryIcon className='text-muted-foreground mb-4 h-12 w-12' />
                    <p className='text-muted-foreground'>暂无收藏条目</p>
                    <p className='text-muted-foreground mt-1 text-sm'>
                      在问答页面点击“保存到知识库”即可收藏重要内容
                    </p>
                  </CardContent>
                </Card>
              )
            ) : (
              <div className='space-y-3'>
                {notesQuery.isError && (
                  <div className='border-destructive/40 bg-destructive/10 text-destructive flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-3 text-sm'>
                    <span>
                      收藏列表暂时无法同步最新数据，当前展示的是本地缓存。
                    </span>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='text-destructive hover:text-destructive'
                      onClick={() => void notesQuery.refetch()}
                    >
                      重试
                    </Button>
                  </div>
                )}
                {noteList.map((note) => {
                  const isExpanded = expandedItems.has(note.id)
                  return (
                    <Card key={note.id}>
                      <CardHeader>
                        <div className='flex items-start justify-between gap-4'>
                          <div className='min-w-0 flex-1'>
                            <div className='mb-2 flex items-center gap-2'>
                              <Database className='text-muted-foreground h-4 w-4 flex-shrink-0' />
                              <span className='text-muted-foreground text-sm'>
                                {note.sourceName ??
                                  note.sourceId ??
                                  '未关联知识源'}
                              </span>
                              <span className='text-muted-foreground text-sm'>
                                ·
                              </span>
                              <span className='text-muted-foreground text-xs'>
                                {new Date(note.createdAt).toLocaleString(
                                  'zh-CN'
                                )}
                              </span>
                            </div>
                            <CardTitle className='text-base'>
                              {note.question}
                            </CardTitle>
                            {note.tags && note.tags.length > 0 && (
                              <div className='mt-2 flex flex-wrap gap-1'>
                                {note.tags.map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant='secondary'
                                    className='text-xs'
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Collapsible
                          open={isExpanded}
                          onOpenChange={() => toggleExpanded(note.id)}
                        >
                          <div className='relative'>
                            <div
                              className={
                                isExpanded ? '' : 'max-h-32 overflow-hidden'
                              }
                            >
                              <StreamingMarkdown content={note.answerSummary} />
                            </div>
                            {!isExpanded && (
                              <div className='bg-gradient-to-t from-background to-transparent pointer-events-none absolute bottom-0 left-0 right-0 h-12' />
                            )}
                          </div>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='mt-2 w-full'
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className='mr-2 h-4 w-4' />
                                  收起
                                </>
                              ) : (
                                <>
                                  <ChevronDown className='mr-2 h-4 w-4' />
                                  展开完整回答
                                </>
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        </Collapsible>
                        <div className='mt-4 flex gap-2'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleCopyAnswer(note.answerSummary)}
                          >
                            <Copy className='mr-2 h-4 w-4' />
                            复制摘要
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => setDeleteNoteId(note.id)}
                          >
                            <Trash2 className='mr-2 h-4 w-4' />
                            删除
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <AlertDialog
          open={!!deleteNoteId}
          onOpenChange={() => setDeleteNoteId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除</AlertDialogTitle>
              <AlertDialogDescription>
                确定要删除这条收藏吗？此操作无法撤销。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteNoteId && handleDeleteNote(deleteNoteId)}
              >
                删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={!!showClearDialog}
          onOpenChange={() => setShowClearDialog(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认清空</AlertDialogTitle>
              <AlertDialogDescription>
                确定要清空所有
                {showClearDialog === 'notes' ? '收藏条目' : '历史记录'}
                吗？此操作无法撤销。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearAll}>
                清空
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
