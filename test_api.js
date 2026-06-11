const https = require('https');
const b = JSON.stringify({
    model: 'gpt-image-2',
    prompt: 'Professional business consulting scene, East Asian Chinese professionals in modern luxury office with Hong Kong skyline, discussing immigration plans, warm golden lighting, photorealistic, 8K',
    size: '16:9',
    quality: 'high'
});
const r = https.request({
    hostname: 'api.evolink.ai', port: 443,
    path: '/v1/images/generations', method: 'POST',
    headers: {
        'Authorization': 'Bearer sk-ALG1yoXRHA3xqV6xthiD4CYSgsRA2xorRZwQh1QAD29UnvnO',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(b)
    }
}, s => {
    let d = '';
    s.on('data', c => d += c);
    s.on('end', () => console.log(s.statusCode, d.substring(0, 400)));
});
r.on('error', e => console.log(e.message));
r.write(b);
r.end();
