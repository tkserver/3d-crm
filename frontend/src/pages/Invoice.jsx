import { useState, useEffect } from 'react';

const DEFAULT_CONFIG = {
  showOrderNumber: true,
  showInvoiceDate: true,
  showPaymentDate: true,
  showDueDate: true,
  showBillingAddress: true,
  showShippingAddress: true,
  showBillingEmail: true,
  showBillingPhone: true,
  showItemDescription: true,
  showItemSize: true,
  showItemQty: true,
  showSubtotal: true,
  showShipping: true,
  showTax: true,
  showAmountPaid: true,
  showAmountDue: true,
  showPaymentReceived: true,
  showPaymentMethod: true,
  showPayTo: true,
  showNotes: true,
  showFooter: true,
};

const CONFIG_LABELS = {
  showOrderNumber: 'Order Number',
  showInvoiceDate: 'Invoice Date',
  showPaymentDate: 'Payment Date',
  showDueDate: 'Due Date',
  showBillingAddress: 'Billing Address',
  showShippingAddress: 'Shipping Address',
  showBillingEmail: 'Email',
  showBillingPhone: 'Phone',
  showItemDescription: 'Item Description',
  showItemSize: 'Item Size',
  showItemQty: 'Item Quantity',
  showSubtotal: 'Subtotal',
  showShipping: 'Shipping',
  showTax: 'Tax',
  showAmountPaid: 'Amount Paid',
  showAmountDue: 'Amount Due',
  showPaymentReceived: 'Payment Received',
  showPaymentMethod: 'Payment Method',
  showPayTo: 'Pay To Info',
  showNotes: 'Notes',
  showFooter: 'Footer Message',
};

const DEFAULT_PAY_TO = {
  businessName: '',
  contactName: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  email: '',
  phone: '',
  checkPayableTo: '',
  venmoHandle: '',
  paypalEmail: '',
};

function fmt(value) {
  return '$' + (Number(value) || 0).toFixed(2);
}

