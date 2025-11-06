/**
 * StreamingMarkdown - 流式 Markdown 渲染组件
 *
 * 架构（方案 A）：
 * - react-markdown 同步解析 Markdown（不阻塞流式渲染）
 * - remark-gfm 同步处理 GFM 扩展
 * - CodeBlock 组件异步调用 Shiki 高亮（"占位 → 升级"模式）
 * - 未闭合代码块先显示普通文本，闭合后自动升级为高亮版本
 *
 * 特性：
 * - ✅ 完整的 Markdown + GFM 支持
 * - ✅ 流式渲染友好（无阻塞）
 * - ✅ 异步代码高亮（Shiki）
 * - ✅ 安全性（skipHtml 防 XSS）
 * - ✅ 主题自动切换
 */
import { useEffect, useMemo, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ensureHighlighter } from '@/lib/shiki-client'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/theme-provider'
import { Button } from '@/components/ui/button'

interface StreamingMarkdownProps {
  content: string
  streaming?: boolean
  className?: string
}

/**
 * 代码块组件 - 异步高亮（占位 → 升级模式）
 */
function CodeBlock({
  inline,
  className,
  children,
}: {
  inline?: boolean
  className?: string
  children?: React.ReactNode
}) {
  const { theme } = useTheme()
  const [copied, setCopied] = useState(false)
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null)

  // 提取纯文本内容（处理 React 元素、数组等）
  const extractText = (node: React.ReactNode): string => {
    if (node == null) return ''
    if (typeof node === 'string') return node
    if (typeof node === 'number') return String(node)
    if (Array.isArray(node)) return node.map(extractText).join('')
    if (typeof node === 'object' && 'props' in node) {
      return extractText(
        (node as { props?: { children?: React.ReactNode } }).props?.children
      )
    }
    return ''
  }

  const raw = extractText(children)

  // 提取语言名称
  const lang = useMemo(() => {
    const match = /language-(\w+)/.exec(className ?? '')
    return match?.[1] ?? 'plaintext'
  }, [className])

  // 智能判断是否为行内代码（当 inline 未设置时的后备逻辑）
  // 如果没有语言类名且内容不包含换行，很可能是行内代码
  const isInline = useMemo(() => {
    if (inline !== undefined) return inline
    // 后备判断：无语言类名 + 无换行 + 内容较短 = 行内代码
    return !className && !raw.includes('\n') && raw.length < 100
  }, [inline, className, raw])

  // 代码块：异步高亮（占位 → 升级）
  // 必须在条件判断之前调用所有 hooks
  useEffect(() => {
    // 行内代码不需要高亮
    if (isInline) return

    let alive = true

    const highlight = async () => {
      try {
        const highlighter = await ensureHighlighter()
        const currentTheme = theme === 'dark' ? 'github-dark' : 'github-light'

        const html = highlighter.codeToHtml(raw, {
          lang,
          theme: currentTheme,
        })

        if (alive) {
          setHighlightedHtml(html)
        }
      } catch (_error) {
        // 降级：语言识别失败时使用 plaintext
        try {
          const highlighter = await ensureHighlighter()
          const currentTheme = theme === 'dark' ? 'github-dark' : 'github-light'

          const fallbackHtml = highlighter.codeToHtml(raw, {
            lang: 'plaintext',
            theme: currentTheme,
          })

          if (alive) {
            setHighlightedHtml(fallbackHtml)
          }
        } catch {
          // 完全失败：保持占位状态
        }
      }
    }

    void highlight()

    return () => {
      alive = false
    }
  }, [raw, lang, theme, isInline])

  // 行内代码：同步渲染，不做异步高亮（避免频繁重排）
  if (isInline) {
    return (
      <code className='bg-primary/10 text-foreground rounded px-1.5 py-0.5 font-mono text-xs'>
        {raw}
      </code>
    )
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(raw)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // 占位状态：未高亮的普通代码块（支持流式未闭合阶段）
  if (!highlightedHtml) {
    return (
      <div className='group relative my-4'>
        <div className='bg-muted/50 flex items-center justify-between border-b px-4 py-2'>
          <span className='text-muted-foreground font-mono text-xs uppercase'>
            {lang === 'plaintext' ? '代码' : lang}
          </span>
          <Button
            variant='ghost'
            size='sm'
            onClick={handleCopy}
            className='h-7 px-2 text-xs opacity-0 transition-opacity group-hover:opacity-100'
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
        <pre className='bg-muted/30 overflow-auto rounded-b-lg border border-t-0 p-4'>
          <code className='font-mono text-sm'>{raw}</code>
        </pre>
      </div>
    )
  }

  // 升级状态：高亮后的代码块
  return (
    <div className='group bg-muted/30 relative my-4 rounded-lg border'>
      <div className='bg-muted/50 flex items-center justify-between border-b px-4 py-2'>
        <span className='text-muted-foreground font-mono text-xs uppercase'>
          {lang === 'plaintext' ? '代码' : lang}
        </span>
        <Button
          variant='ghost'
          size='sm'
          onClick={handleCopy}
          className='h-7 px-2 text-xs opacity-0 transition-opacity group-hover:opacity-100'
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
      <div
        className='shiki-container overflow-x-auto [&>pre]:my-0 [&>pre]:rounded-none [&>pre]:border-0'
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      />
    </div>
  )
}

