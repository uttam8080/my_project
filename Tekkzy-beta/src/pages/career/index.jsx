/* eslint-disable no-unused-vars */
import React from 'react';
import CultureSection from '../../components/layout/CultureSection';
import { motion } from 'framer-motion';
import ProjectsHighlight from '../../components/layout/ProjectHighlight';
import CareerHero from '../../components/layout/CareerHero';
import FindUs from '../../components/layout/FindUs';
// or import CareerHeroAdvanced from '../../components/layout/CareerHeroAdvanced';

const Career = () => {
  return (
    <div className="min-h-screen bg-transparent text-white">
      {/* Hero Section */}
      <>
      <CareerHero />
      </>
      
      {/* Projects Highlight Section */}
      <ProjectsHighlight />
      
      {/* Culture Section */}
      <CultureSection />
      <FindUs />
      
      {/* More sections as needed */}
    </div>
  );
};

export default Career;