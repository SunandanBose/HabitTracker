#!/usr/bin/env node

/**
 * This script verifies that your OAuth configuration is set up correctly.
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

console.log('Verifying OAuth configuration...');

// Check for required environment variables
const requiredEnvVars = [
  'REACT_APP_GOOGLE_CLIENT_ID',
  'REACT_APP_GOOGLE_CLIENT_SECRET'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('\n❌ Missing required environment variables:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\nPlease add these to your .env file.');
  process.exit(1);
}

// Check that the client ID is valid
const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
if (!clientId.includes('.apps.googleusercontent.com')) {
  console.error('\n❌ Invalid Google Client ID format. It should end with ".apps.googleusercontent.com"');
  process.exit(1);
}

// Check that the client secret is valid
const clientSecret = process.env.REACT_APP_GOOGLE_CLIENT_SECRET;
if (!clientSecret.startsWith('GOCSPX-')) {
  console.warn('\n⚠️ Warning: Google Client Secret format looks unusual. It typically starts with "GOCSPX-"');
}

console.log('\n✅ Environment variables are set correctly.');
console.log('\nReminder: Make sure your OAuth configuration in Google Cloud Console includes:');
console.log(' - Authorized JavaScript origins: http://localhost:3000');
console.log(' - Authorized redirect URIs: http://localhost:3000');
console.log(' - The Google Drive API should be enabled for your project');

console.log('\nIf you\'re still having issues, try:');
console.log(' 1. Clearing your browser cache and cookies');
console.log(' 2. Using incognito/private browsing mode');
console.log(' 3. Checking browser console for specific errors');
console.log(' 4. Verifying that you\'ve granted the necessary permissions');

console.log('\nHappy debugging!'); 