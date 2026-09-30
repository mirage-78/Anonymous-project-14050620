// تابع تولید کد 6 رقمی رندوم
const {generateOtp} = require('./src/utils/response');

const code = generateOtp(100000 , 999999);

console.log(code);