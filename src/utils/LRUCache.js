const { LRUCache } = require('lru-cache');

// کش OTP با TTL دو دقیقه
// ttl: مدت اعتبار هر آیتم (۲ دقیقه = ۱۲۰۰۰۰ میلی‌ثانیه)
// ttlAutopurge: آیتم‌های منقضی‌شده را به‌طور خودکار و دوره‌ای پاک می‌کند
// max: حداکثر تعداد OTP فعال در حافظه (برای جلوگیری از رشد بی‌رویه)
const otpCache = new LRUCache({
    max: 10000,
    ttl: 2 * 60 * 1000,
    ttlAutopurge: true,
    allowStale: false,
});


module.exports = {otpCache};