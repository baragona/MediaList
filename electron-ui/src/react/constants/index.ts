// Grid constants
export const GRID_CONSTANTS = {
  ROW_HEIGHT: 20, // Height of each row in pixels
  OVERSCAN: 5, // Number of extra rows to render for smoother scrolling
  DEFAULT_COLUMN_WIDTHS: {
    name: 60,  // percentage
    size: 20,  // percentage
    modified: 20  // percentage
  }
} as const;

// Notification constants
export const NOTIFICATION_TIMEOUT = 5000; // Duration in milliseconds

// Config dialog constants
export const CONFIG_DIALOG_DEFAULTS = {
  width: 500,
  height: 400,
  minWidth: 400,
  minHeight: 300
} as const;

// File size units
export const FILE_SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

// Squishy text constants
export const SQUISHY_TEXT_CONSTANTS = {
  FONT_SIZE: '11px',
  FONT_FAMILY: '"Lucida Grande", "Lucida Sans Unicode", Geneva, Verdana, sans-serif',
  CACHE_SIZE_LIMIT: 500,
  MEASUREMENT_DIV_STYLE: {
    position: 'absolute',
    visibility: 'hidden',
    height: 'auto',
    width: 'auto',
    whiteSpace: 'nowrap'
  }
} as const;