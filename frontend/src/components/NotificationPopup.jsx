import { useEffect } from 'react';
import { Bell } from 'lucide-react';
import '../styles/NotificationPopup.css';

const NotificationPopup = ({ notification, onClose }) => {
  useEffect(() => {
    // Auto close after 2 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onClose]);

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

  if (!notification) return null;

  return (
    <div className="notification-popup">
      <div className="notification-popup-content">
        <div className="notification-popup-icon">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="notification-popup-text">
          <div className="notification-popup-title">{notification.title}</div>
          <div className="notification-popup-message">{notification.message}</div>
        </div>
        <button 
          className="notification-popup-close"
          onClick={onClose}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default NotificationPopup;

