const {SESSION, REDIS} = require('./src/config/constants');
const express = require('express');  // فریم‌ورک Express
const session = require('express-session');  // مدیریت نشست کاربر
const flash = require('connect-flash');  // پیام‌های یکبار مصرف
const helmet = require('helmet');  // امنیت
const cors = require('cors');  // اجازه درخواست از خارج
const compression = require('compression');  // فشرده‌سازی
const path = require('path');  // کار با مسیرها
const {rateLimit} = require('express-rate-limit');
const { RedisStore } = require('connect-redis');
// const redis = require('./src/config/redis');
const {createClient} = require('redis');
const app = express();  // اپلیکیشن Express را می‌سازیم

// ====== بخش ۱: امنیت ======
app.use(helmet());  // هدرهای امنیتی را اضافه می‌کند
app.use(cors());    // به دامنه‌های دیگر اجازه درخواست می‌دهد
app.use(compression());  // پاسخ‌ها را فشرده می‌کند (سریع‌تر)
app.set('trust proxy' , 1);

// ====== بخش ۲: موتور قالب ======
app.set('view engine', 'ejs');  // از EJS برای نمایش صفحات استفاده می‌کنیم
app.set('views', path.join(__dirname, 'views'));  // پوشه قالب‌ها

// ====== بخش ۳: دریافت داده از کاربر ======
app.use(express.json());  // داده‌های JSON را می‌خواند
app.use(express.urlencoded({ extended: true }));  // داده‌های فرم را می‌خواند

// ====== بخش ۴: سشن و فلش ======
// app.use(session({
//     secret: process.env.SESSION_SECRET, // یک رشته تصادفی و امن
//     resave: false,                     // session را دوباره ذخیره نکن اگر تغییر نکرده
//     saveUninitialized: false,          // session خالی ذخیره نکن
//     cookie: {
//         secure: process.env.NODE_ENV === 'production', // فقط در HTTPS
//         httpOnly: true,                // جلوگیری از دسترسی جاوااسکریپت سمت کلاینت
//         maxAge: 1000 * 60 * 60 * 24 * 7, // یک هفته
//         sameSite: 'strict'             // محافظت در برابر CSRF
//     }
// }));
// ساخت کلاینت مخصوص سشن
const sessionRedisClient = createClient({
  url: `redis://${ REDIS.host || 'localhost'}:${REDIS.port || 6379}`
});

sessionRedisClient.connect().catch(console.error);

app.use(session({
  store: new RedisStore({
    client: sessionRedisClient, // ← استفاده از کلاینت redis (نه ioredis)
    prefix: 'sess:',
  }),
  secret: SESSION.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 7, // 7 days
  },
}));
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