function Invoice({ receiptId, orderId, customers, onBack }) {
  const [receipt, setReceipt] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [showConfig, setShowConfig] = useState(false);
  const [payTo, setPayTo] = useState(DEFAULT_PAY_TO);

  const PAYMENT_TYPES = ['Cash', 'Credit Card', 'Debit Card', 'Check', 'PayPal', 'Venmo', 'Wire Transfer', 'Other'];

  const debounceTimers = useState({})[0];

  const debouncedSave = (key, value, delay = 800) => {
    if (debounceTimers[key]) clearTimeout(debounceTimers[key]);
    debounceTimers[key] = setTimeout(() => {
      fetch(`/api/settings/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value })
      }).catch(() => {});
    }, delay);
  };

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data.invoiceConfig) setConfig({ ...DEFAULT_CONFIG, ...data.invoiceConfig });
        if (data.invoicePayTo) setPayTo({ ...DEFAULT_PAY_TO, ...data.invoicePayTo });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (receiptId) loadReceipt(receiptId);
    else if (orderId) generateFromOrder(orderId);
  }, [receiptId, orderId]);

  const toggleConfig = (key) => {
    const updated = { ...config, [key]: !config[key] };
    setConfig(updated);
    debouncedSave('invoiceConfig', updated, 500);
  };

  const updatePayTo = (field, value) => {
    const updated = { ...payTo, [field]: value };
    setPayTo(updated);
    debouncedSave('invoicePayTo', updated);
  };

  const loadReceipt = (id) => {
    setLoading(true);
    fetch(`/api/receipts/${id}`)
      .then(r => r.json())
      .then(data => {
        setReceipt(data);
        setFormData({ ...data, payment_received: !!data.payment_received });
        loadOrderItems(data.order_id);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const generateFromOrder = (oid) => {
    setLoading(true);
    Promise.all([
      fetch(`/api/orders/${oid}`).then(r => r.json()),
      fetch(`/api/orders/${oid}/items`).then(r => r.json()),
    ]).then(([order, items]) => {
      setOrderItems(Array.isArray(items) ? items : []);
      const customer = customers.find(c => c.id === order.customer_id);
      const subtotal = (items || []).reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
      const shipping = order.shipping_price || 0;
      const total = subtotal + shipping;
      setFormData({
        order_id: order.id,
        customer_id: order.customer_id,
        billing_name: customer ? `${customer.first_name} ${customer.last_name}`.trim() : '',
        billing_company: customer?.company || '',
        billing_email: customer?.email || '',
        billing_phone: customer?.phone || '',
        billing_address: customer?.address || '',
        shipping_address: order.address_line1 || '',
        subtotal, shipping_price: shipping, tax: 0, total,
        payment_type: '', amount_paid: 0, amount_due: total,
        payment_date: '', payment_due_date: '',
        payment_received: false,
        notes: ''
      });
      setEditing(true);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  const loadOrderItems = (oid) => {
    fetch(`/api/orders/${oid}/items`)
      .then(r => r.json())
      .then(data => setOrderItems(Array.isArray(data) ? data : []))
      .catch(() => setOrderItems([]));
  };

  const handleDelete = () => {
    if (!receipt || !confirm('Delete this invoice?')) return;
    fetch(`/api/receipts/${receipt.id}`, { method: 'DELETE' })
      .then(r => r.json())
      .then(() => onBack())
      .catch(() => {});
  };

  const handleSave = () => {
    const method = receipt ? 'PUT' : 'POST';
    const url = receipt ? `/api/receipts/${receipt.id}` : '/api/receipts';
    fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
      .then(r => r.json())
      .then(data => {
        if (!receipt) { setReceipt(data); loadOrderItems(data.order_id); }
        else { setReceipt({ ...receipt, ...formData }); }
        setEditing(false);
      });
  };

  const updateForm = (field, value) => {
    const updated = { ...formData, [field]: value };
    if (['amount_paid', 'subtotal', 'shipping_price', 'tax'].includes(field)) {
      const total = (parseFloat(updated.subtotal) || 0) + (parseFloat(updated.shipping_price) || 0) + (parseFloat(updated.tax) || 0);
      updated.total = total;
      updated.amount_due = total - (parseFloat(updated.amount_paid) || 0);
    }
    setFormData(updated);
  };

  if (loading) return <div style={styles.container}><p>Loading...</p></div>;
  const displayData = receipt ? { ...receipt, payment_received: !!receipt.payment_received } : formData;
  if (!displayData) return <div style={styles.container}><p>Invoice not found</p></div>;

  const configPanel = showConfig && (
    <div style={styles.configOverlay}>
      <div style={styles.configPanel}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>Invoice Settings</h3>
          <button onClick={() => setShowConfig(false)} style={styles.cancelButton}>✕</button>
        </div>

        <h4 style={{ margin: '0 0 0.5rem 0' }}>Show / Hide Elements</h4>
        <div style={styles.configGrid}>
          {Object.keys(CONFIG_LABELS).map(key => (
            <label key={key} style={styles.configItem}>
              <input type="checkbox" checked={config[key]} onChange={() => toggleConfig(key)} />
              <span style={{ marginLeft: '0.5rem' }}>{CONFIG_LABELS[key]}</span>
            </label>
          ))}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '1.5rem 0' }} />
        <h4 style={{ margin: '0 0 0.75rem 0' }}>Pay To (Your Business Info)</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={styles.label}>Business Name</label>
            <input style={styles.input} value={payTo.businessName} onChange={e => updatePayTo('businessName', e.target.value)} />
          </div>
          <div>
            <label style={styles.label}>Contact Name</label>
            <input style={styles.input} value={payTo.contactName} onChange={e => updatePayTo('contactName', e.target.value)} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={styles.label}>Address</label>
            <input style={styles.input} value={payTo.address} onChange={e => updatePayTo('address', e.target.value)} />
          </div>
          <div>
            <label style={styles.label}>City</label>
            <input style={styles.input} value={payTo.city} onChange={e => updatePayTo('city', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={styles.label}>State</label>
              <input style={styles.input} value={payTo.state} onChange={e => updatePayTo('state', e.target.value)} />
            </div>
            <div>
              <label style={styles.label}>Zip</label>
              <input style={styles.input} value={payTo.zip} onChange={e => updatePayTo('zip', e.target.value)} />
            </div>
          </div>
          <div>
            <label style={styles.label}>Email</label>
            <input style={styles.input} value={payTo.email} onChange={e => updatePayTo('email', e.target.value)} />
          </div>
          <div>
            <label style={styles.label}>Phone</label>
            <input style={styles.input} value={payTo.phone} onChange={e => updatePayTo('phone', e.target.value)} />
          </div>
        </div>

        <h4 style={{ margin: '1.25rem 0 0.75rem 0' }}>Payment Options</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={styles.label}>Check Payable To</label>
            <input style={styles.input} placeholder="e.g. Zeppa LLC" value={payTo.checkPayableTo} onChange={e => updatePayTo('checkPayableTo', e.target.value)} />
          </div>
          <div>
            <label style={styles.label}>Venmo Handle</label>
            <input style={styles.input} placeholder="e.g. @your-handle" value={payTo.venmoHandle} onChange={e => updatePayTo('venmoHandle', e.target.value)} />
          </div>
          <div>
            <label style={styles.label}>PayPal Email</label>
            <input style={styles.input} placeholder="e.g. pay@yourbiz.com" value={payTo.paypalEmail} onChange={e => updatePayTo('paypalEmail', e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  );

  if (editing) {
    return (
      <div style={styles.container}>
        <div className="no-print">
          <button onClick={onBack} style={styles.backButton}>&larr; Back</button>
          <h1 style={{ marginBottom: '1.5rem' }}>{receipt ? 'Edit Invoice' : 'Generate Invoice'}</h1>
        </div>
        <div style={styles.formGrid}>
          <div style={styles.formSection}>
            <h3>Billing Information</h3>
            <div style={styles.formGroup}>
              <label style={styles.label}>Company</label>
              <input style={styles.input} placeholder="Optional" value={formData.billing_company || ''} onChange={e => updateForm('billing_company', e.target.value)} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Name</label>
              <input style={styles.input} value={formData.billing_name || ''} onChange={e => updateForm('billing_name', e.target.value)} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input style={styles.input} value={formData.billing_email || ''} onChange={e => updateForm('billing_email', e.target.value)} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Phone</label>
              <input style={styles.input} value={formData.billing_phone || ''} onChange={e => updateForm('billing_phone', e.target.value)} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Billing Address</label>
              <textarea style={{ ...styles.input, minHeight: '60px' }} value={formData.billing_address || ''} onChange={e => updateForm('billing_address', e.target.value)} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Shipping Address</label>
              <textarea style={{ ...styles.input, minHeight: '60px' }} value={formData.shipping_address || ''} onChange={e => updateForm('shipping_address', e.target.value)} />
            </div>
          </div>
          <div style={styles.formSection}>
            <h3>Payment Details</h3>
            <div style={styles.formGroup}>
              <label style={styles.label}>Payment Method</label>
              <select style={styles.input} value={formData.payment_type || ''} onChange={e => updateForm('payment_type', e.target.value)}>
                <option value="">Select payment method</option>
                {PAYMENT_TYPES.map(pt => <option key={pt} value={pt}>{pt}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.configItem}>
                <input type="checkbox" checked={formData.payment_received || false} onChange={e => updateForm('payment_received', e.target.checked)} />
                <span style={{ marginLeft: '0.5rem', fontWeight: '500' }}>Payment Received</span>
              </label>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Payment Date</label>
              <input type="date" style={styles.input} value={formData.payment_date || ''} onChange={e => updateForm('payment_date', e.target.value)} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Payment Due Date</label>
              <input type="date" style={styles.input} value={formData.payment_due_date || ''} onChange={e => updateForm('payment_due_date', e.target.value)} />
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '1rem 0' }} />
            <div style={styles.formGroup}>
              <label style={styles.label}>Subtotal</label>
              <input type="number" step="0.01" style={styles.input} value={formData.subtotal || 0} onChange={e => updateForm('subtotal', parseFloat(e.target.value) || 0)} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Shipping</label>
              <input type="number" step="0.01" style={styles.input} value={formData.shipping_price || 0} onChange={e => updateForm('shipping_price', parseFloat(e.target.value) || 0)} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Tax</label>
              <input type="number" step="0.01" style={styles.input} value={formData.tax || 0} onChange={e => updateForm('tax', parseFloat(e.target.value) || 0)} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Total</label>
              <input type="number" step="0.01" readOnly style={{ ...styles.input, background: '#f1f5f9' }} value={formData.total || 0} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Amount Paid</label>
              <input type="number" step="0.01" style={styles.input} value={formData.amount_paid || 0} onChange={e => updateForm('amount_paid', parseFloat(e.target.value) || 0)} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Amount Due</label>
              <input type="number" step="0.01" readOnly style={{ ...styles.input, background: '#f1f5f9' }} value={formData.amount_due || 0} />
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '1rem 0' }} />
            <div style={styles.formGroup}>
              <label style={styles.label}>Notes</label>
              <textarea style={{ ...styles.input, minHeight: '60px' }} value={formData.notes || ''} onChange={e => updateForm('notes', e.target.value)} />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
          <button onClick={handleSave} style={styles.submitButton}>{receipt ? 'Update Invoice' : 'Create Invoice'}</button>
          <button onClick={() => { if (receipt) setEditing(false); else onBack(); }} style={styles.cancelButton}>Cancel</button>
        </div>
      </div>
    );
  }

  // Print / view mode
  return (
    <div style={styles.container}>
      {configPanel}
      <div className="no-print" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
        <button onClick={onBack} style={styles.backButton}>&larr; Back</button>
        <button onClick={() => setEditing(true)} style={styles.editButton}>Edit</button>
        <button onClick={() => setShowConfig(true)} style={{ ...styles.editButton, background: '#64748b' }}>⚙ Settings</button>
        <button onClick={() => window.print()} style={styles.printButton}>🖨 Print</button>
        {receipt && <button onClick={handleDelete} style={styles.deleteButton}>Delete</button>}
      </div>

      <div style={styles.invoiceContainer}>
        <div style={styles.invoiceHeader}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem' }}>INVOICE</h1>
            <p style={{ margin: '0.25rem 0', color: '#64748b' }}>#{displayData.receipt_number}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            {config.showOrderNumber && <p style={{ margin: '0.25rem 0' }}><strong>Order:</strong> #{displayData.order_id}</p>}
            {config.showInvoiceDate && <p style={{ margin: '0.25rem 0' }}><strong>Date:</strong> {displayData.created_at ? new Date(displayData.created_at).toLocaleDateString() : new Date().toLocaleDateString()}</p>}
            {config.showPaymentDate && displayData.payment_date && <p style={{ margin: '0.25rem 0' }}><strong>Paid:</strong> {new Date(displayData.payment_date).toLocaleDateString()}</p>}
            {config.showDueDate && displayData.payment_due_date && <p style={{ margin: '0.25rem 0' }}><strong>Due:</strong> {new Date(displayData.payment_due_date).toLocaleDateString()}</p>}
          </div>
        </div>

        <div style={styles.addressRow}>
          {config.showBillingAddress && (
            <div style={styles.addressBlock}>
              <h4 style={styles.addressLabel}>Bill To</h4>
              {displayData.billing_company && <p style={{ margin: '0.25rem 0', fontWeight: 'bold' }}>{displayData.billing_company}</p>}
              <p style={{ margin: '0.25rem 0', fontWeight: displayData.billing_company ? 'normal' : 'bold' }}>{displayData.billing_name}</p>
              {config.showBillingEmail && displayData.billing_email && <p style={{ margin: '0.25rem 0' }}>{displayData.billing_email}</p>}
              {config.showBillingPhone && displayData.billing_phone && <p style={{ margin: '0.25rem 0' }}>{displayData.billing_phone}</p>}
              {displayData.billing_address && <p style={{ margin: '0.25rem 0', whiteSpace: 'pre-line' }}>{displayData.billing_address}</p>}
            </div>
          )}
          {config.showShippingAddress && (
            <div style={styles.addressBlock}>
              <h4 style={styles.addressLabel}>Ship To</h4>
              <p style={{ margin: '0.25rem 0', whiteSpace: 'pre-line' }}>{displayData.shipping_address || 'Same as billing'}</p>
            </div>
          )}
        </div>

        <table style={styles.invoiceTable}>
          <thead>
            <tr>
              <th style={styles.invoiceTh}>Item</th>
              {config.showItemDescription && <th style={styles.invoiceTh}>Description</th>}
              {config.showItemSize && <th style={styles.invoiceTh}>Size</th>}
              <th style={{ ...styles.invoiceTh, textAlign: 'right' }}>Price</th>
              {config.showItemQty && <th style={{ ...styles.invoiceTh, textAlign: 'center' }}>Qty</th>}
              <th style={{ ...styles.invoiceTh, textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {orderItems.map((item, i) => (
              <tr key={item.id || i}>
                <td style={styles.invoiceTd}>{item.product_name || `Item ${i + 1}`}</td>
                {config.showItemDescription && <td style={styles.invoiceTd}>{item.product_description || item.notes || '-'}</td>}
                {config.showItemSize && <td style={styles.invoiceTd}>{item.size || '-'}</td>}
                <td style={{ ...styles.invoiceTd, textAlign: 'right' }}>{fmt(item.price)}</td>
                {config.showItemQty && <td style={{ ...styles.invoiceTd, textAlign: 'center' }}>{item.quantity || 1}</td>}
                <td style={{ ...styles.invoiceTd, textAlign: 'right' }}>{fmt((item.price || 0) * (item.quantity || 1))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={styles.totalsSection}>
          {config.showSubtotal && <div style={styles.totalsRow}><span>Subtotal</span><span>{fmt(displayData.subtotal)}</span></div>}
          {config.showShipping && <div style={styles.totalsRow}><span>Shipping</span><span>{fmt(displayData.shipping_price)}</span></div>}
          {config.showTax && (displayData.tax || 0) > 0 && <div style={styles.totalsRow}><span>Tax</span><span>{fmt(displayData.tax)}</span></div>}
          <div style={{ ...styles.totalsRow, fontWeight: 'bold', fontSize: '1.1rem', borderTop: '2px solid #1e293b', paddingTop: '0.5rem' }}>
            <span>Total</span><span>{fmt(displayData.total)}</span>
          </div>
          {config.showAmountPaid && (
            <div style={{ ...styles.totalsRow, marginTop: '1rem' }}>
              <span>Amount Paid</span><span>{fmt(displayData.amount_paid)}</span>
            </div>
          )}
          {config.showAmountDue && (
            <div style={{ ...styles.totalsRow, fontWeight: 'bold', color: (displayData.amount_due || 0) > 0 ? '#ef4444' : '#10b981' }}>
              <span>Amount Due</span><span>{fmt(displayData.amount_due)}</span>
            </div>
          )}
        </div>

        <div style={styles.paymentInfo}>
          {config.showPayTo && (payTo.businessName || payTo.contactName) && (
            <div style={{ marginBottom: '0.75rem' }}>
              <strong>Pay To:</strong>
              {payTo.businessName && <p style={{ margin: '0.25rem 0' }}>{payTo.businessName}</p>}
              {payTo.contactName && <p style={{ margin: '0.25rem 0' }}>{payTo.contactName}</p>}
              {payTo.address && <p style={{ margin: '0.25rem 0' }}>{payTo.address}</p>}
              {(payTo.city || payTo.state || payTo.zip) && (
                <p style={{ margin: '0.25rem 0' }}>{[payTo.city, payTo.state].filter(Boolean).join(', ')}{payTo.zip ? ` ${payTo.zip}` : ''}</p>
              )}
              {payTo.email && <p style={{ margin: '0.25rem 0' }}>{payTo.email}</p>}
              {payTo.phone && <p style={{ margin: '0.25rem 0' }}>{payTo.phone}</p>}
            </div>
          )}
          {config.showPaymentMethod && displayData.payment_type && <p><strong>Payment Method:</strong> {displayData.payment_type}</p>}
          {config.showPayTo && (payTo.checkPayableTo || payTo.venmoHandle || payTo.paypalEmail) && (
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
              <strong>Payment Options:</strong>
              {payTo.checkPayableTo && <p style={{ margin: '0.25rem 0' }}>Check payable to: <strong>{payTo.checkPayableTo}</strong></p>}
              {payTo.venmoHandle && <p style={{ margin: '0.25rem 0' }}>Venmo: <strong>{payTo.venmoHandle}</strong></p>}
              {payTo.paypalEmail && <p style={{ margin: '0.25rem 0' }}>PayPal: <strong>{payTo.paypalEmail}</strong></p>}
            </div>
          )}
          {config.showPaymentReceived && (
            <p style={{ color: displayData.payment_received ? '#10b981' : '#f59e0b', fontWeight: 'bold', fontSize: '1.1rem' }}>
              {displayData.payment_received ? '✓ PAYMENT RECEIVED' : '⏳ PAYMENT PENDING'}
            </p>
          )}
        </div>

        {config.showNotes && displayData.notes && (
          <div style={styles.notesSection}>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Notes</h4>
            <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{displayData.notes}</p>
          </div>
        )}

        {config.showFooter && (
          <div style={styles.footer}>
            <p>Thank you for your business!</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '1rem' },
  backButton: { background: 'transparent', border: 'none', fontSize: '1rem', cursor: 'pointer' },
  editButton: { background: '#3b82f6', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' },
  printButton: { background: '#10b981', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' },
  submitButton: { background: '#3b82f6', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' },
  cancelButton: { padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', background: 'white' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' },
  formSection: { background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' },
  formGroup: { marginBottom: '1rem' },
  label: { display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' },
  input: { width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' },
  configOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  configPanel: { background: 'white', padding: '2rem', borderRadius: '8px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' },
  configGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' },
  configItem: { display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '0.25rem 0' },
  invoiceContainer: { background: 'white', padding: '2.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', maxWidth: '800px' },
  invoiceHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid #1e293b' },
  addressRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' },
  addressBlock: { padding: '1rem', background: '#f8fafc', borderRadius: '4px' },
  addressLabel: { margin: '0 0 0.5rem 0', color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' },
  invoiceTable: { width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' },
  invoiceTh: { padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e2e8f0', fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' },
  invoiceTd: { padding: '0.75rem', borderBottom: '1px solid #f1f5f9' },
  totalsSection: { marginLeft: 'auto', maxWidth: '300px', marginBottom: '1.5rem' },
  totalsRow: { display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0' },
  paymentInfo: { padding: '1rem', background: '#f8fafc', borderRadius: '4px', marginBottom: '1rem' },
  notesSection: { padding: '1rem', background: '#fffbeb', borderRadius: '4px', marginBottom: '1rem', border: '1px solid #fde68a' },
  footer: { textAlign: 'center', color: '#64748b', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0', fontStyle: 'italic' }
};

export default Invoice;