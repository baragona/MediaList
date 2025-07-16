import '@testing-library/jest-dom';

declare global {
  interface Window {
    electronAPI: {
      getLibrary: jest.Mock;
      openFile: jest.Mock;
      scanFiles: jest.Mock;
      addFile: jest.Mock;
      getConfigSchema: jest.Mock;
      saveConfig: jest.Mock;
      getFilesInPath: jest.Mock;
    };
  }
}

// Mock window.electronAPI
(globalThis as any).window = (globalThis as any).window || {};
(window as any).electronAPI = {
  getLibrary: jest.fn(),
  openFile: jest.fn(),
  scanFiles: jest.fn(),
  addFile: jest.fn(),
  getConfigSchema: jest.fn(),
  saveConfig: jest.fn(),
  getFilesInPath: jest.fn(),
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};