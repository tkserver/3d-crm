# Zeppa CRM - 3D Print Order Tracking System

A clean, minimal, production-ready internal web app for tracking custom 3D printed product orders with shipping support.

## Features

- **Customers** - Create and manage customer information
- **Addresses** - Manage multiple shipping addresses per customer
- **Orders** - Create, edit, and track orders with status workflow (NEW → QUEUED → PRINTING → COMPLETE → SHIPPED)
- **Order Items** - Add multiple items per order with product details
- **Print Jobs** - Track print jobs for each order item with printer and timing information
- **Dashboard** - Quick overview of all orders by status and active print jobs

## Tech Stack

- **Frontend**: React (Vite) - Plain JavaScript, no TypeScript
- **Backend**: Node.js with Express
- **Database**: SQLite
- **Styling**: Plain CSS (no Tailwind, no component libraries)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd zeppa-crm
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### Running the Application

#### Option 1: Run backend and frontend separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

The backend API will start on `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173` (or another port if 5173 is taken)

#### Option 2: Run both together

From the project root:

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

## API Endpoints

### Customers
- `GET /api/customers` - List all customers
- `POST /api/customers` - Create a new customer
- `PUT /api/customers/:id` - Update a customer
- `DELETE /api/customers/:id` - Delete a customer

### Addresses
- `GET /api/addresses` - List all addresses
- `GET /api/addresses/customer/:customerId` - Get addresses for a customer
- `POST /api/addresses` - Create a new address
- `PUT /api/addresses/:id` - Update an address
- `DELETE /api/addresses/:id` - Delete an address

### Orders
- `GET /api/orders` - List all orders (supports `?status=` filter)
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create a new order
- `PUT /api/orders/:id` - Update an order
- `DELETE /api/orders/:id` - Delete an order

### Order Items
- `GET /api/orders/:id/items` - Get items for an order
- `POST /api/orders/:id/items` - Add item to order
- `PUT /api/order-items/:id` - Update an order item
- `DELETE /api/order-items/:id` - Delete an order item

### Print Jobs
- `GET /api/order-items/:id/print-jobs` - Get print jobs for an order item
- `POST /api/order-items/:id/print-jobs` - Create a print job
- `PUT /api/print-jobs/:id` - Update a print job
- `DELETE /api/print-jobs/:id` - Delete a print job

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics (order counts by status, active print jobs)

## Project Structure

```
zeppa-crm/
├── backend/
│   ├── src/
│   │   ├── server.js      # Express server with all API routes
│   │   └── db.js          # SQLite database initialization and schema
│   ├── package.json
│   └── orders.db          # SQLite database (created automatically)
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Customers.jsx
│   │   │   ├── Orders.jsx
│   │   │   └── OrderDetail.jsx
│   │   ├── App.jsx        # Main app component with routing
│   │   ├── main.jsx       # React entry point
│   │   └── index.css      # Global styles
│   ├── package.json
│   └── vite.config.js     # Vite configuration with API proxy
└── README.md
```

## Database Schema

The SQLite database includes the following tables:

- **customers** - Customer information (name, email, phone)
- **addresses** - Shipping addresses linked to customers
- **orders** - Order records with status tracking
- **order_items** - Individual items within orders
- **print_jobs** - Print job tracking linked to order items

## Development Notes

- No TypeScript is used - plain JavaScript only
- No Tailwind CSS or component libraries - clean, minimal plain CSS
- Single-user system (no authentication)
- Mobile responsive design using flexbox and grid

## License

MIT
