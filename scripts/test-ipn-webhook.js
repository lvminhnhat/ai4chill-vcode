#!/usr/bin/env node

/**
 * Script to test SePay IPN webhook locally
 * Usage: npm run test:ipn
 */

const {
  runIpnTests,
  mockIpnPayloads,
  testIpnWebhook,
} = require('../src/lib/__tests__/test-ipn-webhook.ts')

async function main() {
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000'

  console.log('🚀 Testing SePay IPN Webhook')
  console.log(`📡 Target URL: ${baseUrl}/api/payment/ipn\n`)

  // Check if server is running
  try {
    const healthResponse = await fetch(`${baseUrl}/api/payment/ipn`)
    if (!healthResponse.ok) {
      throw new Error('Server not responding correctly')
    }
    console.log('✅ Server is running\n')
  } catch (error) {
    console.error(
      '❌ Server is not running. Please start the development server first:'
    )
    console.error('   npm run dev')
    process.exit(1)
  }

  // Run all test cases
  await runIpnTests(baseUrl)

  console.log('🎉 IPN Webhook testing completed!')
  console.log('\n📋 Summary:')
  console.log('   - Successful payments should update order to CONFIRMED')
  console.log('   - Failed payments should update order to CANCELLED')
  console.log('   - Invalid requests should return appropriate error codes')
  console.log('   - Duplicate requests should be handled idempotently')
}

// Handle command line arguments
const args = process.argv.slice(2)

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: npm run test:ipn [options]

Options:
  --help, -h     Show this help message
  --url <url>    Set custom base URL (default: http://localhost:3000)

Examples:
  npm run test:ipn
  npm run test:ipn --url http://localhost:3001
  npm run test:ipn --url https://your-app.vercel.app
`)
  process.exit(0)
}

if (args.includes('--url')) {
  const urlIndex = args.indexOf('--url')
  if (urlIndex + 1 < args.length) {
    process.env.TEST_BASE_URL = args[urlIndex + 1]
  }
}

main().catch(console.error)
