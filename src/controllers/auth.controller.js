// const { Result } = require('express-validator');
// const authService = require('./../services/auth.service')
// const {sendSuccess} = require('./../utils/response')

// class AuthController {
//   constructor(){
//     this.authService = authService;
//   }
//   async getRegisterPage(req,res,next){
//     try {
//       // res.status(200).json({success:true , message:'register form'});
      
//       const result = 'register form';
//       sendSuccess(res , result , 'success');
      
//     } catch (error) {
//       next(error);
//     }
//   }

//   async SendOtpToClient(req,res,next){
//     try {
//       const result = await this.authService.sendOtp(req.body);
      
//       sendSuccess(res , result , 'کد یکبار مصرف به شماره ی وارد شده ارسال شد')
//     } catch (error) {
//       next(error)
//     }
//   }

//   async getVerificationPage(req,res,next){
//     try {
//       res.status(200).json({success:true , message:'insert otp code form'});

//     } catch (error) {
//       next(error)
//     }

//   }

//   async verifyingCode(req,res,next){
//     try {
//       const result = await this.authService.verifyOtp(req.body);
//       sendSuccess(res , result , 'شماره با موفقیت احراز شد')
//     } catch (error) {
//       next(error)
//     }
//   }

// }
// module.exports = new AuthController();

 //////////////////////////////////v2

 const authService = require('./../services/auth.service');
const { sendSuccess } = require('./../utils/response');
const ApiError = require('./../utils/ApiError');
const logger = require('./../utils/logger');

class AuthController {
  constructor() {
    this.authService = authService;
  }

  // ========================================
  // صفحه ثبت‌نام (نمایشی)
  // ========================================
  async getRegisterPage(req, res, next) {
    try {
      const result = 'register form';
      sendSuccess(res, result, 'success');
    } catch (error) {
      next(error);
    }
  }

  // ========================================
  // ارسال کد یکبار مصرف
  // ========================================
  async SendOtpToClient(req, res, next) {
    try {
      const result = await this.authService.sendOtp(req.body);
      sendSuccess(res, result, 'کد یکبار مصرف به شماره‌ی وارد شده ارسال شد');
    } catch (error) {
      next(error);
    }
  }

  // ========================================
  // صفحه وارد کردن کد (نمایشی)
  // ========================================
  async getVerificationPage(req, res, next) {
    try {
      res.status(200).json({
        success: true,
        message: 'insert otp code form',
      });
    } catch (error) {
      next(error);
    }
  }

  // ========================================
  // احراز کد و ایجاد سشن
  // ========================================
  async verifyingCode(req, res, next) {
    try {
      // ۱. بررسی کد و گرفتن کاربر
      const user = await this.authService.verifyOtp(req.body);

      // ۲. بازتولید سشن (جلوگیری از Session Fixation)
      req.session.regenerate((err) => {
        if (err) {
          logger.error('Session regenerate failed', {
            phone: user.phone,
            error: err.message,
          });
          return next(new ApiError('خطا در ایجاد سشن', 500));
        }

        // ۳. ذخیره اطلاعات کاربر در سشن
        req.session.user = {
          id: user.id,
          phone: user.phone,
          name: user.name,
          role: user.role,
          loginAt: new Date().toISOString(),
        };

        // ۴. ذخیره اجباری سشن قبل از پاسخ
        req.session.save((err) => {
          if (err) {
            logger.error('Session save failed', {
              userId: user.id,
              error: err.message,
            });
            return next(new ApiError('خطا در ذخیره سشن', 500));
          }

          logger.info('User logged in', {
            userId: user.id,
            phone: user.phone,
          });

          sendSuccess(
            res,
            {
              user: {
                id: user.id,
                name: user.name,
                phone: user.phone,
                role: user.role,
              },
            },
            'شماره با موفقیت احراز شد'
          );
        });
      });
    } catch (error) {
      next(error);
    }
  }

  // ========================================
  // خروج از حساب
  // ========================================
  async logout(req, res, next) {
    try {
      const userId = req.session?.user?.id;

      req.session.destroy((err) => {
        if (err) {
          logger.error('Session destroy failed', { userId, error: err.message });
          return next(new ApiError('خطا در خروج', 500));
        }

        // پاک کردن کوکی سشن
        res.clearCookie('connect.sid');
        logger.info('User logged out', { userId });

        sendSuccess(res, null, 'با موفقیت خارج شدید');
      });
    } catch (error) {
      next(error);
    }
  }

  // ========================================
  // اطلاعات کاربر جاری
  // ========================================
  async me(req, res, next) {
    try {
      // میدل‌ور isAuthenticated این را قبلاً چک کرده
      sendSuccess(res, { user: req.session.user }, 'اطلاعات کاربر جاری');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();