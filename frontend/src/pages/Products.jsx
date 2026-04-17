import { useState, useEffect } from 'react';

function Products({ navigateTo }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: 0,
    material: '',
    size: '',
    image_url: ''
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, categoryFilter, sortField, sortOrder, currentPage]);

  const fetchProducts = () => {
    setLoading(true);
    setError(null);
    
    let url = `/api/products?page=${currentPage}&limit=${limit}&sort=${sortField}&order=${sortOrder}`;
    if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
    if (categoryFilter) url += `&category=${encodeURIComponent(categoryFilter)}`;
    
    fetch(url)
      .then(r => r.json())
      .then(data => {
        setProducts(data.products || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setCategories(data.categories || []);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load products');
        setLoading(false);
      });
  };

  const handleDelete = (id) => {
    fetch(`/api/products/${id}`, { method: 'DELETE' })
      .then(r => r.json())
      .then(() => {
        setDeleteConfirmId(null);
        fetchProducts();
        setSuccessMessage('Product deleted successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      })
      .catch(err => {
        setError('Failed to delete product');
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const method = editingProduct ? 'PUT' : 'POST';
    const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
    
    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(r => r.json())
      .then(() => {
        setShowModal(false);
        setEditingProduct(null);
        setFormData({ name: '', description: '', category: '', price: 0, material: '', size: '', image_url: '' });
        fetchProducts();
        setSuccessMessage(editingProduct ? 'Product updated successfully' : 'Product created successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      })
      .catch(err => {
        setError('Failed to save product');
      });
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      category: product.category || '',
      price: product.price || 0,
      material: product.material || '',
      size: product.size || '',
      image_url: product.image_url || ''
    });
    setShowModal(true);
  };

  const handleNew = () => {
    setEditingProduct(null);
    setFormData({ name: '', description: '', category: '', price: 0, material: '', size: '', image_url: '' });
    setShowModal(true);
  };

  const goBack = () => {
    if (navigateTo) navigateTo('dashboard');
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) return <span style={styles.sortIcon}>↕</span>;
    return sortOrder === 'asc' 
      ? <span style={styles.sortIcon}>↑</span> 
      : <span style={styles.sortIcon}>↓</span>;
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h1>Products</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <h1>Products</h1>
        <p style={{ color: '#ef4444' }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {successMessage && (
        <div style={{ ...styles.successBanner, marginBottom: '1rem' }}>
          {successMessage}
        </div>
      )}

      <div style={styles.header}>
        <h1>Products</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={goBack} style={{ ...styles.addButton, background: '#64748b' }}>← Back</button>
          <button onClick={handleNew} style={{ ...styles.addButton, background: '#3b82f6' }}>+ Add Product</button>
        </div>
      </div>

      <div style={styles.filters}>
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          style={styles.searchInput}
        />
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
          style={styles.filterSelect}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th onClick={() => handleSort('name')} style={styles.th}>
              Name {renderSortIcon('name')}
            </th>
            <th onClick={() => handleSort('category')} style={styles.th}>
              Category {renderSortIcon('category')}
            </th>
            <th onClick={() => handleSort('price')} style={styles.th}>
              Price {renderSortIcon('price')}
            </th>
            <th style={styles.th}>Material</th>
            <th style={styles.th}>Size</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ ...styles.td, textAlign: 'center', color: '#64748b' }}>
                No products found
              </td>
            </tr>
          ) : (
            products.map(product => (
              <tr key={product.id}>
                <td style={styles.td}>{product.name}</td>
                <td style={styles.td}>{product.category || '-'}</td>
                <td style={styles.td}>${(product.price || 0).toFixed(2)}</td>
                <td style={styles.td}>{product.material || '-'}</td>
                <td style={styles.td}>{product.size || '-'}</td>
                <td style={styles.td}>
                  <button onClick={() => handleEdit(product)} style={styles.editButton}>Edit</button>
                  {deleteConfirmId === product.id ? (
                    <div style={styles.confirmDelete}>
                      <button onClick={() => handleDelete(product.id)} style={{ ...styles.deleteButton, marginRight: '0.5rem' }}>Yes</button>
                      <button onClick={() => setDeleteConfirmId(null)} style={styles.cancelButton}>No</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirmId(product.id)} style={styles.deleteButton}>Delete</button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            style={{ ...styles.pageButton, opacity: currentPage === 1 ? 0.5 : 1 }}
          >
            Previous
          </button>
          <span style={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            style={{ ...styles.pageButton, opacity: currentPage === totalPages ? 0.5 : 1 }}
          >
            Next
          </button>
        </div>
      )}

      {showModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2>{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Name *</label>
                <input
                  required
                  style={styles.input}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  style={{ ...styles.input, minHeight: '60px' }}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Category</label>
                <input
                  style={styles.input}
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Price</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  style={styles.input}
                  value={formData.price || ''}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Material</label>
                <input
                  style={styles.input}
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Size</label>
                <input
                  style={styles.input}
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Image URL</label>
                <input
                  style={styles.input}
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                />
              </div>
              <div style={styles.formActions}>
                <button type="button" onClick={() => setShowModal(false)} style={styles.cancelButton}>Cancel</button>
                <button type="submit" style={styles.submitButton}>{editingProduct ? 'Update' : 'Create'}</button>
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
  successBanner: {
    background: '#d1fae5',
    color: '#065f46',
    padding: '0.75rem 1rem',
    borderRadius: '4px',
    marginBottom: '1rem'
  },
  addButton: {
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  filters: { display: 'flex', gap: '1rem', marginBottom: '1rem' },
  searchInput: { flex: 1, padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' },
  filterSelect: { padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' },
  table: { width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden' },
  th: { padding: '1rem', textAlign: 'left', background: '#f1f5f9', borderBottom: '2px solid #e2e8f0', cursor: 'pointer' },
  td: { padding: '1rem', borderBottom: '1px solid #e2e8f0' },
  editButton: { background: '#3b82f6', color: 'white', border: 'none', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer', marginRight: '0.5rem' },
  deleteButton: { background: '#ef4444', color: 'white', border: 'none', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer' },
  cancelButton: { padding: '0.25rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' },
  confirmDelete: { display: 'flex', gap: '0.5rem' },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalContent: { background: 'white', padding: '2rem', borderRadius: '8px', minWidth: '400px', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' },
  formGroup: { marginBottom: '1rem' },
  label: { display: 'block', marginBottom: '0.25rem', fontWeight: '500' },
  input: { width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' },
  formActions: { display: 'flex', gap: '1rem', justifyContent: 'flex-end' },
  submitButton: { padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1rem' },
  pageButton: { padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' },
  pageInfo: { color: '#64748b' }
};

export default Products;
