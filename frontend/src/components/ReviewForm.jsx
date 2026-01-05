import { useState } from 'react';
import { reviewAPI } from '../services/api';
import '../styles/Modal.css';

const ReviewForm = ({ document, reviewerId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    documentId: document.id,
    comments: '',
    decision: 'APPROVED',
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
      await reviewAPI.create(formData, reviewerId);
      alert('Review submitted successfully!');
      onSuccess();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to submit review');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Review Document</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        
        <div className="document-info">
          <h3>{document.title}</h3>
          <p>Student: {document.studentName}</p>
          <p>Type: {document.type}</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Decision</label>
            <select name="decision" value={formData.decision} onChange={handleChange} required>
              <option value="APPROVED">Approved</option>
              <option value="REVISION_REQUESTED">Revision Requested</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Comments</label>
            <textarea
              name="comments"
              value={formData.comments}
              onChange={handleChange}
              rows="6"
              required
              placeholder="Enter your review comments..."
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewForm;

