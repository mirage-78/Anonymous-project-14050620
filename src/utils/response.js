const crypto = require('crypto');
// Success response
const sendSuccess = (res, data = null, message = 'Success', meta = null, statusCode = 200) => {
    const response = {
        success: true,
        message
    };

    if (data !== null) {
        response.data = data;
    }

    if (meta) {
        response.meta = meta;
    }

    res.status(statusCode).json(response);
};

const sendLayot = (res , data = null , message = Success, meta = null, statusCode = 200)=>{
  res.render()
};

// تابع تولید کد 6 رقمی رندوم
const generateOtp = (min,max)=>{
  return crypto.randomInt(min , max);
}

module.exports = {sendSuccess , generateOtp};