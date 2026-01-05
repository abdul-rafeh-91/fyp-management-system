import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Calendar, CheckCircle, Clock } from 'lucide-react';

const EvaluatorDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    assignedProjects: 0,
    completedEvaluations: 0,
    pendingEvaluations: 0,
  });

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user?.userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch documents that need evaluation..
      const pendingResponse = await api.get('/documents/status/UNDER_EVALUATION_COMMITTEE_REVIEW');
      const completedResponse = await api.get('/documents/status/EVALUATION_COMMITTEE_APPROVED');
      const revisionResponse = await api.get('/documents/status/EVALUATION_COMMITTEE_REVISION_REQUESTED');
      
      // Combine all documents
      const allDocuments = [
        ...(Array.isArray(pendingResponse.data) ? pendingResponse.data : []),
        ...(Array.isArray(completedResponse.data) ? completedResponse.data : []),
        ...(Array.isArray(revisionResponse.data) ? revisionResponse.data : []),
      ];

      // Remove duplicates
      const uniqueDocs = allDocuments.filter((doc, index, self) =>
        index === self.findIndex(d => (d.id || d.documentId) === (doc.id || doc.documentId))
      );

      // Check which pending documents have been graded by this evaluator
      const pendingDocs = uniqueDocs.filter(doc => 
        doc.status === 'UNDER_EVALUATION_COMMITTEE_REVIEW'
      );

      const pendingWithGradedStatus = await Promise.all(
        pendingDocs.map(async (doc) => {
          try {
            const docId = doc.id || doc.documentId;
            const checkResponse = await api.get(`/grades/document/${docId}/evaluator/${user.userId}/has-graded`);
            return {
              ...doc,
              hasEvaluatorGraded: checkResponse.data.hasGraded || false
            };
          } catch (err) {
            return { ...doc, hasEvaluatorGraded: false };
          }
        })
      );

      // Count pending evaluations (not yet graded by this evaluator)
      const pendingEvaluations = pendingWithGradedStatus.filter(doc => !doc.hasEvaluatorGraded).length;

      // Count completed evaluations
      const completedEvaluations = uniqueDocs.filter(doc => 
        doc.status === 'EVALUATION_COMMITTEE_APPROVED'
      ).length;

      setStats({
        assignedProjects: uniqueDocs.length,
        completedEvaluations,
        pendingEvaluations,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setStats({
        assignedProjects: 0,
        completedEvaluations: 0,
        pendingEvaluations: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#06b6d4] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#64748b]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#06b6d4] to-[#22d3ee] text-white rounded-xl shadow-lg p-4 sm:p-5">
        <div className="mb-4">
          <h1 className="text-white mb-1 text-xl sm:text-2xl font-semibold">Evaluator Dashboard</h1>
          <p className="text-white/90 text-xs sm:text-sm">
            Welcome, {user?.fullName?.split(' ')[0] || 'Evaluator'}! Review and evaluate assigned documents
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Assigned Projects */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-[#e2e8f0] hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-[#06b6d4]/10 p-3 rounded-lg">
              <Calendar className="text-[#06b6d4]" size={24} />
            </div>
          </div>
          <h3 className="text-[#64748b] text-sm font-medium mb-1">Assigned Projects</h3>
          <p className="text-[#0f172a] text-3xl font-bold m-0">{stats.assignedProjects}</p>
        </div>

        {/* Completed Evaluations */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-[#e2e8f0] hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-[#10b981]/10 p-3 rounded-lg">
              <CheckCircle className="text-[#10b981]" size={24} />
            </div>
          </div>
          <h3 className="text-[#64748b] text-sm font-medium mb-1">Completed Evaluations</h3>
          <p className="text-[#0f172a] text-3xl font-bold m-0">{stats.completedEvaluations}</p>
        </div>

        {/* Pending Evaluations */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-[#e2e8f0] hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-[#f59e0b]/10 p-3 rounded-lg">
              <Clock className="text-[#f59e0b]" size={24} />
            </div>
          </div>
          <h3 className="text-[#64748b] text-sm font-medium mb-1">Pending Evaluations</h3>
          <p className="text-[#0f172a] text-3xl font-bold m-0">{stats.pendingEvaluations}</p>
        </div>
      </div>
    </div>
  );
};

export default EvaluatorDashboard;
