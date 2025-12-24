#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function findPackageJsonFiles() {
  const roots = ['.','apps','packages','temp','mobile-app-templates','app'];
  const files = new Set();
  for (const r of roots) {
    const dir = path.resolve(process.cwd(), r);
    if (!fs.existsSync(dir)) continue;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    if (r === '.') {
      const p = path.resolve(process.cwd(),'package.json');
      if (fs.existsSync(p)) files.add(p);
      continue;
    }
    for (const e of entries) {
      const candidate = path.join(dir, e.name, 'package.json');
      if (fs.existsSync(candidate)) files.add(candidate);
    }
  }
  return Array.from(files).sort();
}

function getLatestVersion(pkg) {
  try {
    const out = execSync(`npm view ${pkg} version`, { stdio: ['pipe','pipe','ignore'] }).toString().trim();
    return out || null;
  } catch (err) {
    return null;
  }
}

function updateFile(file) {
  const raw = fs.readFileSync(file, 'utf8');
  let pkg;
  try { pkg = JSON.parse(raw); } catch (e) { return {file, updated:0, error: 'parse error'} }
  const sections = ['dependencies','devDependencies','peerDependencies','optionalDependencies'];
  let updated = 0;
  for (const s of sections) {
    if (!pkg[s]) continue;
    for (const [k,v] of Object.entries(pkg[s])) {
      if (typeof v === 'string' && v.trim() === 'latest') {
        const ver = getLatestVersion(k);
        if (ver) {
          pkg[s][k] = `^${ver}`;
          updated++;
          console.log(`Updated ${file} -> ${k}: latest -> ^${ver}`);
        } else {
          console.warn(`Could not resolve latest for ${k} (skipped)`);
        }
      }
    }
  }
  if (updated > 0) {
    fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n');
  }
  return {file, updated};
}

function main() {
  const files = findPackageJsonFiles();
  if (files.length === 0) {
    console.error('No package.json files found.');
    process.exit(1);
  }
  let total = 0;
  for (const f of files) {
    const res = updateFile(f);
    total += res.updated || 0;
  }
  console.log(`Done. Total updated dependencies: ${total}`);
}

main();
