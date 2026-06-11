const puppeteer = require('puppeteer');
const cloudinary = require('../config/cloudinary');

let browserInstance = null;

const getBrowser = async () => {
    if (browserInstance && browserInstance.isConnected()) {
        return browserInstance;
    }
    
    // Relaunch if null or disconnected
    console.log('🚀 Launching new Puppeteer instance...');
    browserInstance = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage',
            '--single-process'
        ]
    });
    return browserInstance;
};

const getReceiptHTML = (data) => {
    const primaryColor = '#E8472A';
    const darkBg = '#1a1a1a';
    
    const {
        userName = 'Member',
        planName = 'N/A',
        planPrice = 0,
        startDate = new Date(),
        endDate = new Date(),
        paymentDate = new Date(),
        paymentMethod = 'UPI'
    } = data;

    const startStr = new Date(startDate).toLocaleDateString('en-IN');
    const endStr = new Date(endDate).toLocaleDateString('en-IN');
    const paymentDateStr = new Date(paymentDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    
    const formattedMethod = paymentMethod === 'cash_on_bench' ? 'Cash' : 
                            paymentMethod === 'pay_later' ? 'Pay Later' : 'UPI';

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Arial, sans-serif; }
        .container { width: 100%; max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.10); }
        
        /* HEADER */
        .header { background: linear-gradient(135deg, ${darkBg} 0%, #2d1f1a 50%, #3a1a0e 100%); padding: 36px 40px; text-align: center; }
        .logo-text { font-size: 28px; font-weight: 900; letter-spacing: 2px; font-family: 'Segoe UI Black', Arial, sans-serif; display: inline-block; margin-bottom: 12px; }
        .logo-brand { color: ${primaryColor}; }
        .logo-fitness { color: #ffffff; }
        .divider-short { width: 50px; height: 3px; background: ${primaryColor}; margin: 0 auto; border-radius: 2px; }
        .subtitle { font-size: 11px; color: #aaaaaa; letter-spacing: 3px; text-transform: uppercase; margin-top: 8px; }
        
        /* BODY */
        .content { padding: 40px 40px 32px 40px; }
        .title { margin: 0 0 8px 0; font-size: 26px; font-weight: 800; color: #1a1a1a; line-height: 1.3; }
        .receipt-tag { margin: 0 0 24px 0; font-size: 14px; color: ${primaryColor}; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
        .greeting { margin: 0 0 16px 0; font-size: 15px; color: #444444; line-height: 1.7; }
        
        /* TABLE */
        .info-table { width: 100%; border-collapse: collapse; background: #f9f9f9; border-radius: 8px; border: 1px solid #eeeeee; margin: 20px 0; overflow: hidden; }
        .info-table td { padding: 12px 16px; border-bottom: 1px solid #eeeeee; }
        .info-table tr:last-child td { border-bottom: none; }
        .col-label { width: 38%; font-size: 13px; color: #888; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .col-value { font-size: 14px; color: #333; font-weight: 500; }
        
        .status-badge { display: inline-block; background: #16a34a; color: #fff; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px; }
        
        /* FOOTER */
        .footer { background-color: #f8f8f8; padding: 24px 40px; border-top: 2px solid #eeeeee; text-align: center; }
        .address { margin: 0 0 8px 0; font-size: 13px; color: #888888; }
        .support { margin: 0; font-size: 11px; color: #aaaaaa; }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- HEADER -->
        <div class="header">
          <div class="logo-text"><span class="logo-brand">TARA</span><span class="logo-fitness"> FITNESS</span></div>
          <div class="divider-short"></div>
          <div class="subtitle">Elite Fitness Centre</div>
        </div>
        
        <!-- CONTENT -->
        <div class="content">
          <h1 class="title">Payment Confirmed! 🎉</h1>
          <p class="receipt-tag">MEMBERSHIP RECEIPT</p>
          <p class="greeting">Hi <strong>${userName}</strong>, your payment has been successfully processed.<br/>Welcome to your new membership!</p>
          
          <table class="info-table">
            <tr><td class="col-label">Member Name</td><td class="col-value">${userName}</td></tr>
            <tr><td class="col-label">Package</td><td class="col-value">${planName}</td></tr>
            <tr><td class="col-label">Amount Paid</td><td class="col-value">₹${planPrice}</td></tr>
            <tr><td class="col-label">Membership Start</td><td class="col-value">${startStr}</td></tr>
            <tr><td class="col-label">Membership End</td><td class="col-value">${endStr}</td></tr>
            <tr><td class="col-label">Payment Date</td><td class="col-value">${paymentDateStr}</td></tr>
            <tr><td class="col-label">Payment Method</td><td class="col-value">${formattedMethod}</td></tr>
            <tr><td class="col-label">Status</td><td class="col-value"><span class="status-badge">✅ Active</span></td></tr>
          </table>
          
          <p class="greeting">Your membership is now active! Visit us at the gym and our team will be happy to assist you in getting started.</p>
        </div>
        
        <!-- FOOTER -->
        <div class="footer">
          <p class="address">📍 Shop No 1, Kalamba Road | Tara Fitness Centre</p>
          <p class="support">Feel free to message us on WhatsApp anytime for support.</p>
        </div>
      </div>
    </body>
    </html>
    `;
};

const verifyUrl = async (url) => {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok; // returns true if status is 200-299
    } catch (err) {
        console.error('Error verifying Cloudinary URL:', err);
        return false;
    }
};

const generateAndUploadReceipt = async (paymentData) => {
    try {
        console.log('Generating PDF receipt for:', paymentData.userId, paymentData.paymentId);
        
        const html = getReceiptHTML(paymentData);
        
        const browser = await getBrowser();
        const page = await browser.newPage();
        
        // Wait until network is idle ensures styles are loaded
        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', bottom: '20px' }
        });
        
        await page.close();

        // Unique filename: receipt_[userId]_[paymentId]_[timestamp]
        const timestamp = Date.now();
        const filename = \`receipt_\${paymentData.userId || 'user'}_\${paymentData.paymentId || 'payment'}_\${timestamp}\`;

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

        // Verify URL
        console.log('Verifying uploaded PDF URL...', secureUrl);
        const isValid = await verifyUrl(secureUrl);
        if (!isValid) {
            throw new Error('Cloudinary URL verification failed (non-200 OK)');
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
