import { FileSearch } from 'lucide-react'
import { Card } from '@/components/ui/card'
import type { CodeSnippet as CodeSnippetType } from '../types'
import { CodeSnippet } from './CodeSnippet'

interface CodeSnippetListProps {
  snippets: CodeSnippetType[]
}

export function CodeSnippetList({ snippets }: CodeSnippetListProps) {
  if (snippets.length === 0) {
    return (
      <Card className='p-8 text-center'>
        <FileSearch className='text-muted-foreground/50 mx-auto h-12 w-12' />
        <p className='text-muted-foreground mt-4 text-sm'>未找到相关代码片段</p>
      </Card>
    )
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>代码片段</h3>
        <span className='text-muted-foreground text-sm'>
          共 {snippets.length} 个结果
        </span>
      </div>
      <div className='space-y-4'>
        {snippets.map((snippet, index) => (
          <CodeSnippet key={index} snippet={snippet} />
        ))}
      </div>
    </div>
  )
}
