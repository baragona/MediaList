import { FileScanner } from '../src/async-filescanner';
import fs from 'fs/promises';
import { EventEmitter } from 'events';

jest.mock('fs/promises');
jest.mock('../src/dbaccess');
jest.mock('../src/ConfigLoader');
jest.mock('../src/logger');

describe('FileScanner', () => {
  let scanner: FileScanner;
  let mockFs: jest.Mocked<typeof fs>;

  beforeEach(() => {
    scanner = new FileScanner();
    mockFs = fs as jest.Mocked<typeof fs>;
    jest.clearAllMocks();
    
    // Mock config
    const { getConfig } = require('../src/ConfigLoader');
    getConfig.mockReturnValue({
      LibraryRoots: ['/test/media'],
      VideoFileExtensions: ['mp4', 'avi', 'mkv'],
      MinMovieSize: 1000000,
      MaxSearchDepth: 3
    });
  });

  describe('constructor', () => {
    it('should be an EventEmitter', () => {
      expect(scanner).toBeInstanceOf(EventEmitter);
    });
  });

  describe('getProgress', () => {
    it('should return initial progress state', () => {
      const progress = scanner.getProgress();
      
      expect(progress).toEqual({
        totalFiles: 0,
        processedFiles: 0,
        foundFiles: 0,
        currentFile: '',
        errors: []
      });
    });

    it('should return a copy of progress', () => {
      const progress1 = scanner.getProgress();
      const progress2 = scanner.getProgress();
      
      expect(progress1).not.toBe(progress2);
      expect(progress1).toEqual(progress2);
    });
  });

  describe('scanLibraryRoots', () => {
    it('should handle inaccessible roots', async () => {
      mockFs.access.mockRejectedValue(new Error('Access denied'));
      
      const progress = await scanner.scanLibraryRoots();
      
      expect(progress.errors).toHaveLength(1);
      expect(progress.errors[0]).toContain('Cannot access: /test/media');
    });

    it('should scan accessible directories', async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue(['file1.mp4', 'file2.avi'] as any);
      mockFs.lstat.mockResolvedValue({
        isSymbolicLink: () => false,
        isDirectory: () => false,
        isFile: () => true,
        size: 5000000,
        mtime: new Date()
      } as any);
      mockFs.realpath.mockImplementation((path) => Promise.resolve(path as string));
      
      const completePromise = new Promise<any>(resolve => {
        scanner.once('complete', resolve);
      });
      
      await scanner.scanLibraryRoots();
      const result = await completePromise;
      
      expect(result.processedFiles).toBeGreaterThan(0);
    });

    it('should emit progress events', async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue(Array(20).fill('file.mp4') as any);
      mockFs.lstat.mockResolvedValue({
        isSymbolicLink: () => false,
        isDirectory: () => false,
        isFile: () => true,
        size: 5000000,
        mtime: new Date()
      } as any);
      
      const progressEvents: any[] = [];
      scanner.on('progress', (progress) => {
        progressEvents.push(progress);
      });
      
      await scanner.scanLibraryRoots();
      
      expect(progressEvents.length).toBeGreaterThan(0);
    });

    it('should skip hidden files', async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue(['.hidden.mp4', 'visible.mp4'] as any);
      mockFs.lstat.mockResolvedValue({
        isSymbolicLink: () => false,
        isDirectory: () => false,
        isFile: () => true,
        size: 5000000,
        mtime: new Date()
      } as any);
      mockFs.realpath.mockImplementation((path) => Promise.resolve(path as string));
      
      await scanner.scanLibraryRoots();
      const progress = scanner.getProgress();
      
      expect(progress.processedFiles).toBe(1); // Only visible.mp4
    });

    it('should skip symbolic links', async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue(['symlink.mp4'] as any);
      mockFs.lstat.mockResolvedValue({
        isSymbolicLink: () => true,
        isDirectory: () => false,
        isFile: () => false
      } as any);
      
      await scanner.scanLibraryRoots();
      const progress = scanner.getProgress();
      
      expect(progress.foundFiles).toBe(0);
    });

    it('should respect minimum file size', async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue(['small.mp4', 'large.mp4'] as any);
      mockFs.lstat.mockImplementation(async (path) => ({
        isSymbolicLink: () => false,
        isDirectory: () => false,
        isFile: () => true,
        size: path.toString().includes('small') ? 100 : 5000000,
        mtime: new Date()
      } as any));
      
      await scanner.scanLibraryRoots();
      const progress = scanner.getProgress();
      
      expect(progress.processedFiles).toBe(2);
      expect(progress.foundFiles).toBeLessThan(2); // Only large.mp4 should be added
    });
  });

  describe('database operations', () => {
    it('should drop library table', async () => {
      const { connect } = require('../src/dbaccess');
      const mockDb = {
        prepare: jest.fn().mockReturnValue({
          run: jest.fn()
        })
      };
      connect.mockReturnValue(mockDb);
      
      await scanner.dropLibrary();
      
      expect(mockDb.prepare).toHaveBeenCalledWith('DROP TABLE IF EXISTS library');
    });

    it('should create library table with indexes', async () => {
      const { connect } = require('../src/dbaccess');
      const mockRun = jest.fn();
      const mockDb = {
        prepare: jest.fn().mockReturnValue({
          run: mockRun
        })
      };
      connect.mockReturnValue(mockDb);
      
      await scanner.createLibrary();
      
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS library'));
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('CREATE UNIQUE INDEX IF NOT EXISTS idx_path'));
      expect(mockRun).toHaveBeenCalledTimes(6); // Table + 5 indexes
    });
  });
});