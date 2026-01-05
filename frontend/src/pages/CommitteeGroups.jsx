import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import { Users, Plus, UserPlus, X, Check, Search } from 'lucide-react';
import Card from '../components/Card';

const CommitteeGroups = () => {
    const { user } = useAuth();
    const { showToast } = useToast();

    const [groups, setGroups] = useState([]);
    const [supervisors, setSupervisors] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        supervisorId: '',
        studentIds: []
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [groupsRes, supervisorsRes, studentsRes] = await Promise.all([
                api.get('/groups'),
                api.get('/users/role/SUPERVISOR'),
                api.get('/users/role/STUDENT')
            ]);

            if (!Array.isArray(groupsRes.data)) {
                console.error("Groups data error:", groupsRes.data);
                showToast(`Error loading groups: ${JSON.stringify(groupsRes.data)}`, 'error');
                setGroups([]);
            } else {
                setGroups(groupsRes.data.filter(Boolean));
            }

            setSupervisors(Array.isArray(supervisorsRes.data) ? supervisorsRes.data.filter(Boolean) : []);
            setStudents(Array.isArray(studentsRes.data) ? studentsRes.data.filter(Boolean) : []);
        } catch (error) {
            console.error('Error fetching data:', error);
            showToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);

            if (!formData.name || !formData.supervisorId || formData.studentIds.length === 0) {
                showToast('Please fill all required fields', 'error');
                return;
            }

            await api.post('/groups', formData);

            showToast('Group created successfully!');
            setIsModalOpen(false);
            setFormData({ name: '', supervisorId: '', studentIds: [] });
            fetchData(); // Refresh list
        } catch (error) {
            showToast(error.response?.data?.error || 'Failed to create group', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleStudentSelection = (studentId) => {
        setFormData(prev => {
            const isSelected = prev.studentIds.includes(studentId);
            if (isSelected) {
                return { ...prev, studentIds: prev.studentIds.filter(id => id !== studentId) };
            } else {
                return { ...prev, studentIds: [...prev.studentIds, studentId] };
            }
        });
    };

    // Filter students who are NOT in a group (based on frontend logic or if backend sends it)
    // Currently backend User object has 'projectGroup' but generic list might not populate it deeply.
    // We can assume valid students for selection are those not in 'groups' list members?
    // Or check the 'projectGroup' field on student object if it exists.
    const availableStudents = students.filter(s => !s.projectGroup);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-gradient-to-r from-[#06b6d4] to-[#22d3ee] text-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold mb-2">Project Groups</h1>
                        <p className="text-white/90">Manage student groups and supervisor assignments</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-white text-[#06b6d4] px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-opacity-90 transition-all"
                    >
                        <Plus size={20} />
                        Create Group
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.map(group => (
                        <Card key={group.id} hoverable>
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">{group.name}</h3>
                                        <p className="text-sm text-gray-500">Created: {new Date(group.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <span className="bg-[#06b6d4]/10 text-[#06b6d4] px-2 py-1 rounded text-xs font-semibold">
                                        {group.members?.length || 0} Members
                                    </span>
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Supervisor</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                            {group.supervisor?.fullName?.charAt(0)}
                                        </div>
                                        <span className="text-gray-700 font-medium">{group.supervisor?.fullName}</span>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Members</p>
                                    <div className="flex -space-x-2 overflow-hidden">
                                        {group.members?.map((member, i) => (
                                            <div key={member.id} className="w-8 h-8 rounded-full bg-white border-2 border-white flex items-center justify-center bg-gray-100 text-xs font-medium text-gray-600" title={member.fullName}>
                                                {member.fullName?.charAt(0)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}

                    {groups.length === 0 && (
                        <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                            <Users className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                            <h3 className="text-lg font-medium text-gray-900">No Groups Yet</h3>
                            <p className="text-gray-500">Create a group to get started.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Create Group Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">Create New Group</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#06b6d4] focus:border-[#06b6d4] outline-none"
                                    placeholder="e.g., AI-Project-2025-01"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Supervisor</label>
                                <select
                                    value={formData.supervisorId}
                                    onChange={e => setFormData({ ...formData, supervisorId: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#06b6d4] focus:border-[#06b6d4] outline-none"
                                >
                                    <option value="">Select Supervisor...</option>
                                    {supervisors.map(s => (
                                        <option key={s.id} value={s.id}>{s.fullName} ({s.department || 'N/A'})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Students</label>
                                <div className="border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                                    {students.filter(s => !s.projectGroup).length > 0 ? (
                                        students.filter(s => !s.projectGroup).map(student => (
                                            <div
                                                key={student.id}
                                                onClick={() => toggleStudentSelection(student.id)}
                                                className={`p-3 flex items-center justify-between cursor-pointer border-b last:border-0 hover:bg-gray-50 ${formData.studentIds.includes(student.id) ? 'bg-[#06b6d4]/5' : ''}`}
                                            >
                                                <div>
                                                    <p className="font-medium text-gray-800">{student.fullName}</p>
                                                    <p className="text-xs text-gray-500">{student.registrationNumber}</p>
                                                </div>
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${formData.studentIds.includes(student.id) ? 'bg-[#06b6d4] border-[#06b6d4] text-white' : 'border-gray-300'}`}>
                                                    {formData.studentIds.includes(student.id) && <Check size={12} />}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-gray-500 text-sm">No available students found</div>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Selected: {formData.studentIds.length} students</p>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateGroup}
                                disabled={submitting}
                                className="px-4 py-2 bg-[#06b6d4] text-white font-medium rounded-lg hover:bg-[#0891b2] disabled:opacity-50"
                            >
                                {submitting ? 'Creating...' : 'Create Group'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommitteeGroups;
