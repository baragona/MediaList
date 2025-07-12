import sqlite from "better-sqlite3";

export function connect() {
  return new sqlite("python_server/medialist.db", { fileMustExist: true });
}
