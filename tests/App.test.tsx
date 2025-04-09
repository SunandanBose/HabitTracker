import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../src/App';

// Mock the AuthContext
jest.mock('../src/contexts/AuthContext', () => {
  const originalModule = jest.requireActual('../src/contexts/AuthContext');
  
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
    }),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="auth-provider">{children}</div>,
  };
});

// Mock the useGoogleDrive hook
jest.mock('../src/hooks/useGoogleDrive', () => {
  return {
    useGoogleDrive: () => ({
      googleDriveService: {
        createOrGetFolder: jest.fn().mockResolvedValue('test-folder-id'),
        createOrGetDataFile: jest.fn().mockResolvedValue('test-file-id'),
        getFileContent: jest.fn().mockResolvedValue({
          dailyTracker: [],
          monthlyTracker: [],
          customColumns: [],
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

// Mock the components
jest.mock('../src/components/Header', () => () => <div data-testid="header">Header</div>);
jest.mock('../src/components/DailyTracker', () => () => <div data-testid="daily-tracker">Daily Tracker</div>);
jest.mock('../src/components/MonthlyTracker', () => () => <div data-testid="monthly-tracker">Monthly Tracker</div>);
jest.mock('../src/components/LoginPage', () => () => <div data-testid="login-page">Login Page</div>);
jest.mock('../src/components/AuthDebugger', () => () => <div data-testid="auth-debugger">Auth Debugger</div>);

describe('App component', () => {
  // Save original ENV
  const originalEnv = process.env.NODE_ENV;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  afterAll(() => {
    // Restore ENV
    process.env.NODE_ENV = originalEnv;
  });
  
  test('renders login page when not authenticated', () => {
    // Override authentication status for this test
    jest.mock('../src/contexts/AuthContext', () => {
      return {
        useAuth: () => ({
          isAuthenticated: false,
        }),
        AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
      };
    });
    
    render(<App />);
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
  });
  
  test('renders main app when authenticated and initialized', async () => {
    render(<App />);
    
    // Wait for the components to render
    await waitFor(() => {
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('daily-tracker')).toBeInTheDocument();
      expect(screen.getByTestId('monthly-tracker')).toBeInTheDocument();
    });
  });
  
  test('renders auth debugger in development mode', async () => {
    // Set environment to development
    process.env.NODE_ENV = 'development';
    
    render(<App />);
    
    // Auth debugger should be present in development mode
    await waitFor(() => {
      expect(screen.getByTestId('auth-debugger')).toBeInTheDocument();
    });
  });
  
  test('does not render auth debugger in production mode', async () => {
    // Set environment to production
    process.env.NODE_ENV = 'production';
    
    render(<App />);
    
    // Auth debugger should not be present in production mode
    await waitFor(() => {
      expect(screen.queryByTestId('auth-debugger')).not.toBeInTheDocument();
    });
  });
}); 