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
  const { first_name, last_name, email, phone, address } = req.body;
  db.run(
    'INSERT INTO customers (first_name, last_name, email, phone, address) VALUES (?, ?, ?, ?, ?)',
    [first_name, last_name, email, phone, address || ''],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, first_name, last_name, email, phone, address });
    }
  );
});

app.put('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, phone, address } = req.body;
  db.run(
    'UPDATE customers SET first_name = ?, last_name = ?, email = ?, phone = ?, address = ? WHERE id = ?',
    [first_name, last_name, email, phone, address || '', id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, first_name, last_name, email, phone, address });
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
  db.all('SELECT * FROM order_items WHERE order_id = ? ORDER BY id', [id], (err, rows) => {
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
  const { product_id, product_name, size, color, material, price, quantity, notes } = req.body;
  db.run(
    'UPDATE order_items SET product_id = ?, product_name = ?, size = ?, color = ?, material = ?, price = ?, quantity = ?, notes = ? WHERE id = ?',
    [product_id || null, product_name, size || '', color || '', material || '', price || 0, quantity || 1, notes || '', id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, product_id, product_name, size, color, material, quantity, notes });
    }
  );
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
