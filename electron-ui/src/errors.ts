export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(message, 'DATABASE_ERROR', 500);
    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}

export class FileSystemError extends AppError {
  constructor(message: string, path: string, originalError?: Error) {
    super(`${message}: ${path}`, 'FILESYSTEM_ERROR', 500);
    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function handleError(error: unknown, _context: string): {
  message: string;
  code: string;
  isOperational: boolean;
} {
  if (isAppError(error)) {
    return {
      message: error.message,
      code: error.code,
      isOperational: error.isOperational
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'UNKNOWN_ERROR',
      isOperational: false
    };
  }

  return {
    message: 'An unknown error occurred',
    code: 'UNKNOWN_ERROR',
    isOperational: false
  };
}