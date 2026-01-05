import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Users, FolderOpen, FileCheck } from 'lucide-react';

const SupervisorDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeProjects: 0,
    pendingReviews: 0,
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
      
      // Fetch documents for this supervisor
      const response = await api.get(`/documents/supervisor/${user.userId}`);
      const documents = Array.isArray(response.data) ? response.data : [];

      // Calculate unique students
      const uniqueStudents = new Set();
      documents.forEach(doc => {
        const studentId = doc.studentId || doc.student?.id;
        if (studentId) {
          uniqueStudents.add(studentId);
        }
      });

      // Count active projects (not final approved)
      const activeProjects = documents.filter(doc => {
        const status = doc.status || '';
        return status !== 'FINAL_APPROVED' && status !== 'FYP_COMMITTEE_APPROVED';
      }).length;

      // Count pending reviews (SUBMITTED or UNDER_SUPERVISOR_REVIEW)
      const pendingReviews = documents.filter(doc => {
        const status = doc.status || '';
        return status === 'SUBMITTED' || status === 'UNDER_SUPERVISOR_REVIEW';
      }).length;

      setStats({
        totalStudents: uniqueStudents.size,
        activeProjects,
        pendingReviews,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setStats({
        totalStudents: 0,
        activeProjects: 0,
        pendingReviews: 0,
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
          <h1 className="text-white mb-1 text-xl sm:text-2xl font-semibold">Supervisor Dashboard</h1>
          <p className="text-white/90 text-xs sm:text-sm">
            Welcome, {user?.fullName?.split(' ')[0] || 'Supervisor'}! Manage your students and reviews
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Students */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-[#e2e8f0] hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-[#8b5cf6]/10 p-3 rounded-lg">
              <Users className="text-[#8b5cf6]" size={24} />
            </div>
          </div>
          <h3 className="text-[#64748b] text-sm font-medium mb-1">Total Students</h3>
          <p className="text-[#0f172a] text-3xl font-bold m-0">{stats.totalStudents}</p>
        </div>

        {/* Active Projects */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-[#e2e8f0] hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-[#f59e0b]/10 p-3 rounded-lg">
              <FolderOpen className="text-[#f59e0b]" size={24} />
            </div>
          </div>
          <h3 className="text-[#64748b] text-sm font-medium mb-1">Active Projects</h3>
          <p className="text-[#0f172a] text-3xl font-bold m-0">{stats.activeProjects}</p>
        </div>

        {/* Pending Reviews */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-[#e2e8f0] hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-[#ef4444]/10 p-3 rounded-lg">
              <FileCheck className="text-[#ef4444]" size={24} />
            </div>
          </div>
          <h3 className="text-[#64748b] text-sm font-medium mb-1">Pending Reviews</h3>
          <p className="text-[#0f172a] text-3xl font-bold m-0">{stats.pendingReviews}</p>
        </div>
      </div>
    </div>
  );
};

export default SupervisorDashboard;
