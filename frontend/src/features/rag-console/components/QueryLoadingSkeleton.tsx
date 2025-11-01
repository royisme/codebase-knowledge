import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function QueryLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* 摘要卡片骨架 */}
      <Card className="p-4">
        <div className="flex gap-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-28" />
        </div>
      </Card>

      {/* 回答摘要骨架 */}
      <Card className="p-6">
        <Skeleton className="h-6 w-64 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </Card>

      {/* 代码片段骨架 */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        {[1, 2].map((i) => (
          <Card key={i} className="overflow-hidden">
            <div className="border-b bg-muted/50 p-4">
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-4 w-32 mt-1" />
            </div>
            <div className="p-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
