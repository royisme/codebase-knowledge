import { GraduationCap, User, BookOpen } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function AssignmentInfo() {
  return (
    <Card className='group border-border/50 bg-card/80 hover:border-border hover:bg-card supports-[backdrop-filter]:bg-card/70 relative overflow-hidden border shadow-xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl'>
      {/* 背景装饰 */}
      <div className='from-primary/15 absolute inset-0 bg-gradient-to-br via-transparent to-sky-500/15 opacity-60' />
      <div className='bg-primary/20 dark:bg-primary/30 absolute top-0 right-0 h-32 w-32 rounded-full blur-3xl' />
      <div className='absolute bottom-0 left-0 h-32 w-32 rounded-full bg-sky-300/30 blur-3xl dark:bg-sky-600/30' />

      <CardHeader className='relative pb-4'>
        <div className='flex items-center gap-3'>
          <div className='from-primary shadow-primary/40 group-hover:shadow-primary/60 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br to-sky-500 shadow-lg transition-all duration-300 group-hover:scale-110'>
            <GraduationCap className='text-primary-foreground h-6 w-6' />
          </div>
          <div>
            <h3 className='text-foreground text-lg font-bold tracking-tight'>
              NAU MCIT
            </h3>
            <p className='text-muted-foreground text-xs'>
              Enterprise Knowledge Graph
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className='relative space-y-4'>
        {/* 学生信息分组 */}
        <div className='border-border/50 bg-card/60 supports-[backdrop-filter]:bg-card/70 space-y-3 rounded-xl border p-4 backdrop-blur-sm'>
          <div className='flex items-center gap-3'>
            <Avatar className='border-primary/30 h-10 w-10 border-2'>
              <AvatarImage src='' alt='Student Avatar' />
              <AvatarFallback className='from-primary text-primary-foreground bg-gradient-to-br to-sky-500 font-semibold'>
                SZ
              </AvatarFallback>
            </Avatar>
            <div className='flex-1'>
              <div className='flex items-center gap-2'>
                <User className='text-muted-foreground h-4 w-4' />
                <span className='text-foreground font-medium'>
                  ShaoQing Zhu
                </span>
              </div>
              <p className='text-muted-foreground text-sm'>学生 ID: 6456610</p>
            </div>
          </div>
        </div>

        {/* 课程信息分组 */}
        <div className='border-border/50 bg-card/60 supports-[backdrop-filter]:bg-card/70 space-y-2 rounded-xl border p-4 backdrop-blur-sm'>
          <div className='flex items-start gap-3'>
            <BookOpen className='text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0' />
            <div className='flex-1'>
              <div className='text-foreground mb-2 font-medium'>课程信息</div>
              <Badge
                variant='secondary'
                className='border-primary/40 bg-primary/10 text-primary mb-2'
              >
                CIT693
              </Badge>
              <p className='text-muted-foreground text-sm leading-relaxed'>
                移动和网络应用开发高阶项目
              </p>
            </div>
          </div>
        </div>

        {/* 底部装饰线 */}
        <div className='from-primary/40 h-1 w-full rounded-full bg-gradient-to-r via-sky-500/40 to-blue-500/30 dark:via-sky-400/40' />
      </CardContent>
    </Card>
  )
}
