import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import InternshipTable from './components/InternshipTable';
import EmailLog from './components/EmailLog';
import Settings from './components/Settings';
import HRVerify from './components/HRVerify';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [internships, setInternships] = useState([]);
  const [settings, setSettings] = useState(null);
  const [logs, setLogs] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [theme, setTheme] = useState('dark');
  const [loading, setLoading] = useState(true);

  // Simple router check
  const path = window.location.pathname;
  const isVerifyPage = path.startsWith('/verify/');
  const verifyToken = isVerifyPage ? path.split('/verify/')[1] : null;

  // On mount, load initial data & dark theme
  useEffect(() => {
    const loadData = async () => {
      if (!isVerifyPage) {
        await Promise.all([
          fetchInternships(),
          fetchSettings(),
          fetchLogs()
        ]);
        // Slight delay to showcase the gorgeous glowing liquid loader
        setTimeout(() => setLoading(false), 1200);
      } else {
        setLoading(false);
      }
    };
    loadData();
    // Apply default dark theme to body
    document.body.classList.remove('light-theme');
  }, [isVerifyPage]);

  // Toast manager
  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // REST API Handlers
  const fetchInternships = async () => {
    try {
      const res = await fetch('/api/internships');
      if (!res.ok) throw new Error('Failed to load internships');
      const data = await res.json();
      setInternships(data);
    } catch (err) {
      addToast('Error fetching internships: ' + err.message, 'error');
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('Failed to load settings');
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      addToast('Error fetching settings: ' + err.message, 'error');
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs');
      if (!res.ok) throw new Error('Failed to load logs');
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      addToast('Error fetching mock logs: ' + err.message, 'error');
    }
  };

  const handleAddInternship = async (newRecord) => {
    const res = await fetch('/api/internships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to add internship');
    }
    await fetchInternships();
  };

  const handleUpdateInternship = async (id, updatedFields) => {
    const res = await fetch(`/api/internships/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedFields),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to update internship');
    }
    await fetchInternships();
  };

  const handleDeleteInternship = async (id) => {
    try {
      const res = await fetch(`/api/internships/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to remove record');
      await fetchInternships();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleSaveSettings = async (updatedSettings) => {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedSettings),
    });
    if (!res.ok) throw new Error('Failed to update config settings');
    const data = await res.json();
    setSettings(data.settings);
    await fetchInternships(); // Refetch if college name/replyTo changed
  };

  const handleSendEmail = async (id) => {
    addToast('Sending verification email...', 'info');
    try {
      const res = await fetch('/api/internships/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Dispatch error');
      }
      addToast('Verification dispatch successful!', 'success');
      await fetchInternships();
      await fetchLogs();
    } catch (err) {
      addToast('Mailer failed: ' + err.message, 'error');
      await fetchInternships(); // Pull error state from server
    }
  };

  const handleBulkSend = async (ids) => {
    addToast(`Dispatching verification batch (${ids.length} items)...`, 'info');
    try {
      const res = await fetch('/api/internships/bulk-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error('Failed bulk mailing');
      const data = await res.json();
      addToast(`Batch complete. Dispatched: ${data.sent}, Failed: ${data.errors}`, 'success');
      await fetchInternships();
      await fetchLogs();
    } catch (err) {
      addToast('Bulk mailer error: ' + err.message, 'error');
      await fetchInternships();
    }
  };

  const handleClearLogs = async () => {
    const res = await fetch('/api/logs/clear', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to clear logs');
    setLogs([]);
  };

  // Theme Toggler
  const toggleTheme = () => {
    if (theme === 'dark') {
      document.body.classList.add('light-theme');
      setTheme('light');
    } else {
      document.body.classList.remove('light-theme');
      setTheme('dark');
    }
  };

  // Render HR verification subpage directly
  if (isVerifyPage) {
    return <HRVerify token={verifyToken} />;
  }

  if (loading) {
    return (
      <div className="page-loader">
        <div className="loader">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <defs>
              <mask id="clipping">
                <polygon points="0,0 100,0 100,100 0,100" fill="black"></polygon>
                <polygon points="25,25 75,25 50,75" fill="white"></polygon>
                <polygon points="50,25 75,75 25,75" fill="white"></polygon>
                <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                <polygon points="35,35 65,35 50,65" fill="white"></polygon>
              </mask>
            </defs>
          </svg>
          <div className="box"></div>
        </div>
        <div className="page-loader-text">Loading Placement Cell Console...</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand-wrapper">
          <div className="brand-icon">I</div>
        </div>

        <article className="sidebar-menu-card">
          {/* Dashboard Tab */}
          <div
            className={`sidebar-menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
            title="Dashboard"
          >
            <svg
              className="sidebar-menu-icon"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path
                d="M4 13h6a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1zm-1 7a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v4zm10 0a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v7zm1-10h6a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1z"
              ></path>
            </svg>
          </div>

          {/* Logs Tab */}
          <div
            className={`sidebar-menu-item ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
            title="Mock Outbox"
          >
            <div className="sidebar-icon-badge-wrapper">
              <svg
                className="sidebar-menu-icon"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
              >
                <path
                  d="M5 18v3.766l1.515-.909L11.277 18H16c1.103 0 2-.897 2-2V8c0-1.103-.897-2-2-2H4c-1.103 0-2 .897-2 2v8c0 1.103.897 2 2 2h1zM4 8h12v8h-5.277L7 18.234V16H4V8z"
                ></path>
                <path
                  d="M20 2H8c-1.103 0-2 .897-2 2h12c1.103 0 2 .897 2 2v8c1.103 0 2-.897 2-2V4c0-1.103-.897-2-2-2z"
                ></path>
              </svg>
              {logs.length > 0 && (
                <span className="sidebar-badge-count">{logs.length}</span>
              )}
            </div>
          </div>

          {/* Settings Tab */}
          <div
            className={`sidebar-menu-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
            title="Settings"
          >
            <svg
              className="sidebar-menu-icon"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 16c2.206 0 4-1.794 4-4s-1.794-4-4-4-4 1.794-4 4 1.794 4 4 4zm0-6c1.084 0 2 .916 2 2s-.916 2-2 2-2-.916-2-2 .916-2 2-2z"
              ></path>
              <path
                d="m2.845 16.136 1 1.73c.531.917 1.809 1.261 2.73.73l.529-.306A8.1 8.1 0 0 0 9 19.402V20c0 1.103.897 2 2 2h2c1.103 0 2-.897 2-2v-.598a8.132 8.132 0 0 0 1.896-1.111l.529.306c.923.53 2.198.188 2.731-.731l.999-1.729a2.001 2.001 0 0 0-.731-2.732l-.505-.292a7.718 7.718 0 0 0 0-2.224l.505-.292a2.002 2.002 0 0 0 .731-2.732l-.999-1.729c-.531-.92-1.808-1.265-2.731-.732l-.529.306A8.1 8.1 0 0 0 15 4.598V4c0-1.103-.897-2-2-2h-2c-1.103 0-2 .897-2 2v.598a8.132 8.132 0 0 0-1.896 1.111l-.529-.306c-.924-.531-2.2-.187-2.731.732l-.999 1.729a2.001 2.001 0 0 0 .731 2.732l.505.292a7.683 7.683 0 0 0 0 2.223l-.505.292a2.003 2.003 0 0 0-.731 2.733zm3.326-2.758A5.703 5.703 0 0 1 6 12c0-.462.058-.926.17-1.378a.999.999 0 0 0-.47-1.108l-1.123-.65.998-1.729 1.145.662a.997.997 0 0 0 1.188-.142 6.071 6.071 0 0 1 2.384-1.399A1 1 0 0 0 11 5.3V4h2v1.3a1 1 0 0 0 .708.956 6.083 6.083 0 0 1 2.384 1.399.999.999 0 0 0 1.188.142l1.144-.661 1 1.729-1.124.649a1 1 0 0 0-.47 1.108c.112.452.17.916.17 1.378 0 .461-.058.925-.171 1.378a1 1 0 0 0 .471 1.108l1.123.649-.998 1.729-1.145-.661a.996.996 0 0 0-1.188.142 6.071 6.071 0 0 1-2.384 1.399A1 1 0 0 0 13 18.7l.002 1.3H11v-1.3a1 1 0 0 0-.708-.956 6.083 6.083 0 0 1-2.384-1.399.992.992 0 0 0-1.188-.141l-1.144.662-1-1.729 1.124-.651a1 1 0 0 0 .471-1.108z"
              ></path>
            </svg>
          </div>
        </article>

        <div className="sidebar-footer-wrapper">
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="18" height="18">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="18" height="18">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
              </svg>
            )}
          </button>
        </div>
      </aside>

      {/* Main Workspace Panels */}
      <main className="main-content">
        
        {/* Dynamic header titles depending on tab */}
        <header className="content-header">
          {activeTab === 'dashboard' && (
            <>
              <h1 className="content-title">Placement Verification Cell</h1>
              <span className="content-subtitle">Monitor and dispatch HR verification requests for student internships.</span>
            </>
          )}
          {activeTab === 'logs' && (
            <>
              <h1 className="content-title">Mock Outbox Console</h1>
              <span className="content-subtitle">Inspect generated student credentials emails and mock links.</span>
            </>
          )}
          {activeTab === 'settings' && (
            <>
              <h1 className="content-title">System Configuration</h1>
              <span className="content-subtitle">Manage default institution metadata and SMTP mail server parameters.</span>
            </>
          )}
        </header>

        {/* Tab Switch View */}
        {activeTab === 'dashboard' && (
          <div>
            <Dashboard internships={internships} />
            <InternshipTable
              internships={internships}
              onAdd={handleAddInternship}
              onUpdate={handleUpdateInternship}
              onDelete={handleDeleteInternship}
              onSendEmail={handleSendEmail}
              onBulkSend={handleBulkSend}
              addToast={addToast}
            />
          </div>
        )}

        {activeTab === 'logs' && (
          <EmailLog
            logs={logs}
            onClear={handleClearLogs}
            addToast={addToast}
          />
        )}

        {activeTab === 'settings' && (
          <Settings
            settings={settings}
            onSave={handleSaveSettings}
            addToast={addToast}
          />
        )}
      </main>

      {/* Floating Toast Message Center */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <span style={{ fontSize: '1rem' }}>
              {toast.type === 'success' && '✓'}
              {toast.type === 'error' && '✕'}
              {toast.type === 'info' && '🛈'}
              {toast.type === 'warning' && '⚠'}
            </span>
            <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{toast.message}</div>
          </div>
        ))}
      </div>

    </div>
  );
}
