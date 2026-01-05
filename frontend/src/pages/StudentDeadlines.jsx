import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Calendar, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import Card from '../components/Card';

const StudentDeadlines = () => {
  const { user } = useAuth();
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDeadlines();
    }
  }, [user]);

  const fetchDeadlines = async () => {
    try {
      const response = await api.get(`/deadlines/student/${user?.userId}`);
      setDeadlines(response.data || []);
    } catch (error) {
      console.error('Error fetching deadlines:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysRemaining = (deadlineDate) => {
    if (!deadlineDate) return null;
    const now = new Date();
    const deadline = new Date(deadlineDate);
    const diff = deadline - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const getDeadlineStyle = (days) => {
    if (days === null) return { badge: 'bg-[#64748b]', text: 'text-white', label: 'NO DATE', icon: Clock, iconColor: 'text-[#64748b]' };
    if (days < 0) {
      return { badge: 'bg-[#ef4444]', text: 'text-white', label: 'OVERDUE', icon: AlertCircle, iconColor: 'text-[#ef4444]' };
    }
    if (days <= 2) {
      return { badge: 'bg-[#f97316]', text: 'text-white', label: 'URGENT', icon: AlertCircle, iconColor: 'text-[#f97316]' };
    }
    if (days <= 7) {
      return { badge: 'bg-[#f59e0b]', text: 'text-white', label: 'DUE SOON', icon: Clock, iconColor: 'text-[#f59e0b]' };
    }
    if (days <= 14) {
      return { badge: 'bg-[#eab308]', text: 'text-white', label: 'COMING UP', icon: Calendar, iconColor: 'text-[#eab308]' };
    }
    return { badge: 'bg-[#06b6d4]', text: 'text-white', label: 'UPCOMING', icon: Calendar, iconColor: 'text-[#06b6d4]' };
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
        <h1 className="text-white mb-2 text-2xl sm:text-3xl">Project Deadlines</h1>
        <p className="text-white/90 text-sm sm:text-base">Track all your project milestones and submission deadlines</p>
      </div>

      {deadlines.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {deadlines.map((deadline) => {
            const days = getDaysRemaining(deadline.deadlineDate);
            const style = getDeadlineStyle(days);
            const Icon = style.icon;

            return (
              <Card key={deadline.deadlineId || deadline.id} hoverable>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 ${style.iconColor.replace('text-', 'bg-')}/10 rounded-lg flex items-center justify-center`}>
                        <Icon className={style.iconColor} size={24} />
                      </div>
                      <div>
                        <h4 className="text-[#0f172a] mb-1">{deadline.documentType || 'Document Submission'}</h4>
                        <p className="text-[#64748b] m-0"><small>{deadline.description || 'No description'}</small></p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full ${style.badge} ${style.text} text-xs font-semibold`}>
                      {style.label}
                    </span>
                  </div>

                  <div className="bg-[#f8fafc] rounded-lg p-4 border-l-4 border-[#06b6d4]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[#64748b] mb-1"><small>Due Date</small></p>
                        <p className="text-[#0f172a] m-0 font-semibold">
                          {deadline.deadlineDate 
                            ? new Date(deadline.deadlineDate).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })
                            : 'No date set'
                          }
                        </p>
                      </div>
                      {days !== null && (
                        <div className="text-right">
                          <p className="text-[#64748b] mb-1"><small>Days Left</small></p>
                          <p className={`text-2xl font-bold m-0 ${style.iconColor}`}>
                            {days < 0 ? Math.abs(days) : days}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {days !== null && days < 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700 m-0 text-sm">
                        ⚠️ This deadline has passed. Please contact your supervisor.
                      </p>
                    </div>
                  )}
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
            <p className="text-[#64748b] m-0">Deadlines will appear here once they are set by the FYP Committee</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default StudentDeadlines;
