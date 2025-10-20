import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { GraduationCap, User, BookOpen } from 'lucide-react'

export function AssignmentInfo() {
  return (
    <Card className='group relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 via-primary/3 to-background shadow-sm shadow-primary/10 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1'>
      {/* 背景装饰 */}
      <div className='absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/2 opacity-50' />
      <div className='absolute top-0 right-0 h-20 w-20 rounded-full bg-gradient-to-bl from-primary/10 to-transparent blur-2xl' />

      <CardHeader className='relative pb-4'>
        <div className='flex items-center gap-3'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20 transition-all duration-300 group-hover:ring-primary/30'>
            <GraduationCap className='h-6 w-6 text-primary' />
          </div>
          <div>
            <h3 className='text-lg font-bold tracking-tight text-primary'>
              NAU MCIT
            </h3>
            <p className='text-xs text-muted-foreground'>Enterprise Knowledge Graph</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className='relative space-y-4'>
        {/* 学生信息分组 */}
        <div className='space-y-3 rounded-lg bg-background/50 p-4 backdrop-blur-sm'>
          <div className='flex items-center gap-3'>
            <Avatar className='h-10 w-10 border-2 border-primary/20'>
              <AvatarImage src='' alt='Student Avatar' />
              <AvatarFallback className='bg-primary/10 text-primary'>
                SZ
              </AvatarFallback>
            </Avatar>
            <div className='flex-1'>
              <div className='flex items-center gap-2'>
                <User className='h-4 w-4 text-muted-foreground' />
                <span className='font-medium text-foreground'>ShaoQing Zhu</span>
              </div>
              <p className='text-sm text-muted-foreground'>学生 ID: 6456610</p>
            </div>
          </div>
        </div>

        {/* 课程信息分组 */}
        <div className='space-y-2 rounded-lg bg-background/30 p-4 backdrop-blur-sm'>
          <div className='flex items-start gap-3'>
            <BookOpen className='mt-0.5 h-4 w-4 text-muted-foreground flex-shrink-0' />
            <div className='flex-1'>
              <div className='font-medium text-foreground mb-1'>课程信息</div>
              <Badge variant='secondary' className='mb-2'>
                CIT693
              </Badge>
              <p className='text-sm text-muted-foreground leading-relaxed'>
                移动和网络应用开发高阶项目
              </p>
            </div>
          </div>
        </div>

        {/* 底部装饰线 */}
        <div className='h-1 w-full bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 rounded-full' />
      </CardContent>
    </Card>
  )
}
