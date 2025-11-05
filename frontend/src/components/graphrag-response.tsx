/**
 * GraphRAG 回答渲染组件 V2
 * 
 * 直接使用 Shiki + 自定义 Markdown 解析器，无需 ReactMarkdown
 * 
 * 特性：
 * - 流式渲染友好（逐步解析）
 * - 代码高亮（Shiki）
 * - Markdown 基础语法（手动解析）
 * - 行内代码 vs 代码块准确识别
 */

import { useState, useEffect, useMemo } from 'react'
import { codeToHtml } from 'shiki'
import { Copy, Check, FileCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/context/theme-provider'
import { cn } from '@/lib/utils'

interface GraphRAGResponseProps {
  content: string
  streaming?: boolean
  className?: string
}

interface CodeBlockMatch {
  type: 'code-block'
  raw: string
  code: string
  language?: string
  filePath?: string
  startLine?: number
  endLine?: number
  start: number
  end: number
}

/**
 * 解析 Markdown 中的代码块（只处理三反引号的代码块）
 */
function parseCodeBlocks(markdown: string): CodeBlockMatch[] {
  const segments: CodeBlockMatch[] = []
  
  // 匹配代码块（三个反引号）
  // 支持：```python, ```python:file.py, ```python{10-20}, ```python:file.py{10-20}
  const codeBlockRegex = /```(\w+)?(?::([^\s{}\n]+))?(?:\{(\d+)-(\d+)\})?\n([\s\S]*?)```/g
  let match: RegExpExecArray | null
  
  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    const [raw, language, filePath, startLine, endLine, code] = match
    segments.push({
      type: 'code-block',
      raw,
      code: code.trimEnd(),
      language: language || 'text',
      filePath: filePath || undefined,
      startLine: startLine ? parseInt(startLine) : undefined,
      endLine: endLine ? parseInt(endLine) : undefined,
      start: match.index,
      end: match.index + raw.length,
    })
  }
  
  return segments.sort((a, b) => a.start - b.start)
}

/**
 * 将 Markdown 拆分为片段（纯文本 + 代码块）
 */
function splitMarkdown(markdown: string) {
  const codeBlocks = parseCodeBlocks(markdown)
  const parts: Array<{ type: 'text' | 'code-block'; content: string; meta?: CodeBlockMatch }> = []
  
  let lastIndex = 0
  
  for (const block of codeBlocks) {
    // 添加前面的纯文本
    if (block.start > lastIndex) {
      const text = markdown.slice(lastIndex, block.start)
      if (text) {
        parts.push({ type: 'text', content: text })
      }
    }
    
    // 添加代码块
    parts.push({
      type: 'code-block',
      content: block.code,
      meta: block,
    })
    
    lastIndex = block.end
  }
  
  // 添加最后的纯文本
  if (lastIndex < markdown.length) {
    const text = markdown.slice(lastIndex)
    if (text) {
      parts.push({ type: 'text', content: text })
    }
  }
  
  return parts
}

/**
 * 将文本中的行内代码替换为 React 组件
 */
