import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './context/ToastContext';
import { useAuth } from './context/AuthContext';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Layout
import DashboardLayout from './components/DashboardLayout';

// Student Pages
import StudentDashboard from './pages/StudentDashboard';
import StudentDocuments from './pages/StudentDocuments';
import StudentFeedback from './pages/StudentFeedback';
import StudentDeadlines from './pages/StudentDeadlines';
import StudentGrades from './pages/StudentGrades';

// Supervisor Pages
import SupervisorDashboard from './pages/SupervisorDashboard';
import SupervisorStudents from './pages/SupervisorStudents';
import SupervisorReview from './pages/SupervisorReview';

// Evaluator Pages
import EvaluatorDashboard from './pages/EvaluatorDashboard';
import EvaluatorForm from './pages/EvaluatorForm';

// Committee Pages
import CommitteeDashboard from './pages/CommitteeDashboard';
import CommitteeProjects from './pages/CommitteeProjects';
import CommitteeGroups from './pages/CommitteeGroups';
import CommitteeUsers from './pages/CommitteeUsers';
import CommitteeDeadlines from './pages/CommitteeDeadlines';
import CommitteeGrades from './pages/CommitteeGrades';


// Common Pages
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';

import './styles/theme.css';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role.toLowerCase().replace('_', '')}/dashboard`} replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

// Public Route Component (redirects if logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (user) {
    // Redirect based on role
    switch (user.role) {
      case 'STUDENT':
        return <Navigate to="/student/dashboard" replace />;
      case 'SUPERVISOR':
        return <Navigate to="/supervisor/dashboard" replace />;
      case 'EVALUATOR':
        return <Navigate to="/evaluator/dashboard" replace />;
      case 'FYP_COMMITTEE':
        return <Navigate to="/committee/dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return children;
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <NotificationProvider>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

                {/* Student Routes */}
                <Route path="/student/dashboard" element={
                  <ProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/student/documents" element={
                  <ProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentDocuments />
                  </ProtectedRoute>
                } />
                <Route path="/student/feedback" element={
                  <ProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentFeedback />
                  </ProtectedRoute>
                } />
                <Route path="/student/deadlines" element={
                  <ProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentDeadlines />
                  </ProtectedRoute>
                } />
                <Route path="/student/grades" element={
                  <ProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentGrades />
                  </ProtectedRoute>
                } />
                <Route path="/student/notifications" element={
                  <ProtectedRoute allowedRoles={['STUDENT']}>
                    <Notifications />
                  </ProtectedRoute>
                } />
                <Route path="/student/settings" element={
                  <ProtectedRoute allowedRoles={['STUDENT']}>
                    <Settings />
                  </ProtectedRoute>
                } />

                {/* Supervisor Routes */}
                <Route path="/supervisor/dashboard" element={
                  <ProtectedRoute allowedRoles={['SUPERVISOR']}>
                    <SupervisorDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/supervisor/students" element={
                  <ProtectedRoute allowedRoles={['SUPERVISOR']}>
                    <SupervisorStudents />
                  </ProtectedRoute>
                } />
                <Route path="/supervisor/review" element={
                  <ProtectedRoute allowedRoles={['SUPERVISOR']}>
                    <SupervisorReview />
                  </ProtectedRoute>
                } />
                <Route path="/supervisor/notifications" element={
                  <ProtectedRoute allowedRoles={['SUPERVISOR']}>
                    <Notifications />
                  </ProtectedRoute>
                } />
                <Route path="/supervisor/settings" element={
                  <ProtectedRoute allowedRoles={['SUPERVISOR']}>
                    <Settings />
                  </ProtectedRoute>
                } />

                {/* Evaluator Routes */}
                <Route path="/evaluator/dashboard" element={
                  <ProtectedRoute allowedRoles={['EVALUATOR']}>
                    <EvaluatorDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/evaluator/evaluations" element={
                  <ProtectedRoute allowedRoles={['EVALUATOR']}>
                    <EvaluatorForm />
                  </ProtectedRoute>
                } />
                <Route path="/evaluator/notifications" element={
                  <ProtectedRoute allowedRoles={['EVALUATOR']}>
                    <Notifications />
                  </ProtectedRoute>
                } />
                <Route path="/evaluator/settings" element={
                  <ProtectedRoute allowedRoles={['EVALUATOR']}>
                    <Settings />
                  </ProtectedRoute>
                } />

                {/* Committee Routes */}
                <Route path="/committee/dashboard" element={
                  <ProtectedRoute allowedRoles={['FYP_COMMITTEE']}>
                    <CommitteeDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/committee/projects" element={
                  <ProtectedRoute allowedRoles={['FYP_COMMITTEE']}>
                    <CommitteeProjects />
                  </ProtectedRoute>
                } />
                <Route path="/committee/groups" element={
                  <ProtectedRoute allowedRoles={['FYP_COMMITTEE']}>
                    <CommitteeGroups />
                  </ProtectedRoute>
                } />
                <Route path="/committee/users" element={
                  <ProtectedRoute allowedRoles={['FYP_COMMITTEE']}>
                    <CommitteeUsers />
                  </ProtectedRoute>
                } />
                <Route path="/committee/deadlines" element={
                  <ProtectedRoute allowedRoles={['FYP_COMMITTEE']}>
                    <CommitteeDeadlines />
                  </ProtectedRoute>
                } />
                <Route path="/committee/grades" element={
                  <ProtectedRoute allowedRoles={['FYP_COMMITTEE']}>
                    <CommitteeGrades />
                  </ProtectedRoute>
                } />

                <Route path="/committee/notifications" element={
                  <ProtectedRoute allowedRoles={['FYP_COMMITTEE']}>
                    <Notifications />
                  </ProtectedRoute>
                } />
                <Route path="/committee/settings" element={
                  <ProtectedRoute allowedRoles={['FYP_COMMITTEE']}>
                    <Settings />
                  </ProtectedRoute>
                } />

                {/* Redirect root to login */}
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* Catch all - redirect to login */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </NotificationProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
