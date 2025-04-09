import { googleDriveService } from '../src/services/googleDriveService';

// Mock fetch
global.fetch = jest.fn();

describe('GoogleDriveService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set access token before tests
    googleDriveService.setAccessToken('test-token');
    
    // Mock successful fetch response
    (global.fetch as jest.Mock).mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    );
  });
  
  afterEach(() => {
    jest.resetAllMocks();
  });
  
  test('setAccessToken sets the token correctly', () => {
    // Use TypeScript type assertion to access private property for testing
    const service = googleDriveService as any;
    
    googleDriveService.setAccessToken('new-test-token');
    
    expect(service.accessToken).toBe('new-test-token');
  });
  
  test('createOrGetFolder calls the correct API endpoint', async () => {
    // Mock response for folder search
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ files: [] }),
      })
    );
    
    // Mock response for folder creation
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 'new-folder-id' }),
      })
    );
    
    const folderId = await googleDriveService.createOrGetFolder();
    
    // Check that it made the correct API calls
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenNthCalledWith(
      1, 
      expect.stringContaining('https://www.googleapis.com/drive/v3/files'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token'
        })
      })
    );
    expect(folderId).toBe('new-folder-id');
  });
  
  test('createOrGetFolder returns existing folder ID if found', async () => {
    // Mock response for folder search with existing folder
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          files: [{ id: 'existing-folder-id', name: 'HabitTracker' }] 
        }),
      })
    );
    
    const folderId = await googleDriveService.createOrGetFolder();
    
    // Should only call search, not create
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(folderId).toBe('existing-folder-id');
  });
  
  test('createOrGetDataFile calls correct API endpoints', async () => {
    // Mock response for file search
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ files: [] }),
      })
    );
    
    // Mock response for file creation
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 'new-file-id' }),
      })
    );
    
    // Mock response for file update (initialization)
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    );
    
    const fileId = await googleDriveService.createOrGetDataFile('test-folder-id');
    
    // Check that it made the correct API calls
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(fileId).toBe('new-file-id');
  });
  
  test('getFileContent retrieves file content correctly', async () => {
    const testContent = { dailyTracker: [], monthlyTracker: [], customColumns: [] };
    
    // Mock response for file content
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(testContent),
      })
    );
    
    const content = await googleDriveService.getFileContent('test-file-id');
    
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(content).toEqual(testContent);
  });
  
  test('updateFileContent updates file content correctly', async () => {
    const testData = { 
      dailyTracker: [{ id: 1, date: '2023-01-01' }], 
      monthlyTracker: [], 
      customColumns: ['Test Column'] 
    };
    
    await googleDriveService.updateFileContent('test-file-id', testData);
    
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://www.googleapis.com/upload/drive/v3/files/test-file-id'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify(testData)
      })
    );
  });
  
  test('throws error when API request fails', async () => {
    // Mock failed API response
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ error: { message: 'Invalid Credentials' } }),
      })
    );
    
    await expect(googleDriveService.createOrGetFolder()).rejects.toThrow();
  });
  
  test('throws error when no access token is available', async () => {
    // Clear the access token
    googleDriveService.setAccessToken('');
    
    await expect(googleDriveService.createOrGetFolder()).rejects.toThrow('No access token available');
  });
}); 