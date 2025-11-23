import { requireAdmin } from '@/lib/session-utils'
import AdminLayout from './AdminLayout'

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Protect all admin routes
  await requireAdmin()

  return <AdminLayout>{children}</AdminLayout>
}
