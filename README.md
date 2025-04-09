# Habit Tracker App

A habit tracking application that uses Google Drive to store your progress.

## Setup Instructions

### 1. Google OAuth Client Configuration

To use this application, you need to set up a Google OAuth client:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select your existing project
3. Enable the Google Drive API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Drive API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application" as the application type
   - Add a name for your OAuth client
   - Under "Authorized JavaScript origins", add: `http://localhost:3000`
   - Under "Authorized redirect URIs", add: `http://localhost:3000`
   - Click "Create"
5. Copy your Client ID and Client Secret
6. Update the `.env` file in the root of this project with these values

### 2. Installation and Running the App

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) to view the app in your browser.

## Troubleshooting

If you encounter any issues with Google authentication:

1. Make sure your Client ID and Secret are correctly set in the `.env` file
2. Check that you've added `http://localhost:3000` to both Authorized JavaScript origins and redirect URIs
3. Ensure the Google Drive API is enabled for your project
4. Try clearing your browser cache and cookies, then restart the application
5. Check the browser console for any specific error messages

## Technologies Used

- React
- TypeScript
- Material UI
- Google OAuth 2.0
- Google Drive API
