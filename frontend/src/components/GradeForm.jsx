import { useState } from 'react';
import { gradeAPI } from '../services/api';
import '../styles/Modal.css';

const GradeForm = ({ document, evaluatorId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    documentId: document.id,
    rubricCriteria: '',
    score: '',
    maxScore: 100,
    feedback: '',
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

    // Convert scores to numbers
    const gradeData = {
      ...formData,
      score: parseFloat(formData.score),
      maxScore: parseFloat(formData.maxScore),
    };

    try {
      await gradeAPI.create(gradeData, evaluatorId);
      alert('Grade submitted successfully!');
      onSuccess();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to submit grade');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Grade Document</h2>
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
            <label>Rubric Criteria</label>
            <input
              type="text"
              name="rubricCriteria"
              value={formData.rubricCriteria}
              onChange={handleChange}
              required
              placeholder="e.g., Technical Implementation"
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Score</label>
              <input
                type="number"
                name="score"
                value={formData.score}
                onChange={handleChange}
                required
                min="0"
                max={formData.maxScore}
                step="0.1"
              />
            </div>
            
            <div className="form-group">
              <label>Max Score</label>
              <input
                type="number"
                name="maxScore"
                value={formData.maxScore}
                onChange={handleChange}
                required
                min="1"
                step="0.1"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Feedback</label>
            <textarea
              name="feedback"
              value={formData.feedback}
              onChange={handleChange}
              rows="4"
              placeholder="Enter detailed feedback..."
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Grade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GradeForm;

