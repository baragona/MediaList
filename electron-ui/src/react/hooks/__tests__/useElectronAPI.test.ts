import { renderHook } from '@testing-library/react';
import { useElectronAPI } from '../useElectronAPI';

// Mock the window.electronAPI
const mockElectronAPI = {
  getLibrary: jest.fn(),
  openFile: jest.fn(),
  scanFiles: jest.fn(),
  addFile: jest.fn(),
  getConfigSchema: jest.fn(),
  saveConfig: jest.fn(),
  getFilesInPath: jest.fn(),
};

describe('useElectronAPI', () => {
  const originalElectronAPI = window.electronAPI;

  beforeEach(() => {
    window.electronAPI = mockElectronAPI;
    jest.clearAllMocks();
  });

  afterEach(() => {
    window.electronAPI = originalElectronAPI;
  });

  it('provides all API methods', () => {
    const { result } = renderHook(() => useElectronAPI());
    
    expect(result.current).toHaveProperty('getLibrary');
    expect(result.current).toHaveProperty('openFile');
    expect(result.current).toHaveProperty('scanFiles');
    expect(result.current).toHaveProperty('getConfigSchema');
    expect(result.current).toHaveProperty('saveConfig');
  });

  it('getLibrary returns data on success', async () => {
    const mockData = [
      { id: 1, path: '/test.mp4', basename: 'test.mp4', size: 1000, modified: 123456, added: 123456, fff: '' }
    ];
    mockElectronAPI.getLibrary.mockResolvedValue(mockData);

    const { result } = renderHook(() => useElectronAPI());
    const data = await result.current.getLibrary();

    expect(data).toEqual(mockData);
    expect(mockElectronAPI.getLibrary).toHaveBeenCalledTimes(1);
  });

  it('getLibrary returns empty array on error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockElectronAPI.getLibrary.mockRejectedValue(new Error('Test error'));

    const { result } = renderHook(() => useElectronAPI());
    const data = await result.current.getLibrary();

    expect(data).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to get library:', expect.any(Error));
    
    consoleErrorSpy.mockRestore();
  });

  it('openFile returns success result', async () => {
    const mockResult = { success: true };
    mockElectronAPI.openFile.mockResolvedValue(mockResult);

    const { result } = renderHook(() => useElectronAPI());
    const response = await result.current.openFile(123);

    expect(response).toEqual(mockResult);
    expect(mockElectronAPI.openFile).toHaveBeenCalledWith(123);
  });

  it('openFile returns error result on failure', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockElectronAPI.openFile.mockRejectedValue(new Error('Test error'));

    const { result } = renderHook(() => useElectronAPI());
    const response = await result.current.openFile(123);

    expect(response).toEqual({ success: false, error: 'Error: Test error' });
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    consoleErrorSpy.mockRestore();
  });

  it('scanFiles returns success result', async () => {
    const mockResult = { success: true, filesFound: 10 };
    mockElectronAPI.scanFiles.mockResolvedValue(mockResult);

    const { result } = renderHook(() => useElectronAPI());
    const response = await result.current.scanFiles();

    expect(response).toEqual(mockResult);
    expect(mockElectronAPI.scanFiles).toHaveBeenCalledTimes(1);
  });

  it('getConfigSchema returns schema string', async () => {
    const mockSchema = '{"properties": {}}';
    mockElectronAPI.getConfigSchema.mockResolvedValue(mockSchema);

    const { result } = renderHook(() => useElectronAPI());
    const schema = await result.current.getConfigSchema();

    expect(schema).toEqual(mockSchema);
    expect(mockElectronAPI.getConfigSchema).toHaveBeenCalledTimes(1);
  });

  it('saveConfig calls API with config string', async () => {
    const configString = '{"test": "value"}';
    mockElectronAPI.saveConfig.mockResolvedValue('success');

    const { result } = renderHook(() => useElectronAPI());
    const response = await result.current.saveConfig(configString);

    expect(response).toEqual('success');
    expect(mockElectronAPI.saveConfig).toHaveBeenCalledWith(configString);
  });

  it('handles missing electronAPI gracefully', () => {
    window.electronAPI = undefined as any;
    
    // Should not throw when rendering
    expect(() => {
      renderHook(() => useElectronAPI());
    }).not.toThrow();
  });
});