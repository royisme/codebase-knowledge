/**
 * Shiki 单例高亮器（Shiki 3.x）
 *
 * 预加载常用语言和主题，避免每次高亮都重新初始化
 */
import { createHighlighter, type Highlighter } from 'shiki'

let highlighterPromise: Promise<Highlighter> | null = null

/**
 * 确保 Shiki 高亮器已初始化（单例模式）
 */
export function ensureHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-dark', 'github-light'],
      langs: [
        // 前端
        'typescript',
        'tsx',
        'javascript',
        'jsx',
        'json',
        'html',
        'css',
        'scss',
        'vue',
        'svelte',
        // 后端
        'python',
        'java',
        'go',
        'rust',
        'c',
        'cpp',
        'csharp',
        'php',
        'ruby',
        // 脚本/配置
        'bash',
        'shell',
        'yaml',
        'toml',
        'dockerfile',
        // 数据库
        'sql',
        'graphql',
        // 其他
        'markdown',
        'xml',
        'plaintext',
      ],
    })
  }

  return highlighterPromise
}

/**
 * 获取当前主题名称（根据系统深浅色模式）
 */
export function getCurrentTheme(): 'github-dark' | 'github-light' {
  if (typeof window === 'undefined') {
    return 'github-light'
  }

  const isDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  return isDark ? 'github-dark' : 'github-light'
}
