import React, { useState } from 'react';
import { Plus, Minus, HelpCircle } from 'lucide-react';
import RevealText from '../common/RevealText';

const FAQSection = () => {
  const [openFAQ, setOpenFAQ] = useState(null);

  const faqs = [
    {
      id: 1,
      question: "How long does it take to build a website?",
      answer: "The timeline depends on the complexity of your project. A standard business website typically takes 1-2 weeks, while more complex projects with custom features may take 3-4 weeks. We'll provide you with a detailed timeline during our initial consultation."
    },
    {
      id: 2,
      question: "How do I connect with your website development team?",
      answer: "Connecting with our website development team is easy! Simply fill out the form on our website and pay the first month's fee. Our team will get to work on developing a prototype of your website within 15 days of receiving your completed form. Once the prototype is approved, we will work to have your website fully developed and ready to launch within a month."
    },
    {
      id: 3,
      question: "What if I want changes made to my website after it has launched?",
      answer: "We offer ongoing website maintenance and support services to our clients. If you need changes made to your website after it has launched, simply contact our team and we will work with you to make the necessary updates."
    },
    {
      id: 4,
      question: "Do you offer website hosting services?",
      answer: "Yes, we offer website hosting services to our clients. Our hosting services include website backups, security updates, and ongoing support to ensure that your website is always up and running smoothly."
    },
    {
      id: 5,
      question: "What if I have questions during the website development process?",
      answer: "We pride ourselves on providing excellent customer service and support to our clients. If you have any questions or concerns during the website development process, simply reach out to our team and we will be happy to assist you."
    }
  ];

  const toggleFAQ = (id) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  return (
    <div className="bg-transparent relative overflow-hidden">
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-8 w-24 h-24 bg-purple-600/8 rounded-full"></div>
        <div className="absolute top-32 right-12 w-32 h-32 bg-blue-600/8 rounded-full"></div>
        <div className="absolute bottom-20 left-16 w-20 h-20 bg-pink-600/8 rounded-full"></div>
        <div className="absolute bottom-40 right-8 w-28 h-28 bg-indigo-600/8 rounded-full"></div>
        <div className="absolute top-1/2 left-4 w-16 h-16 bg-purple-600/6 rounded-full"></div>
      </div>

      <div className="container mx-auto px-6 py-16 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <RevealText delay={0.1} duration={0.8} yOffset={30}>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-purple-400 to-blue-400 bg-clip-text text-transparent mb-4 leading-tight">
              Frequently Asked Questions
            </h2>
          </RevealText>
        </div>

        {/* FAQ Container */}
        <div className="max-w-4xl mx-auto">
          {faqs.map((faq) => {
            const isOpen = openFAQ === faq.id;
            
            return (
              <div
                key={faq.id}
                className="mb-6"
              >
                <div className={`relative group transition-all duration-500 ease-out ${
                  isOpen ? 'transform scale-102' : 'hover:scale-101'
                }`}>
                  {/* Glow effect */}
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-pink-600/20 blur-xl transition-all duration-500 ${
                    isOpen ? 'opacity-100 scale-105' : 'opacity-0 group-hover:opacity-50 scale-100'
                  }`}></div>
                  
                  {/* FAQ Card */}
                  <div className={`relative border border-white/10 rounded-2xl ${
                    isOpen 
                      ? 'bg-gradient-to-br from-gray-800/90 via-gray-900/90 to-purple-900/90 border-purple-500/30 shadow-2xl' 
                      : 'bg-gradient-to-br from-gray-800/60 via-gray-900/60 to-gray-800/60 hover:border-purple-500/20 hover:bg-gray-800/80'
                  }`}>
                    
                    {/* Question */}
                    <button
                      onClick={() => toggleFAQ(faq.id)}
                      className="w-full text-left p-6 focus:outline-none group"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className={`text-xl font-semibold text-white pr-4 transition-all duration-300 ${
                          isOpen ? 'text-purple-300' : 'group-hover:text-purple-400'
                        }`}>
                          {faq.question}
                        </h3>
                        
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ease-out ${
                          isOpen 
                            ? 'bg-gradient-to-br from-purple-500 to-blue-500 rotate-180 scale-110' 
                            : 'bg-gradient-to-br from-gray-600 to-gray-700 group-hover:from-purple-600 group-hover:to-blue-600 hover:scale-110'
                        }`}>
                          {isOpen ? (
                            <Minus size={16} className="text-white" />
                          ) : (
                            <Plus size={16} className="text-white" />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Answer */}
                    <div className={`overflow-hidden transition-all duration-700 ease-out ${
                      isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      <div className={`px-6 pb-6 transition-all duration-500 ease-out delay-100 ${
                        isOpen ? 'translate-y-0' : 'translate-y-4'
                      }`}>
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent mb-4"></div>
                        <p className="text-gray-300 leading-relaxed text-base">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom CSS Animations */}
      <style jsx>{`
        @keyframes float-bg-1 {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          33% { transform: translateY(-15px) translateX(10px) rotate(2deg); }
          66% { transform: translateY(-8px) translateX(-5px) rotate(-1deg); }
        }
        @keyframes float-bg-2 {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          33% { transform: translateY(-20px) translateX(-8px) rotate(-2deg); }
          66% { transform: translateY(-10px) translateX(12px) rotate(1deg); }
        }
        @keyframes float-bg-3 {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          33% { transform: translateY(-12px) translateX(15px) rotate(3deg); }
          66% { transform: translateY(-18px) translateX(-10px) rotate(-2deg); }
        }
        @keyframes float-bg-4 {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          33% { transform: translateY(-25px) translateX(-12px) rotate(-1deg); }
          66% { transform: translateY(-5px) translateX(8px) rotate(2deg); }
        }
        @keyframes float-bg-5 {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          50% { transform: translateY(-30px) translateX(20px) rotate(4deg); }
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes pulse-gentle {
          0%, 100% { box-shadow: 0 0 15px rgba(147, 51, 234, 0.3); }
          50% { box-shadow: 0 0 25px rgba(147, 51, 234, 0.5); }
        }
        .animate-float-bg-1 { animation: float-bg-1 12s ease-in-out infinite; }
        .animate-float-bg-2 { animation: float-bg-2 15s ease-in-out infinite; }
        .animate-float-bg-3 { animation: float-bg-3 10s ease-in-out infinite; }
        .animate-float-bg-4 { animation: float-bg-4 18s ease-in-out infinite; }
        .animate-float-bg-5 { animation: float-bg-5 8s ease-in-out infinite; }
        .animate-bounce-subtle { animation: bounce-subtle 3s ease-in-out infinite; }
        .animate-pulse-gentle { animation: pulse-gentle 4s ease-in-out infinite; }
        .scale-98 { transform: scale(0.98); }
        .scale-101 { transform: scale(1.01); }
        .scale-102 { transform: scale(1.02); }
      `}</style>
    </div>
  );
};

export default FAQSection;