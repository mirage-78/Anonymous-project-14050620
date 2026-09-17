// src/utils/ApiError.js
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg, details) { return new ApiError(400, msg, details); }
  static unauthorized(msg, details) { return new ApiError(401, msg, details); }
  static forbidden(msg, details) { return new ApiError(403, msg, details); }
  static notFound(msg, details) { return new ApiError(404, msg, details); }
  static conflict(msg, details) { return new ApiError(409, msg, details); }
  static internal(msg, details) { return new ApiError(500, msg, details); }
}

module.exports = ApiError;