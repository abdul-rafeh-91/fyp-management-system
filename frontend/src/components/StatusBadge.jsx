const StatusBadge = ({ status }) => {
  const getStatusClasses = () => {
    const statusLower = status?.toLowerCase() || '';
    
    if (statusLower.includes('approved') || statusLower === 'approved') {
      return 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20';
    }
    if (statusLower.includes('pending') || statusLower === 'pending' || statusLower === 'draft') {
      return 'bg-[#06b6d4]/10 text-[#06b6d4] border border-[#06b6d4]/20';
    }
    if (statusLower.includes('review') || statusLower.includes('submitted')) {
      return 'bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20';
    }
    if (statusLower.includes('rejected') || statusLower.includes('revision')) {
      return 'bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20';
    }
    return 'bg-[#64748b]/10 text-[#64748b] border border-[#64748b]/20';
  };

  const getStatusText = () => {
    if (!status) return 'Unknown';
    // If status already contains readable text (like "Supervisor Requested Revision"), return as is
    if (status.includes('Requested Revision') || status.includes('Approved') || status.includes('Rejected')) {
      return status;
    }
    // Otherwise, format enum-style status
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <span className={`inline-block px-3 py-1 rounded-full ${getStatusClasses()} transition-all duration-200 shadow-sm`}>
      <small className="font-medium">{getStatusText()}</small>
    </span>
  );
};

export default StatusBadge;

