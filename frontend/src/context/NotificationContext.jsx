import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../utils/api';
import NotificationPopup from '../components/NotificationPopup';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [currentNotification, setCurrentNotification] = useState(null);
  const [lastNotificationId, setLastNotificationId] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);

  const checkForNewNotifications = useCallback(async () => {
    // Only show popup notifications for students
    if (!user || !user.userId || user.role !== 'STUDENT') return;

    try {
      const response = await api.get(`/notifications/user/${user.userId}/unread`);
      const unreadNotifications = Array.isArray(response.data) ? response.data : [];
      
      if (unreadNotifications.length > 0) {
        // Get the most recent unread notification
        const latestNotification = unreadNotifications.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        )[0];
        
        // Only show popup if it's a new notification (different ID)
        if (latestNotification.id !== lastNotificationId) {
          setCurrentNotification(latestNotification);
          setLastNotificationId(latestNotification.id);
        }
      }
    } catch (error) {
      console.error('Error checking for notifications:', error);
    }
  }, [user, lastNotificationId]);

  useEffect(() => {
    if (!user || !user.userId) {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      return;
    }

    // Initial check
    checkForNewNotifications();

    // Poll every 5 seconds for new notifications
    const interval = setInterval(() => {
      checkForNewNotifications();
    }, 5000);

    setPollingInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [user, checkForNewNotifications]);

  const closeNotification = () => {
    setCurrentNotification(null);
  };

  return (
    <NotificationContext.Provider value={{}}>
      {children}
      {currentNotification && (
        <NotificationPopup
          notification={currentNotification}
          onClose={closeNotification}
        />
      )}
    </NotificationContext.Provider>
  );
};

