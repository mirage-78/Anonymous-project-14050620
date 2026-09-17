const express = require('express');  // فریم‌ورک Express
const session = require('express-session');  // مدیریت نشست کاربر
const flash = require('connect-flash');  // پیام‌های یکبار مصرف
const helmet = require('helmet');  // امنیت
const cors = require('cors');  // اجازه درخواست از خارج
const compression = require('compression');  // فشرده‌سازی
const path = require('path');  // کار با مسیرها

const app = express();  // اپلیکیشن Express را می‌سازیم

// ====== بخش ۱: امنیت ======
app.use(helmet());  // هدرهای امنیتی را اضافه می‌کند
app.use(cors());    // به دامنه‌های دیگر اجازه درخواست می‌دهد
app.use(compression());  // پاسخ‌ها را فشرده می‌کند (سریع‌تر)

// ====== بخش ۲: موتور قالب ======
app.set('view engine', 'ejs');  // از EJS برای نمایش صفحات استفاده می‌کنیم
app.set('views', path.join(__dirname, 'views'));  // پوشه قالب‌ها

// ====== بخش ۳: دریافت داده از کاربر ======
app.use(express.json());  // داده‌های JSON را می‌خواند
app.use(express.urlencoded({ extended: true }));  // داده‌های فرم را می‌خواند

// ====== بخش ۴: سشن و فلش ======
// app.use(session({
//     secret: process.env.SESSION_SECRET,  // کلید رمزگذاری
//     resave: false,  // دوباره ذخیره نکن
//     saveUninitialized: true  // سشن خالی را ذخیره کن
// }));
app.use(flash());  // فعال کردن پیام‌های یکبار مصرف

// ====== بخش ۵: مسیرها ======
const routes = require('./src/routes')
app.use('', routes);  // همه مسیرها با / شروع می‌شوند

// ====== بخش ۶: خطاها ======
const errorHandler = require('./src/middlewares/errorHandler');
const ApiError = require('./src/utils/ApiError');
// 404
app.use((req, res, next) => {
  next(ApiError.notFound(`مسیر ${req.originalUrl} یافت نشد`));
});
app.use(errorHandler);  // خطاها را مدیریت می‌کند

module.exports = app;  // اپلیکیشن را برای استفاده در server.js صادر می‌کنیم