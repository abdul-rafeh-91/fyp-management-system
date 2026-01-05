import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import { FileText, Download, CheckCircle, AlertCircle, X, Calendar, User, FileCheck, RotateCcw } from 'lucide-react';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';

const EvaluatorForm = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [evaluationModal, setEvaluationModal] = useState(false);
  const [revisionModal, setRevisionModal] = useState(false);
  const [revisionData, setRevisionData] = useState({
    comments: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending');

  // Evaluation Criteria (Based on requirements).
  const [evaluationData, setEvaluationData] = useState({
    problemDefinition: { score: 0, maxScore: 15, feedback: '' },
    literatureReview: { score: 0, maxScore: 15, feedback: '' },
    methodology: { score: 0, maxScore: 20, feedback: '' },
    implementation: { score: 0, maxScore: 25, feedback: '' },
    documentation: { score: 0, maxScore: 15, feedback: '' },
    innovation: { score: 0, maxScore: 10, feedback: '' },
    overallFeedback: '',
  });

  const criteriaInfo = [
    { key: 'problemDefinition', name: 'Problem Definition & Relevance', maxScore: 15, icon: '🎯' },
    { key: 'literatureReview', name: 'Literature Review & Research', maxScore: 15, icon: '📚' },
    { key: 'methodology', name: 'Methodology & Approach', maxScore: 20, icon: '🔬' },
    { key: 'implementation', name: 'Implementation & Results', maxScore: 25, icon: '💻' },
    { key: 'documentation', name: 'Documentation & Presentation', maxScore: 15, icon: '📄' },
    { key: 'innovation', name: 'Innovation & Creativity', maxScore: 10, icon: '💡' },
  ];

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      // Fetch documents that are approved by supervisor and need evaluation
      const response = await api.get('/documents/status/UNDER_EVALUATION_COMMITTEE_REVIEW');
      const evaluatedResponse = await api.get('/documents/status/EVALUATION_COMMITTEE_APPROVED');
      const revisionResponse = await api.get('/documents/status/EVALUATION_COMMITTEE_REVISION_REQUESTED');

      // Combine all documents
      let allDocs = [
        ...(response.data || []),
        ...(evaluatedResponse.data || []),
        ...(revisionResponse.data || [])
      ];

      // Remove duplicates based on document ID
      const uniqueDocs = allDocs.filter((doc, index, self) =>
        index === self.findIndex(d => (d.id || d.documentId) === (doc.id || doc.documentId))
      );

      // Check which documents have already been fully graded by this evaluator
      const docsWithGradedStatus = await Promise.all(
        uniqueDocs.map(async (doc) => {
          try {
            const docId = doc.id || doc.documentId;
            const checkResponse = await api.get(`/grades/document/${docId}/evaluator/${user.userId}/has-graded`);
            return {
              ...doc,
              hasEvaluatorGraded: checkResponse.data.hasGraded || false
            };
          } catch (err) {
            console.error(`Error checking graded status for document ${doc.id}:`, err);
            return { ...doc, hasEvaluatorGraded: false };
          }
        })
      );

      setDocuments(docsWithGradedStatus);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const openEvaluationModal = (document) => {
    setSelectedDocument(document);
    setEvaluationModal(true);
    resetEvaluationData();
  };

  const closeEvaluationModal = () => {
    setEvaluationModal(false);
    setSelectedDocument(null);
    resetEvaluationData();
  };

  const openRevisionModal = (document) => {
    setSelectedDocument(document);
    setRevisionModal(true);
    setRevisionData({ comments: '' });
  };

  const closeRevisionModal = () => {
    setRevisionModal(false);
    setSelectedDocument(null);
    setRevisionData({ comments: '' });
  };

  const handleSubmitRevision = async (e) => {
    e.preventDefault();

    if (!revisionData.comments.trim()) {
      setError('Please provide feedback comments for revision');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      await api.post(`/reviews?reviewerId=${user.userId}`, {
        documentId: selectedDocument.id || selectedDocument.documentId,
        comments: revisionData.comments,
        decision: 'REVISION_REQUESTED',
        reviewRound: 1,
      });

      showToast('Revision request submitted successfully! Student and supervisor will be notified.');
      closeRevisionModal();
      await fetchDocuments();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit revision request');
    } finally {
      setSubmitting(false);
    }
  };

  const resetEvaluationData = () => {
    setEvaluationData({
      problemDefinition: { score: 0, maxScore: 15, feedback: '' },
      literatureReview: { score: 0, maxScore: 15, feedback: '' },
      methodology: { score: 0, maxScore: 20, feedback: '' },
      implementation: { score: 0, maxScore: 25, feedback: '' },
      documentation: { score: 0, maxScore: 15, feedback: '' },
      innovation: { score: 0, maxScore: 10, feedback: '' },
      overallFeedback: '',
    });
  };

  const handleScoreChange = (criteriaKey, score) => {
    setEvaluationData({
      ...evaluationData,
      [criteriaKey]: {
        ...evaluationData[criteriaKey],
        score: Math.min(Math.max(0, parseFloat(score) || 0), evaluationData[criteriaKey].maxScore)
      }
    });
  };

  const handleFeedbackChange = (criteriaKey, feedback) => {
    setEvaluationData({
      ...evaluationData,
      [criteriaKey]: {
        ...evaluationData[criteriaKey],
        feedback
      }
    });
  };

  const calculateTotalScore = () => {
    return criteriaInfo.reduce((total, criteria) => {
      return total + (evaluationData[criteria.key]?.score || 0);
    }, 0);
  };

  const calculateTotalMaxScore = () => {
    return criteriaInfo.reduce((total, criteria) => {
      return total + criteria.maxScore;
    }, 0);
  };

  const handleSubmitEvaluation = async (e) => {
    e.preventDefault();

    // Validate all scores are entered
    const hasEmptyScores = criteriaInfo.some(criteria =>
      !evaluationData[criteria.key].score && evaluationData[criteria.key].score !== 0
    );

    if (hasEmptyScores) {
      setError('Please enter scores for all criteria');
      return;
    }

    if (!evaluationData.overallFeedback.trim()) {
      setError('Please provide overall feedback');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      // Submit each criteria as a separate grade
      for (const criteria of criteriaInfo) {
        const gradeData = {
          documentId: selectedDocument.id || selectedDocument.documentId,
          rubricCriteria: criteria.name,
          score: Number(evaluationData[criteria.key].score),
          maxScore: Number(criteria.maxScore),
          feedback: evaluationData[criteria.key].feedback || evaluationData.overallFeedback
        };

        console.log('Submitting grade:', gradeData);

        const response = await api.post(`/grades?evaluatorId=${user.userId}`, gradeData);
        console.log('Grade submitted successfully:', response.data);
      }

      showToast('Evaluation submitted successfully! All grades have been assigned.');
      closeEvaluationModal();

      // Refresh documents list
      await fetchDocuments();

      // Switch to evaluated tab to show the newly evaluated document
      setFilter('evaluated');
    } catch (err) {
      console.error('Error submitting evaluation:', err);
      console.error('Error response:', err.response);
      const errorMessage = err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Failed to submit evaluation. Please try again.';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getFilteredDocuments = () => {
    if (filter === 'pending') {
      // Show only documents that are pending AND not already graded by this evaluator
      return documents.filter(d =>
        d.status === 'UNDER_EVALUATION_COMMITTEE_REVIEW' && !d.hasEvaluatorGraded
      );
    }
    if (filter === 'revision') {
      return documents.filter(doc => doc.status === 'EVALUATION_COMMITTEE_REVISION_REQUESTED');
    }
    if (filter === 'evaluated') {
      // Show documents that have been graded by this evaluator OR are fully approved
      return documents.filter(doc =>
        doc.hasEvaluatorGraded || doc.status === 'EVALUATION_COMMITTEE_APPROVED'
      );
    }
    return documents;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#06b6d4] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#64748b]">Loading assignments...</p>
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
            <h1 className="text-white mb-2 text-2xl sm:text-3xl">Document Evaluations</h1>
            <p className="text-white/90 text-sm sm:text-base">Review and grade assigned FYP documents</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
              <span className="text-white"><small>Total Assignments: {documents.length}</small></span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
              <span className="text-white"><small>Pending: {documents.filter(d => d.status === 'UNDER_EVALUATION_COMMITTEE_REVIEW' && !d.hasEvaluatorGraded).length}</small></span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-[#e2e8f0] p-2">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${filter === 'pending'
                ? 'bg-[#06b6d4] text-white'
                : 'bg-white text-[#64748b] border border-[#e2e8f0] hover:border-[#cbd5e1]'
              }`}
          >
            Pending Evaluations ({documents.filter(d => d.status === 'UNDER_EVALUATION_COMMITTEE_REVIEW' && !d.hasEvaluatorGraded).length})
          </button>
          <button
            onClick={() => setFilter('revision')}
            className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${filter === 'revision'
                ? 'bg-[#06b6d4] text-white'
                : 'bg-white text-[#64748b] border border-[#e2e8f0] hover:border-[#cbd5e1]'
              }`}
          >
            Revision Requested ({documents.filter(d => d.status === 'EVALUATION_COMMITTEE_REVISION_REQUESTED').length})
          </button>
          <button
            onClick={() => setFilter('evaluated')}
            className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${filter === 'evaluated'
                ? 'bg-[#06b6d4] text-white'
                : 'bg-white text-[#64748b] border border-[#e2e8f0] hover:border-[#cbd5e1]'
              }`}
          >
            Evaluated ({documents.filter(d => d.status === 'EVALUATION_COMMITTEE_APPROVED').length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${filter === 'all'
                ? 'bg-[#06b6d4] text-white'
                : 'bg-white text-[#64748b] border border-[#e2e8f0] hover:border-[#cbd5e1]'
              }`}
          >
            All Documents ({documents.length})
          </button>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {getFilteredDocuments().map(document => (
          <Card key={document.id || document.documentId} hoverable>
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-[#0f172a] mb-1">{document.studentName || 'Unknown Student'}</h4>
                  <p className="text-[#64748b] m-0"><small>{document.studentRegistrationNumber || 'N/A'}</small></p>
                </div>
                <span className="px-2 py-1 bg-[#06b6d4]/10 text-[#06b6d4] rounded text-xs font-medium">
                  {document.type}
                </span>
              </div>

              <div>
                <h5 className="text-[#0f172a] mb-2 font-medium">{document.title}</h5>
                {document.description && (
                  <p className="text-[#64748b] text-sm m-0 line-clamp-2">{document.description}</p>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-[#64748b]">
                  <Calendar size={14} />
                  <span>Submitted: {document.submittedAt ? new Date(document.submittedAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-[#64748b]">
                  <User size={14} />
                  <span>Supervisor: {document.supervisor?.fullName || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-[#64748b]">
                  <FileText size={14} />
                  <span>Version: {document.version || '1'}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-[#e2e8f0]">
                <button
                  onClick={async () => {
                    try {
                      const docId = document.id || document.documentId;
                      const response = await api.get(`/documents/${docId}/view`, {
                        responseType: 'blob'
                      });
                      const blob = new Blob([response.data], {
                        type: response.headers['content-type'] || 'application/pdf'
                      });
                      const url = window.URL.createObjectURL(blob);
                      window.open(url, '_blank');
                      setTimeout(() => window.URL.revokeObjectURL(url), 100);
                    } catch (error) {
                      console.error('Error viewing document:', error);
                      alert('Failed to open document. Please try again.');
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-white text-[#06b6d4] border border-[#06b6d4] rounded-lg hover:bg-[#06b6d4] hover:text-white transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Download size={14} />
                  View
                </button>
                {document.status === 'UNDER_EVALUATION_COMMITTEE_REVIEW' && !document.hasEvaluatorGraded && (
                  <>
                    <button
                      onClick={() => openEvaluationModal(document)}
                      className="flex-1 px-3 py-2 bg-gradient-to-r from-[#06b6d4] to-[#22d3ee] text-white rounded-lg hover:shadow-lg transition-all duration-200 text-sm flex items-center justify-center gap-2"
                    >
                      <FileCheck size={14} />
                      Evaluate
                    </button>
                    <button
                      onClick={() => openRevisionModal(document)}
                      className="px-3 py-2 bg-[#f59e0b] text-white rounded-lg hover:bg-[#d97706] transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={14} />
                      Revision
                    </button>
                  </>
                )}
              </div>
            </div>
          </Card>
        ))}

        {getFilteredDocuments().length === 0 && (
          <div className="col-span-full">
            <Card>
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[#06b6d4]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="text-[#06b6d4]" size={32} />
                </div>
                <h3 className="text-[#0f172a] mb-2">No Documents</h3>
                <p className="text-[#64748b] m-0">No documents available for evaluation at the moment</p>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Evaluation Modal */}
      {evaluationModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeEvaluationModal}>
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-[#06b6d4] to-[#22d3ee] text-white rounded-t-xl p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-white text-xl sm:text-2xl">Evaluation Form</h2>
                <button
                  onClick={closeEvaluationModal}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="text-white" size={24} />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {/* Document Info */}
              <div className="bg-[#f8fafc] rounded-lg p-4 mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-[#0f172a] mb-1 font-semibold">{selectedDocument?.studentName || 'Unknown Student'}</h3>
                  <p className="text-[#64748b] m-0 mb-2">{selectedDocument?.title}</p>
                  <span className="px-2 py-1 bg-[#06b6d4]/10 text-[#06b6d4] rounded text-xs font-medium">
                    {selectedDocument?.type}
                  </span>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#06b6d4] to-[#22d3ee] rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white text-2xl font-bold">{calculateTotalScore()}</span>
                  </div>
                  <p className="text-[#64748b] text-sm m-0">/ {calculateTotalMaxScore()} Total</p>
                </div>
              </div>

              <form onSubmit={handleSubmitEvaluation} className="space-y-6">
                {/* Evaluation Criteria */}
                <div>
                  <h4 className="text-[#0f172a] mb-4 font-semibold">Evaluation Criteria</h4>

                  <div className="space-y-4">
                    {criteriaInfo.map((criteria) => (
                      <div key={criteria.key} className="bg-white border border-[#e2e8f0] rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{criteria.icon}</span>
                            <span className="text-[#0f172a] font-medium">{criteria.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={evaluationData[criteria.key].score}
                              onChange={(e) => handleScoreChange(criteria.key, e.target.value)}
                              min="0"
                              max={criteria.maxScore}
                              step="0.5"
                              required
                              className="w-20 px-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 text-center"
                            />
                            <span className="text-[#64748b]">/ {criteria.maxScore}</span>
                          </div>
                        </div>

                        <div className="w-full bg-[#e2e8f0] rounded-full h-2 mb-3">
                          <div
                            className="bg-[#06b6d4] h-2 rounded-full transition-all"
                            style={{ width: `${(evaluationData[criteria.key].score / criteria.maxScore) * 100}%` }}
                          ></div>
                        </div>

                        <textarea
                          placeholder={`Feedback for ${criteria.name.toLowerCase()}...`}
                          value={evaluationData[criteria.key].feedback}
                          onChange={(e) => handleFeedbackChange(criteria.key, e.target.value)}
                          rows={2}
                          className="w-full p-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 resize-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Overall Feedback */}
                <div>
                  <label className="block text-[#0f172a] mb-2">
                    Overall Feedback <span className="text-[#ef4444]">*</span>
                  </label>
                  <textarea
                    value={evaluationData.overallFeedback}
                    onChange={(e) => setEvaluationData({ ...evaluationData, overallFeedback: e.target.value })}
                    required
                    rows={5}
                    placeholder="Provide comprehensive feedback on the overall project..."
                    className="w-full p-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 resize-none"
                  />
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-4 border-t border-[#e2e8f0]">
                  <button
                    type="button"
                    onClick={closeEvaluationModal}
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
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting...
                      </>
                    ) : (
                      'Submit Evaluation'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Revision Request Modal */}
      {revisionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeRevisionModal}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-white rounded-t-xl p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-white text-xl sm:text-2xl">Request Revision</h2>
                <button
                  onClick={closeRevisionModal}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="text-white" size={24} />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="bg-[#f8fafc] rounded-lg p-4 mb-6">
                <h3 className="text-[#0f172a] mb-1 font-semibold">{selectedDocument?.studentName || 'Unknown Student'}</h3>
                <p className="text-[#64748b] m-0 mb-2">{selectedDocument?.title}</p>
                <span className="px-2 py-1 bg-[#06b6d4]/10 text-[#06b6d4] rounded text-xs font-medium">
                  {selectedDocument?.type}
                </span>
              </div>

              <form onSubmit={handleSubmitRevision} className="space-y-4">
                <div>
                  <label className="block text-[#0f172a] mb-2">
                    Revision Feedback <span className="text-[#ef4444]">*</span>
                  </label>
                  <textarea
                    value={revisionData.comments}
                    onChange={(e) => setRevisionData({ ...revisionData, comments: e.target.value })}
                    required
                    rows={8}
                    placeholder="Please provide detailed feedback on what needs to be revised in this document..."
                    className="w-full p-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 resize-none"
                  />
                  <p className="mt-2 text-xs text-[#64748b]">
                    This feedback will be sent to both the student and supervisor.
                  </p>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-[#e2e8f0]">
                  <button
                    type="button"
                    onClick={closeRevisionModal}
                    className="flex-1 px-4 py-3 bg-white text-[#06b6d4] border-2 border-[#06b6d4] rounded-lg hover:bg-[#06b6d4] hover:text-white transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <RotateCcw size={18} />
                        Request Revision
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluatorForm;

