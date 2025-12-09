
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/billing_system';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

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
  // Define fields as needed
  createdAt: { type: Date, default: Date.now }
});

// Models
const Customer = mongoose.model('Customer', CustomerSchema);
const Roznamcha = mongoose.model('Roznamcha', RoznamchaSchema);
const Bill = mongoose.model('Bill', BillSchema);
const Ponch = mongoose.model('Ponch', PonchSchema);

// Start server function
export async function startServer(port = 3001) {
  const app = express();

  // Middleware
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
  }));
  app.use(express.json());

  // Routes
  app.get('/', (req, res) => {
    res.send('Billing System API is running on Cloud DB');
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

  // Listen
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://127.0.0.1:${port}`);
  });
  return server;
}

// Check if running directly
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer(process.env.PORT || 3001);
}
