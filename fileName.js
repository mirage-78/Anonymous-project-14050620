const https = require('https');

const data = JSON.stringify({
    'to': '09360352927'
});

const options = {
    hostname: 'console.melipayamak.com',
    port: 443,
    path: '/api/send/otp/024540f42c09441ebe402763f02cd285',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(options, res => {
    console.log('statusCode: ' + res.statusCode);

    res.on('data', d => {
        process.stdout.write(d)
    });
});

req.on('error', error => {
    console.error(error);
});

req.write(data);
req.end();