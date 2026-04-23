type AppErrorParams = {
  message: string;
  statusCode?: number;
  code?: string;
  details?: unknown;
  isOperational?: boolean;
};

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor({
    message,
    statusCode = 500,
    code = "INTERNAL_ERROR",
    details,
    isOperational = true,
  }: AppErrorParams) {
    super(message);

    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace?.(this, this.constructor);
  }
}