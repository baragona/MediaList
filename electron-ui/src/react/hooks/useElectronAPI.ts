import { useCallback } from 'react';
import type { LibraryItem, ScanResult, OpenFileResult, AddFileResult } from '../types/electron';

export function useElectronAPI() {
  const getLibrary = useCallback(async (): Promise<LibraryItem[]> => {
    try {
      return await window.electronAPI.getLibrary();
    } catch (error) {
      console.error('Failed to get library:', error);
      return [];
    }
  }, []);

  const openFile = useCallback(async (fileId: number): Promise<OpenFileResult> => {
    try {
      return await window.electronAPI.openFile(fileId);
    } catch (error) {
      console.error('Failed to open file:', error);
      return { success: false, error: String(error) };
    }
  }, []);

  const scanFiles = useCallback(async (): Promise<ScanResult> => {
    try {
      return await window.electronAPI.scanFiles();
    } catch (error) {
      console.error('Failed to scan files:', error);
      return { success: false, error: String(error) };
    }
  }, []);

  const addFile = useCallback(async (filePath: string): Promise<AddFileResult> => {
    try {
      return await window.electronAPI.addFile(filePath);
    } catch (error) {
      console.error('Failed to add file:', error);
      return { success: false, error: String(error) };
    }
  }, []);

  const getConfigSchema = useCallback(async (): Promise<string> => {
    try {
      return await window.electronAPI.getConfigSchema();
    } catch (error) {
      console.error('Failed to get config schema:', error);
      return '{}';
    }
  }, []);

  const saveConfig = useCallback(async (configJSON: string): Promise<string> => {
    try {
      return await window.electronAPI.saveConfig(configJSON);
    } catch (error) {
      console.error('Failed to save config:', error);
      return 'error';
    }
  }, []);

  return {
    getLibrary,
    openFile,
    scanFiles,
    addFile,
    getConfigSchema,
    saveConfig,
  };
}