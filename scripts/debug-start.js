#!/usr/bin/env node

/**
 * This script helps debug the Habit Tracker app by:
 * 1. Clearing localStorage to start fresh
 * 2. Starting the app with additional debug logging
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('==== Habit Tracker Debug Start ====\n');

// Clean script to be added to index.html to clear localStorage
const cleanScript = `
<script>
  // Clear localStorage on page load for debugging
  console.log("Clearing localStorage for debugging...");
  localStorage.clear();
  // Add extra debug info
  window.HT_DEBUG = true;
  console.log("Debug mode enabled");
</script>
`;

// Path to index.html
const indexPath = path.join(process.cwd(), 'public', 'index.html');

try {
  // Read the current index.html
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Check if we already added the debug script
  if (indexContent.includes('window.HT_DEBUG = true')) {
    console.log('Debug script already added to index.html');
  } else {
    // Insert the debug script before the closing head tag
    indexContent = indexContent.replace('</head>', `${cleanScript}</head>`);
    
    // Write the modified index.html
    fs.writeFileSync(indexPath, indexContent);
    console.log('Added debug script to index.html');
  }
  
  console.log('Starting app in debug mode...\n');
  
  // Set additional environment variables for debugging
  process.env.REACT_APP_DEBUG = 'true';
  
  // Start the app
  execSync('npm start', { stdio: 'inherit' });
  
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
} 