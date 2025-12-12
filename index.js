
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const MONGODB_URI = 'mongodb+srv://superadmin:super123@cluster0.kkfbjfx.mongodb.net/billing_system?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Error:', err));

// Schemas
const CustomerSchema = new mongoose.Schema({
    name: String,
    phone: String,
    address: String,
    createdAt: { type: Date, default: Date.now }
});

const RoznamchaSchema = new mongoose.Schema({
    type: String,
    pageNo: String,
    checkNo: String,
    name: String,
    description: String,
    debit: String,
    credit: String,
    amount: Number,
    date: String,
    entryCode: String,
    createdAt: { type: Date, default: Date.now }
});

const BillSchema = new mongoose.Schema({
    billNumber: String,
    type: String,
    customerId: String,
    customerName: String,
    date: String,
    items: Array,
    totals: Object,
    calculations: Object,
    manualMazduri: String,
    itemConfig: Object,
    timestamp: { type: Date, default: Date.now }
});

const PonchBookSchema = new mongoose.Schema({
    ponchNumber: String,
    billNumber: String,
    customerName: String,
    amount: Number,
    date: String,
    createdAt: { type: Date, default: Date.now }
});

const Customer = mongoose.model('Customer', CustomerSchema);
const Roznamcha = mongoose.model('Roznamcha', RoznamchaSchema);
const Bill = mongoose.model('Bill', BillSchema);
const PonchBook = mongoose.model('PonchBook', PonchBookSchema);

// Routes
app.get('/api/customers', async (req, res) => {
    try {
        const customers = await Customer.find();
        res.json(customers);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/customers/upsert', async (req, res) => {
    try {
        const { name } = req.body;
        let customer = await Customer.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (!customer) {
            customer = new Customer({ name });
            await customer.save();
        }
        res.json(customer);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/customers/:id', async (req, res) => {
    try {
        await Customer.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/bills', async (req, res) => {
    try {
        const bills = await Bill.find();
        res.json(bills);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/bills/:id', async (req, res) => {
    try {
        const bill = await Bill.findById(req.params.id);
        if (bill) {
            res.json(bill);
        } else {
            res.status(404).json({ error: 'Bill not found' });
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/bills', async (req, res) => {
    try {
        const bill = new Bill({ ...req.body, billNumber: `BILL-${Date.now()}` });
        await bill.save();
        res.json(bill);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/bills/:id', async (req, res) => {
    try {
        await Bill.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Get bills by customer name
app.get('/api/bills/customer-name/:name', async (req, res) => {
    try {
        const customerName = decodeURIComponent(req.params.name);
        const bills = await Bill.find({
            customerName: { $regex: new RegExp(`^${customerName}$`, 'i') }
        });
        res.json(bills);
    } catch (e) { res.status(500).json({ error: e.message }); }
});


app.get('/api/roznamcha', async (req, res) => {
    try {
        const entries = await Roznamcha.find();
        res.json(entries);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/roznamcha', async (req, res) => {
    try {
        const entry = new Roznamcha(req.body);
        await entry.save();
        res.json(entry);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/roznamcha/:id', async (req, res) => {
    try {
        await Roznamcha.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/ponch', async (req, res) => {
    try {
        const entries = await PonchBook.find().sort({ createdAt: -1 });
        res.json(entries);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/ponch', async (req, res) => {
    try {
        const entry = new PonchBook(req.body);
        await entry.save();
        res.json(entry);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/ponch/:id', async (req, res) => {
    try {
        await PonchBook.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Clear all data endpoint
app.delete('/api/clear-all-data', async (req, res) => {
    try {
        await Bill.deleteMany({});
        await Roznamcha.deleteMany({});
        await PonchBook.deleteMany({});
        await Customer.deleteMany({});
        res.json({ success: true, message: 'All data cleared' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});


// Serve Static Assets (Production)
app.use(express.static(path.join(__dirname, '../client/dist')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
