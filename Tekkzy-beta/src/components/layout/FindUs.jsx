import React from 'react';
import { Link } from 'react-router-dom';
import RevealText from '../common/RevealText';


const FindUs = () => {
    return (
        <div className="relative w-full min-h-screen bg-transparent flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8">
            {/* Animated Background Effects */}
            <div className="absolute inset-0">
                {/* Floating orbs - adjusted for mobile */}
                <div className="absolute top-10 left-4 sm:top-20 sm:left-20 w-32 h-32 sm:w-64 sm:h-64 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-2xl pointer-events-none"></div>
                <div className="absolute bottom-10 right-4 sm:bottom-20 sm:right-20 w-40 h-40 sm:w-80 sm:h-80 bg-gradient-to-r from-purple-500/15 to-pink-500/15 rounded-full blur-2xl pointer-events-none"></div>
                <div className="absolute top-1/2 left-1/4 w-24 h-24 sm:w-48 sm:h-48 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-xl pointer-events-none"></div>
                
                {/* Grid pattern - hidden on mobile for performance */}
                <div className="absolute inset-0 opacity-5 hidden sm:block">
                    <div className="grid grid-cols-12 gap-8 h-full">
                        {Array.from({ length: 144 }).map((_, i) => (
                            <div key={i} className="border border-white/10"></div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Premium Card - Mobile optimized */}
            <div className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-black rounded-2xl sm:rounded-3xl p-6 sm:p-10 lg:p-16 text-center w-full max-w-sm sm:max-w-2xl lg:max-w-4xl shadow-2xl border border-white/10 overflow-hidden group hover:shadow-blue-500/20 transition-shadow duration-300">
                
                {/* Premium Glass Effect Border */}
                <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 rounded-2xl sm:rounded-3xl overflow-hidden">
                    <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 rotate-12 animate-pulse"></div>
                    <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-cyan-500/5 via-transparent to-pink-500/5 -rotate-12 animate-pulse delay-1000"></div>
                </div>

                {/* Decorative Premium Clouds - Smaller on mobile */}
                <svg className="absolute top-4 left-4 sm:top-8 sm:left-8 w-20 h-12 sm:w-40 sm:h-24 opacity-20 text-blue-400 animate-float" viewBox="0 0 200 60" fill="currentColor">
                    <defs>
                        <linearGradient id="cloudGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="currentColor" stopOpacity="0.3"/>
                            <stop offset="100%" stopColor="currentColor" stopOpacity="0.1"/>
                        </linearGradient>
                    </defs>
                    <path d="M50,20a20,20 0 0 1 40,0h20a20,20 0 1 1 0,40H30a20,20 0 0 1 20-40z" fill="url(#cloudGradient1)" />
                </svg>
                
                <svg className="absolute top-6 right-4 sm:top-12 sm:right-8 w-24 h-14 sm:w-48 sm:h-28 opacity-15 text-purple-400 animate-float-delay" viewBox="0 0 200 60" fill="currentColor">
                    <defs>
                        <linearGradient id="cloudGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="currentColor" stopOpacity="0.2"/>
                            <stop offset="100%" stopColor="currentColor" stopOpacity="0.05"/>
                        </linearGradient>
                    </defs>
                    <path d="M60,30a15,15 0 0 1 30,0h30a15,15 0 1 1 0,30H50a15,15 0 0 1 10-30z" fill="url(#cloudGradient2)" />
                </svg>

                {/* Premium Sparkles with Better Animation - Responsive positioning */}
                <div className="absolute top-1/4 left-1/4 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-white to-blue-200 rounded-full animate-twinkle shadow-lg shadow-blue-500/50"></div>
                <div className="absolute top-1/3 right-1/4 w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-twinkle-delay shadow-lg shadow-cyan-500/50"></div>
                <div className="absolute top-1/2 left-1/3 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full animate-twinkle-slow shadow-lg shadow-pink-500/50"></div>
                <div className="absolute top-2/3 right-1/3 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-twinkle-fast shadow-lg shadow-yellow-500/50"></div>
                <div className="absolute top-1/4 right-1/3 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-twinkle-delay shadow-lg shadow-green-500/50"></div>
                <div className="absolute top-1/2 left-1/4 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full animate-twinkle-slow shadow-lg shadow-purple-500/50"></div>

                {/* Cross-shaped Premium Sparkles - Mobile responsive */}
                <div className="absolute top-12 left-8 sm:top-20 sm:left-20">
                    <div className="relative">
                        <div className="w-0.5 h-3 sm:h-4 bg-gradient-to-t from-transparent via-white to-transparent absolute -top-1.5 sm:-top-2 left-0.5 sm:left-1 animate-pulse"></div>
                        <div className="w-3 sm:w-4 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent absolute top-0.5 sm:top-1 -left-1 sm:-left-1.5 animate-pulse"></div>
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full shadow-lg shadow-white/50"></div>
                    </div>
                </div>

                <div className="absolute bottom-20 right-12 sm:bottom-32 sm:right-24">
                    <div className="relative">
                        <div className="w-0.5 h-4 sm:h-6 bg-gradient-to-t from-transparent via-cyan-400 to-transparent absolute -top-2 sm:-top-3 left-1 sm:left-1.5 animate-pulse delay-300"></div>
                        <div className="w-4 sm:w-6 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent absolute top-1 sm:top-1.5 -left-1.5 sm:-left-2.5 animate-pulse delay-300"></div>
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full shadow-lg shadow-cyan-500/50"></div>
                    </div>
                </div>

                {/* Premium Gmail Icon with Glass Effect - Mobile responsive */}
                <div className="mb-6 sm:mb-8 relative z-10 group">
                    <div className="relative">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-2xl border border-white/20 flex items-center justify-center mx-auto group-hover:scale-110 transition-all duration-500 hover:shadow-red-500/30">
                            <svg viewBox="0 0 48 48" className="w-8 h-8 sm:w-12 sm:h-12 drop-shadow-lg">
                                <path fill="#4caf50" d="M45,16.2l-5,2.75l-5,4.75L35,40h7c1.657,0,3-1.343,3-3V16.2z"/>
                                <path fill="#1e88e5" d="M3,16.2l3.614,1.71L13,23.7V40H6c-1.657,0-3-1.343-3-3V16.2z"/>
                                <polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17"/>
                                <path fill="#c62828" d="M3,12.298V16.2l10,7.5V11.2L9.876,8.859C9.132,8.301,8.228,8,7.298,8h0C4.924,8,3,9.924,3,12.298z"/>
                                <path fill="#fbc02d" d="M45,12.298V16.2l-10,7.5V11.2l3.124-2.341C38.868,8.301,39.772,8,40.702,8h0 C43.076,8,45,9.924,45,12.298z"/>
                            </svg>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-blue-500/20 rounded-xl sm:rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                </div>

                {/* Premium Typography - Mobile responsive */}
                <RevealText delay={0.1} duration={0.8} yOffset={30}>
                    <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-4 sm:mb-6 relative z-10 tracking-tight leading-tight">
                        Find Us Here
                    </h1>
                </RevealText>

                {/* Enhanced Description - Mobile responsive */}
                <RevealText delay={0.25} duration={0.8} yOffset={20}>
                    <p className="text-slate-300 text-sm sm:text-lg md:text-xl lg:text-2xl mb-8 sm:mb-12 leading-relaxed relative z-10 max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto font-light">
                        Join our <span className="text-blue-400 font-semibold">400,000+</span> person community and contribute to a more 
                        <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-semibold"> private and decentralized internet</span>. 
                        Start for free.
                    </p>
                </RevealText>

                {/* Premium Button */}
                <Link to="/contact?type=career">
                <button className="relative bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 hover:from-slate-700 hover:via-slate-600 hover:to-slate-700 text-white px-12 py-5 rounded-full font-semibold text-lg transition-all duration-500 transform hover:scale-105 border border-white/20 shadow-2xl hover:shadow-blue-500/30 backdrop-blur-sm group overflow-hidden z-10">
                    <span className="relative z-10">Contact Us</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-cyan-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-700"></div>
                </button>
                </Link>

                {/* Premium Mountains with Depth - Mobile responsive */}
                <div className="absolute bottom-0 left-0 w-full h-16 sm:h-24 lg:h-32 overflow-hidden z-0">
                    <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 120" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="mountainGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#1E293B" stopOpacity="0.9"/>
                                <stop offset="50%" stopColor="#334155" stopOpacity="0.7"/>
                                <stop offset="100%" stopColor="#0F172A" stopOpacity="0.95"/>
                            </linearGradient>
                            <linearGradient id="mountainGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#0F172A" stopOpacity="0.95"/>
                                <stop offset="50%" stopColor="#1E293B" stopOpacity="0.8"/>
                                <stop offset="100%" stopColor="#020617" stopOpacity="1"/>
                            </linearGradient>
                        </defs>
                        <path 
                            d="M0,120 L60,80 C120,40 180,100 240,60 C300,20 360,80 420,40 C480,0 540,60 600,20 C660,-20 720,40 780,20 C840,0 900,40 960,60 C1020,80 1080,60 1140,40 C1200,20 1260,40 1320,20 C1380,0 1440,40 1440,40 L1440,120 Z" 
                            fill="url(#mountainGradient1)"
                        />
                        <path 
                            d="M0,120 L120,60 C240,0 360,80 480,40 C600,0 720,60 840,20 C960,-20 1080,40 1200,20 C1320,0 1440,40 1440,40 L1440,120 Z" 
                            fill="url(#mountainGradient2)"
                        />
                    </svg>
                    
                    {/* Premium Mountain Highlights - Mobile responsive */}
                    <div className="absolute bottom-12 left-1/4 w-8 h-4 sm:bottom-16 sm:w-12 sm:h-6 lg:bottom-28 lg:w-20 lg:h-12 bg-gradient-to-r from-blue-500/20 via-cyan-500/30 to-purple-500/20 rounded-t-full blur-sm sm:blur-md"></div>
                    <div className="absolute bottom-16 right-1/3 w-10 h-5 sm:bottom-20 sm:w-14 sm:h-7 lg:bottom-32 lg:w-24 lg:h-14 bg-gradient-to-r from-indigo-500/20 via-blue-500/30 to-cyan-500/20 rounded-t-full blur-sm sm:blur-md"></div>
                    <div className="absolute bottom-8 left-1/2 w-6 h-3 sm:bottom-12 sm:w-10 sm:h-5 lg:bottom-24 lg:w-16 lg:h-10 bg-gradient-to-r from-purple-500/15 via-pink-500/25 to-blue-500/15 rounded-t-full blur-sm"></div>
                </div>

                {/* Additional Premium Mountain Sparkles - Mobile responsive */}
                <div className="absolute bottom-12 left-1/4 w-1.5 h-1.5 sm:bottom-16 lg:bottom-28 sm:w-2 sm:h-2 bg-gradient-to-r from-white to-cyan-200 rounded-full animate-twinkle shadow-lg shadow-cyan-500/50"></div>
                <div className="absolute bottom-16 right-1/3 w-2 h-2 sm:bottom-20 lg:bottom-32 sm:w-2.5 sm:h-2.5 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full animate-twinkle-delay shadow-lg shadow-blue-500/50"></div>
                <div className="absolute bottom-8 left-1/3 w-1 h-1 sm:bottom-10 lg:bottom-20 sm:w-1.5 sm:h-1.5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-twinkle-slow shadow-lg shadow-yellow-500/50"></div>
                <div className="absolute bottom-10 right-1/4 w-1.5 h-1.5 sm:bottom-12 lg:bottom-24 sm:w-2 sm:h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-twinkle-fast shadow-lg shadow-purple-500/50"></div>
            </div>

            {/* Custom Animations */}
            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-10px) rotate(2deg); }
                }
                @keyframes float-delay {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-15px) rotate(-2deg); }
                }
                @keyframes twinkle {
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.2); }
                }
                @keyframes twinkle-delay {
                    0%, 100% { opacity: 0.4; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.3); }
                }
                @keyframes twinkle-slow {
                    0%, 100% { opacity: 0.2; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.1); }
                }
                @keyframes twinkle-fast {
                    0%, 100% { opacity: 0.5; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.4); }
                }
                .animate-float { animation: float 6s ease-in-out infinite; }
                .animate-float-delay { animation: float-delay 8s ease-in-out infinite; }
                .animate-twinkle { animation: twinkle 2s ease-in-out infinite; }
                .animate-twinkle-delay { animation: twinkle-delay 2.5s ease-in-out infinite; }
                .animate-twinkle-slow { animation: twinkle-slow 3s ease-in-out infinite; }
                .animate-twinkle-fast { animation: twinkle-fast 1.5s ease-in-out infinite; }
            `}</style>
        </div>
    );
};

export default FindUs;