/* eslint-disable no-unused-vars */
import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

const MobilePagination = ({ currentIndex, totalQuestions, onPageChange }) => {
  const handlePageChange = (index) => {
    if (index >= 0 && index < totalQuestions) {
      onPageChange(index);
    }
  };

  return (
    <div className="mobile-pagination flex justify-center space-x-2 mt-4">
      <button
        className={`pagination-button ${currentIndex === 0 ? 'disabled' : ''}`}
        onClick={() => handlePageChange(currentIndex - 1)}
        disabled={currentIndex === 0}
      >
        Previous
      </button>
      {Array.from({ length: totalQuestions }).map((_, index) => (
        <motion.button
          key={index}
          className={`pagination-dot ${currentIndex === index ? 'active' : ''}`}
          onClick={() => handlePageChange(index)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {index + 1}
        </motion.button>
      ))}
      <button
        className={`pagination-button ${currentIndex === totalQuestions - 1 ? 'disabled' : ''}`}
        onClick={() => handlePageChange(currentIndex + 1)}
        disabled={currentIndex === totalQuestions - 1}
      >
        Next
      </button>
    </div>
  );
};

MobilePagination.propTypes = {
  currentIndex: PropTypes.number.isRequired,
  totalQuestions: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
};

export default MobilePagination;