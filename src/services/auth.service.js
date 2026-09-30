const prisma = require('../config/prisma');
const redis = require('./../config/redis');
const ApiError = require('../utils/ApiError');
const bcrypt = require('bcryptjs');
const {generateOtp} = require('./../utils/response')
const querystring = require('querystring');
const axios = require('axios');
const {otpCache} = require('./../utils/LRUCache');
const logger = require('../utils/logger');
const {SMS} = require('./../config/constants');
const userRepository = require('./../repository/user.repository'); // ← تغییر
// v1

// class AuthService {
//   constructor(){

//   }
//   // async sendOtp(clientData){
//   //   try {
//   //     const { phone } = clientData;
//   //     const code = generateOtp(100000,999999);

//   //     const data = {
//   //       username: "989360352927",
//   //       password: "112e26d2-5891-486b-932a-63bf0a167b67",
//   //       to: phone, 
//   //       from: "50004001352927",
//   //       code: code
//   //     };
//   //     const postData = querystring.stringify(data);
    
//   //     const response = await axios.post(
//   //                 'https://rest.payamak-panel.com/api/SendSMS/SendOtp',
//   //                 postData,
//   //                 {
//   //                     headers: {
//   //                         'Content-Type': 'application/x-www-form-urlencoded'
//   //                     }
//   //                 }
//   //             );

//   //     // ذخیره کد در کش؛ TTL به‌صورت خودکار توسط lru-cache اعمال می‌شود
//   //       otpCache.set(phone, code);
//   //       // console.log(phone , code);
//   //   } catch (error) {
//   //       // logger.error('Error in AuthService.sendOtp:', error);
//   //       logger.error('Error in AuthService.sendOtp:', {
//   //       method: req.method,
//   //       path: req.path,
//   //       body: req.body,
//   //       error: error.message,
//   //       stack: error.stack,
//   //       });
//   //       throw new ApiError('Failed to retrieve auth', 500);
//   //   }
//   // }
// }



// v2

// class AuthService {

//     // ارسال پیامک
//     async sendOtp(clientData) {
//         try {
//             const { phone } = clientData;
  
//             const code = generateOtp(100000, 999999);
//             const data = {
//                 username: SMS.username,
//                 password: SMS.password,
//                 to: phone,
//                 from: SMS.from,
//                 code: code,
//             };
//             const postData = querystring.stringify(data);

//             const response = await axios.post(
//                 'https://rest.payamak-panel.com/api/SendSMS/SendOtp',
//                 postData,
//                 {
//                     headers: {
//                         'Content-Type': 'application/x-www-form-urlencoded',
//                     },
//                     timeout : 5000,  // 10 second
//                 }
//             );

//             // بررسی پاسخ سرویس پیامک (بسته به مستندات پنل)        
//             if (Number(response.data?.RetStatus) !== 1) {
//                 throw new Error(`SMS panel error: ${JSON.stringify(response.data ?? {})}`);
//             }

//             otpCache.set(phone, code);
//             otpCache.set(`last:${phone}`, Date.now());  // ✅ ثبت زمان ارسال
//         } catch (error) {
          
//             // ✅ خطای rate limit را دست‌نخورده رد کن
//             if (error instanceof ApiError && error.statusCode === 429) {
//                 throw error;
//             }
//             logger.error('Error in AuthService.sendOtp:', {
//                 phone: clientData?.phone,
//                 error: error.message,
//                 stack: error.stack,
//             });
//             throw new ApiError('Failed to send OTP', 500);        
//           }
//     }

//     // احراز پیامک
//     async verifyOtp(clientData) {
//         const { phone, code } = clientData;

//         if (!phone || !code) {
//             throw new ApiError('شماره و کد الزامی هستند', 400);
//         }

//         // محدودیت تلاش
//         const attempts = otpCache.get(`attempts:${phone}`) || 0;
//         if (attempts >= 5) {
//             otpCache.delete(phone);
//             throw new ApiError('تعداد تلاش‌های شما بیش از حد مجاز است. کد جدید دریافت کنید.', 429);
//         }

