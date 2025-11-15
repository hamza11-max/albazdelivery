/**
 * Script to start Prisma Studio with correct DATABASE_URL from .env.local
 */

const { readFileSync } = require('fs')
const { resolve } = require('path')
const { spawn } = require('child_process')

// Load .env.local file
try {
  const envPath = resolve(process.cwd(), '.env.local')
  const envFile = readFileSync(envPath, 'utf-8')
  
  // Parse environment variables
  const lines = envFile.split(/\r?\n/)
  const envVars = {}
  let currentKey = null
  let currentValueParts = []
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }
    
    const keyValueMatch = trimmed.match(/^([^=:#\s]+)\s*=\s*(.*)$/)
    if (keyValueMatch) {
      if (currentKey) {
        envVars[currentKey] = currentValueParts.join('').trim().replace(/^["']|["']$/g, '')
      }
      currentKey = keyValueMatch[1].trim()
      currentValueParts = [keyValueMatch[2] || '']
    } else if (currentKey && trimmed) {
      currentValueParts.push(trimmed)
    }
  }
  
  if (currentKey) {
    envVars[currentKey] = currentValueParts.join('').trim().replace(/^["']|["']$/g, '')
  }
  
  // Set environment variables
  for (const [key, value] of Object.entries(envVars)) {
    if (value) {
      process.env[key] = value
    }
  }
  
  console.log('✅ Loaded environment variables from .env.local')
  
  // Prefer DIRECT_URL for Prisma Studio
  if (process.env.DIRECT_URL) {
    process.env.DATABASE_URL = process.env.DIRECT_URL
    console.log('✅ Using DIRECT_URL for Prisma Studio')
  } else if (process.env.DATABASE_URL?.includes('pgbouncer=true')) {
    // Convert pgbouncer URL to direct connection
    process.env.DATABASE_URL = process.env.DATABASE_URL
      .replace(':6543/', ':5432/')
      .replace(/\?pgbouncer=true&/, '?')
      .replace(/\?pgbouncer=true$/, '')
      .replace(/&pgbouncer=true/, '')
    console.log('✅ Converted pgbouncer URL to direct connection')
  }
  
} catch (error) {
  console.warn('⚠️  Could not load .env.local:', error.message)
}

// Start Prisma Studio
console.log('🚀 Starting Prisma Studio...')
const studio = spawn('npx', ['prisma', 'studio'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
})

studio.on('error', (error) => {
  console.error('❌ Failed to start Prisma Studio:', error)
  process.exit(1)
})

studio.on('exit', (code) => {
  process.exit(code || 0)
})

