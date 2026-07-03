import React, { useState, useEffect } from 'react';

export default function Settings({ settings, onSave, addToast }) {
  const [formData, setFormData] = useState({
    collegeName: '',
    replyToEmail: '',
    ccStudent: false,
    mailerMode: 'mock',
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    smtpSecure: false
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        collegeName: settings.collegeName || '',
        replyToEmail: settings.replyToEmail || '',
        ccStudent: !!settings.ccStudent,
        mailerMode: settings.mailerMode || 'mock',
        smtpHost: settings.smtpHost || '',
        smtpPort: settings.smtpPort || 587,
        smtpUser: settings.smtpUser || '',
        smtpPass: settings.smtpPass || '',
        smtpSecure: !!settings.smtpSecure
      });
    }
  }, [settings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
      addToast('Configuration settings updated successfully', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to update settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="settings-container">
      <form onSubmit={handleSave}>
        
        {/* Academic Settings Section */}
        <div className="settings-section">
          <h3 className="settings-section-title">Institutional Metadata</h3>
          <p className="settings-section-desc">Manage institution labels and email delivery rules shown to HR managers.</p>
          
          <div className="form-grid">
            <div className="form-group-full">
              <label className="form-label">College / University Name</label>
              <input
                type="text"
                name="collegeName"
                className="form-input"
                placeholder="e.g. Stanford University"
                value={formData.collegeName}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group-full">
              <label className="form-label">Reply-to Email Address</label>
              <input
                type="email"
                name="replyToEmail"
                className="form-input"
                placeholder="verify@stanford.edu"
                value={formData.replyToEmail}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="switch-container">
            <div className="switch-label">
              <span className="switch-label-title">CC Student</span>
              <span className="switch-label-desc">Copy students on verification emails sent to HR contacts</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                name="ccStudent"
                checked={formData.ccStudent}
                onChange={handleChange}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        {/* Email Mailer Mode Section */}
        <div className="settings-section">
          <h3 className="settings-section-title">Delivery Channels</h3>
          <p className="settings-section-desc">Choose between simulated testing delivery (logs emails to in-app outbox) and SMTP server production delivery.</p>

          <div className="switch-container">
            <div className="switch-label">
              <span className="switch-label-title">Simulated Delivery (Mock Mailer)</span>
              <span className="switch-label-desc">Run verifications without configuring real SMTP details. Great for testing!</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                name="mailerMode"
                checked={formData.mailerMode === 'mock'}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    mailerMode: e.target.checked ? 'mock' : 'smtp'
                  });
                }}
              />
              <span className="slider"></span>
            </label>
          </div>

          {/* SMTP Configurations (Visible only when mailerMode is smtp) */}
          {formData.mailerMode === 'smtp' && (
            <div style={{ marginTop: 24, animation: 'fadeIn 0.25s ease-out' }}>
              <h4 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 16, color: 'var(--text-primary)' }}>SMTP Credentials</h4>
              <div className="form-grid">
                <div className="form-group-full">
                  <label className="form-label">SMTP Host Server</label>
                  <input
                    type="text"
                    name="smtpHost"
                    className="form-input"
                    placeholder="smtp.example.com"
                    value={formData.smtpHost}
                    onChange={handleChange}
                    required={formData.mailerMode === 'smtp'}
                  />
                </div>

                <div>
                  <label className="form-label">SMTP Port</label>
                  <input
                    type="number"
                    name="smtpPort"
                    className="form-input"
                    placeholder="587"
                    value={formData.smtpPort}
                    onChange={handleChange}
                    required={formData.mailerMode === 'smtp'}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', height: '100%', paddingTop: 28 }}>
                  <label className="custom-checkbox">
                    <input
                      type="checkbox"
                      name="smtpSecure"
                      checked={formData.smtpSecure}
                      onChange={handleChange}
                    />
                    <span className="checkmark" style={{ marginRight: 8 }}></span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Use SSL/TLS (Secure)</span>
                  </label>
                </div>

                <div>
                  <label className="form-label">SMTP Username (Authentication Email)</label>
                  <input
                    type="text"
                    name="smtpUser"
                    className="form-input"
                    placeholder="user@example.com"
                    value={formData.smtpUser}
                    onChange={handleChange}
                    required={formData.mailerMode === 'smtp'}
                  />
                </div>

                <div>
                  <label className="form-label">SMTP Password</label>
                  <input
                    type="password"
                    name="smtpPass"
                    className="form-input"
                    placeholder="••••••••••••••"
                    value={formData.smtpPass}
                    onChange={handleChange}
                    required={formData.mailerMode === 'smtp'}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? <span className="spinner"></span> : 'Save Configuration'}
          </button>
        </div>

      </form>
    </div>
  );
}