function renderTextWithInlineCode(text: string, keyPrefix: string = ''): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const regex = /`([^`\n]+)`/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let matchCount = 0
  
  while ((match = regex.exec(text)) !== null) {
    // 前面的纯文本
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    
    // 行内代码
    parts.push(
      <code 
        key={`${keyPrefix}-code-${matchCount++}`}
        className='rounded bg-primary/10 px-1.5 py-0.5 text-xs font-mono text-foreground'
      >
        {match[1]}
      </code>
    )
    
    lastIndex = match.index + match[0].length
  }
  
  // 最后的纯文本
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }
  
  return parts.length > 0 ? parts : [text]
}

/**
 * 简单的 Markdown 文本渲染（包含行内代码处理）
 */
function renderMarkdownText(text: string): React.ReactElement[] {
  const lines = text.split('\n')
  const elements: React.ReactElement[] = []
  
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    
    // 标题
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className='mb-2 mt-4 text-base font-bold first:mt-0'>
          {renderTextWithInlineCode(line.slice(4), `h3-${i}`)}
        </h3>
      )
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className='mb-3 mt-5 text-lg font-bold first:mt-0'>
          {renderTextWithInlineCode(line.slice(3), `h2-${i}`)}
        </h2>
      )
    } else if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className='mb-4 mt-6 text-xl font-bold first:mt-0'>
          {renderTextWithInlineCode(line.slice(2), `h1-${i}`)}
        </h1>
      )
    }
    // 列表
    else if (line.match(/^[\d]+\.\s/)) {
      const listItems: string[] = []
      while (i < lines.length && lines[i].match(/^[\d]+\.\s/)) {
        listItems.push(lines[i].replace(/^[\d]+\.\s/, ''))
        i++
      }
      elements.push(
        <ol key={i} className='my-3 ml-4 list-decimal space-y-1'>
          {listItems.map((item, idx) => (
            <li key={idx} className='leading-relaxed'>
              {renderTextWithInlineCode(item, `ol-${i}-${idx}`)}
            </li>
          ))}
        </ol>
      )
      continue
    } else if (line.match(/^[-*]\s/)) {
      const listItems: string[] = []
      while (i < lines.length && lines[i].match(/^[-*]\s/)) {
        listItems.push(lines[i].replace(/^[-*]\s/, ''))
        i++
      }
      elements.push(
        <ul key={i} className='my-3 ml-4 list-disc space-y-1'>
          {listItems.map((item, idx) => (
            <li key={idx} className='leading-relaxed'>
              {renderTextWithInlineCode(item, `ul-${i}-${idx}`)}
            </li>
          ))}
        </ul>
      )
      continue
    }
    // 空行
    else if (line.trim() === '') {
      // 跳过
    }
    // 普通段落
    else {
      elements.push(
        <p key={i} className='mb-3 leading-relaxed last:mb-0'>
          {renderTextWithInlineCode(line, `p-${i}`)}
        </p>
      )
    }
    
    i++
  }
  
  return elements
}

/**
 * 代码块组件（带 Shiki 高亮）
 */
const CodeBlock = ({ code, language = 'text', filePath, startLine, endLine }: {
  code: string
  language?: string
  filePath?: string
  startLine?: number
  endLine?: number
}) => {
  const [copied, setCopied] = useState(false)
  const [html, setHtml] = useState<string>('')
  const { theme } = useTheme()
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  // Shiki 高亮
  useEffect(() => {
    const highlight = async () => {
      try {
        const highlighted = await codeToHtml(code, {
          lang: language,
          theme: theme === 'dark' ? 'github-dark' : 'github-light',
        })
        setHtml(highlighted)
      } catch {
        // 降级到纯文本
        const fallback = await codeToHtml(code, {
          lang: 'text',
          theme: theme === 'dark' ? 'github-dark' : 'github-light',
        })
        setHtml(fallback)
      }
    }
    
    void highlight()
  }, [code, language, theme])
  
  return (
    <div className='group relative my-4 rounded-lg border bg-muted/30'>
      {/* 顶部栏 */}
      <div className='flex items-center justify-between border-b bg-muted/50 px-4 py-2'>
        <div className='flex items-center gap-2 text-sm'>
          {filePath ? (
            <>
              <FileCode className='h-4 w-4 text-muted-foreground' />
              <span className='font-mono text-xs text-muted-foreground'>{filePath}</span>
            </>
          ) : (
            <span className='text-xs font-semibold uppercase text-muted-foreground'>
              {language}
            </span>
          )}
          {startLine && (
            <span className='text-xs text-muted-foreground'>
              (L{startLine}{endLine ? `-${endLine}` : '+'})
            </span>
          )}
        </div>
        
        <Button
          variant='ghost'
          size='sm'
          onClick={handleCopy}
          className='h-7 px-2 text-xs'
        >
          {copied ? (
            <>
              <Check className='mr-1.5 h-3 w-3' />
              已复制
            </>
          ) : (
            <>
              <Copy className='mr-1.5 h-3 w-3' />
              复制
            </>
          )}
        </Button>
      </div>
      
      {/* 代码内容 */}
      {html ? (
        <div 
          className='overflow-x-auto shiki-container'
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className='overflow-x-auto p-4'>
          <code className='text-sm font-mono'>{code}</code>
        </pre>
      )}
    </div>
  )
}

/**
 * 主组件
 */
export const GraphRAGResponse = ({ 
  content, 
  streaming = false,
  className 
}: GraphRAGResponseProps) => {
  const parts = useMemo(() => splitMarkdown(content), [content])
  
  return (
    <div className={cn('prose prose-sm max-w-none dark:prose-invert', className)}>
      {parts.map((part, idx) => {
        if (part.type === 'text') {
          return <div key={idx}>{renderMarkdownText(part.content)}</div>
        } else if (part.type === 'code-block' && part.meta) {
          return (
            <CodeBlock
              key={idx}
              code={part.content}
              language={part.meta.language}
              filePath={part.meta.filePath}
              startLine={part.meta.startLine}
              endLine={part.meta.endLine}
            />
          )
        }
        return null
      })}
      
      {streaming && (
        <span className='inline-block h-4 w-1 animate-pulse bg-primary' />
      )}
    </div>
  )
}
