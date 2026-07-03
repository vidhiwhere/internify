import React, { useEffect, useState } from 'react';

export default function HRVerify({ token }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [record, setRecord] = useState(null);
  
  // HR interactive choices
  const [action, setAction] = useState(null); // 'approve' or 'reject'
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [doneStatus, setDoneStatus] = useState(''); // 'Verified' or 'Correction Requested'
  const [submittedFeedback, setSubmittedFeedback] = useState('');

  useEffect(() => {
    fetchMetadata();
  }, [token]);

  const fetchMetadata = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/verify/${token}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to fetch internship records');
      }
      const data = await res.json();
      setRecord(data);
      if (data.status === 'Verified' || data.status === 'Correction Requested') {
        setDoneStatus(data.status);
        setSubmittedFeedback(data.feedback);
      }
    } catch (err) {
      setError(err.message || 'Verification link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (action === 'reject' && !feedback.trim()) {
      alert('Please specify the required corrections so we can update our records.');
      return;
    }

    setSubmitting(true);
    try {
      const approve = action === 'approve';
      const res = await fetch(`/api/verify/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approve, feedback })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Submission failed');
      }

      const data = await res.json();
      setDoneStatus(data.status);
      setSubmittedFeedback(feedback);
    } catch (err) {
      alert(err.message || 'Failed to process request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '(not provided)';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

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
        <div className="page-loader-text">Loading verification details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="hr-portal-wrapper">
        <div className="hr-card" style={{ maxWidth: 500, textAlign: 'center' }}>
          <div className="hr-success-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--status-error-text)', color: 'var(--status-error-text)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 32, height: 32 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h2 className="hr-title" style={{ color: 'var(--status-error-text)' }}>Link Unavailable</h2>
          <p className="hr-subtitle" style={{ marginTop: 8 }}>{error}</p>
          <div style={{ marginTop: 24 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>If you believe this is an error, please contact the Placement Cell.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hr-portal-wrapper">
      <div className="hr-card">
        
        {/* Verification Success Header State */}
        {doneStatus ? (
          <div className="hr-success-screen">
            <div className="hr-success-icon" style={doneStatus === 'Correction Requested' ? { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--status-error-text)', color: 'var(--status-error-text)' } : {}}>
              {doneStatus === 'Verified' ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              )}
            </div>
            <h2 className="hr-title">
              {doneStatus === 'Verified' ? 'Verification Complete' : 'Revision Submitted'}
            </h2>
            <p className="hr-subtitle" style={{ marginTop: 8 }}>
              {doneStatus === 'Verified' 
                ? 'Thank you! You have verified the internship details for ' + record.studentName + '.'
                : 'You have submitted a correction request for the internship record of ' + record.studentName + '.'
              }
            </p>

            <div style={{ marginTop: 32, padding: 16, backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'left' }}>
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>Verification Details Summary</div>
              <div style={{ fontSize: '0.9rem', marginBottom: 4 }}><strong>Student:</strong> {record.studentName}</div>
              <div style={{ fontSize: '0.9rem', marginBottom: 4 }}><strong>Company:</strong> {record.companyName}</div>
              <div style={{ fontSize: '0.9rem', marginBottom: 4 }}><strong>Dates:</strong> {formatDate(record.startDate)} to {formatDate(record.endDate)}</div>
              {submittedFeedback && (
                <div style={{ fontSize: '0.9rem', marginTop: 12, borderTop: '1px solid var(--border-color)', paddingTop: 8 }}>
                  <strong>Feedback/Comments:</strong> <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{submittedFeedback}"</span>
                </div>
              )}
            </div>

            <div style={{ marginTop: 24, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              This profile verification was logged on {record.verifiedOn ? new Date(record.verifiedOn).toLocaleString() : new Date().toLocaleString()}.
            </div>
          </div>
        ) : (
          /* Verification Form State */
          <div>
            <div className="hr-header">
              <span className="hr-college-badge">{record.collegeName}</span>
              <h2 className="hr-title">Internship Verification</h2>
              <p className="hr-subtitle">Please verify that the internship details logged for this student are correct.</p>
            </div>

            <div className="hr-details-box">
              <div className="hr-detail-row">
                <span className="hr-detail-label">Student Name</span>
                <span className="hr-detail-value">{record.studentName}</span>
              </div>
              <div className="hr-detail-row">
                <span className="hr-detail-label">Company / Organization</span>
                <span className="hr-detail-value">{record.companyName}</span>
              </div>
              <div className="hr-detail-row">
                <span className="hr-detail-label">Internship Period</span>
                <span className="hr-detail-value">
                  {formatDate(record.startDate)} to {formatDate(record.endDate)}
                </span>
              </div>
              <div className="hr-detail-row">
                <span className="hr-detail-label">Target Reviewer</span>
                <span className="hr-detail-value">{record.hrName}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {!action ? (
                <div className="hr-actions-grid">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '16px 20px', fontSize: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}
                    onClick={() => setAction('reject')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 20, height: 20 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>
                    Request Corrections
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: '16px 20px', fontSize: '1rem' }}
                    onClick={() => setAction('approve')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    Confirm & Verify
                  </button>
                </div>
              ) : (
                <div className="hr-feedback-box">
                  <label className="form-label" style={{ marginBottom: 10 }}>
                    {action === 'approve' ? 'Optional Comments / Feedback' : 'What corrections are required? *'}
                  </label>
                  <textarea
                    className="hr-textarea"
                    placeholder={action === 'approve' ? 'e.g. Alex was an excellent intern with great problem-solving skills...' : 'e.g. The internship dates are incorrect; the start date was June 10, 2026.'}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    required={action === 'reject'}
                  />

                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => { setAction(null); setFeedback(''); }}
                      disabled={submitting}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={action === 'reject' ? { background: 'linear-gradient(135deg, #ef4444 0%, #f43f5e 100%)', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.25)' } : {}}
                      disabled={submitting}
                    >
                      {submitting ? <span className="spinner"></span> : (action === 'approve' ? 'Submit Verification' : 'Submit Corrections')}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
