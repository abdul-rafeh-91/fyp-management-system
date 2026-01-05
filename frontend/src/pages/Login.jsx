import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, Shield, ArrowRight } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login({ email: formData.email, password: formData.password });

    if (result.success) {
      const user = JSON.parse(sessionStorage.getItem('user'));
      switch (user.role) {
        case 'STUDENT':
          navigate('/student/dashboard');
          break;
        case 'SUPERVISOR':
          navigate('/supervisor/dashboard');
          break;
        case 'EVALUATOR':
          navigate('/evaluator/dashboard');
          break;
        case 'FYP_COMMITTEE':
          navigate('/committee/dashboard');
          break;
        default:
          navigate('/');
      }
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Image/Illustration ..*/}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0f172a] via-[#1e3a5f] to-[#0e7490] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzA2YjZkNCIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>
        
        <div className="absolute top-10 left-10 w-96 h-96 bg-[#06b6d4] opacity-10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#22d3ee] opacity-10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          <div className="max-w-md text-center space-y-8">
            <div className="w-full h-96 bg-gradient-to-br from-[#06b6d4]/20 to-[#22d3ee]/20 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/10 overflow-hidden">
              <div className="text-center p-8">
                <div className="w-32 h-32 mx-auto mb-6 bg-white rounded-full flex items-center justify-center">
                  <span className="text-6xl">🎓</span>
                </div>
                <h2 className="text-4xl font-bold mb-4">Track Sphere</h2>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-white text-3xl m-0">Welcome to Track Sphere</h2>
              <p className="text-white/80 text-lg m-0">
                Pakistan's most trusted Final Year Project Management System
              </p>
              
              <div className="flex items-center justify-center gap-2 pt-4">
                <Shield size={20} className="text-[#22d3ee]" />
                <span className="text-white/70"><small>Trusted by 50+ Pakistani Universities</small></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-[#f8fafc] min-h-screen">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-6 bg-white p-3 rounded-2xl shadow-lg w-20 h-20 sm:w-24 sm:h-24 border border-[#e2e8f0]">
              <span className="text-4xl">🎓</span>
            </div>
            <h1 className="text-[#0f172a] mb-2 text-2xl sm:text-3xl">Sign In</h1>
            <p className="text-[#64748b] m-0 text-sm sm:text-base">Welcome back! Please enter your details.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[#0f172a] mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748b]" size={18} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="ahmed.ali@nu.edu.pk"
                  className="w-full pl-10 pr-4 py-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 transition-all bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#0f172a] mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748b]" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 transition-all bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#64748b] hover:text-[#06b6d4]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-[#06b6d4] border-[#e2e8f0] rounded focus:ring-2 focus:ring-[#06b6d4]/20"
                />
                <small className="text-[#64748b]">Remember me</small>
              </label>
              <Link to="/forgot-password" className="text-[#06b6d4] hover:text-[#0891b2]">
                <small>Forgot Password?</small>
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#06b6d4] to-[#22d3ee] text-white py-3 rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In'}
              {!loading && <ArrowRight size={18} />}
            </button>

            <div className="text-center pt-4 border-t border-[#e2e8f0]">
              <p className="text-[#64748b] m-0">
                <small>New to Track Sphere? </small>
                <Link to="/register" className="text-[#06b6d4] hover:text-[#0891b2]">
                  <small>Create an Account</small>
                </Link>
              </p>
            </div>
          </form>

          <div className="text-center mt-8">
            <p className="text-[#94a3b8] m-0">
              <small>&copy; 2025 Track Sphere. Made with 💚 in Pakistan</small>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
