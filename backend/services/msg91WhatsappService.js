/**
 * msg91WhatsappService.js
 * Sends WhatsApp template messages through MSG91's gateway.
 * MSG91 is connected to the same Meta WABA (tfc / Tara Fitness Centre)
 * so all approved Meta templates work exactly the same way.
 *
 * API Docs: https://docs.msg91.com/whatsapp
 * Endpoint: POST https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/
 * Auth:     authkey header (MSG91_AUTH_KEY in .env)
 */

const MSG91_API_URL = 'https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/';

function formatPhoneNumber(raw) {
    let num = String(raw || '').replace(/\D/g, '');
    if (num.startsWith('0') && num.length === 11) num = num.substring(1);
    if (num.length === 10) num = '91' + num;
    if (num.length < 11) return null;
    return num;
}

async function sendMsg91WhatsAppTemplate(to, templateName, components = []) {
    const authKey = process.env.MSG91_AUTH_KEY;
    if (!authKey) {
        console.error('[MSG91] MSG91_AUTH_KEY not set in .env.');
        return null;
    }
    const formattedNumber = formatPhoneNumber(to);
    if (!formattedNumber) {
        console.error('[MSG91] Invalid phone: ' + to);
        return null;
    }
    const payload = {
        messaging_product: 'whatsapp',
        to: formattedNumber,
        type: 'template',
        template: { name: templateName, language: { code: 'en' }, components }
    };
    console.log('[MSG91] Sending ' + templateName + ' to ' + formattedNumber + '...');
    const response = await fetch(MSG91_API_URL, {
        method: 'POST',
        headers: { 'authkey': authKey, 'content-type': 'application/json', 'accept': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok || data.type === 'error') {
        const errMsg = data.message || data.msg || JSON.stringify(data);
        console.error('[MSG91] API error for ' + templateName + ': ' + errMsg);
        const err = new Error('MSG91 WhatsApp Error: ' + errMsg);
        err.msg91Error = data;
        throw err;
    }
    const messageId = (data.data && data.data.message_id) || data.message_id || data.id || null;
    console.log('[MSG91] Sent ' + templateName + ' to ' + formattedNumber + ' msgId: ' + messageId);
    return { success: true, messageId, formattedNumber, templateUsed: templateName, provider: 'msg91' };
}

async function sendWithMsg91Fallback(to, templateName, components, metaFallbackFn) {
    try {
        return await sendMsg91WhatsAppTemplate(to, templateName, components);
    } catch (err) {
        console.warn('[MSG91] Failed, falling back to Meta Cloud API. Reason: ' + err.message);
        if (typeof metaFallbackFn === 'function') return await metaFallbackFn();
        throw err;
    }
}

module.exports = { sendMsg91WhatsAppTemplate, sendWithMsg91Fallback, formatPhoneNumber };
