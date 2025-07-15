import sqlite from "better-sqlite3";
import { DatabaseError } from "./errors";
import { logger } from "./logger";

let dbConnection: sqlite.Database | null = null;

export function connect(): sqlite.Database {
  try {
    if (!dbConnection || !dbConnection.open) {
      logger.info("Opening database connection", "Database");
      dbConnection = new sqlite("data/medialist.db", { fileMustExist: true });
      
      // Enable WAL mode for better concurrency
      dbConnection.pragma('journal_mode = WAL');
      
      // Set up connection pool simulation (reuse single connection)
      process.on('exit', () => {
        if (dbConnection?.open) {
          logger.info("Closing database connection", "Database");
          dbConnection.close();
        }
      });
    }
    return dbConnection;
  } catch (error) {
    logger.error("Failed to connect to database", "Database", error as Error);
    throw new DatabaseError("Failed to connect to database", error as Error);
  }
}

export function closeConnection(): void {
  if (dbConnection?.open) {
    dbConnection.close();
    dbConnection = null;
    logger.info("Database connection closed", "Database");
  }
}
