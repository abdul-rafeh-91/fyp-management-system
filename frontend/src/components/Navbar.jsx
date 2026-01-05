import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { notificationAPI } from '../services/api';
import '../styles/Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.userId) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount(user.userId);
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    switch (user?.role) {
      case 'STUDENT': return '/student/dashboard';
      case 'SUPERVISOR': return '/supervisor/dashboard';
      case 'EVALUATOR': return '/evaluator/dashboard';
      case 'FYP_COMMITTEE': return '/committee/dashboard';
      default: return '/';
    }
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to={getDashboardLink()} className="navbar-brand">
          FYP Management System
        </Link>
        
        <div className="navbar-menu">
          <Link to={getDashboardLink()} className="navbar-link">
            Dashboard
          </Link>
          
          <Link to="/notifications" className="navbar-link notification-link">
            Notifications
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </Link>
          
          <div className="navbar-user">
            <span className="user-name">{user.fullName}</span>
            <span className="user-role">{user.role}</span>
          </div>
          
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

