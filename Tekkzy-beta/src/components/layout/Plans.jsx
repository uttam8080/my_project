import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RevealText from '../common/RevealText';

const fetchPlans = () => [
    {
      id: 'basic',
      title: 'Basic',
      price: 1000,
      originalPrice: 1400,
      // desc: 'Small businesses or startups looking to explore basic AI automation without upfront costs',
      features: [
        'Customization options available.',
        'Establish a strong online presence.',
        'Fast and easy page loading.',
        'Monthly billing for flexibility.',
        'Regular website maintenance.',
        'SSL certificate for secure data transmission.',
        'Stunning static website design.',
        'User-responsive and user-friendly interface.',
        'Web hosting included.',
      ],
      button: 'Choose Basic Plan',
      paymentUrl: 'https://betapayment.happyprancer.com/awsaiapp/1000008/us-east-2%3Ad6b67830-eda8-c2aa-24e9-24364363e975?childInstitution=',
      accent: 'from-blue-400 to-cyan-400',
      iconColor: 'text-blue-400',
      glowColor: 'shadow-blue-500/30',
    },
    {
      id: 'standard',
      title: 'Standard',
      price: 2500,
      originalPrice: 3600,
      // desc: 'Growing businesses that need more advanced AI capabilities and integrations',
      features: [
        'Includes all features from Basic Plan.',
        'Admin and User Member Panel.',
        'Cutting-edge technology implementation.',
        'Efficient data management for admins.',
        'Identity Management System.',
        'Professional Contact Us page.',
        'Professional Dashboard for members.',
      ],
      button: 'Choose Standard Plan',
      paymentUrl: 'https://betapayment.happyprancer.com/awsaiapp/1000009/us-east-2%3Ad6b67830-eda8-c2aa-24e9-24364363e975?childInstitution=',
      popular: true,
      accent: 'from-purple-400 to-pink-400',
      iconColor: 'text-purple-400',
      glowColor: 'shadow-purple-500/40',
    },
    {
      id: 'advanced',
      title: 'Advanced',
      price: 5000,
      originalPrice: 8800,
      // desc: 'Large businesses or enterprises requiring full customization and dedicated support',
      features: [
        'Includes all features from Standard Plan.',
        'Complete Paperless Ecosystems.',
        'Cutting-edge technology implementation.',
        'Digital Marketing, Data Analysis and SEO Integration.',
        'Google and Facebook Ads Management.',
        'Unlock true potential of your business.',
      ],
      button: 'Choose Advanced Plan',
      paymentUrl: 'https://betapayment.happyprancer.com/awsaiapp/1000007/us-east-2%3Ad6b67830-eda8-c2aa-24e9-24364363e975?childInstitution=',
      accent: 'from-amber-400 to-orange-400',
      iconColor: 'text-amber-400',
      glowColor: 'shadow-amber-500/30',
    },
  ];

const PriceWithStrike = ({ price, originalPrice }) => {
  const [isStruck, setIsStruck] = useState(false);
  const discountPercentage = Math.round(((originalPrice - price) / originalPrice) * 100);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsStruck(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-start relative">
      {/* Discount ribbon */}
      <div className="absolute -top-2 -right-2">
        <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-md shadow-lg transform rotate-6 animate-bounce-in">
          {discountPercentage}% OFF
        </div>
      </div>

      <div className="flex items-baseline space-x-2">
        <span className="text-4xl font-bold text-white animate-pop-in">
          ₹{price.toLocaleString()}
        </span>
        <span className="text-gray-400 text-sm animate-fade-in">/month</span>
      </div>
      <div className="relative mt-1">
        <span className={`text-lg text-gray-400 relative transition-all duration-1000 ${isStruck ? 'opacity-100' : 'opacity-0'}`}>
          <span className="relative inline-block">
            <span className="block">₹{originalPrice.toLocaleString()}</span>
            <span
              className={`absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-red-400 to-pink-500 transform -translate-y-1/2 origin-left transition-all duration-700 ease-out ${isStruck ? 'scale-x-100' : 'scale-x-0'}`}
              style={{
                boxShadow: isStruck ? '0 0 8px rgba(236, 72, 153, 0.6)' : 'none',
              }}
            />
          </span>
        </span>
      </div>
    </div>
  );
};

