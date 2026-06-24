/**
 * emailService.js — Centralized Email Notification Service
 * Tara Fitness Centre | All email templates and send functions
 */

// ─── SHARED TEMPLATE HELPERS ───────────────────────────────────────────────

const primaryColor = '#E34A29';
const darkBg = '#1a1a1a';
const cardBg = '#ffffff';

const emailWrapper = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tara Fitness Centre</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:600px;background-color:${cardBg};border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,${darkBg} 0%,#2d1f1a 50%,#3a1a0e 100%);padding:36px 40px;text-align:center;">
              <div style="display:inline-block;margin-bottom:12px;">
                <span style="font-size:28px;font-weight:900;color:${primaryColor};letter-spacing:2px;font-family:'Segoe UI Black',Arial,sans-serif;">TARA</span>
                <span style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:2px;font-family:'Segoe UI Black',Arial,sans-serif;"> FITNESS</span>
              </div>
              <div style="width:50px;height:3px;background:${primaryColor};margin:0 auto;border-radius:2px;"></div>
              <div style="font-size:11px;color:#aaaaaa;letter-spacing:3px;text-transform:uppercase;margin-top:8px;">Elite Fitness Centre</div>
            </td>
          </tr>
          <!-- BODY -->
          <tr>
            <td style="padding:40px 40px 32px 40px;">
              ${content}
            </td>
          </tr>
          <!-- FOOTER -->
          <tr>
            <td style="background-color:#f8f8f8;padding:24px 40px;border-top:2px solid #eeeeee;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:13px;color:#888888;">📍 Tara Fitness Centre | Your Fitness, Our Passion</p>
              <p style="margin:0;font-size:11px;color:#aaaaaa;">This is an automated email. Please do not reply directly to this message.</p>
              <div style="margin-top:16px;">
                <span style="display:inline-block;font-size:18px;color:${primaryColor};">💪</span>
                <span style="font-size:12px;color:#888888;margin-left:6px;font-style:italic;">Stay Strong. Stay Consistent.</span>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const heading = (text) => `<h1 style="margin:0 0 8px 0;font-size:26px;font-weight:800;color:#1a1a1a;line-height:1.3;">${text}</h1>`;
const subheading = (text) => `<p style="margin:0 0 24px 0;font-size:14px;color:${primaryColor};font-weight:600;text-transform:uppercase;letter-spacing:1px;">${text}</p>`;
const paragraph = (text) => `<p style="margin:0 0 16px 0;font-size:15px;color:#444444;line-height:1.7;">${text}</p>`;
const divider = () => `<hr style="border:none;border-top:1px solid #eeeeee;margin:24px 0;" />`;

const infoCard = (rows) => `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:8px;border:1px solid #eeeeee;margin:20px 0;">
    ${rows.map(([label, value]) => `
      <tr>
        <td style="padding:12px 16px;font-size:13px;color:#888;font-weight:600;width:38%;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #eeeeee;">${label}</td>
        <td style="padding:12px 16px;font-size:14px;color:#333;font-weight:500;border-bottom:1px solid #eeeeee;">${value}</td>
      </tr>`).join('')}
  </table>`;

const ctaButton = (text, url = '#') => `
  <div style="text-align:center;margin:28px 0;">
    <a href="${url}" style="display:inline-block;background:${primaryColor};color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:700;letter-spacing:0.5px;box-shadow:0 4px 12px rgba(227,74,41,0.35);">${text}</a>
  </div>`;

const statusBadge = (text, color = primaryColor) => `<span style="display:inline-block;background:${color};color:#fff;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;text-transform:uppercase;letter-spacing:1px;">${text}</span>`;

const { createTransporter } = require('../config/mailer');

