import { useState, useEffect } from 'react';

function NewOrderForm({ customers, onCancel, onSubmit, initialData }) {
  const [formData, setFormData] = useState({
    customer_id: initialData?.customer_id || '',
    shipping_address_id: initialData?.shipping_address_id || '',
    notes: initialData?.notes || '',
    status: initialData?.status || 'NEW',
    shipping_price: initialData?.shipping_price || '',
    carrier: initialData?.carrier || '',
    tracking_number: initialData?.tracking_number || ''
  });
  const [addresses, setAddresses] = useState([]);
  const [items, setItems] = useState(initialData?.items || []);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (formData.customer_id) {
      fetch(`/api/addresses/customer/${formData.customer_id}`)
        .then(r => r.json())
        .then(setAddresses);
    } else {
      setAddresses([]);
    }
  }, [formData.customer_id]);

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(data => setProducts(data.products || []));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, items });
  };

  const handleAddItem = () => {
    setItems([...items, { product_id: '', product_name: '', size: '', color: '', material: '', quantity: 1, notes: '' }]);
  };

  const handleUpdateItem = (index, updates) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };
    setItems(newItems);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const getSelectedProduct = (productId) => {
    if (!productId) return null;
    return products.find(p => p.id === productId);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '1rem' }}>
        <label style={styles.label}>Customer *</label>
        <select
          required
          style={{ ...styles.input, width: '100%' }}
          value={formData.customer_id}
          onChange={(e) => {
            setFormData({ ...formData, customer_id: e.target.value });
            setAddresses([]);
          }}
        >
          <option value="">Select Customer</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>{`${c.first_name || ''} ${c.last_name || ''}`.trim() + (c.company ? ` (${c.company})` : '') || 'Unknown'}</option>
          ))}
        </select>
      </div>

      {formData.customer_id && (
        <div style={{ marginBottom: '1rem' }}>
          <label style={styles.label}>Shipping Address</label>
          <select
            style={{ ...styles.input, width: '100%' }}
            value={formData.shipping_address_id}
            onChange={(e) => setFormData({ ...formData, shipping_address_id: e.target.value })}
          >
            <option value="">Select Address</option>
            {addresses.map(addr => (
              <option key={addr.id} value={addr.id}>
                {`${addr.line1 || ''}, ${addr.city || ''}, ${addr.state || ''} ${addr.postal_code || ''}`}
              </option>
            ))}
          </select>
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <label style={styles.label}>Items</label>
        {items.length === 0 ? (
          <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>No items yet</p>
        ) : (
          <table style={styles.itemTable}>
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
                <tr key={index}>
                  <td style={styles.td}>
                    {products.length > 0 ? (
                      <select
                        value={item.product_id || ''}
                        onChange={(e) => {
                          const product = products.find(p => p.id === parseInt(e.target.value));
                          handleUpdateItem(index, {
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
                      <div style={{ padding: '0.25rem' }}>{item.product_name || 'No products available'}</div>
                    )}
                  </td>
                  <td style={styles.td}>
                    <input
                      type="text"
                      value={item.size}
                      onChange={(e) => handleUpdateItem(index, { size: e.target.value })}
                      style={{ ...styles.input, padding: '0.25rem' }}
                    />
                  </td>
                  <td style={styles.td}>
                    <input
                      type="text"
                      value={item.color}
                      onChange={(e) => handleUpdateItem(index, { color: e.target.value })}
                      style={{ ...styles.input, padding: '0.25rem' }}
                    />
                  </td>
                   <td style={styles.td}>
                     <input
                       type="text"
                       value={item.material}
                       onChange={(e) => handleUpdateItem(index, { material: e.target.value })}
                       style={{ ...styles.input, padding: '0.25rem' }}
                     />
                   </td>
                   <td style={styles.td}>
                     <input
                       type="number"
                       step="0.01"
                       min="0"
                       value={item.price || ''}
                       onChange={(e) => handleUpdateItem(index, { price: parseFloat(e.target.value) || 0 })}
                       style={{ ...styles.input, padding: '0.25rem', width: '80px' }}
                     />
                   </td>
                   <td style={styles.td}>
                     <input
                       type="number"
                       min="1"
                       value={item.quantity || 1}
                       onChange={(e) => handleUpdateItem(index, { quantity: parseInt(e.target.value) || 1 })}
                       style={{ ...styles.input, padding: '0.25rem', width: '60px' }}
                     />
                   </td>
                    <td style={styles.td}>
                      {`$${((item.price || 0) * (item.quantity || 1)).toFixed(2)}`}
                    </td>
                  <td style={styles.td}>
                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) => handleUpdateItem(index, { notes: e.target.value })}
                      style={{ ...styles.input, padding: '0.25rem' }}
                    />
                  </td>
                  <td style={styles.td}>
                    <button type="button" onClick={() => handleRemoveItem(index)} style={styles.deleteButton}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button type="button" onClick={handleAddItem} style={{ ...styles.addButton, marginTop: '0.5rem' }}>+ Add Item</button>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={styles.label}>Shipping Price</label>
        <input
          type="number"
          step="0.01"
          min="0"
          style={{ ...styles.input }}
          value={formData.shipping_price}
          onChange={(e) => setFormData({ ...formData, shipping_price: parseFloat(e.target.value) || 0 })}
        />
      </div>

      {initialData && (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <label style={styles.label}>Carrier</label>
            <input
              type="text"
              style={{ ...styles.input }}
              value={formData.carrier}
              onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={styles.label}>Tracking Number</label>
            <input
              type="text"
              style={{ ...styles.input }}
              value={formData.tracking_number}
              onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
            />
          </div>
        </>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <label style={styles.label}>Notes</label>
        <textarea
          style={{ ...styles.input, minHeight: '60px' }}
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={styles.label}>Status</label>
        <select
          style={{ ...styles.input }}
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
        >
          <option value="NEW">New</option>
          <option value="QUEUED">Queued</option>
          <option value="PRINTING">Printing</option>
          <option value="COMPLETE">Complete</option>
          <option value="SHIPPED">Shipped</option>
        </select>
      </div>

      <div style={styles.formActions}>
        <button type="button" onClick={onCancel} style={styles.cancelButton}>Cancel</button>
        <button type="submit" style={styles.submitButton}>{initialData ? 'Save Changes' : 'Create Order'}</button>
      </div>
    </form>
  );
}

const styles = {
  label: { display: 'block', marginBottom: '0.25rem', fontWeight: '500' },
  input: { width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' },
  formActions: { display: 'flex', gap: '1rem', justifyContent: 'flex-end' },
  cancelButton: { padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' },
  submitButton: { padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  addButton: { background: '#3b82f6', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' },
  deleteButton: { background: '#ef4444', color: 'white', border: 'none', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer' },
  itemTable: { width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' },
  th: { padding: '0.5rem', textAlign: 'left', background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' },
  td: { padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }
};

export default NewOrderForm;
