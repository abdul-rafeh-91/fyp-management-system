import { useState } from 'react';
import { deadlineAPI } from '../services/api';
import '../styles/Modal.css';

const DeadlineManager = ({ userId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    documentType: 'PROPOSAL',
    deadline: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await deadlineAPI.create({
        ...formData,
        userId,
      });
      alert('Deadline set successfully!');
      onSuccess();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to set deadline');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Set Deadline</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Document Type</label>
            <select name="documentType" value={formData.documentType} onChange={handleChange} required>
              <option value="PROPOSAL">Proposal</option>
              <option value="DESIGN_DOCUMENT">Design Document</option>
              <option value="TEST_DOCUMENT">Test Document</option>
              <option value="THESIS">Thesis</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Deadline</label>
            <input
              type="datetime-local"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="Additional information about this deadline..."
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Setting...' : 'Set Deadline'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeadlineManager;

