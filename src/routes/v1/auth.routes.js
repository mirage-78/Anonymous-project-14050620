// src/routes/user.routes.js
const express = require('express');
const authController = require('../../controllers/auth.controller');
const rateLimiter  = require('./../../middlewares/rateLimiter');
const router = express.Router();
const {isAuthenticated} = require('./../../middlewares/auth')


router.get('/register', authController.getRegisterPage.bind(authController));
router.post('/send-otp', rateLimiter.otpLimiter , authController.SendOtpToClient.bind(authController));
router.get('/otp-page', authController.getVerificationPage.bind(authController));
// router.get('/otp-timer', authController.method.bind(authController)); فاقد کاربرد
// router.post('/resend-otp', authController.method.bind(authController)); فاقد کاربرد
router.post('/verify-otp', authController.verifyingCode.bind(authController));
// router.get('/otp-attempts', authController.method.bind(authController));
router.post('/logout', authController.logout.bind(authController));
// router.get('/me', authController.me.bind(authController));
router.get('/me', isAuthenticated, authController.me.bind(authController));

module.exports = router;

// GET  /register                          → نمایش فرم
// POST /auth/send-otp                     → ارسال کد
// GET  /auth/otp-page                     → نمایش صفحه کد
// GET  /auth/otp-timer                    → تایمر
// POST /auth/resend-otp                   → ارسال مجدد
// POST /auth/verify-otp                   → تایید کد (خطا/موفق)
// GET  /auth/otp-attempts                 → تعداد تلاش
// POST /auth/register                     → ثبت‌نام نهایی
// POST /auth/token                        → گرفتن توکن
// GET  /user/profile                      → صفحه پروفایل
// PUT  /user/profile                      → تکمیل اطلاعات