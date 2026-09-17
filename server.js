// const app = require('./app');  // اپلیکیشن Express را از فایل app.js می‌گیریم

// // سرور را روی پورت مشخص شده راه‌اندازی می‌کنیم
// const server = app.listen(PORT, () => {
//     logger.info(`🚀 Server running on port ${PORT}`);  // پیام موفقیت
// });


// // تابع خاموش کردن سرور (وقتی برنامه بسته می‌شود)
// const shutdown = async () => {
//     logger.info('🛑 Received shutdown signal');
//     server.close(() => {
//         logger.info('👋 Server closed gracefully');
//         process.exit(0);
//     });
// };

// // این دو خط برای خاموش کردن درست سرور هستند
// process.on('SIGTERM', shutdown);  // وقتی برنامه بسته می‌شود
// process.on('SIGINT', shutdown);   // وقتی Ctrl+C می‌زنیم

// // اینجا خطاهای غیرمنتظره را مدیریت می‌کنیم
// process.on('uncaughtException', (error) => {
//     logger.error('💥 Uncaught Exception:', error);
//     process.exit(1);
// });

// server.js

const app = require('./app');
const prisma = require('./src/config/prisma');
const { PORT } = require('./src/config/constants');  // پورت را از تنظیمات می‌خوانیم
const logger = require('./src/utils/logger');  // ابزار لاگ‌نویسی

async function start() {
  try {
    // تست اتصال به دیتابیس
    await prisma.$connect();
    logger.info('✅ connect to database successfull');

    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
    });

    // خاموشی تمیز
    const shutdown = async () => {
      logger.info('🛑 Received shutdown signal');
      server.close(async () => {
        await prisma.$disconnect();
        logger.info('👋 Server closed gracefully');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    logger.error('💥 Uncaught Exception:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

start();