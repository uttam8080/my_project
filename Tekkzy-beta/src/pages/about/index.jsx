// filepath: d:\Internship\Intelligent Cloud Intern\tekkzy\src\pages\about\index.jsx
import React from 'react';
import MessageEarth from '../../components/layout/MessageEarth';
import AboutHero from '../../components/layout/AboutHero';
import WhyTekkzy from '../../components/layout/WhyTekkzy';

const About = () => {
  return (
    <>
    <div className="about-page">
      <AboutHero />
      <WhyTekkzy />
      <MessageEarth />
    </div>
    </>
  );
};

export default About;