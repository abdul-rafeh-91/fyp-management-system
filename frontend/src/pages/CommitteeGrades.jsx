import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import { FileText, Eye, CheckCircle, AlertCircle, BarChart3, X } from 'lucide-react';
import Card from '../components/Card';

const CommitteeGrades = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [grades, setGrades] = useState([]);
  const [viewModal, setViewModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('graded');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      // Fetch documents that have been evaluated (status: EVALUATION_COMMITTEE_APPROVED).
      const response = await api.get('/documents/status/EVALUATION_COMMITTEE_APPROVED');
      setDocuments(response.data || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchGrades = async (documentId) => {
    try {
      const response = await api.get(`/grades/document/${documentId}`);
      return response.data;
    } catch (err) {
      console.error('Error fetching grades:', err);
      return [];
    }
  };

  const openViewModal = async (document) => {
    setSelectedDocument(document);
    // Fetch overall result instead of individual grades
    try {
      const response = await api.get(`/grades/document/${document.id}/overall-result`);
      setGrades([response.data]); // Store as array for compatibility
    } catch (err) {
      console.error('Error fetching overall result:', err);
      setError('Failed to load overall result');
    }
    setViewModal(true);
  };

  const closeViewModal = () => {
    setViewModal(false);
    setSelectedDocument(null);
    setGrades([]);
  };

  const handleReleaseGrade = async (gradeId) => {
    try {
      setSubmitting(true);
      setError('');

      await api.patch(`/grades/${gradeId}/release`);

      showToast('Grade released successfully!');
      
      // Refresh grades
      const docGrades = await fetchGrades(selectedDocument.id);
      setGrades(docGrades);
      await fetchDocuments();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to release grade');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReleaseAllGrades = async () => {
    try {
      setSubmitting(true);
      setError('');

      await api.patch(`/grades/document/${selectedDocument.id}/release-all`);

      showToast('Overall result released successfully! Student will be notified.');
      
      // Refresh overall result
      const response = await api.get(`/grades/document/${selectedDocument.id}/overall-result`);
      setGrades([response.data]);
      await fetchDocuments();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to release result');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateTotalScore = (docGrades) => {
    return docGrades.reduce((total, grade) => total + grade.score, 0);
  };

  const calculateTotalMaxScore = (docGrades) => {
    return docGrades.reduce((total, grade) => total + grade.maxScore, 0);
  };

  const calculatePercentage = (docGrades) => {
    const total = calculateTotalScore(docGrades);
    const max = calculateTotalMaxScore(docGrades);
    return max > 0 ? (total / max) * 100 : 0;
  };

  const getLetterGrade = (percentage) => {
    if (percentage >= 85) return 'A';
    if (percentage >= 80) return 'A-';
    if (percentage >= 75) return 'B+';
    if (percentage >= 70) return 'B';
    if (percentage >= 65) return 'B-';
    if (percentage >= 60) return 'C+';
    if (percentage >= 55) return 'C';
    if (percentage >= 50) return 'C-';
    return 'F';
  };

  const getGradeColor = (grade) => {
    const colors = {
      'A': '#10b981',
      'A-': '#14b8a6',
      'B+': '#22c55e',
      'B': '#84cc16',
      'B-': '#a3e635',
      'C+': '#fbbf24',
      'C': '#f59e0b',
      'C-': '#f97316',
      'F': '#ef4444',
    };
    return colors[grade] || '#64748b';
  };

  const getFilteredDocuments = () => {
    if (filter === 'graded') {
      return documents.filter(doc => 
        doc.status === 'EVALUATION_COMMITTEE_APPROVED'
      );
    }
    if (filter === 'released') {
      return documents.filter(doc =>
        doc.status === 'FYP_COMMITTEE_APPROVED' || doc.status === 'FINAL_APPROVED'
      );
    }
    return documents;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#06b6d4] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#64748b]">Loading grades...</p>
        </div>
      </div>
    );
  }

  const pendingCount = documents.filter(d => d.status === 'EVALUATION_COMMITTEE_APPROVED').length;
  const totalGraded = documents.filter(d => d.status?.includes('APPROVED')).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#06b6d4] to-[#22d3ee] text-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-white mb-2 text-2xl sm:text-3xl">Grade Management</h1>
            <p className="text-white/90 text-sm sm:text-base">Review and release student grades</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
              <span className="text-white text-sm font-semibold">{pendingCount}</span>
              <p className="text-white/80 text-xs m-0">Pending Release</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
              <span className="text-white text-sm font-semibold">{totalGraded}</span>
              <p className="text-white/80 text-xs m-0">Total Graded</p>
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

      {/* Filter Section */}
      <Card>
        <div className="flex gap-2 overflow-x-auto">
          <button
            className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
              filter === 'graded'
                ? 'bg-[#06b6d4] text-white'
                : 'bg-white text-[#64748b] hover:bg-[#f8fafc] border border-[#e2e8f0]'
            }`}
            onClick={() => setFilter('graded')}
          >
            Awaiting Release ({pendingCount})
          </button>
          <button
            className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
              filter === 'released'
                ? 'bg-[#06b6d4] text-white'
                : 'bg-white text-[#64748b] hover:bg-[#f8fafc] border border-[#e2e8f0]'
            }`}
            onClick={() => setFilter('released')}
          >
            Released ({documents.filter(d => d.status?.includes('FYP_COMMITTEE') || d.status === 'FINAL_APPROVED').length})
          </button>
          <button
            className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
              filter === 'all'
                ? 'bg-[#06b6d4] text-white'
                : 'bg-white text-[#64748b] hover:bg-[#f8fafc] border border-[#e2e8f0]'
            }`}
            onClick={() => setFilter('all')}
          >
            All Documents ({documents.length})
          </button>
        </div>
      </Card>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getFilteredDocuments().length > 0 ? (
          getFilteredDocuments().map(document => (
            <Card key={document.id} hoverable>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-[#0f172a] mb-1">{document.studentName || 'Unknown Student'}</h3>
                    <p className="text-[#64748b] m-0 text-sm">{document.studentRegistrationNumber || 'N/A'}</p>
                  </div>
                  <span 
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      document.status === 'EVALUATION_COMMITTEE_APPROVED' 
                        ? 'bg-[#f59e0b]/10 text-[#f59e0b]' 
                        : 'bg-[#10b981]/10 text-[#10b981]'
                    }`}
                  >
                    {document.status === 'EVALUATION_COMMITTEE_APPROVED' ? 'Pending Release' : 'Released'}
                  </span>
                </div>

                <div className="bg-[#f8fafc] rounded-lg p-4 border-l-4 border-[#06b6d4]">
                  <h4 className="text-[#0f172a] mb-2 font-semibold">{document.title}</h4>
                  <p className="text-[#64748b] text-sm m-0">{document.type}</p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-[#64748b]">
                    <span>📅</span>
                    <span>Submitted: {new Date(document.submittedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#64748b]">
                    <span>👨‍🏫</span>
                    <span>Supervisor: {document.supervisorName || 'N/A'}</span>
                  </div>
                </div>

                <button 
                  className="w-full px-4 py-2 bg-gradient-to-r from-[#06b6d4] to-[#22d3ee] text-white rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                  onClick={() => openViewModal(document)}
                >
                  <Eye size={16} />
                  View Grades
                </button>
              </div>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[#06b6d4]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="text-[#06b6d4]" size={32} />
              </div>
              <h3 className="text-[#0f172a] mb-2">No Documents</h3>
              <p className="text-[#64748b] m-0">No documents available at the moment</p>
            </div>
          </Card>
        )}
      </div>

      {/* View Grades Modal */}
      {viewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeViewModal}>
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[#0f172a] text-2xl font-semibold">Document Grades</h2>
              <button className="p-2 hover:bg-[#f8fafc] rounded-lg transition-colors" onClick={closeViewModal}>
                <X size={24} className="text-[#64748b]" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Student Info */}
              <div className="bg-[#f8fafc] rounded-lg p-4 border-l-4 border-[#06b6d4]">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-[#0f172a] mb-1 font-semibold">{selectedDocument?.studentName || 'Unknown Student'}</h3>
                    <p className="text-[#64748b] text-sm m-0">{selectedDocument?.studentRegistrationNumber || 'N/A'}</p>
                    <p className="text-[#64748b] text-xs m-0 mt-1">Student ID: {selectedDocument?.studentId || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 className="text-[#0f172a] mb-1 font-semibold">{selectedDocument?.title}</h4>
                    <span className="inline-block px-3 py-1 bg-[#06b6d4]/10 text-[#06b6d4] rounded-full text-xs font-medium">
                      {selectedDocument?.type}
                    </span>
                  </div>
                </div>
              </div>

              {/* Overall Result */}
              {grades.length > 0 && grades[0].totalScore !== undefined && (
                <Card>
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#06b6d4] to-[#22d3ee] flex items-center justify-center">
                        <span className="text-white text-3xl font-bold">{grades[0].percentage.toFixed(1)}%</span>
                      </div>
                      <div 
                        className="px-6 py-3 rounded-lg text-white text-2xl font-bold"
                        style={{ background: getGradeColor(grades[0].grade) }}
                      >
                        {grades[0].grade}
                      </div>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div className="bg-[#f8fafc] rounded-lg p-4">
                        <p className="text-[#64748b] text-sm mb-1">Total Marks</p>
                        <p className="text-[#0f172a] text-xl font-bold m-0">
                          {grades[0].totalScore.toFixed(2)} / {grades[0].totalMaxScore.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-[#f8fafc] rounded-lg p-4">
                        <p className="text-[#64748b] text-sm mb-1">Percentage</p>
                        <p className="text-[#0f172a] text-xl font-bold m-0">{grades[0].percentage.toFixed(2)}%</p>
                      </div>
                      <div className="bg-[#f8fafc] rounded-lg p-4">
                        <p className="text-[#64748b] text-sm mb-1">Grade</p>
                        <p className="text-[#0f172a] text-xl font-bold m-0">{grades[0].grade}</p>
                      </div>
                      <div className="bg-[#f8fafc] rounded-lg p-4">
                        <p className="text-[#64748b] text-sm mb-1">GPA</p>
                        <p className="text-[#0f172a] text-xl font-bold m-0">{grades[0].gpa.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Grade Tracking Table */}
              <Card>
                <h3 className="text-[#0f172a] mb-4 font-semibold">Grade Tracking</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#f1f5f9] border-b-2 border-[#e2e8f0]">
                        <th className="p-3 text-left text-[#0f172a] font-semibold">Student</th>
                        <th className="p-3 text-left text-[#0f172a] font-semibold">Document</th>
                        <th className="p-3 text-center text-[#0f172a] font-semibold">Grade</th>
                        <th className="p-3 text-center text-[#0f172a] font-semibold">GPA</th>
                        <th className="p-3 text-center text-[#0f172a] font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-[#e2e8f0]">
                        <td className="p-3 text-[#0f172a]">
                          {selectedDocument?.studentName || 'Unknown'}
                          <br />
                          <small className="text-[#64748b]">{selectedDocument?.studentRegistrationNumber || 'N/A'}</small>
                        </td>
                        <td className="p-3 text-[#0f172a]">
                          {selectedDocument?.title || 'N/A'}
                          <br />
                          <small className="text-[#64748b]">{selectedDocument?.type || 'N/A'}</small>
                        </td>
                        <td className="p-3 text-center">
                          {grades.length > 0 && grades[0].grade ? (
                            <span 
                              className="inline-block px-3 py-1 rounded-lg text-white font-semibold"
                              style={{ background: getGradeColor(grades[0].grade) }}
                            >
                              {grades[0].grade}
                            </span>
                          ) : (
                            <span className="text-[#94a3b8]">N/A</span>
                          )}
                        </td>
                        <td className="p-3 text-center text-[#0f172a] font-medium">
                          {grades.length > 0 && grades[0].gpa ? grades[0].gpa.toFixed(2) : 'N/A'}
                        </td>
                        <td className="p-3 text-center">
                          <span 
                            className={`inline-block px-3 py-1 rounded-lg text-white text-sm font-medium ${
                              selectedDocument?.status === 'FINAL_APPROVED' ? 'bg-[#10b981]' : 'bg-[#f59e0b]'
                            }`}
                          >
                            {selectedDocument?.status === 'FINAL_APPROVED' ? 'Released' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Actions */}
              {grades.length > 0 && grades[0].totalScore !== undefined && (
                <div className="flex gap-3 pt-4">
                  <button 
                    className="flex-1 px-4 py-3 bg-white text-[#06b6d4] border-2 border-[#06b6d4] rounded-lg hover:bg-[#06b6d4] hover:text-white transition-all duration-200"
                    onClick={closeViewModal}
                  >
                    Close
                  </button>
                  <button 
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-[#06b6d4] to-[#22d3ee] text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                    onClick={handleReleaseAllGrades}
                    disabled={submitting}
                  >
                    {submitting ? 'Releasing...' : 'Release All Grades'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommitteeGrades;