const send = async (to, subject, html) => {
    // Try Gmail SMTP via Nodemailer first
    const transporter = createTransporter();
    if (transporter) {
        try {
            const fromEmail = `"${process.env.EMAIL_FROM_NAME || 'Tara Fitness Centre'}" <${process.env.EMAIL_USER}>`;
            const info = await transporter.sendMail({
                from: fromEmail,
                to,
                subject,
                html,
                headers: {
                    'X-Priority': '1',
                    'Importance': 'high',
                    'X-Mailer': 'Tara Fitness Centre Mailer'
                }
            });
            console.log(`✉️  Email sent via Gmail SMTP to ${to} | ${subject} (id: ${info.messageId})`);
            return true;
        } catch (gmailErr) {
            console.warn(`[EMAIL] Gmail SMTP failed, trying Resend API... Error: ${gmailErr.message}`);
        }
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
        console.log(`[EMAIL SKIPPED - no Resend API Key] To: ${to} | Subject: ${subject}`);
        return false;
    }
    try {
        // Resend requires a custom domain (e.g. noreply@tfc365.com). It cannot send from @gmail.com.
        const fromEmail = process.env.EMAIL_FROM || 'Tara Fitness <noreply@tfc365.com>';
        
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: fromEmail,
                to: [to],
                subject,
                html,
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log(`✉️  Email sent via Resend to ${to} | ${subject}`);
            return true;
        } else {
            console.error(`❌ Email failed to ${to} via Resend:`, JSON.stringify(data));
            return false;
        }
    } catch (err) {
        console.error(`❌ Email failed to ${to}:`, err.message);
        return false;
    }
};

const OWNER = () => process.env.OWNER_EMAIL || process.env.EMAIL_USER;

// ─── 1. USER REGISTRATION ─────────────────────────────────────────────────

const sendWelcomeEmail = (user) => send(
    user.email,
    '🏋️ Welcome to Tara Fitness Centre!',
    emailWrapper(`
        ${heading('Welcome to the Family! 💪')}
        ${subheading('Your account is ready')}
        ${paragraph(`Hi <strong>${user.name}</strong>, you've successfully joined Tara Fitness Centre! We're thrilled to have you as part of our elite fitness community.`)}
        ${infoCard([
            ['Your Name', user.name],
            ['Login Email', user.email],
            ['Account Status', 'Active ✅'],
        ])}
        ${paragraph('Start your fitness journey today! Explore our membership plans, book personal training sessions, or join group classes.')}
        ${ctaButton('Login to Your Account', 'http://localhost:5173/login')}
        ${divider()}
        ${paragraph('If you have any questions, feel free to reach out to us. Stay consistent, stay strong!')}
    `)
);

const sendAdminNewUserAlert = (user) => send(
    OWNER(),
    `🆕 New Registration: ${user.name}`,
    emailWrapper(`
        ${heading('New Member Registered!')}
        ${subheading('User Registration Alert')}
        ${paragraph('A new user has just registered on the Tara Fitness website.')}
        ${infoCard([
            ['Name', user.name],
            ['Email', user.email],
            ['Role', user.role || 'user'],
            ['Registered At', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })],
        ])}
        ${paragraph('You can view and manage this user from the Admin Panel.')}
    `)
);

// ─── 2. LOGIN NOTIFICATION ────────────────────────────────────────────────

const sendLoginAlert = (user) => send(
    OWNER(),
    `🔐 Member Login: ${user.name}`,
    emailWrapper(`
        ${heading('A Member Logged In')}
        ${subheading('Login Activity')}
        ${infoCard([
            ['Name', user.name],
            ['Email', user.email],
            ['Login Time', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })],
        ])}
    `)
);

// ─── 3. ENQUIRY SUBMISSION ────────────────────────────────────────────────

