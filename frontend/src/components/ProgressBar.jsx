const ProgressBar = ({ progress, label, showPercentage = true }) => {
  const getColorClass = () => {
    if (progress >= 70) return 'bg-[#06b6d4]';
    if (progress >= 40) return 'bg-[#f59e0b]';
    return 'bg-[#ef4444]';
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-2">
          <small className="text-[#64748b]">{label}</small>
          {showPercentage && <small className="text-[#0f172a]">{progress}%</small>}
        </div>
      )}
      <div className="w-full h-2.5 bg-[#e2e8f0] rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColorClass()} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;

