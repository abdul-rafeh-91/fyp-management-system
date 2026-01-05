import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import { FileText, Download, MessageSquare, Send, CheckCircle, Clock, AlertCircle, Users, Calendar, Star, X } from 'lucide-react';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';

const SupervisorReview = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({
    decision: 'APPROVED',
    comments: '',
    rating: 0,
  });
  const [filter, setFilter] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchGroupsAndDocs();
    }
  }, [user]);

  const fetchGroupsAndDocs = async () => {
    try {
      setLoading(true);

      // 1. Fetch assigned groups
      const groupsResponse = await api.get(`/groups/supervisor/${user.userId}`);
      const assignedGroups = Array.isArray(groupsResponse.data) ? groupsResponse.data : [];

      // 2. Fetch all documents for this supervisor
      const docsResponse = await api.get(`/documents/supervisor/${user.userId}`);
      const allDocuments = Array.isArray(docsResponse.data) ? docsResponse.data : [];

      // 3. Fetch reviews by this supervisor to track history
      const reviewsResponse = await api.get(`/reviews/reviewer/${user.userId}`);
      const myReviews = Array.isArray(reviewsResponse.data) ? reviewsResponse.data : [];
      const reviewedDocIds = new Set(myReviews.map(r => r.documentId));

      // 4. Map documents to groups
      // Precompute a map of studentId -> groupId
      const studentGroupMap = new Map();
      assignedGroups.forEach(group => {
        group.documents = [];
        group.pendingReviews = 0;
        if (group.members) {
          group.members.forEach(member => {
            studentGroupMap.set(member.id, group.id);
          });
        }
      });

      // Track students who are not in a group but have documents
      const individualStudents = new Map();

      // Distribute documents
      allDocuments.forEach(doc => {
        const studentId = doc.studentId || doc.student?.id;
        const docId = doc.id || doc.documentId;

        // Mark if reviewed by this supervisor
        doc.hasSupervisorReview = reviewedDocIds.has(docId);

        if (!studentId) return;

        const groupId = studentGroupMap.get(studentId);

        // Determine status
        const status = doc.status || '';
        const needsReview = (status === 'SUBMITTED' || status === 'UNDER_SUPERVISOR_REVIEW' || status === 'DRAFT') && !doc.hasSupervisorReview;

        if (groupId) {
          // Find group in array
          const group = assignedGroups.find(g => g.id === groupId);
          if (group) {
            group.documents.push({ ...doc, id: docId });
            if (needsReview) group.pendingReviews++;
          }
        } else {
          // Document belongs to a student NOT in a fetched group
          if (!individualStudents.has(studentId)) {
            individualStudents.set(studentId, {
              id: `individual-${studentId}`,
              name: `${doc.studentName || 'Unknown'} (Individual)`,
              members: [{ id: studentId, fullName: doc.studentName }],
              documents: [],
              pendingReviews: 0,
              isIndividual: true
            });
          }
          const individual = individualStudents.get(studentId);
          individual.documents.push({ ...doc, id: docId });
          if (needsReview) individual.pendingReviews++;
        }
      });

      // Append individual students to groups list
      const combinedGroups = [...assignedGroups, ...Array.from(individualStudents.values())];
      setGroups(combinedGroups);

      // If a group was selected, refresh its view
      if (selectedGroup) {
        const updatedSelected = combinedGroups.find(g => g.id === selectedGroup.id);
        if (updatedSelected) {
          setSelectedGroup(updatedSelected);
          setDocuments(updatedSelected.documents);
        }
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    setDocuments(group.documents || []);
  };

  const openReviewModal = (document) => {
    setSelectedDocument(document);
    setReviewModal(true);
    setReviewData({
      decision: 'APPROVED',
      comments: '',
      rating: 0,
    });
  };

  const closeReviewModal = () => {
    setReviewModal(false);
    setSelectedDocument(null);
    setReviewData({
      decision: 'APPROVED',
      comments: '',
      rating: 0,
    });
  };

  const handleRatingClick = (rating) => {
    setReviewData({ ...reviewData, rating });
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!reviewData.comments.trim()) {
      setError('Please provide feedback comments');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      await api.post(`/reviews?reviewerId=${user.userId}`, {
        documentId: selectedDocument.id || selectedDocument.documentId,
        comments: reviewData.comments,
        decision: reviewData.decision,
        reviewRound: 1,
      });

      showToast('Review submitted successfully!');
      closeReviewModal();
      fetchGroupsAndDocs(); // Refresh all data

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const getFilteredDocuments = () => {
    if (filter === 'all') return documents;
    if (filter === 'pending') return documents.filter(doc =>
      (doc.status === 'SUBMITTED' || doc.status === 'UNDER_SUPERVISOR_REVIEW' || doc.status === 'DRAFT') && !doc.hasSupervisorReview
    );
    if (filter === 'reviewed') return documents.filter(doc =>
      doc.hasSupervisorReview || doc.status?.includes('APPROVED') || doc.status?.includes('REVISION')
    );
    return documents;
  };

  const renderStars = () => {
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRatingClick(star)}
            className="transition-all duration-200 hover:scale-110"
          >
            <Star
              size={32}
              className={star <= reviewData.rating ? 'fill-[#fbbf24] text-[#fbbf24]' : 'text-[#e2e8f0]'}
            />
          </button>
        ))}
        <span className="ml-2 text-[#0f172a] self-center text-lg">
          {reviewData.rating > 0 ? `${reviewData.rating}/5` : 'Not rated'}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#06b6d4] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#64748b]">Loading groups...</p>
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
            <h1 className="text-white mb-2 text-2xl sm:text-3xl">Group Reviews</h1>
            <p className="text-white/90 text-sm sm:text-base">Review submissions from your project groups</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
              <span className="text-white"><small>Total Groups: {groups.length}</small></span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {reviewModal && selectedDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              onClick={closeReviewModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold mb-6 text-gray-800">Review Document</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-bold text-gray-700 mb-2">{selectedDocument.title || selectedDocument.type}</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Uploaded by: {selectedDocument.studentName}</p>
                    <p>Date: {new Date(selectedDocument.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <form onSubmit={handleSubmitReview} className="space-y-6">
                  <div>
                    <label className="block text-[#0f172a] mb-3 font-medium">Rating (Optional)</label>
                    {renderStars()}
                  </div>

                  <div>
                    <label className="block text-[#0f172a] mb-3 font-medium">Decision</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setReviewData({ ...reviewData, decision: 'APPROVED' })}
                        className={`p-4 rounded-lg border-2 transition-all ${reviewData.decision === 'APPROVED'
                          ? 'border-[#10b981] bg-[#10b981]/5'
                          : 'border-[#e2e8f0] hover:border-[#cbd5e1]'
                          }`}
                      >
                        <CheckCircle className={`mx-auto mb-2 ${reviewData.decision === 'APPROVED' ? 'text-[#10b981]' : 'text-[#64748b]'}`} size={24} />
                        <p className="text-[#0f172a] m-0"><small>Approve</small></p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewData({ ...reviewData, decision: 'REVISION_REQUESTED' })}
                        className={`p-4 rounded-lg border-2 transition-all ${reviewData.decision === 'REVISION_REQUESTED'
                          ? 'border-[#f59e0b] bg-[#f59e0b]/5'
                          : 'border-[#e2e8f0] hover:border-[#cbd5e1]'
                          }`}
                      >
                        <AlertCircle className={`mx-auto mb-2 ${reviewData.decision === 'REVISION_REQUESTED' ? 'text-[#f59e0b]' : 'text-[#64748b]'}`} size={24} />
                        <p className="text-[#0f172a] m-0"><small>Request Revision</small></p>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#0f172a] mb-2 font-medium">
                      Feedback Comments <span className="text-[#ef4444]">*</span>
                    </label>
                    <textarea
                      value={reviewData.comments}
                      onChange={(e) => setReviewData({ ...reviewData, comments: e.target.value })}
                      required
                      rows={6}
                      placeholder="Provide detailed feedback..."
                      className="w-full p-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 resize-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={closeReviewModal}
                      className="flex-1 px-4 py-3 bg-white text-[#06b6d4] border-2 border-[#06b6d4] rounded-lg hover:bg-[#06b6d4] hover:text-white transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-4 py-3 bg-[#06b6d4] text-white rounded-lg hover:bg-[#0891b2] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Groups List */}
        <div className="lg:col-span-1">
          <Card>
            <h3 className="text-[#0f172a] mb-4">Groups ({groups.length})</h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {groups.length > 0 ? (
                groups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => handleGroupSelect(group)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${selectedGroup?.id === group.id
                      ? 'border-[#06b6d4] bg-[#06b6d4]/5'
                      : 'border-[#e2e8f0] hover:border-[#cbd5e1] hover:bg-[#f8fafc]'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#06b6d4] to-[#22d3ee] rounded-full flex items-center justify-center text-white">
                        <Users size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#0f172a] m-0 truncate font-semibold">{group.name}</p>
                        <p className="text-[#64748b] m-0 text-xs">{group.members?.length || 0} Members</p>
                      </div>
                      {group.pendingReviews > 0 && (
                        <span className="px-2 py-1 bg-[#f59e0b]/10 text-[#f59e0b] rounded-full text-xs font-semibold">
                          {group.pendingReviews}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-[#64748b] text-center py-4"><small>No groups found</small></p>
              )}
            </div>
          </Card>
        </div>

        {/* Documents Panel */}
        <div className="lg:col-span-3">
          {selectedGroup ? (
            <>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-[#0f172a] mb-1">{selectedGroup.name}</h2>
                  <p className="text-[#64748b] m-0 text-sm">
                    Members: {selectedGroup.members?.map(m => m.fullName).join(', ')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-[#06b6d4] text-white' : 'bg-white text-gray-600 border'}`}>
                    All
                  </button>
                  <button onClick={() => setFilter('pending')} className={`px-4 py-2 rounded-lg ${filter === 'pending' ? 'bg-[#06b6d4] text-white' : 'bg-white text-gray-600 border'}`}>
                    Pending
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getFilteredDocuments().map(document => (
                  <Card key={document.id} hoverable>
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-[#0f172a] mb-1">{document.title || document.type}</h4>
                          <p className="text-[#64748b] text-xs">By: {document.studentName}</p>
                        </div>
                        <StatusBadge status={document.status} />
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-[#64748b]">
                          <Calendar size={14} />
                          <span>Submitted: {new Date(document.submittedAt || document.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-[#e2e8f0]">
                        {document.fileName && (
                          <button
                            onClick={async () => {
                              try {
                                const response = await api.get(`/documents/${document.id}/view`, {
                                  responseType: 'blob'
                                });
                                const blob = new Blob([response.data], {
                                  type: response.headers['content-type'] || 'application/pdf'
                                });
                                const url = window.URL.createObjectURL(blob);
                                window.open(url, '_blank');
                              } catch (error) {
                                console.error('Error viewing document:', error);
                              }
                            }}
                            className="flex-1 px-3 py-2 border border-[#06b6d4] text-[#06b6d4] rounded-lg flex items-center justify-center gap-2 hover:bg-cyan-50"
                          >
                            <Download size={14} /> View
                          </button>
                        )}
                        {(document.status === 'SUBMITTED' || document.status === 'UNDER_SUPERVISOR_REVIEW' || document.status === 'DRAFT') && (
                          <button
                            onClick={() => openReviewModal(document)}
                            className="flex-1 px-3 py-2 bg-[#06b6d4] text-white rounded-lg flex items-center justify-center gap-2 hover:bg-[#0891b2]"
                          >
                            <MessageSquare size={14} /> Review
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
                {getFilteredDocuments().length === 0 && <p className="text-gray-500">No documents found.</p>}
              </div>
            </>
          ) : (
            <Card>
              <div className="text-center py-12">
                <Users className="mx-auto text-[#06b6d4] mb-4" size={40} />
                <h3 className="text-gray-800">Select a Group</h3>
                <p className="text-gray-500">View documents from your assigned project groups.</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupervisorReview;
