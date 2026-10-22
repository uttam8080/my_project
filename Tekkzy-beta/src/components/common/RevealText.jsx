import React from 'react';
import { motion } from 'framer-motion';

/**
 * RevealText component reveals text smoothly when scrolled into viewport.
 * Supports revealing line-by-line, word-by-word, or as a single unit.
 */
export const RevealText = ({
  children,
  className = '',
  delay = 0,
  duration = 0.7,
  yOffset = 30,
  once = false,
  as = 'div',
}) => {
  const Component = motion[as] || motion.div;

  return (
    <Component
      initial={{ opacity: 0, y: yOffset, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once, amount: 0.2 }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1], // easeOutQuart
      }}
      className={className}
    >
      {children}
    </Component>
  );
};

export default RevealText;
