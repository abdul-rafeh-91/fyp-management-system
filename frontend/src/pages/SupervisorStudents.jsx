import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Users, FileText, CheckCircle, Clock, AlertCircle, Search, Eye } from 'lucide-react';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';

const SupervisorStudents = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDocuments, setStudentDocuments] = useState([]);

  useEffect(() => {
    if (user) {
      fetchStudents();
    }
  }, [user]);

  const fetchStudents = async () => {
    try {
      setLoading(true);

      // 1. Fetch ALL assigned students.
      const studentsResponse = await api.get(`/users/supervisor/${user.userId}/students`);
      const assignedStudents = Array.isArray(studentsResponse.data) ? studentsResponse.data : [];

      // 2. Fetch ALL documents for this supervisor
      const docsResponse = await api.get(`/documents/supervisor/${user.userId}`);
      const allDocs = Array.isArray(docsResponse.data) ? docsResponse.data : [];

      // 3. Map documents to students
      const studentMap = new Map();

      // Initialize map with all assigned students
      assignedStudents.forEach(student => {
        studentMap.set(student.id, {
          id: student.id,
          fullName: student.fullName,
          email: student.email,
          registrationNumber: student.registrationNumber,
          documents: [],
          approvedCount: 0,
          pendingCount: 0,
          revisionCount: 0,
        });
      });

      // Distribute documents to students
      allDocs.forEach(doc => {
        const studentId = doc.studentId || doc.student?.id;
        if (studentMap.has(studentId)) {
          const student = studentMap.get(studentId);
          student.documents.push({
            ...doc,
            id: doc.id || doc.documentId,
          });

          // Count statuses
          if (doc.status?.includes('APPROVED') || doc.status === 'FINAL_APPROVED') {
            student.approvedCount++;
          } else if (doc.status === 'SUBMITTED' || doc.status?.includes('REVIEW')) {
            student.pendingCount++;
          } else if (doc.status?.includes('REVISION')) {
            student.revisionCount++;
          }
        }
      });

      setStudents(Array.from(studentMap.values()));
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentDocuments = async (studentId) => {
    try {
      const response = await api.get(`/documents/student/${studentId}`);
      setStudentDocuments(response.data || []);
    } catch (error) {
      console.error('Error fetching student documents:', error);
    }
  };

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    fetchStudentDocuments(student.id);
  };

  const getFilteredStudents = () => {
    if (!searchTerm) return students;
    return students.filter(student =>
      student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#06b6d4] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#64748b]">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#06b6d4] to-[#22d3ee] text-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-white mb-2 text-2xl sm:text-3xl">My Students</h1>
            <p className="text-white/90 text-sm sm:text-base">View and manage your supervised students</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
            <span className="text-white"><small>Total Students: {students.length}</small></span>
          </div>
        </div>
      </div>

      {/* Search */}
      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748b]" size={18} />
          <input
            type="text"
            placeholder="Search by name, registration number, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 bg-white"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Students List */}
        <div className="lg:col-span-1">
          <Card>
            <h3 className="text-[#0f172a] mb-4">Students ({getFilteredStudents().length})</h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {getFilteredStudents().length > 0 ? (
                getFilteredStudents().map(student => (
                  <button
                    key={student.id}
                    onClick={() => handleStudentClick(student)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${selectedStudent?.id === student.id
                      ? 'border-[#06b6d4] bg-[#06b6d4]/5'
                      : 'border-[#e2e8f0] hover:border-[#cbd5e1] hover:bg-[#f8fafc]'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#06b6d4] to-[#22d3ee] rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">{student.fullName.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#0f172a] m-0 truncate">{student.fullName}</p>
                        <p className="text-[#64748b] m-0 text-xs">{student.registrationNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {student.approvedCount > 0 && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                          ✓ {student.approvedCount}
                        </span>
                      )}
                      {student.pendingCount > 0 && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                          ⏳ {student.pendingCount}
                        </span>
                      )}
                      {student.revisionCount > 0 && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                          ↻ {student.revisionCount}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-[#64748b] text-center py-4"><small>No students found</small></p>
              )}
            </div>
          </Card>
        </div>

        {/* Student Details */}
        <div className="lg:col-span-2">
          {selectedStudent ? (
            <Card>
              <div className="space-y-6">
                <div>
                  <h2 className="text-[#0f172a] mb-1">{selectedStudent.fullName}</h2>
                  <p className="text-[#64748b] m-0 text-sm">{selectedStudent.email}</p>
                  <p className="text-[#64748b] m-0 text-sm">Reg: {selectedStudent.registrationNumber}</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="text-green-600" size={20} />
                      <span className="text-green-700 font-semibold">Approved</span>
                    </div>
                    <p className="text-green-900 text-2xl font-bold m-0">{selectedStudent.approvedCount}</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="text-yellow-600" size={20} />
                      <span className="text-yellow-700 font-semibold">Pending</span>
                    </div>
                    <p className="text-yellow-900 text-2xl font-bold m-0">{selectedStudent.pendingCount}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="text-red-600" size={20} />
                      <span className="text-red-700 font-semibold">Revision</span>
                    </div>
                    <p className="text-red-900 text-2xl font-bold m-0">{selectedStudent.revisionCount}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-[#0f172a] mb-4">Documents</h3>
                  <div className="space-y-3">
                    {studentDocuments.length > 0 ? (
                      studentDocuments.map(doc => (
                        <div
                          key={doc.id || doc.documentId}
                          className="flex items-center justify-between p-4 border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 bg-[#06b6d4]/10 rounded-lg flex items-center justify-center">
                              <FileText className="text-[#06b6d4]" size={20} />
                            </div>
                            <div>
                              <p className="text-[#0f172a] m-0">{doc.title || doc.type}</p>
                              <small className="text-[#64748b]">
                                {doc.submittedAt
                                  ? `Submitted: ${new Date(doc.submittedAt).toLocaleDateString()}`
                                  : `Created: ${new Date(doc.createdAt).toLocaleDateString()}`
                                }
                              </small>
                            </div>
                          </div>
                          <StatusBadge status={doc.status} />
                        </div>
                      ))
                    ) : (
                      <p className="text-[#64748b] text-center py-4"><small>No documents found</small></p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[#06b6d4]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="text-[#06b6d4]" size={32} />
                </div>
                <h3 className="text-[#0f172a] mb-2">Select a Student</h3>
                <p className="text-[#64748b] m-0">Choose a student from the list to view their details</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupervisorStudents;
