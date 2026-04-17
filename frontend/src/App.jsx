import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard.jsx';
import Customers from './pages/Customers.jsx';
import Orders from './pages/Orders.jsx';
import Products from './pages/Products.jsx';

function App() {
  const [view, setView] = useState(() => {
    const hash = window.location.hash.replace('#/', '');
    return hash || 'dashboard';
  });
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    fetch('/api/customers')
      .then(r => r.json())
      .then(setCustomers);
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '');
      setView(hash || 'dashboard');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (newView) => {
    window.location.hash = `/${newView}`;
  };

  return (
    <div style={styles.app}>
      <nav style={styles.nav}>
        <h1 style={styles.logo}>3D Print CRM</h1>
        <div style={styles.navLinks}>
          <button
            onClick={() => navigateTo('dashboard')}
            style={{ ...styles.navButton, ...(view === 'dashboard' ? styles.activeNav : {}) }}
          >
            Dashboard
          </button>
          <button
            onClick={() => navigateTo('customers')}
            style={{ ...styles.navButton, ...(view === 'customers' ? styles.activeNav : {}) }}
          >
            Customers
          </button>
          <button
            onClick={() => navigateTo('products')}
            style={{ ...styles.navButton, ...(view === 'products' ? styles.activeNav : {}) }}
          >
            Products
          </button>
          <button
            onClick={() => navigateTo('orders')}
            style={{ ...styles.navButton, ...(view === 'orders' ? styles.activeNav : {}) }}
          >
            Orders
          </button>
        </div>
      </nav>
      <main style={styles.main}>
        {view === 'dashboard' && <Dashboard customers={customers} navigateTo={navigateTo} />}
        {view === 'customers' && <Customers navigateTo={navigateTo} />}
        {view === 'products' && <Products navigateTo={navigateTo} />}
        {view === 'orders' && <Orders customers={customers} setCustomers={setCustomers} />}
      </main>
    </div>
  );
}

const styles = {
  app: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  nav: {
    background: '#1e293b',
    color: 'white',
    padding: '1rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logo: { fontSize: '1.5rem', fontWeight: 'bold' },
  navLinks: { display: 'flex', gap: '1rem' },
  navButton: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    borderRadius: '4px',
    fontSize: '0.9rem'
  },
  activeNav: { background: '#3b82f6', color: 'white' },
  main: { flex: 1, padding: '2rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }
};

export default App;
