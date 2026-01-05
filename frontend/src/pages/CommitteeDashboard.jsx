import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { FolderOpen, Users, UserCheck, CheckCircle2 } from 'lucide-react';

const CommitteeDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeStudents: 0,
    supervisors: 0,
    completedEvaluations: 0,
  });

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all students data
      const studentsResponse = await api.get('/users/role/STUDENT');
      const students = Array.isArray(studentsResponse.data) ? studentsResponse.data : [];
      
      // Fetch all supervisors data
      const supervisorsResponse = await api.get('/users/role/SUPERVISOR');
      const supervisors = Array.isArray(supervisorsResponse.data) ? supervisorsResponse.data : [];
      
      // Fetch all documents data
      const documentsResponse = await api.get('/documents');
      const documents = Array.isArray(documentsResponse.data) ? documentsResponse.data : [];
      
      // Count active students (with at least one document)
      const activeStudents = students.filter(student => {
        return documents.some(doc => (doc.studentId || doc.student?.id) === (student.id || student.userId));
      }).length;
      
      // Count completed evaluations (FYP_COMMITTEE_APPROVED or FINAL_APPROVED)
      const completedEvaluations = documents.filter(doc => {
        const status = doc.status || '';
        return status === 'FYP_COMMITTEE_APPROVED' || status === 'FINAL_APPROVED';
      }).length;

      setStats({
        totalProjects: documents.length,
        activeStudents,
        supervisors: supervisors.length,
        completedEvaluations,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setStats({
        totalProjects: 0,
        activeStudents: 0,
        supervisors: 0,
        completedEvaluations: 0,
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
          <h1 className="text-white mb-1 text-xl sm:text-2xl font-semibold">Committee Dashboard</h1>
          <p className="text-white/90 text-xs sm:text-sm">
            Welcome, {user?.fullName?.split(' ')[0] || 'FYP Committee'}! Overview of all projects and evaluations
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Projects */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-[#e2e8f0] hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-[#f59e0b]/10 p-3 rounded-lg">
              <FolderOpen className="text-[#f59e0b]" size={24} />
            </div>
          </div>
          <p className="text-[#64748b] text-sm mb-1">Total Projects</p>
          <h3 className="text-[#0f172a] text-2xl font-bold">{stats.totalProjects}</h3>
        </div>

        {/* Active Students */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-[#e2e8f0] hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-[#8b5cf6]/10 p-3 rounded-lg">
              <Users className="text-[#8b5cf6]" size={24} />
            </div>
          </div>
          <p className="text-[#64748b] text-sm mb-1">Active Students</p>
          <h3 className="text-[#0f172a] text-2xl font-bold">{stats.activeStudents}</h3>
        </div>

        {/* Supervisors */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-[#e2e8f0] hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-[#06b6d4]/10 p-3 rounded-lg">
              <UserCheck className="text-[#06b6d4]" size={24} />
            </div>
          </div>
          <p className="text-[#64748b] text-sm mb-1">Supervisors</p>
          <h3 className="text-[#0f172a] text-2xl font-bold">{stats.supervisors}</h3>
        </div>

        {/* Completed Evaluations */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-[#e2e8f0] hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-[#10b981]/10 p-3 rounded-lg">
              <CheckCircle2 className="text-[#10b981]" size={24} />
            </div>
          </div>
          <p className="text-[#64748b] text-sm mb-1">Completed Evaluations</p>
          <h3 className="text-[#0f172a] text-2xl font-bold">{stats.completedEvaluations}</h3>
        </div>
      </div>
    </div>
  );
};

export default CommitteeDashboard;
