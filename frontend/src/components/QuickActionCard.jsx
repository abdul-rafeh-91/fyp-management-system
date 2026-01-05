import { useNavigate } from 'react-router-dom';

const QuickActionCard = ({ icon, title, description, color, onClick, path }) => {
  const navigate = useNavigate();

  const getGradientClass = (color) => {
    switch (color) {
      case '#06b6d4':
        return 'from-[#06b6d4] to-[#22d3ee]';
      case '#10b981':
        return 'from-[#10b981] to-[#14b8a6]';
      case '#f59e0b':
        return 'from-[#f59e0b] to-[#d97706]';
      case '#ef4444':
        return 'from-[#ef4444] to-[#dc2626]';
      case '#8b5cf6':
        return 'from-[#8b5cf6] to-[#a78bfa]';
      default:
        return 'from-[#06b6d4] to-[#22d3ee]';
    }
  };

  const gradient = getGradientClass(color);

  const handleClick = () => {
    if (path) {
      navigate(path);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <button 
      onClick={handleClick}
      className="bg-white p-4 rounded-xl shadow-sm border border-[#e2e8f0] hover:shadow-md hover:scale-105 transition-all duration-300 text-left group relative overflow-hidden w-full"
    >
      <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${gradient} opacity-5 rounded-full -mr-8 -mt-8 group-hover:opacity-10 transition-opacity`}></div>
      
      <div className="relative z-10">
        <div className={`w-10 h-10 bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <h4 className="mb-1 text-[#0f172a] text-sm font-semibold">{title}</h4>
        <p className="text-[#64748b] m-0 text-xs"><small>{description}</small></p>
      </div>
    </button>
  );
};

export default QuickActionCard;