export default function PremiumPlans() {
  const plans = fetchPlans();
  const [hoveredPlan, setHoveredPlan] = useState(null);

  const [activeIndex, setActiveIndex] = useState(null);
  const navigate = useNavigate();

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const faqItems = [
    {
      question: "What makes the 'Advance' plan stand out?",
      answer: "The 'Advance' plan offers a complete paperless ecosystem, integrated payment solutions, expert ads management, digital marketing, data analysis, and SEO integration, providing a comprehensive growth package."
    },
    {
      question: "Can I switch plans as my business evolves?",
      answer: "Yes, you can easily upgrade or downgrade plans to match your changing business needs and goals."
    },
    {
      question: "Can I customize features beyond the listed options?",
      answer: "Absolutely, our plans offer customization flexibility to cater to your specific requirements. Feel free to discuss your customization needs with our team to create a tailored solution."
    }
  ];

  const handlePaymentRedirect = (url) => {
    navigate("/contact", { state: { paymentUrl: url } });
  };

  return (
    <div className="bg-transparent min-h-screen py-16 px-4 sm:px-6 relative overflow-hidden">
      {/* Luxury background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-600/10 rounded-full"></div>
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-blue-600/10 rounded-full"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Luxury Header */}
        <div className="text-center mb-16 transform transition-all duration-1000 ease-out">
          <RevealText delay={0.1} duration={0.8} yOffset={30}>
            <div className="relative inline-block">
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 relative">
                <span className="text-white">
                  Exclusive
                </span>{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">Membership</span>
                <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-full animate-underline"></span>
              </h2>
            </div>
          </RevealText>
          <RevealText delay={0.25} duration={0.8} yOffset={20}>
            <p
              className="text-gray-300 max-w-2xl mx-auto text-lg leading-relaxed font-light"
            >
              Experience unparalleled service with our premium plans, designed for those who demand excellence
            </p>
          </RevealText>
          <div
            className="mt-6 w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-500 mx-auto rounded-full opacity-80"
          ></div>
        </div>

        {/* Luxury pricing grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="relative group"
              onMouseEnter={() => setHoveredPlan(plan.id)}
              onMouseLeave={() => setHoveredPlan(null)}
            >
              {/* Luxury card glow effect */}
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${plan.accent} opacity-0 group-hover:opacity-20 blur-xl transition-all duration-700 transform group-hover:scale-105`}></div>

              {/* Luxury card border gradient */}
              <div className={`absolute inset-0 rounded-xl p-[1px] bg-gradient-to-br ${plan.accent} opacity-0 group-hover:opacity-70 transition-all duration-500`}></div>

              {/* Main luxury card */}
              <div className={`relative h-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 rounded-xl p-8 border ${plan.popular
                ? 'border-purple-500/50 shadow-2xl shadow-purple-500/30'
                : 'border-gray-800/50 group-hover:border-gray-600/50'
                } ${plan.glowColor} group-hover:shadow-2xl`}>

                {/* Luxury metallic corner accents */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gradient-to-r from-gray-500 to-gray-300 rounded-tl-xl opacity-70"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-gradient-to-r from-gray-500 to-gray-300 rounded-tr-xl opacity-70"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-gradient-to-r from-gray-500 to-gray-300 rounded-bl-xl opacity-70"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gradient-to-r from-gray-500 to-gray-300 rounded-br-xl opacity-70"></div>

                {/* Luxury plan title with icon */}
                <div className="flex items-center space-x-3 mb-6">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${plan.accent} p-[2px] transform transition-transform duration-300 group-hover:rotate-12 shadow-md`}>
                    <div className="w-full h-full bg-gray-900 rounded-md flex items-center justify-center shadow-inner">
                      <svg className={`w-5 h-5 ${plan.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className={`text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${plan.accent} transition-all duration-300 tracking-wide`}>
                    {plan.title}
                  </h3>
                </div>

                {/* Luxury price with strike-through */}
                <div className="mb-8">
                  <PriceWithStrike price={plan.price} originalPrice={plan.originalPrice} />
                  <div className={`mt-3 h-1 w-16 bg-gradient-to-r ${plan.accent} rounded-full`}></div>
                </div>

                {/* Luxury description */}
                <p className="text-gray-300 text-sm mb-8 leading-relaxed transition-colors duration-300 group-hover:text-gray-200 font-light tracking-wide">
                  {plan.desc}
                </p>

                {/* Luxury CTA button */}
                <button
                  onClick={() => handlePaymentRedirect(plan.paymentUrl)}
                  className={`w-full py-3 px-6 rounded-lg font-semibold text-sm transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-500/50 mb-8 ${plan.popular
                    ? `bg-gradient-to-r ${plan.accent} text-white shadow-lg hover:shadow-xl ${plan.glowColor} hover:shadow-purple-500/50`
                    : `bg-gradient-to-r from-gray-800 to-gray-700 text-gray-200 border border-gray-600 hover:from-gray-700 hover:to-gray-600 hover:border-gray-500 hover:text-white`
                    } relative overflow-hidden group/btn tracking-wider`}
                >
                  <span className="relative z-10 flex items-center justify-center space-x-2">
                    <span>{plan.button}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                </button>

                {/* Luxury features list */}
                <div className="mt-6 pt-6 border-t border-gray-800/50">
                  <h4 className="text-lg font-semibold text-gray-200 mb-4 flex items-center tracking-wide">
                    <svg className={`w-5 h-5 mr-2 ${plan.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Premium Features
                  </h4>
                  <ul className="space-y-3">
                    {plan.features.map((feature, fIndex) => (
                      <li
                        key={fIndex}
                        className={`flex items-start text-gray-300 transition-all duration-300 transform ${hoveredPlan === plan.id ? 'translate-x-2' : 'translate-x-0'
                          }`}
                        style={{ transitionDelay: `${fIndex * 30}ms` }}
                      >
                        <div className={`w-4 h-4 mr-3 mt-0.5 flex-shrink-0 rounded-full bg-gradient-to-r ${plan.accent} p-0.5 transform transition-transform duration-300 shadow-sm`}>
                          <div className="w-full h-full bg-gray-900 rounded-full flex items-center justify-center shadow-inner">
                            <svg className={`w-2.5 h-2.5 ${plan.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                        <span className="text-sm leading-relaxed transition-colors duration-300 group-hover:text-gray-200 font-light tracking-wide">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center max-w-3xl mx-auto px-6">
          <div className="space-y-3">
            {faqItems.map((item, index) => (
              <div
                key={index}
                className="bg-transparent rounded-lg overflow-hidden border border-gray-700/30 hover:border-gray-600/50 transition-all duration-300 backdrop-blur-sm"
              >
                <button
                  className="w-full py-4 px-5 flex justify-between items-center group"
                  onClick={() => toggleFAQ(index)}
                >
                  <h4 className="text-base font-medium text-left text-gray-100 group-hover:text-blue-300 transition-colors duration-200">
                    {item.question}
                  </h4>
                  <svg
                    className={`w-5 h-5 text-gray-400 transform transition-transform duration-300 ${activeIndex === index ? 'rotate-180 text-blue-400' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <div
                  className={`px-5 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${activeIndex === index ? 'max-h-60 pb-5' : 'max-h-0'}`}
                >
                  <div className="border-t border-gray-600/60 pt-4"> {/* Darkened divider line */}
                    <p className="text-sm text-gray-300 font-light leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <p className="text-gray-400 text-sm font-light mt-4 mb-0">
              All plans come with our <span className="text-purple-400">24/7 VIP support</span>
            </p>

          </div>
        </div>
      </div>

      {/* Add some global animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-delay {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(20px); }
        }
        @keyframes underline {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
        @keyframes bounce-in {
          0% { transform: rotate(6deg) scale(0.8); opacity: 0; }
          50% { transform: rotate(6deg) scale(1.1); }
          100% { transform: rotate(6deg) scale(1); opacity: 1; }
        }
        @keyframes pop-in {
          0% { transform: scale(0.8); opacity: 0; }
          60% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(2px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        .animate-float { animation: float 8s ease-in-out infinite; }
        .animate-float-delay { animation: float-delay 8s ease-in-out infinite 2s; }
        .animate-underline { animation: underline 1s ease-out forwards; }
        .animate-bounce-in { animation: bounce-in 0.6s ease-out forwards; }
        .animate-pop-in { animation: pop-in 0.5s ease-out forwards; }
        .animate-fade-in { animation: fade-in 0.8s ease-out forwards; }
        .animate-spin { animation: spin 1.5s linear infinite; }
        .animate-spin-reverse { animation: spin-reverse 1.5s linear infinite; }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .will-change-transform { will-change: transform, opacity; }
      `}</style>
    </div>
  );
}