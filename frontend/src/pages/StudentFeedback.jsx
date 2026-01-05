import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { MessageSquare, CheckCircle, AlertCircle, FileText, Clock, Upload, Download, Eye } from 'lucide-react';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';

const StudentFeedback = () => {
  const { user } = useAuth();
  const [versionHistory, setVersionHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchVersionHistory();
    }
  }, [user]);

  const fetchVersionHistory = async () => {
    try {
      setLoading(true);
      // Fetch all student documents.
      const docsResponse = await api.get(`/documents/student/${user?.userId}`);
      const documents = docsResponse.data || [];
      
      console.log('Fetched documents:', documents);
      
      if (documents.length === 0) {
        setVersionHistory([]);
        setLoading(false);
        return;
      }
      
      // For each document, fetch versions and reviews
      const historyPromises = documents.map(async (doc) => {
        try {
          const docId = doc.id || doc.documentId;
          if (!docId) {
            console.warn('Document missing ID:', doc);
            return [];
          }
          
          const [versionsResponse, reviewsResponse] = await Promise.all([
            api.get(`/documents/${docId}/versions`).catch(err => {
              console.error(`Error fetching versions for document ${docId}:`, err);
              return { data: [] };
            }),
            api.get(`/reviews/document/${docId}`).catch(err => {
              console.error(`Error fetching reviews for document ${docId}:`, err);
              return { data: [] };
            })
          ]);
          
          const versions = versionsResponse.data || [];
          const reviews = reviewsResponse.data || [];
          
          console.log(`Document ${docId} - Versions:`, versions, 'Reviews:', reviews);
          
          // Combine versions and reviews into timeline
          const timeline = [];
          
          // Add versions
          versions.forEach(version => {
            timeline.push({
              type: 'version',
              documentId: doc.id,
              documentTitle: doc.title,
              documentType: doc.type,
              versionNumber: version.versionNumber,
              fileName: version.fileName,
              filePath: version.filePath,
              uploadedAt: version.uploadedAt,
              changeDescription: version.changeDescription,
              wasSubmitted: version.wasSubmitted,
              status: doc.status,
              feedback: null
            });
          });
          
          // Add reviews (feedback)
          reviews.forEach(review => {
            // Map review decision to proper status based on reviewer role
            let statusText = review.decision;
            if (review.decision === 'REVISION_REQUESTED') {
              if (review.reviewerRole === 'SUPERVISOR') {
                statusText = 'Supervisor Requested Revision';
              } else if (review.reviewerRole === 'EVALUATOR') {
                statusText = 'Evaluation Committee Requested Revision';
              } else if (review.reviewerRole === 'FYP_COMMITTEE') {
                statusText = 'FYP Committee Requested Revision';
              }
            }
            
            timeline.push({
              type: 'review',
              documentId: doc.id,
              documentTitle: doc.title,
              documentType: doc.type,
              reviewerName: review.reviewerName,
              reviewerRole: review.reviewerRole,
              decision: review.decision,
              comments: review.comments,
              reviewedAt: review.reviewedAt,
              status: statusText,
              feedback: review.comments
            });
          });
          
          return timeline;
        } catch (error) {
          console.error(`Error fetching history for document ${doc.id}:`, error);
          return [];
        }
      });
      
      const allHistory = await Promise.all(historyPromises);
      // Flatten and sort by date
      const flattened = allHistory.flat();
      flattened.sort((a, b) => {
        const dateA = new Date(a.uploadedAt || a.reviewedAt || 0);
        const dateB = new Date(b.uploadedAt || b.reviewedAt || 0);
        return dateB - dateA; // Newest first
      });
      
      setVersionHistory(flattened);
    } catch (error) {
      console.error('Error fetching version history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFeedbackIcon = (status) => {
    if (status?.includes('APPROVED')) {
      return <CheckCircle className="text-[#10b981]" size={24} />;
    }
    if (status?.includes('REVISION') || status?.includes('REJECTED')) {
      return <AlertCircle className="text-[#ef4444]" size={24} />;
    }
    return <MessageSquare className="text-[#f59e0b]" size={24} />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#06b6d4] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#64748b]">Loading feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#06b6d4] to-[#22d3ee] text-white rounded-xl shadow-lg p-4 sm:p-5">
        <h1 className="text-white mb-1 text-xl sm:text-2xl font-semibold">Version History & Feedback</h1>
        <p className="text-white/90 text-xs sm:text-sm">View document upload history, status changes, and feedback from supervisors and evaluators</p>
      </div>

      {versionHistory.length > 0 ? (
        <div className="space-y-3">
          {versionHistory.map((item, index) => (
            <Card key={`${item.type}-${item.documentId}-${index}`} hoverable className="border-l-4 border-l-[#06b6d4]">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      item.type === 'version' 
                        ? 'bg-[#06b6d4]/10' 
                        : item.decision === 'APPROVED' || item.status?.includes('APPROVED')
                        ? 'bg-[#10b981]/10'
                        : 'bg-[#f59e0b]/10'
                    }`}>
                      {item.type === 'version' ? (
                        <Upload className="text-[#06b6d4]" size={20} />
                      ) : (
                        getFeedbackIcon(item.decision || item.status)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[#0f172a] mb-1 font-semibold text-base">
                        {item.type === 'version' 
                          ? `Version ${item.versionNumber} - ${item.documentTitle || item.documentType}`
                          : `Feedback - ${item.documentTitle || item.documentType}`
                        }
                      </h4>
                      <p className="text-[#64748b] m-0 text-xs mb-2">
                        {item.type === 'version' 
                          ? `Uploaded ${item.wasSubmitted ? '& Submitted' : ''}`
                          : `From: ${item.reviewerName || 'Reviewer'}`
                        }
                      </p>
                      <StatusBadge status={item.status || item.decision} />
                    </div>
                  </div>
                </div>

                {item.type === 'version' && (
                  <div className="bg-gradient-to-r from-[#ecfeff] to-[#f0fdfa] rounded-lg p-3 border border-[#06b6d4]/20">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-[#0f172a] font-medium m-0 text-sm truncate">{item.fileName}</p>
                        {item.changeDescription && (
                          <p className="text-[#64748b] text-xs m-0 mt-1">{item.changeDescription}</p>
                        )}
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            const response = await api.get(`/documents/${item.documentId}/view`, {
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
                        className="p-1.5 bg-[#06b6d4] text-white rounded-lg hover:bg-[#0891b2] transition-colors ml-2 flex-shrink-0"
                        title="View Document"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {item.type === 'review' && item.feedback && (
                  <div className="bg-gradient-to-r from-[#fef3c7] to-[#fef9c3] rounded-lg p-3 border-l-4 border-[#f59e0b]">
                    <p className="text-[#0f172a] m-0 text-sm leading-relaxed">{item.feedback || item.comments || 'No comments provided'}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-[#e2e8f0]">
                  <div className="flex items-center gap-2 text-xs text-[#64748b]">
                    <Clock size={12} />
                    <span>
                      {item.uploadedAt || item.reviewedAt
                        ? new Date(item.uploadedAt || item.reviewedAt).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Recently'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-[#06b6d4]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="text-[#06b6d4]" size={24} />
            </div>
            <h3 className="text-[#0f172a] mb-1 text-lg">No Version History Yet</h3>
            <p className="text-[#64748b] m-0 text-sm">Your document upload history and feedback will appear here</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default StudentFeedback;
