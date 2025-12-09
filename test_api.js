import fetch from 'node-fetch';

const testBill = {
    customerName: "Test Customer",
    date: "2025-11-29",
    items: [
        {
            item: "خجور",
            quantity: "1",
            weightKg: "40",
            weightMan: "0",
            rate: "1000",
            totalWeightKg: 40,
            totalWeightMan: 1,
            baseAmount: 1000,
            bardanaTotal: 0,
            subtotal: 1000,
            itemConfig: { name: 'خجور (Khajoor)', bardana: 0, mazduri: 70 }
        }
    ],
    calculations: {
        totalSubtotal: 1000,
        commission: 100,
        afterCommission: 900,
        bt: 5.4,
        totalMazduri: 70,
        dalali: 9,
        marketFee: 1,
        totalCharges: 85.4,
        netAmount: 814.6
    }
};

async function testSave() {
    try {
        // 1. Upsert Customer
        const custRes = await fetch('http://localhost:3001/api/customers/upsert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: testBill.customerName })
        });
        const customer = await custRes.json();
        console.log('Customer saved:', customer);

        // 2. Save Bill
        const billRes = await fetch('http://localhost:3001/api/bills', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerId: customer.id,
                ...testBill
            })
        });
        const bill = await billRes.json();
        console.log('Bill saved:', bill);
    } catch (error) {
        console.error('Error:', error);
    }
}

testSave();
