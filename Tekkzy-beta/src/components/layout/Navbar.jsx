import { Link, useLocation } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';
import { gsap } from 'gsap';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../context/ApiContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { userData } = useApi();
  const profileName = userData?.name || userData?.email || '';
  const profileInitial = profileName.trim().charAt(0).toUpperCase() || 'U';
  const profileImage = userData?.imgUrl || userData?.image;

  // Refs for GSAP animations
  const navLinksContainerRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const hamburgerRef = useRef(null);
  const navLinksRef = useRef([]);
  const logoRef = useRef(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
    // Scroll to top on route change
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Initial animation for navigation bar (Home, About, Contact)
  useEffect(() => {
    if (navLinksContainerRef.current) {
      // Animate the navigation container on load
      gsap.fromTo(
        navLinksContainerRef.current,
        { y: -30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power2.out", delay: 0.3 }
      );

      // Animate individual navigation links
      const links = navLinksContainerRef.current.querySelectorAll("a");
      gsap.fromTo(
        links,
        { y: -20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.15,
          ease: "power2.out",
          delay: 0.5,
        }
      );
    }
  }, []);

  // Mobile menu animation
  useEffect(() => {
    if (mobileMenuRef.current) {
      if (isMenuOpen) {
        // Animate mobile menu container
        gsap.fromTo(
          mobileMenuRef.current,
          { y: -20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" }
        );

        // Animate mobile menu links
        const mobileLinks = mobileMenuRef.current.querySelectorAll("a");
        gsap.fromTo(
          mobileLinks,
          { x: -30, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.4,
            stagger: 0.1,
            ease: "power2.out",
            delay: 0.1,
          }
        );
      }
    }
  }, [isMenuOpen]);

  // Hamburger button animation
  useEffect(() => {
    if (hamburgerRef.current) {
      gsap.to(hamburgerRef.current, {
        rotation: isMenuOpen ? 180 : 0,
        scale: isMenuOpen ? 1.1 : 1,
        duration: 0.3,
        ease: "power2.out",
      });
    }
  }, [isMenuOpen]);

  useEffect(() => {
  if (logoRef.current) {
    gsap.fromTo(logoRef.current,
      { scale: 0.8, opacity: 0, y: -10 },
      { scale: 1, opacity: 1, y: 0, duration: 0.6, ease: "power2.out", delay: 0.2 }
    );
  }
}, []);


  // Check if current path matches the link
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Add refs to navigation links for hover effects
  const addToRefs = (el) => {
    if (el && !navLinksRef.current.includes(el)) {
      navLinksRef.current.push(el);
    }
  };

  // Desktop navigation link hover effects
  const handleDesktopLinkHover = (e, isEntering) => {
    if (window.innerWidth >= 768) {
      gsap.to(e.currentTarget, {
        scale: isEntering ? 1.05 : 1,
        y: isEntering ? -2 : 0,
        duration: 0.3,
        ease: "power2.out",
      });
    }
  };

  // Mobile navigation link hover effects
  const handleMobileLinkHover = (e, isEntering) => {
    if (window.innerWidth < 768) {
      gsap.to(e.currentTarget, {
        x: isEntering ? 5 : 0,
        duration: 0.2,
        ease: "power2.out",
      });
    }
  };

  return (
    <nav className="bg-black px-4 sm:px-6 py-3.5 sticky top-0 z-50">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <Link
          to="/"
          ref={logoRef}
          className="flex items-center hover:opacity-80 transition-opacity duration-200"
          onClick={() => window.scrollTo(0, 0)}>
          <img
            src="/logos/t1.png"
            alt="Tekkzy Logo"
            className="h-8 sm:h-10 w-auto object-contain"
          />
          <span className="text-xl sm:text-2xl font-semibold bg-gradient-to-r from-blue-400 via-white to-blue-500 text-transparent bg-clip-text">
            ekkzy
          </span>
        </Link>


        {/* Navigation Links - centered */}
        <div className={`${isMenuOpen ? 'block' : 'hidden'} md:block absolute md:relative top-16 md:top-0 left-0 w-full md:w-auto bg-[#0e0e0e] md:bg-transparent z-50 border-b border-gray-700 md:border-0 transition-all duration-300`}>
          <div
            ref={isMenuOpen ? mobileMenuRef : navLinksContainerRef}
            className="flex flex-col md:flex-row items-center bg-[#0e0e0e] md:bg-[#0e0e0e] rounded-none md:rounded-full gap-4 md:gap-8 lg:gap-20 px-4 py-3 md:py-2 border-0 md:border border-gray-700">
            <Link
              ref={addToRefs}
              to="/"
              className={`${isActive('/') ? 'text-blue-400' : 'text-white hover:text-blue-400'} transition-colors duration-200 font-medium px-4 py-2 md:py-0 w-full text-center md:w-auto`}
              onClick={() => window.scrollTo(0, 0)}
              onMouseEnter={(e) => {
                handleDesktopLinkHover(e, true);
                handleMobileLinkHover(e, true);
              }}
              onMouseLeave={(e) => {
                handleDesktopLinkHover(e, false);
                handleMobileLinkHover(e, false);
              }}
            >
              Home
            </Link>
            <Link
              ref={addToRefs}
              to="/product"
              className={`${isActive('/product') ? 'text-blue-400' : 'text-white hover:text-blue-400'} transition-colors duration-200 font-medium px-4 py-2 md:py-0 w-full text-center md:w-auto`}
              onClick={() => window.scrollTo(0, 0)}
              onMouseEnter={(e) => {
                handleDesktopLinkHover(e, true);
                handleMobileLinkHover(e, true);
              }}
              onMouseLeave={(e) => {
                handleDesktopLinkHover(e, false);
                handleMobileLinkHover(e, false);
              }}
            >
              Products
            </Link>
            <Link
              ref={addToRefs}
              to="/about"
              className={`${
                isActive("/about")
                  ? "text-blue-400"
                  : "text-white hover:text-blue-400"
              } transition-colors duration-200 font-medium px-4 py-2 md:py-0 w-full text-center md:w-auto`}
              onClick={() => window.scrollTo(0, 0)}
              onMouseEnter={(e) => {
                handleDesktopLinkHover(e, true);
                handleMobileLinkHover(e, true);
              }}
              onMouseLeave={(e) => {
                handleDesktopLinkHover(e, false);
                handleMobileLinkHover(e, false);
              }}>
              About Us
            </Link>
            {/* <Link
              to="/career"
              className={`${isActive('/career') ? 'text-blue-400' : 'text-white hover:text-blue-400'} transition-colors duration-200 font-medium px-4 py-2 md:py-0 w-full text-center md:w-auto`}
              onClick={() => window.scrollTo(0, 0)}
            >
              Career
            </Link> */}
            <Link
              ref={addToRefs}
              to="/contact?type=career"
              className={`${
                isActive("/contact")
                  ? "text-blue-400"
                  : "text-white hover:text-blue-400"
              } transition-colors duration-200 font-medium px-4 py-2 md:py-0 w-full text-center md:w-auto`}
              onClick={() => window.scrollTo(0, 0)}
              onMouseEnter={(e) => {
                handleDesktopLinkHover(e, true);
                handleMobileLinkHover(e, true);
              }}
              onMouseLeave={(e) => {
                handleDesktopLinkHover(e, false);
                handleMobileLinkHover(e, false);
              }}>
              Contact
            </Link>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3 md:gap-4 md:w-[124px] md:justify-end">
          {isAuthenticated && (
            <Link to="/dashboard/sites" className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-full overflow-hidden border-2 border-transparent hover:border-blue-400 transition-colors duration-200 shrink-0">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="h-full w-full bg-[#474343] text-gray-200 flex items-center justify-center text-sm sm:text-base font-semibold">
                  {profileInitial}
                </span>
              )}
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            ref={hamburgerRef}
            className="md:hidden text-white focus:outline-none shrink-0"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <FaTimes className="w-6 h-6" />
            ) : (
              <FaBars className="w-6 h-6" />
            )}
          </button>

          {/* This empty div maintains the space on the right to keep the logo and nav centered */}
          {!isAuthenticated && (
            <div className="hidden md:block invisible">
              <img
                src="/logos/tekkzy.jpg"
                alt="Tekkzy Logo"
                className="h-10 w-auto object-contain"
              />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
