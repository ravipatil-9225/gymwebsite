const puppeteer = require('puppeteer');
const cloudinary = require('../config/cloudinary');

const getBrowser = async () => {
    console.log('🚀 Launching new Puppeteer instance...');
    return await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage'
        ]
    });
};

const getReceiptHTML = (data) => {
    const primaryColor = '#E8472A';
    const darkBg = '#1c1c1c';
    
    const {
        receiptType = 'CONFIRMATION',
        userName = 'Member',
        planName = 'N/A',
        planPrice = 0,
        startDate = new Date(),
        endDate = new Date(),
        paymentDate = new Date(),
        paymentMethod = 'UPI',
        paymentId = ''
    } = data;

    const startStr = new Date(startDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
    const endStr = new Date(endDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
    const paymentDateStr = new Date(paymentDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    
    const formattedMethod = paymentMethod === 'cash_on_bench' ? (receiptType === 'CASH_PENDING' ? 'Cash at Reception 🏦' : 'Cash') : 
                            paymentMethod === 'pay_later' ? 'Pay Later' : 'UPI';

    const shortId = (paymentId || '00000').toString().slice(-5).toUpperCase();
    const receiptYear = new Date(paymentDate).getFullYear();
    const receiptNumber = `TF-${receiptYear}-${shortId}`;

    const isPending = receiptType === 'CASH_PENDING';

    const headerTitle = isPending ? 'Cash Payment Request Recorded! 💵' : `Payment Confirmed! 
              <svg width="32" height="32" viewBox="0 0 24 24" fill="#22c55e" xmlns="http://www.w3.org/2000/svg" style="vertical-align: text-bottom;">
                <circle cx="12" cy="12" r="12" fill="#22c55e"/>
                <path d="M7 12.5L10 15.5L17 8.5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>`;
              
    const receiptTag = isPending ? 'PAY AT GYM RECEPTION' : 'MEMBERSHIP RECEIPT';
    const pendingBadge = isPending ? `<span style="background: #E8472A; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; margin-bottom: 10px; display: inline-block;">CASH PENDING</span><br/>` : '';

    const greetingText = isPending 
        ? `Hi <strong>${userName}</strong>, your cash payment request for the <strong>${planName}</strong> plan has been recorded. Please visit us to complete the payment.`
        : `Hi <strong>${userName}</strong>,<br/>your payment has been successfully processed. Welcome to your new membership!`;

    const tableRows = isPending ? `
              <tr><td class="col-label">PLAN</td><td class="col-value">${planName}</td></tr>
              <tr><td class="col-label">AMOUNT TO PAY</td><td class="col-value">&#8377;${planPrice}</td></tr>
              <tr><td class="col-label">PAYMENT METHOD</td><td class="col-value">${formattedMethod}</td></tr>
              <tr><td class="col-label">REGISTERED AT</td><td class="col-value">${paymentDateStr}</td></tr>
              <tr>
                <td class="col-label">STATUS</td>
                <td><span class="status-badge" style="background: #fff3e0; color: #e65100;"><span class="status-dot" style="background: #e65100;"></span> Pending — Pay at Gym</span></td>
              </tr>
    ` : `
              <tr><td class="col-label">MEMBER NAME</td><td class="col-value">${userName}</td></tr>
              <tr><td class="col-label">PACKAGE</td><td class="col-value">${planName}</td></tr>
              <tr><td class="col-label">AMOUNT PAID</td><td class="col-value">&#8377;${planPrice}</td></tr>
              <tr><td class="col-label">MEMBERSHIP START</td><td class="col-value">${startStr}</td></tr>
              <tr><td class="col-label">MEMBERSHIP END</td><td class="col-value">${endStr}</td></tr>
              <tr><td class="col-label">PAYMENT DATE</td><td class="col-value">${paymentDateStr}</td></tr>
              <tr><td class="col-label">PAYMENT METHOD</td><td class="col-value">${formattedMethod}</td></tr>
              <tr>
                <td class="col-label">STATUS</td>
                <td>
                  <span class="status-badge">
                    <span class="status-dot"></span> Active
                  </span>
                </td>
              </tr>
    `;

    const footerContent = isPending ? `
              <h4 style="margin: 0 0 10px 0; color: #111;">Next Steps:</h4>
              <ol style="margin: 0 0 20px 0; padding-left: 20px; color: #444; font-size: 14px; line-height: 1.6;">
                <li>Visit <strong>Tara</strong> Fitness Centre reception.</li>
                <li>Inform the staff about this registration.</li>
                <li>Pay <strong>&#8377;${planPrice}</strong> in cash.</li>
                <li>Your membership will be activated immediately on payment.</li>
              </ol>
              <div style="background: #E8472A; color: white; padding: 12px 24px; border-radius: 6px; text-align: center; font-weight: bold; width: fit-content; margin: 0 auto 20px auto;">View Membership Plans</div>
              <p style="margin: 0; color: #888; font-size: 11px; text-align: center;">Your membership will only be activated after cash payment is received at the gym.</p>
    ` : `
              <p class="footer-msg">Your membership is now active! Visit us at the gym and our team will be happy to assist you in getting started.</p>
              <div class="footer-links">
                <div class="footer-link"><span class="square-bullet"></span> Shop No 1, Kalamba Road</div>
                <div class="footer-link"><span class="square-bullet"></span> Support: Message us on WhatsApp anytime</div>
              </div>
    `;

    const receiptNoStyle = isPending ? 'display: none;' : '';

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Arial, sans-serif; }
        .container { width: 100%; max-width: 800px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 24px rgba(0,0,0,0.10); }
        
        /* HEADER */
        .header { display: flex; position: relative; background: ${darkBg}; padding: 30px 40px; color: white; align-items: center; }
        .logo-container { margin-right: 25px; }
        .logo { width: 100px; height: 100px; border-radius: 50%; box-shadow: 0 0 15px rgba(232, 71, 42, 0.4); }
        .header-text { flex: 1; display: flex; flex-direction: column; justify-content: center; }
        .brand-title { font-size: 34px; font-weight: 900; font-family: 'Segoe UI Black', Arial, sans-serif; margin-bottom: 2px; }
        .brand-subtitle { color: ${primaryColor}; font-size: 16px; letter-spacing: 1px; margin-bottom: 8px; font-weight: 600; text-transform: uppercase; }
        .divider { background: ${primaryColor}; height: 3px; width: 100%; max-width: 380px; margin-bottom: 8px; }
        .contact-info { color: #aaaaaa; font-size: 13px; }
        
        .receipt-no { position: absolute; right: 40px; top: 35px; text-align: right; ${receiptNoStyle} }
        .receipt-label { color: ${primaryColor}; font-size: 13px; font-weight: bold; }
        .receipt-value { color: #ffffff; font-size: 18px; font-weight: bold; margin-top: 4px; }
        
        /* BODY */
        .content-wrapper { display: flex; }
        .red-border { width: 12px; background-color: ${primaryColor}; flex-shrink: 0; }
        .content { flex: 1; padding: 40px; background: white; }
        
        .title { margin: 0 0 8px 0; font-size: 32px; color: #111; font-weight: 800; }
        .receipt-tag { margin: 0 0 15px 0; font-size: 14px; font-weight: bold; color: ${primaryColor}; letter-spacing: 1px; text-transform: uppercase; }
        
        .greeting-box { background: #f8f9fa; padding: 16px 20px; border-radius: 6px; margin-bottom: 25px; }
        .greeting { margin: 0; color: #333; font-size: 15px; line-height: 1.6; }
        
        /* TABLE */
        .info-table { width: 100%; border-collapse: collapse; border: 1px solid #e0e0e0; margin-bottom: 35px; }
        .info-table td { padding: 16px 20px; border-bottom: 1px solid #eeeeee; }
        .info-table tr:nth-child(odd) td { background-color: #ffffff; }
        .info-table tr:nth-child(even) td { background-color: #f9f9f9; }
        .col-label { width: 40%; color: #888; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .col-value { color: #111; font-weight: bold; font-size: 15px; }
        
        .status-badge { background: #dcfce7; color: #16a34a; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: bold; display: inline-flex; align-items: center; gap: 6px; }
        .status-dot { width: 8px; height: 8px; background: #16a34a; border-radius: 2px; }
        
        /* FOOTER BOX */
        .footer-box { border: 2px solid ${isPending ? 'transparent' : primaryColor}; border-radius: 8px; padding: 24px; background: ${isPending ? 'white' : '#fffcfb'}; }
        .footer-msg { margin: 0 0 16px 0; color: #444; font-size: 14px; line-height: 1.5; }
        .footer-links { display: flex; gap: 24px; color: #888; font-size: 13px; }
        .footer-link { display: flex; align-items: center; gap: 8px; }
        .square-bullet { width: 8px; height: 8px; background: #888; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- HEADER -->
        <div class="header">
          <div class="logo-container">
            <img src="https://res.cloudinary.com/dn6nxrrot/image/upload/v1781240702/gym_assets/tara_fitness_logo.png" class="logo" />
          </div>
          <div class="header-text">
            <div class="brand-title">TARA FITNESS</div>
            <div class="brand-subtitle">ELITE FITNESS CENTRE</div>
            <div class="divider"></div>
            <div class="contact-info">Shop No 1, Kalamba Road | WhatsApp Support Available</div>
          </div>
          <div class="receipt-no">
            <div class="receipt-label">Receipt No.</div>
            <div class="receipt-value">${receiptNumber}</div>
          </div>
        </div>
        
        <!-- CONTENT -->
        <div class="content-wrapper">
          <div class="red-border"></div>
          <div class="content">
            <h1 class="title">${headerTitle}</h1>
            <p class="receipt-tag">${receiptTag}</p>
            ${pendingBadge}
            <div class="greeting-box">
              <p class="greeting">${greetingText}</p>
            </div>
            
            <table class="info-table">
              ${tableRows}
            </table>
            
            <div class="footer-box">
              ${footerContent}
            </div>
            
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
};

const verifyUrl = async (url, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            if (response.ok) return true;
        } catch (err) {
            console.error('Error verifying Cloudinary URL:', err);
        }
        await new Promise(res => setTimeout(res, 1000));
    }
    return false;
};

const generateAndUploadReceipt = async (paymentData) => {
    try {
        console.log('Generating PDF receipt for:', paymentData.userId, paymentData.paymentId);
        
        const html = getReceiptHTML(paymentData);
        
        const browser = await getBrowser();
        const page = await browser.newPage();
        
        // Wait until network is idle ensures styles are loaded
        await page.setContent(html, { waitUntil: 'networkidle2' });
        
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', bottom: '20px' }
        });
        
        await page.close();
        await browser.close();

        // Unique filename: receipt_[type]_[userId]_[paymentId]_[timestamp]
        const timestamp = Date.now();
        const rType = (paymentData.receiptType || 'CONFIRM').substring(0, 7);
        const filename = `receipt_${rType}_${paymentData.userId || 'user'}_${paymentData.paymentId || 'payment'}_${timestamp}`;

        console.log('Uploading PDF to Cloudinary as', filename);

        const secureUrl = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { 
                    folder: 'receipts', 
                    resource_type: 'raw', 
                    public_id: filename,
                    format: 'pdf'
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result.secure_url);
                }
            );
            uploadStream.end(pdfBuffer);
        });

        // Verify URL (don't throw if it fails, CDN might just be slow)
        console.log('Verifying uploaded PDF URL...', secureUrl);
        const isValid = await verifyUrl(secureUrl, 5);
        if (!isValid) {
            console.warn('⚠️ Cloudinary URL verification timed out, but proceeding anyway...');
        }

        console.log('✅ PDF successfully generated and uploaded:', secureUrl);
        return secureUrl;
        
    } catch (error) {
        console.error('❌ Failed to generate or upload receipt PDF:', error);
        throw error;
    }
};

module.exports = {
    generateAndUploadReceipt
};
