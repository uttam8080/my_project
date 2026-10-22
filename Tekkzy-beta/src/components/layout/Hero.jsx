import React from "react";
import GlowButton from "../common/GlowButton";
import { useNavigate } from "react-router-dom";
import RevealText from "../common/RevealText";
import VantaBackground from "../common/VantaBackground";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <>
      {/* Hero container over fixed Vanta.NET background */}
      <div id="hero-vanta-bg" className="relative min-h-screen flex justify-center overflow-hidden bg-transparent">

        {/* Top-aligned content */}
        <div className="relative z-10 text-center text-white px-4 max-w-4xl pt-24 md:pt-32">
          <div className="flex justify-center items-center max-w-fit mb-4 rounded-full mx-auto border border-blue-500/50 bg-black/70 py-2 px-4 text-blue-400">
            <div className="flex items-center space-x-2">
              <span className="bg-blue-600 text-white p-1 rounded-full text-sm px-2 font-medium">
                NEW
              </span>
              <span className="text-white px-3 py-1 text-sm">You Think We Create</span>
            </div>
          </div>

          {/* Main headline */}
          <RevealText delay={0.1} duration={0.8} yOffset={25}>
            <h1 className="text-5xl md:text-7xl font-bold mb-2">
              Create Your Brand
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-blue-500">
                Identity Instantly.
              </span>
            </h1>
          </RevealText>

          {/* Divider line */}
          <RevealText delay={0.25} duration={0.6} yOffset={15}>
            <div className="w-40 h-1 mx-auto my-8 bg-blue-200 rounded-full shadow-lg" />
          </RevealText>


          {/* Button */}
          <div>
            <GlowButton onClick={() => navigate("/contact")}>
              Digitize Now
            </GlowButton>
          </div>
        </div>
      </div>
    </>
  );
};

export default Hero;