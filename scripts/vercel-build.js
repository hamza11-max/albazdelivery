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

function run(program, args) {
  const prog = resolveBin(program);
  console.log(`> Running: ${prog} ${args.join(' ')}`);
  const res = spawnSync(prog, args, { stdio: 'inherit', env: process.env });
  if (res.error) {
    console.error(res.error);
    process.exit(1);
  }
  if (res.status !== 0) {
    console.error(`Command failed: ${prog} ${args.join(' ')} -> exit ${res.status}`);
    process.exit(res.status || 1);
  }
}

// 1) generate client
run('prisma', ['generate']);

// 2) run migrations only if there's a DATABASE_URL set
if (process.env.DATABASE_URL && process.env.DATABASE_URL !== '') {
  console.log('DATABASE_URL detected in environment — running prisma migrate deploy');
  try {
    run('prisma', ['migrate', 'deploy']);
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    // Skip known baseline error (P3005) safely
    if (msg.includes('P3005')) {
      console.warn('⚠️  Prisma P3005: Database not empty — skipping migrations (baseline assumed)');
    } else {
      console.error('❌ Prisma migrate deploy failed:', msg);
      process.exit(1);
    }
  }
} else {
  console.log('No DATABASE_URL detected — skipping `prisma migrate deploy` in build');
}

// 3) run Next.js build
run('next', ['build']);
