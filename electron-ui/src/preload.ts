import { contextBridge, ipcRenderer, webUtils } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  getLibrary: () => ipcRenderer.invoke('get-library'),
  openFile: (fileId: number) => ipcRenderer.invoke('open-file', fileId),
  scanFiles: () => ipcRenderer.invoke('scan-files'),
  addFile: (filePath: string) => ipcRenderer.invoke('add-file', filePath),
  
  // Config operations
  getConfigSchemaJSON: () => ipcRenderer.invoke('get-config-schema'),
  saveConfig: (configJSON: string) => ipcRenderer.invoke('save-config', configJSON),
  
  // File operations
  getFilesInPath: (path: string) => ipcRenderer.invoke('get-files-in-path', path),
  
  // Utility functions for file handling
  getPathForFile: (file: File) => webUtils.getPathForFile(file)
});