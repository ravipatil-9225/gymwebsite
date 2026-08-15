require('dotenv').config();

const WHATSAPP_API_URL = 'https://graph.facebook.com/v19.0';
const BRANDED_DOC_URL = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

async function testTemplate(to, templateName, components, label) {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    let formattedNumber = to.replace(/\D/g, '');
    if (formattedNumber.length === 10) formattedNumber = '91' + formattedNumber;
    
    try {
        const response = await fetch(`${WHATSAPP_API_URL}/${phoneId}/messages`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messaging_product: 'whatsapp', to: formattedNumber, type: 'template',
                template: { name: templateName, language: { code: 'en' }, components }
            })
        });
        const data = await response.json();
        if (data.error) {
            console.log(`❌ ${label}: ${data.error.message}`);
            return false;
        } else {
            console.log(`✅ ${label}: sent!`);
            return true;
        }
    } catch (err) {
        console.error(`❌ ${label}: ${err.message}`);
        return false;
    }
}

const locationHeader = {
    type: 'header',
    parameters: [{ type: 'location', location: { latitude: '16.6913', longitude: '74.2449', name: 'Tara Fitness Centre', address: 'Shop No 1, Kalamba Rd, opp. Surveynagar, Kolhapur' } }]
};

const docHeader = {
    type: 'header',
    parameters: [{ type: 'document', document: { link: BRANDED_DOC_URL, filename: 'TaraFitness_Receipt.pdf' } }]
};

async function run() {
    const phone = '919699169574';
    let pass = 0, fail = 0;
    
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║   FINAL TEST - All 7 Templates (tfc Live Account)       ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    // 1. welcome_message_template — LOCATION + 1 body
    const r1 = await testTemplate(phone, 'welcome_message_template', [
        locationHeader,
        { type: 'body', parameters: [{ type: 'text', text: 'Final Test' }] }
    ], '1. welcome_message_template');
    r1 ? pass++ : fail++;

    // 2. cash_payment_request_template — NO HEADER, body only: {{1}}=name, {{2}}=plan, {{3}}=amount
    const r2 = await testTemplate(phone, 'cash_payment_request_template', [
        { type: 'body', parameters: [
            { type: 'text', text: 'Final Test' },
            { type: 'text', text: '3 Months Elite' },
            { type: 'text', text: '4500' }
        ]}
    ], '2. cash_payment_request_template');
    r2 ? pass++ : fail++;

    // 3. upi_payment_pending_template — LOCATION + 2 body
    const r3 = await testTemplate(phone, 'upi_payment_pending_template', [
        locationHeader,
        { type: 'body', parameters: [
            { type: 'text', text: 'Final Test' },
            { type: 'text', text: 'TXN789012345' }
        ]}
    ], '3. upi_payment_pending_template');
    r3 ? pass++ : fail++;

    // 4. payment_receipt_template_fallback — NO HEADER, body only: {{1}}=name, {{2}}=amount, {{3}}=plan, {{4}}=startDate, {{5}}=endDate
    const r4 = await testTemplate(phone, 'payment_receipt_template_fallback', [
        { type: 'body', parameters: [
            { type: 'text', text: 'Final Test' },
            { type: 'text', text: '4500' },
            { type: 'text', text: '3 Months Elite' },
            { type: 'text', text: '4/6/2026' },
            { type: 'text', text: '4/9/2026' }
        ]}
    ], '4. payment_receipt_template_fallback');
    r4 ? pass++ : fail++;

    // 5. membership_expiry_reminder_template — LOCATION + 3 body
    const r5 = await testTemplate(phone, 'membership_expiry_reminder_template', [
        locationHeader,
        { type: 'body', parameters: [
            { type: 'text', text: 'Final Test' },
            { type: 'text', text: '3 Months Elite' },
            { type: 'text', text: '3' }
        ]}
    ], '5. membership_expiry_reminder_template');
    r5 ? pass++ : fail++;

    // 6. membership_overdue_reminder_template — LOCATION + 2 body
    const r6 = await testTemplate(phone, 'membership_overdue_reminder_template', [
        locationHeader,
        { type: 'body', parameters: [
            { type: 'text', text: 'Final Test' },
            { type: 'text', text: '3 Months Elite' }
        ]}
    ], '6. membership_overdue_reminder_template');
    r6 ? pass++ : fail++;

    // 7. membership_expired_template — LOCATION + 2 body (PENDING approval)
    const r7 = await testTemplate(phone, 'membership_expired_template', [
        locationHeader,
        { type: 'body', parameters: [
            { type: 'text', text: 'Final Test' },
            { type: 'text', text: '3 Months Elite' }
        ]}
    ], '7. membership_expired_template (PENDING)');
    r7 ? pass++ : fail++;

    console.log(`\n════════════════════════════════════════`);
    console.log(`  Results: ${pass}/7 passed, ${fail}/7 failed`);
    if (fail === 0) console.log(`  All templates working correctly!`);
    console.log(`════════════════════════════════════════\n`);
}

run();
