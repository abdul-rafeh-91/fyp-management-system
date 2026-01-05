import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import { Calendar, Plus, Edit, X, CheckCircle, AlertCircle, Clock, Trash2 } from 'lucide-react';
import Card from '../components/Card';

const CommitteeDeadlines = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState(null);
  const [formData, setFormData] = useState({
    deadlineType: '',
    documentType: '', // Optional: for backward compatibility..
    deadline: '',
    description: '',
  });
  const [error, setError] = useState('');

  const documentTypes = [
    { value: 'PROPOSAL', label: 'Project Proposal' },
    { value: 'DESIGN_DOCUMENT', label: 'Design Document' },
    { value: 'TEST_DOCUMENT', label: 'Test Document' },
    { value: 'THESIS', label: 'Thesis' },
  ];

  useEffect(() => {
    if (user) {
      fetchDeadlines();
    }
  }, [user]);

  const fetchDeadlines = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/deadlines');
      console.log('Deadlines response:', response.data);
      
      // Ensure response.data is an array
      if (Array.isArray(response.data)) {
        setDeadlines(response.data);
      } else if (response.data) {
        setDeadlines([response.data]);
      } else {
        setDeadlines([]);
      }
    } catch (error) {
      console.error('Error fetching deadlines:', error);
      let errorMessage = 'Failed to load deadlines';
      
      // Check if it's a network error
      if (!error.response) {
        errorMessage = 'Network error. Please check if the backend server is running.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. You don\'t have permission to view deadlines.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else {
        errorMessage = error.response?.data?.error || 
                      error.response?.data?.message || 
                      error.message || 
                      'Failed to load deadlines';
      }
      
      setError(errorMessage);
      console.error('Full error:', error.response || error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (deadline = null) => {
    if (deadline) {
      setEditingDeadline(deadline);
      // Backend returns LocalDateTime as ISO string (e.g., "2025-12-31T05:07:00")
      // Convert to datetime-local format (YYYY-MM-DDTHH:mm)
      let localDateTime = '';
      const deadlineValue = deadline.deadline || deadline.deadlineDate;
      if (deadlineValue) {
        const deadlineStr = deadlineValue;
        // If it's an ISO string, extract the date-time part
        if (deadlineStr.includes('T')) {
          // Format: "2025-12-31T05:07:00" or "2025-12-31T05:07:00.000"
          const dateTimePart = deadlineStr.split('T')[1] || '';
          const timePart = dateTimePart.split('.')[0] || dateTimePart; // Remove milliseconds
          const timeWithoutSeconds = timePart.split(':').slice(0, 2).join(':'); // Remove seconds
          localDateTime = `${deadlineStr.split('T')[0]}T${timeWithoutSeconds}`;
        } else {
          localDateTime = deadlineStr;
        }
      }
      setFormData({
        deadlineType: deadline.deadlineType || deadline.documentType || '',
        documentType: deadline.documentType || '',
        deadline: localDateTime,
        description: deadline.description || '',
      });
    } else {
      setEditingDeadline(null);
      setFormData({
        deadlineType: '',
        documentType: '',
        deadline: '',
        description: '',
      });
    }
    setShowModal(true);
    setError('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDeadline(null);
    setFormData({
      deadlineType: '',
      documentType: '',
      deadline: '',
      description: '',
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.deadlineType || formData.deadlineType.trim() === '') {
      setError('Please enter a deadline type (e.g., Project Proposal, Code Files, Presentation, etc.)');
      return;
    }

    if (!formData.deadline) {
      setError('Please select a deadline date and time');
      return;
    }

    try {
      setSubmitting(true);
      
      // Convert datetime-local to LocalDateTime format (YYYY-MM-DDTHH:mm:ss)
      // datetime-local gives format: "2025-12-31T05:07"
      // Backend expects: "2025-12-31T05:07:00" (without timezone, with seconds)
      let formattedDateTime = formData.deadline;
      
      // Ensure seconds are included (add :00 if missing)
      if (formattedDateTime && !formattedDateTime.includes(':')) {
        formattedDateTime = `${formattedDateTime}:00:00`;
      } else if (formattedDateTime) {
        const parts = formattedDateTime.split(':');
        if (parts.length === 2) {
          // Format: YYYY-MM-DDTHH:mm -> add seconds
          formattedDateTime = `${formattedDateTime}:00`;
        } else if (parts.length === 3 && parts[2].length > 2) {
          // Format: YYYY-MM-DDTHH:mm:ss.sss -> remove milliseconds
          formattedDateTime = formattedDateTime.substring(0, 19);
        }
      }
      
      // Use URLSearchParams for @RequestParam in backend
      // This ensures proper URL encoding of the datetime string (including 'T' character)
      const params = new URLSearchParams();
      params.append('deadlineType', formData.deadlineType.trim());
      if (formData.documentType) {
        params.append('documentType', formData.documentType);
      }
      params.append('deadline', formattedDateTime);
      params.append('description', formData.description || '');
      params.append('userId', user.userId.toString());
      
      await api.post('/deadlines', params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      showToast(editingDeadline ? 'Deadline updated successfully!' : 'Deadline created successfully!');
      handleCloseModal();
      await fetchDeadlines();
    } catch (err) {
      let errorMessage = 'Failed to save deadline';
      
      if (err.response?.status === 403) {
        errorMessage = 'Access denied. You don\'t have permission to create/update deadlines.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else {
        errorMessage = err.response?.data?.error || 
                      err.response?.data?.message || 
                      err.message || 
                      'Failed to save deadline';
      }
      
      setError(errorMessage);
      console.error('Error saving deadline:', err.response);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this deadline? This will remove the deadline from all students\' documents and cannot be undone.')) {
      return;
    }

    try {
      setError('');
      
      // Optimistically remove from UI
      setDeadlines(prev => prev.filter(d => d.id !== id));
      
      // Delete from backend
      await api.delete(`/deadlines/${id}`);
      
      // Show success toast
      showToast('Deadline deleted successfully! All students have been notified.');
    } catch (err) {
      // Revert optimistic update on error
      await fetchDeadlines();
      setError(err.response?.data?.error || 'Failed to delete deadline');
    }
  };

  const getDocumentTypeLabel = (deadline) => {
    // If deadline has deadlineType, use that; otherwise use documentType
    if (deadline.deadlineType) {
      return deadline.deadlineType;
    }
    if (deadline.documentType) {
      const docType = documentTypes.find(dt => dt.value === deadline.documentType);
      return docType ? docType.label : deadline.documentType;
    }
    return 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#06b6d4] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#64748b]">Loading deadlines...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#06b6d4] to-[#22d3ee] text-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-white mb-2 text-2xl sm:text-3xl">Manage Deadlines</h1>
            <p className="text-white/90 text-sm sm:text-base">Set and update project document deadlines</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            disabled={submitting}
            className="px-6 py-3 bg-white text-[#06b6d4] rounded-lg hover:bg-[#f8fafc] transition-all duration-200 flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-[#06b6d4] border-t-transparent rounded-full animate-spin"></div>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Plus size={20} />
                Create Deadline
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Deadlines List */}
      {deadlines.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {deadlines.map(deadline => {
            // Handle both deadline and deadlineDate field names
            const deadlineValue = deadline.deadline || deadline.deadlineDate;
            const deadlineDate = deadlineValue ? new Date(deadlineValue) : null;
            const isPast = deadlineDate && deadlineDate < new Date();
            
            return (
              <Card key={deadline.id} hoverable>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-[#0f172a] mb-1">{getDocumentTypeLabel(deadline)}</h3>
                      <p className="text-[#64748b] m-0 text-sm">{deadline.description || 'No description'}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      deadline.isActive 
                        ? (isPast ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700')
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {deadline.isActive ? (isPast ? 'Expired' : 'Active') : 'Inactive'}
                    </span>
                  </div>

                  <div className="bg-[#f8fafc] rounded-lg p-4 border-l-4 border-[#06b6d4]">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="text-[#06b6d4]" size={18} />
                      <span className="text-[#64748b] text-sm">Deadline</span>
                    </div>
                    <p className="text-[#0f172a] m-0 font-semibold">
                      {deadlineDate ? deadlineDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'No date set'}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-[#e2e8f0]">
                    <button
                      onClick={() => handleOpenModal(deadline)}
                      className="flex-1 px-4 py-2 bg-white text-[#06b6d4] border-2 border-[#06b6d4] rounded-lg hover:bg-[#06b6d4] hover:text-white transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(deadline.id)}
                      className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-all duration-200 flex items-center justify-center gap-2"
                      title="Delete deadline"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[#06b6d4]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="text-[#06b6d4]" size={32} />
            </div>
            <h3 className="text-[#0f172a] mb-2">No Deadlines Set</h3>
            <p className="text-[#64748b] m-0">Create your first deadline to get started</p>
          </div>
        </Card>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[#0f172a] text-xl">
                {editingDeadline ? 'Edit Deadline' : 'Create Deadline'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-[#f8fafc] rounded-lg transition-colors"
              >
                <X size={20} className="text-[#64748b]" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[#0f172a] mb-2">Deadline Type <span className="text-[#ef4444]">*</span></label>
                <input
                  type="text"
                  value={formData.deadlineType}
                  onChange={(e) => setFormData({ ...formData, deadlineType: e.target.value })}
                  placeholder="e.g., Project Proposal, Code Files, Presentation, etc."
                  required
                  className="w-full p-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 bg-white"
                />
                <p className="text-[#64748b] text-xs mt-1">Enter a custom deadline type (e.g., Code Files, Presentation, Documentation, etc.)</p>
              </div>

              <div>
                <label className="block text-[#0f172a] mb-2">Link to Document Type (Optional)</label>
                <select
                  value={formData.documentType}
                  onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                  className="w-full p-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 bg-white"
                >
                  <option value="">None (Custom Deadline Only)</option>
                  {documentTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                <p className="text-[#64748b] text-xs mt-1">If linked to a document type, deleting this deadline will also delete all documents of that type</p>
              </div>

              <div>
                <label className="block text-[#0f172a] mb-2">Deadline Date & Time <span className="text-[#ef4444]">*</span></label>
                <input
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  required
                  className="w-full p-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 bg-white"
                />
              </div>

              <div>
                <label className="block text-[#0f172a] mb-2">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Add a description for this deadline..."
                  className="w-full p-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 resize-none bg-white"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-3 bg-white text-[#06b6d4] border-2 border-[#06b6d4] rounded-lg hover:bg-[#06b6d4] hover:text-white transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-[#06b6d4] to-[#22d3ee] text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{editingDeadline ? 'Updating...' : 'Creating...'}</span>
                    </>
                  ) : (
                    <span>{editingDeadline ? 'Update Deadline' : 'Create Deadline'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommitteeDeadlines;
