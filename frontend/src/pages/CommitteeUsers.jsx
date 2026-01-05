import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import { Users, Plus, Search, Trash2, Mail, Shield } from 'lucide-react';
import Card from '../components/Card';

const CommitteeUsers = () => {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('SUPERVISOR');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Registration Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        role: 'SUPERVISOR',
        department: '',
        registrationNumber: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchUsers(activeTab);
    }, [activeTab]);

    const fetchUsers = async (role) => {
        try {
            setLoading(true);
            const output = await api.get(`/users/role/${role}`);
            setUsers(output.data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            showToast('Failed to load users', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);

            // Register logic (using existing auth endpoint)
            await api.post('/auth/register', {
                ...formData,
                role: formData.role // Ensure role is set correctly
            });

            showToast('User added successfully!');
            setIsModalOpen(false);
            setFormData({
                fullName: '',
                email: '',
                password: '',
                role: activeTab, // default to current tab
                department: '',
                registrationNumber: ''
            });
            fetchUsers(activeTab); // Refresh list
        } catch (error) {
            showToast(error.response?.data?.error || 'Failed to add user', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-gradient-to-r from-[#06b6d4] to-[#22d3ee] text-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold mb-2">User Management</h1>
                        <p className="text-white/90">Manage supervisors and students</p>
                    </div>
                    <button
                        onClick={() => {
                            setFormData(prev => ({ ...prev, role: activeTab }));
                            setIsModalOpen(true);
                        }}
                        className="bg-white text-[#06b6d4] px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-opacity-90 transition-all"
                    >
                        <Plus size={20} />
                        Add {activeTab === 'SUPERVISOR' ? 'Supervisor' : 'Student'}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('SUPERVISOR')}
                    className={`px-6 py-3 font-medium transition-all border-b-2 ${activeTab === 'SUPERVISOR' ? 'border-[#06b6d4] text-[#06b6d4]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Supervisors
                </button>
                <button
                    onClick={() => setActiveTab('STUDENT')}
                    className={`px-6 py-3 font-medium transition-all border-b-2 ${activeTab === 'STUDENT' ? 'border-[#06b6d4] text-[#06b6d4]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Students
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#06b6d4] outline-none"
                />
            </div>

            {/* User List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-12 text-center text-gray-500">Loading...</div>
                ) : filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                        <Card key={user.id} hoverable>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-lg font-bold text-gray-600">
                                    {user.fullName?.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 truncate">{user.fullName}</h3>
                                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                        <Mail size={12} />
                                        <span className="truncate">{user.email}</span>
                                    </div>
                                    {user.registrationNumber && (
                                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                            <Shield size={12} />
                                            <span>{user.registrationNumber}</span>
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-400 mt-2">{user.department || 'No Dept'}</p>
                                </div>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center text-gray-500">No users found</div>
                )}
            </div>

            {/* Add User Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full p-6">
                        <h2 className="text-xl font-bold mb-4">Add New {activeTab}</h2>
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Full Name</label>
                                <input required type="text" className="w-full px-4 py-2 border rounded-lg"
                                    value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <input required type="email" className="w-full px-4 py-2 border rounded-lg"
                                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Password</label>
                                <input required type="password" className="w-full px-4 py-2 border rounded-lg"
                                    value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Department</label>
                                <input type="text" className="w-full px-4 py-2 border rounded-lg"
                                    value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} />
                            </div>
                            {activeTab === 'STUDENT' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Registration Number</label>
                                    <input required type="text" className="w-full px-4 py-2 border rounded-lg"
                                        value={formData.registrationNumber} onChange={e => setFormData({ ...formData, registrationNumber: e.target.value })} />
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" disabled={submitting} className="px-4 py-2 bg-[#06b6d4] text-white rounded-lg hover:bg-[#0891b2] disabled:opacity-50">
                                    {submitting ? 'Adding...' : 'Add User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommitteeUsers;