const sendEnquiryConfirmation = (data) => send(
    data.email,
    '✅ We Received Your Enquiry — Tara Fitness',
    emailWrapper(`
        ${heading('Thank You for Reaching Out!')}
        ${subheading('Enquiry Received')}
        ${paragraph(`Hi <strong>${data.name}</strong>, we've received your enquiry and our team will get back to you within 24 hours.`)}
        ${infoCard([
            ['Your Message', data.message || 'N/A'],
            ['Phone', data.phone || 'Not provided'],
            ['Submitted On', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })],
        ])}
        ${paragraph('While you wait, feel free to explore our packages and offers on our website!')}
    `)
);

const sendAdminEnquiryAlert = (data) => send(
    OWNER(),
    `📬 New Enquiry: ${data.name}`,
    emailWrapper(`
        ${heading('New Enquiry Received!')}
        ${subheading('Action Required')}
        ${paragraph('A visitor has submitted an enquiry. Please follow up within 24 hours.')}
        ${infoCard([
            ['Name', data.name],
            ['Email', data.email],
            ['Phone', data.phone || 'Not provided'],
            ['Message', data.message || 'N/A'],
            ['Received At', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })],
        ])}
    `)
);

// ─── 4. GROUP CLASS BOOKING ───────────────────────────────────────────────

const sendGroupClassConfirmation = (data) => send(
    data.email,
    '🏅 Group Class Booking Confirmed — Tara Fitness',
    emailWrapper(`
        ${heading('Booking Request Received!')}
        ${subheading('Group Class Booking')}
        ${paragraph(`Hi <strong>${data.name}</strong>, your group class booking request has been received. Our team will confirm your spot shortly!`)}
        ${infoCard([
            ['Class', data.service || 'N/A'],
            ['Preferred Date', data.date || 'N/A'],
            ['Additional Notes', data.message || 'None'],
        ])}
        ${paragraph('Our team will contact you to confirm your enrollment and share any class preparation tips.')}
        ${ctaButton('View All Classes', 'http://localhost:5173/classes')}
    `)
);

const sendAdminGroupClassAlert = (data) => send(
    OWNER(),
    `🏋️ Group Class Booking: ${data.name}`,
    emailWrapper(`
        ${heading('New Group Class Booking!')}
        ${subheading('Booking Alert')}
        ${infoCard([
            ['Member Name', data.name],
            ['Email', data.email],
            ['Phone', data.phone || 'Not provided'],
            ['Class Requested', data.service || 'N/A'],
            ['Preferred Date', data.date || 'N/A'],
            ['Notes', data.message || 'None'],
            ['Received At', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })],
        ])}
    `)
);

// ─── 5. PERSONAL TRAINING BOOKING ─────────────────────────────────────────

const sendPTSessionConfirmation = (data) => send(
    data.email,
    '💪 PT Session Request Received — Tara Fitness',
    emailWrapper(`
        ${heading('Personal Training Request Received!')}
        ${subheading('PT Session Booking')}
        ${paragraph(`Hi <strong>${data.name}</strong>, your personal training session request is confirmed. Your trainer will be in touch shortly to finalize the schedule.`)}
        ${infoCard([
            ['Preferred Trainer', data.service || 'Any Available'],
            ['Preferred Date & Time', data.date || 'N/A'],
            ['Fitness Goals', data.message || 'None provided'],
        ])}
        ${paragraph('Our certified trainers will reach out to discuss your fitness goals and customize your session.')}
    `)
);

const sendAdminPTSessionAlert = (data) => send(
    OWNER(),
    `🧑‍💼 New PT Session: ${data.name}`,
    emailWrapper(`
        ${heading('New PT Session Request!')}
        ${subheading('Personal Training Alert')}
        ${infoCard([
            ['Member Name', data.name],
            ['Email', data.email],
            ['Phone', data.phone || 'Not provided'],
            ['Preferred Trainer', data.service || 'Any'],
            ['Preferred Date', data.date || 'N/A'],
            ['Fitness Goals', data.message || 'None'],
            ['Received At', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })],
        ])}
    `)
);

// ─── 6. FEEDBACK SUBMISSION ───────────────────────────────────────────────

const sendFeedbackConfirmation = (data) => send(
    data.email,
    '⭐ Thank You for Your Feedback — Tara Fitness',
    emailWrapper(`
        ${heading('We Value Your Feedback!')}
        ${subheading('Feedback Received')}
        ${paragraph(`Hi <strong>${data.name}</strong>, thank you for taking the time to share your experience with us. Your feedback helps us become better every day!`)}
        ${infoCard([
            ['Your Rating', `${data.rating || 'N/A'}/5 ⭐`],
            ['Your Feedback', data.message || 'N/A'],
        ])}
        ${paragraph('We will review your feedback and take necessary actions. We look forward to serving you better!')}
    `)
);

const sendAdminFeedbackAlert = (data) => send(
    OWNER(),
    `⭐ New Feedback from ${data.name}`,
    emailWrapper(`
        ${heading('New Member Feedback!')}
        ${subheading('Feedback Alert')}
        ${infoCard([
            ['Member', data.name],
            ['Email', data.email],
            ['Rating', `${data.rating || 'N/A'}/5`],
            ['Feedback', data.message || 'N/A'],
            ['Received At', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })],
        ])}
    `)
);

// ─── 7. JOIN REQUEST ──────────────────────────────────────────────────────

const sendJoinRequestConfirmation = (data) => send(
    data.email,
    '🎉 Welcome! Your Join Request is Received — Tara Fitness',
    emailWrapper(`
        ${heading(`Welcome, ${data.name}! 🎉`)}
        ${subheading('Join Request Confirmed')}
        ${paragraph('Thank you for expressing your interest in joining Tara Fitness Centre! We are excited to have you on board.')}
        ${infoCard([
            ['Name', data.name],
            ['Phone', data.phone || 'Not provided'],
            ['Goal', data.message || 'General Fitness'],
        ])}
        ${paragraph('Our team will review your request and contact you shortly to discuss the best membership plan for your fitness goals.')}
        ${ctaButton('View Our Plans', 'http://localhost:5173/packages/plans')}
    `)
);

const sendAdminJoinAlert = (data) => send(
    OWNER(),
    `🚀 New Join Request: ${data.name}`,
    emailWrapper(`
        ${heading('New Join Request!')}
        ${subheading('Lead Alert')}
        ${paragraph('Someone wants to join Tara Fitness! Follow up promptly to close the membership.')}
        ${infoCard([
            ['Name', data.name],
            ['Email', data.email],
            ['Phone', data.phone || 'Not provided'],
            ['Goal / Message', data.message || 'None'],
            ['Received At', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })],
        ])}
    `)
);

// ─── 8. PLAN INTEREST ────────────────────────────────────────────────────

const sendPlanInterestConfirmation = (data) => send(
    data.email,
    `✅ Plan Request Received: ${data.planName} — Tara Fitness`,
    emailWrapper(`
        ${heading('Plan Interest Confirmed!')}
        ${subheading('Membership Request')}
        ${paragraph(`Hi <strong>${data.name}</strong>, we've received your interest in the <strong>${data.planName}</strong> plan. Our team will contact you shortly to complete your enrollment.`)}
        ${infoCard([
            ['Plan Selected', data.planName],
            ['Price', `₹${data.planPrice || 'N/A'}`],
        ])}
        ${paragraph('You are one step closer to your fitness goals! Our team will guide you through the payment and onboarding process.')}
        ${ctaButton('Explore More Plans', 'http://localhost:5173/packages/plans')}
    `)
);

const sendAdminPlanInterestAlert = (data) => send(
    OWNER(),
    `💳 Plan Interest: ${data.name} → ${data.planName}`,
    emailWrapper(`
        ${heading('New Membership Interest!')}
        ${subheading('Plan Purchase Alert')}
        ${paragraph('A member is interested in purchasing a membership plan. Contact them to complete the payment.')}
        ${infoCard([
            ['Member Name', data.name],
            ['Email', data.email],
            ['Plan', data.planName],
            ['Price', `₹${data.planPrice || 'N/A'}`],
            ['Received At', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })],
        ])}
    `)
);

// ─── 9. PAYMENT CONFIRMATION ─────────────────────────────────────────────

const sendPaymentConfirmation = (data) => send(
    data.email,
    `🧾 Payment Receipt — ${data.packageName} | Tara Fitness`,
    emailWrapper(`
        ${heading('Payment Confirmed! 🎉')}
        ${subheading('Membership Receipt')}
        ${paragraph(`Hi <strong>${data.name}</strong>, your payment has been successfully processed. Welcome to your new membership!`)}
        ${infoCard([
            ['Member Name', data.name],
            ['Package', data.packageName],
            ['Amount Paid', `₹${data.amountPaid}`],
            ['Membership Start', new Date(data.startDate).toLocaleDateString('en-IN')],
            ['Membership End', new Date(data.endDate).toLocaleDateString('en-IN')],
            ['Payment Date', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })],
            ['Status', '✅ Active'],
        ])}
        ${paragraph('Your membership is now active! Visit us at the gym and our team will be happy to assist you in getting started.')}
        ${ctaButton('Go to Dashboard', 'http://localhost:5173/profile')}
        ${divider()}
        ${paragraph('<small style="color:#aaa;">Please keep this email as your payment receipt.</small>')}
    `)
);

// ─── 9b. UPI PAYMENT SUBMITTED (awaiting verification) ───────────────────

const sendUpiPaymentPendingUser = (data) => send(
    data.email,
    `⏳ Payment Under Review — ${data.planName} | Tara Fitness`,
    emailWrapper(`
        ${heading('Payment Screenshot Received!')}
        ${subheading('Under Verification')}
        ${statusBadge('Awaiting Verification', '#f59e0b')}
        ${paragraph(`Hi <strong>${data.userName}</strong>, we have received your UPI payment screenshot for the <strong>${data.planName}</strong> plan. Our team is currently verifying your transaction.`)}
        ${infoCard([
            ['Plan', data.planName],
            ['Amount', `₹${data.planPrice}`],
            ['Transaction ID', data.transactionId || 'N/A'],
            ['Submitted At', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })],
            ['Status', '⏳ Pending Verification'],
        ])}
        ${paragraph('Our system will automatically verify your payment. If manual review is needed, we will confirm within a few hours. You will receive another email once verified.')}
        ${divider()}
        ${paragraph('<small style="color:#aaa;">If you did not make this payment, please contact us immediately.</small>')}
    `)
);

const sendUpiPaymentPendingOwner = (data) => send(
    OWNER(),
    `💳 New UPI Payment: ${data.userName} → ${data.planName}`,
    emailWrapper(`
        ${heading('New UPI Payment Submitted!')}
        ${subheading('Payment Verification Required')}
        ${statusBadge(data.verificationStatus === 'auto_verified' ? 'Auto Verified ✅' : 'Manual Review Needed ⚠️', data.verificationStatus === 'auto_verified' ? '#16a34a' : '#f59e0b')}
        ${paragraph('A member has submitted a UPI payment screenshot. Please review in the admin panel.')}
        ${infoCard([
            ['Member Name', data.userName],
            ['Email', data.email],
            ['Plan', data.planName],
            ['Amount', `₹${data.planPrice}`],
            ['Transaction ID', data.transactionId || 'N/A'],
            ['OCR Confidence', data.ocrConfidence ? `${Number(data.ocrConfidence).toFixed(1)}%` : 'N/A'],
            ['Verification Status', data.verificationStatus],
            ['Submitted At', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })],
        ])}
        ${ctaButton('Review in Admin Panel', 'http://localhost:5173/admin')}
    `)
);

// ─── 9c. CASH ON BENCH SUBMITTED ─────────────────────────────────────────

const sendCashPaymentPendingUser = (data) => send(
    data.email,
    `🏦 Cash Payment Registered — ${data.planName} | Tara Fitness`,
    emailWrapper(`
        ${heading('Cash Payment Request Recorded! 💵')}
        ${subheading('Pay at Gym Reception')}
        ${statusBadge('Cash Pending', '#ea580c')}
        ${paragraph(`Hi <strong>${data.userName}</strong>, your cash payment request for the <strong>${data.planName}</strong> plan has been recorded. Please visit us to complete the payment.`)}
        ${infoCard([
            ['Plan', data.planName],
            ['Amount to Pay', `₹${data.planPrice}`],
            ['Payment Method', 'Cash at Reception 🏦'],
            ['Registered At', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })],
            ['Status', '🟠 Pending — Pay at Gym'],
        ])}
        ${paragraph('<strong>Next Steps:</strong><br/>1. Visit Tara Fitness Centre reception.<br/>2. Inform the staff about this registration.<br/>3. Pay <strong>₹' + data.planPrice + '</strong> in cash.<br/>4. Your membership will be activated immediately on payment.')}
        ${ctaButton('View Membership Plans', 'http://localhost:5173/packages/plans')}
        ${divider()}
        ${paragraph('<small style="color:#aaa;">Your membership will only be activated after cash payment is received at the gym.</small>')}
    `)
);

const sendCashPaymentPendingOwner = (data) => send(
    OWNER(),
    `💵 New Cash Payment Request: ${data.userName} → ${data.planName}`,
    emailWrapper(`
        ${heading('New Cash on Bench Request!')}
        ${subheading('Collect Payment at Reception')}
        ${statusBadge('Cash Pending — Collect at Desk', '#ea580c')}
        ${paragraph('A member has registered for a cash payment. Please collect the payment at reception and confirm in the admin panel.')}
        ${infoCard([
            ['Member Name', data.userName],
            ['Email', data.email],
            ['Plan', data.planName],
            ['Amount to Collect', `₹${data.planPrice}`],
            ['Payment Method', 'Cash at Reception'],
            ['Requested At', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })],
        ])}
        ${ctaButton('Go to Admin Panel → Payments', 'http://localhost:5173/admin')}
        ${paragraph('<strong>Action Required:</strong> Once you have collected the cash, click "Collected" in the Payments section of the admin panel to activate their membership.')}
    `)
);

// ─── 9d. PAYMENT APPROVED OWNER ALERT ────────────────────────────────────

const sendPaymentApprovedOwner = (data) => send(
    OWNER(),
    `✅ Payment Confirmed: ${data.userName} → ${data.planName}`,
    emailWrapper(`
        ${heading('Payment Confirmed & Membership Activated!')}
        ${subheading('Payment Success Alert')}
        ${statusBadge('Membership Active ✅', '#16a34a')}
        ${paragraph('A member\'s payment has been verified and their membership is now active.')}
        ${infoCard([
            ['Member Name', data.userName],
            ['Email', data.email],
            ['Plan', data.planName],
            ['Amount Paid', `₹${data.planPrice}`],
            ['Payment Method', data.paymentMethod === 'cash_on_bench' ? 'Cash at Reception' : 'UPI'],
            ['Membership Start', new Date(data.startDate).toLocaleDateString('en-IN')],
            ['Membership End', new Date(data.endDate).toLocaleDateString('en-IN')],
            ['Confirmed At', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })],
        ])}
    `)
);

// ─── 10. MEMBERSHIP EXPIRY REMINDERS ─────────────────────────────────────

const sendExpiryReminder = (membership, daysLeft) => {
    const isExpired = daysLeft === 0;
    const subject = isExpired
        ? `⚠️ Your Tara Fitness Membership Has Expired`
        : `⏳ Your Membership Expires in ${daysLeft} Day${daysLeft > 1 ? 's' : ''}`;

    return send(
        membership.userEmail,
        subject,
        emailWrapper(`
            ${heading(isExpired ? 'Your Membership Has Expired' : `${daysLeft} Day${daysLeft > 1 ? 's' : ''} Until Expiry!`)}
            ${subheading(isExpired ? 'Membership Expired' : 'Renewal Reminder')}
            ${paragraph(`Hi <strong>${membership.userName}</strong>, ${isExpired
                ? "your membership has expired. Renew now to continue your fitness journey without interruption!"
                : `your <strong>${membership.packageName}</strong> membership will expire on <strong>${new Date(membership.endDate).toLocaleDateString('en-IN')}</strong>. Renew now to keep your streak going!`
            }`)}
            ${infoCard([
                ['Package', membership.packageName],
                ['Expiry Date', new Date(membership.endDate).toLocaleDateString('en-IN')],
                ['Status', isExpired ? '❌ Expired' : `⏳ ${daysLeft} days left`],
            ])}
            ${ctaButton('Renew My Membership Now', 'http://localhost:5173/packages/plans')}
            ${paragraph('Don\'t let your progress stop here. Renew today and keep pushing your limits!')}
        `)
    );
};

// ─── 11. GOOGLE SIGN-IN WELCOME ──────────────────────────────────────────

const sendGoogleWelcomeEmail = (user) => send(
    user.email,
    '🎉 Welcome to Tara Fitness — Google Sign-In Successful!',
    emailWrapper(`
        ${heading(`Welcome, ${user.name}! 💪`)}
        ${subheading('Account Created via Google')}
        ${paragraph('Your account has been successfully created using Google Sign-In. You are now part of our elite fitness community!')}
        ${infoCard([
            ['Your Name', user.name],
            ['Login Email', user.email],
            ['Sign-in Method', 'Google Account ✅'],
        ])}
        ${paragraph('Start your fitness journey today! Explore our membership plans, book sessions, and check out our trainers.')}
        ${ctaButton('Explore Tara Fitness', 'http://localhost:5173/')}
    `)
);

const sendAdminGoogleUserAlert = (user) => send(
    OWNER(),
    `🆕 New Google Registration: ${user.name}`,
    emailWrapper(`
        ${heading('New Member via Google!')}
        ${subheading('Google Sign-In Registration')}
        ${paragraph('A new user has registered using Google Sign-In.')}
        ${infoCard([
            ['Name', user.name],
            ['Email', user.email],
            ['Sign-in Method', 'Google'],
            ['Registered At', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })],
        ])}
    `)
);

// ─── 12. PASSWORD RESET ───────────────────────────────────────────────────

const sendPasswordResetConfirmation = (user) => send(
    user.email,
    '🔒 Password Reset Successful — Tara Fitness',
    emailWrapper(`
        ${heading('Password Reset Successful')}
        ${subheading('Security Alert')}
        ${paragraph(`Hi <strong>${user.name || 'Member'}</strong>, your Tara Fitness account password has been updated successfully.`)}
        ${infoCard([
            ['Email', user.email],
            ['Reset Time', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })],
        ])}
        ${paragraph('If you did not request this change, please contact us immediately by replying to this email.')}
        ${ctaButton('Login to Your Account', 'http://localhost:5173/login')}
    `)
);

const sendPasswordResetLink = (user, resetLink) => send(
    user.email,
    '🔒 Action Required: Reset Your Password — Tara Fitness',
    emailWrapper(`
        ${heading('Password Reset Request')}
        ${subheading('Security Alert')}
        ${paragraph(`Hi <strong>${user.name || 'Member'}</strong>, we received a request to reset the password for your Tara Fitness account.`)}
        ${paragraph('Click the button below to securely set a new password. This link is valid for 15 minutes.')}
        ${ctaButton('Reset Password', resetLink)}
        ${paragraph('If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.')}
    `)
);

// ─── 13. PAR-Q FORM ──────────────────────────────────────────────────────

const sendParQConfirmation = (data) => send(
    data.email,
    '✅ PAR-Q Received — Tara Fitness',
    emailWrapper(`
        ${heading('PAR-Q Form Received!')}
        ${subheading('Physical Activity Readiness Questionnaire')}
        ${paragraph(`Hi <strong>${data.name}</strong>, we have received your Physical Activity Readiness Questionnaire. Our team will review your responses and contact you shortly.`)}
        ${infoCard([
            ['Name', data.name],
            ['Phone', data.phone || 'Not provided'],
            ['Details', data.message || 'N/A'],
            ['Submitted On', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })],
        ])}
        ${paragraph('Please ensure you follow any medical advice if you answered YES to any questions. Our trainers will design a safe program for you.')}
    `)
);

const sendAdminParQAlert = (data) => send(
    OWNER(),
    `📋 New PAR-Q Form: ${data.name}`,
    emailWrapper(`
        ${heading('New PAR-Q Submission!')}
        ${subheading('Physical Activity Readiness Questionnaire')}
        ${paragraph('A new PAR-Q form has been submitted. Please review and take action.')}
        ${infoCard([
            ['Name', data.name],
            ['Email', data.email],
            ['Phone', data.phone || 'Not provided'],
            ['Responses', data.message || 'N/A'],
            ['Submitted At', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })],
        ])}
    `)
);

// ─── 14. TRIAL WAIVER FORM ────────────────────────────────────────────────

const sendTrialWaiverConfirmation = (data) => send(
    data.email,
    '✅ Trial Waiver Signed — Tara Fitness',
    emailWrapper(`
        ${heading('Trial Waiver Received!')}
        ${subheading('Liability Waiver Confirmation')}
        ${paragraph(`Hi <strong>${data.name}</strong>, your trial waiver form has been received and recorded. Thank you for completing this important step before your trial session at Tara Fitness Centre.`)}
        ${infoCard([
            ['Name', data.name],
            ['Phone', data.phone || 'Not provided'],
            ['Submitted On', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })],
        ])}
        ${paragraph('Our team will contact you shortly to schedule your trial session. We look forward to meeting you!')}
        ${ctaButton('View Our Packages', 'http://localhost:5173/packages/plans')}
    `)
);

const sendAdminTrialWaiverAlert = (data) => send(
    OWNER(),
    `📝 New Trial Waiver: ${data.name}`,
    emailWrapper(`
        ${heading('New Trial Waiver Submitted!')}
        ${subheading('Liability Waiver Alert')}
        ${paragraph('A new trial waiver form has been submitted. Please follow up to schedule the trial session.')}
        ${infoCard([
            ['Name', data.name],
            ['Email', data.email],
            ['Phone', data.phone || 'Not provided'],
            ['Details', data.message || 'N/A'],
            ['Submitted At', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })],
        ])}
    `)
);

// ─── 15. PT CONTRACT FORM ─────────────────────────────────────────────────

const sendPTContractConfirmation = (data) => send(
    data.email,
    '✅ PT Contract Signed — Tara Fitness',
    emailWrapper(`
        ${heading('Personal Training Contract Received!')}
        ${subheading('PT Contract Confirmation')}
        ${paragraph(`Hi <strong>${data.name}</strong>, your Personal Training Contract has been received and recorded. Your commitment to fitness is commendable!`)}
        ${infoCard([
            ['Name', data.name],
            ['Phone', data.phone || 'Not provided'],
            ['Submitted On', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })],
        ])}
        ${paragraph('Your assigned trainer will reach out to schedule your first session. Get ready to transform!')}
        ${ctaButton('Go to Dashboard', 'http://localhost:5173/profile')}
    `)
);

const sendAdminPTContractAlert = (data) => send(
    OWNER(),
    `📄 New PT Contract: ${data.name}`,
    emailWrapper(`
        ${heading('New PT Contract Submitted!')}
        ${subheading('Personal Training Contract Alert')}
        ${paragraph('A new Personal Training Contract has been submitted. Assign a trainer and schedule the first session.')}
        ${infoCard([
            ['Name', data.name],
            ['Email', data.email],
            ['Phone', data.phone || 'Not provided'],
            ['Contract Details', data.message || 'N/A'],
            ['Submitted At', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })],
        ])}
    `)
);

// ─── EXPORTS ──────────────────────────────────────────────────────────────

module.exports = {
    // User actions
    sendWelcomeEmail,
    sendAdminNewUserAlert,
    sendLoginAlert,
    sendGoogleWelcomeEmail,
    sendAdminGoogleUserAlert,
    sendPasswordResetConfirmation,
    sendPasswordResetLink,
    // Forms
    sendEnquiryConfirmation,
    sendAdminEnquiryAlert,
    sendGroupClassConfirmation,
    sendAdminGroupClassAlert,
    sendPTSessionConfirmation,
    sendAdminPTSessionAlert,
    sendFeedbackConfirmation,
    sendAdminFeedbackAlert,
    sendJoinRequestConfirmation,
    sendAdminJoinAlert,
    sendPlanInterestConfirmation,
    sendAdminPlanInterestAlert,
    // Documents / Waivers
    sendParQConfirmation,
    sendAdminParQAlert,
    sendTrialWaiverConfirmation,
    sendAdminTrialWaiverAlert,
    sendPTContractConfirmation,
    sendAdminPTContractAlert,
    // Payments & Memberships
    sendPaymentConfirmation,
    sendExpiryReminder,
    // Payment status emails
    sendUpiPaymentPendingUser,
    sendUpiPaymentPendingOwner,
    sendCashPaymentPendingUser,
    sendCashPaymentPendingOwner,
    sendPaymentApprovedOwner,
};
