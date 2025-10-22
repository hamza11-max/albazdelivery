#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * Validates that all required environment variables are set for production deployment
 */

const requiredEnvVars = [
  // Database
  'DATABASE_URL',

  // NextAuth
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',

  // Google OAuth
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',

  // Redis/Upstash
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',

  // Email (optional but recommended)
  // 'SMTP_HOST',
  // 'SMTP_PORT',
  // 'SMTP_USER',
  // 'SMTP_PASS',

  // Payment (optional)
  // 'STRIPE_SECRET_KEY',
  // 'STRIPE_PUBLISHABLE_KEY',
]

const optionalEnvVars = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
]

function validateEnvironment() {
  console.log('🔍 Validating environment variables...\n')

  const missing = []
  const warnings = []

  // Check required variables
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar)
    }
  }

  // Check optional variables
  for (const envVar of optionalEnvVars) {
    if (!process.env[envVar]) {
      warnings.push(envVar)
    }
  }

  // Report results
  if (missing.length > 0) {
    console.log('❌ Missing required environment variables:')
    missing.forEach(envVar => console.log(`   - ${envVar}`))
    console.log('\n💡 Please set these variables in your .env file or deployment environment.')
    process.exit(1)
  }

  if (warnings.length > 0) {
    console.log('⚠️  Missing optional environment variables:')
    warnings.forEach(envVar => console.log(`   - ${envVar} (optional)`))
    console.log('\n📝 These are optional but recommended for full functionality.')
  }

  if (missing.length === 0) {
    console.log('✅ All required environment variables are set!')

    if (warnings.length === 0) {
      console.log('🎉 All environment variables configured successfully!')
    }
  }

  // Additional validation for specific variables
  console.log('\n🔧 Performing additional validations...')

  // Validate DATABASE_URL format
  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL)
      if (!['postgresql:', 'postgres:'].includes(url.protocol)) {
        console.log('⚠️  DATABASE_URL should use PostgreSQL protocol')
      } else {
        console.log('✅ DATABASE_URL format is valid')
      }
    } catch (error) {
      console.log('❌ DATABASE_URL is not a valid URL')
    }
  }

  // Validate NEXTAUTH_URL format
  if (process.env.NEXTAUTH_URL) {
    try {
      new URL(process.env.NEXTAUTH_URL)
      console.log('✅ NEXTAUTH_URL format is valid')
    } catch (error) {
      console.log('❌ NEXTAUTH_URL is not a valid URL')
    }
  }

  // Validate Redis URL format
  if (process.env.UPSTASH_REDIS_REST_URL) {
    try {
      const url = new URL(process.env.UPSTASH_REDIS_REST_URL)
      if (url.hostname.includes('upstash')) {
        console.log('✅ UPSTASH_REDIS_REST_URL appears to be valid')
      } else {
        console.log('⚠️  UPSTASH_REDIS_REST_URL may not be from Upstash')
      }
    } catch (error) {
      console.log('❌ UPSTASH_REDIS_REST_URL is not a valid URL')
    }
  }

  console.log('\n✨ Environment validation complete!')
}

if (require.main === module) {
  validateEnvironment()
}

module.exports = { validateEnvironment }
