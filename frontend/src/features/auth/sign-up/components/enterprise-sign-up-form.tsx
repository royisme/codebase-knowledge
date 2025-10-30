import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import {
  ArrowRight,
  ArrowLeft,
  Building,
  CheckCircle,
  Shield,
  User,
  Mail,
  Lock,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'

const step1Schema = z.object({
  fullName: z.string().min(1, '请输入姓名').max(60, '姓名过长'),
  email: z.email({
    error: (iss) => (iss.input === '' ? '请输入邮箱地址' : undefined),
  }),
  department: z.string().min(1, '请选择部门'),
  company: z.string().min(1, '请输入企业名称'),
})

const step2Schema = z
  .object({
    password: z.string().min(7, '密码长度至少7个字符'),
    confirmPassword: z.string().min(1, '请确认密码'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  })

const step3Schema = z.object({
  ldapPassword: z.string().min(1, '请输入 LDAP 密码'),
})

type Step1Data = z.infer<typeof step1Schema>
type Step2Data = z.infer<typeof step2Schema>
type Step3Data = z.infer<typeof step3Schema>

interface EnterpriseSignUpFormProps {
  className?: string
}

export function EnterpriseSignUpForm({
  className,
  ...props
}: EnterpriseSignUpFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [ldapStatus, setLdapStatus] = useState<
    'idle' | 'checking' | 'validating' | 'success' | 'failed'
  >('idle')
  const navigate = useNavigate()

  const [step1Data, setStep1Data] = useState<Step1Data>({
    fullName: '',
    email: '',
    department: '',
    company: '',
  })

  const [step2Data, setStep2Data] = useState<Step2Data>({
    password: '',
    confirmPassword: '',
  })

  const step3Data = { ldapPassword: '' }

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: step1Data,
  })

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: step2Data,
  })

  const step3Form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: step3Data,
  })

  const departments = [
    '技术部',
    '产品部',
    '运营部',
    '市场部',
    '销售部',
    '人力资源部',
    '财务部',
    '法务部',
    '行政部',
  ]

  // LDAP 验证函数
  const validateLdapConnection = async (
    email: string,
    ldapPassword: string,
    originalPassword: string
  ) => {
    setLdapStatus('checking')

    // 模拟 LDAP 连接检查
    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (email.includes('@corp.company.com')) {
      setLdapStatus('validating')
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // 验证 LDAP 密码是否与设置的密码一致
      if (ldapPassword === originalPassword) {
        setLdapStatus('success')
        return true
      } else {
        setLdapStatus('failed')
        return false
      }
    } else {
      setLdapStatus('failed')
      return false
    }
  }

  const handleStep1Submit = (data: Step1Data) => {
    setStep1Data(data)
    setCurrentStep(2)
  }

  const handleStep2Submit = (data: Step2Data) => {
    setStep2Data(data)
    setCurrentStep(3)
  }

  const handleStep3Submit = async (data: Step3Data) => {
    setIsLoading(true)

    try {
      const ldapValid = await validateLdapConnection(
        step1Data.email,
        data.ldapPassword,
        step2Data.password
      )

      if (!ldapValid) {
        toast.error('LDAP 认证失败，请检查密码是否与之前设置的一致')
        setIsLoading(false)
        return
      }

      // 创建账户
      const submissionPromise = new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            user: {
              id: 'enterprise-user-1',
              email: step1Data.email,
              name: step1Data.fullName,
              role: 'user',
              department: step1Data.department,
              company: step1Data.company,
            },
            token: {
              accessToken: 'enterprise-token-' + Date.now(),
              refreshToken: 'refresh-token-' + Date.now(),
              expiresAt: new Date(Date.now() + 3600000).toISOString(),
            },
          })
        }, 1000)
      })

      toast.promise(submissionPromise, {
        loading: '正在创建企业账户...',
        success: `欢迎加入 ${step1Data.company}！`,
        error: '账户创建失败，请稍后再试',
      })

      await submissionPromise

      toast.success('企业账户创建成功！请使用新账户登录')
      navigate({ to: '/sign-in' })
    } catch {
      toast.error('注册过程中出现问题，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const getLdapStatusIcon = () => {
    switch (ldapStatus) {
      case 'checking':
        return <Loader2 className='h-4 w-4 animate-spin' />
      case 'validating':
        return <Loader2 className='h-4 w-4 animate-spin' />
      case 'success':
        return <CheckCircle className='h-4 w-4 text-green-600' />
      case 'failed':
        return <AlertCircle className='h-4 w-4 text-red-500' />
      default:
        return <Shield className='h-4 w-4' />
    }
  }

  const getLdapStatusText = () => {
    switch (ldapStatus) {
      case 'checking':
        return '正在连接企业 LDAP 服务器...'
      case 'validating':
        return '正在验证 LDAP 凭据...'
      case 'success':
        return 'LDAP 认证验证成功！'
      case 'failed':
        return 'LDAP 认证失败，请检查信息'
      default:
        return '准备进行 LDAP 验证'
    }
  }

  return (
    <div className={cn('w-full space-y-6', className)} {...props}>
      {/* 步骤指示器 */}
      <div className='flex items-center justify-center space-x-4'>
        {[1, 2, 3].map((step) => (
          <div key={step} className='flex items-center'>
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                currentStep >= step
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {step}
            </div>
            <span
              className={cn(
                'ml-2 text-sm',
                currentStep >= step
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {step === 1 && '基本信息'}
              {step === 2 && '账户设置'}
              {step === 3 && '企业认证'}
            </span>
            {step < 3 && (
              <ArrowRight className='text-muted-foreground ml-4 h-4 w-4' />
            )}
          </div>
        ))}
      </div>

      {/* 步骤 1: 基本信息 */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <User className='h-5 w-5' />
              基本信息
            </CardTitle>
            <CardDescription>请填写您的基本信息和企业信息</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <Form {...step1Form}>
              <form
                onSubmit={step1Form.handleSubmit(handleStep1Submit)}
                className='space-y-4'
              >
                <FormField
                  control={step1Form.control}
                  name='fullName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>姓名</FormLabel>
                      <FormControl>
                        <Input placeholder='张三' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step1Form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>企业邮箱</FormLabel>
                      <FormControl>
                        <Input placeholder='name@corp.company.com' {...field} />
                      </FormControl>
                      <FormMessage />
                      <p className='text-muted-foreground mt-1 text-xs'>
                        请使用企业邮箱进行注册，格式：name@company.com
                      </p>
                    </FormItem>
                  )}
                />

                <FormField
                  control={step1Form.control}
                  name='department'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>所属部门</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                        >
                          <option value=''>请选择部门</option>
                          {departments.map((dept) => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step1Form.control}
                  name='company'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>企业名称</FormLabel>
                      <FormControl>
                        <Input placeholder='CIT Corporation' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type='submit' className='w-full'>
                  下一步：账户设置
                  <ArrowRight className='ml-2 h-4 w-4' />
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* 步骤 2: 账户设置 */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Lock className='h-5 w-5' />
              账户设置
            </CardTitle>
            <CardDescription>设置您的登录密码</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='bg-muted/30 rounded-lg border p-4'>
              <h4 className='mb-3 flex items-center gap-2 text-sm font-medium'>
                <Building className='text-primary h-4 w-4' />
                企业账户信息
              </h4>
              <div className='space-y-2 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>姓名:</span>
                  <span className='font-medium'>{step1Data.fullName}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>邮箱:</span>
                  <span className='font-medium'>{step1Data.email}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>部门:</span>
                  <span className='font-medium'>{step1Data.department}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>企业:</span>
                  <span className='font-medium'>{step1Data.company}</span>
                </div>
              </div>
            </div>

            <Form {...step2Form}>
              <form
                onSubmit={step2Form.handleSubmit(handleStep2Submit)}
                className='space-y-4'
              >
                <FormField
                  control={step2Form.control}
                  name='password'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>登录密码</FormLabel>
                      <FormControl>
                        <PasswordInput placeholder='请输入密码' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step2Form.control}
                  name='confirmPassword'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>确认密码</FormLabel>
                      <FormControl>
                        <PasswordInput
                          placeholder='请再次输入密码'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='flex gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={goBack}
                    className='flex-1'
                  >
                    <ArrowLeft className='mr-2 h-4 w-4' />
                    上一步
                  </Button>
                  <Button type='submit' className='flex-1'>
                    下一步：企业认证
                    <ArrowRight className='ml-2 h-4 w-4' />
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* 步骤 3: LDAP 认证 */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Shield className='h-5 w-5' />
              企业 LDAP 认证
            </CardTitle>
            <CardDescription>通过企业目录服务验证您的身份</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='bg-muted/30 rounded-lg border p-4'>
              <h4 className='mb-3 flex items-center gap-2 text-sm font-medium'>
                {getLdapStatusIcon()}
                LDAP 服务器状态
              </h4>
              <p className='text-sm'>{getLdapStatusText()}</p>

              <div className='mt-3 space-y-2'>
                <div className='flex items-center gap-2 text-xs'>
                  <div
                    className={cn(
                      'h-2 w-2 rounded-full',
                      ldapStatus === 'success'
                        ? 'bg-green-500'
                        : ldapStatus === 'failed'
                          ? 'bg-red-500'
                          : ldapStatus === 'checking' ||
                              ldapStatus === 'validating'
                            ? 'animate-pulse bg-orange-500'
                            : 'bg-gray-300'
                    )}
                  />
                  <span>
                    ldap://ldap.
                    {step1Data.company.toLowerCase().replace(/\s+/g, '')}
                    .com:389
                  </span>
                </div>
                <div className='flex items-center gap-2 text-xs'>
                  <div
                    className={cn(
                      'h-2 w-2 rounded-full',
                      ldapStatus === 'success'
                        ? 'bg-green-500'
                        : ldapStatus === 'failed'
                          ? 'bg-red-500'
                          : ldapStatus === 'checking' ||
                              ldapStatus === 'validating'
                            ? 'animate-pulse bg-orange-500'
                            : 'bg-gray-300'
                    )}
                  />
                  <span>SSL/TLS 加密连接</span>
                </div>
              </div>
            </div>

            <Form {...step3Form}>
              <form
                onSubmit={step3Form.handleSubmit(handleStep3Submit)}
                className='space-y-4'
              >
                <FormField
                  control={step3Form.control}
                  name='ldapPassword'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LDAP 认证密码</FormLabel>
                      <FormControl>
                        <PasswordInput
                          placeholder='请输入您的 LDAP 认证密码'
                          {...field}
                          disabled={isLoading}
                          onChange={(e) => {
                            field.onChange(e)
                            // 当用户修改输入时，重置失败状态以允许重试
                            if (ldapStatus === 'failed') {
                              setLdapStatus('idle')
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className='text-muted-foreground mt-1 text-xs'>
                        请输入与上一步设置的密码相同的密码
                      </p>
                    </FormItem>
                  )}
                />

                <div className='flex items-center gap-2'>
                  <Badge variant='outline' className='text-xs'>
                    <Building className='mr-1 h-3 w-3' />
                    企业认证
                  </Badge>
                  <Badge variant='outline' className='text-xs'>
                    <Mail className='mr-1 h-3 w-3' />
                    {step1Data.email}
                  </Badge>
                </div>

                <div className='flex gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={goBack}
                    disabled={isLoading}
                    className='flex-1'
                  >
                    <ArrowLeft className='mr-2 h-4 w-4' />
                    上一步
                  </Button>
                  <Button
                    type='submit'
                    disabled={isLoading}
                    className='flex-1'
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        创建账户中...
                      </>
                    ) : (
                      <>
                        <Shield className='mr-2 h-4 w-4' />
                        完成注册
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
