'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { logger } from '@/lib/logger'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Loader2, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'

// Form validation schema
const registerSchema = z
  .object({
    email: z.string().email({ message: 'Email không hợp lệ' }),
    password: z
      .string()
      .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
      .max(72, 'Mật khẩu không được quá 72 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
    name: z.string().optional(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

// Password strength checker
const checkPasswordStrength = (
  password: string
): { score: number; feedback: string[] } => {
  const feedback: string[] = []
  let score = 0

  if (password.length >= 8) score += 1
  else feedback.push('Ít nhất 8 ký tự')

  if (password.length >= 12) score += 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
  else feedback.push('Chữ hoa và chữ thường')

  if (/\d/.test(password)) score += 1
  else feedback.push('Ít nhất một số')

  if (/[^a-zA-Z\d]/.test(password)) score += 1
  else feedback.push('Ít nhất một ký tự đặc biệt')

  return { score, feedback }
}

const getStrengthColor = (score: number): string => {
  if (score <= 2) return 'bg-red-500'
  if (score <= 3) return 'bg-yellow-500'
  return 'bg-green-500'
}

const getStrengthText = (score: number): string => {
  if (score <= 2) return 'Yếu'
  if (score <= 3) return 'Trung bình'
  return 'Mạnh'
}

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number
    feedback: string[]
  }>({
    score: 0,
    feedback: [],
  })

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
    },
    mode: 'onChange',
  })

  const watchedPassword = form.watch('password')

  // Update password strength when password changes
  const handlePasswordChange = (value: string) => {
    form.setValue('password', value)
    const strength = checkPasswordStrength(value)
    setPasswordStrength(strength)
  }

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true)
    setServerError(null)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          name: data.name || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        // Handle different error types
        if (result.error?.code === 'DUPLICATE_EMAIL') {
          setServerError('Email này đã được sử dụng. Vui lòng chọn email khác.')
        } else if (result.error?.code === 'VALIDATION_ERROR') {
          setServerError(result.error.message || 'Dữ liệu không hợp lệ.')
        } else if (result.error?.code === 'TOO_MANY_REQUESTS') {
          setServerError('Quá nhiều yêu cầu. Vui lòng thử lại sau.')
        } else {
          setServerError('Đã xảy ra lỗi. Vui lòng thử lại.')
        }
        return
      }

      // Registration successful
      if (result.success) {
        // Redirect to login page with success message
        router.push(
          '/auth/login?message=Đăng ký thành công! Vui lòng đăng nhập.'
        )
      }
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message.includes('email') ||
          error.message.includes('duplicate')
        ) {
          setServerError('Email này đã được sử dụng. Vui lòng chọn email khác.')
        } else if (
          error.message.includes('password') ||
          error.message.includes('weak')
        ) {
          setServerError('Mật khẩu không đủ mạnh. Vui lòng chọn mật khẩu khác.')
        } else if (
          error.message.includes('network') ||
          error.message.includes('fetch')
        ) {
          setServerError('Lỗi kết nối. Vui lòng kiểm tra mạng và thử lại.')
        } else {
          setServerError('Đăng ký thất bại. Vui lòng thử lại sau.')
        }
        logger.error('Registration failed', {
          errorMessage: error.message,
          email: data.email,
          stack: error.stack,
        })
      } else {
        setServerError('Đã xảy ra lỗi không xác định. Vui lòng liên hệ hỗ trợ.')
        logger.error('Unknown registration error', { error, email: data.email })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Đăng ký tài khoản
          </CardTitle>
          <CardDescription className="text-center">
            Tạo tài khoản mới để bắt đầu sử dụng dịch vụ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Name Field */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="name">Họ và tên (tùy chọn)</FormLabel>
                    <FormControl>
                      <Input
                        id="name"
                        placeholder="Nhập họ và tên của bạn"
                        {...field}
                        disabled={isLoading}
                        aria-label="Họ và tên"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="email">Email *</FormLabel>
                    <FormControl>
                      <Input
                        id="email"
                        type="email"
                        placeholder="nhập email của bạn"
                        {...field}
                        disabled={isLoading}
                        aria-label="Email"
                        aria-required="true"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password Field */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="password">Mật khẩu *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Nhập mật khẩu"
                          {...field}
                          disabled={isLoading}
                          aria-label="Mật khẩu"
                          aria-required="true"
                          onChange={e => handlePasswordChange(e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                          aria-label={
                            showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'
                          }
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />

                    {/* Password Strength Indicator */}
                    {watchedPassword && (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">
                            Độ mạnh mật khẩu:
                          </span>
                          <span
                            className={`text-xs font-medium ${
                              passwordStrength.score <= 2
                                ? 'text-red-600'
                                : passwordStrength.score <= 3
                                  ? 'text-yellow-600'
                                  : 'text-green-600'
                            }`}
                          >
                            {getStrengthText(passwordStrength.score)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(passwordStrength.score)}`}
                            style={{
                              width: `${(passwordStrength.score / 5) * 100}%`,
                            }}
                          />
                        </div>
                        {passwordStrength.feedback.length > 0 && (
                          <div className="text-xs text-gray-600 space-y-1">
                            {passwordStrength.feedback.map((item, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-1"
                              >
                                <XCircle className="h-3 w-3 text-red-500" />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </FormItem>
                )}
              />

              {/* Confirm Password Field */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="confirmPassword">
                      Xác nhận mật khẩu *
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Nhập lại mật khẩu"
                          {...field}
                          disabled={isLoading}
                          aria-label="Xác nhận mật khẩu"
                          aria-required="true"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          disabled={isLoading}
                          aria-label={
                            showConfirmPassword
                              ? 'Ẩn mật khẩu xác nhận'
                              : 'Hiện mật khẩu xác nhận'
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />

                    {/* Password match indicator */}
                    {watchedPassword && field.value && (
                      <div className="mt-1">
                        {watchedPassword === field.value ? (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle className="h-3 w-3" />
                            <span>Mật khẩu khớp</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-red-600">
                            <XCircle className="h-3 w-3" />
                            <span>Mật khẩu không khớp</span>
                          </div>
                        )}
                      </div>
                    )}
                  </FormItem>
                )}
              />

              {/* Server Error */}
              {serverError && (
                <div className="rounded-md bg-red-50 p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <XCircle
                        className="h-5 w-5 text-red-400"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Lỗi</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{serverError}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 focus:ring-blue-600"
                disabled={isLoading}
                aria-describedby={serverError ? 'error-message' : undefined}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Đăng ký'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600">
            Đã có tài khoản?{' '}
            <Link
              href="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Đăng nhập
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
