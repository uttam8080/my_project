// src/components/CultureSection.jsx
import React from 'react';
import CultureCard from '../common/CultureCard';
import GlowButton from '../common/GlowButton';
import RevealText from '../common/RevealText';


const CultureSection = () => {
  const cultureCards = [
    {
      image: "/about1.png",
      date: '20 Nov 2024',
      category: 'Growth',
      title: 'Trusted By 20+ Clients',
      link: '/culture/trusted-clients'
    },
    {
      image: "/about2.png",
      date: '18 Nov 2024',
      category: 'Impact',
      title: 'We Work Together',
      link: '/culture/work-together'
    },
    {
      image: "/about3.png",
      date: '10 Nov 2024',
      category: 'Opportunity',
      title: 'Reaching your peak',
      link: '/culture/reaching-peak'
    }
  ];

  return (
    <section className="bg-transparent py-20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <RevealText delay={0.1} duration={0.8} yOffset={30}>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-3">
              More about our <span className="text-blue-400">culture</span>
            </h2>
          </RevealText>
          <RevealText delay={0.25} duration={0.8} yOffset={20}>
            <p className="text-gray-300 max-w-3xl mx-auto">
              Stay Updated on AI Trends, Automation, and Business Growth
            </p>
          </RevealText>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {cultureCards.map((card, index) => (
            <CultureCard key={index} {...card} index={index} />
          ))}
        </div>

        {/* View All Button */}
        <div className='flex place-content-center mt-12'>
        <GlowButton>View All Posts</GlowButton>
        </div>
      </div>
    </section>
  );
};

export default CultureSection;