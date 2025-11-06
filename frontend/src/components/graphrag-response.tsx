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
import { Copy, Check, FileCode } from 'lucide-react'
import { codeToHtml } from 'shiki'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/theme-provider'
import { Button } from '@/components/ui/button'

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
  const codeBlockRegex =
    /```(\w+)?(?::([^\s{}\n]+))?(?:\{(\d+)-(\d+)\})?\n([\s\S]*?)```/g
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
  const parts: Array<{
    type: 'text' | 'code-block'
    content: string
    meta?: CodeBlockMatch
  }> = []

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
 * 将文本中的行内 Markdown 语法渲染为 React 组件
 * 支持：行内代码、粗体、斜体、删除线
 */
function renderInlineMarkdown(
  text: string,
  keyPrefix: string = ''
): React.ReactNode[] {
  const parts: React.ReactNode[] = []

  // 匹配优先级：行内代码 > 粗体 > 斜体 > 删除线
  // 使用正则匹配所有行内格式
  const regex =
    /(`[^`\n]+`)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(_([^_]+)_)|(~~([^~]+)~~)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let matchCount = 0

  while ((match = regex.exec(text)) !== null) {
    // 前面的纯文本
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    // 行内代码 `code`
    if (match[1]) {
      parts.push(
        <code
          key={`${keyPrefix}-code-${matchCount++}`}
          className='bg-primary/10 text-foreground rounded px-1.5 py-0.5 font-mono text-xs'
        >
          {match[1].slice(1, -1)}
        </code>
      )
    }
    // 粗体 **text**
    else if (match[2]) {
      parts.push(
        <strong key={`${keyPrefix}-bold-${matchCount++}`}>{match[3]}</strong>
      )
    }
    // 斜体 *text*
    else if (match[4]) {
      parts.push(
        <em key={`${keyPrefix}-italic-${matchCount++}`}>{match[5]}</em>
      )
    }
    // 斜体 _text_
    else if (match[6]) {
      parts.push(
        <em key={`${keyPrefix}-italic-${matchCount++}`}>{match[7]}</em>
      )
    }
    // 删除线 ~~text~~
    else if (match[8]) {
      parts.push(
        <del key={`${keyPrefix}-strike-${matchCount++}`}>{match[9]}</del>
      )
    }

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
        <h3 key={i} className='mt-4 mb-2 text-base font-bold first:mt-0'>
          {renderInlineMarkdown(line.slice(4), `h3-${i}`)}
        </h3>
      )
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className='mt-5 mb-3 text-lg font-bold first:mt-0'>
          {renderInlineMarkdown(line.slice(3), `h2-${i}`)}
        </h2>
      )
    } else if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className='mt-6 mb-4 text-xl font-bold first:mt-0'>
          {renderInlineMarkdown(line.slice(2), `h1-${i}`)}
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
              {renderInlineMarkdown(item, `ol-${i}-${idx}`)}
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
              {renderInlineMarkdown(item, `ul-${i}-${idx}`)}
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
          {renderInlineMarkdown(line, `p-${i}`)}
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
const CodeBlock = ({
  code,
  language = 'text',
  filePath,
  startLine,
  endLine,
}: {
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
    <div className='group bg-muted/30 relative my-4 rounded-lg border'>
      {/* 顶部栏 */}
      <div className='bg-muted/50 flex items-center justify-between border-b px-4 py-2'>
        <div className='flex items-center gap-2 text-sm'>
          {filePath ? (
            <>
              <FileCode className='text-muted-foreground h-4 w-4' />
              <span className='text-muted-foreground font-mono text-xs'>
                {filePath}
              </span>
            </>
          ) : (
            <span className='text-muted-foreground text-xs font-semibold uppercase'>
              {language}
            </span>
          )}
          {startLine && (
            <span className='text-muted-foreground text-xs'>
              (L{startLine}
              {endLine ? `-${endLine}` : '+'})
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
          className='shiki-container overflow-x-auto'
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className='overflow-x-auto p-4'>
          <code className='font-mono text-sm'>{code}</code>
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
  className,
}: GraphRAGResponseProps) => {
  const parts = useMemo(() => splitMarkdown(content), [content])

  return (
    <div
      className={cn('prose prose-sm dark:prose-invert max-w-none', className)}
    >
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
        <span className='bg-primary inline-block h-4 w-1 animate-pulse' />
      )}
    </div>
  )
}
