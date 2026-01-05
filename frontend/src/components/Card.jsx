const Card = ({ children, title, className = '', hoverable = false }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-[#e2e8f0] p-4 sm:p-6 ${hoverable ? 'hover:shadow-md transition-shadow duration-200' : ''} ${className}`}>
      {title && <h3 className="mb-4 text-[#0f172a] text-lg sm:text-xl">{title}</h3>}
      {children}
    </div>
  );
};

export default Card;