//         let storedCode;
//         try {
//             storedCode = otpCache.get(phone);
//         } catch (err) {
//             logger.error('Cache error in verifyOtp', { phone, error: err.message });
//             throw new ApiError('خطای داخلی سرور', 500);
//         }

//         if (storedCode === undefined) {
//             throw new ApiError('کد منقضی شده یا ارسال نشده است', 410);
//         }

//         if (String(storedCode) !== String(code).trim()) {
//             otpCache.set(`attempts:${phone}`, attempts + 1);
//             logger.warn('OTP mismatch', { phone, attempts: attempts + 1 });
//             throw new ApiError('کد اشتباه است', 400);
//         }

//         // موفق
//         otpCache.delete(phone);
//         otpCache.delete(`attempts:${phone}`);

//         // TODO: ایجاد/یافتن کاربر و صدور session
//         // const user = await userService.findOrCreateByPhone(phone);
//         // 
//         // 
//     }
// }

// module.exports = new AuthService();


////////////    v3




class AuthService {
  constructor() {
    // پیشوند کلیدها
    this.OTP_PREFIX = 'otp:';
    this.ATTEMPTS_PREFIX = 'otp:attempts:';
    this.COOLDOWN_PREFIX = 'otp:cooldown:';

    // تنظیمات
    this.OTP_TTL_SECONDS = 120;        // کد ۲ دقیقه اعتبار دارد
    this.ATTEMPTS_TTL_SECONDS = 600;   // شمارنده تلاش‌ها ۱۰ دقیقه
    this.COOLDOWN_TTL_SECONDS = 120;   // هر ۲ دقیقه یک بار
    this.MAX_ATTEMPTS = 5;
  }

