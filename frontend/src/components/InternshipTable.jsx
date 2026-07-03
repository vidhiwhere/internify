import React, { useState } from 'react';

export default function InternshipTable({
  internships,
  onAdd,
  onUpdate,
  onDelete,
  onSendEmail,
  onBulkSend,
  addToast
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  
  // Form fields
  const [formData, setFormData] = useState({
    studentName: '',
    studentEmail: '',
    companyName: '',
    hrName: '',
    hrEmail: '',
    startDate: '',
    endDate: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filter logic
  const filteredRecords = internships.filter(record => {
    const matchesSearch =
      record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.hrEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.hrName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Pending' && record.status === 'Pending') ||
      (statusFilter === 'Sent' && record.status === 'Sent') ||
      (statusFilter === 'Verified' && record.status === 'Verified') ||
      (statusFilter === 'Correction Requested' && record.status === 'Correction Requested') ||
      (statusFilter === 'Error' && record.status.startsWith('Error'));

    return matchesSearch && matchesStatus;
  });

  // Checkbox select handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredRecords.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Open Add/Edit Modal
  const openModal = (record = null) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        studentName: record.studentName,
        studentEmail: record.studentEmail,
        companyName: record.companyName,
        hrName: record.hrName,
        hrEmail: record.hrEmail,
        startDate: record.startDate,
        endDate: record.endDate
      });
    } else {
      setEditingRecord(null);
      setFormData({
        studentName: '',
        studentEmail: '',
        companyName: '',
        hrName: '',
        hrEmail: '',
        startDate: '',
        endDate: ''
      });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingRecord(null);
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.studentName || !formData.companyName || !formData.hrEmail) {
      addToast('Please fill in Student Name, Company, and HR Email', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingRecord) {
        await onUpdate(editingRecord.id, formData);
        addToast('Internship updated successfully', 'success');
      } else {
        await onAdd(formData);
        addToast('Internship profile added successfully', 'success');
      }
      closeModal();
    } catch (err) {
      addToast(err.message || 'Action failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (id, name) => {
    if (window.confirm(`Are you sure you want to remove the internship profile for ${name}?`)) {
      onDelete(id);
      setSelectedIds(selectedIds.filter(x => x !== id));
      addToast('Profile removed successfully', 'success');
    }
  };

  const handleCopyLink = (token) => {
    const link = `${window.location.origin}/verify/${token}`;
    navigator.clipboard.writeText(link);
    addToast('HR verification link copied to clipboard!', 'success');
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'Pending') return 'badge-pending';
    if (status === 'Sent') return 'badge-sent';
    if (status === 'Verified') return 'badge-verified';
    if (status === 'Correction Requested') return 'badge-revision';
    if (status.startsWith('Error')) return 'badge-error';
    return 'badge-pending';
  };

  return (
    <div>
      {/* Control Actions Bar */}
      <div className="control-bar">
        <div className="search-filter-group">
          <div className="search-wrapper">
            <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z" />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search by student, company, HR..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Sent">Sent</option>
            <option value="Verified">Verified</option>
            <option value="Correction Requested">Corrections Requested</option>
            <option value="Error">Errors</option>
          </select>
        </div>

        <div className="action-group">
          {selectedIds.length > 0 && (
            <button
              className="btn btn-primary"
              onClick={async () => {
                const count = selectedIds.length;
                await onBulkSend(selectedIds);
                setSelectedIds([]);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{width: 18, height: 18}}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
              Verify Selected ({selectedIds.length})
            </button>
          )}
          
          <button className="btn btn-secondary" onClick={() => openModal()}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{width: 18, height: 18}}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Student
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="table-container">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <label className="custom-checkbox">
                    <input
                      type="checkbox"
                      checked={filteredRecords.length > 0 && selectedIds.length === filteredRecords.length}
                      onChange={handleSelectAll}
                    />
                    <span className="checkmark"></span>
                  </label>
                </th>
                <th>Student</th>
                <th>Company</th>
                <th>HR Contact</th>
                <th>Internship Dates</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No internship profiles found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map(record => (
                  <tr key={record.id}>
                    <td>
                      <label className="custom-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(record.id)}
                          onChange={() => handleSelectRow(record.id)}
                          disabled={record.status === 'Verified'}
                        />
                        <span className="checkmark"></span>
                      </label>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{record.studentName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{record.studentEmail || 'No CC Email'}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{record.companyName}</div>
                    </td>
                    <td>
                      <div>{record.hrName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{record.hrEmail}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>
                        {record.startDate ? new Date(record.startDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) : '—'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        to {record.endDate ? new Date(record.endDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) : '—'}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(record.status)}`}>
                        {record.status}
                      </span>
                      {record.feedback && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={record.feedback}>
                          "{record.feedback}"
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 8 }}>
                        {record.status !== 'Verified' && (
                          <button
                            className="btn btn-outline"
                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                            onClick={() => onSendEmail(record.id)}
                            title="Send Verification Email to HR"
                          >
                            Send
                          </button>
                        )}
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                          onClick={() => handleCopyLink(record.token)}
                          title="Copy Public HR Verification Link"
                        >
                          Link
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                          onClick={() => openModal(record)}
                          title="Edit Profile"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{width: 14, height: 14}}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                          onClick={() => handleDeleteClick(record.id, record.studentName)}
                          title="Remove Profile"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{width: 14, height: 14}}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <div className="table-footer-info">
            Showing {filteredRecords.length} of {internships.length} student profiles
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingRecord ? 'Edit Internship Profile' : 'Add Student Internship'}
              </h3>
              <button className="close-btn" onClick={closeModal}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group-full">
                  <label className="form-label">Student Name *</label>
                  <input
                    type="text"
                    name="studentName"
                    className="form-input"
                    placeholder="Enter student full name"
                    value={formData.studentName}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                
                <div className="form-group-full">
                  <label className="form-label">Student Email (Optional)</label>
                  <input
                    type="email"
                    name="studentEmail"
                    className="form-input"
                    placeholder="student@college.edu (used for CC)"
                    value={formData.studentEmail}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-group-full">
                  <label className="form-label">Company Name *</label>
                  <input
                    type="text"
                    name="companyName"
                    className="form-input"
                    placeholder="e.g. Stripe, Google, Acme Corp"
                    value={formData.companyName}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">HR Contact Name</label>
                  <input
                    type="text"
                    name="hrName"
                    className="form-input"
                    placeholder="e.g. Jane Smith"
                    value={formData.hrName}
                    onChange={handleFormChange}
                  />
                </div>

                <div>
                  <label className="form-label">HR Email Address *</label>
                  <input
                    type="email"
                    name="hrEmail"
                    className="form-input"
                    placeholder="hr@company.com"
                    value={formData.hrEmail}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    className="form-input"
                    value={formData.startDate}
                    onChange={handleFormChange}
                  />
                </div>

                <div>
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    className="form-input"
                    value={formData.endDate}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? <span className="spinner"></span> : (editingRecord ? 'Save Changes' : 'Create Profile')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
