import { loggerConfig } from '../config/logger';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
  constructor(private readonly context?: string) {}

  debug(message: string, ...args: unknown[]): void {
    if (!loggerConfig.debugEnabled) {
      return;
    }

    this.write('debug', message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    this.write('info', message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.write('warn', message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    this.write('error', message, ...args);
  }

  child(context: string): Logger {
    const label = this.context ? `${this.context}:${context}` : context;
    return new Logger(label);
  }

  private write(level: LogLevel, message: string, ...args: unknown[]): void {
    const formatted = this.format(message);

    switch (level) {
      case 'debug':
        console.debug(formatted, ...args);
        break;
      case 'info':
        console.info(formatted, ...args);
        break;
      case 'warn':
        console.warn(formatted, ...args);
        break;
      case 'error':
        console.error(formatted, ...args);
        break;
    }
  }

  private format(message: string): string {
    return this.context ? `[${this.context}] ${message}` : message;
  }
}

export const logger = new Logger();
