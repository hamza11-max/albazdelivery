#!/usr/bin/env node
/*
  vercel-build.js
  Run during Vercel builds. It will:
   - always run `prisma generate`
   - run `prisma migrate deploy` only if DATABASE_URL is present in env
   - then run `next build`

  This avoids failing the build when no database is available in the build environment.
*/
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function resolveBin(name) {
  // prefer local node_modules/.bin/<name>(.cmd on Windows)
  const binName = process.platform === 'win32' ? `${name}.cmd` : name;
  const local = path.join(process.cwd(), 'node_modules', '.bin', binName);
  if (fs.existsSync(local)) return local;
  return name; // fall back to PATH
}

function run(program, args, allowFailure = false) {
  const prog = resolveBin(program);
  console.log(`> Running: ${prog} ${args.join(' ')}`);
  const res = spawnSync(prog, args, { stdio: 'inherit', env: process.env });
  if (res.error) {
    console.error(res.error);
    if (!allowFailure) {
      process.exit(1);
    }
    return false;
  }
  if (res.status !== 0) {
    console.error(`Command failed: ${prog} ${args.join(' ')} -> exit ${res.status}`);
    if (!allowFailure) {
      process.exit(res.status || 1);
    }
    return false;
  }
  return true;
}

// 1) generate client
run('prisma', ['generate']);

// ✅ ADD THIS BLOCK — ensure DIRECT_URL is defined
if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
  console.log('DIRECT_URL not set — using DATABASE_URL as fallback');
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

// 2) run migrations only if there's a DATABASE_URL set
if (process.env.DATABASE_URL && process.env.DATABASE_URL !== '') {
  console.log('DATABASE_URL detected in environment — running prisma migrate deploy');
  const migrationSuccess = run('prisma', ['migrate', 'deploy'], true);
  if (!migrationSuccess) {
    console.warn('⚠️  Prisma migrate deploy failed — this may be due to:');
    console.warn('   - Database not accessible during build (common on Vercel)');
    console.warn('   - Network connectivity issues');
    console.warn('   - Database server not running');
    console.warn('⚠️  Continuing build without migrations. Migrations should be run separately or during deployment.');
  }
} else {
  console.log('No DATABASE_URL detected — skipping `prisma migrate deploy` in build');
}

// 3) run Next.js build
run('next', ['build']);
