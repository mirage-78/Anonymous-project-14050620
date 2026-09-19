const axios = require('axios');
const querystring = require('querystring');
const crypto = require('crypto');

// تابع تولید کد 4 رقمی رندوم
function generateOtp() {
    return crypto.randomInt(100000 , 999999); // بین 100000 تا 999999
}

async function sendOtp(phoneNumber) {

    const code = generateOtp();

    const data = {
        username: "989360352927",
        password: "112e26d2-5891-486b-932a-63bf0a167b67",
        to: phoneNumber, 
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
        console.log('✅ کد ارسال شد:', code);
        console.log('پاسخ سرور:', response.data);

        return { success: true, code: code, response: response.data };
    } catch (error) {
        console.error('❌ خطا:', error.response ? error.response.data : error.message);
        return { success: false, code: code, error: error.message };
    }
}


sendOtp('09360352927');

// const axios = require('axios');
// const querystring = require('querystring');

// async function sendOtp() {
//     const data = {
//         username: "989360352927",
//         password: "112e26d2-5891-486b-932a-63bf0a167b67",
//         to: "09360352927",
//         from: "50004001352927",
//         code: 131313
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

//         console.log(response.data);
//     } catch (error) {
//         console.error('Error:', error.response ? error.response.data : error.message);
//     }
// }

// sendOtp();