import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, User, Mail, Lock, Phone, Building2, Hash, Shield, ArrowRight } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    registrationNumber: '',
    university: '',
    department: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT',
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const roles = [
    { value: 'STUDENT', label: 'Student', icon: '🎓' },
    { value: 'SUPERVISOR', label: 'Supervisor', icon: '👨‍🏫' },
    { value: 'EVALUATOR', label: 'Evaluator', icon: '📋' },
    { value: 'FYP_COMMITTEE', label: 'Committee', icon: '⚡' },
  ];

  const pakistaniUniversities = [
    'FAST-NUCES', 'NUST', 'LUMS', 'UET Lahore', 'UET Taxila', 'GIKI', 'COMSATS',
    'NED University', 'Bahria University', 'Air University', 'PIEAS', 'IBA Karachi',
    'University of Karachi', 'Punjab University', 'Other'
  ];

  const calculatePasswordStrength = (password) => {
    if (password.length === 0) return '';
    if (password.length < 6) return 'weak';
    if (password.length < 10 && /[a-z]/.test(password) && /[0-9]/.test(password)) return 'medium';
    if (password.length >= 10 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password)) return 'strong';
    return 'medium';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const handleRoleSelect = (roleValue) => {
    setFormData({
      ...formData,
      role: roleValue,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!acceptedTerms) {
      setError('Please accept the Terms of Service and Privacy Policy');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    const dataToSend = { ...formData };
    delete dataToSend.confirmPassword;
    if (formData.role !== 'STUDENT') {
      delete dataToSend.registrationNumber;
    }

    const result = await register(dataToSend);

    if (result.success) {
      alert('Registration successful! Please login.');
      navigate('/login');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Image/Illustration .*/}
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
              <h2 className="text-white text-3xl m-0">Join Track Sphere</h2>
              <p className="text-white/80 text-lg m-0">
                Streamline your Final Year Project journey with Pakistan's #1 FYP Management System
              </p>
              
              <div className="flex items-center justify-center gap-2 pt-4">
                <Shield size={20} className="text-[#22d3ee]" />
                <span className="text-white/70"><small>Secure, Fast & Reliable</small></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-[#f8fafc] min-h-screen overflow-y-auto">
        <div className="w-full max-w-md py-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center mb-4 bg-white p-3 rounded-2xl shadow-lg w-16 h-16 sm:w-20 sm:h-20 border border-[#e2e8f0]">
              <span className="text-3xl">🎓</span>
            </div>
            <h1 className="text-[#0f172a] mb-2 text-xl sm:text-2xl">Create an Account</h1>
            <p className="text-[#64748b] m-0 text-xs sm:text-sm"><small>Join Track Sphere in 60 seconds</small></p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div>
              <label className="block text-[#0f172a] mb-2"><small>Select Your Role</small></label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map(role => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => handleRoleSelect(role.value)}
                    className={`p-2 rounded-lg border-2 transition-all duration-200 ${
                      formData.role === role.value
                        ? 'border-[#06b6d4] bg-[#06b6d4]/5'
                        : 'border-[#e2e8f0] bg-white'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-lg">{role.icon}</span>
                      <small className={formData.role === role.value ? 'text-[#06b6d4]' : 'text-[#64748b]'}>
                        {role.label}
                      </small>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-[#0f172a] mb-1"><small>Full Name</small></label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748b]" size={16} />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  placeholder="Ahmed Ali Khan"
                  className="w-full pl-9 pr-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 bg-white text-sm"
                />
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#0f172a] mb-1"><small>Email</small></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748b]" size={16} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="ahmed@nu.edu.pk"
                    className="w-full pl-9 pr-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 bg-white text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[#0f172a] mb-1"><small>Phone</small></label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748b]" size={16} />
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                    placeholder="03001234567"
                    className="w-full pl-9 pr-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 bg-white text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Roll Number & University */}
            <div className="grid grid-cols-2 gap-3">
              {formData.role === 'STUDENT' && (
                <div>
                  <label className="block text-[#0f172a] mb-1"><small>Roll Number</small></label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748b]" size={16} />
                    <input
                      type="text"
                      name="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={handleChange}
                      required={formData.role === 'STUDENT'}
                      placeholder="20K-1234"
                      className="w-full pl-9 pr-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 bg-white text-sm"
                    />
                  </div>
                </div>
              )}
              <div className={formData.role === 'STUDENT' ? '' : 'col-span-2'}>
                <label className="block text-[#0f172a] mb-1"><small>University</small></label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748b]" size={16} />
                  <select
                    name="university"
                    value={formData.university}
                    onChange={handleChange}
                    required
                    className="w-full pl-9 pr-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 bg-white text-sm"
                  >
                    <option value="">Select</option>
                    {pakistaniUniversities.map(uni => (
                      <option key={uni} value={uni}>{uni}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-[#0f172a] mb-1"><small>Department</small></label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748b]" size={16} />
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  placeholder="Computer Science"
                  className="w-full pl-9 pr-3 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 bg-white text-sm"
                />
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#0f172a] mb-1"><small>Password</small></label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748b]" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Create password"
                    className="w-full pl-9 pr-10 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 bg-white text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#64748b] hover:text-[#06b6d4]"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordStrength && (
                  <div className={`mt-1 h-1 rounded-full ${
                    passwordStrength === 'weak' ? 'bg-red-500' :
                    passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} style={{ width: passwordStrength === 'weak' ? '33%' : passwordStrength === 'medium' ? '66%' : '100%' }}></div>
                )}
              </div>
              <div>
                <label className="block text-[#0f172a] mb-1"><small>Confirm Password</small></label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748b]" size={16} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Confirm password"
                    className="w-full pl-9 pr-10 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 bg-white text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#64748b] hover:text-[#06b6d4]"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="w-4 h-4 text-[#06b6d4] border-[#e2e8f0] rounded focus:ring-2 focus:ring-[#06b6d4]/20"
                />
                <small className="text-[#64748b]">I agree to the Terms of Service and Privacy Policy</small>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#06b6d4] to-[#22d3ee] text-white py-3 rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="text-center pt-4 border-t border-[#e2e8f0]">
              <p className="text-[#64748b] m-0">
                <small>Already have an account? </small>
                <Link to="/login" className="text-[#06b6d4] hover:text-[#0891b2]">
                  <small>Sign In</small>
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

export default Register;
