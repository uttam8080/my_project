import { useEffect } from 'react';
import { gsap } from 'gsap';

const useGSAPAnimations = () => {
  // Define animation states for use with framer-motion
  const animateIn = {
    opacity: 1,
    y: 0,
    scale: 1
  };

  const animateOut = {
    opacity: 0.7,
    y: 10,
    scale: 0.95
  };

  // Original animate functionality 
  const animateElement = (ref, animations) => {
    useEffect(() => {
      if (ref?.current) {
        const timeline = gsap.timeline();
  
        animations.forEach(animation => {
          timeline.add(animation);
        });
  
        return () => {
          timeline.kill();
        };
      }
    }, [ref, animations]);
  };

  // Return the animation states and methods
  return { animateIn, animateOut, animateElement };
};

export default useGSAPAnimations;