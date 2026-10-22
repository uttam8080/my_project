// src/components/CultureCard.jsx
import React from 'react';
import { motion } from 'framer-motion';

const CultureCard = ({ 
  image, 
  date, 
  category, 
  title, 
  link = "#",
  index = 0 
}) => {
  return (
    <motion.div
      className="bg-black/20 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 h-full flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 * index }}
      whileHover={{ y: -5, transition: { duration: 0.2 }, borderColor: 'whitesmoke' }}
    >
      {/* Card Image */}
      <div className="relative w-full aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Card Content */}
      <div className="p-6 flex flex-col flex-grow">
        {/* Date and Category */}
        <div className="flex items-center text-sm text-gray-400 mb-3">
          <span>{date}</span>
          <span className="mx-2">•</span>
          <span className="text-blue-400">{category}</span>
        </div>
        
        {/* Title */}
        <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
        
        {/* Read More button, positioned at the bottom */}
        <div className="mt-auto">
          <a href={link} className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center">
            Read More
          </a>
        </div>
      </div>
    </motion.div>
  );
};

export default CultureCard;