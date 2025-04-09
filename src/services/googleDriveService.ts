import { GOOGLE_DISCOVERY_DOCS, GOOGLE_SCOPES, HABIT_TRACKER_FOLDER_NAME, DATA_FILE_NAME } from '../config/googleAuth';

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

interface GoogleUser {
  getBasicProfile: () => {
    getName: () => string;
    getImageUrl: () => string;
  };
}

declare global {
  interface Window {
    gapi: {
      load: (api: string, options: { callback: () => void; onerror: () => void }) => void;
      init: (options: { clientId: string; scope: string }) => Promise<void>;
      client: {
        drive: {
          files: {
            list: (params: { q: string; fields: string }) => Promise<{ result: GoogleDriveFileList }>;
            create: (params: { resource: GoogleDriveFileMetadata; fields: string }) => Promise<{ result: GoogleDriveFile }>;
            get: (params: { fileId: string; alt: string }) => Promise<{ result: HabitData }>;
            update: (params: { fileId: string; media: { mimeType: string; body: string } }) => Promise<void>;
          };
        };
      };
      auth2: {
        getAuthInstance: () => {
          isSignedIn: {
            get: () => boolean;
            listen: (callback: (isSignedIn: boolean) => void) => void;
            removeListener: (callback: (isSignedIn: boolean) => void) => void;
          };
          currentUser: {
            get: () => GoogleUser;
          };
          signIn: () => Promise<void>;
          signOut: () => Promise<void>;
        };
      };
    };
  }
}

class GoogleDriveService {
  async createOrGetFolder(): Promise<string> {
    try {
      const response = await window.gapi.client.drive.files.list({
        q: `name='${HABIT_TRACKER_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
      });

      if (response.result.files && response.result.files.length > 0) {
        return response.result.files[0].id;
      }

      // Create new folder if not found
      const folderMetadata: GoogleDriveFileMetadata = {
        name: HABIT_TRACKER_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      };

      const folder = await window.gapi.client.drive.files.create({
        resource: folderMetadata,
        fields: 'id',
      });

      return folder.result.id;
    } catch (error) {
      console.error('Error creating/getting folder:', error);
      throw error;
    }
  }

  async createOrGetDataFile(folderId: string): Promise<string> {
    try {
      const response = await window.gapi.client.drive.files.list({
        q: `name='${DATA_FILE_NAME}' and '${folderId}' in parents and trashed=false`,
        fields: 'files(id, name)',
      });

      if (response.result.files && response.result.files.length > 0) {
        return response.result.files[0].id;
      }

      // Create new file if not found
      const fileMetadata: GoogleDriveFileMetadata = {
        name: DATA_FILE_NAME,
        mimeType: 'application/json',
        parents: [folderId],
      };

      const file = await window.gapi.client.drive.files.create({
        resource: fileMetadata,
        fields: 'id',
      });

      return file.result.id;
    } catch (error) {
      console.error('Error creating/getting data file:', error);
      throw error;
    }
  }

  async getFileContent(fileId: string): Promise<HabitData> {
    try {
      const response = await window.gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media',
      });
      return response.result as HabitData;
    } catch (error) {
      console.error('Error getting file content:', error);
      throw error;
    }
  }

  async updateFileContent(fileId: string, content: HabitData): Promise<void> {
    try {
      await window.gapi.client.drive.files.update({
        fileId: fileId,
        media: {
          mimeType: 'application/json',
          body: JSON.stringify(content),
        },
      });
    } catch (error) {
      console.error('Error updating file content:', error);
      throw error;
    }
  }
}

export const googleDriveService = new GoogleDriveService(); 