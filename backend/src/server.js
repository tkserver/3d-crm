const express = require('express');
const { db, initDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

initDB();

// Categories CRUD
app.get('/api/categories', (req, res) => {
  db.all('SELECT * FROM categories ORDER BY name', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/categories', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  db.run('INSERT INTO categories (name) VALUES (?)', [name], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, name });
  });
});

app.delete('/api/categories/:id', (req, res) => {
  db.run('DELETE FROM categories WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: true });
  });
});

// Materials CRUD
app.get('/api/materials', (req, res) => {
  db.all('SELECT * FROM materials ORDER BY name', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/materials', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  db.run('INSERT INTO materials (name) VALUES (?)', [name], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, name });
  });
});

app.delete('/api/materials/:id', (req, res) => {
  db.run('DELETE FROM materials WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: true });
  });
});

app.get('/api/products', (req, res) => {
  const { search, category, sort = 'name', order = 'asc', page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  
  let whereClause = '';
  const params = [];
  
  if (search) {
    whereClause += ' WHERE name LIKE ?';
    params.push(`%${search}%`);
  }
  
  if (category) {
    whereClause += whereClause ? ' AND category = ?' : ' WHERE category = ?';
    params.push(category);
  }
  
  const validSortFields = ['name', 'price', 'category'];
  const sortField = validSortFields.includes(sort) ? sort : 'name';
  const sortOrder = order === 'desc' ? 'DESC' : 'ASC';
  
  db.all(
    `SELECT * FROM products${whereClause} ORDER BY ${sortField} ${sortOrder} LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), offset],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      
      db.get(`SELECT COUNT(*) as total FROM products${whereClause}`, params, (err, countRow) => {
        if (err) return res.status(500).json({ error: err.message });
        
        db.all('SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category', [], (err, categories) => {
          if (err) return res.status(500).json({ error: err.message });
          
          res.json({
            products: rows,
            pagination: {
              total: countRow ? countRow.total : 0,
              page: parseInt(page),
              limit: parseInt(limit),
              totalPages: Math.ceil((countRow ? countRow.total : 0) / limit)
            },
            categories: categories.map(c => c.category)
          });
        });
      });
    }
  );
});

app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row);
  });
});

app.post('/api/products', (req, res) => {
  const { name, description, category, price, material, size, image_url } = req.body;
  db.run(
    'INSERT INTO products (name, description, category, price, material, size, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, description || '', category || '', price || 0, material || '', size || '', image_url || ''],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, name, description, category, price, material, size, image_url });
    }
  );
});

app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, category, price, material, size, image_url } = req.body;
  db.run(
    'UPDATE products SET name = ?, description = ?, category = ?, price = ?, material = ?, size = ?, image_url = ? WHERE id = ?',
    [name, description || '', category || '', price || 0, material || '', size || '', image_url || '', id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, name, description, category, price, material, size, image_url });
    }
  );
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: true, changes: this.changes });
  });
});

app.get('/api/customers', (req, res) => {
  db.all('SELECT * FROM customers ORDER BY last_name, first_name', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/customers', (req, res) => {
  const { first_name, last_name, company, email, phone, address } = req.body;
  db.run(
    'INSERT INTO customers (first_name, last_name, company, email, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
    [first_name, last_name, company || '', email, phone, address || ''],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, first_name, last_name, company, email, phone, address });
    }
  );
});

app.put('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, company, email, phone, address } = req.body;
  db.run(
    'UPDATE customers SET first_name = ?, last_name = ?, company = ?, email = ?, phone = ?, address = ? WHERE id = ?',
    [first_name, last_name, company || '', email, phone, address || '', id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, first_name, last_name, company, email, phone, address });
    }
  );
});

app.delete('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM customers WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: true, changes: this.changes });
  });
});

app.get('/api/addresses', (req, res) => {
  db.all('SELECT * FROM addresses ORDER BY customer_id, is_default DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/addresses/customer/:customerId', (req, res) => {
  const { customerId } = req.params;
  db.all(
    'SELECT * FROM addresses WHERE customer_id = ? ORDER BY is_default DESC',
    [customerId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.post('/api/addresses', (req, res) => {
  const { customer_id, line1, line2, city, state, postal_code, country, is_default } = req.body;
  db.run(
    'INSERT INTO addresses (customer_id, line1, line2, city, state, postal_code, country, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [customer_id, line1, line2 || '', city, state, postal_code, country || 'US', is_default ? 1 : 0],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, customer_id, line1, line2, city, state, postal_code, country, is_default });
    }
  );
});

app.put('/api/addresses/:id', (req, res) => {
  const { id } = req.params;
  const { line1, line2, city, state, postal_code, country, is_default } = req.body;
  db.run(
    'UPDATE addresses SET line1 = ?, line2 = ?, city = ?, state = ?, postal_code = ?, country = ?, is_default = ? WHERE id = ?',
    [line1, line2 || '', city, state, postal_code, country || 'US', is_default ? 1 : 0, id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, line1, line2, city, state, postal_code, country, is_default });
    }
  );
});

app.delete('/api/addresses/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM addresses WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: true, changes: this.changes });
  });
});

app.get('/api/orders', (req, res) => {
  const { status, customer_id } = req.query;
  
  let sql = `SELECT o.*, c.first_name, c.last_name, a.line1 as address_line1 FROM orders o JOIN customers c ON o.customer_id = c.id LEFT JOIN addresses a ON o.shipping_address_id = a.id`;
  const params = [];
  
  if (status) {
    sql += ' WHERE o.status = ?';
    params.push(status);
  }
  
  if (customer_id) {
    sql += (status ? ' AND' : ' WHERE') + ' o.customer_id = ?';
    params.push(customer_id);
  }
  
  sql += ' ORDER BY o.created_at DESC';
  
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const ordersWithItems = rows.map(order => ({
      ...order,
      items_count: 0
    }));
    
    res.json(ordersWithItems);
  });
});

app.get('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  db.get(
    'SELECT o.*, c.first_name, c.last_name, a.line1 as address_line1 FROM orders o JOIN customers c ON o.customer_id = c.id LEFT JOIN addresses a ON o.shipping_address_id = a.id WHERE o.id = ?',
    [id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row);
    }
  );
});

app.post('/api/orders', (req, res) => {
  const { customer_id, shipping_address_id, notes, status = 'NEW', carrier, tracking_number, shipping_price = 0, items } = req.body;
  
  db.run(
    'INSERT INTO orders (customer_id, shipping_address_id, notes, status, carrier, tracking_number, shipping_price) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [customer_id, shipping_address_id || null, notes || '', status, carrier || '', tracking_number || '', shipping_price],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      const orderId = this.lastID;
      
      if (items && items.length > 0) {
        const stmt = db.prepare(
          'INSERT INTO order_items (order_id, product_id, product_name, size, color, material, price, quantity, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        
        items.forEach(item => {
          stmt.run(orderId, item.product_id || null, item.product_name || '', item.size || '', item.color || '', item.material || '', item.price || 0, item.quantity || 1, item.notes || '');
        });
        
        stmt.finalize();
      }
      
      res.json({ id: orderId, customer_id, shipping_address_id, notes, status, carrier, tracking_number, shipping_price });
    }
  );
});

app.put('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const { customer_id, shipping_address_id, notes, status, carrier, tracking_number, shipping_price = 0 } = req.body;
  db.run(
    'UPDATE orders SET customer_id = ?, shipping_address_id = ?, notes = ?, status = ?, carrier = ?, tracking_number = ?, shipping_price = ? WHERE id = ?',
    [customer_id, shipping_address_id || null, notes || '', status, carrier || '', tracking_number || '', shipping_price, id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, customer_id, shipping_address_id, notes, status, carrier, tracking_number, shipping_price });
    }
  );
});

app.delete('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM orders WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: true, changes: this.changes });
  });
});

app.get('/api/orders/:id/items', (req, res) => {
  const { id } = req.params;
  db.all(
    `SELECT oi.*, p.description as product_description FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ? ORDER BY oi.id`,
    [id],
    (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/orders/:id/items', (req, res) => {
  const { id } = req.params;
  const { product_id, product_name, size, color, material, price, quantity, notes } = req.body;
  db.run(
    'INSERT INTO order_items (order_id, product_id, product_name, size, color, material, price, quantity, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, product_id || null, product_name || '', size || '', color || '', material || '', price || 0, quantity || 1, notes || ''],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, order_id: id, product_id, product_name, size, color, material, price, quantity, notes });
    }
  );
});

app.put('/api/order-items/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM order_items WHERE id = ?', [id], (err, existing) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!existing) return res.status(404).json({ error: 'Item not found' });
    const merged = { ...existing, ...req.body };
    db.run(
      'UPDATE order_items SET product_id = ?, product_name = ?, size = ?, color = ?, material = ?, price = ?, quantity = ?, notes = ? WHERE id = ?',
      [merged.product_id || null, merged.product_name, merged.size || '', merged.color || '', merged.material || '', merged.price || 0, merged.quantity || 1, merged.notes || '', id],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json(merged);
      }
    );
  });
});

app.delete('/api/order-items/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM order_items WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: true, changes: this.changes });
  });
});

app.get('/api/order-items/:id/print-jobs', (req, res) => {
  const { id } = req.params;
  db.all('SELECT * FROM print_jobs WHERE order_item_id = ? ORDER BY created_at DESC', [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/order-items/:id/print-jobs', (req, res) => {
  const { id } = req.params;
  const { printer_name, start_time, end_time, status = 'QUEUED' } = req.body;
  db.run(
    'INSERT INTO print_jobs (order_item_id, printer_name, start_time, end_time, status) VALUES (?, ?, ?, ?, ?)',
    [id, printer_name || '', start_time || null, end_time || null, status],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, order_item_id: id, printer_name, start_time, end_time, status });
    }
  );
});

app.put('/api/print-jobs/:id', (req, res) => {
  const { id } = req.params;
  const { printer_name, start_time, end_time, status } = req.body;
  db.run(
    'UPDATE print_jobs SET printer_name = ?, start_time = ?, end_time = ?, status = ? WHERE id = ?',
    [printer_name || '', start_time || null, end_time || null, status, id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, printer_name, start_time, end_time, status });
    }
  );
});

app.delete('/api/print-jobs/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM print_jobs WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: true, changes: this.changes });
  });
});

app.get('/api/dashboard/stats', (req, res) => {
  const stats = {};
  
  db.all(`SELECT status, COUNT(*) as count FROM orders GROUP BY status`, [], (err, rows) => {
    if (!err) {
      rows.forEach(row => {
        stats[row.status.toLowerCase()] = row.count;
      });
    }
    
    db.get(`SELECT COUNT(*) as count FROM print_jobs WHERE status IN ('QUEUED', 'PRINTING')`, [], (err, row) => {
      stats.active_print_jobs = row ? row.count : 0;
      res.json(stats);
    });
  });
});

app.get('/api/customers/:id/orders', (req, res) => {
  const { id } = req.params;
  db.all('SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC', [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Settings
app.get('/api/settings', (req, res) => {
  db.all('SELECT key, value FROM settings', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const settings = {};
    (rows || []).forEach(r => {
      try { settings[r.key] = JSON.parse(r.value); } catch { settings[r.key] = r.value; }
    });
    res.json(settings);
  });
});

app.get('/api/settings/:key', (req, res) => {
  db.get('SELECT value FROM settings WHERE key = ?', [req.params.key], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.json({ value: null });
    try { res.json({ value: JSON.parse(row.value) }); } catch { res.json({ value: row.value }); }
  });
});

app.put('/api/settings/:key', (req, res) => {
  const { key } = req.params;
  const value = JSON.stringify(req.body.value);
  db.run(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?',
    [key, value, value],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ key, value: req.body.value });
    }
  );
});

// Receipts
app.get('/api/receipts', (req, res) => {
  const { order_id, customer_id } = req.query;
  let sql = 'SELECT r.*, c.first_name, c.last_name FROM receipts r JOIN customers c ON r.customer_id = c.id';
  const params = [];
  if (order_id) { sql += ' WHERE r.order_id = ?'; params.push(order_id); }
  else if (customer_id) { sql += ' WHERE r.customer_id = ?'; params.push(customer_id); }
  sql += ' ORDER BY r.created_at DESC';
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/receipts/:id', (req, res) => {
  db.get(
    'SELECT r.*, c.first_name, c.last_name FROM receipts r JOIN customers c ON r.customer_id = c.id WHERE r.id = ?',
    [req.params.id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Receipt not found' });
      res.json(row);
    }
  );
});

app.post('/api/receipts', (req, res) => {
  const { order_id, customer_id, billing_name, billing_company, billing_email, billing_phone, billing_address, shipping_address, subtotal, shipping_price, tax, total, payment_type, amount_paid, amount_due, payment_date, payment_due_date, payment_received, notes } = req.body;
  const receipt_number = 'INV-' + Date.now();
  db.run(
    `INSERT INTO receipts (receipt_number, order_id, customer_id, billing_name, billing_company, billing_email, billing_phone, billing_address, shipping_address, subtotal, shipping_price, tax, total, payment_type, amount_paid, amount_due, payment_date, payment_due_date, payment_received, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [receipt_number, order_id, customer_id, billing_name || '', billing_company || '', billing_email || '', billing_phone || '', billing_address || '', shipping_address || '', subtotal || 0, shipping_price || 0, tax || 0, total || 0, payment_type || '', amount_paid || 0, amount_due || 0, payment_date || '', payment_due_date || '', payment_received ? 1 : 0, notes || ''],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, receipt_number, order_id, customer_id, billing_name, billing_company, billing_email, billing_phone, billing_address, shipping_address, subtotal, shipping_price, tax, total, payment_type, amount_paid, amount_due, payment_date, payment_due_date, payment_received, notes });
    }
  );
});

app.put('/api/receipts/:id', (req, res) => {
  const { id } = req.params;
  const { billing_name, billing_company, billing_email, billing_phone, billing_address, shipping_address, subtotal, shipping_price, tax, total, payment_type, amount_paid, amount_due, payment_date, payment_due_date, payment_received, notes } = req.body;
  db.run(
    `UPDATE receipts SET billing_name = ?, billing_company = ?, billing_email = ?, billing_phone = ?, billing_address = ?, shipping_address = ?, subtotal = ?, shipping_price = ?, tax = ?, total = ?, payment_type = ?, amount_paid = ?, amount_due = ?, payment_date = ?, payment_due_date = ?, payment_received = ?, notes = ? WHERE id = ?`,
    [billing_name || '', billing_company || '', billing_email || '', billing_phone || '', billing_address || '', shipping_address || '', subtotal || 0, shipping_price || 0, tax || 0, total || 0, payment_type || '', amount_paid || 0, amount_due || 0, payment_date || '', payment_due_date || '', payment_received ? 1 : 0, notes || '', id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, ...req.body });
    }
  );
});

app.delete('/api/receipts/:id', (req, res) => {
  db.run('DELETE FROM receipts WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: true });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
