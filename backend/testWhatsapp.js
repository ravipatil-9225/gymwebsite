require('dotenv').config();

async function testHelloWorld(to) {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    
    // The Meta API URL (matches your whatsappService.js)
    const WHATSAPP_API_URL = 'https://graph.facebook.com/v19.0';

    if (!token || !phoneId) {
        console.error('⚠️ Environment variables missing. Ensure .env is loaded.');
        return;
    }

    try {
        // Format number: drop pluses or spaces
        let formattedNumber = to.replace(/\D/g, '');
        if (formattedNumber.length === 10) {
            formattedNumber = '91' + formattedNumber; // Default to India if no code
        }

        console.log(`Sending test "hello_world" to ${formattedNumber}...`);

        const response = await fetch(`${WHATSAPP_API_URL}/${phoneId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: formattedNumber,
                type: 'template',
                template: {
                    name: 'hello_world', // This is a default template pre-approved by Meta
                    language: {
                        code: 'en_US' 
                    }
                }
            })
        });

        const data = await response.json();
        if (data.error) {
            console.error('❌ Meta API Error:', data.error);
        } else {
            console.log('✅ Success! Message sent. Meta Response ID:', data.messages[0].id);
        }
    } catch (err) {
        console.error('❌ Fetch Error:', err);
    }
}

// Replace with your personal phone number to test!
// For example: testHelloWorld('919876543210');
console.log('Edit the file to uncomment the test function at the bottom with your phone number.');
