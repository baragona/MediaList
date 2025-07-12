// Type definitions for custom libraries

// KosherForm
declare function kosherForm(schema: any, container: JQuery): () => any;

// JSS (JavaScript StyleSheets)
declare function jss(selector: string, styles: { [key: string]: any }): void;

// Memoize
declare const memoize: {
  (fn: Function, hasher?: Function): Function;
};