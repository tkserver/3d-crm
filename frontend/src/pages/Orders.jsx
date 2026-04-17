import { useState, useEffect } from 'react';
import OrderDetail from './OrderDetail.jsx';
import NewOrderForm from './NewOrderForm.jsx';

function Orders({ customers }) {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCustomerId, setFilterCustomerId] = useState('');
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (customers.length > 0 && !initialized) {
      setInitialized(true);
    }
  }, [customers]);

  useEffect(() => {
    if (initialized) {
      fetchOrders();
    }
  }, [initialized]);

  const fetchOrders = () => {
    let url = '/api/orders';
    const params = [];
    if (filterStatus) params.push(`status=${filterStatus}`);
    if (filterCustomerId) params.push(`customer_id=${filterCustomerId}`);
    if (params.length > 0) url += '?' + params.join('&');
    fetch(url)
      .then(r => r.json())
      .then(orders => {
        const fetchPromises = orders.map(order => {
          if (order.id) {
            return fetch(`/api/orders/${order.id}/items`)
              .then(r => r.json())
              .then(items => ({ ...order, items }));
          }
          return Promise.resolve({ ...order, items: [] });
        });
        Promise.all(fetchPromises).then(updatedOrders => {
          setOrders(updatedOrders);
        });
      });
  };

  const handleDelete = (id) => {
    if (!confirm('Are you sure?')) return;
    fetch(`/api/orders/${id}`, { method: 'DELETE' }).then(() => {
      fetchOrders();
      if (selectedOrder?.id === id) setSelectedOrder(null);
    });
  };

  const handleCreateOrder = (orderData) => {
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    }).then(() => {
      setShowNewOrderModal(false);
      setEditingOrder(null);
      fetchOrders();
    });
  };

  const handleUpdateOrder = (id, orderData) => {
    fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    }).then(() => {
      fetchOrders();
      setSelectedOrder(null);
    });
  };

  const handleCreateItem = (orderId, itemData) => {
    fetch(`/api/orders/${orderId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData)
    }).then(() => {
      fetchOrders();
      if (selectedOrder) setSelectedOrder({ ...selectedOrder, items: [...(selectedOrder.items || []), { id: Date.now(), ...itemData }] });
    });
  };

  const handleUpdateItem = (itemId, itemData) => {
    fetch(`/api/order-items/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData)
    }).then(() => fetchOrders());
  };

  const handleDeleteItem = (itemId) => {
    if (!confirm('Are you sure?')) return;
    fetch(`/api/order-items/${itemId}`, { method: 'DELETE' }).then(() => fetchOrders());
  };

  const handleCreatePrintJob = (itemId, jobData) => {
    fetch(`/api/order-items/${itemId}/print-jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobData)
    }).then(() => fetchOrders());
  };

  const handleUpdatePrintJob = (jobId, jobData) => {
    fetch(`/api/print-jobs/${jobId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobData)
    }).then(() => fetchOrders());
  };

  const handleDeletePrintJob = (jobId) => {
    if (!confirm('Are you sure?')) return;
    fetch(`/api/print-jobs/${jobId}`, { method: 'DELETE' }).then(() => fetchOrders());
  };

  const statusColors = {
    NEW: '#f59e0b',
    QUEUED: '#3b82f6',
    PRINTING: '#8b5cf6',
    COMPLETE: '#10b981',
    SHIPPED: '#06b6d4'
  };

  return (
    <div style={styles.container}>
      {selectedOrder ? (
        <OrderDetail
          order={selectedOrder}
          customers={customers}
          onUpdateOrder={handleUpdateOrder}
          onDeleteOrder={handleDelete}
          onCreateItem={handleCreateItem}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
          onCreatePrintJob={handleCreatePrintJob}
          onUpdatePrintJob={handleUpdatePrintJob}
          onDeletePrintJob={handleDeletePrintJob}
          onBack={() => setSelectedOrder(null)}
        />
      ) : (
        <>
          <div style={styles.header}>
            <h1>Orders</h1>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="">All Statuses</option>
                {Object.keys(statusColors).map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              {customers.length > 0 && (
                <select
                  value={filterCustomerId}
                  onChange={(e) => setFilterCustomerId(e.target.value)}
                  style={styles.filterSelect}
                >
                  <option value="">All Customers</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>{`${customer.first_name} ${customer.last_name}`}</option>
                  ))}
                </select>
              )}
              <button onClick={() => setShowNewOrderModal(true)} style={styles.addButton}>+ New Order</button>
            </div>
          </div>

           <table style={styles.table}>
             <thead>
               <tr>
                 <th style={styles.th}>ID</th>
                 <th style={styles.th}>Customer</th>
                 <th style={styles.th}>Address</th>
                 <th style={styles.th}>Status</th>
                 <th style={styles.th}>Items</th>
                 <th style={styles.th}>Shipping</th>
                 <th style={styles.th}>Total</th>
                 <th style={styles.th}>Created</th>
                 <th style={styles.th}>Actions</th>
               </tr>
             </thead>
             <tbody>
               {orders.map(order => {
                 const itemsTotal = (order.items || []).reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
                 const orderTotal = itemsTotal + (order.shipping_price || 0);
                 return (
                   <tr key={order.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedOrder(order)}>
                     <td style={styles.td}>{order.id}</td>
                     <td style={styles.td}>{`${order.first_name || ''} ${order.last_name || ''}`.trim() || 'Unknown'}</td>
                     <td style={styles.td}>{order.address_line1 || '-'}</td>
                     <td style={{ ...styles.td, color: statusColors[order.status], fontWeight: 'bold' }}>
                       {order.status}
                      </td>
                       <td style={styles.td}>
                         {order.items?.map((item, i) => (
                           <div key={i}>{item.product_name || item.product_id}</div>
                         ))}
                       </td>
                       <td style={styles.td}>
                         {order.carrier ? `${order.carrier} ${order.tracking_number || ''}` : '-'}
                       </td>
                       <td style={{ ...styles.td, fontWeight: 'bold' }}>
                         ${orderTotal.toFixed(2)}
                       </td>
                      <td style={styles.td}>{new Date(order.created_at).toLocaleDateString()}</td>
                   <td style={styles.td}>
                     <button onClick={(e) => { e.stopPropagation(); setEditingOrder(order); }} style={{ ...styles.deleteButton, background: '#3b82f6', marginRight: '0.5rem' }}>Edit</button>
                     <button onClick={(e) => { e.stopPropagation(); handleDelete(order.id); }} style={styles.deleteButton}>Delete</button>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>

          {showNewOrderModal && (
            <div style={styles.modal}>
              <div style={styles.modalContent}>
                <h2>Create New Order</h2>
                <NewOrderForm
                  customers={customers}
                  onCancel={() => setShowNewOrderModal(false)}
                  onSubmit={handleCreateOrder}
                />
              </div>
            </div>
          )}

          {editingOrder && (
            <div style={styles.modal}>
              <div style={styles.modalContent}>
                <h2>Edit Order</h2>
                <NewOrderForm
                  customers={customers}
                  initialData={editingOrder}
                  onCancel={() => setEditingOrder(null)}
                   onSubmit={(data) => {
                     const orderItems = data.items || [];
                     delete data.items;
                     
                     fetch(`/api/orders/${editingOrder.id}`, {
                       method: 'PUT',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify(data)
                     }).then(() => {
                       const itemPromises = orderItems.map(item => {
                         if (item.id && !String(item.id).startsWith('new-')) {
                           return fetch(`/api/order-items/${item.id}`, {
                             method: 'PUT',
                             headers: { 'Content-Type': 'application/json' },
                             body: JSON.stringify(item)
                           });
                         } else {
                           return fetch(`/api/orders/${editingOrder.id}/items`, {
                             method: 'POST',
                             headers: { 'Content-Type': 'application/json' },
                             body: JSON.stringify(item)
                           });
                         }
                       });
                       
                       Promise.all(itemPromises).then(() => {
                         setEditingOrder(null);
                         fetchOrders();
                       });
                     });
                   }}
                />
              </div>
            </div>
          )}
        </>
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
  filterSelect: { padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' },
  table: { width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden' },
  th: { padding: '1rem', textAlign: 'left', background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' },
  td: { padding: '1rem', borderBottom: '1px solid #e2e8f0' },
  deleteButton: { background: '#ef4444', color: 'white', border: 'none', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer' },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalContent: { background: 'white', padding: '2rem', borderRadius: '8px', minWidth: '400px' },
  formActions: { display: 'flex', gap: '1rem', justifyContent: 'flex-end' },
  cancelButton: { padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' },
  submitButton: { padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }
};

export default Orders;
