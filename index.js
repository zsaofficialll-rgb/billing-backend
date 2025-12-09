
import express from 'express';
import cors from 'cors';
import { JSONFilePreset } from 'lowdb/node';

// Start server function
export async function startServer(port = 3001, dbPath = 'db.json') {
  const app = express();

  // Middleware
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
  }));
  app.use(express.json());

  // Database setup
  const defaultData = { transactions: [], customers: [], roznamcha: [], bills: [], ponch: [] };
  const db = await JSONFilePreset(dbPath, defaultData);

  // Routes
  app.get('/', (req, res) => {
    res.send('Billing System API is running');
  });

  // Transactions (Cheera Zameedara - old format)
  app.get('/api/transactions', async (req, res) => {
    await db.read();
    res.json(db.data.transactions);
  });

  app.post('/api/transactions', async (req, res) => {
    try {
      await db.read();
      db.data.transactions = db.data.transactions || [];
      const transaction = { id: Date.now(), ...req.body };
      db.data.transactions.push(transaction);
      await db.write();
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Customers (Index)
  app.get('/api/customers', async (req, res) => {
    await db.read();
    res.json(db.data.customers);
  });

  app.post('/api/customers', async (req, res) => {
    try {
      await db.read();
      db.data.customers = db.data.customers || [];
      const customer = { id: Date.now(), ...req.body };
      db.data.customers.push(customer);
      await db.write();
      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Customer upsert (create or get existing)
  app.post('/api/customers/upsert', async (req, res) => {
    try {
      await db.read();
      db.data.customers = db.data.customers || [];
      const { name } = req.body;

      // Check if customer exists
      let customer = db.data.customers.find(c => c.name.toLowerCase() === name.toLowerCase());

      if (!customer) {
        // Create new customer
        customer = {
          id: Date.now(),
          name,
          createdAt: new Date().toISOString()
        };
        db.data.customers.push(customer);
        await db.write();
      }

      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update customer
  app.put('/api/customers/:id', async (req, res) => {
    try {
      await db.read();
      const customerId = req.params.id;
      const { name } = req.body;

      const customerIndex = db.data.customers.findIndex(c =>
        (c._id && c._id.toString() === customerId) ||
        (c.id && c.id.toString() === customerId)
      );

      if (customerIndex === -1) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      db.data.customers[customerIndex] = { ...db.data.customers[customerIndex], name };
      await db.write();
      res.json(db.data.customers[customerIndex]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete customer
  app.delete('/api/customers/:id', async (req, res) => {
    try {
      await db.read();
      db.data.customers = db.data.customers || [];
      const customerId = req.params.id;

      // Find the customer by id (check both _id and id)
      const customerIndex = db.data.customers.findIndex(c =>
        (c._id && c._id.toString() === customerId) ||
        (c.id && c.id.toString() === customerId)
      );

      if (customerIndex === -1) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // Remove customer
      db.data.customers.splice(customerIndex, 1);
      await db.write();
      res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Bills (Multi-item bills)
  app.get('/api/bills', async (req, res) => {
    await db.read();
    res.json(db.data.bills);
  });

  app.get('/api/bills/customer/:customerId', async (req, res) => {
    await db.read();
    const bills = db.data.bills.filter(b => b.customerId == req.params.customerId);
    res.json(bills);
  });

  app.get('/api/bills/customer-name/:customerName', async (req, res) => {
    await db.read();
    const customerName = decodeURIComponent(req.params.customerName);
    const bills = db.data.bills.filter(
      b => b.customerName.toLowerCase() === customerName.toLowerCase()
    );
    res.json(bills);
  });

  // Get single bill by ID
  app.get('/api/bills/:id', async (req, res) => {
    try {
      await db.read();
      const billId = req.params.id;
      const bill = db.data.bills.find(b => b.id.toString() === billId);

      if (!bill) {
        return res.status(404).json({ error: 'Bill not found' });
      }

      res.json(bill);
    } catch (error) {
      console.error('Error fetching bill:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all bills (for reports)
  app.get('/api/bills', async (req, res) => {
    try {
      await db.read();
      db.data.bills = db.data.bills || [];
      res.json(db.data.bills);
    } catch (error) {
      console.error('Error fetching bills:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/bills', async (req, res) => {
    try {
      await db.read();

      // Ensure bills array exists
      db.data.bills = db.data.bills || [];

      const bill = {
        id: Date.now(),
        billNumber: `BILL-${Date.now()}`,
        ...req.body
      };
      db.data.bills.push(bill);
      await db.write();
      res.json(bill);
    } catch (error) {
      console.error('Error saving bill:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Delete Bill
  app.delete('/api/bills/:id', async (req, res) => {
    try {
      await db.read();
      const billId = req.params.id;

      db.data.bills = db.data.bills || [];
      const initialLength = db.data.bills.length;

      // Filter out billing matching either number or string ID
      db.data.bills = db.data.bills.filter(b => b.id.toString() !== billId);

      if (db.data.bills.length < initialLength) {
        await db.write();
        res.json({ success: true, message: 'Bill deleted' });
      } else {
        res.status(404).json({ error: 'Bill not found' });
      }
    } catch (error) {
      console.error('Error deleting bill:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update Bill
  app.put('/api/bills/:id', async (req, res) => {
    try {
      await db.read();
      const billId = req.params.id;
      const billIndex = db.data.bills.findIndex(b => b.id.toString() === billId);

      if (billIndex === -1) {
        return res.status(404).json({ error: 'Bill not found' });
      }

      db.data.bills[billIndex] = { ...db.data.bills[billIndex], ...req.body };
      await db.write();
      res.json(db.data.bills[billIndex]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });


  // Roznamcha (Cash Book)
  app.get('/api/roznamcha', async (req, res) => {
    await db.read();
    res.json(db.data.roznamcha);
  });

  app.post('/api/roznamcha', async (req, res) => {
    try {
      await db.read();
      db.data.roznamcha = db.data.roznamcha || [];
      const entry = { id: Date.now(), ...req.body };
      db.data.roznamcha.push(entry);
      await db.write();
      res.json(entry);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update Roznamcha Entry
  app.put('/api/roznamcha/:id', async (req, res) => {
    try {
      await db.read();
      const entryId = req.params.id;
      const entryIndex = db.data.roznamcha.findIndex(e => e.id.toString() === entryId);

      if (entryIndex === -1) {
        return res.status(404).json({ error: 'Entry not found' });
      }

      db.data.roznamcha[entryIndex] = { ...db.data.roznamcha[entryIndex], ...req.body };
      await db.write();
      res.json(db.data.roznamcha[entryIndex]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete Roznamcha Entry
  app.delete('/api/roznamcha/:id', async (req, res) => {
    try {
      await db.read();
      const entryId = req.params.id;

      const initialLength = db.data.roznamcha.length;
      db.data.roznamcha = db.data.roznamcha.filter(e => e.id.toString() !== entryId);

      if (db.data.roznamcha.length < initialLength) {
        await db.write();
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Entry not found' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Ponch Book (Receipts)
  app.get('/api/ponch', async (req, res) => {
    await db.read();
    res.json(db.data.ponch);
  });

  app.post('/api/ponch', async (req, res) => {
    try {
      await db.read();
      db.data.ponch = db.data.ponch || [];
      const receipt = { id: Date.now(), ...req.body };
      db.data.ponch.push(receipt);
      await db.write();
      res.json(receipt);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return new Promise((resolve) => {
    // Listen on 0.0.0.0 to accept connections from all local interfaces
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`Server running at http://127.0.0.1:${port}`);
      resolve(server);
    });
  });
}

// Check if running directly
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}
