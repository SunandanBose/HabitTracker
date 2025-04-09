#!/usr/bin/env node

/**
 * This script completely resets the app state and builds a fresh copy.
 * It will:
 * 1. Clear node_modules
 * 2. Clear build artifacts
 * 3. Reinstall dependencies
 * 4. Build the app
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('==== Habit Tracker Reset ====\n');

try {
  // Step 1: Clean up
  console.log('Cleaning up build artifacts and dependencies...');
  
  // Remove node_modules (optional, uncomment if needed)
  // console.log('Removing node_modules...');
  // execSync('rm -rf node_modules', { stdio: 'inherit' });
  
  // Remove build directory
  console.log('Removing build directory...');
  execSync('rm -rf build', { stdio: 'inherit' });
  
  // Clear any browser-related files in public
  console.log('Clearing browser state from index.html...');
  const indexPath = path.join(process.cwd(), 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    // Remove any debug script we might have added
    if (indexContent.includes('window.HT_DEBUG = true')) {
      indexContent = indexContent.replace(/<script>[\s\S]*window\.HT_DEBUG[\s\S]*<\/script>/m, '');
      fs.writeFileSync(indexPath, indexContent);
      console.log('Removed debug script from index.html');
    }
  }
  
  // Step 2: Reinstall dependencies (optional, uncomment if needed)
  // console.log('\nReinstalling dependencies...');
  // execSync('npm install', { stdio: 'inherit' });
  
  // Step 3: Build the app
  console.log('\nBuilding the app...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('\n==== Reset Complete ====');
  console.log('The app has been reset to a clean state.');
  console.log('To start the app, run: npm start');
} catch (error) {
  console.error('\nError during reset:', error.message);
  process.exit(1);
} 