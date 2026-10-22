import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { questions } from "./constants";

const RotatingWheel = ({ activeQuestionIndex }) => {
  const wheelRef = useRef(null);
  
  // Only animate wheel rotation when activeQuestionIndex changes manually (not from scroll)
  // The scroll-based rotation is now handled in the parent component
  useEffect(() => {
    if (!wheelRef.current) return;
    
    // This will only run for manual clicks, not scroll events
    // since scroll events are handled in the parent component
    const rotation = -activeQuestionIndex * (360 / questions.length);
    
    // Only animate if the rotation actually needs to change
    const currentRotation = gsap.getProperty(wheelRef.current, "rotation");
    if (Math.abs(currentRotation - rotation) > 1) {
      gsap.to(wheelRef.current, {
        rotation,
        duration: 0.8,
        ease: 'power2.out',
      });
    }
  }, [activeQuestionIndex]);

  return (
    <svg
      ref={wheelRef}
      viewBox="0 0 400 400"
      className="w-full h-full"
      style={{
        filter: "drop-shadow(0 0 20px rgba(59, 130, 246, 0.2))",
        transformOrigin: "center center", // Ensure rotation happens from center
      }}
    >
      <defs>
        <radialGradient id="premiumBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="50%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>
        
        <linearGradient id="goldGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#d97706" stopOpacity="0.8" />
        </linearGradient>
        
        <linearGradient id="activeSegment" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        
        <linearGradient id="inactiveSegment" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e40af" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
      </defs>

      {/* Background circle */}
      <circle cx="200" cy="200" r="200" fill="url(#premiumBg)" />
      
      {/* Decorative rings */}
      <circle
        cx="200"
        cy="200"
        r="195"
        fill="none"
        stroke="url(#goldGlow)"
        strokeWidth="1"
        opacity="0.6"
      />
      
      <circle
        cx="200"
        cy="200"
        r="185"
        fill="none"
        stroke="rgba(59, 130, 246, 0.4)"
        strokeWidth="2"
        strokeDasharray="5,5"
      />

      {/* Wheel segments */}
      {questions.map((_, index) => {
        const segmentAngle = 360 / questions.length;
        const startAngle = index * segmentAngle;
        const endAngle = startAngle + segmentAngle;
        const isActive = index === activeQuestionIndex;
        
        // Convert angles to radians
        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;
        
        // Calculate segment path
        const x1 = 200 + 165 * Math.cos(startRad);
        const y1 = 200 + 165 * Math.sin(startRad);
        const x2 = 200 + 165 * Math.cos(endRad);
        const y2 = 200 + 165 * Math.sin(endRad);
        
        const pathData = `M200,200 L${x1},${y1} A165,165 0 0,1 ${x2},${y2} Z`;
        
        // Calculate position for the segment number
        const numberAngle = startAngle + segmentAngle / 2;
        const numberRad = (numberAngle * Math.PI) / 180;
        const numberX = 200 + 100 * Math.cos(numberRad);
        const numberY = 200 + 100 * Math.sin(numberRad);
        
        return (
          <g key={index}>
            <path
              d={pathData}
              fill={isActive ? "url(#activeSegment)" : "url(#inactiveSegment)"}
              stroke={isActive ? "#3b82f6" : "#1e3a8a"}
              strokeWidth="1"
              style={{
                transition: "fill 0.3s ease, stroke 0.3s ease",
              }}
            />
            <text
              x={numberX}
              y={numberY}
              textAnchor="middle"
              alignmentBaseline="middle"
              fill={isActive ? "white" : "#94a3b8"}
              fontSize="24"
              fontWeight="bold"
              style={{
                transition: "fill 0.3s ease",
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </text>
          </g>
        );
      })}
      
      {/* Center circle */}
      <circle cx="200" cy="200" r="40" fill="url(#premiumBg)" />
      <circle cx="200" cy="200" r="25" fill="#3b82f6" opacity="0.7" />
      <text 
        x="200" 
        y="200" 
        textAnchor="middle" 
        alignmentBaseline="middle" 
        fill="white" 
        fontSize="18" 
        fontWeight="bold"
      >
        T
      </text>
    </svg>
  );
};

export default RotatingWheel;