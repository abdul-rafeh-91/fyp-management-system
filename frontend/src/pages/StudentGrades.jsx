import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import '../styles/Grades.css';

const StudentGrades = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dmcData, setDmcData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDMC();
  }, []);

  const fetchDMC = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get(`/grades/student/${user.userId}/dmc`);
      setDmcData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load grades');
      console.error('Error fetching DMC:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadDMC = () => {
    // In a real implementation, this would generate a PDF.
    window.print();
  };

  const getGradeColor = (grade) => {
    const colors = {
      'A': '#10b981',
      'A-': '#14b8a6',
      'B+': '#22c55e',
      'B': '#84cc16',
      'B-': '#a3e635',
      'C+': '#fbbf24',
      'C': '#f59e0b',
      'C-': '#f97316',
      'F': '#ef4444',
    };
    return colors[grade] || '#64748b';
  };

  const getGradeIcon = (grade) => {
    if (['A', 'A-'].includes(grade)) return '🌟';
    if (['B+', 'B', 'B-'].includes(grade)) return '⭐';
    if (['C+', 'C', 'C-'].includes(grade)) return '📝';
    return '📉';
  };

  if (loading) {
    return (
      <div className="grades-loading">
        <div className="loading-spinner-large"></div>
        <p>Loading your grades...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grades-error">
        <div className="error-icon">❌</div>
        <h2>Unable to Load Grades</h2>
        <p>{error}</p>
        <button onClick={fetchDMC} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  if (!dmcData || dmcData.documentGrades.length === 0) {
    return (
      <div className="grades-empty">
        <div className="empty-icon">📋</div>
        <h2>No Grades Yet</h2>
        <p>Your grades will appear here once they are released by the FYP Committee.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#06b6d4] to-[#22d3ee] text-white rounded-xl shadow-lg p-4 sm:p-5 flex items-center justify-between">
        <div>
          <h1 className="text-white mb-1 text-xl sm:text-2xl font-semibold">Detailed Marks Certificate (DMC)</h1>
          <p className="text-white/90 text-xs sm:text-sm">Final Year Project Evaluation</p>
        </div>
        <button 
          onClick={downloadDMC} 
          className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M10 2v10m0 0l3-3m-3 3l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M3 14v2a2 2 0 002 2h10a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Download PDF
        </button>
      </div>

      {/* Student Information */}
      <div className="bg-white rounded-xl shadow-md p-4 border border-[#e2e8f0]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-2">
            <span className="text-xs text-[#64748b] block mb-1">Student Name</span>
            <span className="text-sm font-semibold text-[#0f172a]">{dmcData.studentName}</span>
          </div>
          <div className="p-2">
            <span className="text-xs text-[#64748b] block mb-1">Registration Number</span>
            <span className="text-sm font-semibold text-[#0f172a]">{dmcData.registrationNumber}</span>
          </div>
          <div className="p-2">
            <span className="text-xs text-[#64748b] block mb-1">Department</span>
            <span className="text-sm font-semibold text-[#0f172a]">{dmcData.department}</span>
          </div>
          <div className="p-2">
            <span className="text-xs text-[#64748b] block mb-1">Overall Grade</span>
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-white text-sm font-semibold" style={{ background: getGradeColor(dmcData.overallGrade) }}>
              <span>{getGradeIcon(dmcData.overallGrade)}</span>
              <span>{dmcData.overallGrade}</span>
            </div>
          </div>
          <div className="p-2">
            <span className="text-xs text-[#64748b] block mb-1">Overall CGPA</span>
            <div className="inline-flex items-center px-3 py-1 rounded-lg text-white text-sm font-semibold bg-[#06b6d4]">
              {dmcData.overallGPA?.toFixed(2) || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Overall Summary */}
      <div className="bg-white rounded-xl shadow-md p-4 border border-[#e2e8f0]">
        <h2 className="text-lg font-semibold text-[#0f172a] mb-3">Overall Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-center">
            <div className="relative">
              <svg width="100" height="100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="8"/>
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  fill="none" 
                  stroke="#06b6d4" 
                  strokeWidth="8"
                  strokeDasharray={`${dmcData.overallPercentage * 2.51} 251`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
                <text x="50" y="55" textAnchor="middle" fontSize="18" fontWeight="700" fill="#0f172a">
                  {dmcData.overallPercentage.toFixed(1)}%
                </text>
              </svg>
            </div>
            <p className="text-sm text-[#64748b] ml-2">Overall Percentage</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3 p-2 bg-[#f8fafc] rounded-lg">
              <span className="text-xl">🎯</span>
              <div>
                <p className="text-xs text-[#64748b] m-0">Overall Grade</p>
                <p className="text-base font-semibold text-[#0f172a] m-0">{dmcData.overallGrade}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 bg-[#f8fafc] rounded-lg">
              <span className="text-xl">📊</span>
              <div>
                <p className="text-xs text-[#64748b] m-0">Overall CGPA</p>
                <p className="text-base font-semibold text-[#0f172a] m-0">{dmcData.overallGPA?.toFixed(2) || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 bg-[#f8fafc] rounded-lg">
              <span className="text-xl">📄</span>
              <div>
                <p className="text-xs text-[#64748b] m-0">Documents Graded</p>
                <p className="text-base font-semibold text-[#0f172a] m-0">{dmcData.documentGrades.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document-wise Grades */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-[#0f172a] px-1">Document-wise Grades</h2>
        
        {dmcData.documentGrades.map((docGrade, index) => (
          <div key={index} className="bg-white rounded-xl shadow-md p-4 border border-[#e2e8f0]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-[#0f172a] m-0">{docGrade.documentTitle}</h3>
                <span className="text-xs text-[#64748b] bg-[#f1f5f9] px-2 py-0.5 rounded">{docGrade.documentType}</span>
              </div>
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-sm font-semibold" style={{ background: getGradeColor(docGrade.grade) }}>
                <span>{getGradeIcon(docGrade.grade)}</span>
                <span>{docGrade.grade}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 bg-[#f8fafc] rounded-lg">
                <span className="text-xs text-[#64748b] block mb-1">Grade</span>
                <span className="text-sm font-semibold text-[#0f172a]">{docGrade.grade}</span>
              </div>
              <div className="p-2 bg-[#f8fafc] rounded-lg">
                <span className="text-xs text-[#64748b] block mb-1">GPA</span>
                <span className="text-sm font-semibold text-[#0f172a]">{docGrade.gpa?.toFixed(2) || 'N/A'}</span>
              </div>
            </div>
            <div className="mt-2">
              <div className="h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all" 
                  style={{ 
                    width: `${docGrade.percentage}%`,
                    background: getGradeColor(docGrade.grade)
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentGrades;

