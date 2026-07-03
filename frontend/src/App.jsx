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

  // Simple router check
  const path = window.location.pathname;
  const isVerifyPage = path.startsWith('/verify/');
  const verifyToken = isVerifyPage ? path.split('/verify/')[1] : null;

  // On mount, load initial data & dark theme
  useEffect(() => {
    if (!isVerifyPage) {
      fetchInternships();
      fetchSettings();
      fetchLogs();
    }
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

  return (
    <div className="app-container">
      
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div>
          <div className="brand">
            <div className="brand-icon">I</div>
            <span className="brand-name">Internify</span>
          </div>
          
          <ul className="nav-menu">
            <li
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
              </svg>
              Dashboard
            </li>
            
            <li
              className={`nav-item ${activeTab === 'logs' ? 'active' : ''}`}
              onClick={() => setActiveTab('logs')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
              Mock Outbox
              {logs.length > 0 && (
                <span style={{ marginLeft: 'auto', backgroundColor: 'var(--accent-primary)', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: 99 }}>
                  {logs.length}
                </span>
              )}
            </li>

            <li
              className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.645-.869L9.594 3.94ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" />
              </svg>
              Settings
            </li>
          </ul>
        </div>

        {/* Sidebar Footer with Theme Toggle */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>v1.0.0</span>
          
          <button 
            type="button" 
            className="btn btn-secondary" 
            style={{ padding: 8, borderRadius: '50%', width: 36, height: 36 }}
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 18, height: 18 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 18, height: 18 }}>
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
