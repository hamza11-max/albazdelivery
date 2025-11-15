/**
 * Generate NEXTAUTH_SECRET for NextAuth.js
 * Run with: node scripts/generate-nextauth-secret.js
 */

const crypto = require('crypto');

// Generate a secure random secret
const secret = crypto.randomBytes(32).toString('base64');

console.log('\n🔐 Generated NEXTAUTH_SECRET:\n');
console.log(secret);
console.log('\n📝 Add this to your .env.local file:');
console.log(`NEXTAUTH_SECRET="${secret}"`);
console.log('\n✅ Copy the line above to your .env.local file\n');

