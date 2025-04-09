import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useGoogleDrive } from '../src/hooks/useGoogleDrive';
import { AuthProvider } from '../src/contexts/AuthContext';

// Mock the AuthContext
jest.mock('../src/contexts/AuthContext', () => {
  const original = jest.requireActual('../src/contexts/AuthContext');
  return {
    ...original,
    useAuth: () => ({
      isAuthenticated: true,
      isGoogleApiLoaded: true,
      getAccessToken: jest.fn().mockResolvedValue('test-token'),
      error: null,
    }),
  };
});

// Mock the googleDriveService
jest.mock('../src/services/googleDriveService', () => {
  return {
    googleDriveService: {
      setAccessToken: jest.fn(),
      createOrGetFolder: jest.fn().mockResolvedValue('test-folder-id'),
      createOrGetDataFile: jest.fn().mockResolvedValue('test-file-id'),
      getFileContent: jest.fn().mockResolvedValue({
        dailyTracker: [],
        monthlyTracker: [],
        customColumns: [],
      }),
      updateFileContent: jest.fn().mockResolvedValue({}),
    },
  };
});

// Test component that uses the useGoogleDrive hook
const TestComponent = () => {
  const { 
    googleDriveService, 
    isInitialized, 
    isLoading, 
    error, 
    initializeGoogleDrive 
  } = useGoogleDrive();
  
  return (
    <div>
      <div data-testid="drive-initialized">
        {isInitialized ? 'Initialized' : 'Not Initialized'}
      </div>
      <div data-testid="drive-loading">
        {isLoading ? 'Loading' : 'Not Loading'}
      </div>
      {error && (
        <div data-testid="drive-error">
          {error}
        </div>
      )}
      <button 
        data-testid="initialize-button" 
        onClick={() => initializeGoogleDrive()}
      >
        Initialize
      </button>
    </div>
  );
};

describe('useGoogleDrive hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('initializes with correct default state', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(screen.getByTestId('drive-initialized')).toHaveTextContent('Not Initialized');
    expect(screen.getByTestId('drive-loading')).toHaveTextContent('Not Loading');
    expect(screen.queryByTestId('drive-error')).not.toBeInTheDocument();
  });
  
  test('initializes Google Drive successfully', async () => {
    const { googleDriveService } = jest.requireMock('../src/services/googleDriveService');
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Initially not initialized
    expect(screen.getByTestId('drive-initialized')).toHaveTextContent('Not Initialized');
    
    // Click to initialize manually
    act(() => {
      screen.getByTestId('initialize-button').click();
    });
    
    // Should show loading state
    expect(screen.getByTestId('drive-loading')).toHaveTextContent('Loading');
    
    // After initialization completes
    await waitFor(() => {
      expect(screen.getByTestId('drive-initialized')).toHaveTextContent('Initialized');
      expect(screen.getByTestId('drive-loading')).toHaveTextContent('Not Loading');
    });
    
    // Check that the service was called with the token
    expect(googleDriveService.setAccessToken).toHaveBeenCalledWith('test-token');
    expect(googleDriveService.createOrGetFolder).toHaveBeenCalled();
  });
  
  test('handles errors during initialization', async () => {
    const { googleDriveService } = jest.requireMock('../src/services/googleDriveService');
    googleDriveService.createOrGetFolder.mockRejectedValueOnce(new Error('Test error'));
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Click to initialize manually
    act(() => {
      screen.getByTestId('initialize-button').click();
    });
    
    // After initialization fails
    await waitFor(() => {
      expect(screen.getByTestId('drive-initialized')).toHaveTextContent('Not Initialized');
      expect(screen.getByTestId('drive-loading')).toHaveTextContent('Not Loading');
      expect(screen.getByTestId('drive-error')).toBeInTheDocument();
    });
  });
}); 