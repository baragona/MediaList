import sqlite from 'better-sqlite3';
import { connect, closeConnection } from '../src/dbaccess';
import { DatabaseError } from '../src/errors';

jest.mock('better-sqlite3');
jest.mock('../src/logger');

describe('Database Access', () => {
  let mockDatabase: any;
  let mockSqlite: jest.MockedClass<typeof sqlite>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockDatabase = {
      open: true,
      close: jest.fn(),
      pragma: jest.fn()
    };
    
    mockSqlite = sqlite as jest.MockedClass<typeof sqlite>;
    mockSqlite.mockImplementation(() => mockDatabase);
  });

  describe('connect', () => {
    it('should create a new database connection', () => {
      const db = connect();
      
      expect(mockSqlite).toHaveBeenCalledWith('data/medialist.db', { fileMustExist: true });
      expect(mockDatabase.pragma).toHaveBeenCalledWith('journal_mode = WAL');
      expect(db).toBe(mockDatabase);
    });

    it('should reuse existing connection', () => {
      const db1 = connect();
      const db2 = connect();
      
      expect(mockSqlite).toHaveBeenCalledTimes(1);
      expect(db1).toBe(db2);
    });

    it('should create new connection if previous was closed', () => {
      connect(); // First connection
      mockDatabase.open = false;
      
      const newMockDatabase = {
        open: true,
        close: jest.fn(),
        pragma: jest.fn()
      };
      mockSqlite.mockImplementation(() => newMockDatabase as any);
      
      const db2 = connect();
      
      expect(mockSqlite).toHaveBeenCalledTimes(2);
      expect(db2).toBe(newMockDatabase);
    });

    it('should throw DatabaseError on connection failure', () => {
      mockSqlite.mockImplementation(() => {
        throw new Error('Cannot open database');
      });
      
      expect(() => connect()).toThrow(DatabaseError);
      expect(() => connect()).toThrow('Failed to connect to database');
    });

    it('should set up process exit handler', () => {
      const processOnSpy = jest.spyOn(process, 'on');
      
      connect();
      
      expect(processOnSpy).toHaveBeenCalledWith('exit', expect.any(Function));
      
      // Test the exit handler
      const exitHandler = processOnSpy.mock.calls[0]?.[1] as Function;
      expect(exitHandler).toBeDefined();
      exitHandler();
      
      expect(mockDatabase.close).toHaveBeenCalled();
    });
  });

  describe('closeConnection', () => {
    it('should close existing connection', () => {
      connect();
      closeConnection();
      
      expect(mockDatabase.close).toHaveBeenCalled();
    });

    it('should handle closing when no connection exists', () => {
      expect(() => closeConnection()).not.toThrow();
    });

    it('should handle closing already closed connection', () => {
      connect();
      mockDatabase.open = false;
      
      expect(() => closeConnection()).not.toThrow();
      expect(mockDatabase.close).not.toHaveBeenCalled();
    });
  });
});