/**
 * Backend-Frontend Connection Verification Script
 * Tests if the API endpoints are accessible and working
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ConnectionTest {
  name: string
  endpoint: string
  method: string
  status: 'pending' | 'pass' | 'fail'
  message?: string
  responseTime?: number
}

const tests: ConnectionTest[] = []

async function testEndpoint(
  name: string,
  endpoint: string,
  method: string = 'GET',
  body?: any
): Promise<ConnectionTest> {
  const startTime = Date.now()
  const test: ConnectionTest = {
    name,
    endpoint,
    method,
    status: 'pending',
  }

  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const url = `${baseUrl}${endpoint}`

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(url, options)
    const responseTime = Date.now() - startTime

    if (response.ok) {
      test.status = 'pass'
      test.message = `Status: ${response.status}`
    } else {
      test.status = 'fail'
      test.message = `Status: ${response.status} - ${response.statusText}`
    }
    test.responseTime = responseTime
  } catch (error: any) {
    test.status = 'fail'
    test.message = `Error: ${error.message}`
    test.responseTime = Date.now() - startTime
  }

  return test
}

async function testDatabaseConnection(): Promise<ConnectionTest> {
  const test: ConnectionTest = {
    name: 'Database Connection',
    endpoint: 'N/A',
    method: 'N/A',
    status: 'pending',
  }

  try {
    const startTime = Date.now()
    await prisma.$connect()
    await prisma.user.count()
    const responseTime = Date.now() - startTime

    test.status = 'pass'
    test.message = 'Database connected successfully'
    test.responseTime = responseTime
  } catch (error: any) {
    test.status = 'fail'
    test.message = `Database error: ${error.message}`
  } finally {
    await prisma.$disconnect()
  }

  return test
}

async function runTests() {
  console.log('\n🔍 Backend-Frontend Connection Verification\n')
  console.log('=' .repeat(60))

  // Test 1: Health Check
  console.log('\n1. Testing Health Endpoint...')
  const healthTest = await testEndpoint('Health Check', '/api/health')
  tests.push(healthTest)
  console.log(
    `   ${healthTest.status === 'pass' ? '✅' : '❌'} ${healthTest.name}: ${healthTest.message} (${healthTest.responseTime}ms)`
  )

  // Test 2: Database Connection
  console.log('\n2. Testing Database Connection...')
  const dbTest = await testDatabaseConnection()
  tests.push(dbTest)
  console.log(
    `   ${dbTest.status === 'pass' ? '✅' : '❌'} ${dbTest.name}: ${dbTest.message}${dbTest.responseTime ? ` (${dbTest.responseTime}ms)` : ''}`
  )

  // Test 3: Auth Endpoint (should return 405 or 400, not 404)
  console.log('\n3. Testing Auth Endpoint Availability...')
  const authTest = await testEndpoint('Auth Endpoint', '/api/auth/login', 'POST', {
    identifier: 'test@example.com',
    password: 'test',
  })
  tests.push(authTest)
  // Auth endpoint should exist (even if credentials are wrong)
  const authPass = authTest.status === 'fail' && authTest.message?.includes('401') || authTest.message?.includes('400')
  console.log(
    `   ${authPass ? '✅' : '❌'} ${authTest.name}: ${authTest.message} (${authTest.responseTime}ms)`
  )

  // Test 4: CSRF Token Endpoint
  console.log('\n4. Testing CSRF Token Endpoint...')
  const csrfTest = await testEndpoint('CSRF Token', '/api/csrf-token')
  tests.push(csrfTest)
  console.log(
    `   ${csrfTest.status === 'pass' ? '✅' : '❌'} ${csrfTest.name}: ${csrfTest.message} (${csrfTest.responseTime}ms)`
  )

  // Test 5: Products Endpoint
  console.log('\n5. Testing Products Endpoint...')
  const productsTest = await testEndpoint('Products', '/api/products')
  tests.push(productsTest)
  console.log(
    `   ${productsTest.status === 'pass' ? '✅' : '❌'} ${productsTest.name}: ${productsTest.message} (${productsTest.responseTime}ms)`
  )

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 Test Summary:')
  const passed = tests.filter((t) => t.status === 'pass').length
  const failed = tests.filter((t) => t.status === 'fail').length
  const total = tests.length

  console.log(`   Total Tests: ${total}`)
  console.log(`   ✅ Passed: ${passed}`)
  console.log(`   ❌ Failed: ${failed}`)

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Backend and frontend are connected.')
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.')
  }

  // Frontend-Backend Architecture Info
  console.log('\n' + '='.repeat(60))
  console.log('\n📋 Architecture Information:')
  console.log('   • Frontend: Next.js App Router (app/)')
  console.log('   • Backend: Next.js API Routes (app/api/)')
  console.log('   • Database: Prisma ORM')
  console.log('   • Authentication: NextAuth.js')
  console.log(`   • Base URL: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}`)

  // Mobile App Connection Info
  console.log('\n📱 Mobile App Connection:')
  console.log('   • Mobile apps need to connect to the Next.js server')
  console.log('   • Development: Use your local IP (e.g., http://192.168.1.100:3000)')
  console.log('   • Production: Use your deployed URL (e.g., https://your-app.vercel.app)')
  console.log('   • Find your IP: Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux)')

  console.log('\n' + '='.repeat(60) + '\n')

  process.exit(failed > 0 ? 1 : 0)
}

// Run tests
runTests().catch((error) => {
  console.error('\n❌ Fatal error running tests:', error)
  process.exit(1)
})

