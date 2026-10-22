/* eslint-disable no-unused-vars */
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import RotatingWheel from "./RotatingWheel";
import QuestionCard from "./QuestionCard";
import { questions } from "./constants";
import { useEffect, useRef, useState } from "react";
import GoogleSearchAnimation from "./GoogleSearchAnimation";

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

const WhyTekkzy = () => {
  const [showGoogleSearch, setShowGoogleSearch] = useState(true);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [visibleCards, setVisibleCards] = useState([0]);
  const sectionRef = useRef(null);
  const wheelContainerRef = useRef(null);
  const cardsContainerRef = useRef(null);
  const activeIndexRef = useRef(activeQuestionIndex);

  // Keep ref in sync with state
  useEffect(() => {
    activeIndexRef.current = activeQuestionIndex;
  }, [activeQuestionIndex]);

  useEffect(() => {
    if (!sectionRef.current || !wheelContainerRef.current) return;

    // Clean up previous triggers
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());

    // Main trigger for card activation
    const mainTrigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top center",
      end: "80% center",
      scrub: 1,
      onUpdate: (self) => {
        const totalSegments = questions.length;
        const segmentSize = 1 / totalSegments;
        let newIndex = 0;
        for (let i = 0; i < totalSegments; i++) {
          const segmentStart = i * segmentSize;
          const segmentEnd = (i + 1) * segmentSize;
          if (self.progress >= segmentStart && self.progress < segmentEnd) {
            newIndex = i;
            break;
          }
          if (i === totalSegments - 1 && self.progress >= segmentStart) {
            newIndex = i;
          }
        }
        if (newIndex !== activeIndexRef.current) {
          setActiveQuestionIndex(newIndex);
          setVisibleCards([newIndex]);
        }
      },
    });

    // Wheel rotation trigger
    const wheelRotationTrigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top center",
      end: "80% center",
      scrub: 1,
      onUpdate: (self) => {
        const rotation = (-self.progress * 360 * (questions.length - 1)) / questions.length;
        const wheelSVG = wheelContainerRef.current?.querySelector("svg");
        if (wheelSVG) {
          gsap.to(wheelSVG, { rotation, duration: 0.4, ease: "power2.out" });
        }
      },
    });

    return () => {
      mainTrigger.kill();
      wheelRotationTrigger.kill();
    };
  }, [questions.length]);

  // Handle manual question selection
  const handleQuestionClick = (index) => {
    setActiveQuestionIndex(index);
    setVisibleCards([index]);

    // Animate wheel rotation manually
    const wheelSVG = wheelContainerRef.current?.querySelector("svg");
    if (wheelSVG) {
      gsap.to(wheelSVG, {
        rotation: -index * (360 / questions.length),
        duration: 0.8,
        ease: "power2.out",
      });
    }

    // Scroll to appropriate position
    const section = sectionRef.current;
    const sectionHeight = section.offsetHeight;
    const scrollTo =
      window.scrollY +
      section.getBoundingClientRect().top +
      (sectionHeight * index) / questions.length;

    window.scrollTo({
      top: scrollTo,
      behavior: "smooth",
    });
  };

  return (
    <>
      <AnimatePresence>
        {showGoogleSearch && (
          <GoogleSearchAnimation
            onComplete={() => setShowGoogleSearch(false)}
          />
        )}
      </AnimatePresence>
      <section
        ref={sectionRef}
        className="relative py-12 lg:py-24 px-4 bg-transparent text-white min-h-[auto] lg:min-h-[100vh]">
        <div className="container mx-auto relative">
          {/* Section heading */}
          <div className="mb-16 text-center lg:text-right lg:max-w-3xl lg:ml-auto">
            <h2 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-8">
              <span className="bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
                Why Tekkzy
              </span>
            </h2>
            <p className="text-gray-300 max-w-2xl lg:ml-auto lg:text-right">
              Enterprise-grade integration with any feedback channel. Take
              advantage of our CSV importer or API.
            </p>
          </div>


          {/* Content container with wheel and cards */}
          <div className="relative flex flex-col lg:items-end">
            {/* Wheel container - with sticky position */}
            <div
              ref={wheelContainerRef}
              className="hidden lg:block lg:absolute lg:-top-60 lg:left-0 lg:w-[900px] lg:h-[900px] lg:-translate-x-[calc(70%+2rem)] z-10">
              <RotatingWheel activeQuestionIndex={activeQuestionIndex} />
            </div>

            {/* Cards Grid */}
            <div ref={cardsContainerRef} className="w-full lg:max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 relative">
                <AnimatePresence mode="wait">
                  {questions.map(
                    (item, index) =>
                      visibleCards.includes(index) && (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.6 }}
                          className="col-span-2">
                          <QuestionCard
                            question={item.question}
                            answer={item.answer}
                            icon={item.icon}
                            index={index}
                            isActive={index === activeQuestionIndex}
                            onClick={() => handleQuestionClick(index)}
                          />
                        </motion.div>
                      )
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile indicator */}
              <div className="mt-12 flex justify-center lg:justify-end">
                <div className="flex space-x-4">
                  {questions.map((_, index) => (
                    <button
                      key={index}
                      className={`w-3 h-3 rounded-full transition-colors duration-300 ${index === activeQuestionIndex
                          ? "bg-blue-500 shadow-lg shadow-blue-500/50"
                          : "bg-gray-600 hover:bg-gray-500"
                        }`}
                      onClick={() => handleQuestionClick(index)}
                      aria-label={`Go to question ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default WhyTekkzy;