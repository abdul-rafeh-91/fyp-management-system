import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Upload,
  MessageSquare,
  Calendar,
  Users,
  UserPlus,
  Star,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Clock,
  FileText,
  GraduationCap,
  Bell
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const getMenuItems = () => {
    switch (user?.role) {
      case 'STUDENT':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/student/dashboard' },
          { id: 'documents', label: 'Documents', icon: Upload, path: '/student/documents' },
          { id: 'feedback', label: 'Feedback', icon: MessageSquare, path: '/student/feedback' },
          { id: 'grades', label: 'DMC/Grades', icon: GraduationCap, path: '/student/grades' },
          { id: 'notifications', label: 'Notifications', icon: Bell, path: '/student/notifications' },
          { id: 'settings', label: 'Settings', icon: Settings, path: '/student/settings' },
        ];
      case 'SUPERVISOR':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/supervisor/dashboard' },
          { id: 'students', label: 'My Students', icon: Users, path: '/supervisor/students' },
          { id: 'reviews', label: 'Reviews', icon: Star, path: '/supervisor/review' },
          { id: 'notifications', label: 'Notifications', icon: MessageSquare, path: '/supervisor/notifications' },
          { id: 'settings', label: 'Settings', icon: Settings, path: '/supervisor/settings' },
        ];
      case 'EVALUATOR':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/evaluator/dashboard' },
          { id: 'evaluations', label: 'Evaluations', icon: Star, path: '/evaluator/evaluations' },
          { id: 'notifications', label: 'Notifications', icon: MessageSquare, path: '/evaluator/notifications' },
          { id: 'settings', label: 'Settings', icon: Settings, path: '/evaluator/settings' },
        ];
      case 'FYP_COMMITTEE':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/committee/dashboard' },
          { id: 'groups', label: 'Manage Groups', icon: Users, path: '/committee/groups' },
          { id: 'users', label: 'Manage Users', icon: UserPlus, path: '/committee/users' },
          { id: 'projects', label: 'All Projects', icon: FileText, path: '/committee/projects' },
          { id: 'deadlines', label: 'Deadlines', icon: Calendar, path: '/committee/deadlines' },
          { id: 'grades', label: 'Grade Release', icon: GraduationCap, path: '/committee/grades' },
          { id: 'notifications', label: 'Notifications', icon: MessageSquare, path: '/committee/notifications' },
          { id: 'settings', label: 'Settings', icon: Settings, path: '/committee/settings' },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();
  const roleLabel = user?.role?.replace('_', ' ').toLowerCase() || 'user';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white rounded-lg shadow-lg border border-[#e2e8f0] hover:bg-[#f8fafc] transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X size={24} className="text-[#0f172a]" /> : <Menu size={24} className="text-[#0f172a]" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-gradient-to-b from-[#0f172a] to-[#1e3a5f] border-r border-[#2d4a6b] transition-all duration-300 z-40 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 lg:w-64 w-72 shadow-2xl`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-6 border-b border-[#2d4a6b]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#06b6d4] to-[#22d3ee] relative overflow-hidden">
                  <div className="absolute top-2 left-2 w-3 h-3 bg-white/60 rounded-full blur-sm"></div>
                </div>
              </div>
              <div>
                <h2 className="text-white m-0 text-lg font-bold">Track Sphere</h2>
                <p className="text-[#94a3b8] m-0 text-sm">{roleLabel.charAt(0).toUpperCase() + roleLabel.slice(1)} Portal</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-[#2d4a6b]">
            <div className="flex items-center gap-3">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user?.fullName || 'User'}
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#06b6d4]"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-[#06b6d4] to-[#22d3ee] rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">{user?.fullName?.charAt(0) || 'U'}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white m-0 truncate font-medium">{user?.fullName || 'User'}</p>
                <p className="text-[#94a3b8] m-0 text-sm">Online</p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2 list-none pl-0">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        navigate(item.path);
                        setIsMobileOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                        ? 'bg-[#06b6d4] text-white shadow-lg'
                        : 'text-[#94a3b8] hover:bg-[#06b6d4]/20 hover:text-[#06b6d4]'
                        }`}
                      title={item.label}
                    >
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-[#2d4a6b]">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-[#e5e7eb] text-[#0f172a] hover:bg-[#d1d5db] transition-all duration-200 font-medium"
              title="Logout"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
