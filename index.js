
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// --- ROBUST DATABASE CONNECTION (VERCEL OPTIMIZED) ---
const MONGODB_URI = 'mongodb+srv://superadmin:super123@cluster0.kkfbjfx.mongodb.net/billing_system?retryWrites=true&w=majority';

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is missing in environment variables!");
}

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // FAIL FAST: Don't wait 10s if disconnected
      serverSelectionTimeoutMS: 5000, // Timeout after 5s
    };

    console.log('Connecting to MongoDB...');
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ MongoDB Connected Successfully');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('❌ MongoDB Connection Error:', e);
    throw e;
  }

  return cached.conn;
}

// Middleware: Connect on every request
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    res.status(500).json({ error: `Database Connection Failed: ${error.message}` });
  }
});

// --- SCHEMAS ---
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

// Models (Use existing if compiled)
const Customer = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
const Roznamcha = mongoose.models.Roznamcha || mongoose.model('Roznamcha', RoznamchaSchema);
const Bill = mongoose.models.Bill || mongoose.model('Bill', BillSchema);

// --- ROUTES ---
app.get('/', (req, res) => res.send('Billing System Backend Online (Optimized v2)'));

// Customers
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

// Bills
app.get('/api/bills', async (req, res) => {
  try {
    const bills = await Bill.find();
    res.json(bills);
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

// Roznamcha
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

// Export default for Vercel
export default app;
