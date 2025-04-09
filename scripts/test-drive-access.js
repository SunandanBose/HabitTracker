#!/usr/bin/env node

/**
 * This script tests whether your Google credentials can access Google Drive.
 * It can either use a hardcoded token, prompt for a token, or automatically
 * get a fresh token through the auth flow.
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const readline = require('readline');
const fetch = require('node-fetch');
const { getToken } = require('./get-token');

// Load environment variables
dotenv.config();

// Check for verbose flag
const VERBOSE = process.argv.includes('--verbose');

const FOLDER_NAME = 'HabitTrackerTest';
const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.REACT_APP_GOOGLE_CLIENT_SECRET;

// Flag to control automatic token generation
const AUTO_GET_TOKEN = true;

// OPTION: Hardcode your access token here if needed
// To use this, replace null with your token in quotes, for example:
// const HARDCODED_ACCESS_TOKEN = "ya29.a0AVvZVsp4y_rnfELH8h6zkyJTXSyrkADUNzrfGCs4o_Lc8o"; 
// Make sure to use the COMPLETE token - get a fresh one with "npm run get-token"
const HARDCODED_ACCESS_TOKEN = null;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Error: CLIENT_ID or CLIENT_SECRET not found in .env file');
  process.exit(1);
}

// Main function to coordinate the testing process
async function main() {
  let accessToken = null;
  
  if (VERBOSE) {
    console.log('Running in verbose mode. Additional details will be shown.');
    console.log('Command line arguments:', process.argv);
  }
  
  // If we have a hardcoded token, use it
  if (HARDCODED_ACCESS_TOKEN) {
    console.log('\n===== Google Drive Access Test =====\n');
    console.log('Using hardcoded access token...');
    accessToken = HARDCODED_ACCESS_TOKEN.trim().replace(/^["']|["']$/g, '');
  }
  // If auto token generation is enabled, get a fresh token
  else if (AUTO_GET_TOKEN) {
    console.log('\n===== Google Drive Access Test =====\n');
    console.log('Getting a fresh access token automatically...');
    try {
      accessToken = await getToken();
      console.log('Successfully obtained a fresh access token!');
    } catch (error) {
      console.error('Error getting token automatically:', error.message);
      console.log('Falling back to manual token entry...');
      accessToken = await promptForToken();
    }
  }
  // Otherwise, prompt the user for a token
  else {
    accessToken = await promptForToken();
  }
  
  if (!accessToken) {
    console.error('No access token available. Exiting.');
    process.exit(1);
  }
  
  console.log('\nTesting Google Drive access...');
  await testGoogleDriveAccess(accessToken);
}

// Function to prompt the user for a token
function promptForToken() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    // Prompt user for access token
    console.log('\n===== Google Drive Access Test =====\n');
    console.log('This script will test if your Google credentials can access Google Drive.');
    console.log('You need to provide an access token for this test.\n');
    console.log('The easiest way to get a fresh token is to run:');
    console.log('  npm run get-token\n');
    console.log('Alternatively, you can get a token manually:');
    console.log('1. Go to https://developers.google.com/oauthplayground/');
    console.log('2. In the settings (gear icon), check "Use your own OAuth credentials"');
    console.log('3. Enter your Client ID and Secret:');
    console.log(`   Client ID: ${CLIENT_ID}`);
    console.log(`   Client Secret: ${CLIENT_SECRET}`);
    console.log('4. In Step 1, select "Drive API v3" and "https://www.googleapis.com/auth/drive.file"');
    console.log('5. Click "Authorize APIs" and complete the authentication flow');
    console.log('6. In Step 2, click "Exchange authorization code for tokens"');
    console.log('7. Copy the complete "Access token" from the response\n');

    rl.question('Paste your access token here: ', (accessToken) => {
      if (!accessToken) {
        console.error('Error: No access token provided');
        rl.close();
        resolve(null);
        return;
      }

      // Clean the token (remove any whitespace, quotes, etc.)
      accessToken = accessToken.trim().replace(/^["']|["']$/g, '');
      rl.close();
      resolve(accessToken);
    });
  });
}

async function testGoogleDriveAccess(accessToken) {
  try {
    console.log('\n1. Getting user info...');
    const userInfo = await getUserInfo(accessToken);
    console.log(`   Success! User: ${userInfo.name} (${userInfo.email})`);

    console.log('\n2. Testing folder creation...');
    const folderId = await createOrGetFolder(accessToken);
    console.log(`   Success! Folder ID: ${folderId}`);

    console.log('\n3. Testing file creation...');
    const fileId = await createTestFile(accessToken, folderId);
    console.log(`   Success! File ID: ${fileId}`);
    
    console.log('\n4. Testing file content read...');
    const content = await readFileContent(accessToken, fileId);
    if (VERBOSE) {
      console.log('   Full content received:');
      console.log(JSON.stringify(content, null, 2));
    }
    console.log(`   Success! File content: ${JSON.stringify(content)}`);
    
    console.log('\n5. Testing file content update...');
    const updatedContent = { test: 'updated', timestamp: new Date().toISOString() };
    if (VERBOSE) {
      console.log('   Updating with content:');
      console.log(JSON.stringify(updatedContent, null, 2));
    }
    await updateFileContent(accessToken, fileId, updatedContent);
    console.log('   Success! File content updated');

    console.log('\n===== TEST RESULTS =====');
    console.log('🟢 All tests passed! Your Google credentials can access Google Drive.');
    console.log('You should be able to use the Habit Tracker app without issues.');
    
    // Provide a way to use this token in the app
    console.log('\nTo use this token in your debug session:');
    console.log('1. Open src/contexts/AuthContext.tsx');
    console.log('2. Add a line to manually set the token after login:');
    console.log(`   setAccessToken("${accessToken}");`);
    console.log('   (Add this right after the "console.log("Decoded JWT: ", decoded);" line)');
    
    // Also update the hardcoded token in this file
    updateHardcodedToken(accessToken);
    
  } catch (error) {
    console.error('\n===== TEST RESULTS =====');
    console.error('🔴 Test failed!', error.message);
    console.error('Your Google credentials may not have proper access to Google Drive.');
    console.error('\nPossible solutions:');
    console.error('1. Make sure you have enabled the Google Drive API in your Google Cloud project');
    console.error('2. Make sure your OAuth client is configured with the correct redirect URIs');
    console.error('3. Try getting a fresh token with "npm run get-token"');
    console.error('4. Check if your Google account has any restrictions');
  }
}

// Function to update the hardcoded token in this file for future use
function updateHardcodedToken(token) {
  const filePath = __filename;
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  try {
    // Replace the hardcoded token line with the new token
    const newContent = fileContent.replace(
      /const HARDCODED_ACCESS_TOKEN = .*?;/,
      `const HARDCODED_ACCESS_TOKEN = "${token}"; // Auto-updated on ${new Date().toISOString()}`
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, newContent);
    console.log('\nUpdated the hardcoded token in this script for future use.');
  } catch (error) {
    console.error('Could not update the hardcoded token:', error.message);
  }
}

async function getUserInfo(accessToken) {
  try {
    if (VERBOSE) console.log('   Fetching user info from Google API...');
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`Failed to get user info: ${error.error?.message || response.statusText}`);
    }
    
    const userInfo = await response.json();
    if (VERBOSE) console.log('   User info received:', userInfo);
    return userInfo;
  } catch (error) {
    console.error('Error fetching user info:', error);
    throw error;
  }
}

async function createOrGetFolder(accessToken) {
  if (VERBOSE) console.log(`   Searching for existing folder named '${FOLDER_NAME}'...`);
  // Search for existing folder
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`;
  
  try {
    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`Failed to search for folders: ${error.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    if (VERBOSE) console.log(`   Search results:`, data);
    
    // If folder exists, return its ID
    if (data.files.length > 0) {
      if (VERBOSE) console.log(`   Found existing folder with ID: ${data.files[0].id}`);
      return data.files[0].id;
    }
    
    // If folder doesn't exist, create it
    if (VERBOSE) console.log(`   No existing folder found. Creating new folder...`);
    
    const createUrl = 'https://www.googleapis.com/drive/v3/files';
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder'
      })
    });
    
    if (!createResponse.ok) {
      const error = await createResponse.json().catch(() => ({ error: { message: createResponse.statusText } }));
      throw new Error(`Failed to create folder: ${error.error?.message || createResponse.statusText}`);
    }
    
    const folder = await createResponse.json();
    if (VERBOSE) console.log(`   Created new folder:`, folder);
    return folder.id;
  } catch (error) {
    console.error('Error creating or getting folder:', error);
    throw error;
  }
}

async function createTestFile(accessToken, folderId) {
  if (VERBOSE) console.log(`   Creating test file in folder ${folderId}...`);
  
  try {
    const testContent = { test: 'data', timestamp: new Date().toISOString() };
    if (VERBOSE) console.log(`   File content:`, testContent);
    
    const fileMetadata = {
      name: 'test-file.json',
      parents: [folderId]
    };
    
    // Create file metadata
    const createUrl = 'https://www.googleapis.com/drive/v3/files';
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(fileMetadata)
    });
    
    if (!createResponse.ok) {
      const error = await createResponse.json().catch(() => ({ error: { message: createResponse.statusText } }));
      throw new Error(`Failed to create file: ${error.error?.message || createResponse.statusText}`);
    }
    
    const file = await createResponse.json();
    if (VERBOSE) console.log(`   File metadata created:`, file);
    
    // Upload content to the file
    const contentUrl = `https://www.googleapis.com/upload/drive/v3/files/${file.id}?uploadType=media`;
    const contentResponse = await fetch(contentUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testContent)
    });
    
    if (!contentResponse.ok) {
      const error = await contentResponse.json().catch(() => ({ error: { message: contentResponse.statusText } }));
      throw new Error(`Failed to upload file content: ${error.error?.message || contentResponse.statusText}`);
    }
    
    if (VERBOSE) console.log(`   Content uploaded successfully`);
    return file.id;
  } catch (error) {
    console.error('Error creating test file:', error);
    throw error;
  }
}

async function readFileContent(accessToken, fileId) {
  if (VERBOSE) console.log(`   Reading content from file ${fileId}...`);
  
  try {
    const contentUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const response = await fetch(contentUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`Failed to read file content: ${error.error?.message || response.statusText}`);
    }
    
    const content = await response.json();
    if (VERBOSE) console.log(`   Successfully read file content`);
    return content;
  } catch (error) {
    console.error('Error reading file content:', error);
    throw error;
  }
}

async function updateFileContent(accessToken, fileId, content) {
  if (VERBOSE) console.log(`   Updating content for file ${fileId}...`);
  
  try {
    const contentUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
    const response = await fetch(contentUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(content)
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`Failed to update file content: ${error.error?.message || response.statusText}`);
    }
    
    if (VERBOSE) console.log(`   File content updated successfully`);
    return await response.json();
  } catch (error) {
    console.error('Error updating file content:', error);
    throw error;
  }
}

// Start the main function when the script is run
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 