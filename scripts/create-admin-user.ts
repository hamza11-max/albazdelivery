/**
 * Script to create an admin user in the database
 * Usage: npx tsx scripts/create-admin-user.ts
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local file BEFORE importing PrismaClient
// Note: .env.local takes precedence over .env
try {
  // First try .env.local (higher priority)
  let envPath = resolve(process.cwd(), '.env.local')
  let envFile: string
  try {
    envFile = readFileSync(envPath, 'utf-8')
    console.log('📁 Loading .env.local')
  } catch {
    // Fallback to .env if .env.local doesn't exist
    envPath = resolve(process.cwd(), '.env')
    envFile = readFileSync(envPath, 'utf-8')
    console.log('📁 Loading .env')
  }
  
  // Parse .env file - handle multi-line values
  const lines = envFile.split(/\r?\n/)
  const envVars: Record<string, string> = {}
  let currentKey: string | null = null
  let currentValueParts: string[] = []
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }
    
    // Check if this line starts a new key=value pair
    const keyValueMatch = trimmed.match(/^([^=:#\s]+)\s*=\s*(.*)$/)
    if (keyValueMatch) {
      // Save previous key-value if exists
      if (currentKey) {
        envVars[currentKey] = currentValueParts.join('').trim().replace(/^["']|["']$/g, '')
      }
      
      // Start new key-value pair
      currentKey = keyValueMatch[1].trim()
      currentValueParts = [keyValueMatch[2] || '']
    } else if (currentKey && trimmed) {
      // This is a continuation of the previous value (multi-line)
      currentValueParts.push(trimmed)
    }
  }
  
  // Save last key-value pair
  if (currentKey) {
    envVars[currentKey] = currentValueParts.join('').trim().replace(/^["']|["']$/g, '')
  }
  
  // Set environment variables from .env.local (override any existing)
  for (const [key, value] of Object.entries(envVars)) {
    if (value) {
      process.env[key] = value
    }
  }
  
  console.log(`📝 Loaded ${Object.keys(envVars).length} environment variables from .env.local`)
  console.log('✅ Loaded .env.local file')
  // Debug: Show DATABASE_URL (masked for security)
  if (process.env.DATABASE_URL) {
    const dbUrl = process.env.DATABASE_URL
    const masked = dbUrl.replace(/:([^:@]+)@/, ':****@')
    console.log('📊 DATABASE_URL:', masked.substring(0, 80))
    console.log('📊 Full length:', dbUrl.length, 'chars')
    console.log('📊 Contains supabase:', dbUrl.includes('supabase'))
    console.log('📊 Contains localhost:', dbUrl.includes('localhost'))
  } else {
    console.error('❌ DATABASE_URL not found in environment!')
  }
} catch (error) {
  console.warn('⚠️  Could not load .env.local:', error)
}

// Now import PrismaClient after environment is loaded
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/password'

// Verify DATABASE_URL before creating PrismaClient
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is required but not set!')
  console.error('Please ensure .env.local contains DATABASE_URL')
  process.exit(1)
}

// For Supabase, prefer DIRECT_URL for direct connections (bypasses pgbouncer)
// DIRECT_URL is required for migrations and some Prisma operations
let databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL

if (process.env.DIRECT_URL) {
  console.log('✅ Using DIRECT_URL for database connection')
} else if (process.env.DATABASE_URL?.includes('pgbouncer=true')) {
  // If no DIRECT_URL but DATABASE_URL has pgbouncer, try to create direct connection
  databaseUrl = process.env.DATABASE_URL
    .replace(':6543/', ':5432/')
    .replace(/\?pgbouncer=true&/, '?')
    .replace(/\?pgbouncer=true$/, '')
    .replace(/&pgbouncer=true/, '')
  console.log('🔄 Converted pgbouncer URL to direct connection')
} else {
  console.log('📊 Using DATABASE_URL')
}

// Explicitly pass DATABASE_URL to PrismaClient to ensure it uses the correct one
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
  log: ['error', 'warn'],
})

async function createAdminUser() {
  const email = process.env.ADMIN_EMAIL || 'admin@albaz.dz'
  const password = process.env.ADMIN_PASSWORD || 'Admin123!'
  const name = process.env.ADMIN_NAME || 'Admin User'
  const phone = process.env.ADMIN_PHONE || '0551234567'

  try {
    // Check if admin user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      // Update existing user to admin
      const hashedPassword = await hashPassword(password)
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          role: 'ADMIN',
          status: 'APPROVED',
          password: hashedPassword,
        },
      })
      console.log('✅ Updated existing user to ADMIN:', {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      })
      return
    }

    // Create new admin user
    const hashedPassword = await hashPassword(password)
    const adminUser = await prisma.user.create({
      data: {
        email,
        name,
        phone,
        password: hashedPassword,
        role: 'ADMIN',
        status: 'APPROVED',
      },
    })

    console.log('✅ Admin user created successfully!')
    console.log({
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
    })
    console.log('\n📝 Login credentials:')
    console.log(`   Email: ${email}`)
    console.log(`   Password: ${password}`)
  } catch (error) {
    console.error('❌ Error creating admin user:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()

