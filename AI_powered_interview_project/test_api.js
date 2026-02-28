const fetch = require('node-fetch');

async function runTests() {
    const endpoint = "http://localhost:3000/interview/chat";

    const testCases = [
        {
            description: "Test React Topic",
            payload: {
                email: "test@example.com",
                message: "I am ready for the interview",
                context: { mode: "topic", skill: "React" },
                isFirst: false
            }
        },
        {
            description: "Test Python Topic",
            payload: {
                email: "test@example.com",
                message: "I am ready for the interview",
                context: { mode: "topic", skill: "Python" },
                isFirst: false
            }
        },
        {
            description: "Test Random New Topic",
            payload: {
                email: "test@example.com",
                message: "I am ready for the interview",
                context: { mode: "topic", skill: "Cybersecurity" },
                isFirst: false
            }
        }
    ];

    console.log("Starting thorough testing of Smart Mock AI question generation...");

    for (const test of testCases) {
        console.log(`\n--- ${test.description} ---`);
        console.log(`Topic Sent: ${test.payload.context.skill}`);
        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(test.payload)
            });
            const data = await response.json();
            console.log(`Generated Question: ${data.reply}`);
        } catch (err) {
            console.error("Error calling endpoint:", err.message);
        }
    }
}

runTests();
