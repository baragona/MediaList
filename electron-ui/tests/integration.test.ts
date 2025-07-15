describe('Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Application Structure', () => {
    it('should have all required modules', () => {
      expect(() => require('../src/logger')).not.toThrow();
      expect(() => require('../src/errors')).not.toThrow();
      expect(() => require('../src/ConfigLoader')).not.toThrow();
      expect(() => require('../src/dbaccess')).not.toThrow();
      expect(() => require('../src/async-filescanner')).not.toThrow();
    });

    it('should export expected functions from modules', () => {
      const { logger } = require('../src/logger');
      expect(logger.info).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.debug).toBeDefined();

      const errors = require('../src/errors');
      expect(errors.AppError).toBeDefined();
      expect(errors.DatabaseError).toBeDefined();
      expect(errors.FileSystemError).toBeDefined();
      expect(errors.handleError).toBeDefined();

      const config = require('../src/ConfigLoader');
      expect(config.getConfig).toBeDefined();
      expect(config.saveConfig).toBeDefined();
      expect(config.getConfigSchemaJSON).toBeDefined();
    });
  });

  describe('Error Handling Integration', () => {
    it('should properly create and handle custom errors', () => {
      const { DatabaseError, handleError } = require('../src/errors');
      
      const dbError = new DatabaseError('Connection failed');
      const handled = handleError(dbError, 'test');
      
      expect(handled.code).toBe('DATABASE_ERROR');
      expect(handled.message).toBe('Connection failed');
      expect(handled.isOperational).toBe(true);
    });
  });

  describe('Logger Integration', () => {
    it('should log messages without throwing', () => {
      const { logger } = require('../src/logger');
      
      expect(() => logger.info('Test info')).not.toThrow();
      expect(() => logger.warn('Test warning')).not.toThrow();
      expect(() => logger.error('Test error')).not.toThrow();
      expect(() => logger.debug('Test debug')).not.toThrow();
    });
  });
});