import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import { Upload, FileText, X, CheckCircle, AlertCircle, File, Download, Send, Eye, Calendar } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import Card from '../components/Card';

const StudentDocuments = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [assignedDocuments, setAssignedDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingDocument, setUploadingDocument] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [documentTitle, setDocumentTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submittingId, setSubmittingId] = useState(null);

  useEffect(() => {
    if (user) {
      fetchAssignedDocuments();
    }
  }, [user]);

  const fetchAssignedDocuments = async () => {
    try {
      setLoading(true);
      // Fetch documents
      const docsResponse = await api.get(`/documents/student/${user?.userId}`);
      const documents = docsResponse.data || [];

      // Fetch active deadlines
      const deadlinesResponse = await api.get('/deadlines/active');
      const deadlines = deadlinesResponse.data || [];

      // Logic:
      // 1. Expired deadline (time guzar gaya) → show with "Deadline Guzar Gayi Hai"
      // 2. Active deadline (time abhi nahi gaya) → show normally
      // 3. Deleted deadline (FYP Committee ne delete kar di) → don't show (backend removes it completely)

      // Create a map to combine deadlines with documents
      const combined = [];

      // Process all deadlines from backend
      deadlines.forEach(deadline => {
        let documentType = null;
        let documentTypeLabel = deadline.deadlineType || 'Unknown';
        let doc = null;

        // Try to match deadline with a document
        if (deadline.documentType) {
          // Deadline has a documentType enum, try to find matching document
          documentType = deadline.documentType;
          documentTypeLabel = getDocumentTypeLabel(deadline.documentType);
          doc = documents.find(d => d.type === deadline.documentType);
        } else if (deadline.deadlineType) {
          // Custom deadline type, try to match by deadlineType
          // First, try to match with predefined document types
          const documentTypes = ['PROPOSAL', 'DESIGN_DOCUMENT', 'TEST_DOCUMENT', 'THESIS'];
          const matchedType = documentTypes.find(type => {
            const label = getDocumentTypeLabel(type);
            return deadline.deadlineType.toLowerCase() === label.toLowerCase();
          });

          if (matchedType) {
            documentType = matchedType;
            documentTypeLabel = getDocumentTypeLabel(matchedType);
            doc = documents.find(d => d.type === matchedType);
          } else {
            // Custom deadline type that doesn't match any predefined type
            documentTypeLabel = deadline.deadlineType;
            // Try to find document by matching deadlineType with document title or type
            doc = documents.find(d =>
              d.title?.toLowerCase().includes(deadline.deadlineType.toLowerCase()) ||
              d.type?.toLowerCase() === deadline.deadlineType.toLowerCase()
            );
          }
        }

        const deadlineDate = new Date(deadline.deadline);
        const now = new Date();
        const isDeadlinePassed = deadlineDate < now;

        // Check if document was uploaded before deadline expired
        // Row should be red only if deadline passed AND (no document OR document uploaded after deadline)
        let isDeadlineMissed = false;
        if (isDeadlinePassed) {
          if (!doc || !doc.createdAt) {
            // No document uploaded
            isDeadlineMissed = true;
          } else {
            // Check if document was uploaded after deadline
            const docUploadDate = new Date(doc.createdAt);
            isDeadlineMissed = docUploadDate > deadlineDate;
          }
        }

        combined.push({
          documentType: documentType || deadline.deadlineType, // For display and matching
          deadlineDocumentType: deadline.documentType || documentType || deadline.deadlineType, // Valid enum type for upload
          documentTypeLabel: documentTypeLabel,
          document: doc || null,
          deadline: deadline,
          deadlineDate: deadline.deadline,
          isDeadlinePassed: isDeadlinePassed,
          isDeadlineMissed: isDeadlineMissed,
        });
      });

      // Only show rows for deadlines that exist
      // If deadline was deleted by FYP Committee, it won't be in the response, so row won't show
      setAssignedDocuments(combined);
    } catch (error) {
      console.error('Error fetching assigned documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDocumentTypeLabel = (type) => {
    const labels = {
      'PROPOSAL': 'Project Proposal',
      'DESIGN_DOCUMENT': 'Design Document',
      'TEST_DOCUMENT': 'Test Document',
      'THESIS': 'Thesis',
    };
    return labels[type] || type;
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleOpenUploadModal = (documentType) => {
    setUploadingDocument(documentType);
    setShowUploadModal(true);
    setSelectedFile(null);
    setDocumentTitle('');
    setDescription('');
  };

  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
    setUploadingDocument(null);
    setSelectedFile(null);
    setDocumentTitle('');
    setDescription('');
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file');
      return;
    }

    if (!documentTitle.trim()) {
      alert('Please enter a document title');
      return;
    }

    // Find the deadline item to get the correct document type
    const deadlineItem = assignedDocuments.find(
      item => item.documentType === uploadingDocument ||
        item.deadline?.deadlineType === uploadingDocument
    );

    if (!deadlineItem || !deadlineItem.deadline) {
      alert('Error: Deadline not found. Please refresh the page and try again.');
      return;
    }

    // Get the document type for upload
    // Use deadlineDocumentType if available (enum), otherwise use custom deadlineType
    const documentTypeToUse = deadlineItem.deadlineDocumentType || deadlineItem.deadline.deadlineType;

    // Check if document already exists (for revision/new version)
    const existingDoc = deadlineItem.document;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('description', description || 'Updated version');

    try {
      setLoading(true);

      if (existingDoc && existingDoc.id) {
        // Upload new version for existing document
        await api.post(`/documents/${existingDoc.id}/upload-version`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        showToast('Document updated successfully! New version uploaded.');
      } else {
        // Create new document - use the valid enum document type
        formData.append('type', documentTypeToUse);
        formData.append('title', documentTitle);
        formData.append('studentId', user?.userId.toString());
        await api.post('/documents', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        showToast('Document uploaded successfully!');
      }

      await fetchAssignedDocuments();
      handleCloseUploadModal();
    } catch (error) {
      console.error('Error uploading document:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to upload document';
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (documentId) => {
    if (!window.confirm('Are you sure you want to submit this document? Once submitted, you cannot edit it until supervisor reviews it.')) {
      return;
    }

    try {
      setSubmittingId(documentId);
      await api.post(`/documents/${documentId}/submit`);
      showToast('Document submitted successfully! Your supervisor will be notified.');
      await fetchAssignedDocuments();
    } catch (error) {
      console.error('Error submitting document:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to submit document';
      alert(`Error: ${errorMessage}`);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleViewDocument = async (documentId) => {
    try {
      // Fetch document with authentication token
      const response = await api.get(`/documents/${documentId}/view`, {
        responseType: 'blob'
      });

      // Create blob URL
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/pdf'
      });
      const url = window.URL.createObjectURL(blob);

      // Open in new tab
      window.open(url, '_blank');

      // Clean up blob URL after a delay
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Error viewing document:', error);
      alert('Failed to open document. Please try again.');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 MB';
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (doc) => {
    if (!doc) return <span className="text-[#64748b]">Not Uploaded</span>;
    return <StatusBadge status={doc.status} />;
  };

  const canSubmit = (doc, isDeadlineMissed) => {
    if (!doc) return false;
    // If deadline was missed (expired without document), don't allow submit
    if (isDeadlineMissed) return false;
    // Allow submit for DRAFT documents that haven't been submitted
    if (doc.status === 'DRAFT' && !doc.isSubmitted) return true;
    // After revision upload, status becomes DRAFT again, allow submit
    if (doc.status === 'DRAFT' && doc.isSubmitted === false) return true;
    return false;
  };

  const canUpload = (doc, isDeadlineMissed, deadlineDocumentType) => {
    // If deadline was missed (expired without document), don't allow upload
    if (isDeadlineMissed) return false;
    // If deadline has custom type (no valid documentType enum), don't allow upload
    // Backend only accepts: PROPOSAL, DESIGN_DOCUMENT, TEST_DOCUMENT, THESIS
    if (!deadlineDocumentType) return false;
    // Allow upload for new documents (if deadline hasn't been missed)
    if (!doc) return true;
    // Allow upload for DRAFT documents (if deadline hasn't been missed)
    if (doc.status === 'DRAFT' && !doc.isSubmitted) return true;
    // Allow upload for revision requested documents
    if (doc.status === 'SUPERVISOR_REVISION_REQUESTED' ||
      doc.status === 'EVALUATION_COMMITTEE_REVISION_REQUESTED' ||
      doc.status === 'FYP_COMMITTEE_REVISION_REQUESTED') return true;
    return false;
  };

  if (loading && assignedDocuments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#06b6d4] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#64748b]">Loading assigned documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#06b6d4] to-[#22d3ee] text-white rounded-xl shadow-lg p-4 sm:p-5">
        <h1 className="text-white mb-1 text-xl sm:text-2xl font-semibold">Assigned Documents</h1>
        <p className="text-white/90 text-xs sm:text-sm">View and manage your assigned project documents</p>
      </div>

      {/* Documents Table */}
      <Card>
        {assignedDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="text-[#94a3b8] mx-auto mb-4" size={48} />
            <p className="text-[#64748b] text-lg font-medium mb-2">No Deadlines Set</p>
            <p className="text-[#94a3b8] text-sm">No deadlines have been assigned yet. Please check back later.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[#e2e8f0] bg-[#f8fafc]">
                  <th className="text-left p-3 text-[#0f172a] font-semibold text-sm">Document Type</th>
                  <th className="text-left p-3 text-[#0f172a] font-semibold text-sm">Status</th>
                  <th className="text-left p-3 text-[#0f172a] font-semibold text-sm">Deadline</th>
                  <th className="text-left p-3 text-[#0f172a] font-semibold text-sm">Uploaded Date</th>
                  <th className="text-left p-3 text-[#0f172a] font-semibold text-sm">Uploaded By</th>
                  <th className="text-center p-3 text-[#0f172a] font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignedDocuments.map((item, index) => (
                  <tr
                    key={item.deadline?.id || item.document?.id || `${item.documentType}-${index}`}
                    className={`border-b border-[#e2e8f0] hover:bg-[#f8fafc] transition-colors ${item.isDeadlineMissed ? 'bg-red-50/50' : ''
                      }`}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#06b6d4]/10 rounded-lg flex items-center justify-center">
                          <FileText className="text-[#06b6d4]" size={16} />
                        </div>
                        <div>
                          <p className="text-[#0f172a] m-0 font-medium text-sm">{item.documentTypeLabel}</p>
                          {item.document?.title && (
                            <small className="text-[#64748b] text-xs">{item.document.title}</small>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      {getStatusBadge(item.document)}
                    </td>
                    <td className="p-3">
                      {item.deadlineDate ? (
                        <div className="flex items-center gap-2">
                          <Calendar className={`${item.isDeadlineMissed ? 'text-red-500' : 'text-[#06b6d4]'}`} size={14} />
                          <span className={`text-sm ${item.isDeadlineMissed ? 'text-red-600 font-semibold' : 'text-[#0f172a]'}`}>
                            {formatDate(item.deadlineDate)}
                          </span>
                          {item.isDeadlineMissed && (
                            <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded font-medium">
                              Deadline Expired
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#64748b] text-sm">No deadline set</span>
                      )}
                    </td>
                    <td className="p-3">
                      {item.document?.createdAt ? (
                        <span className="text-[#0f172a] text-sm">{formatDate(item.document.createdAt)}</span>
                      ) : (
                        <span className="text-[#64748b] text-sm">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      {item.document?.studentName ? (
                        <span className="text-[#0f172a] text-sm">{item.document.studentName}</span>
                      ) : (
                        <span className="text-[#64748b] text-sm">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        {item.document?.fileName && (
                          <button
                            onClick={() => handleViewDocument(item.document.id || item.document.documentId)}
                            className="p-1.5 bg-white text-[#06b6d4] border border-[#06b6d4] rounded-lg hover:bg-[#06b6d4] hover:text-white transition-colors"
                            title="View Document"
                          >
                            <Eye size={14} />
                          </button>
                        )}
                        {canUpload(item.document, item.isDeadlineMissed, item.deadlineDocumentType) && !item.isDeadlineMissed && (
                          <button
                            onClick={() => handleOpenUploadModal(item.documentType)}
                            className="p-1.5 bg-white text-[#06b6d4] border border-[#06b6d4] rounded-lg hover:bg-[#06b6d4] hover:text-white transition-colors"
                            title="Upload Document"
                          >
                            <Upload size={14} />
                          </button>
                        )}
                        {canSubmit(item.document, item.isDeadlineMissed) && !item.isDeadlineMissed && (
                          <button
                            onClick={() => handleSubmit(item.document.id || item.document.documentId)}
                            disabled={submittingId === (item.document.id || item.document.documentId)}
                            className="px-2.5 py-1.5 bg-gradient-to-r from-[#10b981] to-[#14b8a6] text-white rounded-lg hover:shadow-md transition-all duration-200 text-xs flex items-center gap-1 disabled:opacity-70 disabled:cursor-not-allowed"
                            title="Submit for Review"
                          >
                            {submittingId === (item.document.id || item.document.documentId) ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Submitting...
                              </>
                            ) : (
                              <>
                                <Send size={12} />
                                Submit
                              </>
                            )}
                          </button>
                        )}
                        {item.isDeadlineMissed && (
                          <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded font-medium" title="Deadline has passed. You cannot upload or add documents now.">
                            Upload/Add Disabled
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#0f172a] text-xl font-semibold">Upload Document</h3>
              <button
                onClick={handleCloseUploadModal}
                className="w-8 h-8 bg-[#f1f5f9] rounded-lg flex items-center justify-center hover:bg-[#e2e8f0] transition-colors"
              >
                <X className="text-[#64748b]" size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[#0f172a] mb-2">Document Type</label>
                <input
                  type="text"
                  value={getDocumentTypeLabel(uploadingDocument)}
                  disabled
                  className="w-full p-3 border border-[#e2e8f0] rounded-lg bg-[#f8fafc] text-[#64748b]"
                />
              </div>

              <div>
                <label className="block text-[#0f172a] mb-2">Select File <span className="text-[#ef4444]">*</span></label>
                <label className="block">
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                  />
                  <div className="border-2 border-dashed border-[#e2e8f0] rounded-lg p-6 text-center cursor-pointer hover:border-[#06b6d4] transition-colors">
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileText className="text-[#06b6d4]" size={24} />
                        <div className="text-left">
                          <p className="text-[#0f172a] m-0">{selectedFile.name}</p>
                          <small className="text-[#64748b]">{formatFileSize(selectedFile.size)}</small>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="text-[#64748b] mx-auto mb-2" size={32} />
                        <p className="text-[#64748b]">Click to select file</p>
                        <small className="text-[#94a3b8]">PDF, DOC, DOCX, PPT, PPTX (Max 10MB)</small>
                      </>
                    )}
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-[#0f172a] mb-2">Document Title <span className="text-[#ef4444]">*</span></label>
                <input
                  type="text"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  placeholder="Enter document title"
                  className="w-full p-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20"
                  required
                />
              </div>

              <div>
                <label className="block text-[#0f172a] mb-2">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a brief description..."
                  className="w-full p-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#06b6d4] resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCloseUploadModal}
                  className="flex-1 px-4 py-2 border border-[#e2e8f0] text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || !documentTitle.trim() || loading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-[#06b6d4] to-[#22d3ee] text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Upload
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentDocuments;
