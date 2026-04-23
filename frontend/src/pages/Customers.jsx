import { useState, useEffect } from 'react';

function Customers({ navigateTo, onCustomerSelect }) {
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({ first_name: '', last_name: '', company: '', email: '', phone: '', address: '' });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = () => {
    fetch('/api/customers')
      .then(r => r.json())
      .then(setCustomers);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const method = editingCustomer ? 'PUT' : 'POST';
    const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers';
    
    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    }).then(() => {
      fetchCustomers();
      setShowModal(false);
      setEditingCustomer(null);
      setFormData({ first_name: '', last_name: '', company: '', email: '', phone: '', address: '' });
    });
  };

  const handleDelete = (id) => {
    if (!confirm('Are you sure?')) return;
    fetch(`/api/customers/${id}`, { method: 'DELETE' }).then(() => fetchCustomers());
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({ 
      first_name: customer.first_name || '', 
      last_name: customer.last_name || '',
      company: customer.company || '',
      email: customer.email || '', 
      phone: customer.phone || '', 
      address: customer.address || '' 
    });
    setShowModal(true);
  };

  const handleNew = () => {
    setEditingCustomer(null);
    setFormData({ first_name: '', last_name: '', company: '', email: '', phone: '', address: '' });
    setShowModal(true);
  };

  const goBack = () => {
    if (navigateTo) navigateTo('dashboard');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Customers</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={goBack} style={{ ...styles.addButton, background: '#64748b' }}>← Back</button>
          <button onClick={handleNew} style={{ ...styles.addButton, background: '#3b82f6' }}>+ Add Customer</button>
        </div>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Company</th>
            <th style={styles.th}>Email</th>
            <th style={styles.th}>Phone</th>
            <th style={styles.th}>Address</th>
            <th style={styles.th}>Orders</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map(customer => (
            <tr key={customer.id}>
              <td style={styles.td}>{`${customer.first_name || ''} ${customer.last_name || ''}`}</td>
              <td style={styles.td}>{customer.company || '-'}</td>
              <td style={styles.td}>{customer.email || '-'}</td>
              <td style={styles.td}>{customer.phone || '-'}</td>
              <td style={styles.td}>{customer.address || '-'}</td>
               <td style={styles.td}>
                 <button onClick={() => { if (navigateTo) navigateTo('orders'); if (onCustomerSelect) onCustomerSelect(customer.id); }} style={{ ...styles.linkButton, marginRight: '0.5rem' }}>
                   View Orders
                 </button>
               </td>
              <td style={styles.td}>
                <button onClick={() => handleEdit(customer)} style={styles.editButton}>Edit</button>
                <button onClick={() => handleDelete(customer.id)} style={styles.deleteButton}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2>{editingCustomer ? 'Edit Customer' : 'Add Customer'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>First Name *</label>
                <input
                  required
                  style={styles.input}
                  value={formData.first_name}
                  onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Last Name *</label>
                <input
                  required
                  style={styles.input}
                  value={formData.last_name}
                  onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Company</label>
                <input
                  style={styles.input}
                  value={formData.company}
                  onChange={e => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  style={styles.input}
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Phone</label>
                <input
                  type="tel"
                  style={styles.input}
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Address</label>
                <textarea
                  style={{ ...styles.input, minHeight: '80px' }}
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div style={styles.formActions}>
                <button type="button" onClick={() => setShowModal(false)} style={styles.cancelButton}>Cancel</button>
                <button type="submit" style={styles.submitButton}>{editingCustomer ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '1rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  addButton: {
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  table: { width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden' },
  th: { padding: '1rem', textAlign: 'left', background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' },
  td: { padding: '1rem', borderBottom: '1px solid #e2e8f0' },
  editButton: { background: '#3b82f6', color: 'white', border: 'none', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer', marginRight: '0.5rem' },
  deleteButton: { background: '#ef4444', color: 'white', border: 'none', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer' },
  linkButton: { background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer' },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalContent: { background: 'white', padding: '2rem', borderRadius: '8px', minWidth: '400px' },
  formGroup: { marginBottom: '1rem' },
  label: { display: 'block', marginBottom: '0.25rem', fontWeight: '500' },
  input: { width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' },
  formActions: { display: 'flex', gap: '1rem', justifyContent: 'flex-end' },
  cancelButton: { padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' },
  submitButton: { padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }
};

export default Customers;
