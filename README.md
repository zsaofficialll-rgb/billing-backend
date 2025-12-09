# Billing Management System - Backend

## API Endpoints

### Customers
- GET /api/customers - Get all customers
- POST /api/customers/upsert - Create/update customer

### Bills
- GET /api/bills - Get all bills
- GET /api/bills/:id - Get bill by ID
- POST /api/bills - Create new bill
- PUT /api/bills/:id - Update bill
- DELETE /api/bills/:id - Delete bill

### Roznamcha (Cashbook)
- GET /api/roznamcha - Get all entries
- POST /api/roznamcha - Create entry
- PUT /api/roznamcha/:id - Update entry
- DELETE /api/roznamcha/:id - Delete entry

## Deployment
Deployed on Railway.app

## Database
Uses LowDB (JSON file-based database)

