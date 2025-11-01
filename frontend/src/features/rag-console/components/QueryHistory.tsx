import { Clock, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { QueryTurn } from '../types/mvp'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface QueryHistoryProps {
  history: QueryTurn[]
  onSelect: (turn: QueryTurn) => void
  onClear: () => void
}

export function QueryHistory({
  history,
  onSelect,
  onClear,
}: QueryHistoryProps) {
  if (history.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Clock className="mx-auto h-8 w-8 text-muted-foreground/50" />
        <p className="mt-2 text-sm text-muted-foreground">暂无查询历史</p>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="text-sm font-semibold">查询历史</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-8 px-2"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="h-[400px]">
        <div className="p-2 space-y-1">
          {history.map((turn) => (
            <button
              key={turn.id}
              onClick={() => onSelect(turn)}
              className="w-full rounded-md p-3 text-left transition-colors hover:bg-accent"
            >
              <div className="line-clamp-2 text-sm font-medium">
                {turn.question}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(turn.timestamp), {
                  addSuffix: true,
                  locale: zhCN,
                })}
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </Card>
  )
}
