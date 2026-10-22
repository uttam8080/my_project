import React from 'react';
import LazyVideo from '../common/LazyVideo';
import RevealText from '../common/RevealText';

const VideoDemo = () => {

  return (
    <div className="bg-transparent flex flex-col items-center justify-start pt-6 md:pt-12 pb-2 relative overflow-hidden">
      {/* Floating Glow Effects */}
      <div
        className="absolute top-1/4 left-1/4 w-40 h-40 md:w-80 md:h-80 rounded-full bg-blue-500/10 blur-2xl -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none"
      ></div>
      <div
        className="absolute bottom-1/3 right-1/3 w-48 h-48 md:w-96 md:h-96 rounded-full bg-purple-500/10 blur-2xl translate-x-1/2 translate-y-1/2 z-0 pointer-events-none"
      ></div>
      <div
        className="absolute top-2/3 left-1/3 w-32 h-32 md:w-64 md:h-64 rounded-full bg-cyan-500/10 blur-2xl -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none"
      ></div>

      {/* Main Content */}
      <div className="relative z-20 w-full max-w-7xl px-6 mb-10">
        {/* Title Section */}
        <div className="text-center mb-16">
          <RevealText delay={0.1} duration={0.8} yOffset={30}>
            <h1
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight will-change-transform"
            >
              <span className="mr-2">Video</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 animate-text-shine">
                Demo
              </span>
            </h1>
          </RevealText>

          <RevealText delay={0.25} duration={0.8} yOffset={25}>
            <p
              className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto font-light tracking-wide will-change-transform"
            >
              Experience our cutting-edge solutions through these immersive demonstrations
            </p>
          </RevealText>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          {/* Video 1 */}
          <div className="group relative will-change-transform">
            <div className="relative h-full bg-gray-900 rounded-2xl overflow-hidden">
              <LazyVideo
                src="/vdodemo1.mp4"
                disablePictureInPicture
                className="w-full h-full object-cover"
                style={{ aspectRatio: '16/9' }}
              />
            </div>
          </div>

          {/* Video 2 */}
          <div className="group relative will-change-transform">
            <div className="relative h-full bg-gray-900 rounded-2xl overflow-hidden">
              <LazyVideo
                src="/vdodemo.mp4"
                disablePictureInPicture
                className="w-full h-full object-cover"
                style={{ aspectRatio: '16/9' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(10px) translateX(-15px); }
        }
        @keyframes float-slower {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(15px) translateX(20px); }
        }
        @keyframes text-shine {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 12s ease-in-out infinite;
        }
        .animate-float-slower {
          animation: float-slower 16s ease-in-out infinite;
        }
        .animate-text-shine {
          background-size: 200% auto;
          animation: text-shine 3s linear infinite;
        }
        .will-change-transform {
          will-change: transform, opacity;
        }
      `}</style>
    </div>
  );
};

export default VideoDemo;