/* eslint-disable no-unused-vars */
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';

const BackgroundEffects = () => {
  useEffect(() => {
    const animateBackground = () => {
      const elements = document.querySelectorAll('.floating-orb');
      elements.forEach((element) => {
        gsap.to(element, {
          y: Math.random() * 100 - 50,
          x: Math.random() * 100 - 50,
          opacity: 0.5,
          duration: 5,
          repeat: -1,
          yoyo: true,
          ease: 'power1.inOut',
        });
      });
    };

    animateBackground();
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="floating-orb absolute w-1 h-1 bg-blue-400 rounded-full"
          style={{
            left: `${Math.random() * 100}vw`,
            top: `${Math.random() * 100}vh`,
          }}
        />
      ))}
    </div>
  );
};

export default BackgroundEffects;