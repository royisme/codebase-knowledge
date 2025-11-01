import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Clock, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { QueryTurn } from '../types'

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
      <Card className='p-6 text-center'>
        <Clock className='text-muted-foreground/50 mx-auto h-8 w-8' />
        <p className='text-muted-foreground mt-2 text-sm'>暂无查询历史</p>
      </Card>
    )
  }

  return (
    <Card>
      <div className='flex items-center justify-between border-b p-4'>
        <h3 className='text-sm font-semibold'>查询历史</h3>
        <Button
          variant='ghost'
          size='sm'
          onClick={onClear}
          className='h-8 px-2'
        >
          <Trash2 className='h-4 w-4' />
        </Button>
      </div>
      <ScrollArea className='h-[400px]'>
        <div className='space-y-1 p-2'>
          {history.map((turn) => (
            <button
              key={turn.id}
              onClick={() => onSelect(turn)}
              className='hover:bg-accent w-full rounded-md p-3 text-left transition-colors'
            >
              <div className='line-clamp-2 text-sm font-medium'>
                {turn.question}
              </div>
              <div className='text-muted-foreground mt-1 text-xs'>
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
