const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

const API = 'http://localhost:3000';
const testEmail = 'test@example.com';
const secret = process.env.JWT_SECRET || "supersecretjwtkey";

// Generate a token for the test
const token = jwt.sign({ email: testEmail }, secret, { expiresIn: '1h' });

async function testPersonality() {
    console.log('Testing Personality Analyzer (with Auth)...');
    try {
        const response = await fetch(`${API}/analyze-personality`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                email: testEmail,
                textInput: 'I am a highly motivated software engineer with a passion for solving complex architectural problems. I enjoy collaborating with diverse teams and always strive for clean, maintainable code. When faced with challenges, I take a structured approach to debugging and optimization.'
            })
        });
        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));
        if (data.success) {
            console.log('✅ Personality Analysis Test Passed');
        } else {
            console.log('❌ Personality Analysis Test Failed:', data.message);
        }
    } catch (error) {
        console.error('❌ Error testing personality analyzer:', error.message);
    }
}

testPersonality();
