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

const getReceiptHTML = (data, type) => {
    const isPending = type === 'pending';
    const primaryColor = isPending ? '#F59E0B' : '#E8472A';
    const darkBg = '#1a1a1a';
    const goldColor = '#C9A84C';
    
    const {
        userName = 'Member',
        planName = 'N/A',
        amount = 0,
        startDate = null,
        endDate = null,
        paymentDate = new Date(),
        paymentMethod = 'Cash',
        receiptNo = 'TF-0000-00000',
        status = isPending ? 'Pending Verification' : 'Active'
    } = data;

    const paymentDateStr = new Date(paymentDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    
    // Format dates or show "—"
    const startStr = isPending || !startDate ? '—' : new Date(startDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
    const endStr = isPending || !endDate ? '—' : new Date(endDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });

    const headerTitle = isPending ? `Payment Received <span style="display:inline-block; width: 24px; height: 24px; background: #F59E0B; border-radius: 50%; color: white; text-align: center; line-height: 24px; font-size: 16px; margin-left: 10px;">■</span>` : `Payment Confirmed! <svg width="32" height="32" viewBox="0 0 24 24" fill="#22c55e" xmlns="http://www.w3.org/2000/svg" style="vertical-align: text-bottom; margin-left: 8px;">
                <circle cx="12" cy="12" r="12" fill="#22c55e"/>
                <path d="M7 12.5L10 15.5L17 8.5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>`;
              
    const receiptTag = isPending ? 'AWAITING VERIFICATION' : 'MEMBERSHIP RECEIPT';

    const greetingText = isPending 
        ? `Hi <strong>${userName}</strong>,<br/>we've received your cash payment request. Our team will verify it shortly and your membership will be activated upon confirmation.`
        : `Hi <strong>${userName}</strong>,<br/>your payment has been successfully processed. Welcome to your new membership!`;

    const tableRows = isPending ? `
              <tr><td class="col-label">MEMBER NAME</td><td class="col-value">${userName}</td></tr>
              <tr><td class="col-label">PACKAGE REQUESTED</td><td class="col-value">${planName}</td></tr>
              <tr><td class="col-label">AMOUNT</td><td class="col-value"><span style="font-family: sans-serif;">&#8377;</span>${amount}</td></tr>
              <tr><td class="col-label">REQUEST DATE</td><td class="col-value">${paymentDateStr}</td></tr>
              <tr><td class="col-label">PAYMENT METHOD</td><td class="col-value">${paymentMethod}</td></tr>
              <tr>
                <td class="col-label">STATUS</td>
                <td><span class="status-badge" style="background: #fef3c7; color: #b45309;"><span class="status-dot" style="background: #d97706;"></span> ${status}</span></td>
              </tr>
    ` : `
              <tr><td class="col-label">MEMBER NAME</td><td class="col-value">${userName}</td></tr>
              <tr><td class="col-label">PACKAGE</td><td class="col-value">${planName}</td></tr>
              <tr><td class="col-label">AMOUNT PAID</td><td class="col-value"><span style="font-family: sans-serif;">&#8377;</span>${amount}</td></tr>
              <tr><td class="col-label">MEMBERSHIP START</td><td class="col-value">${startStr}</td></tr>
              <tr><td class="col-label">MEMBERSHIP END</td><td class="col-value">${endStr}</td></tr>
              <tr><td class="col-label">PAYMENT DATE</td><td class="col-value">${paymentDateStr}</td></tr>
              <tr><td class="col-label">PAYMENT METHOD</td><td class="col-value">${paymentMethod}</td></tr>
              <tr>
                <td class="col-label">STATUS</td>
                <td>
                  <span class="status-badge">
                    <span class="status-dot"></span> ${status}
                  </span>
                </td>
              </tr>
    `;

    const footerContent = isPending ? `
              <h4 style="margin: 0 0 10px 0; color: #b45309; font-size: 15px;">What happens next?</h4>
              <p style="margin: 0 0 6px 0; color: #333; font-size: 13px;">• Please complete your cash payment at the gym reception if you haven't already.</p>
              <p style="margin: 0 0 6px 0; color: #333; font-size: 13px;">• Our staff will verify your payment and activate your membership.</p>
              <p style="margin: 0; color: #333; font-size: 13px;">• You'll receive a confirmation receipt on WhatsApp once verified.</p>
    ` : `
              <p class="footer-msg">Your membership is now active! Visit us at the gym and our team will be happy to assist you in getting started.</p>
              <div class="footer-links">
                <div class="footer-link"><span class="square-bullet"></span> Shop No 1, Kalamba Road</div>
                <div class="footer-link"><span class="square-bullet"></span> Support: Message us on WhatsApp anytime</div>
              </div>
    `;

    const bottomBandText = isPending 
        ? 'Questions about your payment? Message us on WhatsApp anytime — we\'re happy to help! <span class="square-bullet" style="background:#888;"></span>' 
        : 'Thank you for choosing Tara Fitness Centre — Let\'s make every workout count! <span class="square-bullet" style="background:#888;"></span>';

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        body { margin: 0; padding: 0; background-color: #f9fafb; font-family: 'Segoe UI', Arial, sans-serif; display: flex; flex-direction: column; min-height: 1122px; /* A4 height approx */ }
        .container { width: 100%; max-width: 800px; margin: 0 auto; background-color: #ffffff; flex: 1; display: flex; flex-direction: column; }
        
        /* HEADER */
        .header-top-gold { height: 6px; background-color: ${goldColor}; width: 100%; }
        .header { display: flex; position: relative; background: ${darkBg}; padding: 35px 45px; color: white; align-items: center; }
        .logo-container { margin-right: 30px; }
        .logo { width: 110px; height: 110px; border-radius: 50%; box-shadow: 0 0 20px rgba(201, 168, 76, 0.2); border: 2px solid #333; }
        .header-text { flex: 1; display: flex; flex-direction: column; justify-content: center; }
        .brand-title { font-size: 36px; font-weight: 900; font-family: 'Segoe UI Black', Arial, sans-serif; margin-bottom: 4px; letter-spacing: 0.5px; }
        .brand-subtitle { color: ${goldColor}; font-size: 15px; letter-spacing: 1.5px; margin-bottom: 12px; font-weight: 600; text-transform: uppercase; }
        .divider { background: #444; height: 1px; width: 100%; max-width: 380px; margin-bottom: 10px; }
        .contact-info { color: #aaaaaa; font-size: 12px; }
        
        .receipt-no { position: absolute; right: 45px; top: 40px; text-align: right; }
        .receipt-label { color: ${goldColor}; font-size: 12px; font-weight: bold; margin-bottom: 4px; }
        .receipt-value { color: #ffffff; font-size: 16px; font-weight: bold; font-family: monospace; }
        
        /* BODY */
        .content-wrapper { display: flex; flex: 1; }
        .side-border { width: 10px; background-color: ${primaryColor}; flex-shrink: 0; }
        .content { flex: 1; padding: 40px 45px; background: white; }
        
        .title { margin: 0 0 8px 0; font-size: 32px; color: #111; font-weight: 800; display: flex; align-items: center; }
        .receipt-tag { margin: 0 0 25px 0; font-size: 14px; font-weight: bold; color: ${primaryColor}; letter-spacing: 1px; text-transform: uppercase; }
        
        .greeting-box { background: #f9fafb; padding: 16px 0px; border-radius: 0px; margin-bottom: 30px; }
        .greeting { margin: 0; color: #333; font-size: 15px; line-height: 1.6; }
        
        /* TABLE */
        .info-table { width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; margin-bottom: 40px; }
        .info-table td { padding: 18px 24px; border-bottom: 1px solid #f3f4f6; }
        .info-table tr:nth-child(odd) td { background-color: #ffffff; }
        .info-table tr:nth-child(even) td { background-color: #f9fafb; }
        .col-label { width: 40%; color: #9ca3af; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .col-value { color: #1f2937; font-weight: 700; font-size: 15px; }
        
        .status-badge { background: #dcfce7; color: #16a34a; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: bold; display: inline-flex; align-items: center; gap: 6px; }
        .status-dot { width: 8px; height: 8px; background: #16a34a; border-radius: 2px; }
        
        /* FOOTER BOX */
        .footer-box { border: 2px solid ${isPending ? '#fcd34d' : primaryColor}; border-radius: 8px; padding: 24px; background: ${isPending ? '#fef3c7' : '#fffcfb'}; }
        .footer-msg { margin: 0 0 16px 0; color: #444; font-size: 14px; line-height: 1.5; }
        .footer-links { display: flex; gap: 24px; color: #888; font-size: 13px; }
        .footer-link { display: flex; align-items: center; gap: 8px; }
        .square-bullet { width: 6px; height: 6px; background: #888; display: inline-block; }
        
        /* BOTTOM BAND */
        .bottom-band { background: ${darkBg}; padding: 20px; text-align: center; border-top: 4px solid ${goldColor}; margin-top: auto; }
        .bottom-text { color: #9ca3af; font-size: 12px; margin: 0 0 8px 0; }
        .bottom-links { color: ${goldColor}; font-size: 11px; font-weight: 600; }
        .bottom-links a { color: ${goldColor}; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- HEADER -->
        <div class="header-top-gold"></div>
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
            <div class="receipt-label">${isPending ? 'Reference No.' : 'Receipt No.'}</div>
            <div class="receipt-value">${receiptNo}</div>
          </div>
        </div>
        
        <!-- CONTENT -->
        <div class="content-wrapper">
          <div class="side-border"></div>
          <div class="content">
            <h1 class="title">${headerTitle}</h1>
            <p class="receipt-tag">${receiptTag}</p>
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
        
        <!-- BOTTOM BAND -->
        <div class="bottom-band">
          <p class="bottom-text">${bottomBandText}</p>
          <div class="bottom-links">
            <a href="https://www.tarafitness.in">www.tarafitness.in</a> | Shop No 1, Kalamba Road
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

const generateAndUploadReceipt = async (paymentData, type) => {
    let browser = null;
    try {
        console.log(`Generating ${type} PDF receipt for:`, paymentData.userId, paymentData.paymentId);
        
        const html = getReceiptHTML(paymentData, type);
        
        const generatePromise = (async () => {
            browser = await getBrowser();
            const page = await browser.newPage();
            
            page.setDefaultNavigationTimeout(30000);
            page.setDefaultTimeout(30000);
            
            await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
            
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                timeout: 30000
            });
            
            await page.close();
            await browser.close();
            browser = null; // Mark browser as closed/cleaned up
            return pdfBuffer;
        })();

        // Race browser execution against a 45s timeout
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('PDF generation/rendering timed out')), 45000)
        );

        const pdfBuffer = await Promise.race([generatePromise, timeoutPromise]);

        const timestamp = Date.now();
        const filename = `receipt_${type}_${paymentData.userId || 'user'}_${paymentData.paymentId || 'payment'}_${timestamp}`;

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

        console.log('Verifying uploaded PDF URL...', secureUrl);
        const isValid = await verifyUrl(secureUrl, 5);
        if (!isValid) {
            console.warn("⚠️ Cloudinary URL not immediately accessible, but proceeding anyway. CDN might be delayed.");
        }

        console.log('✅ PDF successfully generated and uploaded:', secureUrl);
        return secureUrl;
        
    } catch (error) {
        console.error('❌ Failed to generate or upload receipt PDF:', error);
        if (browser) {
            try {
                await browser.close();
            } catch (closeErr) {
                console.error('Failed to close browser during cleanup:', closeErr.message);
            }
        }
        throw error;
    }
};

module.exports = {
    generateAndUploadReceipt
};
