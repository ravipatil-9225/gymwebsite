require('dotenv').config();

const WHATSAPP_API_URL = 'https://graph.facebook.com/v19.0';

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
            console.log(`✅ ${label}: sent! (wamid: ${data.messages?.[0]?.id || 'N/A'})`);
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

async function run() {
    const phone = '919699169574';
    let pass = 0, fail = 0;
    
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║     FULL TEST - All 7 Active Templates (Correct Params)  ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    // ── 1. welcome_message_template ──────────────────────────────────────────
    // Header: location | Body: {{1}}=name
    const r1 = await testTemplate(phone, 'welcome_message_template', [
        locationHeader,
        { type: 'body', parameters: [{ type: 'text', text: 'Ravi Patil' }] }
    ], '1. welcome_message_template (location + name)');
    r1 ? pass++ : fail++;

    // ── 2. cash_payment_request_template ─────────────────────────────────────
    // Header: NONE | Body: {{1}}=name, {{2}}=plan, {{3}}=amount
    const r2 = await testTemplate(phone, 'cash_payment_request_template', [
        { type: 'body', parameters: [
            { type: 'text', text: 'Ravi Patil' },
            { type: 'text', text: '3 Months Elite Strength' },
            { type: 'text', text: '4500' }
        ]}
    ], '2. cash_payment_request_template (name, plan, amount)');
    r2 ? pass++ : fail++;

    // ── 3. upi_payment_pending_template ──────────────────────────────────────
    // Header: location | Body: {{1}}=name, {{2}}=transactionId
    const r3 = await testTemplate(phone, 'upi_payment_pending_template', [
        locationHeader,
        { type: 'body', parameters: [
            { type: 'text', text: 'Ravi Patil' },
            { type: 'text', text: 'TXN789012345' }
        ]}
    ], '3. upi_payment_pending_template (location, name, txnId)');
    r3 ? pass++ : fail++;

    // ── 4. payment_receipt_template_fallback ──────────────────────────────────
    // Header: NONE | Body: {{1}}=name, {{2}}=plan, {{3}}=amount, {{4}}=startDate, {{5}}=endDate
    // Meta text = "your payment of Rs. {{3}} for the {{2}} plan" → {{2}}=Plan, {{3}}=Amount
    const r4 = await testTemplate(phone, 'payment_receipt_template_fallback', [
        { type: 'body', parameters: [
            { type: 'text', text: 'Ravi Patil' },
            { type: 'text', text: '3 Months Elite Strength' },  // {{2}} = Plan name
            { type: 'text', text: '4500' },                     // {{3}} = Amount
            { type: 'text', text: '4/6/2026' },
            { type: 'text', text: '4/9/2026' }
        ]}
    ], '4. payment_receipt_template_fallback (name, plan, amount, start, end)');
    r4 ? pass++ : fail++;

    // ── 5. membership_expiry_reminder_template ────────────────────────────────
    // Header: location | Body: {{1}}=name, {{2}}=plan, {{3}}=daysLeft
    const r5 = await testTemplate(phone, 'membership_expiry_reminder_template', [
        locationHeader,
        { type: 'body', parameters: [
            { type: 'text', text: 'Ravi Patil' },
            { type: 'text', text: '3 Months Elite Strength' },
            { type: 'text', text: '3' }
        ]}
    ], '5. membership_expiry_reminder_template (location, name, plan, days)');
    r5 ? pass++ : fail++;

    // ── 6. membership_overdue_reminder_template ───────────────────────────────
    // Header: location | Body: {{1}}=name, {{2}}=plan
    const r6 = await testTemplate(phone, 'membership_overdue_reminder_template', [
        locationHeader,
        { type: 'body', parameters: [
            { type: 'text', text: 'Ravi Patil' },
            { type: 'text', text: '3 Months Elite Strength' }
        ]}
    ], '6. membership_overdue_reminder_template (location, name, plan)');
    r6 ? pass++ : fail++;

    // ── 7. membership_expired_template ───────────────────────────────────────
    // Header: location | Body: {{1}}=name, {{2}}=plan
    const r7 = await testTemplate(phone, 'membership_expired_template', [
        locationHeader,
        { type: 'body', parameters: [
            { type: 'text', text: 'Ravi Patil' },
            { type: 'text', text: '3 Months Elite Strength' }
        ]}
    ], '7. membership_expired_template (location, name, plan)');
    r7 ? pass++ : fail++;

    console.log(`\n════════════════════════════════════════════════════════`);
    console.log(`  Results: ${pass}/7 passed, ${fail}/7 failed`);
    if (fail === 0) console.log(`  ✅ ALL 7 templates working correctly!`);
    else console.log(`  ❌ ${fail} template(s) failed — check logs above`);
    console.log(`════════════════════════════════════════════════════════\n`);
}

run();
