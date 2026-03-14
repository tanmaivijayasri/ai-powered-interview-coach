const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

const API = 'http://localhost:3000';
const testEmail = 'test@example.com';
const secret = process.env.JWT_SECRET || "supersecretjwtkey";

// Generate a token for the test
const token = jwt.sign({ email: testEmail }, secret, { expiresIn: '1h' });

async function testGenerator() {
    console.log('Testing Question Generator (with Auth)...');
    try {
        const response = await fetch(`${API}/generate-questions`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                email: testEmail,
                jobRole: 'Frontend React Developer',
                jobDescription: 'Seeking a full-stack developer with experience in Node.js and React.'
            })
        });
        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));
        if (data.success) {
            console.log('✅ Question Generation Test Passed');
        } else {
            console.log('❌ Question Generation Test Failed:', data.message);
        }
    } catch (error) {
        console.error('❌ Error testing generator:', error.message);
    }
}

testGenerator();
