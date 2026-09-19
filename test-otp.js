const axios = require('axios');
const querystring = require('querystring');
const express = require('express');
const { LRUCache } = require('lru-cache');
const crypto = require('crypto');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));  // داده‌های فرم را می‌خواند

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

app.get('/chek' , async(req,res)=>{
  res.status(200).json({
    success : true,
    message : 'connected to back-end'
  })
})

// ارسال کد
app.post('/send-otp', async (req, res) => {
    console.log(req.body)
    const { phone } = req.body;
    const code = generateOtp();

    const data = {
        username: "989360352927",
        password: "112e26d2-5891-486b-932a-63bf0a167b67",
        to: phone, 
        from: "50004001352927",
        code: code
    };

    const postData = querystring.stringify(data);

    try {
        const response = await axios.post(
            'https://rest.payamak-panel.com/api/SendSMS/SendOtp',
            postData,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        // ذخیره کد در کش؛ TTL به‌صورت خودکار توسط lru-cache اعمال می‌شود
        otpCache.set(phone, code);

        res.json({ success: true, message: 'کد ارسال شد' });
        console.log('کد ارسالی : ' , code);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.response ? error.response.data : error.message
        });
    }
});


// ارسال کد
// app.post('/send-otp', async (req, res) => {
//     console.log(req.body)
//     const { phone } = req.body;
//     const code = generateOtp();

//     const data = {
//         to: phone, 
//         code: code
//     };

//     const postData = querystring.stringify(data);

//     try {
//         const response = await axios.post(
//             'https://console.melipayamak.com/api/send/otp/024540f42c09441ebe402763f02cd285',
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
app.post('/verify-otp', (req, res) => {
    const { phone, code } = req.body;

    // اگر کد منقضی شده باشد، get مقدار undefined برمی‌گرداند
    const storedCode = otpCache.get(phone);

    if (storedCode === undefined) {
        return res.json({ success: false, message: 'کد منقضی شده یا ارسال نشده است' });
    }

    if (String(storedCode) !== String(code)) {
        return res.json({ success: false, message: 'کد اشتباه است' });
    }

    // حذف کد پس از تأیید موفق
    otpCache.delete(phone);

    res.json({ success: true, message: 'تایید شد' });
});

app.listen(3000, () => console.log('Server running on port 3000'));