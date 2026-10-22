import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RevealText from '../common/RevealText';

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 for next, -1 for prev

  const testimonials = [
    {
      id: 1,
      name: "OneBite Cafe (onebitebpt.awsaiapp.com)",
      // position: "Digital Marketing Director @ Quantum",
      image:
        "https://institution-utils.s3.us-east-1.amazonaws.com/public/onebitebpt/Picsart_25-02-21_20-44-36-385.png",
      quote:
        "Tekkzy has been a game-changer for our cafe. Their web application and digital marketing services have significantly boosted our online presence and customer engagement. The personal dashboard makes managing our services a breeze!",
    },
    {
      id: 2,
      name: "Disha Hotel & Restaurant",
      // position: "Product Manager @ TechFlow",
      image:
        "https://institution-utils.s3.us-east-1.amazonaws.com/public/logos/DISH5877-1762654894530-WhatsApp%20Image%202025-11-08%20at%207.45.13%20PM.jpeg",
      quote:
        "Hotel management has never been easier since we started using AWSAIApp. The personal dashboard and payment solutions have significantly improved our efficiency and guest satisfaction.",
    },
    {
      id: 3,
      name: "Happyprancer",
      // position: "CEO @ InnovateLab",
      image:
        "https://institution-utils.s3.us-east-1.amazonaws.com/public/Screenshot+2026-01-04+095816.png",
      quote:
        "The digital marketing strategies implemented by Tekkzy have transformed our online presence. Our website traffic and customer engagement have soared, thanks to their expertise and innovative solutions.",
    },
  ];

  const nextTestimonial = () => {
    setDirection(1);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setDirection(-1);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length);
  };

  // Auto-scroll effect
  useEffect(() => {
    const interval = setInterval(() => {
      nextTestimonial();
    }, 3000);
    return () => clearInterval(interval);
  }, [currentIndex]);

  const currentTestimonial = testimonials[currentIndex];

  // Animation variants for bottom-to-top sliding
  const slideVariants = {
    enter: (direction) => ({
      y: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.2, 0.65, 0.3, 0.9]
      }
    },
    exit: (direction) => ({
      y: direction > 0 ? -100 : 100,
      opacity: 0,
      transition: {
        duration: 0.6,
        ease: [0.2, 0.65, 0.3, 0.9]
      }
    })
  };

  const imageVariants = {
    enter: (direction) => ({
      scale: 0.9,
      opacity: 0,
      y: direction > 0 ? 100 : -100
    }),
    center: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.2, 0.65, 0.3, 0.9]
      }
    },
    exit: (direction) => ({
      scale: 0.9,
      opacity: 0,
      y: direction > 0 ? -100 : 100,
      transition: {
        duration: 0.6,
        ease: [0.2, 0.65, 0.3, 0.9]
      }
    })
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl w-full">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <RevealText delay={0.1} duration={0.8} yOffset={30}>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
              Our <span className="text-blue-400">clients</span>
            </h2>
          </RevealText>
          <RevealText delay={0.25} duration={0.8} yOffset={20}>
            <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed px-4">
              Hear firsthand how our solutions have boosted online success for users like you.
            </p>
          </RevealText>
        </div>

        {/* Main Testimonial Container */}
        <div className="relative">
          {/* Mobile Layout (below lg) */}
          <div className="lg:hidden">
            {/* Mobile Image Section */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                {/* Mobile Decorative Elements */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 border border-blue-400/30 rounded-full"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-40 h-40 sm:w-48 sm:h-48 border border-purple-400/20 rounded-full"></div>
                </div>
                
                {/* Mobile Image */}
                <AnimatePresence custom={direction} mode="wait">
                  <motion.div
                    key={currentTestimonial.id}
                    className="relative group p-4"
                    custom={direction}
                    variants={imageVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                  >
                    <div className="absolute inset-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                    <img
                      src={currentTestimonial.image}
                      alt={currentTestimonial.name}
                      className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-xl object-cover border-2 border-white/30 shadow-2xl transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-4 rounded-xl bg-gradient-to-t from-black/30 to-transparent"></div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Mobile Testimonial Text */}
            <div className="text-center space-y-4 sm:space-y-6 px-4">
              <AnimatePresence custom={direction} mode="wait">
                <motion.div
                  key={currentTestimonial.id}
                  className="relative z-10"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  <div className="absolute -top-2 left-0 text-3xl sm:text-4xl text-blue-400/30 font-serif">"</div>
                  <blockquote className="text-base sm:text-lg font-light text-white leading-relaxed px-6">
                    {currentTestimonial.quote}
                  </blockquote>
                  <div className="absolute -bottom-2 right-0 text-3xl sm:text-4xl text-purple-400/30 font-serif rotate-180">"</div>
                </motion.div>
              </AnimatePresence>

              <AnimatePresence custom={direction} mode="wait">
                <motion.div
                  key={`${currentTestimonial.id}-info`}
                  className="space-y-1"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ delay: 0.2 }}
                >
                  <h4 className="text-base sm:text-lg font-semibold text-white">
                    {currentTestimonial.name}
                  </h4>
                  <p className="text-blue-300/80 font-medium text-xs sm:text-sm">
                    {currentTestimonial.position}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Desktop Layout (lg and above) */}
          <div className="hidden lg:block">
            <div className="flex items-center max-w-6xl mx-auto mb-16">
              {/* Desktop Left Side - Image with Intersecting Lines */}
              <div className="relative flex-shrink-0 mr-8 xl:mr-16">
                <div className="relative w-80 xl:w-96 h-80 xl:h-96">
                  {/* Vertical Lines */}
                  <div className="absolute left-16 xl:left-24 top-[-40px] w-0.5 h-[360px] xl:h-[440px] bg-gradient-to-b from-transparent via-blue-400 to-transparent z-0"></div>
                  <div className="absolute right-16 xl:right-24 top-[-40px] w-0.5 h-[360px] xl:h-[440px] bg-gradient-to-b from-transparent via-purple-400 to-transparent z-0"></div>

                  {/* Horizontal Lines */}
                  <div className="absolute top-16 xl:top-24 left-[-40px] w-[360px] xl:w-[480px] h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent z-0"></div>
                  <div className="absolute bottom-16 xl:bottom-24 left-[-40px] w-[360px] xl:w-[480px] h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent z-0"></div>

                  {/* Desktop Image */}
                  <AnimatePresence custom={direction} mode="wait">
                    <motion.div
                      key={currentTestimonial.id}
                      className="absolute top-16 xl:top-24 left-16 xl:left-24 w-32 xl:w-48 h-32 xl:h-48 flex items-center justify-center z-10"
                      custom={direction}
                      variants={imageVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                    >
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                        <img
                          src={currentTestimonial.image}
                          alt={currentTestimonial.name}
                          className="relative w-28 xl:w-44 h-28 xl:h-44 rounded-xl object-cover border-2 border-white/30 shadow-2xl transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/30 to-transparent"></div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Desktop Right Side - Testimonial Text */}
              <div className="flex-1 space-y-6">
                <AnimatePresence custom={direction} mode="wait">
                  <motion.div
                    key={currentTestimonial.id}
                    className="relative"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                  >
                    <div className="absolute -top-4 -left-4 text-4xl xl:text-5xl text-blue-400/30 font-serif">"</div>
                    <blockquote className="text-lg xl:text-xl font-light text-white leading-relaxed relative z-10">
                      {currentTestimonial.quote}
                    </blockquote>
                    <div className="absolute -bottom-4 -right-4 text-4xl xl:text-5xl text-purple-400/30 font-serif rotate-180">"</div>
                  </motion.div>
                </AnimatePresence>

                <AnimatePresence custom={direction} mode="wait">
                  <motion.div
                    key={`${currentTestimonial.id}-info`}
                    className="space-y-1"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ delay: 0.2 }}
                  >
                    <h4 className="text-lg font-semibold text-white">
                      {currentTestimonial.name}
                    </h4>
                    <p className="text-blue-300/80 font-medium text-sm">
                      {currentTestimonial.position}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Navigation Arrows - Responsive */}
          <div className="flex items-center justify-between px-4 sm:px-8 mt-8 lg:mt-0">
            <button
              onClick={prevTestimonial}
              className="text-blue-400 hover:text-blue-300 transition-all duration-300 hover:scale-110 p-2"
              aria-label="Previous testimonial"
            >
              <svg className="w-8 h-8 lg:w-10 lg:h-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" />
              </svg>
            </button>

            {/* Dots Indicator */}
            <div className="flex space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setDirection(index > currentIndex ? 1 : -1);
                    setCurrentIndex(index);
                  }}
                  className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? 'bg-blue-400 w-6 sm:w-8' 
                      : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={nextTestimonial}
              className="text-blue-400 hover:text-blue-300 transition-all duration-300 hover:scale-110 p-2"
              aria-label="Next testimonial"
            >
              <svg className="w-8 h-8 lg:w-10 lg:h-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Testimonials;