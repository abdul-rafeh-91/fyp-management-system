import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import { User, Mail, Phone, Lock, Shield, Save, Camera, Trash2 } from 'lucide-react';
import Card from '../components/Card';
import '../styles/theme.css';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [userData, setUserData] = useState({
    fullName: '',
    email: '',
    role: '',
    registrationNumber: '',
    department: '',
    phoneNumber: '',
    university: '',
    avatarUrl: '',
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user?.userId) return;

    try {
      const response = await api.get(`/users/${user.userId}`);

      // Handle response - check if it's an object or needs parsing
      let userInfo = response.data;

      // If response.data is a string (circular reference issue), try to parse it
      if (typeof userInfo === 'string') {
        try {
          userInfo = JSON.parse(userInfo);
        } catch (e) {
          console.error('Failed to parse response:', e);
          // If parsing fails, try to extract from string using regex
          const deptMatch = userInfo.match(/"department":"([^"]*)"/);
          const phoneMatch = userInfo.match(/"phoneNumber":"([^"]*)"/);
          userInfo = {
            department: deptMatch ? deptMatch[1] : '',
            phoneNumber: phoneMatch ? phoneMatch[1] : '',
            fullName: user.fullName || '',
            email: user.email || '',
            role: user.role || '',
            registrationNumber: user.registrationNumber || '',
            university: user.university || '',
            avatarUrl: user.avatarUrl || '',
          };
        }
      }

      // Extract department and phoneNumber directly from the object
      const department = userInfo?.department || '';
      const phoneNumber = userInfo?.phoneNumber || '';

      setUserData({
        fullName: userInfo.fullName || user.fullName || '',
        email: userInfo.email || user.email || '',
        role: userInfo.role || user.role || '',
        registrationNumber: userInfo.registrationNumber || user.registrationNumber || 'N/A',
        department: department,
        phoneNumber: phoneNumber,
        university: userInfo.university || user?.university || '',
        avatarUrl: userInfo.avatarUrl || user.avatarUrl || '',
      });

      // Update user context with complete data
      updateUser({
        department: department,
        phoneNumber: phoneNumber,
        university: userInfo.university || '',
        avatarUrl: userInfo.avatarUrl || '',
        registrationNumber: userInfo.registrationNumber || '',
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Fallback to user data from context
      setUserData({
        fullName: user.fullName || '',
        email: user.email || '',
        role: user.role || '',
        registrationNumber: user.registrationNumber || 'N/A',
        department: user.department || '',
        phoneNumber: user.phoneNumber || '',
        university: user.university || '',
        avatarUrl: user.avatarUrl || '',
      });
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (500KB max to keep base64 reasonable)
    if (file.size > 500 * 1024) {
      setError('File size must be less than 500KB for better performance');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;

      // Base64 string is typically ~33% larger than original file
      // For 500KB file, base64 would be ~667KB (667,000 chars)
      // We'll allow up to 1MB base64 string (1,000,000 chars) to be safe
      if (base64String.length > 1000000) {
        setError('Image is too large. Please use a smaller image (max 500KB)');
        return;
      }

      try {
        setLoading(true);
        setError('');

        const response = await api.patch(`/users/${user.userId}/avatar`, {
          avatarUrl: base64String
        });

        // Update user context immediately with new avatar
        updateUser({ avatarUrl: base64String });

        // Fetch updated user data to get all fields
        await fetchUserData();

        // Show success toast
        showToast('Avatar updated successfully!');
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to update avatar');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');

    // Check if new password is same as old password
    if (passwordData.newPassword === passwordData.oldPassword) {
      setError('New password must be different from the old password');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      setLoading(true);
      await api.patch(`/users/${user.userId}/password`, {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });

      // Show success toast
      showToast('Password changed successfully!');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#06b6d4] to-[#22d3ee] text-white rounded-xl shadow-lg p-4 sm:p-5">
        <h1 className="text-white mb-1 text-xl sm:text-2xl font-semibold">Settings</h1>
        <p className="text-white/90 text-xs sm:text-sm">Manage your account settings and preferences</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <span>❌</span>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-[#e2e8f0] p-2">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 rounded-lg transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'profile'
              ? 'bg-gradient-to-r from-[#06b6d4] to-[#22d3ee] text-white shadow-sm'
              : 'text-[#64748b] hover:bg-[#f8fafc]'
              }`}
          >
            <User size={18} />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-6 py-3 rounded-lg transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'security'
              ? 'bg-gradient-to-r from-[#06b6d4] to-[#22d3ee] text-white shadow-sm'
              : 'text-[#64748b] hover:bg-[#f8fafc]'
              }`}
          >
            <Shield size={18} />
            Security
          </button>
        </div>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <h3 className="text-[#0f172a] mb-4">Profile Picture</h3>
              <div className="flex flex-col items-center">
                {userData.avatarUrl ? (
                  <div className="relative group">
                    <img
                      src={userData.avatarUrl}
                      alt={userData.fullName}
                      className="w-32 h-32 rounded-full object-cover mb-4 border-4 border-[#06b6d4]"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 bg-gradient-to-br from-[#06b6d4] to-[#22d3ee] rounded-full flex items-center justify-center mb-4">
                    <span className="text-white text-4xl font-semibold">{userData.fullName.charAt(0) || 'U'}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#06b6d4] border-2 border-[#06b6d4] rounded-lg hover:bg-[#06b6d4] hover:text-white transition-all duration-200 text-sm">
                      <Camera size={16} />
                      {userData.avatarUrl ? 'Change Photo' : 'Add Photo'}
                    </span>
                  </label>

                  {userData.avatarUrl && (
                    <button
                      onClick={async () => {
                        if (!window.confirm('Are you sure you want to remove your profile photo?')) return;
                        try {
                          setLoading(true);
                          await api.delete(`/users/${user.userId}/avatar`);
                          updateUser({ avatarUrl: null });
                          await fetchUserData();
                          showToast('Profile photo removed successfully');
                        } catch (err) {
                          showToast(err.response?.data?.error || 'Failed to remove photo', 'error');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="px-4 py-2 bg-red-50 text-red-600 border-2 border-red-200 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-200 text-sm flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  )}
                </div>

                <p className="text-[#64748b] text-center mt-3 m-0">
                  <small>JPG, PNG or GIF. Max size 500KB</small>
                </p>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <h3 className="text-[#0f172a] mb-4">Personal Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#0f172a] mb-2">Full Name</label>
                    <input
                      type="text"
                      value={userData.fullName}
                      disabled
                      className="w-full p-3 border border-[#e2e8f0] rounded-lg bg-[#f8fafc] text-[#64748b] cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[#0f172a] mb-2">Email</label>
                    <input
                      type="email"
                      value={userData.email}
                      disabled
                      className="w-full p-3 border border-[#e2e8f0] rounded-lg bg-[#f8fafc] text-[#64748b] cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[#0f172a] mb-2">Role</label>
                    <input
                      type="text"
                      value={userData.role?.replace('_', ' ') || ''}
                      disabled
                      className="w-full p-3 border border-[#e2e8f0] rounded-lg bg-[#f8fafc] text-[#64748b] cursor-not-allowed"
                    />
                  </div>
                  {userData.registrationNumber && userData.registrationNumber !== 'N/A' && (
                    <div>
                      <label className="block text-[#0f172a] mb-2">Registration Number</label>
                      <input
                        type="text"
                        value={userData.registrationNumber}
                        disabled
                        className="w-full p-3 border border-[#e2e8f0] rounded-lg bg-[#f8fafc] text-[#64748b] cursor-not-allowed"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-[#0f172a] mb-2">Department</label>
                    <input
                      type="text"
                      value={userData.department && userData.department.trim() !== '' ? userData.department : 'N/A'}
                      disabled
                      placeholder="Not set"
                      className="w-full p-3 border border-[#e2e8f0] rounded-lg bg-[#f8fafc] text-[#64748b] cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[#0f172a] mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={userData.phoneNumber && userData.phoneNumber.trim() !== '' ? userData.phoneNumber : 'N/A'}
                      disabled
                      placeholder="Not set"
                      className="w-full p-3 border border-[#e2e8f0] rounded-lg bg-[#f8fafc] text-[#64748b] cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <Card>
          <h3 className="text-[#0f172a] mb-4">Change Password</h3>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-[#0f172a] mb-2">Current Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748b]" size={18} />
                <input
                  type="password"
                  value={passwordData.oldPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                  required
                  placeholder="Enter current password"
                  className="w-full pl-10 pr-4 py-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 bg-white text-[#0f172a] placeholder:text-[#64748b]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#0f172a] mb-2">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748b]" size={18} />
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  placeholder="Enter new password"
                  className="w-full pl-10 pr-4 py-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 bg-white text-[#0f172a] placeholder:text-[#64748b]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#0f172a] mb-2">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748b]" size={18} />
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                  placeholder="Confirm new password"
                  className="w-full pl-10 pr-4 py-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 bg-white text-[#0f172a] placeholder:text-[#64748b]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#06b6d4] to-[#22d3ee] text-white py-3 rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Update Password
                </>
              )}
            </button>
          </form>
        </Card>
      )}
    </div>
  );
};

export default Settings;
