import React, { useState, useEffect } from 'react';
import { Container, CssBaseline, ThemeProvider, createTheme, CircularProgress, Box, Typography } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { googleDriveService } from './services/googleDriveService';
import LoginPage from './components/LoginPage';
import Header from './components/Header';
import DailyTracker from './components/DailyTracker';
import MonthlyTracker from './components/MonthlyTracker';

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
  const { isAuthenticated, isGoogleApiLoaded } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [customColumns, setCustomColumns] = useState<string[]>([]);
  const [fileId, setFileId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && isGoogleApiLoaded) {
      initializeGoogleDrive();
    }
  }, [isAuthenticated, isGoogleApiLoaded]);

  const initializeGoogleDrive = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const folderId = await googleDriveService.createOrGetFolder();
      const fileId = await googleDriveService.createOrGetDataFile(folderId);
      setFileId(fileId);
      const content = await googleDriveService.getFileContent(fileId);
      setData(content.dailyTracker || []);
      setCustomColumns(content.customColumns || []);
    } catch (error) {
      console.error('Error initializing Google Drive:', error);
      setError('Failed to initialize Google Drive. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddColumn = (columnName: string) => {
    setCustomColumns([...customColumns, columnName]);
  };

  const handleAddRow = (row: any) => {
    setData([...data, row]);
  };

  const handleUpdateRow = (updatedRow: any) => {
    setData(data.map((row) => (row.id === updatedRow.id ? updatedRow : row)));
  };

  const handleSave = async () => {
    if (!isGoogleApiLoaded) {
      console.error('Google API not loaded');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await googleDriveService.updateFileContent(fileId, {
        dailyTracker: data,
        monthlyTracker: [], // This will be calculated in the MonthlyTracker component
        customColumns,
      });
    } catch (error) {
      console.error('Error saving data:', error);
      setError('Failed to save data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography color="error" variant="h6" gutterBottom>
          {error}
        </Typography>
        <Typography variant="body1">
          Please try refreshing the page or signing out and back in.
        </Typography>
      </Box>
    );
  }

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