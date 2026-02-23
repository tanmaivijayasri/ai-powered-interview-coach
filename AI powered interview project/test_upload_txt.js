const fs = require('fs');
const http = require('http');
const path = require('path');

// Create a small test file
const filePath = path.join(__dirname, 'test_resume.txt');
fs.writeFileSync(filePath, 'This is a test resume.\nName: John Doe\nSkills: JavaScript, Node.js\nExperience: 5 years of software engineering.');

const boundary = '--------------------------boundary';
let data = '';

data += `--${boundary}\r\n`;
data += 'Content-Disposition: form-data; name="email"\r\n\r\n';
data += 'test@example.com\r\n';

data += `--${boundary}\r\n`;
data += `Content-Disposition: form-data; name="resume"; filename="test_resume.txt"\r\n`;
data += 'Content-Type: text/plain\r\n\r\n';
data += fs.readFileSync(filePath);
data += '\r\n';
data += `--${boundary}--`;

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/upload-resume',
    method: 'POST',
    headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(data)
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('BODY:', body);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
