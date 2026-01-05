import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Users, FileText, CheckCircle, Clock, AlertCircle, Search, User } from 'lucide-react';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';

const CommitteeProjects = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (user) {
      fetchGroupsAndDocs();
    }
  }, [user]);

  const fetchGroupsAndDocs = async () => {
    try {
      setLoading(true);
      // 1. Fetch all groups
      const groupsResponse = await api.get('/groups');
      const groupsList = groupsResponse.data || [];

      // 2. Fetch all submitted documents
      // Note: 'submitted' endpoint filters by role, so ensure Committee can access it.
      // DocumentController: @PreAuthorize("hasAnyRole('SUPERVISOR', 'FYP_COMMITTEE', 'EVALUATOR')")
      const docsResponse = await api.get('/documents/submitted');
      const allDocuments = docsResponse.data || [];

      // 3. Map documents to groups
      const groupsWithDocs = groupsList.map(group => {
        // Identify group members IDs
        const memberIds = group.members?.map(m => m.id) || [];

        // Find documents belonging to this group
        // A document belongs to a group if the studentId is in the memberIds list
        // OR if document.projectGroupId matches group.id (if we added that field to DTO)
        // Since we might not have projectGroupId in DocumentDto yet (let's check), we use student mapping.

        const groupDocs = allDocuments.filter(doc => {
          const studentId = doc.studentId || doc.student?.id;
          // Check if doc belongs to a member of this group
          // Also consider checking doc.projectGroupId if available in future
          return memberIds.includes(studentId);
        });

        return {
          ...group,
          documents: groupDocs,
          totalDocuments: groupDocs.length,
          approvedDocuments: groupDocs.filter(doc =>
            doc.status?.includes('APPROVED') || doc.status === 'FINAL_APPROVED'
          ).length,
          pendingDocuments: groupDocs.filter(doc =>
            doc.status === 'SUBMITTED' || doc.status?.includes('REVIEW')
          ).length,
          revisionDocuments: groupDocs.filter(doc =>
            doc.status?.includes('REVISION')
          ).length,
        };
      });

      setGroups(groupsWithDocs);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredGroups = () => {
    let filtered = groups;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(group =>
        group.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.supervisor?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.members?.some(m => m.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(group => {
        switch (filterStatus) {
          case 'approved':
            return group.approvedDocuments > 0;
          case 'pending':
            return group.pendingDocuments > 0;
          case 'revision':
            return group.revisionDocuments > 0;
          case 'no-docs':
            return group.totalDocuments === 0;
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#06b6d4] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#64748b]">Loading projects...</p>
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
            <h1 className="text-white mb-2 text-2xl sm:text-3xl">All Project Groups</h1>
            <p className="text-white/90 text-sm sm:text-base">Monitor document status for all groups</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
            <span className="text-white"><small>Total Groups: {groups.length}</small></span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748b]" size={18} />
            <input
              type="text"
              placeholder="Search by group name, supervisor, or student..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 bg-white"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 bg-white"
          >
            <option value="all">All Status</option>
            <option value="approved">Has Approved</option>
            <option value="pending">Has Pending</option>
            <option value="revision">Needs Revision</option>
            <option value="no-docs">No Documents</option>
          </select>
        </div>
      </Card>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getFilteredGroups().length > 0 ? (
          getFilteredGroups().map(group => (
            <Card key={group.id} hoverable>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#06b6d4] to-[#22d3ee] rounded-full flex items-center justify-center">
                      <Users className="text-white" size={24} />
                    </div>
                    <div>
                      <h3 className="text-[#0f172a] mb-1 font-bold">{group.name}</h3>
                      <p className="text-[#64748b] m-0 text-xs flex items-center gap-1">
                        <User size={12} /> Supervisor: {group.supervisor?.fullName || 'Unassigned'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#f8fafc] rounded-lg p-4 border-l-4 border-[#06b6d4]">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-[#64748b] mb-1"><small>Total Docs</small></p>
                      <p className="text-[#0f172a] m-0 font-semibold">{group.totalDocuments}</p>
                    </div>
                    <div>
                      <p className="text-[#64748b] mb-1"><small>Approved</small></p>
                      <p className="text-[#10b981] m-0 font-semibold">{group.approvedDocuments}</p>
                    </div>
                    <div>
                      <p className="text-[#64748b] mb-1"><small>Pending</small></p>
                      <p className="text-[#f59e0b] m-0 font-semibold">{group.pendingDocuments}</p>
                    </div>
                    <div>
                      <p className="text-[#64748b] mb-1"><small>Revision</small></p>
                      <p className="text-[#ef4444] m-0 font-semibold">{group.revisionDocuments}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[#64748b] text-xs"><small>Members: {group.members?.length || 0}</small></p>
                  <div className="flex flex-wrap gap-1">
                    {group.members?.slice(0, 3).map(m => (
                      <span key={m.id} className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 border">
                        {m.fullName}
                      </span>
                    ))}
                    {(group.members?.length || 0) > 3 && <span className="text-xs text-gray-500">+{group.members.length - 3} more</span>}
                  </div>
                </div>

                {group.documents && group.documents.length > 0 && (
                  <div className="space-y-2 mt-4 pt-4 border-t border-gray-100">
                    <p className="text-[#64748b] text-sm mb-2"><small>Recent Documents:</small></p>
                    {group.documents.slice(0, 3).map(doc => (
                      <div
                        key={doc.id || doc.documentId}
                        className="flex items-center justify-between p-2 bg-white border border-[#e2e8f0] rounded-lg"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="text-[#06b6d4] flex-shrink-0" size={14} />
                          <span className="text-[#0f172a] text-sm truncate">{doc.title || doc.type}</span>
                        </div>
                        <StatusBadge status={doc.status} />
                      </div>
                    ))}
                    {group.documents.length > 3 && (
                      <p className="text-[#64748b] text-xs text-center">
                        +{group.documents.length - 3} more documents
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[#06b6d4]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-[#06b6d4]" size={32} />
              </div>
              <h3 className="text-[#0f172a] mb-2">No Projects Found</h3>
              <p className="text-[#64748b] m-0">Try adjusting your search or filter criteria</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CommitteeProjects;
