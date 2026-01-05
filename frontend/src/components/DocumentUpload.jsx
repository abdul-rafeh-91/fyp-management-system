import { useState } from 'react';
import { documentAPI } from '../services/api';
import '../styles/Modal.css';

const DocumentUpload = ({ studentId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    type: 'PROPOSAL',
    title: '',
    description: '',
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');

    const formDataToSend = new FormData();
    formDataToSend.append('studentId', studentId);
    formDataToSend.append('type', formData.type);
    formDataToSend.append('title', formData.title);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('file', file);

    try {
      await documentAPI.create(formDataToSend);
      onSuccess();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Upload New Document</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Document Type</label>
            <select name="type" value={formData.type} onChange={handleChange} required>
              <option value="PROPOSAL">Proposal</option>
              <option value="DESIGN_DOCUMENT">Design Document</option>
              <option value="TEST_DOCUMENT">Test Document</option>
              <option value="THESIS">Thesis</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Enter document title"
            />
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="Enter document description"
            />
          </div>
          
          <div className="form-group">
            <label>File</label>
            <input
              type="file"
              onChange={handleFileChange}
              required
              accept=".pdf,.doc,.docx"
            />
            {file && <p className="file-info">Selected: {file.name}</p>}
          </div>
          
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentUpload;

