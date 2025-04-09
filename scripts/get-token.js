#!/usr/bin/env node

/**
 * This script helps you obtain a fresh Google access token for testing.
 * It opens a simple local web server that will let you authenticate with Google and
 * get an access token that you can use with test-drive-access.js.
 */

const express = require('express');
const importedOpen = require('open');
const { OAuth2Client } = require('google-auth-library');
const http = require('http');
const url = require('url');
const dotenv = require('dotenv');
const path = require('path');
const { exec } = require('child_process');

// Open function may be exported differently depending on the package version
const openBrowser = typeof importedOpen === 'function' ? importedOpen : importedOpen.default;

// Load environment variables
dotenv.config();

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.REACT_APP_GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3300/oauth2callback';
const SCOPES = ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'];

// Track if we're being called directly or as a module
const isCalledDirectly = require.main === module;
let tokenResolve = null;
let tokenReject = null;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Error: CLIENT_ID or CLIENT_SECRET not found in .env file');
  console.error('Make sure your .env file contains REACT_APP_GOOGLE_CLIENT_ID and REACT_APP_GOOGLE_CLIENT_SECRET');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
let authClient;

// Create OAuth client
try {
  authClient = new OAuth2Client(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );
} catch (error) {
  console.error('Error creating OAuth client:', error.message);
  process.exit(1);
}

// Main page
app.get('/', (req, res) => {
  const authUrl = authClient.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Get Google Access Token</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          line-height: 1.6;
        }
        pre {
          background-color: #f5f5f5;
          padding: 10px;
          border-radius: 5px;
          overflow-x: auto;
        }
        .button {
          display: inline-block;
          background-color: #4285f4;
          color: white;
          padding: 10px 20px;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
        }
        .container {
          margin-top: 30px;
        }
      </style>
    </head>
    <body>
      <h1>Google Access Token Generator</h1>
      <p>This tool will help you get a fresh Google access token for testing your Habit Tracker app.</p>
      
      <div class="container">
        <a href="${authUrl}" class="button">Sign in with Google</a>
      </div>
      
      <div id="token-container" style="display:none;" class="container">
        <h2>Your Access Token</h2>
        <p>Copy this token and use it in the test-drive-access.js script:</p>
        <pre id="token"></pre>
        
        <h3>How to use this token:</h3>
        <ol>
          <li>Open <code>scripts/test-drive-access.js</code></li>
          <li>Replace the value of <code>HARDCODED_ACCESS_TOKEN</code> with this token</li>
          <li>Run <code>npm run test-drive</code></li>
        </ol>
      </div>
      
      <script>
        // Check if we have a token in the URL hash
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        if (token) {
          document.getElementById('token-container').style.display = 'block';
          document.getElementById('token').textContent = token;
        }
      </script>
    </body>
    </html>
  `);
});

// OAuth callback
app.get('/oauth2callback', async (req, res) => {
  const qs = new url.URL(req.url, 'http://localhost:3300').searchParams;
  const code = qs.get('code');
  
  if (!code) {
    res.status(400).send('Authorization code not found');
    return;
  }
  
  try {
    // Exchange code for tokens
    const { tokens } = await authClient.getToken(code);
    const accessToken = tokens.access_token;
    
    // If we're being called as a module, resolve the promise with the token
    if (tokenResolve) {
      tokenResolve(accessToken);
      // Allow the HTML response to still render before closing the server
      setTimeout(() => {
        server.close();
      }, 1000);
    }
    
    // Redirect to the main page with the token
    res.redirect(`/?token=${accessToken}`);
  } catch (error) {
    console.error('Error getting tokens:', error);
    if (tokenReject) {
      tokenReject(error);
    }
    res.status(500).send(`Error getting tokens: ${error.message}`);
  }
});

// Function to open the browser manually
function openBrowserManually(url) {
  console.log(`Please open this URL in your browser: ${url}`);
  
  // Try to use platform-specific commands to open the URL
  const platform = process.platform;
  let command;
  
  if (platform === 'darwin') {  // macOS
    command = `open "${url}"`;
  } else if (platform === 'win32') {  // Windows
    command = `start "${url}"`;
  } else {  // Linux and others
    command = `xdg-open "${url}"`;
  }
  
  exec(command, (error) => {
    if (error) {
      console.log('Could not automatically open the browser.');
      console.log(`Please manually open: ${url}`);
    }
  });
}

// Export a function to get a token programmatically
function getToken() {
  return new Promise((resolve, reject) => {
    // Save the resolve/reject functions to use in the callback
    tokenResolve = resolve;
    tokenReject = reject;
    
    // Start the server if it's not already running
    if (!server.listening) {
      server.listen(3300, () => {
        console.log('\n===== Google Access Token Generator =====\n');
        console.log('Starting local server on http://localhost:3300');
        console.log('Opening browser...\n');
        
        // Try to open the browser with the imported module
        try {
          if (openBrowser) {
            openBrowser('http://localhost:3300').catch(() => {
              openBrowserManually('http://localhost:3300');
            });
          } else {
            openBrowserManually('http://localhost:3300');
          }
        } catch (error) {
          console.error('Error opening browser:', error);
          openBrowserManually('http://localhost:3300');
        }
        
        console.log('Follow the instructions in the browser to get your access token.');
        console.log('Press Ctrl+C to stop the server when you\'re done.\n');
      });
    }
  });
}

// If run directly, start the server
if (isCalledDirectly) {
  server.listen(3300, () => {
    console.log('\n===== Google Access Token Generator =====\n');
    console.log('Starting local server on http://localhost:3300');
    console.log('Opening browser...\n');
    
    // Try to open the browser with the imported module
    try {
      if (openBrowser) {
        openBrowser('http://localhost:3300').catch(() => {
          openBrowserManually('http://localhost:3300');
        });
      } else {
        openBrowserManually('http://localhost:3300');
      }
    } catch (error) {
      console.error('Error opening browser:', error);
      openBrowserManually('http://localhost:3300');
    }
    
    console.log('Follow the instructions in the browser to get your access token.');
    console.log('Press Ctrl+C to stop the server when you\'re done.\n');
  });
}

module.exports = { getToken }; 