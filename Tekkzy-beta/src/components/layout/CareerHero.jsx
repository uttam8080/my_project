/* eslint-disable no-unused-vars */
import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

// Premium GlowButton component
const GlowButton = ({ children, className = "", ...props }) => {
  return (
    <motion.button
      className={`relative inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
      <span className="relative flex items-center gap-2 whitespace-nowrap">
        {children}
      </span>
    </motion.button>
  );
};

const floatingItems = [
  // Premium arrangement - Golden ratio inspired positioning
  {
    src: "/career-hero/person1.png",
    alt: "Person 1",
    style: "top-[8%] left-[12%]",
    delay: 0.1,
    size: "w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28",
    tier: "premium",
    floatSpeed: 3.5,
    floatHeight: 8
  },
  {
    src: "/career-hero/figma.png",
    alt: "Figma",
    style: "top-[15%] right-[15%]",
    delay: 0.2,
    size: "w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20",
    isLogo: true,
    bg: "bg-transparent",
    tier: "elite",
    floatSpeed: 4,
    floatHeight: 6
  },
  {
    src: "/career-hero/person2.png",
    alt: "Person 2",
    style: "top-[5%] left-[45%]",
    delay: 0.3,
    size: "w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20",
    tier: "standard",
    floatSpeed: 3,
    floatHeight: 5
  },

  // Second tier - Strategic placement
  {
    src: "/career-hero/react.png",
    alt: "React",
    style: "top-[32%] left-[8%]",
    delay: 0.4,
    size: "w-18 h-18 sm:w-20 sm:h-20 md:w-22 md:h-22",
    isLogo: true,
    bg: "bg-slate-900/95",
    tier: "elite",
    floatSpeed: 4.5,
    floatHeight: 7
  },
  {
    src: "/career-hero/person3.png",
    alt: "Person 3",
    style: "top-[28%] left-[38%]",
    delay: 0.5,
    size: "w-22 h-22 sm:w-26 sm:h-26 md:w-30 md:h-30",
    tier: "premium",
    floatSpeed: 3.2,
    floatHeight: 9
  },
  {
    src: "/career-hero/tailwind.png",
    alt: "Tailwind",
    style: "top-[35%] right-[12%]",
    delay: 0.6,
    size: "w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20",
    isLogo: true,
    bg: "bg-transparent",
    tier: "elite",
    floatSpeed: 4.2,
    floatHeight: 5
  },

  // Third tier - Balance and harmony
  {
    src: "/career-hero/aws.png",
    alt: "AWS",
    style: "top-[52%] left-[18%]",
    delay: 0.7,
    size: "w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20",
    isLogo: true,
    bg: "bg-transparet",
    tier: "elite",
    floatSpeed: 3.8,
    floatHeight: 6
  },
  {
    src: "/career-hero/person4.png",
    alt: "Person 4",
    style: "top-[52%] right-[8%]",
    delay: 0.8,
    size: "w-18 h-18 sm:w-22 sm:h-22 md:w-26 md:h-26",
    tier: "standard",
    floatSpeed: 3.3,
    floatHeight: 7
  },

  // Fourth tier - Foundation
  {
    src: "/career-hero/person5.png",
    alt: "Person 5",
    style: "top-[68%] left-[8%]",
    delay: 0.9,
    size: "w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28",
    tier: "premium",
    floatSpeed: 3.7,
    floatHeight: 8
  },
  {
    src: "/career-hero/next.png",
    alt: "Next.js",
    style: "top-[72%] left-[42%]",
    delay: 1.0,
    size: "w-18 h-18 sm:w-20 sm:h-20 md:w-22 md:h-22",
    isLogo: true,
    bg: "bg-black/95",
    tier: "elite",
    floatSpeed: 4.3,
    floatHeight: 5
  },
  {
    src: "/career-hero/person6.png",
    alt: "Person 6",
    style: "top-[75%] right-[15%]",
    delay: 1.1,
    size: "w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20",
    tier: "standard",
    floatSpeed: 3.1,
    floatHeight: 6
  },
  {
    src: "/career-hero/person7.png",
    alt: "Person 7",
    style: "top-[89%] left-[25%]",
    delay: 1.2,
    size: "w-18 h-18 sm:w-22 sm:h-22 md:w-26 md:h-26",
    tier: "standard",
    floatSpeed: 3.9,
    floatHeight: 7
  },
];

const CareerHero = () => {
  const getTierStyles = (tier) => {
    switch (tier) {
      case 'premium':
        return {
          bg: 'bg-gradient-to-br from-amber-500/20 via-yellow-400/15 to-orange-500/20',
          border: 'border-amber-400/40',
          shadow: 'shadow-amber-500/25',
          glow: 'shadow-amber-400/30'
        };
      case 'elite':
        return {
          bg: 'bg-gradient-to-br from-purple-500/20 via-blue-500/15 to-indigo-500/20',
          border: 'border-purple-400/40',
          shadow: 'shadow-purple-500/25',
          glow: 'shadow-purple-400/40'
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-white/15 via-white/10 to-white/5',
          border: 'border-white/20',
          shadow: 'shadow-white/10',
          glow: 'shadow-white/20'
        };
    }
  };

  return (
    <section className="relative min-h-[80vh] bg-transparent text-white overflow-hidden">
      {/* Premium background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated gradient mesh background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSg0NSkiPjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNwYXR0ZXJuKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')]"></div>
        </div>
        
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-white/5"
            style={{
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 10 + 10}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}

        {/* Glowing orbs */}
        <div className="absolute top-[10%] left-[10%] w-64 h-64 bg-blue-500/10 rounded-full filter blur-[80px] animate-pulse"></div>
        <div className="absolute bottom-[15%] right-[10%] w-72 h-72 bg-purple-500/10 rounded-full filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[50%] left-[50%] w-48 h-48 bg-indigo-500/10 rounded-full filter blur-[90px] animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-16 md:py-20 relative z-10">
        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="pb-10 md:pb-0">
            <p className="text-blue-400 font-medium tracking-wide uppercase text-sm sm:text-base mb-2">
              Career
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-200">
              Bright Future <br className="hidden sm:block" /> With Us
            </h1>
            <p className="text-gray-300 text-sm sm:text-base mt-4 sm:mt-6 mb-6 sm:mb-8 max-w-md">
              Join our innovative team and work with cutting-edge technologies.
              We offer exciting opportunities to grow your career.
            </p>
            <GlowButton className="flex items-center gap-2">
              Join Us
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </GlowButton>
          </motion.div>

          {/* Right Floating Cards */}
          <div className="relative h-[500px] sm:h-[550px] md:h-[600px] w-full">
            {/* Floating container */}
            <motion.div 
              className="relative h-full w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              {/* Premium background pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
                <svg className="w-full h-full">
                  <defs>
                    <pattern id="hexPattern" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
                      <polygon points="30,2 52,15 52,37 30,50 8,37 8,15" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#hexPattern)" />
                </svg>
              </div>

              {/* Floating items with premium styling */}
              {floatingItems.map((item, index) => {
                const tierStyles = getTierStyles(item.tier);
                
                return (
                  <motion.div
                    key={index}
                    className={`absolute ${item.style} ${item.size} rounded-2xl backdrop-blur-xl border-2 ${tierStyles.bg} ${tierStyles.border} shadow-2xl ${tierStyles.shadow} flex items-center justify-center overflow-hidden transition-all duration-500 hover:shadow-3xl group cursor-pointer`}
                    initial={{ opacity: 0, y: 30, scale: 0.8 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                    }}
                    transition={{
                      opacity: { duration: 0.6, delay: item.delay },
                      y: { duration: 0.8, delay: item.delay, type: "spring", bounce: 0.3 },
                      scale: { duration: 0.6, delay: item.delay, type: "spring" },
                    }}
                    whileHover={{ 
                      scale: 1.15,
                      zIndex: 20,
                      rotateY: 5,
                      rotateX: 5,
                    }}
                    style={{
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    {/* Floating animation */}
                    <motion.div
                      initial={{ y: -item.floatHeight }}
                      animate={{
                        y: [0, -item.floatHeight, 0],
                      }}
                      transition={{
                        duration: item.floatSpeed,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut",
                        delay: item.delay
                      }}
                      className="w-full h-full"
                    >
                      {/* Premium glow effect */}
                      <div className={`absolute -inset-1 bg-gradient-to-r ${item.tier === 'premium' ? 'from-amber-500/30 to-yellow-500/30' : item.tier === 'elite' ? 'from-purple-500/30 to-blue-500/30' : 'from-white/20 to-white/10'} rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                      
                      {/* Content container */}
                      <div className="relative w-full h-full flex items-center justify-center rounded-xl overflow-hidden">
                        {/* Gradient overlay for hover effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/10 to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        <img
                          src={item.src}
                          alt={item.alt}
                          className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${
                            item.isLogo ? `p-3 sm:p-4 ${item.bg || "bg-white/95"} rounded-xl m-2` : "rounded-xl"
                          }`}
                          style={{
                            objectFit: item.isLogo ? 'contain' : 'cover',
                            objectPosition: 'center',
                          }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://placehold.co/200x200/0a0c1b/ffffff?text=${item.alt.replace(/\s+/g, '+')}`;
                          }}
                        />
                        
                        {/* Premium label overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                          <p className="text-white text-xs sm:text-sm font-medium text-center truncate">
                            {item.alt}
                          </p>
                          {item.tier === 'premium' && (
                            <div className="absolute top-2 right-2">
                              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                            </div>
                          )}
                          {item.tier === 'elite' && (
                            <div className="absolute top-2 right-2">
                              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}

              {/* Connecting lines for premium feel */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                {/* Subtle connecting lines between items */}
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
                    <stop offset="50%" stopColor="rgba(147,51,234,0.3)" />
                    <stop offset="100%" stopColor="rgba(59,130,246,0.1)" />
                  </linearGradient>
                </defs>
                <path d="M100 80 Q250 200 400 150 T600 250" 
                      stroke="url(#lineGradient)" 
                      strokeWidth="1" 
                      fill="none" 
                      className="animate-pulse" />
                <path d="M80 300 Q200 180 350 280 T500 200" 
                      stroke="url(#lineGradient)" 
                      strokeWidth="1" 
                      fill="none" 
                      className="animate-pulse"
                      style={{ animationDelay: '1s' }} />
              </svg>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Premium grid overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="h-full w-full">
          <svg className="w-full h-full">
            <defs>
              <pattern id="premiumGrid" width="80" height="80" patternUnits="userSpaceOnUse">
                <circle cx="40" cy="40" r="1" fill="white" opacity="0.3" />
                <path d="M 80 0 L 0 0 0 80" fill="none" stroke="white" strokeWidth="0.3" opacity="0.2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#premiumGrid)" />
          </svg>
        </div>
      </div>

      {/* CSS for floating animation */}
      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.8; }
          100% { transform: translateY(0) rotate(360deg); opacity: 1; }
        }
      `}</style>
    </section>
  );
};

export default CareerHero;