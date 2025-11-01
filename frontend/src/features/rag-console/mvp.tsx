import { SourceSelector } from './components/SourceSelector'
import { QueryInput } from './components/QueryInput'
import { SummaryCard } from './components/SummaryCard'
import { AnswerSection } from './components/AnswerSection'
import { CodeSnippetList } from './components/CodeSnippetList'
import { QueryHistory } from './components/QueryHistory'
import { QueryLoadingSkeleton } from './components/QueryLoadingSkeleton'
import { ErrorDisplay } from './components/ErrorDisplay'
import { useRagConsoleMVP } from './hooks/useRagConsoleMVP'
import type { QueryTurn } from './types/mvp'
import { MessageSquare } from 'lucide-react'

export function RAGConsoleMVP() {
  const selectedSource = useRagConsoleMVP((state) => state.selectedSource)
  const selectSource = useRagConsoleMVP((state) => state.selectSource)
  const queryHistory = useRagConsoleMVP((state) => state.queryHistory)
  const isLoading = useRagConsoleMVP((state) => state.isLoading)
  const error = useRagConsoleMVP((state) => state.error)
  const currentResult = useRagConsoleMVP((state) => state.currentResult)
  const submitQuery = useRagConsoleMVP((state) => state.submitQuery)
  const clearHistory = useRagConsoleMVP((state) => state.clearHistory)
  const setError = useRagConsoleMVP((state) => state.setError)

  const handleSelectHistory = (turn: QueryTurn) => {
    // 查看历史记录（不重新查询）
    if (turn.result) {
      // MVP 简化：暂不实现历史记录查看
      // TODO: 实现历史记录查看功能
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* 左侧边栏 */}
        <div className="space-y-6">
          {/* 知识源选择器 */}
          <SourceSelector
            selectedSource={selectedSource}
            onSelect={selectSource}
          />

          {/* 查询历史 */}
          <QueryHistory
            history={queryHistory}
            onSelect={handleSelectHistory}
            onClear={clearHistory}
          />
        </div>

        {/* 主面板 */}
        <div className="space-y-6">
          {/* 查询输入 */}
          <QueryInput
            onSubmit={submitQuery}
            isLoading={isLoading}
            disabled={!selectedSource}
            error={error}
          />

          {/* 结果区域 */}
          {isLoading && <QueryLoadingSkeleton />}

          {!isLoading && error && !currentResult && (
            <ErrorDisplay
              error={error}
              onRetry={() => setError(null)}
            />
          )}

          {!isLoading && currentResult && (
            <div className="space-y-6">
              {/* 摘要卡片 */}
              <SummaryCard metadata={currentResult.metadata} />

              {/* 回答摘要 */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">回答</h3>
                <AnswerSection summary={currentResult.summary} />
              </div>

              {/* 代码片段 */}
              <CodeSnippetList snippets={currentResult.codeSnippets} />
            </div>
          )}

          {/* 初始空态 */}
          {!isLoading && !error && !currentResult && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquare className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {selectedSource ? '开始提问' : '请选择知识源'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {selectedSource
                  ? '输入您的问题，例如：订单签名验证在哪里实现？'
                  : '从左侧选择一个知识源，然后输入问题开始查询'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
