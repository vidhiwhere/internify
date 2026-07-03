import React from 'react';

export default function Dashboard({ internships }) {
  const total = internships.length;
  const verified = internships.filter(i => i.status === 'Verified').length;
  const pending = internships.filter(i => i.status === 'Pending').length;
  const sent = internships.filter(i => i.status === 'Sent').length;
  const revision = internships.filter(i => i.status === 'Correction Requested').length;
  const errors = internships.filter(i => i.status.startsWith('Error')).length;

  return (
    <div className="metrics-grid">
      <div className="metric-card">
        <div className="metric-header">
          <span className="metric-title">Total Internships</span>
          <div className="metric-icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{width: 20, height: 20}}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A2.25 2.25 0 0 1 12.75 21.5h-1.5a2.25 2.25 0 0 1-2.25-2.263V19.13m0 0A9.373 9.373 0 0 0 6.375 19.5a9.336 9.336 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M9 19.128v-.003c0-1.113.285-2.16.786-3.07M12 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 10.5a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0ZM8.25 5.25a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75Z" />
            </svg>
          </div>
        </div>
        <span className="metric-value">{total}</span>
        <span className="metric-indicator">Total uploaded profiles</span>
      </div>

      <div className="metric-card pending">
        <div className="metric-header">
          <span className="metric-title">Pending Dispatch</span>
          <div className="metric-icon-wrapper" style={{color: 'var(--status-pending-text)'}}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{width: 20, height: 20}}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
        </div>
        <span className="metric-value" style={{color: 'var(--status-pending-text)'}}>{pending}</span>
        <span className="metric-indicator">Awaiting HR verification mail</span>
      </div>

      <div className="metric-card sent">
        <div className="metric-header">
          <span className="metric-title">Out for Review</span>
          <div className="metric-icon-wrapper" style={{color: 'var(--status-sent-text)'}}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{width: 20, height: 20}}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          </div>
        </div>
        <span className="metric-value" style={{color: 'var(--status-sent-text)'}}>{sent}</span>
        <span className="metric-indicator">Emails sent to HR contacts</span>
      </div>

      <div className="metric-card verified">
        <div className="metric-header">
          <span className="metric-title">Verified</span>
          <div className="metric-icon-wrapper" style={{color: 'var(--status-verified-text)'}}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{width: 20, height: 20}}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
            </svg>
          </div>
        </div>
        <span className="metric-value" style={{color: 'var(--status-verified-text)'}}>{verified}</span>
        <span className="metric-indicator">Confirmed records ({total > 0 ? Math.round((verified / total) * 100) : 0}%)</span>
      </div>

      <div className="metric-card revision">
        <div className="metric-header">
          <span className="metric-title">Corrections</span>
          <div className="metric-icon-wrapper" style={{color: 'var(--status-revision-text)'}}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{width: 20, height: 20}}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
        </div>
        <span className="metric-value" style={{color: 'var(--status-revision-text)'}}>{revision}</span>
        <span className="metric-indicator">Updates requested by HR</span>
      </div>
    </div>
  );
}
