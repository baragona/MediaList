import sqlite from "better-sqlite3";

export function connect() {
  return new sqlite("python_server/medialist.db", { fileMustExist: true });
}

export function dict_from_row(row: { [x: string]: any }) {
  return Object.keys(row).reduce((acc, key) => {
    acc[key] = row[key];
    return acc;
  }, {} as { [x: string]: any });
}
