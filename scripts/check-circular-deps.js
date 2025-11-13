#!/usr/bin/env node
/**
 * Script to detect potential circular dependencies
 * Run with: node scripts/check-circular-deps.js
 */

const fs = require('fs');
const path = require('path');

const visited = new Set();
const visiting = new Set();
const cycles = [];

function findImports(filePath, content) {
  const imports = [];
  const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    if (importPath.startsWith('@/') || importPath.startsWith('./') || importPath.startsWith('../')) {
      imports.push(importPath);
    }
  }
  
  return imports;
}

function resolveImport(importPath, fromFile) {
  if (importPath.startsWith('@/')) {
    return path.join(process.cwd(), importPath.replace('@/', ''));
  }
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    return path.resolve(path.dirname(fromFile), importPath);
  }
  return null;
}

function checkFile(filePath) {
  if (visiting.has(filePath)) {
    cycles.push([...visiting, filePath]);
    return;
  }
  
  if (visited.has(filePath)) {
    return;
  }
  
  if (!fs.existsSync(filePath)) {
    return;
  }
  
  const ext = path.extname(filePath);
  if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
    return;
  }
  
  visiting.add(filePath);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const imports = findImports(filePath, content);
    
    for (const imp of imports) {
      const resolved = resolveImport(imp, filePath);
      if (resolved) {
        // Try different extensions
        const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
        for (const ext of extensions) {
          const fullPath = resolved + ext;
          if (fs.existsSync(fullPath)) {
            checkFile(fullPath);
            break;
          }
        }
      }
    }
  } catch (error) {
    // Ignore errors
  }
  
  visiting.delete(filePath);
  visited.add(filePath);
}

function scanDirectory(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    if (file.name.startsWith('.') || file.name === 'node_modules') {
      continue;
    }
    
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      scanDirectory(fullPath);
    } else if (file.isFile()) {
      const ext = path.extname(file.name);
      if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
        checkFile(fullPath);
      }
    }
  }
}

console.log('🔍 Checking for circular dependencies...\n');

// Scan app and lib directories
const directories = ['app', 'lib', 'components'];
for (const dir of directories) {
  const dirPath = path.join(process.cwd(), dir);
  if (fs.existsSync(dirPath)) {
    scanDirectory(dirPath);
  }
}

if (cycles.length > 0) {
  console.log('❌ Found potential circular dependencies:\n');
  cycles.forEach((cycle, index) => {
    console.log(`Cycle ${index + 1}:`);
    cycle.forEach((file, i) => {
      const relativePath = path.relative(process.cwd(), file);
      console.log(`  ${i + 1}. ${relativePath}`);
    });
    console.log();
  });
  process.exit(1);
} else {
  console.log('✅ No circular dependencies detected!');
  process.exit(0);
}

