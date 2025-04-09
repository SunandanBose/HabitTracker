import { googleDriveService } from './googleDriveService';
import { useAuth } from '../contexts/AuthContext';

export const initializeGoogleDrive = async (): Promise<boolean> => {
  try {
    // This function should be called from a React component or a custom hook
    // where the useAuth hook is valid to use
    const { getAccessToken } = useAuth();
    const token = await getAccessToken();
    
    if (!token) {
      console.error('Failed to get access token');
      return false;
    }
    
    // Set the access token in the Google Drive service
    googleDriveService.setAccessToken(token);
    
    // Test a simple operation to verify the access token works
    try {
      await googleDriveService.createOrGetFolder();
      return true;
    } catch (error) {
      console.error('Error initializing Google Drive:', error);
      return false;
    }
  } catch (error) {
    console.error('Error in initialization process:', error);
    return false;
  }
}; 