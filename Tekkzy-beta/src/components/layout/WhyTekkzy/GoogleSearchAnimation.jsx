/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const GoogleSearchAnimation = ({ onComplete }) => {
  const [searchText, setSearchText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [searchCompleted, setSearchCompleted] = useState(false);
  const fullSearchText = "why tekkzy...?";

  // Typing effect for Google search
  useEffect(() => {
    if (searchCompleted) return;

    const typeText = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      for (let i = 0; i <= fullSearchText.length; i++) {
        setSearchText(fullSearchText.slice(0, i));
        await new Promise(resolve => setTimeout(resolve, 75));
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setSearchCompleted(true);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      onComplete();
    };

    typeText();
  }, [searchCompleted, fullSearchText, onComplete]);

  // Cursor blinking effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-gray-950 flex items-center justify-center"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      <div className="w-full max-w-2xl px-6">
        {/* Google Logo */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <div className="text-8xl font-light tracking-tight">
            <span className="text-blue-500">G</span>
            <span className="text-red-500">o</span>
            <span className="text-yellow-500">o</span>
            <span className="text-blue-500">g</span>
            <span className="text-green-500">l</span>
            <span className="text-red-500">e</span>
          </div>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <div className="relative bg-white border border-gray-300 rounded-full px-6 py-4 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-gray-400 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              
              <div className="flex-1 text-lg text-gray-700">
                {searchText}
                {showCursor && (
                  <span className="text-gray-400 animate-pulse">|</span>
                )}
              </div>

              <svg className="w-5 h-5 text-gray-400 ml-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1L13.5 2.5L16.17 5.17L10.5 10.84L11.84 12.18L17.5 6.5L20.17 9.17L21.5 7.83L21 9M1 21V19L6.5 13.5L7.96 14.96L2.44 20.5L8 20.5V19L10 19V21H1Z"/>
              </svg>
            </div>
          </div>

          {/* Search Button */}
          <motion.div
            className="flex justify-center mt-8 space-x-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            <motion.button
              className="bg-gray-50 hover:bg-gray-100 border border-gray-300 px-6 py-3 rounded text-gray-700 font-medium transition-colors duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={searchCompleted ? {
                backgroundColor: "#3b82f6",
                color: "#ffffff",
                scale: [1, 1.1, 1]
              } : {}}
              transition={{ duration: 0.3 }}
            >
              Google Search
            </motion.button>
            
            <motion.button
              className="bg-gray-50 hover:bg-gray-100 border border-gray-300 px-6 py-3 rounded text-gray-700 font-medium transition-colors duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              I'm Feeling Lucky
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Loading Animation */}
        {searchCompleted && (
          <motion.div
            className="flex justify-center mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-blue-500 rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default GoogleSearchAnimation;