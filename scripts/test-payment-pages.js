#!/usr/bin/env node

/**
 * Test script for payment callback pages
 *
 * This script tests the three payment callback pages:
 * - Success page
 * - Error page
 * - Cancel page
 */

const http = require('http')

const BASE_URL = 'http://localhost:3000'

// Test cases
const testCases = [
  {
    name: 'Success Page',
    url: '/payment/success?orderId=test_order_123',
    expectedStatus: 200,
    expectedContent: ['Thanh toán thành công', 'Đang tải thông tin đơn hàng'],
  },
  {
    name: 'Error Page',
    url: '/payment/error?orderId=test_order_123&error=Payment%20failed',
    expectedStatus: 200,
    expectedContent: [
      'Thanh toán thất bại',
      'Đã xảy ra lỗi trong quá trình thanh toán',
    ],
  },
  {
    name: 'Cancel Page',
    url: '/payment/cancel?orderId=test_order_123',
    expectedStatus: 200,
    expectedContent: [
      'Thanh toán đã bị hủy',
      'Bạn đã hủy quá trình thanh toán',
    ],
  },
  {
    name: 'Success Page without orderId',
    url: '/payment/success',
    expectedStatus: 200,
    expectedContent: ['Lỗi', 'Không tìm thấy ID đơn hàng'],
  },
  {
    name: 'Error Page without orderId',
    url: '/payment/error?error=Invalid%20request',
    expectedStatus: 200,
    expectedContent: ['Thanh toán thất bại'],
  },
  {
    name: 'Cancel Page without orderId',
    url: '/payment/cancel',
    expectedStatus: 200,
    expectedContent: ['Thanh toán đã bị hủy'],
  },
]

function testPage(testCase) {
  return new Promise(resolve => {
    const url = `${BASE_URL}${testCase.url}`
    console.log(`\n🧪 Testing: ${testCase.name}`)
    console.log(`📍 URL: ${url}`)

    const req = http.get(url, res => {
      let data = ''

      res.on('data', chunk => {
        data += chunk
      })

      res.on('end', () => {
        const status = res.statusCode
        console.log(
          `📊 Status: ${status} ${status === testCase.expectedStatus ? '✅' : '❌'}`
        )

        if (status === testCase.expectedStatus) {
          console.log('✅ Page loaded successfully')

          // Check for expected content
          const foundContent = testCase.expectedContent.filter(content =>
            data.includes(content)
          )

          if (foundContent.length === testCase.expectedContent.length) {
            console.log('✅ All expected content found')
          } else {
            console.log('⚠️  Some expected content missing:')
            testCase.expectedContent.forEach(content => {
              if (data.includes(content)) {
                console.log(`   ✅ ${content}`)
              } else {
                console.log(`   ❌ ${content}`)
              }
            })
          }
        } else {
          console.log(
            `❌ Expected status ${testCase.expectedStatus}, got ${status}`
          )
        }

        resolve({
          name: testCase.name,
          success: status === testCase.expectedStatus,
          status: status,
        })
      })
    })

    req.on('error', err => {
      console.log(`❌ Request failed: ${err.message}`)
      resolve({
        name: testCase.name,
        success: false,
        error: err.message,
      })
    })

    req.setTimeout(10000, () => {
      req.destroy()
      console.log('⏰ Request timeout')
      resolve({
        name: testCase.name,
        success: false,
        error: 'Timeout',
      })
    })
  })
}

async function runTests() {
  console.log('🚀 Starting Payment Callback Pages Tests')
  console.log('=====================================')

  const results = []

  for (const testCase of testCases) {
    const result = await testPage(testCase)
    results.push(result)
  }

  console.log('\n📋 Test Results Summary')
  console.log('=======================')

  const passed = results.filter(r => r.success).length
  const total = results.length

  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL'
    console.log(`${status} ${result.name}`)
    if (result.error) {
      console.log(`    Error: ${result.error}`)
    }
  })

  console.log(`\n🎯 Overall: ${passed}/${total} tests passed`)

  if (passed === total) {
    console.log(
      '🎉 All tests passed! Payment callback pages are working correctly.'
    )
  } else {
    console.log('⚠️  Some tests failed. Please check the implementation.')
  }
}

// Check if server is running
function checkServer() {
  return new Promise(resolve => {
    const req = http.get(BASE_URL, res => {
      resolve(res.statusCode === 200)
    })

    req.on('error', () => {
      resolve(false)
    })

    req.setTimeout(5000, () => {
      req.destroy()
      resolve(false)
    })
  })
}

async function main() {
  console.log('🔍 Checking if dev server is running...')

  const serverRunning = await checkServer()

  if (!serverRunning) {
    console.log(
      '❌ Dev server is not running. Please start it with: npm run dev'
    )
    process.exit(1)
  }

  console.log('✅ Dev server is running')
  await runTests()
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { testPage, runTests }
