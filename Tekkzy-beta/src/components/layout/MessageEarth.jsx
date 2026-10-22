/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "react-router-dom";
import LazyVideo from "../common/LazyVideo";

gsap.registerPlugin(ScrollTrigger);

const MessageEarth = () => {
  const [visibleMessages, setVisibleMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const sectionRef = useRef(null);

  const messages = [
    {
      id: 1,
      content: "Hello 👋, I am Pradipta Ku. Mishra, CEO of TEKKZY.",
    },
    {
      id: 2,
      content:
        "Feel free to connect with the global TEKKZY team, available worldwide to provide you with expert support wherever you are.",
    },
    {
      id: 3,
      content:
        "You can also discover our offers, browse our use cases, check our career opportunities, or simply explore the map next to it.",
    },
    {
      id: 4,
      content: "Looking forward to seeing you soon!",
    },
  ];

  // ScrollTrigger to set isActive
  useEffect(() => {
    if (!sectionRef.current) return;
    const trigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top 70%",
      end: "bottom 30%",
      onEnter: () => setIsActive(true),
      onLeaveBack: () => setIsActive(false),
    });
    return () => trigger.kill();
  }, []);

  // Animation logic: only runs when isActive is true
  useEffect(() => {
    let interval;
    if (isActive) {
      setVisibleMessages([]);
      setIsTyping(true);
      let index = 0;

      interval = setInterval(() => {
        if (index < messages.length) {
          setIsTyping(false);
          setVisibleMessages((prev) => [...prev, messages[index]]);
          index++;
          if (index < messages.length) {
            setTimeout(() => setIsTyping(true), 500);
          }
        } else {
          clearInterval(interval);
        }
      }, 1500);
    } else {
      // Reset when not active
      setVisibleMessages([]);
      setIsTyping(false);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-transparent text-white min-h-[90dvh] place-content-center">
      {/* Video container */}
      <div className="flex items-center justify-center h-[400px] md:h-[600px] relative overflow-hidden rounded-lg">
        <LazyVideo
          src="/video/holographic-earth-with-dynamic-lines.mp4"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Messages container */}
      <div className="flex flex-col space-y-6" ref={sectionRef}>
        {Array.isArray(visibleMessages) &&
          visibleMessages.map((message) => {
            if (!message) return null;
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-black/30 backdrop-blur-lg p-4 rounded-lg shadow-lg">
                <div className="flex items-start space-x-3">
                  <p className="text-white">
                    <img
                      src="/pk-sir.png"
                      alt="Profile"
                      className="w-6 h-6 rounded-full inline-block mr-2"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/40";
                      }}
                    />
                    {message.content}
                  </p>
                </div>
              </motion.div>
            );
          })}

        {/* Action buttons */}
        {Array.isArray(visibleMessages) &&
          visibleMessages.length === messages.length && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="flex flex-wrap gap-3 mt-4"
            >
              <Link to="/">
                <button className="bg-black/40 backdrop-blur-sm px-4 py-2 rounded-md text-white hover:bg-black/60 transition-colors">
                  Home
                </button>
              </Link>
              <Link to="/about">
                <button className="bg-black/40 backdrop-blur-sm px-4 py-2 rounded-md text-white hover:bg-black/60 transition-colors">
                  About Us
                </button>
              </Link>
              <Link to="/contact?type=career">
                <button className="bg-black/40 backdrop-blur-sm px-4 py-2 rounded-md text-white hover:bg-black/60 transition-colors">
                  Contact Us
                </button>
              </Link>
            </motion.div>
          )}

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-black/30 backdrop-blur-lg p-4 rounded-lg shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="flex space-x-1">
                <motion.div
                  className="w-2 h-2 bg-blue-400 rounded-full"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                />
                <motion.div
                  className="w-2 h-2 bg-blue-400 rounded-full"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
                />
                <motion.div
                  className="w-2 h-2 bg-blue-400 rounded-full"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
                />
              </div>
              <p className="text-gray-400 text-sm">
                <img
                  src="/pk-sir.png"
                  alt="Typing Indicator"
                  className="w-6 h-6 rounded-full inline-block mr-2"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/40";
                  }}
                />
                PK is typing...</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MessageEarth;