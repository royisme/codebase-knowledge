import { useState } from 'react';
import { useKnowledgeNoteStore } from '@/stores/knowledge-note-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  BookMarked,
  Clock,
  Copy,
  Trash2,
  Database,
  MessageCircleQuestion,
  Library as LibraryIcon,
} from 'lucide-react';
import { toast } from 'sonner';

export const KnowledgeLibraryPage = () => {
  const { notes, history, removeNote, clearNotes, clearHistory } = useKnowledgeNoteStore();
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [showClearDialog, setShowClearDialog] = useState<'notes' | 'history' | null>(null);

  const handleCopyAnswer = (answer: string) => {
    navigator.clipboard.writeText(answer);
    toast.success('已复制到剪贴板');
  };

  const handleDeleteNote = (id: string) => {
    removeNote(id);
    setDeleteNoteId(null);
    toast.success('已删除收藏');
  };

  const handleClearAll = () => {
    if (showClearDialog === 'notes') {
      clearNotes();
      toast.success('已清空所有收藏');
    } else if (showClearDialog === 'history') {
      clearHistory();
      toast.success('已清空历史记录');
    }
    setShowClearDialog(null);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6 pb-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">知识库</h1>
        <p className="text-muted-foreground">
          管理你的收藏条目与提问历史
        </p>
      </div>

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="history">
            <Clock className="h-4 w-4 mr-2" />
            最近提问 ({history.length})
          </TabsTrigger>
          <TabsTrigger value="notes">
            <BookMarked className="h-4 w-4 mr-2" />
            收藏条目 ({notes.length})
          </TabsTrigger>
        </TabsList>

        {/* 最近提问 */}
        <TabsContent value="history" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              展示最近 100 条提问记录
            </p>
            {history.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowClearDialog('history')}
              >
                清空历史
              </Button>
            )}
          </div>

          {history.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageCircleQuestion className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">暂无提问历史</p>
                <p className="text-sm text-muted-foreground mt-1">
                  前往代码问答页面开始你的第一个提问
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Database className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{item.sourceName}</span>
                          <span className="text-sm text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.timestamp).toLocaleString('zh-CN')}
                          </span>
                        </div>
                        <CardTitle className="text-base">{item.question}</CardTitle>
                      </div>
                      <Badge variant="outline">
                        {item.executionTimeMs}ms
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none text-muted-foreground">
                      <p className="line-clamp-3">{item.answer}</p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyAnswer(item.answer)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        复制回答
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 收藏条目 */}
        <TabsContent value="notes" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              你收藏的知识片段
            </p>
            {notes.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowClearDialog('notes')}
              >
                清空收藏
              </Button>
            )}
          </div>

          {notes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <LibraryIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">暂无收藏条目</p>
                <p className="text-sm text-muted-foreground mt-1">
                  在问答页面点击"保存到知识库"即可收藏重要内容
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <Card key={note.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Database className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{note.sourceName}</span>
                          <span className="text-sm text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(note.createdAt).toLocaleString('zh-CN')}
                          </span>
                        </div>
                        <CardTitle className="text-base">{note.question}</CardTitle>
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {note.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none text-muted-foreground">
                      <p className="line-clamp-4">{note.answer}</p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyAnswer(note.answer)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        复制
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteNoteId(note.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        删除
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteNoteId} onOpenChange={() => setDeleteNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这条收藏吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteNoteId && handleDeleteNote(deleteNoteId)}>
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 清空确认对话框 */}
      <AlertDialog open={!!showClearDialog} onOpenChange={() => setShowClearDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认清空</AlertDialogTitle>
            <AlertDialogDescription>
              确定要清空所有{showClearDialog === 'notes' ? '收藏条目' : '历史记录'}吗？此操作无法撤销。
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
  );
};
