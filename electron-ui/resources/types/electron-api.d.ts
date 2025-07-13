// Type definitions for Electron IPC API

interface ElectronAPI {
  // Database operations
  getLibrary(): Promise<LibraryItem[]>;
  openFile(fileId: number): Promise<{ success: boolean }>;
  scanFiles(): Promise<{ 
    success: boolean; 
    message?: string; 
    error?: string; 
    filesFound?: number 
  }>;
  addFile(filePath: string): Promise<{ 
    success: boolean; 
    error?: string 
  }>;
  
  // Config operations
  getConfigSchemaJSON(): Promise<string>;
  saveConfig(configJSON: string): Promise<string>;
  
  // File operations
  getFilesInPath(path: string): Promise<FileInfo[]>;
  
  // Utility functions
  getPathForFile(file: File): string;
}

interface Window {
  electronAPI: ElectronAPI;
}