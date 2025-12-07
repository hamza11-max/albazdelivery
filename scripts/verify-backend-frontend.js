/**
 * Simple Backend-Frontend Connection Verification
 * Run with: node scripts/verify-backend-frontend.js
 */

const http = require('http');
const https = require('https');

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

const tests = [];

function testEndpoint(name, path, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    const client = url.protocol === 'https:' ? https : http;
    
    const startTime = Date.now();
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    };

    const req = client.request(options, (res) => {
      const responseTime = Date.now() - startTime;
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const test = {
          name,
          path,
          method,
          status: res.statusCode < 400 ? 'pass' : 'fail',
          statusCode: res.statusCode,
          responseTime,
          message: `Status: ${res.statusCode}`,
        };

        // For auth endpoint, 401/400 is acceptable (means endpoint exists)
        if (path.includes('/auth/login') && (res.statusCode === 401 || res.statusCode === 400)) {
          test.status = 'pass';
          test.message = 'Endpoint exists (authentication required)';
        }

        resolve(test);
      });
    });

    req.on('error', (error) => {
      resolve({
        name,
        path,
        method,
        status: 'fail',
        statusCode: 0,
        responseTime: Date.now() - startTime,
        message: `Error: ${error.message}`,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        name,
        path,
        method,
        status: 'fail',
        statusCode: 0,
        responseTime: Date.now() - startTime,
        message: 'Request timeout',
      });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function runTests() {
  console.log('\n🔍 Backend-Frontend Connection Verification\n');
  console.log('='.repeat(60));
  console.log(`Base URL: ${BASE_URL}\n`);

  // Test 1: Health Check
  console.log('1. Testing Health Endpoint...');
  const healthTest = await testEndpoint('Health Check', '/api/health');
  tests.push(healthTest);
  console.log(`   ${healthTest.status === 'pass' ? '✅' : '❌'} ${healthTest.name}: ${healthTest.message} (${healthTest.responseTime}ms)`);

  // Test 2: Auth Endpoint
  console.log('\n2. Testing Auth Endpoint...');
  const authTest = await testEndpoint(
    'Auth Endpoint',
    '/api/auth/login',
    'POST',
    { identifier: 'test@example.com', password: 'test' }
  );
  tests.push(authTest);
  console.log(`   ${authTest.status === 'pass' ? '✅' : '❌'} ${authTest.name}: ${authTest.message} (${authTest.responseTime}ms)`);

  // Test 3: Products Endpoint
  console.log('\n3. Testing Products Endpoint...');
  const productsTest = await testEndpoint('Products', '/api/products');
  tests.push(productsTest);
  console.log(`   ${productsTest.status === 'pass' ? '✅' : '❌'} ${productsTest.name}: ${productsTest.message} (${productsTest.responseTime}ms)`);

  // Test 4: CSRF Token
  console.log('\n4. Testing CSRF Token Endpoint...');
  const csrfTest = await testEndpoint('CSRF Token', '/api/csrf-token');
  tests.push(csrfTest);
  console.log(`   ${csrfTest.status === 'pass' ? '✅' : '❌'} ${csrfTest.name}: ${csrfTest.message} (${csrfTest.responseTime}ms)`);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary:');
  const passed = tests.filter(t => t.status === 'pass').length;
  const failed = tests.filter(t => t.status === 'fail').length;
  const total = tests.length;

  console.log(`   Total Tests: ${total}`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Backend and frontend are connected.');
    console.log('\n📋 Connection Status:');
    console.log('   ✅ Frontend can communicate with backend API');
    console.log('   ✅ API endpoints are accessible');
    console.log('   ✅ Server is running and responding');
  } else {
    console.log('\n⚠️  Some tests failed. Possible issues:');
    console.log('   • Server might not be running (start with: npm run dev)');
    console.log('   • Wrong base URL (check NEXTAUTH_URL environment variable)');
    console.log('   • Network/firewall blocking connections');
    console.log('   • API routes might have errors');
  }

  // Architecture Info
  console.log('\n' + '='.repeat(60));
  console.log('\n📋 Architecture Information:');
  console.log('   • Frontend: Next.js App Router (app/)');
  console.log('   • Backend: Next.js API Routes (app/api/)');
  console.log('   • Same Server: Frontend and backend run on same Next.js server');
  console.log('   • API Base: /api/* routes');
  console.log(`   • Current URL: ${BASE_URL}`);

  console.log('\n📱 Mobile App Connection:');
  console.log('   • Mobile apps need external URL to connect');
  console.log('   • Development: Use local IP (e.g., http://192.168.1.100:3000)');
  console.log('   • Find IP: ipconfig (Windows) or ifconfig (Mac/Linux)');
  console.log('   • Production: Use deployed URL');

  console.log('\n' + '='.repeat(60) + '\n');

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

