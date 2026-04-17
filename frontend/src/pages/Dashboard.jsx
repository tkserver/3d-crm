import { useState, useEffect } from 'react';

function Dashboard({ navigateTo }) {
  const [stats, setStats] = useState({
    new: 0,
    queued: 0,
    printing: 0,
    complete: 0,
    shipped: 0,
    active_print_jobs: 0
  });

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(r => r.json())
      .then(setStats);
  }, []);

  const statusColors = {
    new: '#f59e0b',
    queued: '#3b82f6',
    printing: '#8b5cf6',
    complete: '#10b981',
    shipped: '#06b6d4'
  };

  const statusLabels = {
    new: 'New Orders',
    queued: 'In Queue',
    printing: 'Printing',
    complete: 'Completed',
    shipped: 'Shipped'
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Dashboard</h1>
      
      <div style={styles.statsGrid}>
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} style={{ ...styles.statCard, borderLeft: `4px solid ${statusColors[key] || '#64748b'}` }}>
            <div style={styles.statValue}>{value}</div>
            <div style={styles.statLabel}>{statusLabels[key] || key.replace('_', ' ')}</div>
          </div>
        ))}
      </div>

      <h2 style={styles.subtitle}>Quick Actions</h2>
      <div style={styles.actionsGrid}>
        <button onClick={() => navigateTo('orders')} style={{ ...styles.actionCard, background: statusColors.new }}>
          <div style={styles.actionIcon}>➕</div>
          <div>Create New Order</div>
        </button>
        <button onClick={() => navigateTo('orders')} style={{ ...styles.actionCard, background: statusColors.printing }}>
          <div style={styles.actionIcon}>🖨️</div>
          <div>View Printing Jobs</div>
        </button>
        <button onClick={() => navigateTo('customers')} style={{ ...styles.actionCard, background: statusColors.shipped }}>
          <div style={styles.actionIcon}>👥</div>
          <div>Manage Customers</div>
        </button>
      </div>

      {stats.active_print_jobs > 0 && (
        <div style={styles.printJobsSection}>
          <h2 style={styles.subtitle}>Active Print Jobs</h2>
          <div style={{ background: 'white', padding: '1rem', borderRadius: '8px' }}>
            <p style={{ color: '#64748b' }}>{stats.active_print_jobs} print jobs currently active</p>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '1rem' },
  title: { marginBottom: '2rem', color: '#1e293b' },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem'
  },
  statCard: {
    background: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  statValue: { fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' },
  statLabel: { fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' },
  subtitle: { marginBottom: '1rem', color: '#1e293b' },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem'
  },
  actionCard: {
    background: '#e2e8f0',
    padding: '1.5rem',
    borderRadius: '8px',
    textDecoration: 'none',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem'
  },
  actionIcon: { fontSize: '2rem' },
  printJobsSection: { marginTop: '2rem' }
};

export default Dashboard;
