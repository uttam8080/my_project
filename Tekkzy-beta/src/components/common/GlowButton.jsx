import React from 'react';

const GlowButton = ({ children, className = '', ...props }) => {
  return (
    <button 
      className={`
        relative
        px-8
        py-3
        bg-black
        text-white
        rounded-full
        border
        border-blue-500/50
        font-medium
        text-sm
        transition-all
        duration-200
        shadow-lg
        shadow-blue-500/30
        hover:border-blue-400/70
        hover:shadow-xl
        hover:shadow-blue-500/40
        focus:outline-none
        focus:ring-2
        focus:ring-blue-500/50
        backdrop-blur-sm
        cursor-pointer
        hover:bg-slate-900
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

export default GlowButton;