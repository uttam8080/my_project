/* eslint-disable no-unused-vars */
import React from 'react';
import { motion } from 'framer-motion';
import useGSAPAnimations from '../../../hooks/useGSAPAnimations';

const QuestionCard = ({ question, answer, icon = "🔍", index = 0, isActive, onClick }) => {
  // Get animation states from our hook
  const { animateIn, animateOut } = useGSAPAnimations();
  
  // Provide fallback animation if hook fails
  const activeAnimation = animateIn || { opacity: 1, y: 0, scale: 1 };
  const inactiveAnimation = animateOut || { opacity: 0.7, y: 10, scale: 0.95 };

  return (
    <motion.div
      className={`group relative p-6 rounded-2xl backdrop-blur-xl border-2 cursor-pointer overflow-hidden
        ${isActive 
          ? "bg-gradient-to-br from-blue-500/20 via-purple-500/15 to-pink-500/10 border-blue-400/60 shadow-2xl shadow-blue-500/25"
          : "bg-gradient-to-br from-gray-900/40 via-slate-800/30 to-gray-900/40 border-gray-700/40 hover:border-gray-600/60 shadow-xl shadow-black/30"
        }`}
      onClick={onClick}
      initial="inactive"
      animate={isActive ? activeAnimation : inactiveAnimation}
      transition={{ duration: 0.5 }}
    >
      {/* Card content */}
      <div className="relative z-10">
        {/* Icon and number */}
        <div className="flex items-center justify-between mb-4">
          <div
            className={`text-2xl p-3 rounded-xl transition-all duration-500 ${
              isActive 
                ? "bg-gradient-to-br from-blue-500/30 to-purple-500/30 shadow-lg shadow-blue-500/25" 
                : "bg-gray-800/50 group-hover:bg-gray-700/50"
            }`}
          >
            {icon}
          </div>
          
          <div
            className={`text-2xl font-bold px-4 py-2 rounded-full transition-all duration-500 ${
              isActive
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/30"
                : "bg-gray-800/50 text-gray-400 group-hover:bg-gray-700/50 group-hover:text-gray-300"
            }`}
          >
            {String(index + 1).padStart(2, "0")}
          </div>
        </div>
        
        {/* Question */}
        <h3 
          className={`text-lg sm:text-xl font-bold mb-4 transition-all duration-500 ${
            isActive 
              ? "text-transparent bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text" 
              : "text-blue-300 group-hover:text-blue-200"
          }`}
        >
          {question}
        </h3>
        
        {/* Answer */}
        <p 
          className={`text-sm sm:text-base leading-relaxed transition-all duration-500 ${
            isActive 
              ? "text-gray-200" 
              : "text-gray-400 group-hover:text-gray-300"
          }`}
        >
          {answer}
        </p>
      </div>
    </motion.div>
  );
};

export default QuestionCard;