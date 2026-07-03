import React, { useState } from 'react';

export default function EmailLog({ logs, onClear, addToast }) {
  const [selectedLog, setSelectedLog] = useState(null);

  const handleClear = async () => {
    if (window.confirm('Are you sure you want to clear all mock email logs?')) {
      await onClear();
      setSelectedLog(null);
      addToast('Mock outbox cleared', 'success');
    }
  };

  return (
    <div>
      <div className="log-layout">
        {/* Logs List Sidebar */}
        <div className="log-sidebar">
          <div className="log-sidebar-header">
            <h4 style={{ fontWeight: 600, fontFamily: 'var(--font-display)' }}>Simulated Outbox</h4>
            {logs.length > 0 && (
              <button 
                className="btn btn-outline" 
                style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}
                onClick={handleClear}
              >
                Clear All
              </button>
            )}
          </div>
          
          <ul className="log-list">
            {logs.length === 0 ? (
              <li style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Outbox is empty. Send a verification email to see simulated emails here.
              </li>
            ) : (
              logs.map(log => (
                <li
                  key={log.id}
                  className={`log-item ${selectedLog && selectedLog.id === log.id ? 'active' : ''}`}
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="log-item-header">
                    <span>To: HR contact</span>
                    <span>{new Date(log.sentOn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="log-item-to">{log.to}</div>
                  <div className="log-item-subj">{log.subject}</div>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Log Viewer Detail Pane */}
        <div className="log-detail">
          {selectedLog ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="log-detail-header">
                <h3 className="log-detail-subj">{selectedLog.subject}</h3>
                <div className="log-detail-meta">
                  <div><strong>From:</strong> Training & Placement Cell</div>
                  <div><strong>To:</strong> {selectedLog.to}</div>
                  <div><strong>Sent:</strong> {new Date(selectedLog.sentOn).toLocaleString()}</div>
                </div>
              </div>
              <div className="log-body-container">
                {selectedLog.html ? (
                  <iframe
                    title="Email Preview"
                    className="log-email-preview-iframe"
                    srcDoc={selectedLog.html}
                  />
                ) : (
                  <div className="log-email-preview">
                    {selectedLog.body}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="log-detail-empty">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
              <div>Select an email from the outbox list to view the HTML preview</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
