import React, { useState } from 'react';
import { ArrowRight, X, Sparkles } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import RevealText from '../common/RevealText';
const GlowButton = ({ children, className = "", ...props }) => (
  <button
    className={`relative px-8 py-4 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 rounded-full text-white font-medium overflow-hidden group hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 ${className}`}
    {...props}
  >
    <span className="relative z-10 flex items-center gap-2">{children}</span>
    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-700"></div>
  </button>
);

const AboutHero = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const navigate = useNavigate();
  
  // Premium sample images for the gallery
  const journeyImages = [
    {
      src: "/images/office.webp",
      alt: "Luxurious modern office space",
      caption: "Executive Workspace",
      description: "Where innovation meets luxury in our state-of-the-art facilities"
    },
    {
      src: "/images/analytics.jpeg", 
      alt: "Advanced analytics dashboard",
      caption: "Intelligence Hub",
      description: "Cutting-edge data visualization driving strategic decisions"
    },
    {
      src: "/images/code.jpeg",
      alt: "Premium development environment",
      caption: "Innovation Lab",
      description: "Where breakthrough solutions come to life through expert craftsmanship"
    }
  ];
  
  // Function to handle image click and show lightbox
  const openLightbox = (image) => {
    setSelectedImage(image);
    document.body.style.overflow = 'hidden';
  };

  // Function to close lightbox
  const closeLightbox = () => {
    setSelectedImage(null);
    document.body.style.overflow = 'auto';
  };

  return (
    <section className="relative py-16 sm:py-20 md:py-28 px-4 md:px-8 overflow-hidden bg-transparent">
      {/* Premium Background with multiple layers */}
      <div className="absolute inset-0 bg-transparent"></div>
      
      {/* Animated background orbs */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-purple-500/10 to-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-cyan-500/8 to-purple-500/12 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-r from-blue-500/8 to-indigo-500/6 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      {/* Premium grid pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="grid grid-cols-20 gap-8 h-full">
          {Array.from({ length: 400 }).map((_, i) => (
            <div key={i} className="border border-white/20"></div>
          ))}
        </div>
      </div>

      {/* Floating premium elements */}
      <div className="absolute top-24 right-20 opacity-30">
        <Sparkles className="w-8 h-8 text-blue-400 animate-pulse" />
      </div>
      <div className="absolute bottom-32 left-16 opacity-20">
        <Sparkles className="w-6 h-6 text-purple-400 animate-pulse delay-700" />
      </div>

      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Left premium content area */}
          <div className="order-2 lg:order-1 text-center lg:text-left">
            {/* Premium badge */}
            <RevealText delay={0.05} duration={0.6} yOffset={15}>
              <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-xl rounded-full border border-white/10">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-xs sm:text-sm uppercase tracking-wider text-purple-300 font-medium">About Us</span>
              </div>
            </RevealText>

            <RevealText delay={0.15} duration={0.8} yOffset={30}>
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 md:mb-8 leading-[0.9] text-white">
                <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                  Our Journey
                </span>
                <br />
                <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  & Legacy
                </span>
              </h2>
            </RevealText>

            <RevealText delay={0.3} duration={0.8} yOffset={20}>
              <p className="text-slate-300 mb-8 md:mb-10 max-w-xl mx-auto lg:mx-0 text-base sm:text-lg leading-relaxed">
                Experience unparalleled excellence as we seamlessly integrate cutting-edge technology with 
                <span className="text-blue-400 font-semibold"> visionary innovation</span>. 
                Our enterprise solutions redefine industry standards through 
                <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent font-semibold"> strategic excellence</span> 
                and meticulous attention to detail.
              </p>
            </RevealText>

            <RevealText delay={0.45} duration={0.7} yOffset={15}>
              <GlowButton onClick={() => navigate("/contact")} className="flex items-center gap-3 mx-auto cursor-pointer lg:mx-0 text-lg px-10 py-5">
                Discover More
                <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
              </GlowButton>
            </RevealText>
          </div>

          {/* Premium image gallery area */}
          <div className="order-1 lg:order-2">
            <div className="relative">
              {/* Gallery container with premium styling */}
              <div className="flex gap-2 h-80 sm:h-96 md:h-[32rem] p-1 bg-gradient-to-r from-slate-800/50 via-slate-900/30 to-slate-800/50 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
                {journeyImages.map((image, index) => {
                  const isHovered = hoveredIndex === index;
                  const isOtherHovered = hoveredIndex !== null && hoveredIndex !== index;
                  
                  return (
                    <div
                      key={index}
                      className={`relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-700 ease-out group ${
                        isHovered 
                          ? 'flex-[2.5] shadow-2xl shadow-purple-500/20' 
                          : isOtherHovered 
                            ? 'flex-[0.7] opacity-60'
                            : 'flex-1'
                      }`}
                      onClick={() => openLightbox(image)}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      {/* Premium image container */}
                      <div className="relative w-full h-full aspect-[3/2]">
                        <img
                          src={image.src}
                          alt={image.alt}
                          className={`w-full h-full object-cover transition-all duration-700 ${
                            isHovered ? 'scale-105' : 'scale-100'
                          }`}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=800&fit=crop&crop=entropy&auto=format&q=80";
                          }}
                        />
                        
                        {/* Premium gradient overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-500 ${
                          isHovered ? 'opacity-100' : 'opacity-0'
                        }`}></div>
                        
                        {/* Premium glass effect overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-purple-500/10 transition-opacity duration-500 ${
                          isHovered ? 'opacity-100' : 'opacity-0'
                        }`}></div>

                        {/* Premium content overlay */}
                        <div className={`absolute inset-0 flex flex-col justify-end p-4 sm:p-6 transition-all duration-500 ${
                          isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                        }`}>
                          <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
                            <h3 className="text-white text-lg sm:text-xl font-bold mb-2 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                              {image.caption}
                            </h3>
                            <p className="text-slate-300 text-sm leading-relaxed">
                              {image.description}
                            </p>
                          </div>
                        </div>

                        {/* Premium sparkle effects */}
                        <div className={`absolute top-4 right-4 transition-all duration-500 ${
                          isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                        }`}>
                          <Sparkles className="w-6 h-6 text-white drop-shadow-lg animate-pulse" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Premium decorative elements around gallery */}
              <div className="absolute -top-6 -left-6 w-24 h-24 border border-purple-500/20 rounded-full animate-pulse"></div>
              <div className="absolute -bottom-8 -right-8 w-32 h-32 border border-blue-500/15 rounded-full animate-pulse delay-1000"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Lightbox modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8"
          onClick={closeLightbox}
        >
          <div
            className="relative max-w-6xl w-full max-h-[90vh] bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-2xl rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={selectedImage.src} 
              alt={selectedImage.alt} 
              className="w-full h-auto max-h-[70vh] object-contain"
            />
            
            {/* Premium caption overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
              <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <h3 className="text-white text-2xl font-bold mb-2 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  {selectedImage.caption}
                </h3>
                <p className="text-slate-300 text-lg">
                  {selectedImage.description}
                </p>
              </div>
            </div>
            
            {/* Premium close button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl text-white w-12 h-12 rounded-full flex items-center justify-center hover:from-slate-700/80 hover:to-slate-600/80 transition-all duration-300 cursor-pointer border border-white/20 shadow-xl group"
              aria-label="Close lightbox"
            >
              <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>

            {/* Premium decorative corners */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-purple-400/50"></div>
            <div className="absolute top-4 right-16 w-8 h-8 border-t-2 border-r-2 border-blue-400/50"></div>
            <div className="absolute bottom-20 left-4 w-8 h-8 border-b-2 border-l-2 border-cyan-400/50"></div>
            <div className="absolute bottom-20 right-4 w-8 h-8 border-b-2 border-r-2 border-purple-400/50"></div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};

export default AboutHero;