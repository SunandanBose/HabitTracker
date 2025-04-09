import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, 
  CssBaseline, 
  ThemeProvider, 
  createTheme, 
  CircularProgress, 
  Box, 
  Typography,
  Button,
  Alert,
  AlertTitle
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import Header from './components/Header';
import DailyTracker from './components/DailyTracker';
import MonthlyTracker from './components/MonthlyTracker';
import { useGoogleDrive } from './hooks/useGoogleDrive';
import AuthDebugger from './components/AuthDebugger';

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

const AppContent: React.FC = () => {
  const { isAuthenticated, user, signOut } = useAuth();
  const { 
    googleDriveService, 
    isInitialized, 
    isLoading: isDriveLoading, 
    error: driveError, 
    initializeGoogleDrive 
  } = useGoogleDrive();
  
  const [data, setData] = useState<any[]>([]);
  const [customColumns, setCustomColumns] = useState<string[]>([]);
  const [fileId, setFileId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Define loadUserData before any useEffect that depends on it
  const loadUserData = useCallback(async () => {
    console.log('App: loadUserData called');
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('App: Creating or getting folder...');
      const folderId = await googleDriveService.createOrGetFolder();
      console.log('App: Got folder ID:', folderId);
      
      console.log('App: Creating or getting data file...');
      const fileId = await googleDriveService.createOrGetDataFile(folderId);
      console.log('App: Got file ID:', fileId);
      setFileId(fileId);
      
      console.log('App: Getting file content...');
      const content = await googleDriveService.getFileContent(fileId);
      console.log('App: Got file content:', content);
      
      setData(content.dailyTracker || []);
      setCustomColumns(content.customColumns || []);
      console.log('App: Data loaded successfully');
    } catch (error: any) {
      console.error('Error loading user data:', error);
      setError(`Failed to load user data: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [googleDriveService]);

  // Clear app error when drive error changes
  useEffect(() => {
    if (driveError) {
      setError(driveError);
    }
  }, [driveError]);

  // Load user data when drive is initialized
  useEffect(() => {
    console.log('App: Drive initialization state changed:', { 
      isAuthenticated, 
      isInitialized, 
      fileId,
      isLoading,
      isDriveLoading
    });
    
    if (isAuthenticated && isInitialized && fileId === '' && !isLoading) {
      console.log('App: Loading user data...');
      loadUserData();
    }
  }, [isAuthenticated, isInitialized, fileId, isLoading, isDriveLoading, loadUserData]);

  // Add a timeout to detect if the app is stuck in loading state
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    // If we're in a loading state for more than 10 seconds, trigger an error
    if (isDriveLoading) {
      console.log('Setting loading timeout detection...');
      timeoutId = setTimeout(() => {
        console.error('Loading state persisted for too long - possible stuck state detected');
        // Force initialize/retry if we appear to be stuck
        if (isDriveLoading) {
          console.log('Forcing Google Drive initialization retry...');
          initializeGoogleDrive();
        }
      }, 10000); // 10 seconds
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isDriveLoading, initializeGoogleDrive]);

  const handleRetry = () => {
    console.log('App: Retrying initialization...');
    setError(null);
    initializeGoogleDrive();
  };

  const handleAddColumn = (columnName: string) => {
    setCustomColumns([...customColumns, columnName]);
  };

  const handleAddRow = (row: any) => {
    setData([...data, row]);
  };

  const handleUpdateRow = (updatedRow: any) => {
    console.log('Updating row:', updatedRow);
    // Use map to find and replace the updated row
    setData(prevData => 
      prevData.map(row => row.id === updatedRow.id ? updatedRow : row)
    );
  };

  const handleSave = async () => {
    if (!isInitialized) {
      setError('Google Drive not initialized. Please try again later.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Saving data to Google Drive...', {
        dailyTracker: data,
        customColumns
      });
      
      await googleDriveService.updateFileContent(fileId, {
        dailyTracker: data,
        monthlyTracker: [], // This will be calculated in the MonthlyTracker component
        customColumns,
      });
      
      console.log('Data saved successfully');
    } catch (error: any) {
      console.error('Error saving data:', error);
      setError(`Failed to save data: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // If not authenticated, show login page
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Show loading spinner while initializing or loading data
  if (isLoading || isDriveLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography variant="h6">
          {isDriveLoading ? 'Initializing Google Drive...' : 'Loading your data...'}
        </Typography>
      </Box>
    );
  }

  // Show error message if there's an error
  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', p: 3 }}>
        <Alert 
          severity="error" 
          sx={{ mb: 3, width: '100%', maxWidth: 600 }}
        >
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
        
        <Typography variant="body1" sx={{ mb: 2 }}>
          Please try refreshing the page or signing out and back in.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleRetry}
          >
            Retry
          </Button>
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={signOut}
          >
            Sign Out
          </Button>
        </Box>
        
        <Alert severity="info" sx={{ width: '100%', maxWidth: 600 }}>
          <AlertTitle>Troubleshooting Steps</AlertTitle>
          <Typography variant="body2">
            If you continue to see this error, please make sure your Google OAuth client ID is configured correctly:
          </Typography>
          <ol>
            <li>Go to the Google Cloud Console: https://console.cloud.google.com/</li>
            <li>Select your project</li>
            <li>Go to "APIs &amp; Services" &gt; "Credentials"</li>
            <li>Find your OAuth 2.0 Client ID and click on it to edit</li>
            <li>Under "Authorized JavaScript origins", add: http://localhost:3000</li>
            <li>Under "Authorized redirect URIs", add: http://localhost:3000</li>
            <li>Ensure the Google Drive API is enabled for your project</li>
            <li>Click "Save"</li>
          </ol>
        </Alert>
      </Box>
    );
  }

  // Show the main app content
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <CssBaseline />
        <Header />
        <Container maxWidth="lg">
          <MonthlyTracker 
            data={data} 
            customColumns={customColumns} 
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
          <DailyTracker
            data={data}
            customColumns={customColumns}
            onAddColumn={handleAddColumn}
            onAddRow={handleAddRow}
            onUpdateRow={handleUpdateRow}
            onSave={handleSave}
          />
        </Container>
        {isDevelopment && <AuthDebugger />}
      </LocalizationProvider>
    </ThemeProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App; 