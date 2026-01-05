import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import '../styles/Notifications.css';

const Notifications = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' or 'unread'..

  useEffect(() => {
    if (user && user.userId) {
      fetchNotifications();
    } else {
      setLoading(false);
    }
  }, [filter, user]);

  const fetchNotifications = async () => {
    if (!user || !user.userId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const endpoint = filter === 'unread'
        ? `/notifications/user/${user.userId}/unread`
        : `/notifications/user/${user.userId}`;
      
      const response = await api.get(endpoint);
      setNotifications(Array.isArray(response.data) ? response.data : []);
      setError('');
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setError('Failed to load notifications. Please try again.');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    if (!notificationId) {
      setError('Invalid notification ID');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      setError('');
      // Optimistically update UI
      setNotifications(prev => 
        prev.map(n => (n.id || n.notificationId) === notificationId ? { ...n, isRead: true } : n)
      );
      
      await api.patch(`/notifications/${notificationId}/mark-read`);
      
      // Refresh to ensure consistency
      await fetchNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
      setError(error.response?.data?.error || 'Failed to mark as read. Please try again.');
      setTimeout(() => setError(''), 5000);
      // Revert optimistic update on error
      fetchNotifications();
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Optimistically update UI
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      
      await api.patch(`/notifications/user/${user.userId}/mark-all-read`);
      
      // Refresh to ensure consistency
      await fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      setError(error.response?.data?.error || 'Failed to mark all as read. Please try again.');
      // Revert optimistic update on error
      fetchNotifications();
    }
  };

  const handleDelete = async (notificationId) => {
    if (!notificationId) {
      setError('Invalid notification ID');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (window.confirm('Are you sure you want to delete this notification?')) {
      try {
        setError('');
        
        // Optimistically remove from UI
        setNotifications(prev => prev.filter(n => (n.id || n.notificationId) !== notificationId));
        
        // Delete from backend
        await api.delete(`/notifications/${notificationId}`);
        
        // Show success toast
        showToast('Notification deleted successfully');
        
        // Refresh to ensure consistency
        await fetchNotifications();
      } catch (error) {
        console.error('Failed to delete notification:', error);
        console.error('Notification ID:', notificationId);
        const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to delete notification. Please try again.';
        setError(errorMessage);
        setTimeout(() => setError(''), 5000);
        // Revert optimistic update on error
        fetchNotifications();
      }
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      DOCUMENT_SUBMITTED: '📄',
      REVIEW_RECEIVED: '📝',
      GRADE_RECEIVED: '🎓',
      GRADE_ASSIGNED: '📊',
      DEADLINE_REMINDER: '⏰',
      DEADLINE_ADDED: '📅',
      DEADLINE_APPROACHING: '⏳',
      REVISION_REQUESTED: '🔄',
      DOCUMENT_APPROVED: '✅',
      GRADE_RELEASED: '📊',
      SYSTEM_ANNOUNCEMENT: '📢',
    };
    return icons[type] || '📌';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#06b6d4] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#64748b]">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#06b6d4] to-[#22d3ee] text-white rounded-xl shadow-lg p-4 sm:p-5">
        <h1 className="text-white mb-1 text-xl sm:text-2xl font-semibold">Notifications</h1>
        <p className="text-white/90 text-xs sm:text-sm">Stay updated with your project activities</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <span>❌</span>
          {error}
        </div>
      )}

      {/* Filter and Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-[#e2e8f0] p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-[#06b6d4] to-[#22d3ee] text-white shadow-sm'
                  : 'text-[#64748b] hover:bg-[#f8fafc] border border-[#e2e8f0]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                filter === 'unread'
                  ? 'bg-gradient-to-r from-[#06b6d4] to-[#22d3ee] text-white shadow-sm'
                  : 'text-[#64748b] hover:bg-[#f8fafc] border border-[#e2e8f0]'
              }`}
            >
              Unread
            </button>
          </div>
          {Array.isArray(notifications) && notifications.filter(n => !n.isRead).length > 0 && (
            <button 
              onClick={handleMarkAllAsRead} 
              className="px-4 py-2 bg-[#06b6d4] hover:bg-[#0891b2] text-white rounded-lg transition-all text-sm font-medium"
            >
              Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-[#e2e8f0] p-12 text-center">
            <p className="text-[#64748b] text-lg">No notifications to display</p>
            <p className="text-[#94a3b8] text-sm mt-2">You're all caught up!</p>
          </div>
        ) : (
          notifications.map(notification => (
            <div
              key={notification.id || notification.notificationId}
              className={`bg-white rounded-xl shadow-sm border ${
                !notification.isRead 
                  ? 'border-l-4 border-l-[#06b6d4] bg-[#f0fdfa]' 
                  : 'border-[#e2e8f0]'
              } p-4 hover:shadow-md transition-all`}
            >
              <div className="flex gap-4">
                <div className="flex-shrink-0 text-3xl">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[#0f172a] font-semibold mb-1 text-base">{notification.title}</h3>
                  <p className="text-[#64748b] mb-2 text-sm">{notification.message}</p>
                  <span className="text-[#94a3b8] text-xs">
                    {new Date(notification.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex-shrink-0 flex flex-col gap-2">
                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id || notification.notificationId)}
                      className="w-8 h-8 flex items-center justify-center bg-[#f8fafc] hover:bg-[#06b6d4] hover:text-white text-[#64748b] rounded-lg transition-all border border-[#e2e8f0]"
                      title="Mark as read"
                    >
                      ✓
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notification.id || notification.notificationId)}
                    className="w-8 h-8 flex items-center justify-center bg-[#fee] hover:bg-[#fdd] text-[#ef4444] rounded-lg transition-all border border-[#fcc]"
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;

