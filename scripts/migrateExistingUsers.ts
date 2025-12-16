import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateExistingUsers() {
  console.log('Starting migration of existing users to Starter plan...')

  try {
    const users = await prisma.user.findMany({
      where: {
        subscription: null,
        role: 'VENDOR', // Only migrate vendors
      },
    })

    console.log(`Found ${users.length} users without subscriptions`)

    let migrated = 0
    let errors = 0

    for (const user of users) {
      try {
        await prisma.subscription.create({
          data: {
            userId: user.id,
            plan: 'STARTER',
            status: 'TRIAL',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
            trialStart: new Date(),
            trialEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        })
        migrated++
        if (migrated % 10 === 0) {
          console.log(`Migrated ${migrated} users...`)
        }
      } catch (error: any) {
        console.error(`Error migrating user ${user.id}:`, error.message)
        errors++
      }
    }

    console.log(`\nMigration completed!`)
    console.log(`Successfully migrated: ${migrated} users`)
    console.log(`Errors: ${errors} users`)
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
migrateExistingUsers()
  .then(() => {
    console.log('Migration script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Migration script failed:', error)
    process.exit(1)
  })

