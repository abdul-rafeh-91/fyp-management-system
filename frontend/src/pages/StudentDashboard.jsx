import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  LineChart, Line, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import { Calendar, FileText, MessageSquare, CheckCircle, AlertCircle, Settings, Users } from 'lucide-react';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import ProgressBar from '../components/ProgressBar';
import QuickActionCard from '../components/QuickActionCard';
import ChatWidget from '../components/ChatWidget';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      projectStatus: 'In Progress',
      progressPercentage: 65,
      pendingTasks: 3,
      upcomingDeadline: '3 days',
      totalSubmissions: 0,
      approved: 0,
      underReview: 0,
    },
    documents: [],
    notifications: [],
    activities: [],
    deadlines: [],
    feedback: [],
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

      // Fetch Group Info.
      try {
        const groupRes = await api.get(`/groups/student/${user.userId}`);
        if (groupRes.data) {
          setGroup(groupRes.data);
        }
      } catch (err) {
        // No group or 204
        console.log("No group found or error", err);
      }

      const docsResponse = await api.get(`/documents/student/${user.userId}`);
      const documents = Array.isArray(docsResponse.data) ? docsResponse.data : [];

      const notifResponse = await api.get(`/notifications/user/${user.userId}?unreadOnly=false&limit=5`);
      const notifications = Array.isArray(notifResponse.data) ? notifResponse.data : [];

      const deadlinesResponse = await api.get(`/deadlines/student/${user.userId}`);
      const deadlines = Array.isArray(deadlinesResponse.data) ? deadlinesResponse.data : [];

      const feedbackResponse = await api.get(`/reviews/student/${user.userId}`);
      const feedback = Array.isArray(feedbackResponse.data) ? feedbackResponse.data : [];

      // Calculate stats from actual documents
      const totalSubmissions = documents.length;

      const approved = documents.filter(doc => {
        const status = doc.status || '';
        return status === 'SUPERVISOR_APPROVED' ||
          status === 'EVALUATION_COMMITTEE_APPROVED' ||
          status === 'FYP_COMMITTEE_APPROVED' ||
          status === 'FINAL_APPROVED';
      }).length;

      const underReview = documents.filter(doc => {
        const status = doc.status || '';
        return status === 'SUBMITTED' ||
          status === 'UNDER_SUPERVISOR_REVIEW' ||
          status === 'UNDER_EVALUATION_COMMITTEE_REVIEW' ||
          status === 'UNDER_FYP_COMMITTEE_REVIEW';
      }).length;

      const submittedDocs = documents.filter(doc => doc.isSubmitted).length;
      const totalDocs = Math.max(documents.length, 4);
      const progressPercentage = Math.round((submittedDocs / totalDocs) * 100);
      const nextDeadline = getNextDeadline(deadlines);

      setDashboardData({
        stats: {
          projectStatus: getOverallStatus(documents),
          progressPercentage,
          pendingTasks: documents.filter(doc =>
            !doc.isSubmitted || (doc.status && doc.status.includes('REVISION'))
          ).length,
          upcomingDeadline: nextDeadline,
          totalSubmissions,
          approved,
          underReview,
        },
        documents: documents.slice(0, 4),
        notifications,
        activities: generateActivities(documents, notifications),
        deadlines: deadlines.slice(0, 3),
        feedback: feedback.slice(0, 2),
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardData(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          totalSubmissions: 0, approved: 0, underReview: 0,
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  const getOverallStatus = (documents) => {
    if (documents.length === 0) return 'Not Started';
    const allApproved = documents.every(doc =>
      doc.status === 'FINAL_APPROVED' || doc.status === 'COMMITTEE_APPROVED'
    );
    if (allApproved) return 'Completed';
    const anySubmitted = documents.some(doc => doc.isSubmitted);
    if (anySubmitted) return 'In Progress';
    return 'Not Started';
  };

  const getNextDeadline = (deadlines) => {
    if (deadlines.length === 0) return 'No deadline';
    const now = new Date();
    const upcoming = deadlines.filter(d =>
      d.deadlineDate && new Date(d.deadlineDate) > now
    );
    if (upcoming.length === 0) return 'No upcoming deadline';

    const closest = upcoming.sort((a, b) =>
      new Date(a.deadlineDate) - new Date(b.deadlineDate)
    )[0];

    const daysLeft = Math.ceil((new Date(closest.deadlineDate) - now) / (1000 * 60 * 60 * 24));
    return `${daysLeft} days`;
  };

  const generateActivities = (documents, notifications) => {
    const activities = [];
    documents.slice(0, 3).forEach(doc => {
      if (doc.submittedAt) {
        activities.push({
          type: 'document',
          message: `Submitted ${doc.type}`,
          time: new Date(doc.submittedAt),
          icon: '📄',
        });
      }
    });

    notifications.slice(0, 2).forEach(notif => {
      activities.push({
        type: 'notification',
        message: notif.title,
        time: new Date(notif.createdAt),
        icon: '🔔',
      });
    });

    return activities.sort((a, b) => b.time - a.time).slice(0, 5);
  };

  // Chart Data
  const weeklyProgressData = [
    { week: 'Week 1', progress: 20 },
    { week: 'Week 2', progress: 35 },
    { week: 'Week 3', progress: 45 },
    { week: 'Week 4', progress: 55 },
    { week: 'Week 5', progress: dashboardData.stats.progressPercentage },
  ];

  const submissionStatusData = [
    { name: 'Approved', value: dashboardData.stats.approved, color: '#10b981' },
    { name: 'Under Review', value: dashboardData.stats.underReview, color: '#f59e0b' },
    { name: 'Pending', value: dashboardData.stats.pendingTasks, color: '#ef4444' },
  ];

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
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#06b6d4] to-[#22d3ee] text-white rounded-xl shadow-lg p-4 sm:p-5">
        <div className="mb-4">
          <h1 className="text-white mb-1 text-xl sm:text-2xl font-semibold">Student Dashboard</h1>
          <p className="text-white/90 text-xs sm:text-sm">
            Welcome back, {user?.fullName?.split(' ')[0] || 'Student'}! Track your Final Year Project progress
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-3 border border-white/20">
            <div className="flex items-center justify-between mb-1">
              <FileText className="text-white/80" size={16} />
              <h3 className="text-white m-0 text-base sm:text-lg font-semibold">{dashboardData.stats.totalSubmissions}</h3>
            </div>
            <p className="text-white/70 m-0 text-xs"><small>Total Submissions</small></p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-3 border border-white/20">
            <div className="flex items-center justify-between mb-1">
              <CheckCircle className="text-[#10b981]" size={16} />
              <h3 className="text-white m-0 text-base sm:text-lg font-semibold">{dashboardData.stats.approved}</h3>
            </div>
            <p className="text-white/70 m-0 text-xs"><small>Approved</small></p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-3 border border-white/20">
            <div className="flex items-center justify-between mb-1">
              <AlertCircle className="text-[#f59e0b]" size={16} />
              <h3 className="text-white m-0 text-base sm:text-lg font-semibold">{dashboardData.stats.underReview}</h3>
            </div>
            <p className="text-white/70 m-0 text-xs"><small>Under Review</small></p>
          </div>
        </div>
      </div>

      {/* Group & Chat Section (New) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <QuickActionCard
              onClick={() => navigate('/student/documents')}
              icon={<FileText className="text-white" size={20} />}
              title="Upload Document"
              description="Submit your latest work"
              color="#06b6d4"
            />

            <QuickActionCard
              onClick={() => navigate('/student/feedback')}
              icon={<MessageSquare className="text-white" size={20} />}
              title="View Feedback"
              description="Check supervisor reviews"
              color="#10b981"
            />

            <QuickActionCard
              onClick={() => navigate('/student/grades')}
              icon={<CheckCircle className="text-white" size={20} />}
              title="View Grades"
              description="Check your DMC"
              color="#8b5cf6"
            />

            <QuickActionCard
              onClick={() => navigate('/student/settings')}
              icon={<Settings className="text-white" size={20} />}
              title="Settings"
              description="Manage your account"
              color="#f59e0b"
            />
          </div>

          {/* Analytics Charts - Moved under Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card title="Weekly Progress Trend">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weeklyProgressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="week" stroke="#64748b" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="progress" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Submission Status Overview">
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={submissionStatusData} cx="50%" cy="50%" labelLine={false} outerRadius={70} fill="#8884d8" dataKey="value">
                      {submissionStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {submissionStatusData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                      <span className="text-sm text-[#64748b]">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Group Info Sidebar */}
        <div className="space-y-6">
          <Card className="border-l-4 border-[#06b6d4]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-50 rounded-lg text-[#06b6d4]">
                <Users size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">My Project Group</h3>
                {group ? (
                  <p className="text-sm text-gray-500 font-medium">{group.name}</p>
                ) : (
                  <p className="text-xs text-gray-500">No group assigned</p>
                )}
              </div>
            </div>

            {group ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold mb-2">Supervisor</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                      {group.supervisor?.fullName?.charAt(0)}
                    </div>
                    <span className="text-sm font-medium">{group.supervisor?.fullName}</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold mb-2">Members ({group.members?.length})</p>
                  <div className="space-y-2">
                    {group.members?.map(member => (
                      <div key={member.id} className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-[#06b6d4] flex items-center justify-center text-[10px] font-bold">
                          {member.fullName?.charAt(0)}
                        </div>
                        <span className={`text-sm ${member.id === user.userId ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                          {member.fullName} {member.id === user.userId && '(You)'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100 text-yellow-800 text-sm">
                You have not been assigned to a group yet. Please contact the FYP Committee.
              </div>
            )}
          </Card>

          {/* Chat Widget */}
          {group && (
            <ChatWidget groupId={group.id} />
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