/**
 * 链接组件 - 自动添加安全属性
 */
function Link({
  href,
  children,
  ...props
}: React.ComponentPropsWithoutRef<'a'>) {
  const isExternal = href?.startsWith('http')

  return (
    <a
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'nofollow noreferrer noopener' : undefined}
      className='text-primary hover:text-primary/80 underline underline-offset-4 transition-colors'
      {...props}
    >
      {children}
    </a>
  )
}

/**
 * 主组件 - 流式 Markdown 渲染
 */
export function StreamingMarkdown({
  content,
  streaming = false,
  className,
}: StreamingMarkdownProps) {
  return (
    <div
      className={cn('prose prose-sm dark:prose-invert max-w-none', className)}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml // 🔒 安全：禁用原始 HTML（防 XSS）
        components={{
          // 代码块/行内代码
          code: (props) => {
            const { inline, className, children } = props as {
              inline?: boolean
              className?: string
              children?: React.ReactNode
            }
            return (
              <CodeBlock inline={inline} className={className}>
                {children}
              </CodeBlock>
            )
          },
          // 链接（自动添加安全属性）
          a: Link,
          // 标题
          h1: ({ children, ...props }) => (
            <h1 className='mt-6 mb-4 text-xl font-bold first:mt-0' {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className='mt-5 mb-3 text-lg font-bold first:mt-0' {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className='mt-4 mb-2 text-base font-bold first:mt-0' {...props}>
              {children}
            </h3>
          ),
          // 段落
          p: ({ children, ...props }) => (
            <p className='mb-3 leading-relaxed last:mb-0' {...props}>
              {children}
            </p>
          ),
          // 列表
          ul: ({ children, ...props }) => (
            <ul className='my-3 ml-4 list-disc space-y-1' {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className='my-3 ml-4 list-decimal space-y-1' {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className='leading-relaxed' {...props}>
              {children}
            </li>
          ),
          // 引用
          blockquote: ({ children, ...props }) => (
            <blockquote
              className='border-primary/30 text-muted-foreground my-4 border-l-4 pl-4 italic'
              {...props}
            >
              {children}
            </blockquote>
          ),
          // 表格
          table: ({ children, ...props }) => (
            <div className='my-4 overflow-x-auto'>
              <table className='w-full border-collapse' {...props}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead className='bg-muted' {...props}>
              {children}
            </thead>
          ),
          th: ({ children, ...props }) => (
            <th
              className='border-border border px-3 py-2 text-left font-semibold'
              {...props}
            >
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className='border-border border px-3 py-2' {...props}>
              {children}
            </td>
          ),
          // 分割线
          hr: ({ ...props }) => (
            <hr className='border-border my-6' {...props} />
          ),
          // 强调
          strong: ({ children, ...props }) => (
            <strong className='font-bold' {...props}>
              {children}
            </strong>
          ),
          em: ({ children, ...props }) => (
            <em className='italic' {...props}>
              {children}
            </em>
          ),
          // 删除线（GFM）
          del: ({ children, ...props }) => (
            <del className='line-through' {...props}>
              {children}
            </del>
          ),
        }}
      >
        {content}
      </ReactMarkdown>

      {/* 流式加载光标 */}
      {streaming && (
        <span className='bg-primary ml-1 inline-block h-4 w-1 animate-pulse' />
      )}
    </div>
  )
}
