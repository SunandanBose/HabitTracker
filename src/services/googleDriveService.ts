import { GOOGLE_DISCOVERY_DOCS, GOOGLE_SCOPES, HABIT_TRACKER_FOLDER_NAME, DATA_FILE_NAME } from '../config/googleAuth';
import { useAuth } from '../contexts/AuthContext';

interface HabitData {
  dailyTracker: any[];
  monthlyTracker: any[];
  customColumns: string[];
}

interface GoogleDriveFile {
  id: string;
  name: string;
}

interface GoogleDriveFileList {
  files: GoogleDriveFile[];
}

interface GoogleDriveFileMetadata {
  name: string;
  mimeType: string;
  parents?: string[];
}

class GoogleDriveService {
  private async getAccessToken(): Promise<string> {
    const { getAccessToken } = useAuth();
    const token = await getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }
    return token;
  }

  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<any> {
    const token = await this.getAccessToken();
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Google API error: ${response.status} ${response.statusText} ${JSON.stringify(errorData)}`);
    }

    return response.json();
  }

  async createOrGetFolder(): Promise<string> {
    try {
      // Search for existing folder
      const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${HABIT_TRACKER_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`;
      const response = await this.fetchWithAuth(searchUrl);

      if (response.files && response.files.length > 0) {
        return response.files[0].id;
      }

      // Create new folder if not found
      const folderMetadata: GoogleDriveFileMetadata = {
        name: HABIT_TRACKER_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      };

      const createUrl = 'https://www.googleapis.com/drive/v3/files?fields=id';
      const folder = await this.fetchWithAuth(createUrl, {
        method: 'POST',
        body: JSON.stringify(folderMetadata),
      });

      return folder.id;
    } catch (error) {
      console.error('Error creating/getting folder:', error);
      throw error;
    }
  }

  async createOrGetDataFile(folderId: string): Promise<string> {
    try {
      // Search for existing file
      const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${DATA_FILE_NAME}' and '${folderId}' in parents and trashed=false&fields=files(id,name)`;
      const response = await this.fetchWithAuth(searchUrl);

      if (response.files && response.files.length > 0) {
        return response.files[0].id;
      }

      // Create new file if not found
      const fileMetadata: GoogleDriveFileMetadata = {
        name: DATA_FILE_NAME,
        mimeType: 'application/json',
        parents: [folderId],
      };

      const createUrl = 'https://www.googleapis.com/drive/v3/files?fields=id';
      const file = await this.fetchWithAuth(createUrl, {
        method: 'POST',
        body: JSON.stringify(fileMetadata),
      });

      // Initialize the file with empty data
      const initialData: HabitData = {
        dailyTracker: [],
        monthlyTracker: [],
        customColumns: [],
      };

      await this.updateFileContent(file.id, initialData);

      return file.id;
    } catch (error) {
      console.error('Error creating/getting data file:', error);
      throw error;
    }
  }

  async getFileContent(fileId: string): Promise<HabitData> {
    try {
      const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      return await this.fetchWithAuth(url);
    } catch (error) {
      console.error('Error getting file content:', error);
      throw error;
    }
  }

  async updateFileContent(fileId: string, content: HabitData): Promise<void> {
    try {
      const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
      await this.fetchWithAuth(url, {
        method: 'PATCH',
        body: JSON.stringify(content),
      });
    } catch (error) {
      console.error('Error updating file content:', error);
      throw error;
    }
  }
}

export const googleDriveService = new GoogleDriveService(); 