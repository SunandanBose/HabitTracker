import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider } from '../../src/contexts/AuthContext';
import App from '../../src/App';

// Mock the AuthContext
jest.mock('../../src/contexts/AuthContext', () => {
  const originalModule = jest.requireActual('../../src/contexts/AuthContext');
  
  return {
    ...originalModule,
    useAuth: () => ({
      isAuthenticated: true,
      isGoogleApiLoaded: true,
      user: {
        name: 'Test User',
        email: 'test@example.com',
        picture: 'https://example.com/pic.jpg',
        credential: 'test-credential',
      },
      signOut: jest.fn(),
      error: null,
      getAccessToken: jest.fn().mockResolvedValue('test-token'),
    }),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="auth-provider">{children}</div>,
  };
});

// Mock the useGoogleDrive hook
jest.mock('../../src/hooks/useGoogleDrive', () => {
  return {
    useGoogleDrive: () => ({
      googleDriveService: {
        createOrGetFolder: jest.fn().mockResolvedValue('test-folder-id'),
        createOrGetDataFile: jest.fn().mockResolvedValue('test-file-id'),
        getFileContent: jest.fn().mockResolvedValue({
          dailyTracker: [],
          monthlyTracker: [],
          customColumns: ['leetcode', 'study'],
        }),
        updateFileContent: jest.fn().mockResolvedValue({}),
      },
      isInitialized: true,
      isLoading: false,
      error: null,
      initializeGoogleDrive: jest.fn().mockResolvedValue(true),
    }),
  };
});

// Mock Header component to simplify testing
jest.mock('../../src/components/Header', () => () => <div data-testid="header">Header</div>);
jest.mock('../../src/components/MonthlyTracker', () => () => <div data-testid="monthly-tracker">Monthly Tracker</div>);
jest.mock('../../src/components/LoginPage', () => () => <div data-testid="login-page">Login Page</div>);

// Use the real DailyTracker component
jest.unmock('../../src/components/DailyTracker');

const theme = createTheme();

// Helper function to wrap component with necessary providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          {ui}
        </LocalizationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

describe('DailyTracker Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Full add row workflow', async () => {
    renderWithProviders(<App />);
    
    // Wait for the components to render
    await waitFor(() => {
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });
    
    // Verify empty state message is shown
    expect(screen.getByText('No data available. Click the "Add Row" button to create a new entry.')).toBeInTheDocument();
    
    // Click the "Add Row" button (FAB)
    const addRowButton = screen.getByTestId('add-row-fab');
    fireEvent.click(addRowButton);
    
    // Fill in the form
    const commentField = screen.getByRole('textbox');
    fireEvent.change(commentField, { target: { value: 'Test comment for integration' } });
    
    // Find the checkboxes for the custom columns
    const checkboxes = screen.getAllByRole('checkbox');
    // Should have two checkboxes for leetcode and study
    expect(checkboxes.length).toBe(2);
    
    // Check the leetcode checkbox
    fireEvent.click(checkboxes[0]);
    
    // Add the row
    const addRowConfirmButton = screen.getByTestId('add-row-button');
    fireEvent.click(addRowConfirmButton);
    
    // Verify the row was added by looking for the comment
    await waitFor(() => {
      expect(screen.getByText('Test comment for integration')).toBeInTheDocument();
    });
    
    // Add another row to test sequential numbering
    const addRowButton2 = screen.getByTestId('add-row-fab');
    fireEvent.click(addRowButton2);
    
    // Fill in the form
    const commentField2 = screen.getByRole('textbox');
    fireEvent.change(commentField2, { target: { value: 'Second row' } });
    
    // Add the second row
    const addRowConfirmButton2 = screen.getByTestId('add-row-button');
    fireEvent.click(addRowConfirmButton2);
    
    // Verify both rows are displayed
    await waitFor(() => {
      expect(screen.getByText('Test comment for integration')).toBeInTheDocument();
      expect(screen.getByText('Second row')).toBeInTheDocument();
    });
    
    // Click save
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);
  });
}); 