
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Database Connection (Serverless Optimized)
const MONGODB_URI = process.env.MONGODB_URI;

let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) return;

  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined in environment variables');
    return;
  }

  try {
    const db = await mongoose.connect(MONGODB_URI);
    isConnected = db.connections[0].readyState;
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

// Middleware to ensure DB connection on every request
app.use(async (req, res, next) => {
  await connectToDatabase();
  next();
});

// Schemas
const CustomerSchema = new mongoose.Schema({
  name: String,
  phone: String,
  address: String,
  createdAt: { type: Date, default: Date.now }
});

const RoznamchaSchema = new mongoose.Schema({
  type: String, // DEBIT, CREDIT
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
  type: String, // Bazar Bill, Cheera Zameedara
  customerId: String,
  customerName: String,
  date: String,
  items: Array,
  totals: Object, // For Bazar Bill
  calculations: Object, // For Cheera Zameedara
  manualMazduri: String,
  itemConfig: Object,
  timestamp: { type: Date, default: Date.now }
});

const PonchSchema = new mongoose.Schema({
  createdAt: { type: Date, default: Date.now }
});

// Models - check if model exists before compiling to avoid OverwriteModelError
const Customer = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
const Roznamcha = mongoose.models.Roznamcha || mongoose.model('Roznamcha', RoznamchaSchema);
const Bill = mongoose.models.Bill || mongoose.model('Bill', BillSchema);
const Ponch = mongoose.models.Ponch || mongoose.model('Ponch', PonchSchema);

// Routes
app.get('/', (req, res) => {
  res.send('Billing System API is running on Vercel/MongoDB');
});

// --- Customers ---
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

// --- Bills ---
app.get('/api/bills', async (req, res) => {
  try {
    const bills = await Bill.find();
    res.json(bills);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/bills/:id', async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    res.json(bill);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/bills', async (req, res) => {
  try {
    const bill = new Bill({
      ...req.body,
      billNumber: `BILL-${Date.now()}`
    });
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

// --- Roznamcha ---
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

app.put('/api/roznamcha/:id', async (req, res) => {
  try {
    const entry = await Roznamcha.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(entry);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Export key for Vercel
export default app;
