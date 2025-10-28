import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { GraduationCap, User, BookOpen } from 'lucide-react'

export function AssignmentInfo() {
  return (
    <Card className='group relative overflow-hidden border border-border/50 bg-card/80 shadow-xl backdrop-blur-xl transition-all duration-500 hover:border-border hover:bg-card hover:shadow-2xl hover:-translate-y-1 supports-[backdrop-filter]:bg-card/70'>
      {/* 背景装饰 */}
      <div className='absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-sky-500/15 opacity-60' />
      <div className='absolute top-0 right-0 h-32 w-32 rounded-full bg-primary/20 blur-3xl dark:bg-primary/30' />
      <div className='absolute bottom-0 left-0 h-32 w-32 rounded-full bg-sky-300/30 blur-3xl dark:bg-sky-600/30' />

      <CardHeader className='relative pb-4'>
        <div className='flex items-center gap-3'>
          <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-sky-500 shadow-lg shadow-primary/40 transition-all duration-300 group-hover:shadow-primary/60 group-hover:scale-110'>
            <GraduationCap className='h-6 w-6 text-primary-foreground' />
          </div>
          <div>
            <h3 className='text-lg font-bold tracking-tight text-foreground'>
              NAU MCIT
            </h3>
            <p className='text-xs text-muted-foreground'>Enterprise Knowledge Graph</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className='relative space-y-4'>
        {/* 学生信息分组 */}
        <div className='space-y-3 rounded-xl border border-border/50 bg-card/60 p-4 backdrop-blur-sm supports-[backdrop-filter]:bg-card/70'>
          <div className='flex items-center gap-3'>
            <Avatar className='h-10 w-10 border-2 border-primary/30'>
              <AvatarImage src='' alt='Student Avatar' />
              <AvatarFallback className='bg-gradient-to-br from-primary to-sky-500 text-primary-foreground font-semibold'>
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
        <div className='space-y-2 rounded-xl border border-border/50 bg-card/60 p-4 backdrop-blur-sm supports-[backdrop-filter]:bg-card/70'>
          <div className='flex items-start gap-3'>
            <BookOpen className='mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground' />
            <div className='flex-1'>
              <div className='mb-2 font-medium text-foreground'>课程信息</div>
              <Badge variant='secondary' className='mb-2 border-primary/40 bg-primary/10 text-primary'>
                CIT693
              </Badge>
              <p className='text-sm leading-relaxed text-muted-foreground'>
                移动和网络应用开发高阶项目
              </p>
            </div>
          </div>
        </div>

        {/* 底部装饰线 */}
        <div className='h-1 w-full rounded-full bg-gradient-to-r from-primary/40 via-sky-500/40 to-blue-500/30 dark:via-sky-400/40' />
      </CardContent>
    </Card>
  )
}
