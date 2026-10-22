import { gsap } from "gsap";

// Animation durations
export const ANIMATION_DURATIONS = {
  fadeIn: 0.5,
  fadeOut: 0.5,
  rotate: 1.2,
  typing: 0.15,
};

// Easing functions
export const EASING_FUNCTIONS = {
  easeInOut: "power1.inOut",
  easeOut: "power2.out",
};

// GSAP animation configurations
export const animateFadeIn = (element) => {
  gsap.fromTo(element, { opacity: 0 }, { opacity: 1, duration: ANIMATION_DURATIONS.fadeIn, ease: EASING_FUNCTIONS.easeInOut });
};

export const animateFadeOut = (element) => {
  gsap.to(element, { opacity: 0, duration: ANIMATION_DURATIONS.fadeOut, ease: EASING_FUNCTIONS.easeOut });
};

export const animateRotation = (element, rotation) => {
  gsap.to(element, { rotation: rotation, duration: ANIMATION_DURATIONS.rotate, ease: EASING_FUNCTIONS.easeInOut });
};

export const animateTyping = (element, text, callback) => {
  const chars = text.split("");
  let index = 0;

  const typeNextChar = () => {
    if (index < chars.length) {
      element.textContent += chars[index++];
      setTimeout(typeNextChar, ANIMATION_DURATIONS.typing * 1000);
    } else if (callback) {
      callback();
    }
  };

  typeNextChar();
};