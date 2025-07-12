// Global type definitions for MediaList frontend

// Library item from the backend
interface LibraryItem {
  id: number;
  path: string;
  basename: string;
  size: number;
  modified: number;
  added: number;
  fff: string;
}

// Configuration schema
interface MediaListConfig {
  LibraryRoots: string[];
  openVideosWith: string;
  VideoFileExtensions: string[];
  MinMovieSize: number;
  MaxSearchDepth: number;
}

// Underscore.js - minimal type definitions for what we use
interface UnderscoreStatic {
  isEqual(a: any, b: any): boolean;
  each<T>(list: T[], iteratee: (value: T, index: number, list: T[]) => void): void;
  escape(str: string): string;
  keys(object: any): string[];
  filter<T>(list: T[], predicate: (value: T) => boolean): T[];
  min<T>(list: T[], iteratee?: (value: T) => number): T;
  max(list: number[]): number;
  countBy<T>(list: T[], iteratee: (value: T) => string): { [key: string]: number };
  flatten<T>(array: T[][]): T[];
  throttle<T extends Function>(func: T, wait: number): T;
}
declare const _: UnderscoreStatic;

// Utility functions
declare function quotemeta(str: string): string;
declare function naturalSorter(a: string, b: string): number;
declare function displayFileSize(bytes: number): string;
declare function getWordsFromString(str: string): string[];
// declare function levenshtein(a: string, b: string): number; // Defined in helpers.ts
declare function startsWith(str: string, prefix: string): boolean;
declare function closestMatchInDictionary(word: string, dict: { [key: string]: number }, maxErrors: number): string;
// declare function calcSquishyHTML(text: string, fontSize: string, width: number, classes: string[], doLogging?: number): string; // Defined in squishy.ts
declare function objectToQueryString(obj: { [key: string]: any }): string;
declare function showNotification(message: string, type?: 'info' | 'success' | 'error'): void;
declare function refreshLibrary(): Promise<void>;