import React from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

const stylesByType = {
  success: {
    container: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200',
    icon: 'text-emerald-400',
    Icon: FiCheckCircle,
  },
  error: {
    container: 'bg-red-500/10 border-red-500/30 text-red-200',
    icon: 'text-red-400',
    Icon: FiAlertCircle,
  },
  info: {
    container: 'bg-blue-500/10 border-blue-500/30 text-blue-200',
    icon: 'text-blue-400',
    Icon: FiInfo,
  },
};

const FloatingNotice = ({ notice, onClose }) => {
  if (!notice?.message) return null;

  const type = notice.type || 'info';
  const config = stylesByType[type] || stylesByType.info;
  const Icon = config.Icon;

  return (
    <div className="fixed top-20 right-4 z-[120] pointer-events-none">
      <div
        className={`min-w-[280px] max-w-[420px] pointer-events-auto border rounded-xl shadow-2xl backdrop-blur px-4 py-3 animate-[fadein_.2s_ease-out] ${config.container}`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.icon}`} />
          <p className="text-sm leading-5 flex-1">{notice.message}</p>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close notification"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FloatingNotice;