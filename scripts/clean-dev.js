#!/usr/bin/env node

/**
 * Clean script to remove Next.js cache and restart dev server
 * This helps prevent build manifest errors
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const nextDir = path.join(projectRoot, '.next');

console.log('🧹 Cleaning Next.js cache...');

try {
  // Remove .next directory
  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log('✅ Removed .next directory');
  }

  // Remove node_modules/.cache if it exists
  const cacheDir = path.join(projectRoot, 'node_modules', '.cache');
  if (fs.existsSync(cacheDir)) {
    fs.rmSync(cacheDir, { recursive: true, force: true });
    console.log('✅ Removed node_modules/.cache');
  }

  console.log('✨ Cache cleaned successfully!');
  console.log('💡 Run "npm run dev" to start the development server');
} catch (error) {
  console.error('❌ Error cleaning cache:', error.message);
  process.exit(1);
}

