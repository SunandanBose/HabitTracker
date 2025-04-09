import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';

// Mock the Google OAuth library
jest.mock('@react-oauth/google', () => ({
  GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="google-provider">{children}</div>,
  useGoogleLogin: () => ({
    onSuccess: jest.fn(),
    onError: jest.fn(),
  }),
}));

// Mock jwt-decode
jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn(() => ({
    name: 'Test User',
    email: 'test@example.com',
    picture: 'https://example.com/pic.jpg',
  })),
}));

// Test component that uses the auth context
const TestComponent = () => {
  const auth = useAuth();
  
  return (
    <div>
      <div data-testid="auth-state">
        {auth.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
      </div>
      <div data-testid="google-api-state">
        {auth.isGoogleApiLoaded ? 'Loaded' : 'Not Loaded'}
      </div>
      {auth.user && (
        <div data-testid="user-info">
          {auth.user.name} ({auth.user.email})
        </div>
      )}
      {auth.error && (
        <div data-testid="auth-error">
          {auth.error}
        </div>
      )}
      <button 
        data-testid="login-button" 
        onClick={() => auth.handleGoogleLoginSuccess({ credential: 'test-credential' })}
      >
        Login
      </button>
      <button 
        data-testid="signout-button" 
        onClick={auth.signOut}
      >
        Sign Out
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  test('provides auth context to children', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(screen.getByTestId('auth-state')).toHaveTextContent('Not Authenticated');
    expect(screen.getByTestId('google-api-state')).toHaveTextContent('Not Loaded');
    expect(screen.queryByTestId('user-info')).not.toBeInTheDocument();
  });
  
  test('handles login successfully', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Act - click the login button
    act(() => {
      screen.getByTestId('login-button').click();
    });
    
    // Assert - check that auth state changed
    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-info')).toHaveTextContent('Test User (test@example.com)');
    });
  });
  
  test('handles sign out successfully', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // First login
    act(() => {
      screen.getByTestId('login-button').click();
    });
    
    // Wait for login to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toHaveTextContent('Authenticated');
    });
    
    // Then sign out
    act(() => {
      screen.getByTestId('signout-button').click();
    });
    
    // Assert - check that auth state changed back
    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toHaveTextContent('Not Authenticated');
      expect(screen.queryByTestId('user-info')).not.toBeInTheDocument();
    });
  });
}); 