import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useKnowledgeNoteStore } from '@/stores/knowledge-note-store';
import {
  TrendingUp,
  TrendingDown,
  Database,
  MessageSquare,
  Activity,
  BookMarked,
  Search,
  MessageCircleQuestion,
  Library,
  AlertCircle,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

interface DashboardSummary {
  activeSources: number;
  queriesToday: number;
  indexHealth: number;
  savedEntries: number;
  delta: {
    activeSources: number;
    queriesToday: number;
    indexHealth: number;
    savedEntries: number;
  };
}

interface QueryTrend {
  date: string;
  count: number;
}

interface SourceStatus {
  id: string;
  name: string;
  alias: string;
  branch: string;
  lastIndexed: string;
  status: 'healthy' | 'outdated' | 'indexing' | 'failed';
  queryCount7d: number;
}

const fetchDashboardSummary = async (): Promise<DashboardSummary> => {
  return apiClient<DashboardSummary>({
    endpoint: API_ENDPOINTS.dashboard.summary,
  });
};

const fetchQueryTrend = async (): Promise<QueryTrend[]> => {
  return apiClient<QueryTrend[]>({
    endpoint: API_ENDPOINTS.dashboard.queryTrend,
  });
};

const fetchSourceStatus = async (): Promise<SourceStatus[]> => {
  return apiClient<SourceStatus[]>({
    endpoint: API_ENDPOINTS.dashboard.sourceStatus,
  });
};

const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string }> = {
    healthy: { variant: 'default', label: '健康' },
    outdated: { variant: 'secondary', label: '过期' },
    indexing: { variant: 'outline', label: '索引中' },
    failed: { variant: 'destructive', label: '失败' },
  };

  const config = variants[status] || variants.healthy;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const DeltaIndicator = ({ value }: { value: number }) => {
  if (value === 0) return null;
  const isPositive = value > 0;
  return (
    <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      <span>{isPositive ? '+' : ''}{value}</span>
    </div>
  );
};

export const DashboardPage = () => {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: fetchDashboardSummary,
  });

  const { data: queryTrend, isLoading: trendLoading } = useQuery({
    queryKey: ['dashboard', 'query-trend'],
    queryFn: fetchQueryTrend,
  });

  const { data: sourceStatus, isLoading: sourceLoading } = useQuery({
    queryKey: ['dashboard', 'source-status'],
    queryFn: fetchSourceStatus,
  });

  const notesCount = useKnowledgeNoteStore((state) => state.getNotesCount());

  const outdatedSources = sourceStatus?.filter(s => s.status === 'outdated' || s.status === 'failed') || [];

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">知识工作台</h1>
          <p className="text-muted-foreground">
            通过 AI 代码知识图谱快速了解项目结构与业务逻辑
          </p>
        </div>

      {/* 异常提示 */}
      {outdatedSources.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">索引状态异常</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-200 mt-1">
                  有 {outdatedSources.length} 个知识源的索引已过期或失败,可能影响查询结果准确性
                </p>
                <Button variant="link" size="sm" className="px-0 h-auto mt-2 text-yellow-900 dark:text-yellow-100" asChild>
                  <Link to="/knowledge-explore">查看详情 →</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃知识源</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{summary?.activeSources}</div>
                <DeltaIndicator value={summary?.delta.activeSources || 0} />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日提问</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{summary?.queriesToday}</div>
                <DeltaIndicator value={summary?.delta.queriesToday || 0} />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">索引健康度</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {((summary?.indexHealth || 0) * 100).toFixed(0)}%
                </div>
                <DeltaIndicator value={Math.round((summary?.delta.indexHealth || 0) * 100)} />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">收藏条目</CardTitle>
            <BookMarked className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notesCount}</div>
            <p className="text-xs text-muted-foreground">个人知识库</p>
          </CardContent>
        </Card>
      </div>

      {/* 趋势图 */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>提问趋势</CardTitle>
          <p className="text-sm text-muted-foreground">最近 7 天的提问次数统计</p>
        </CardHeader>
        <CardContent className="pt-0">
          {trendLoading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={queryTrend}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }} 
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  className="text-muted-foreground"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* 知识源状态 */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>知识源状态</CardTitle>
          <p className="text-sm text-muted-foreground">当前可访问的代码仓库与索引情况</p>
        </CardHeader>
        <CardContent className="pt-0">
          {sourceLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {sourceStatus?.map((source) => (
                <div key={source.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold truncate">{source.alias}</h4>
                      <StatusBadge status={source.status} />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="truncate inline-block max-w-md">{source.name}</span>
                      <span className="mx-2">·</span>
                      <span>{source.branch}</span>
                      <span className="mx-2">·</span>
                      <span>最后索引: {new Date(source.lastIndexed).toLocaleString('zh-CN', { 
                        month: 'numeric', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-lg font-semibold">{source.queryCount7d}</div>
                      <div className="text-xs text-muted-foreground">7日提问</div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/knowledge-explore" search={{ sourceId: source.id }}>
                        查看
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 快捷入口 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link to="/knowledge-explore" className="group">
          <Card className="h-full border-2 transition-all hover:border-primary/50 hover:shadow-md cursor-pointer">
            <CardHeader className="pb-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-950 rounded-xl transition-transform group-hover:scale-110">
                  <Search className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg mb-1">探索知识源</CardTitle>
                  <p className="text-sm text-muted-foreground">浏览可用的代码仓库</p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/knowledge-graph-query" className="group">
          <Card className="h-full border-2 transition-all hover:border-primary/50 hover:shadow-md cursor-pointer">
            <CardHeader className="pb-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-950 rounded-xl transition-transform group-hover:scale-110">
                  <MessageCircleQuestion className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg mb-1">代码问答</CardTitle>
                  <p className="text-sm text-muted-foreground">提问并获取智能回答</p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/knowledge-library" className="group">
          <Card className="h-full border-2 transition-all hover:border-primary/50 hover:shadow-md cursor-pointer">
            <CardHeader className="pb-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-950 rounded-xl transition-transform group-hover:scale-110">
                  <Library className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg mb-1">知识库</CardTitle>
                  <p className="text-sm text-muted-foreground">查看收藏与历史</p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>
      </div>
    </div>
  );
};
