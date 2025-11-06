/**
 * Markdown 渲染测试页面
 * 用于验证 StreamingMarkdown 组件的各种 Markdown 语法渲染
 */

import { StreamingMarkdown } from '@/components/streaming-markdown'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const testMarkdown = `# Markdown 渲染测试

## 基础格式

这是 **粗体文本**，这是 *斜体文本*，这是 ~~删除线文本~~。

你也可以组合使用：***粗斜体***

### 行内代码

在 JavaScript 中使用 \`const\` 声明变量，例如 \`const x = 10\`

## 列表测试

### 无序列表

- **Copal** 是一个源码项目
- 项目中包含文件 \`Tests/__init__.py\`
- 项目摘要描述为 **Test suite**

### 有序列表

1. 第一项
2. 第二项
3. 第三项

## 代码块测试

### Python 代码

\`\`\`python
# Tests/__init__.py
def test_example():
    assert True
\`\`\`

### PlainText

\`\`\`plaintext
IS_SOURCE_NAME
\`\`\`

### 无语言标识

\`\`\`
main.py
setup.py
\`\`\`

## 引用块测试

> 这些信息来源于上下文 **[1]**。
>
> 其中并未提及任何关于 *启动脚本（entry point / executable script）* 的细节。

## 表格测试

| 特性 | 旧实现 | 新实现 |
|------|--------|--------|
| Markdown 解析 | 手写正则 | react-markdown |
| **GFM 支持** | ❌ | ✅ |
| 代码高亮 | Shiki | *Shiki 异步* |

## 混合测试

### Copal 的启动脚本

根据当前提供的上下文信息，仅能确认以下内容：

- **项目名称**：Copal
- **包含文件**：\`Tests/__init__.py\`
- **摘要描述**：Test suite

这些信息来源于上下文 **[1]**。其中并未提及任何关于 **启动脚本（entry point / executable script）** 的细节。

### 结论

在现有的上下文中 **没有提及 Copal 的启动脚本**（如 \`main.py\` 或 \`setup.py\` 等）。

## 分割线

---

## Emoji 和特殊字符

✅ ❌ ⚠️ 🚀 📦 🎯

## 嵌套结构

1. 第一步
   - 子步骤 1
   - 子步骤 2
2. 第二步
   \`\`\`bash
   npm install
   \`\`\`
3. 完成！
`

export function TestMarkdownPage() {
  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>StreamingMarkdown 组件测试</CardTitle>
        </CardHeader>
        <CardContent>
          <StreamingMarkdown content={testMarkdown} />
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>原始 Markdown</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap bg-muted p-4 rounded text-xs">
            {testMarkdown}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
