// send-otp-with axios

const axios = require('axios');

async function sendOtp() {
    const data = {
        to: '09360352927'
    };

    try {
        const response = await axios.post(
            'https://console.melipayamak.com/api/send/otp/024540f42c09441ebe402763f02cd285',
            data,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('statusCode:', response.status);
        console.log('data:', response.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

sendOtp();

// send-otp



// const https = require('https');

// const data = JSON.stringify({
//     'to': '09360352927'
// });

// const options = {
//     hostname: 'console.melipayamak.com',
//     port: 443,
//     path: '/api/send/otp/024540f42c09441ebe402763f02cd285',
//     method: 'POST',
//     headers: {
//         'Content-Type': 'application/json',
//         'Content-Length': data.length
//     }
// };

// const req = https.request(options, res => {
//     console.log('statusCode: ' + res.statusCode);

//     res.on('data', d => {
//         process.stdout.write(d)
//     });
// });

// req.on('error', error => {
//     console.error(error);
// });

// req.write(data);
// req.end();


// simple-text

// const https = require('https');

// const data = JSON.stringify({
//     'from': '50004001352927',
//     'to': '09360352927',
//     'text': 'test sms'
// });

// const options = {
//     hostname: 'console.melipayamak.com',
//     port: 443,
//     path: '/api/send/simple/024540f42c09441ebe402763f02cd285',
//     method: 'POST',
//     headers: {
//         'Content-Type': 'application/json',
//         'Content-Length': data.length
//     }
// };

// const req = https.request(options, res => {
//     console.log('statusCode: ' + res.statusCode);

//     res.on('data', d => {
//         process.stdout.write(d)
//     });
// });

// req.on('error', error => {
//     console.error(error);
// });

// req.write(data);
// req.end();