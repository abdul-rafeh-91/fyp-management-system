import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CheckCircle, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback((message) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message }]);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
    
    return id;
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[10000] space-y-2 pointer-events-none">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            className="pointer-events-auto animate-slide-in-right"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="bg-white rounded-lg shadow-lg border-l-4 border-[#10b981] p-4 min-w-[320px] max-w-[400px] flex items-start gap-3">
              <div className="flex-shrink-0">
                <CheckCircle className="text-[#10b981]" size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#0f172a] font-medium text-sm m-0">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 text-[#94a3b8] hover:text-[#0f172a] transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

