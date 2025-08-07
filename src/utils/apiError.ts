class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  errors?: Record<string, string>;

  constructor(
    statusCode: number,
    message: string,
    isOperational = true,
    stack = '',
    errors: Record<string, string> = {}
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
