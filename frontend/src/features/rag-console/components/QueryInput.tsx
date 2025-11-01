import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { RetrievalMode } from '../types'

interface QueryInputProps {
  onSubmit: (params: {
    query: string
    mode: RetrievalMode
    maxResults: number
  }) => void
  isLoading: boolean
  disabled: boolean
  error: string | null
}

export function QueryInput({
  onSubmit,
  isLoading,
  disabled,
  error,
}: QueryInputProps) {
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<RetrievalMode>('hybrid')
  const [maxResults, setMaxResults] = useState(8)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!query.trim()) {
      return
    }

    onSubmit({
      query: query.trim(),
      mode,
      maxResults,
    })
  }

  const canSubmit = query.trim().length > 0 && !disabled && !isLoading

  return (
    <Card className='p-6'>
      <form onSubmit={handleSubmit} className='space-y-4'>
        {/* 问题输入 */}
        <div className='space-y-2'>
          <Label htmlFor='query'>问题</Label>
          <Textarea
            id='query'
            placeholder='输入您的问题，例如：订单签名验证在哪里实现？'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
            className='min-h-[100px] resize-none'
            maxLength={500}
          />
          <div className='text-muted-foreground flex items-center justify-between text-xs'>
            <span>{disabled ? '请先选择知识源' : '支持自然语言提问'}</span>
            <span>{query.length}/500</span>
          </div>
        </div>

        {/* 检索模式 */}
        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label htmlFor='mode'>检索模式</Label>
            <Select
              value={mode}
              onValueChange={(value) => setMode(value as RetrievalMode)}
              disabled={isLoading}
            >
              <SelectTrigger id='mode'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='hybrid'>
                  <div className='flex flex-col items-start'>
                    <span className='font-medium'>Hybrid（混合）</span>
                    <span className='text-muted-foreground text-xs'>
                      图谱 + 向量检索
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value='graph'>
                  <div className='flex flex-col items-start'>
                    <span className='font-medium'>Graph（图谱）</span>
                    <span className='text-muted-foreground text-xs'>
                      关系路径优先
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value='vector'>
                  <div className='flex flex-col items-start'>
                    <span className='font-medium'>Vector（向量）</span>
                    <span className='text-muted-foreground text-xs'>
                      语义相似度
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Top-K */}
          <div className='space-y-2'>
            <Label htmlFor='top-k'>结果数量：{maxResults}</Label>
            <input
              id='top-k'
              type='range'
              min={1}
              max={20}
              step={1}
              value={maxResults}
              onChange={(e) => setMaxResults(Number(e.target.value))}
              disabled={isLoading}
              className='w-full'
            />
            <div className='text-muted-foreground flex justify-between text-xs'>
              <span>1</span>
              <span>20</span>
            </div>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className='bg-destructive/10 text-destructive rounded-md p-3 text-sm'>
            {error}
          </div>
        )}

        {/* 提交按钮 */}
        <Button
          type='submit'
          className='w-full'
          disabled={!canSubmit}
          size='lg'
        >
          {isLoading ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              查询中...
            </>
          ) : (
            <>
              <Send className='mr-2 h-4 w-4' />
              提交查询
            </>
          )}
        </Button>
      </form>
    </Card>
  )
}
