import React, { useEffect, useRef } from 'react';

const VantaBackground = () => {
  const localRef = useRef(null);
  const effectRef = useRef(null);

  useEffect(() => {
    let intervalId = null;

    const initVanta = () => {
      if (window.VANTA && window.VANTA.NET && localRef.current) {
        if (!effectRef.current) {
          effectRef.current = window.VANTA.NET({
            el: localRef.current,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.0,
            minWidth: 200.0,
            scale: 1.0,
            scaleMobile: 1.0,
            color: 0xf1ff,
            backgroundColor: 0x24,
            points: 20.0,
            maxDistance: 24.0,
            spacing: 16.0,
          });
        }
        return true;
      }
      return false;
    };

    if (!initVanta()) {
      intervalId = setInterval(() => {
        if (initVanta()) {
          clearInterval(intervalId);
        }
      }, 100);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (effectRef.current) {
        effectRef.current.destroy();
        effectRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <div
        ref={localRef}
        id="vanta-background"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      {/* Low opacity black gradient overlay for depth and readability */}
      <div
        id="vanta-gradient-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 1,
          pointerEvents: 'none',
          background: 'radial-gradient(circle at center, rgba(0, 0, 0, 0.35) 0%, rgba(0, 0, 0, 0.75) 100%)',
        }}
      />
    </>
  );
};

export default VantaBackground;
