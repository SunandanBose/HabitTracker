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
  AlertTitle,
  alpha,
  responsiveFontSizes
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import Header from './components/Header';
import DailyTracker from './components/DailyTracker';
import MonthlyTracker from './components/MonthlyTracker';
import CollapsibleSection from './components/CollapsibleSection';
import StartNewHabitButton from './components/StartNewHabitButton';
import { useGoogleDrive } from './hooks/useGoogleDrive';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { format } from 'date-fns';

// Import or define the TrackerRow interface to match DailyTracker component
interface TrackerRow {
  id: number;
  slNo: number;
  date: string;
  day: string;
  month: string;
  comment: string;
  [key: string]: any; // This allows dynamic column names
}

// Create a theme instance.
let theme = createTheme({
  palette: {
    primary: {
      light: '#64b5f6',
      main: '#2196f3',
      dark: '#1976d2',
      contrastText: '#fff',
    },
    secondary: {
      light: '#ff4081',
      main: '#f50057',
      dark: '#c51162',
      contrastText: '#fff',
    },
    background: {
      default: '#f9fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#2c3e50',
      secondary: '#546e7a',
    },
    error: {
      main: '#f44336',
    },
    success: {
      main: '#4caf50',
    }
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
        },
        contained: {
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
          '&:hover': {
            boxShadow: '0 6px 15px rgba(0, 0, 0, 0.20)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
        },
        elevation2: {
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '16px',
        },
      },
    },
  },
});

// Apply responsive font sizes
theme = responsiveFontSizes(theme);

const AppContent: React.FC = () => {
  const { isAuthenticated, signOut } = useAuth();
  const { 
    googleDriveService, 
    isInitialized, 
    isLoading: isDriveLoading, 
    error: driveError, 
    initializeGoogleDrive 
  } = useGoogleDrive();
  
  const [data, setData] = useState<TrackerRow[]>([]);
  const [customColumns, setCustomColumns] = useState<string[]>([]);
  const [fileId, setFileId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Define loadUserData before any useEffect that depends on it
  const loadUserData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const folderId = await googleDriveService.createOrGetFolder();
      const fileId = await googleDriveService.createOrGetDataFile(folderId);
      setFileId(fileId);
      
      const content = await googleDriveService.getFileContent(fileId);
      
      // Ensure all rows have slNo property
      const trackerData = (content.dailyTracker || []).map((row: any, index: number) => ({
        ...row,
        slNo: row.slNo || index + 1, // Use existing slNo or create sequential one
      })) as TrackerRow[];
      
      setData(trackerData);
      setCustomColumns(content.customColumns || []);
    } catch (error: any) {
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
    if (isAuthenticated && isInitialized && fileId === '' && !isLoading) {
      loadUserData();
    }
  }, [isAuthenticated, isInitialized, fileId, isLoading, isDriveLoading, loadUserData]);

  // Add a timeout to detect if the app is stuck in loading state
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    // If we're in a loading state for more than 10 seconds, trigger an error
    if (isDriveLoading) {
      timeoutId = setTimeout(() => {
        // Force initialize/retry if we appear to be stuck
        if (isDriveLoading) {
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
    setError(null);
    initializeGoogleDrive();
  };

  const handleAddColumn = (columnName: string) => {
    setCustomColumns([...customColumns, columnName]);
  };

  const handleAddRow = (row: TrackerRow) => {
    // Validate the row
    if (!row || !row.date) {
      console.error('Cannot add invalid row:', row);
      return;
    }
    
    // Ensure the row has all required properties
    const validRow = {
      ...row,
      id: row.id || Date.now(),
      slNo: row.slNo || data.length + 1,
      // Make sure all custom columns exist (with default false value)
      ...customColumns.reduce((acc, col) => ({
        ...acc,
        [col]: typeof row[col] === 'boolean' ? row[col] : false
      }), {})
    };
    
    // Update state with the new row
    setData(prevData => [...prevData, validRow]);
  };

  const handleUpdateRow = (updatedRow: TrackerRow) => {
    // Use map to find and replace the updated row
    setData(prevData => 
      prevData.map(row => row.id === updatedRow.id ? updatedRow : row)
    );
  };

  const handleDeleteHabit = async (habitName: string) => {
    if (!isInitialized) {
      setError('Google Drive not initialized. Please try again later.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Remove the habit from custom columns
      const updatedCustomColumns = customColumns.filter(col => col !== habitName);
      setCustomColumns(updatedCustomColumns);
      
      // Remove the habit from all data entries
      const updatedData = data.map(row => {
        const { [habitName]: removed, ...rest } = row;
        return rest as TrackerRow;
      });
      setData(updatedData);
      
      // Save to Google Drive
      await googleDriveService.updateFileContent(fileId, {
        dailyTracker: updatedData,
        monthlyTracker: [],
        customColumns: updatedCustomColumns,
      });
    } catch (error: any) {
      setError(`Failed to delete habit: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    console.log('App: handleSave called');
    if (!isInitialized) {
      console.log('App: Google Drive not initialized');
      setError('Google Drive not initialized. Please try again later.');
      return;
    }
    
    console.log('App: Starting save process, data length:', data.length);
    setIsLoading(true);
    setError(null);
    
    try {
      // Ensure all rows have valid slNo before saving
      const dataToSave = data.map((row, index) => ({
        ...row,
        slNo: row.slNo || index + 1 // Fallback to index+1 if slNo is missing
      }));
      
      console.log('App: Saving data to Google Drive, fileId:', fileId);
      await googleDriveService.updateFileContent(fileId, {
        dailyTracker: dataToSave,
        monthlyTracker: [], // This will be calculated in the MonthlyTracker component
        customColumns,
      });
      console.log('App: Save completed successfully');
    } catch (error: any) {
      console.error('App: Failed to save data:', error);
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
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: alpha(theme.palette.primary.light, 0.05)
      }}>
        <CircularProgress sx={{ mb: 2, color: theme.palette.primary.main }} />
        <Typography variant="h6" color="primary.main">
          {isDriveLoading ? 'Initializing Google Drive...' : 'Loading your data...'}
        </Typography>
      </Box>
    );
  }

  // Show error message if there's an error
  if (error) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        p: 3,
        background: alpha(theme.palette.error.light, 0.05)
      }}>
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3, 
            width: '100%', 
            maxWidth: 600,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          }}
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
        
        <Alert 
          severity="info" 
          sx={{ 
            width: '100%', 
            maxWidth: 600,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
          }}
        >
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
        <Container 
          maxWidth="lg" 
          sx={{ 
            py: 4,
            px: { xs: 2, sm: 3 }
          }}
        >
          <CollapsibleSection
            title={`Monthly Overview - ${format(selectedMonth, 'MMMM yyyy')}`}
            icon={<CalendarTodayIcon />}
            defaultExpanded={true}
          >
            <MonthlyTracker 
              data={data} 
              customColumns={customColumns} 
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
              onUpdateRow={handleUpdateRow}
              onAddRow={handleAddRow}
              onDeleteHabit={handleDeleteHabit}
              onSave={handleSave}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Daily Tracker"
            icon={<AssignmentIcon />}
            defaultExpanded={false}
          >
            <DailyTracker
              data={data}
              customColumns={customColumns}
              onAddColumn={handleAddColumn}
              onAddRow={handleAddRow}
              onUpdateRow={handleUpdateRow}
              onSave={handleSave}
            />
          </CollapsibleSection>

          <StartNewHabitButton onAddHabit={handleAddColumn} />
        </Container>
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