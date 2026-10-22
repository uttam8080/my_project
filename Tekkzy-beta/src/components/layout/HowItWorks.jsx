import React, { useEffect, useRef } from 'react';
import { MessageCircle, Settings, Rocket, CreditCard, Share } from 'lucide-react';
import { Link } from 'react-router-dom';
import RevealText from '../common/RevealText';


const HowItWorks = () => {
    const containerRef = useRef(null);
    const lineRef = useRef(null);

    const steps = [
        {
            number: 1,
            title: "Choose a Plan",
            description: "Select the perfect plan that fits your needs. We offer flexible pricing options for businesses of all sizes.",
            icon: CreditCard,
            gradient: "from-purple-600 to-blue-600"
        },
        {
            number: 2,
            title: "Chat with Us",
            description: "Connect with our expert team to discuss your vision, requirements, and goals for your website project.",
            icon: MessageCircle,
            gradient: "from-blue-600 to-purple-600"
        },
        {
            number: 3,
            title: "Share the Data",
            description: "Provide us with your content, branding materials, and any specific requirements to bring your vision to life.",
            icon: Share,
            gradient: "from-purple-600 to-pink-600"
        },
        {
            number: 4,
            title: "Customize Your Website",
            description: "Work with our designers to refine and customize every aspect of your website to match your brand perfectly.",
            icon: Settings,
            gradient: "from-pink-600 to-purple-600"
        },
        {
            number: 5,
            title: "Launch the Website",
            description: "Go live with your stunning new website and start attracting customers with your professional online presence.",
            icon: Rocket,
            gradient: "from-purple-600 to-indigo-600"
        }
    ];

    useEffect(() => {
        // Draw the timeline from the scroll position without re-rendering React.
        let frame = 0;
        const applyLine = () => {
            frame = 0;
            const container = containerRef.current;
            const line = lineRef.current;
            if (!container || !line) return;
            const rect = container.getBoundingClientRect();
            const scrollTop = Math.max(0, -rect.top);
            const scrollable = Math.max(1, container.offsetHeight - window.innerHeight + 100);
            const progress = Math.min(scrollTop / scrollable, 1);
            line.style.height = `${progress * 100}%`;
        };
        const handleScroll = () => {
            if (!frame) frame = requestAnimationFrame(applyLine);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        applyLine();

        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (frame) cancelAnimationFrame(frame);
        };
    }, []);

    return (
        <div ref={containerRef} className="bg-transparent relative overflow-hidden">
            {/* Floating background shapes */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-10 left-5 w-20 h-20 bg-purple-600/20 rounded-full blur-xl"></div>
                <div className="absolute top-20 right-10 w-24 h-24 bg-blue-600/20 rounded-full blur-xl"></div>
                <div className="absolute bottom-20 left-10 w-18 h-18 bg-pink-600/20 rounded-full blur-xl"></div>
                <div className="absolute bottom-10 right-5 w-22 h-22 bg-purple-600/20 rounded-full blur-xl"></div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 py-16 md:py-24 relative z-10">
                {/* Header */}
                <div className="text-center mb-16 md:mb-24">
                    <RevealText delay={0.1} duration={0.8} yOffset={30}>
                        <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white via-purple-400 to-blue-400 bg-clip-text text-transparent mb-4 leading-tight">
                            How It Works
                        </h2>
                    </RevealText>
                    <RevealText delay={0.25} duration={0.8} yOffset={20}>
                        <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
                            Transform your vision into reality with our streamlined 5-step process.
                        </p>
                    </RevealText>
                </div>

                {/* Steps Container */}
                <div className="relative max-w-4xl mx-auto">
                    {/* KEY CHANGE: Responsive Connection Line */}
                    {/* On mobile, line is on the left. On desktop (md), it's in the center. */}
                    <div className="absolute top-0 h-full w-0.5 bg-gray-700/50 left-6 md:left-1/2 md:-translate-x-1/2">
                        <div
                            ref={lineRef}
                            className="w-full bg-gradient-to-b from-purple-500 via-blue-500 to-pink-500"
                            style={{ height: '0%' }}
                        ></div>
                    </div>

                    {/* Steps */}
                    {steps.map((step, index) => {
                        const IconComponent = step.icon;
                        const isEven = index % 2 === 1;

                        return (
                            // KEY CHANGE: Outer container is now just relative with margin
                            <div
                                key={step.number}
                                className="relative mb-12 md:mb-16"
                            >
                                {/* KEY CHANGE: Responsive Step Number Circle */}
                                {/* On mobile, it sits on the left line. On desktop, it moves to the center. */}
                                <div className="absolute top-4 md:top-1/2 left-6 md:left-1/2 transform -translate-x-1/2 md:-translate-y-1/2 z-20">
                                    <div
                                        className={`w-14 h-14 rounded-full bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-xl border-2 border-white/20`}
                                    >
                                        <span className="text-xl font-bold text-white">{step.number}</span>
                                    </div>
                                </div>
                                
                                {/* KEY CHANGE: Wrapper for desktop flex layout */}
                                <div className={`md:flex items-center ${isEven ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
                                    {/* Step Content */}
                                    {/* KEY CHANGE: Responsive width, padding, and text alignment */}
                                    <div className={`w-full md:w-5/12 text-left 
                                        pl-20 md:pl-0 ${isEven ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
                                        
                                        <div
                                            className={`step-icon inline-block p-3 rounded-xl bg-gradient-to-br ${step.gradient} mb-3 shadow-lg`}
                                        >
                                            <IconComponent size={24} className="text-white" />
                                        </div>
                                        <h3
                                            className="text-2xl font-bold text-white mb-2"
                                        >
                                            {step.title}
                                        </h3>
                                        <p
                                            className="text-gray-300 text-base leading-relaxed"
                                        >
                                            {step.description}
                                        </p>
                                    </div>

                                    {/* KEY CHANGE: Spacer for desktop view. Hidden on mobile. */}
                                    <div className="hidden md:block md:w-5/12"></div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Call to Action */}
                <div className="text-center mt-16 md:mt-24">
                    <div className="inline-block">
                        <Link to="/contact">
                            {/* KEY CHANGE: Responsive button size */}
                            <button className="px-8 py-3 md:px-12 md:py-4 bg-gradient-to-r from-purple-600 to-blue-800 text-white font-bold text-base md:text-lg rounded-full hover:from-purple-700 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-purple-500/25 animate-pulse-subtle">
                                Get Started Today
                            </button>
                        </Link>
                    </div>
                </div>

            </div>

            {/* Custom CSS Animations (No changes needed here) */}
            <style jsx>{`
        @keyframes float-1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(-3deg); }
        }
        @keyframes float-3 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(4deg); }
        }
        @keyframes float-4 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-35px) rotate(-2deg); }
        }
        @keyframes float-icon-1 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes float-icon-2 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float-icon-3 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes float-icon-4 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes float-icon-5 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-9px); }
        }
        @keyframes pulse-subtle {
          0%, 100% { box-shadow: 0 0 20px rgba(147, 51, 234, 0.3); }
          50% { box-shadow: 0 0 30px rgba(147, 51, 234, 0.5); }
        }
        .animate-float-1 { animation: float-1 6s ease-in-out infinite; }
        .animate-float-2 { animation: float-2 8s ease-in-out infinite; }
        .animate-float-3 { animation: float-3 7s ease-in-out infinite; }
        .animate-float-4 { animation: float-4 9s ease-in-out infinite; }
        .animate-float-icon-1 { animation: float-icon-1 3s ease-in-out infinite; }
        .animate-float-icon-2 { animation: float-icon-2 3.5s ease-in-out infinite 0.2s; }
        .animate-float-icon-3 { animation: float-icon-3 2.8s ease-in-out infinite 0.4s; }
        .animate-float-icon-4 { animation: float-icon-4 3.2s ease-in-out infinite 0.6s; }
        .animate-float-icon-5 { animation: float-icon-5 3.8s ease-in-out infinite 0.8s; }
        .animate-pulse-subtle { animation: pulse-subtle 3s ease-in-out infinite; }
      `}</style>
        </div>
    );
};

export default HowItWorks;