  // ========================================
  // ارسال پیامک
  // ========================================
  async sendOtp(clientData) {
    const { phone } = clientData;

    if (!phone) {
      throw new ApiError(400,'شماره موبایل الزامی است');
    }

    const cooldownKey = `${this.COOLDOWN_PREFIX}${phone}`;
    const otpKey = `${this.OTP_PREFIX}${phone}`;
    const attemptsKey = `${this.ATTEMPTS_PREFIX}${phone}`;

    // ۱. بررسی cooldown
    const cooldown = await redis.get(cooldownKey);
    if (cooldown) {
      const ttl = await redis.ttl(cooldownKey);
      throw new ApiError(429,
        `لطفاً ${ttl} ثانیه دیگر تلاش کنید`,
        
      );
    }

    // ۲. تولید کد
    const code = generateOtp(100000, 999999);

    // ۳. ارسال پیامک
    try {
      const data = {
        username: SMS.username,
        password: SMS.password,
        to: phone,
        from: SMS.from,
        code: code,
      };
      const postData = querystring.stringify(data);

      const response = await axios.post(
        'https://rest.payamak-panel.com/api/SendSMS/SendOtp',
        postData,
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 5000,
        }
      );

      // بررسی پاسخ سرویس پیامک
      if (Number(response.data?.RetStatus) !== 1) {
        throw new Error(`SMS panel error: ${JSON.stringify(response.data ?? {})}`);
      }

      // ۴. ذخیره کد در Redis با TTL
      await redis.setex(otpKey, this.OTP_TTL_SECONDS, code);

      // ۵. پاک کردن شمارنده تلاش‌ها (کاربر کد جدید گرفت)
      await redis.del(attemptsKey);

      // ۶. تنظیم cooldown
      await redis.setex(cooldownKey, this.COOLDOWN_TTL_SECONDS, '1');

      logger.info('OTP sent', { phone });

      return { message: 'کد تأیید ارسال شد' };
    } catch (error) {
      // خطای rate limit را دست‌نخورده رد کن
      if (error instanceof ApiError && error.statusCode === 429) {
        throw error;
      }

      logger.error('Error in AuthService.sendOtp:', {
        phone,
        error: error.message,
        stack: error.stack,
      });
      throw new ApiError(500,'Failed to send OTP');
    }
  }

  // ========================================
  // احراز پیامک
  // ========================================
  async verifyOtp(clientData) {
    const { phone, code } = clientData;

    if (!phone || !code) {
      throw new ApiError(400,'شماره و کد الزامی هستند');
    }

    const otpKey = `${this.OTP_PREFIX}${phone}`;
    const attemptsKey = `${this.ATTEMPTS_PREFIX}${phone}`;

    // ۱. بررسی محدودیت تلاش
    const attempts = Number(await redis.get(attemptsKey)) || 0;
    if (attempts >= this.MAX_ATTEMPTS) {
      await redis.del(otpKey);
      await redis.del(attemptsKey);
      logger.warn('OTP max attempts exceeded', { phone });
      throw new ApiError(429,
        'تعداد تلاش‌های شما بیش از حد مجاز است. کد جدید دریافت کنید.'
      );
    }

    // ۲. خواندن کد ذخیره‌شده
    let storedCode;
    try {
      storedCode = await redis.get(otpKey);
    } catch (err) {
      logger.error('Cache error in verifyOtp', { phone, error: err.message });
      throw new ApiError(500,'خطای داخلی سرور');
    }

    if (storedCode === null || storedCode === undefined) {
      throw new ApiError(410,'کد منقضی شده یا ارسال نشده است');
    }

    // ۳. مقایسه کد
    if (String(storedCode).trim() !== String(code).trim()) {
      // افزایش اتمی شمارنده تلاش‌ها
      const newAttempts = await redis.incr(attemptsKey);
      if (newAttempts === 1) {
        await redis.expire(attemptsKey, this.ATTEMPTS_TTL_SECONDS);
      }

      logger.warn('OTP mismatch', { phone, attempts: newAttempts });

      if (newAttempts >= this.MAX_ATTEMPTS) {
        await redis.del(otpKey);
        throw new ApiError(429,
          'تعداد تلاش‌های شما بیش از حد مجاز است. کد جدید دریافت کنید.',
          
        );
      }

      throw new ApiError(400,
        `کد اشتباه است. ${this.MAX_ATTEMPTS - newAttempts} تلاش باقی‌مانده`
        
      );
    }

    // ۴. موفق — پاک کردن کلیدها
    await redis.del(otpKey);
    await redis.del(attemptsKey);
    await redis.del(`${this.COOLDOWN_PREFIX}${phone}`);

    // ۵. یافتن یا ساختن کاربر با Prisma
    const user = await userRepository.findOrCreateUser(phone);

    logger.info('OTP verified successfully', { phone, userId: user.id });

    return user;
  }

  // ========================================
  // یافتن یا ساختن کاربر
  // ========================================
//   async findOrCreateUser(phone) {
//     try {
//       const user = await prisma.user.upsert({
//         where: { phone },
//         update: {
//           lastLoginAt: new Date(),
//         },
//         create: {
//           phone,
//           name: `کاربر ${phone.slice(-4)}`, // نام موقت
//           role: 'CUSTOMER',
//           isActive: true,
//           isVerified: true,
//           lastLoginAt: new Date(),
//         },
//         select: {
//           id: true,
//           phone: true,
//           name: true,
//           role: true,
//           isActive: true,
//         },
//       });

//       if (!user.isActive) {
//         throw new ApiError('حساب کاربری شما غیرفعال است', 403);
//       }

//       return user;
//     } catch (err) {
//       if (err instanceof ApiError) throw err;

//       logger.error('Database error in findOrCreateUser', {
//         phone,
//         error: err.message,
//         code: err.code,
//       });

//       // اگر همزمان دو درخواست کاربر ساختند
//       if (err.code === 'P2002') {
//         return prisma.user.findUnique({
//           where: { phone },
//           select: {
//             id: true,
//             phone: true,
//             name: true,
//             role: true,
//             isActive: true,
//           },
//         });
//       }

//       throw new ApiError('خطا در ایجاد کاربر', 500);
//     }
//   }
}

module.exports = new AuthService();