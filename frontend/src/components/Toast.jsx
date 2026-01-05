import { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

const Toast = ({ message, onClose, id }) => {
  useEffect(() => {
    // Auto close after 3 seconds
    const timer = setTimeout(() => {
      onClose(id);
    }, 3000);

    return () => clearTimeout(timer);
  }, [id, onClose]);

  return (
    <div className="fixed top-4 right-4 z-[10000] animate-slide-in-right">
      <div className="bg-white rounded-lg shadow-lg border-l-4 border-[#10b981] p-4 min-w-[320px] max-w-[400px] flex items-start gap-3">
        <div className="flex-shrink-0">
          <CheckCircle className="text-[#10b981]" size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[#0f172a] font-medium text-sm m-0">{message}</p>
        </div>
        <button
          onClick={() => onClose(id)}
          className="flex-shrink-0 text-[#94a3b8] hover:text-[#0f172a] transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default Toast;

