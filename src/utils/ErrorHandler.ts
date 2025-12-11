/**
 * Centralized error handling system
 * @module utils/ErrorHandler
 */

import { ErrorType, MandalaError } from '@types';
import { ERROR_MESSAGES } from '@constants/config';

/**
 * Error handler singleton class
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorListeners: Array<(error: MandalaError) => void> = [];

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Register error listener
   */
  public onError(callback: (error: MandalaError) => void): void {
    this.errorListeners.push(callback);
  }

  /**
   * Remove error listener
   */
  public offError(callback: (error: MandalaError) => void): void {
    this.errorListeners = this.errorListeners.filter(cb => cb !== callback);
  }

  /**
   * Handle error
   */
  public handle(error: MandalaError): void {
    // Log to console
    console.error(`[${error.type}] ${error.message}`, error.originalError);

    // Notify listeners
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (err) {
        console.error('Error in error listener:', err);
      }
    });
  }

  /**
   * Create and handle audio initialization error
   */
  public audioInitFailed(originalError?: Error): void {
    const error = new MandalaError(
      ErrorType.AUDIO_INIT_FAILED,
      ERROR_MESSAGES.AUDIO_INIT_FAILED,
      originalError
    );
    this.handle(error);
  }

  /**
   * Create and handle microphone access denied error
   */
  public microphoneAccessDenied(originalError?: Error): void {
    const error = new MandalaError(
      ErrorType.MICROPHONE_ACCESS_DENIED,
      ERROR_MESSAGES.MICROPHONE_ACCESS_DENIED,
      originalError
    );
    this.handle(error);
    alert(ERROR_MESSAGES.MICROPHONE_ACCESS_DENIED);
  }

  /**
   * Create and handle file load error
   */
  public fileLoadFailed(fileName: string, originalError?: Error): void {
    const error = new MandalaError(
      ErrorType.FILE_LOAD_FAILED,
      `${ERROR_MESSAGES.FILE_LOAD_FAILED}: ${fileName}`,
      originalError
    );
    this.handle(error);
  }

  /**
   * Create and handle rendering error
   */
  public renderingError(message: string, originalError?: Error): void {
    const error = new MandalaError(
      ErrorType.RENDERING_ERROR,
      `${ERROR_MESSAGES.RENDERING_ERROR}: ${message}`,
      originalError
    );
    this.handle(error);
  }

  /**
   * Create and handle invalid configuration error
   */
  public invalidConfiguration(message: string): void {
    const error = new MandalaError(
      ErrorType.INVALID_CONFIGURATION,
      `${ERROR_MESSAGES.INVALID_CONFIGURATION}: ${message}`
    );
    this.handle(error);
  }

  /**
   * Create and handle resource not found error
   */
  public resourceNotFound(resourceId: string): void {
    const error = new MandalaError(
      ErrorType.RESOURCE_NOT_FOUND,
      `${ERROR_MESSAGES.RESOURCE_NOT_FOUND}: ${resourceId}`
    );
    this.handle(error);
  }
}

/**
 * Export singleton instance
 */
export const errorHandler = ErrorHandler.getInstance();
