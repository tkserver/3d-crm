import { useState, useEffect } from 'react';

function OrderDetail({ order, customers, onUpdateOrder, onDeleteOrder, onCreateItem, onUpdateItem, onDeleteItem, onCreatePrintJob, onUpdatePrintJob, onDeletePrintJob, onBack }) {
  const [editingOrder, setEditingOrder] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: order.customer_id,
    shipping_address_id: order.shipping_address_id || '',
    notes: order.notes || '',
    status: order.status,
    carrier: order.carrier || '',
    tracking_number: order.tracking_number || '',
    shipping_price: order.shipping_price || 0
  });
  const [items, setItems] = useState([]);
  const [printJobs, setPrintJobs] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (order.id) {
      fetch(`/api/orders/${order.id}/items`)
        .then(r => r.json())
        .then(data => setItems(Array.isArray(data) ? data : []))
        .catch(() => setItems([]));

      fetch('/api/products')
        .then(r => r.json())
        .then(data => setProducts(data.products || []))
        .catch(() => setProducts([]));
    }
  }, [order.id]);

  // Fetch print jobs for all items
  useEffect(() => {
    if (items.length > 0) {
      const jobPromises = items
        .filter(item => item.id && !String(item.id).startsWith('new-'))
        .map(item =>
          fetch(`/api/order-items/${item.id}/print-jobs`)
            .then(r => r.json())
            .then(jobs => (Array.isArray(jobs) ? jobs : []))
            .catch(() => [])
        );
      Promise.all(jobPromises).then(results => setPrintJobs(results.flat()));
    } else {
      setPrintJobs([]);
    }
  }, [items]);

  const handleUpdateOrder = () => {
    onUpdateOrder(order.id, formData);
    setEditingOrder(false);
  };

  const handleMarkShipped = () => {
    onUpdateOrder(order.id, { ...formData, status: 'SHIPPED' });
  };

  const handleAddItem = () => {
    const newItem = { id: `new-${Date.now()}`, product_id: '', product_name: '', size: '', color: '', material: '', price: 0, quantity: 1, notes: '' };
    setItems([...items, newItem]);
    if (!editingOrder) setEditingOrder(true);
  };

  const handleUpdateItem = (itemId, updates) => {
    if (!itemId || String(itemId).startsWith('new-')) {
      const index = items.findIndex(i => i.id === itemId);
      if (index !== -1) {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], ...updates };
        setItems(newItems);
      }
    } else {
      onUpdateItem(itemId, updates);
    }
  };

  const handleSaveItems = () => {
    const savePromises = items.map(item => {
      if (item.id && !String(item.id).startsWith('new-')) {
        return fetch(`/api/order-items/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
      } else {
        return fetch(`/api/orders/${order.id}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
      }
    });

    Promise.all(savePromises).then(() => {
      fetch(`/api/orders/${order.id}/items`)
        .then(r => r.json())
        .then(data => setItems(Array.isArray(data) ? data : []));
      setEditingOrder(false);
    });
  };

  const handleAddPrintJob = (itemId) => {
    onCreatePrintJob(itemId, { printer_name: '', start_time: '', end_time: '', status: 'QUEUED' });
  };

  const statusColors = {
    NEW: '#f59e0b',
    QUEUED: '#3b82f6',
    PRINTING: '#8b5cf6',
    COMPLETE: '#10b981',
    SHIPPED: '#06b6d4'
  };

  const getDisplayProductName = (item) => {
    if (item.product_name) return item.product_name;
    if (item.product_id) {
      const product = products.find(p => p.id === item.product_id);
      return product ? product.name : '';
    }
    return '';
  };

  return (
    <div style={styles.container}>
      <button onClick={onBack} style={styles.backButton}>&larr; Back to Orders</button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Order #{order.id}</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {!editingOrder && (
            <>
              <button onClick={() => setEditingOrder(true)} style={styles.editButton}>Edit</button>
              <button onClick={() => onDeleteOrder(order.id)} style={styles.deleteButton}>Delete</button>
            </>
          )}
        </div>
      </div>

      {editingOrder ? (
        <div style={styles.formSection}>
          <h3>Edit Order</h3>
          <div style={{ marginBottom: '1rem' }}>
            <label style={styles.label}>Customer</label>
            <select value={formData.customer_id} onChange={e => setFormData({ ...formData, customer_id: e.target.value })} style={{ ...styles.input, width: '100%' }}>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{`${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Unknown'}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={styles.label}>Status</label>
            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} style={styles.input}>
              <option value="NEW">New</option>
              <option value="QUEUED">Queued</option>
              <option value="PRINTING">Printing</option>
              <option value="COMPLETE">Complete</option>
              <option value="SHIPPED">Shipped</option>
            </select>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={styles.label}>Carrier</label>
            <input type="text" value={formData.carrier} onChange={e => setFormData({ ...formData, carrier: e.target.value })} style={styles.input} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={styles.label}>Tracking Number</label>
            <input type="text" value={formData.tracking_number} onChange={e => setFormData({ ...formData, tracking_number: e.target.value })} style={styles.input} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={styles.label}>Shipping Price</label>
            <input type="number" step="0.01" min="0" value={formData.shipping_price} onChange={e => setFormData({ ...formData, shipping_price: parseFloat(e.target.value) || 0 })} style={styles.input} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={styles.label}>Notes</label>
            <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} style={{ ...styles.input, minHeight: '60px' }} />
          </div>
          <button onClick={handleUpdateOrder} style={styles.submitButton}>Save Order</button>
          <button onClick={handleSaveItems} style={{ ...styles.submitButton, background: '#10b981', marginLeft: '0.5rem' }}>Save Items</button>
          <button onClick={() => setEditingOrder(false)} style={{ ...styles.cancelButton, marginLeft: '0.5rem' }}>Cancel</button>
        </div>
      ) : (
        <div style={styles.infoSection}>
          <h3>Order Information</h3>
          <p><strong>Customer:</strong> {`${customers.find(c => c.id === order.customer_id)?.first_name || ''} ${customers.find(c => c.id === order.customer_id)?.last_name || ''}`.trim() || 'Unknown'}</p>
          <p><strong>Address:</strong> {order.address_line1 || 'Not specified'}</p>
          <p><strong>Status:</strong> <span style={{ ...styles.statusBadge, background: statusColors[order.status] }}>{order.status}</span></p>
          <p><strong>Created:</strong> {new Date(order.created_at).toLocaleString()}</p>
          <p><strong>Notes:</strong> {order.notes || 'No notes'}</p>
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '4px' }}>
            <h4>Shipping Information</h4>
            {order.carrier ? (
              <>
                <p><strong>Carrier:</strong> {order.carrier}</p>
                <p><strong>Tracking:</strong> {order.tracking_number}</p>
                <p><strong>Shipping Price:</strong> {`$${(order.shipping_price || 0).toFixed(2)}`}</p>
                {order.status !== 'SHIPPED' && (
                  <button onClick={handleMarkShipped} style={{ ...styles.markShippedButton, marginTop: '0.5rem' }}>Mark as Shipped</button>
                )}
              </>
            ) : (
              <p>No shipping information yet</p>
            )}
          </div>
        </div>
      )}

      <h2 style={{ marginTop: '2rem' }}>Order Items</h2>
      <div style={styles.itemsSection}>
        {items.length === 0 ? (
          <p style={{ color: '#64748b' }}>No items yet</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Product</th>
                <th style={styles.th}>Size</th>
                <th style={styles.th}>Color</th>
                <th style={styles.th}>Material</th>
                <th style={styles.th}>Price</th>
                <th style={styles.th}>Qty</th>
                <th style={styles.th}>Total</th>
                <th style={styles.th}>Notes</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id || `new-${index}`}>
                  <td style={styles.td}>
                    {editingOrder ? (
                      <select
                        value={item.product_id || ''}
                        onChange={(e) => {
                          const product = products.find(p => p.id === parseInt(e.target.value));
                          handleUpdateItem(item.id, {
                            product_id: e.target.value,
                            product_name: product ? product.name : (item.product_name || ''),
                            size: product?.size || item.size || '',
                            color: product?.color || item.color || '',
                            material: product?.material || item.material || ''
                          });
                        }}
                        style={{ ...styles.input, width: '100%', padding: '0.25rem' }}
                      >
                        <option value="">Select Product</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    ) : (
                      getDisplayProductName(item)
                    )}
                  </td>
                  <td style={styles.td}>{item.size || '-'}</td>
                  <td style={styles.td}>{item.color || '-'}</td>
                  <td style={styles.td}>{item.material || '-'}</td>
                  <td style={styles.td}>
                    {editingOrder ? (
                      <input
                        type="number" step="0.01" min="0"
                        value={item.price || ''}
                        onChange={(e) => handleUpdateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                        style={{ ...styles.input, width: '80px', padding: '0.25rem' }}
                      />
                    ) : (
                      `$${(item.price || 0).toFixed(2)}`
                    )}
                  </td>
                  <td style={styles.td}>
                    {editingOrder ? (
                      <input
                        type="number" min="1"
                        value={item.quantity || 1}
                        onChange={(e) => handleUpdateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                        style={{ ...styles.input, width: '60px', padding: '0.25rem' }}
                      />
                    ) : (
                      item.quantity
                    )}
                  </td>
                  <td style={styles.td}>{`$${((item.price || 0) * (item.quantity || 1)).toFixed(2)}`}</td>
                  <td style={styles.td}>
                    {editingOrder ? (
                      <input
                        type="text"
                        value={item.notes || ''}
                        onChange={(e) => handleUpdateItem(item.id, { notes: e.target.value })}
                        style={{ ...styles.input, width: '100%', padding: '0.25rem' }}
                      />
                    ) : (
                      item.notes || '-'
                    )}
                  </td>
                  <td style={styles.td}>
                    {editingOrder ? (
                      <>
                        <button onClick={() => {
                          const idx = items.findIndex(i => i.id === item.id);
                          if (idx !== -1) {
                            const newItems = [...items];
                            const copy = { ...newItems[idx], id: `new-${Date.now()}`, product_name: (newItems[idx].product_name || '') + ' (copy)' };
                            newItems.splice(idx + 1, 0, copy);
                            setItems(newItems);
                          }
                        }} style={styles.copyButton}>Copy</button>
                        <button onClick={() => {
                          if (String(item.id).startsWith('new-')) {
                            setItems(items.filter(i => i.id !== item.id));
                          } else {
                            onDeleteItem(item.id);
                          }
                        }} style={styles.deleteButton}>Delete</button>
                      </>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button onClick={handleAddItem} style={{ ...styles.addButton, marginTop: '1rem' }}>+ Add Item</button>
      </div>

      <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '1rem' }}>Order Totals</h3>
        {items.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            {items.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>{item.product_name || `Item ${i + 1}`}</span>
                <span>{`$${((item.price || 0) * (item.quantity || 1)).toFixed(2)}`}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Items Total:</span>
            <span>{`$${items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0).toFixed(2)}`}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Shipping:</span>
            <span>{`$${(order.shipping_price || 0).toFixed(2)}`}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem' }}>
            <span>Order Total:</span>
            <span>{`$${(items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0) + (order.shipping_price || 0)).toFixed(2)}`}</span>
          </div>
        </div>
      </div>

      <h2 style={{ marginTop: '2rem' }}>Print Jobs</h2>
      {printJobs.length === 0 ? (
        <p style={{ color: '#64748b' }}>No print jobs yet</p>
      ) : (
        <div style={styles.printJobsSection}>
          {printJobs.map(job => (
            <div key={job.id} style={{ ...styles.printJobCard, borderLeft: `4px solid ${printJobStatusColor(job.status)}` }}>
              <div style={styles.printJobHeader}>
                <span style={{ fontWeight: 'bold' }}>Printer:</span> {job.printer_name || 'Not assigned'}
                <span style={{ ...styles.statusBadge, marginLeft: '1rem', background: printJobStatusColor(job.status) }}>{job.status}</span>
              </div>
              <div style={styles.printJobTimes}>
                {job.start_time && <span>Start: {new Date(job.start_time).toLocaleString()}</span>}
                {job.end_time && <span> | End: {new Date(job.end_time).toLocaleString()}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function printJobStatusColor(status) {
  const colors = { QUEUED: '#3b82f6', PRINTING: '#8b5cf6', DONE: '#10b981', FAILED: '#ef4444' };
  return colors[status] || '#64748b';
}

const styles = {
  container: { padding: '1rem' },
  backButton: { background: 'transparent', border: 'none', fontSize: '1rem', cursor: 'pointer', marginBottom: '1rem' },
  editButton: { background: '#3b82f6', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' },
  deleteButton: { background: '#ef4444', color: 'white', border: 'none', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer', marginLeft: '0.25rem' },
  formSection: { background: 'white', padding: '1.5rem', borderRadius: '8px' },
  infoSection: { background: 'white', padding: '1.5rem', borderRadius: '8px' },
  label: { display: 'block', marginBottom: '0.25rem', fontWeight: '500' },
  input: { padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' },
  submitButton: { background: '#3b82f6', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' },
  cancelButton: { padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', background: 'white' },
  statusBadge: { color: 'white', padding: '0.25rem 0.75rem', borderRadius: '4px', marginLeft: '0.5rem', display: 'inline-block' },
  markShippedButton: { background: '#10b981', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' },
  itemsSection: { background: 'white', padding: '1.5rem', borderRadius: '8px' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '1rem' },
  th: { padding: '0.75rem', textAlign: 'left', background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' },
  td: { padding: '0.75rem', borderBottom: '1px solid #e2e8f0' },
  copyButton: { background: '#64748b', color: 'white', border: 'none', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer', marginRight: '0.25rem' },
  addButton: { background: '#3b82f6', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' },
  printJobsSection: { marginTop: '1rem' },
  printJobCard: { background: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '0.5rem', border: '1px solid #e2e8f0' },
  printJobHeader: { display: 'flex', alignItems: 'center', marginBottom: '0.5rem' },
  printJobTimes: { color: '#64748b', fontSize: '0.875rem' }
};

export default OrderDetail;
