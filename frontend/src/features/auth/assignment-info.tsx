import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { GraduationCap, User, BookOpen } from 'lucide-react'

export function AssignmentInfo() {
  return (
    <Card className='group relative overflow-hidden border-white/10 bg-white/5 shadow-xl backdrop-blur-xl transition-all duration-500 hover:border-white/20 hover:bg-white/10 hover:shadow-2xl hover:-translate-y-1'>
      {/* 背景装饰 */}
      <div className='absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 opacity-50' />
      <div className='absolute top-0 right-0 h-32 w-32 rounded-full bg-gradient-to-bl from-purple-500/20 to-transparent blur-3xl' />
      <div className='absolute bottom-0 left-0 h-32 w-32 rounded-full bg-gradient-to-tr from-blue-500/20 to-transparent blur-3xl' />

      <CardHeader className='relative pb-4'>
        <div className='flex items-center gap-3'>
          <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50 transition-all duration-300 group-hover:shadow-purple-500/70 group-hover:scale-110'>
            <GraduationCap className='h-6 w-6 text-white' />
          </div>
          <div>
            <h3 className='text-lg font-bold tracking-tight text-white'>
              NAU MCIT
            </h3>
            <p className='text-xs text-slate-400'>Enterprise Knowledge Graph</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className='relative space-y-4'>
        {/* 学生信息分组 */}
        <div className='space-y-3 rounded-xl bg-white/5 p-4 backdrop-blur-sm border border-white/10'>
          <div className='flex items-center gap-3'>
            <Avatar className='h-10 w-10 border-2 border-purple-500/30'>
              <AvatarImage src='' alt='Student Avatar' />
              <AvatarFallback className='bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold'>
                SZ
              </AvatarFallback>
            </Avatar>
            <div className='flex-1'>
              <div className='flex items-center gap-2'>
                <User className='h-4 w-4 text-slate-400' />
                <span className='font-medium text-white'>ShaoQing Zhu</span>
              </div>
              <p className='text-sm text-slate-400'>学生 ID: 6456610</p>
            </div>
          </div>
        </div>

        {/* 课程信息分组 */}
        <div className='space-y-2 rounded-xl bg-white/5 p-4 backdrop-blur-sm border border-white/10'>
          <div className='flex items-start gap-3'>
            <BookOpen className='mt-0.5 h-4 w-4 text-slate-400 flex-shrink-0' />
            <div className='flex-1'>
              <div className='font-medium text-white mb-2'>课程信息</div>
              <Badge variant='secondary' className='mb-2 bg-purple-500/20 text-purple-300 border-purple-500/30'>
                CIT693
              </Badge>
              <p className='text-sm text-slate-400 leading-relaxed'>
                移动和网络应用开发高阶项目
              </p>
            </div>
          </div>
        </div>

        {/* 底部装饰线 */}
        <div className='h-1 w-full bg-gradient-to-r from-purple-500/30 via-pink-500/50 to-blue-500/30 rounded-full' />
      </CardContent>
    </Card>
  )
}
