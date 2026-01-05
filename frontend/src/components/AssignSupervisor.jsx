import { useState } from 'react';
import { documentAPI } from '../services/api';
import '../styles/Modal.css';

const AssignSupervisor = ({ document, supervisors, onClose, onSuccess }) => {
  const [selectedSupervisor, setSelectedSupervisor] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedSupervisor) {
      setError('Please select a supervisor');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await documentAPI.assignSupervisor(document.id, selectedSupervisor);
      alert('Supervisor assigned successfully!');
      onSuccess();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to assign supervisor');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Assign Supervisor</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        
        <div className="document-info">
          <h3>{document.title}</h3>
          <p>Student: {document.studentName} ({document.studentRegistrationNumber})</p>
          <p>Type: {document.type}</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Select Supervisor</label>
            <select 
              value={selectedSupervisor} 
              onChange={(e) => setSelectedSupervisor(e.target.value)}
              required
            >
              <option value="">-- Select Supervisor --</option>
              {supervisors.map(supervisor => (
                <option key={supervisor.id} value={supervisor.id}>
                  {supervisor.fullName} - {supervisor.department || 'N/A'}
                </option>
              ))}
            </select>
          </div>
          
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignSupervisor;

