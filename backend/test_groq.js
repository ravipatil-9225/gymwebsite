require('dotenv').config();
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function test() {
    try {
        const r = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: 'Say hello in JSON: {"hello":"world"}' }],
            max_tokens: 50,
            response_format: { type: 'json_object' }
        });
        console.log('OK:', r.choices[0].message.content);
    } catch(e) {
        console.log('Status:', e.status);
        console.log('Type:', e.error?.error?.type);
        console.log('Message:', e.message?.substring(0, 300));
    }
}
test();
