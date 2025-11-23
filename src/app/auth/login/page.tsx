'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { signIn } from '@/lib/auth'
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
import { Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react'

// Form validation schema
const loginSchema = z.object({
  email: z.string().email({ message: 'Email không hợp lệ' }),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
  remember: z.boolean().optional(),
})

type LoginFormValues = z.infer<typeof loginSchema>

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  // Get success message from URL params
  const successMessage = searchParams.get('message')

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
    mode: 'onChange',
  })

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)
    setServerError(null)

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
        callbackUrl: '/',
      })

      if (result?.error) {
        // Handle different error types
        if (result.error.includes('CredentialsSignin')) {
          setServerError('Email hoặc mật khẩu không chính xác.')
        } else if (result.error.includes('Too many login attempts')) {
          setServerError('Quá nhiều lần thử. Vui lòng thử lại sau.')
        } else {
          setServerError('Đã xảy ra lỗi. Vui lòng thử lại.')
        }
        return
      }

      if (result?.ok) {
        // Login successful, redirect to intended page or dashboard
        const callbackUrl = searchParams.get('callbackUrl') || '/'
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message.includes('credential') ||
          error.message.includes('password')
        ) {
          setServerError('Email hoặc mật khẩu không chính xác.')
        } else if (
          error.message.includes('network') ||
          error.message.includes('fetch')
        ) {
          setServerError('Lỗi kết nối. Vui lòng kiểm tra mạng và thử lại.')
        } else if (
          error.message.includes('rate') ||
          error.message.includes('limit')
        ) {
          setServerError(
            'Quá nhiều lần thử. Vui lòng đợi vài phút rồi thử lại.'
          )
        } else {
          setServerError('Đăng nhập thất bại. Vui lòng thử lại sau.')
        }
        logger.error('Login failed', {
          errorMessage: error.message,
          email: data.email,
          stack: error.stack,
        })
      } else {
        setServerError('Đã xảy ra lỗi không xác định. Vui lòng liên hệ hỗ trợ.')
        logger.error('Unknown login error', { error, email: data.email })
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
            Đăng nhập
          </CardTitle>
          <CardDescription className="text-center">
            Nhập email và mật khẩu để truy cập tài khoản
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Success Message */}
          {successMessage && (
            <div className="rounded-md bg-green-50 p-3 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle
                    className="h-5 w-5 text-green-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Thành công
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>{successMessage}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        autoComplete="email"
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
                          autoComplete="current-password"
                          {...field}
                          disabled={isLoading}
                          aria-label="Mật khẩu"
                          aria-required="true"
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
                  </FormItem>
                )}
              />

              {/* Remember Me Checkbox */}
              <FormField
                control={form.control}
                name="remember"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                        checked={field.value}
                        onChange={field.onChange}
                        disabled={isLoading}
                        aria-label="Ghi nhớ đăng nhập"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal">
                        Ghi nhớ đăng nhập
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {/* Server Error */}
              {serverError && (
                <div className="rounded-md bg-red-50 p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
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
                  'Đăng nhập'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="flex justify-center">
            <Link
              href="#"
              className="text-sm text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <div className="flex justify-center">
            <p className="text-sm text-gray-600">
              Chưa có tài khoản?{' '}
              <Link
                href="/auth/register"
                className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Đăng ký
              </Link>
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  )
}
