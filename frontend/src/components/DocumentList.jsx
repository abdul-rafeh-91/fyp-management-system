import { documentAPI } from '../services/api';

const DocumentList = ({ documents, onUpdate }) => {
  const handleSubmit = async (documentId) => {
    if (window.confirm('Are you sure you want to submit this document? You cannot edit it after submission.')) {
      try {
        await documentAPI.submit(documentId);
        alert('Document submitted successfully!');
        onUpdate();
      } catch (error) {
        alert(error.response?.data?.error || 'Failed to submit document');
      }
    }
  };

  const handleDownload = (documentId) => {
    window.open(`http://localhost:8080/api/documents/${documentId}/download`, '_blank');
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      DRAFT: 'default',
      SUBMITTED: 'pending',
      UNDER_SUPERVISOR_REVIEW: 'in-progress',
      SUPERVISOR_APPROVED: 'approved',
      SUPERVISOR_REVISION_REQUESTED: 'revision',
      UNDER_COMMITTEE_REVIEW: 'in-progress',
      COMMITTEE_APPROVED: 'approved',
      COMMITTEE_REVISION_REQUESTED: 'revision',
      FINAL_APPROVED: 'approved',
      REJECTED: 'rejected',
    };
    return statusMap[status] || 'default';
  };

  if (documents.length === 0) {
    return <p>No documents yet. Upload your first document!</p>;
  }

  return (
    <div className="documents-grid">
      {documents.map(doc => (
        <div key={doc.id} className="document-card">
          <div className="document-header">
            <h3>{doc.title}</h3>
            <span className={`badge ${getStatusBadge(doc.status)}`}>
              {doc.status.replace(/_/g, ' ')}
            </span>
          </div>
          
          <div className="document-details">
            <p><strong>Type:</strong> {doc.type}</p>
            <p><strong>Version:</strong> {doc.version}</p>
            <p><strong>Status:</strong> {doc.status.replace(/_/g, ' ')}</p>
            {doc.submittedAt && (
              <p><strong>Submitted:</strong> {new Date(doc.submittedAt).toLocaleDateString()}</p>
            )}
            {doc.deadline && (
              <p><strong>Deadline:</strong> {new Date(doc.deadline).toLocaleDateString()}</p>
            )}
            {doc.isLateSubmission && (
              <p className="warning-text">⚠️ Late Submission</p>
            )}
          </div>
          
          <div className="document-actions">
            <button onClick={() => handleDownload(doc.id)} className="btn-secondary">
              Download
            </button>
            {!doc.isSubmitted && (
              <button onClick={() => handleSubmit(doc.id)} className="btn-primary">
                Submit
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DocumentList;

