import { useState } from 'react'
import { Database, FileText, Globe, Code2, Webhook } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/layout/page-header'
import { RepositoryListContent } from './repositories'

// Mock 组件用于暂未实现的 Tab
function ComingSoonTab({
  title,
  icon,
}: {
  title: string
  icon: React.ReactNode
}) {
  return (
    <Card className='border-dashed'>
      <CardHeader>
        <CardTitle className='text-muted-foreground flex items-center gap-2'>
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className='flex flex-col items-center justify-center py-12'>
        <div className='text-muted-foreground mb-4 text-center'>
          <p className='mb-2 text-lg font-medium'>功能开发中</p>
          <p className='text-sm'>该类型的知识源管理功能即将推出</p>
        </div>
        <Button variant='outline' disabled>
          敬请期待
        </Button>
      </CardContent>
    </Card>
  )
}

export function UnifiedKnowledgeSourcesPage() {
  const [activeTab, setActiveTab] = useState('code')

  return (
    <div className='h-full space-y-6 overflow-y-auto p-6'>
      <PageHeader
        title='知识源管理'
        description='统一管理所有类型的知识源，包括代码仓库、数据库、API、网站和文档'
        icon={<Database className='h-6 w-6' />}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList className='grid w-full max-w-2xl grid-cols-5'>
          <TabsTrigger value='code' className='gap-2'>
            <Code2 className='h-4 w-4' />
            代码仓库
          </TabsTrigger>
          <TabsTrigger value='database' className='gap-2'>
            <Database className='h-4 w-4' />
            数据库
          </TabsTrigger>
          <TabsTrigger value='api' className='gap-2'>
            <Webhook className='h-4 w-4' />
            API 端点
          </TabsTrigger>
          <TabsTrigger value='website' className='gap-2'>
            <Globe className='h-4 w-4' />
            网站
          </TabsTrigger>
          <TabsTrigger value='document' className='gap-2'>
            <FileText className='h-4 w-4' />
            文档
          </TabsTrigger>
        </TabsList>

        <TabsContent value='code' className='mt-6'>
          {/* 复用现有的代码仓库管理内容组件 */}
          <RepositoryListContent />
        </TabsContent>

        <TabsContent value='database' className='mt-6'>
          <ComingSoonTab
            title='数据库连接管理'
            icon={<Database className='h-8 w-8' />}
          />
        </TabsContent>

        <TabsContent value='api' className='mt-6'>
          <ComingSoonTab
            title='API 端点管理'
            icon={<Webhook className='h-8 w-8' />}
          />
        </TabsContent>

        <TabsContent value='website' className='mt-6'>
          <ComingSoonTab
            title='网站爬虫管理'
            icon={<Globe className='h-8 w-8' />}
          />
        </TabsContent>

        <TabsContent value='document' className='mt-6'>
          <ComingSoonTab
            title='文档管理'
            icon={<FileText className='h-8 w-8' />}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
