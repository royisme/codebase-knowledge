import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Card } from '@/components/ui/card'

interface AnswerSectionProps {
  summary: string
}

export function AnswerSection({ summary }: AnswerSectionProps) {
  return (
    <Card className="p-6">
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {summary}
        </ReactMarkdown>
      </div>
    </Card>
  )
}
