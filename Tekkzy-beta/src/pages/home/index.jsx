import React from 'react'
import Scroll from '../../components/layout/Scroll';
import Plans from '../../components/layout/Plans';
import Testimonials from '../../components/layout/Testimonials';
import FindUs from '../../components/layout/FindUs';
import VideoDemo from '../../components/layout/VideoDemo';
import OurServices from '../../components/layout/OurServices';
import Hero from '../../components/layout/Hero';
import HowItWorks from '../../components/layout/HowItWorks';
import FAQSection from '../../components/layout/FAQSection';

const Home = () => {
  return (
        <>
      <Hero />
      <Scroll />
      <OurServices />
      <VideoDemo />
      <HowItWorks />
      <Plans />
      <Testimonials />
      <FAQSection />
      <FindUs />

    </>
  )
}

export default Home;