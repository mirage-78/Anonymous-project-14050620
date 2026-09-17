// src/middlewares/errorHandler.js
const ApiError = require('../utils/ApiError');
const { Prisma } = require('@prisma/client');
const logger = require('../utils/logger');
const { NODE_ENV } = require('../config/constants');

const errorHandler = (err, req, res, next) => {
  // اگه هدرها قبلاً ارسال شده، به express بسپار
  if (res.headersSent) {
    return next(err);
  }

  let error = err;

  // ==================== خطاهای Prisma ====================
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': // Unique constraint
        error = ApiError.conflict(
          `مقدار تکراری در فیلد: ${err.meta?.target}`
        );
        break;
      case 'P2025': // Record not found
        error = ApiError.notFound('رکورد مورد نظر یافت نشد');
        break;
      case 'P2003': // Foreign key constraint
        error = ApiError.badRequest('ارجاع نامعتبر به رکورد دیگر');
        break;
      case 'P2000': // Value too long
        error = ApiError.badRequest('مقدار ورودی بیش از حد طولانی است');
        break;
      case 'P2011': // Null constraint
        error = ApiError.badRequest(
          `فیلد اجباری خالی است: ${err.meta?.constraint}`
        );
        break;
      case 'P2014': // Required relation violation
        error = ApiError.badRequest('رابطه الزامی نقض شده است');
        break;
      default:
        error = new ApiError(500, `خطای دیتابیس: ${err.code}`);
    }
  }

  // خطای اعتبارسنجی Prisma
  if (err instanceof Prisma.PrismaClientValidationError) {
    error = ApiError.badRequest('داده‌های ورودی نامعتبر');
  }

  // خطای اتصال به دیتابیس
  if (err instanceof Prisma.PrismaClientInitializationError) {
    error = new ApiError(503, 'اتصال به دیتابیس برقرار نشد');
  }

  // خطای Rust engine / پانیک Prisma
  if (err instanceof Prisma.PrismaClientRustPanicError) {
    error = new ApiError(500, 'خطای داخلی دیتابیس');
  }

  // ==================== خطاهای JWT ====================
  if (err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('توکن نامعتبر است');
  }

  if (err.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('توکن منقضی شده است');
  }

  if (err.name === 'NotBeforeError') {
    error = ApiError.unauthorized('توکن هنوز فعال نشده است');
  }

  // ==================== خطاهای Body Parser ====================
  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    error = ApiError.badRequest('بدنه درخواست JSON نامعتبر است');
  }

  if (err.type === 'entity.too.large') {
    error = ApiError.badRequest('حجم درخواست بیش از حد مجاز است');
  }

  // ==================== خطاهای اعتبارسنجی (class-validator / express-validator) ====================
  if (err.name === 'ValidationError') {
    const details = err.errors
      ? Object.values(err.errors).map((val) => val.message)
      : [err.message];
    error = ApiError.badRequest('خطای اعتبارسنجی', details);
  }

  // خطای Multer (آپلود فایل)
  if (err.name === 'MulterError') {
    error = ApiError.badRequest(`خطای آپلود فایل: ${err.message}`);
  }

  // ==================== خطاهای شبکه/تایم‌اوت ====================
  if (err.name === 'AbortError' || err.code === 'ETIMEDOUT') {
    error = new ApiError(408, 'زمان درخواست به پایان رسید');
  }

  // خطای پیش‌فرض سرور
  if (!(error instanceof ApiError)) {
    error = new ApiError(
      error.statusCode || 500,
      error.message || 'خطای سرور'
    );
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'خطای سرور';

  // ==================== لاگ کردن خطا ====================
  const logPayload = {
    message: err.message,
    statusCode,
    path: req.originalUrl || req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
    stack: err.stack,
  };

  if (statusCode >= 500) {
    logger.error('Server Error:', logPayload);
  } else if (statusCode >= 400) {
    logger.warn('Client Error:', logPayload);
  }

  // ==================== پاسخ نهایی ====================
  const response = {
    success: false,
    message,
    ...(error.details && { details: error.details }),
    ...(NODE_ENV === 'development' && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};

module.exports = errorHandler;