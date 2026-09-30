const { json } = require('express');
const express = require('express');
const router = express.Router();
// Import routes
// const userRoutes = require('./v1/userRoutes');
// const customerRoutes = require('./v1/customerRoutes');

// API version 1 routes
// router.use('/users', userRoutes);
// router.use('/customers', customerRoutes);

// Health check
router.get('/health', (req, res) => {
    res.status(200).json({
        projectName : 'Anonymous-project-14050620' ,
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: 'v1'
    });
});

// Documentation
router.get('/docs', (req, res) => {
    res.json({
        name: 'Anonymous-project-14050620 Management API',
        version: '1.0.0',
        endpoints: {
            'GET /api/v1/users': 'Get all users',
            'GET /api/v1/users/:id': 'Get user by ID',
            'POST /api/v1/users': 'Create new user',
            'PUT /api/v1/users/:id': 'Update user',
            'DELETE /api/v1/users/:id': 'Delete user',
            'GET /api/v1/users/stats': 'Get user statistics',
            'GET /api/v1/users/age-range': 'Get users by age range'
        }
    });
});
///////////////////////////////////////

const axios = require('axios');
const querystring = require('querystring');
// const express = require('express');
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

// تابع تولید کد 6 رقمی رندوم
function generateOtp() {
    return crypto.randomInt(100000 , 999999); // بین 100000 تا 999999
}

// ارسال کد
// router.post('/send-otp', async (req, res) => {
//     console.log(req.body)
//     const { phone } = req.body;
//     const code = generateOtp();

//     const data = {
//         username: "989360352927",
//         password: "112e26d2-5891-486b-932a-63bf0a167b67",
//         to: phone, 
//         from: "50004001352927",
//         code: code
//     };

//     const postData = querystring.stringify(data);

//     try {
//         const response = await axios.post(
//             'https://rest.payamak-panel.com/api/SendSMS/SendOtp',
//             postData,
//             {
//                 headers: {
//                     'Content-Type': 'application/x-www-form-urlencoded'
//                 }
//             }
//         );

//         // ذخیره کد در کش؛ TTL به‌صورت خودکار توسط lru-cache اعمال می‌شود
//         otpCache.set(phone, code);

//         res.json({ success: true, message: 'کد ارسال شد' });
//         console.log('کد ارسالی : ' , code);
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             error: error.response ? error.response.data : error.message
//         });
//     }
// });

// تأیید کد
// router.post('/verify-otp', (req, res) => {
//     const { phone, code } = req.body;

//     // اگر کد منقضی شده باشد، get مقدار undefined برمی‌گرداند
//     const storedCode = otpCache.get(phone);

//     if (storedCode === undefined) {
//         return res.json({ success: false, message: 'کد منقضی شده یا ارسال نشده است' });
//     }

//     if (String(storedCode) !== String(code)) {
//         return res.json({ success: false, message: 'کد اشتباه است' });
//     }

//     // حذف کد پس از تأیید موفق
//     otpCache.delete(phone);

//     res.json({ success: true, message: 'تایید شد' });
// });



///////////////////////////////////////

router.use('/users', require('./v1/user.routes'));
router.use('/auth', require('./v1/auth.routes'));

// router.use('/products', require('./product.routes'));
// router.use('/orders', require('./order.routes'));
// router.use('/categories', require('./category.routes'));
// router.use('/carts', require('./cart.routes'));
// router.use('/dashboard', require('./dashboard.routes'));

module.exports = router;