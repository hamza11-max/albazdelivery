/**
 * Quick script to generate bcrypt hash for password
 * Run: node scripts/create-admin-user-hash.js
 */

const bcrypt = require('bcryptjs')

const password = process.argv[2] || 'Admin123!'

bcrypt.hash(password, 12).then(hash => {
  console.log('Password:', password)
  console.log('Bcrypt Hash:', hash)
  console.log('\nUse this hash in the SQL script or update the SQL file with this hash.')
})

