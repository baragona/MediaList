import {
  AppError,
  DatabaseError,
  FileSystemError,
  ValidationError,
  NotFoundError,
  isAppError,
  handleError
} from '../src/errors';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create an AppError with all properties', () => {
      const error = new AppError('Test error', 'TEST_ERROR', 500, true);
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('AppError');
      expect(error).toBeInstanceOf(Error);
    });

    it('should default isOperational to true', () => {
      const error = new AppError('Test error', 'TEST_ERROR');
      expect(error.isOperational).toBe(true);
    });
  });

  describe('DatabaseError', () => {
    it('should create a DatabaseError', () => {
      const error = new DatabaseError('Database connection failed');
      
      expect(error.message).toBe('Database connection failed');
      expect(error.code).toBe('DATABASE_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error).toBeInstanceOf(AppError);
    });

    it('should preserve original error stack', () => {
      const originalError = new Error('Original error');
      const error = new DatabaseError('Database error', originalError);
      
      expect(error.stack).toBe(originalError.stack);
    });
  });

  describe('FileSystemError', () => {
    it('should create a FileSystemError with path', () => {
      const error = new FileSystemError('File not found', '/path/to/file');
      
      expect(error.message).toBe('File not found: /path/to/file');
      expect(error.code).toBe('FILESYSTEM_ERROR');
      expect(error.statusCode).toBe(500);
    });

    it('should preserve original error stack', () => {
      const originalError = new Error('Original error');
      const error = new FileSystemError('Read error', '/path', originalError);
      
      expect(error.stack).toBe(originalError.stack);
    });
  });

  describe('ValidationError', () => {
    it('should create a ValidationError', () => {
      const error = new ValidationError('Invalid input');
      
      expect(error.message).toBe('Invalid input');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('NotFoundError', () => {
    it('should create a NotFoundError', () => {
      const error = new NotFoundError('User');
      
      expect(error.message).toBe('User not found');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
    });
  });
});

describe('Error Utilities', () => {
  describe('isAppError', () => {
    it('should return true for AppError instances', () => {
      const error = new AppError('Test', 'TEST');
      expect(isAppError(error)).toBe(true);
    });

    it('should return true for AppError subclasses', () => {
      const error = new DatabaseError('Test');
      expect(isAppError(error)).toBe(true);
    });

    it('should return false for regular Error', () => {
      const error = new Error('Test');
      expect(isAppError(error)).toBe(false);
    });

    it('should return false for non-error objects', () => {
      expect(isAppError('string')).toBe(false);
      expect(isAppError(null)).toBe(false);
      expect(isAppError(undefined)).toBe(false);
      expect(isAppError({})).toBe(false);
    });
  });

  describe('handleError', () => {
    it('should handle AppError correctly', () => {
      const error = new ValidationError('Invalid data');
      const result = handleError(error, 'test-context');
      
      expect(result).toEqual({
        message: 'Invalid data',
        code: 'VALIDATION_ERROR',
        isOperational: true
      });
    });

    it('should handle regular Error', () => {
      const error = new Error('Regular error');
      const result = handleError(error, 'test-context');
      
      expect(result).toEqual({
        message: 'Regular error',
        code: 'UNKNOWN_ERROR',
        isOperational: false
      });
    });

    it('should handle non-error objects', () => {
      const result = handleError('string error', 'test-context');
      
      expect(result).toEqual({
        message: 'An unknown error occurred',
        code: 'UNKNOWN_ERROR',
        isOperational: false
      });
    });

    it('should handle null/undefined', () => {
      const result1 = handleError(null, 'test-context');
      const result2 = handleError(undefined, 'test-context');
      
      expect(result1).toEqual({
        message: 'An unknown error occurred',
        code: 'UNKNOWN_ERROR',
        isOperational: false
      });
      expect(result2).toEqual({
        message: 'An unknown error occurred',
        code: 'UNKNOWN_ERROR',
        isOperational: false
      });
    });
  });
});