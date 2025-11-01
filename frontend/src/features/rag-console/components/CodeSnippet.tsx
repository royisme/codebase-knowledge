import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { FileCode, Copy, Check } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { CodeSnippet as CodeSnippetType } from '../types/mvp'

interface CodeSnippetProps {
  snippet: CodeSnippetType
}

export function CodeSnippet({ snippet }: CodeSnippetProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet.content)
      setCopied(true)
      toast.success('代码已复制到剪贴板')
      setTimeout(() => setCopied(false), 2000)
    } catch (_error) {
      toast.error('复制失败，请重试')
    }
  }

  return (
    <Card className="overflow-hidden">
      {/* 头部 */}
      <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <FileCode className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {snippet.repository} / {snippet.path}
            </span>
            <span className="text-xs text-muted-foreground">
              第 {snippet.startLine}-{snippet.endLine} 行
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-8 w-8 p-0"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* 代码区域 */}
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          language={snippet.language}
          style={vscDarkPlus}
          showLineNumbers
          startingLineNumber={snippet.startLine}
          customStyle={{
            margin: 0,
            borderRadius: 0,
            fontSize: '0.875rem',
          }}
          codeTagProps={{
            style: {
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            },
          }}
        >
          {snippet.content}
        </SyntaxHighlighter>
      </div>
    </Card>
  )
}
