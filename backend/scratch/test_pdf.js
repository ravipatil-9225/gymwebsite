const { generateAndUploadReceipt } = require('../services/generateReceiptPDF');

async function test() {
    try {
        console.log("Generating CONFIRMATION...");
        const url1 = await generateAndUploadReceipt({
            receiptType: 'CONFIRMATION',
            userId: 'test_user_id',
            paymentId: 'test_payment_id_1',
            userName: 'Test User',
            planName: 'Starter Trial Pass',
            planPrice: 10,
            startDate: new Date(),
            endDate: new Date(Date.now() + 30*24*60*60*1000),
            paymentDate: new Date(),
            paymentMethod: 'upi'
        });
        console.log("CONFIRMATION URL:", url1);

        console.log("Generating CASH PENDING...");
        const url2 = await generateAndUploadReceipt({
            receiptType: 'CASH_PENDING',
            userId: 'test_user_id',
            paymentId: 'test_payment_id_2',
            userName: 'Raviraj Amol Patil',
            planName: 'Starter Trial Pass',
            planPrice: 10,
            paymentDate: new Date(),
            paymentMethod: 'cash_on_bench'
        });
        console.log("CASH PENDING URL:", url2);

    } catch(err) {
        console.error(err);
    }
}
test();
