type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: string;
  error?: Error;
}

class Logger {
  private isDevelopment = process.env['NODE_ENV'] !== 'production';
  
  private log(level: LogLevel, message: string, context?: string, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      error
    };

    const formattedMessage = this.formatMessage(entry);

    switch (level) {
      case 'debug':
        if (this.isDevelopment) console.debug(formattedMessage);
        break;
      case 'info':
        console.log(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
        console.error(formattedMessage);
        if (error?.stack) {
          console.error(error.stack);
        }
        break;
    }
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const context = entry.context ? ` [${entry.context}]` : '';
    return `${timestamp} [${entry.level.toUpperCase()}]${context} ${entry.message}`;
  }

  debug(message: string, context?: string): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: string): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: string): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: string, error?: Error): void {
    this.log('error', message, context, error);
  }
}

export const logger = new Logger();