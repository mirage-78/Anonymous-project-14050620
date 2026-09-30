const {rateLimit} = require('express-rate-limit');


// محدودیت مخصوص ارسال OTP: 3 درخواست در هر 10 دقیقه
const otpLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 2 دقیقه
    limit: 3, // حداکثر 1 درخواست
    standardHeaders: 'draft-7', // هدرهای استاندارد IETF
    legacyHeaders: false, // غیرفعال کردن هدرهای قدیمی
    message: {
        status: 429,
        error: 'تعداد درخواست‌های ارسال کد بیش از حد مجاز است. لطفاً بعداً تلاش کنید.'
    },
});

module.exports = {otpLimiter};