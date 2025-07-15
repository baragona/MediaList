export interface LibraryItem {
  id: number;
  path: string;
  basename: string;
  size: number;
  modified: number;
  added: number;
  fff: string;
}

export interface ScanResult {
  success: boolean;
  message?: string;
  error?: string;
  filesFound?: number;
  totalProcessed?: number;
  errors?: string[];
}

export interface OpenFileResult {
  success: boolean;
  error?: string;
}

export interface AddFileResult {
  success: boolean;
  error?: string;
}

export interface FileInfo {
  name: string;
  type: 'file' | 'dir' | 'app';
}

export interface ConfigSchema {
  [key: string]: {
    description: string;
    type: string;
    default: any;
    items?: { type: string };
    icon?: string;
    title?: string;
  };
}

export interface ElectronAPI {
  getLibrary: () => Promise<LibraryItem[]>;
  openFile: (fileId: number) => Promise<OpenFileResult>;
  scanFiles: () => Promise<ScanResult>;
  addFile: (filePath: string) => Promise<AddFileResult>;
  getConfigSchema: () => Promise<string>;
  saveConfig: (configJSON: string) => Promise<string>;
  getFilesInPath: (path: string) => Promise<FileInfo[]>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}