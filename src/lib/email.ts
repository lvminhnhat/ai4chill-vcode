import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 'dummy-key-for-build')

interface OrderDetails {
  id: string
  total: number
  createdAt: Date
  user: {
    name: string | null
    email: string
  }
  orderItems: Array<{
    id: string
    quantity: number
    price: number
    product: {
      name: string
    }
    variant: {
      name: string
      duration: string
    }
  }>
}

interface CredentialInfo {
  productName: string
  variantName: string
  duration: string
  email: string
  password: string
}

export async function sendOrderDeliveredEmail(
  to: string,
  orderDetails: OrderDetails,
  credentials: CredentialInfo[]
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    // Runtime validation for API key
    if (
      !process.env.RESEND_API_KEY ||
      process.env.RESEND_API_KEY === 'dummy-key-for-build'
    ) {
      console.error('RESEND_API_KEY is not configured for email sending')
      return { success: false, error: 'Email service not configured' }
    }

    const emailHtml = generateDeliveryEmailTemplate(orderDetails, credentials)

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
      to: [to],
      subject: `Order Delivered - ${orderDetails.id}`,
      html: emailHtml,
    })

    if (error) {
      console.error('Email send error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, emailId: data?.id }
  } catch (error) {
    console.error('Error sending delivery email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

function generateDeliveryEmailTemplate(
  orderDetails: OrderDetails,
  credentials: CredentialInfo[]
): string {
  const customerName = orderDetails.user.name || 'Valued Customer'
  const orderDate = orderDetails.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const credentialsTable = credentials
    .map(
      (cred, index) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 16px; border-bottom: 1px solid #e5e7eb;">
        <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">
          ${cred.productName}
        </div>
        <div style="font-size: 14px; color: #6b7280;">
          ${cred.variantName} - ${cred.duration}
        </div>
      </td>
      <td style="padding: 16px; border-bottom: 1px solid #e5e7eb;">
        <div style="font-family: 'Courier New', monospace; background: #f3f4f6; padding: 8px; border-radius: 4px; font-size: 14px;">
          ${cred.email}
        </div>
      </td>
      <td style="padding: 16px; border-bottom: 1px solid #e5e7eb;">
        <div style="font-family: 'Courier New', monospace; background: #f3f4f6; padding: 8px; border-radius: 4px; font-size: 14px;">
          ${cred.password}
        </div>
      </td>
    </tr>
  `
    )
    .join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Delivered - ${orderDetails.id}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #374151;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9fafb;
        }
        .container {
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          padding: 32px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
        }
        .content {
          padding: 32px;
        }
        .section {
          margin-bottom: 32px;
        }
        .section h2 {
          color: #1f2937;
          font-size: 20px;
          margin-bottom: 16px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 8px;
        }
        .order-info {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 24px;
        }
        .order-info div {
          margin-bottom: 8px;
        }
        .order-info strong {
          color: #1f2937;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
        }
        th {
          background: #f8fafc;
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          color: #1f2937;
          border-bottom: 2px solid #e5e7eb;
        }
        .footer {
          background: #f8fafc;
          padding: 24px 32px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer p {
          margin: 0 0 8px 0;
          color: #6b7280;
          font-size: 14px;
        }
        .support-link {
          color: #3b82f6;
          text-decoration: none;
          font-weight: 500;
        }
        .support-link:hover {
          text-decoration: underline;
        }
        .warning-box {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 6px;
          padding: 16px;
          margin: 16px 0;
        }
        .warning-box h3 {
          color: #92400e;
          margin: 0 0 8px 0;
          font-size: 16px;
        }
        .warning-box p {
          color: #78350f;
          margin: 0;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Order Delivered Successfully!</h1>
        </div>
        
        <div class="content">
          <div class="section">
            <p>Dear ${customerName},</p>
            <p>Great news! Your order has been successfully processed and delivered. Below are your account credentials for all purchased products.</p>
          </div>

          <div class="section">
            <h2>Order Information</h2>
            <div class="order-info">
              <div><strong>Order ID:</strong> ${orderDetails.id}</div>
              <div><strong>Order Date:</strong> ${orderDate}</div>
              <div><strong>Total Amount:</strong> $${orderDetails.total.toFixed(2)}</div>
              <div><strong>Email:</strong> ${orderDetails.user.email}</div>
            </div>
          </div>

          <div class="section">
            <h2>Your Account Credentials</h2>
            <table>
              <thead>
                <tr>
                  <th style="width: 40%;">Product</th>
                  <th style="width: 30%;">Email</th>
                  <th style="width: 30%;">Password</th>
                </tr>
              </thead>
              <tbody>
                ${credentialsTable}
              </tbody>
            </table>

            <div class="warning-box">
              <h3>⚠️ Important Security Notice</h3>
              <p>Please save these credentials securely. We recommend changing passwords immediately after first login. Never share these credentials with others.</p>
            </div>
          </div>

          <div class="section">
            <h2>Next Steps</h2>
            <ol style="padding-left: 20px; line-height: 1.8;">
              <li>Log in to each service using the provided credentials</li>
              <li>Change your password immediately for security</li>
              <li>Verify your subscription details and duration</li>
              <li>Save credentials in a secure password manager</li>
            </ol>
          </div>

          <div class="section">
            <h2>Need Help?</h2>
            <p>If you encounter any issues with your accounts or have questions about your order, please don't hesitate to contact our support team:</p>
            <p>
              📧 Email: <a href="mailto:${process.env.SUPPORT_EMAIL || 'support@yourdomain.com'}" class="support-link">${process.env.SUPPORT_EMAIL || 'support@yourdomain.com'}</a><br>
              🕐 We typically respond within 24 hours
            </p>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for choosing our service! 🚀</p>
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© ${new Date().getFullYear()} AI4Chill. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `
}
