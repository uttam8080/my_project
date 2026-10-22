import React from "react";
import {
  Database,
  ArrowRight,
  Brain,
  Zap,
  Shield,
  Cloud,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import RevealText from "../common/RevealText";

const OurServices = () => {
  const services = [
    {
      id: 1,
      number: "01",
      title: "User interface & User experience",
      description:
        "UI: Elegant design, intuitive interactions.UX: Purposeful journeys, foreseeing needs, meaningful engagements, delightful digital connections.",
      icon: Database,
      gradient: "from-blue-600 to-purple-500",
      shadowColor: "rgba(59,130,246,0.4)",
      route: "/service?service=User_interface",
    },
    {
      id: 2,
      number: "02",
      title: "Personalization",
      description:
        "With personalization, we craft unique journeys for every customer, aligning their preferences with our offerings to create unparalleled satisfaction and brand loyalty.",
      icon: Brain,
      gradient: "from-emerald-600 to-teal-500",
      shadowColor: "rgba(16,185,129,0.4)",
      route: "/service?service=Personalization",
    },
    {
      id: 3,
      number: "03",
      title: "Login & identity managment",
      description:
        "Advanced Identity Solutions: Optimize user authentication, authorization, and tracking with our cutting-edge login and identity management.",
      icon: Zap,
      gradient: "from-amber-600 to-orange-500",
      shadowColor: "rgba(245,158,11,0.4)",
      route: "/service?service=identity",
    },
    {
      id: 4,
      number: "04",
      title: "Trade Specific features",
      description:
        "Our services offer industry-specific features, empowering businesses with tools and functionalities optimized for success in their respective fields.",
      icon: Shield,
      gradient: "from-rose-600 to-pink-500",
      shadowColor: "rgba(244,63,94,0.4)",
      route: "/service?service=trade",
    },
    {
      id: 5,
      number: "05",
      title: "Leads & customer tracking",
      description:
        "Gain valuable leads and track customer interactions. Leverage data-driven insights for effective business growth and improved customer engagement.",
      icon: Cloud,
      gradient: "from-indigo-600 to-cyan-500",
      shadowColor: "rgba(79,70,229,0.4)",
      route: "/service?service=customer",
    },
    {
      id: 6,
      number: "06",
      title: "Payments",
      description:
        "Secure and Convenient Payments: Experience hassle-free transactions with our trusted payment solutions, ensuring data security and peace of mind with seamless transactions.",
      icon: Users,
      gradient: "from-violet-600 to-fuchsia-500",
      shadowColor: "rgba(139,92,246,0.4)",
      route: "/service?service=payment",
    },
  ];

  return (
    <div className="min-h-[300vh] md:min-h-[400vh] bg-transparent relative">
      {/* Static Header */}
      <div className="h-[30vh] md:h-[40vh] flex flex-col items-center justify-center px-4 sm:px-6 relative">
        <div className="text-center z-10 px-4">
          <RevealText delay={0.1} duration={0.8} yOffset={30}>
            <h1 className="text-white text-3xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6 tracking-tight">
              Our{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                Premium Services
              </span>
            </h1>
          </RevealText>
          <RevealText delay={0.25} duration={0.8} yOffset={25}>
            <p className="text-gray-300 text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-relaxed font-light">
              Discover seamless AI integration and unparalleled workflow
              optimization tailored to elevate your enterprise.
            </p>
          </RevealText>
        </div>
      </div>

      {/* Stacked Cards Section */}
      <div className="relative px-4 sm:px-6">
        {services.map((service) => {
          const IconComponent = service.icon;

          return (
            <div key={service.id} className="sticky top-60">
              <div
                className="relative w-full max-w-5xl mx-auto bg-gradient-to-br from-gray-950 to-gray-900 rounded-2xl px-6 sm:px-8 md:px-12 py-8 sm:py-12 md:py-16 border border-white/20 overflow-hidden transition-colors duration-300 hover:border-white/40 group shadow-[0_0_60px_rgba(0,0,0,0.6)]"
                style={{
                  boxShadow: `0 0 60px ${service.shadowColor}, 0 20px 40px rgba(0,0,0,0.4), inset 0 0 40px rgba(255,255,255,0.05)`,
                }}
              >
                {/* Luxury Background Elements */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-2xl"></div>
                  <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-white/10 to-transparent rounded-full blur-2xl"></div>
                </div>

                {/* Animated Background Gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-15 transition-opacity duration-700 rounded-2xl`}
                ></div>

                <div className="flex flex-col lg:flex-row items-center justify-between relative z-10 gap-6 sm:gap-8">
                  {/* Text Content */}
                  <div className="max-w-xl text-center lg:text-left">
                    <div className="mb-4 md:mb-6">
                      <div
                        className={`text-[80px] sm:text-[100px] md:text-[140px] font-black text-transparent bg-clip-text bg-gradient-to-b ${service.gradient}/50 leading-none select-none drop-shadow-xl`}
                      >
                        {service.number}
                      </div>
                    </div>

                    <h3 className="text-white text-2xl sm:text-3xl md:text-4xl font-bold tracking-wide mb-3 md:mb-4 leading-tight drop-shadow-lg">
                      {service.title}
                    </h3>

                    <p className="text-gray-200 text-sm sm:text-base md:text-lg leading-relaxed mb-4 sm:mb-6 font-light">
                      {service.description}
                    </p>

                    <div className="mt-1 lg:mt-0">
                      <Link
                        to={service.route}
                        className={`
        inline-block px-6 py-3
        bg-gradient-to-r ${service.gradient}
        text-white font-semibold rounded-full shadow-xl
        transition-all duration-500 transform
        group-hover:scale-105 group-hover:rotate-1
        hover:scale-110 hover:-translate-y-1 hover:shadow-2xl
        focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white
        relative overflow-hidden max-w-max
        mx-auto lg:mx-0
      `}
                      >
                        <span className="relative z-10">Know More</span>
                        <span
                          className="
          absolute inset-0 opacity-0 group-hover:opacity-100
          transition-opacity duration-700
          bg-gradient-to-r from-white/30 via-fuchsia-300/30 to-blue-300/30
          blur-lg rounded-full -z-1
          pointer-events-none
        "
                        ></span>
                      </Link>
                    </div>

                    {/* <button className={`group/btn px-5 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r ${service.gradient} text-white font-bold text-sm sm:text-base rounded-full transition-all duration-500 transform hover:scale-110 hover:shadow-[0_15px_30px_rgba(0,0,0,0.4)] flex items-center gap-2 sm:gap-3 mx-auto lg:mx-0 shadow-xl`}>
                      Explore Premium
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover/btn:translate-x-2 transition-transform duration-300" />
                    </button> */}
                  </div>

                  {/* Visual Content */}
                  <div className="relative flex flex-col items-center mt-6 sm:mt-0">
                    {/* Main Icon */}
                    <div className="mb-6 sm:mb-8 relative">
                      <div className="absolute -inset-3 sm:-inset-4 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full blur-xl animate-pulse"></div>
                      <div
                        className={`relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br ${service.gradient} flex items-center justify-center shadow-[0_15px_35px_rgba(0,0,0,0.5)] transition-all duration-700 group-hover:scale-125 group-hover:rotate-6 border border-white/20`}
                      >
                        <IconComponent className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white drop-shadow-lg" />
                      </div>
                    </div>

                    {/* Service-specific Visuals */}
                    {service.id === 1 && (
                      <div className="flex flex-col items-center">
                        {/* Database Stack */}
                        <div className="flex flex-col items-center space-y-1 mb-3 sm:mb-4">
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-14 sm:w-16 md:w-20 h-4 sm:h-5 md:h-6 rounded-md border bg-gradient-to-r ${
                                i === 2
                                  ? service.gradient
                                  : "from-gray-800 to-gray-700"
                              } border-gray-500 flex items-center justify-center shadow-md transition-all duration-500 hover:scale-105`}
                            >
                              <Database className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                            </div>
                          ))}
                          <ArrowRight className="text-blue-400 w-4 h-4 sm:w-5 sm:h-5 mt-1 animate-pulse" />
                        </div>
                      </div>
                    )}

                    {service.id === 2 && (
                      <div className="flex flex-col space-y-2 sm:space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className="flex items-center space-x-2 sm:space-x-3 animate-pulse"
                            style={{ animationDelay: `${i * 0.3}s` }}
                          >
                            <div
                              className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br ${service.gradient} flex items-center justify-center`}
                            >
                              <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                            </div>
                            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
                            <div className="w-12 sm:w-16 h-3 sm:h-4 bg-gray-700/60 rounded-md"></div>
                          </div>
                        ))}
                      </div>
                    )}

                    {service.id === 3 && (
                      <div className="relative">
                        {/* Animated Security Shield */}
                        <div className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 mb-4">
                          {/* Outer ring with rotation */}
                          <div
                            className="absolute inset-0 rounded-full border-2 border-amber-400/30 animate-spin"
                            style={{ animationDuration: "8s" }}
                          ></div>

                          {/* Middle ring with counter-rotation */}
                          <div
                            className="absolute inset-4 rounded-full border-2 border-orange-400/40 animate-spin"
                            style={{
                              animationDuration: "6s",
                              animationDirection: "reverse",
                            }}
                          ></div>

                          {/* Inner shield */}
                          <div
                            className={`absolute inset-8 rounded-full bg-gradient-to-br ${service.gradient} flex items-center justify-center shadow-lg`}
                          >
                            <Zap className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white animate-pulse" />
                          </div>

                          {/* Floating security dots */}
                          {[...Array(8)].map((_, i) => (
                            <div
                              key={i}
                              className="absolute w-2 h-2 bg-amber-400/80 rounded-full animate-bounce"
                              style={{
                                left: `${
                                  50 + 40 * Math.cos((i * Math.PI) / 4)
                                }%`,
                                top: `${
                                  50 + 40 * Math.sin((i * Math.PI) / 4)
                                }%`,
                                transform: "translate(-50%, -50%)",
                                animationDelay: `${i * 0.2}s`,
                                animationDuration: "2s",
                              }}
                            />
                          ))}
                        </div>

                        {/* Animated login form */}
                        {/* <div className="w-40 sm:w-44 md:w-48 h-24 sm:h-28 md:h-32 bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-xl border border-amber-500/30 p-3 sm:p-4 backdrop-blur-sm"> */}
                        {/* Form fields with typing animation */}
                        {/* <div className="space-y-2 sm:space-y-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                              <div className="flex-1 h-2 bg-gray-700/60 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full animate-pulse"
                                  style={{ width: '85%' }}
                                ></div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                              <div className="flex-1 h-2 bg-gray-700/60 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full animate-pulse"
                                  style={{ width: '60%', animationDelay: '0.5s' }}
                                ></div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                              <div className="flex-1 h-2 bg-gray-700/60 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full animate-pulse"
                                  style={{ width: '45%', animationDelay: '1s' }}
                                ></div>
                              </div>
                            </div>
                          </div> */}

                        {/* Success indicator */}
                        {/* <div className="absolute top-2 right-2 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                        </div> */}
                      </div>
                    )}

                    {service.id === 4 && (
                      <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border-2 border-gray-700/50">
                        <div
                          className={`absolute inset-2 sm:inset-3 rounded-full bg-gradient-to-br ${service.gradient} flex items-center justify-center`}
                        >
                          <Shield className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" />
                        </div>
                        {[...Array(6)].map((_, i) => (
                          <div
                            key={i}
                            className="absolute w-1 h-1 sm:w-1.5 sm:h-1.5 bg-rose-400/70 rounded-full animate-ping"
                            style={{
                              left: `${50 + 35 * Math.cos((i * Math.PI) / 3)}%`,
                              top: `${50 + 35 * Math.sin((i * Math.PI) / 3)}%`,
                              animationDelay: `${i * 0.3}s`,
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {service.id === 5 && (
                      <div className="flex flex-col items-center space-y-2">
                        {/* Cloud Servers */}
                        <div className="flex space-x-2 mb-2">
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br ${
                                i === 1
                                  ? service.gradient
                                  : "from-gray-700 to-gray-600"
                              } flex items-center justify-center border border-gray-500/50 animate-pulse`}
                              style={{ animationDelay: `${i * 0.4}s` }}
                            >
                              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white/70 rounded-full"></div>
                            </div>
                          ))}
                        </div>
                        {/* Connection Lines */}
                        <div className="flex flex-col items-center space-y-1">
                          {[...Array(2)].map((_, i) => (
                            <div
                              key={i}
                              className="flex items-center space-x-1"
                            >
                              <div className="w-2 h-0.5 bg-indigo-400/60 rounded-full animate-pulse"></div>
                              <div className="w-1 h-1 bg-indigo-400 rounded-full"></div>
                              <div className="w-2 h-0.5 bg-indigo-400/60 rounded-full animate-pulse"></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {service.id === 6 && (
                      <div className="flex flex-col items-center">
                        {/* Team Circle */}
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 mb-3">
                          <div className="absolute inset-0 rounded-full border-2 border-gray-600/50"></div>
                          {[...Array(4)].map((_, i) => (
                            <div
                              key={i}
                              className={`absolute w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br ${service.gradient} border-2 border-gray-800 flex items-center justify-center transition-all duration-700 hover:scale-110`}
                              style={{
                                left: `${
                                  50 +
                                  35 * Math.cos((i * Math.PI) / 2 - Math.PI / 4)
                                }%`,
                                top: `${
                                  50 +
                                  35 * Math.sin((i * Math.PI) / 2 - Math.PI / 4)
                                }%`,
                                transform: "translate(-50%, -50%)",
                              }}
                            >
                              <Users className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                            </div>
                          ))}
                          <div
                            className={`absolute inset-4 sm:inset-6 rounded-full bg-gradient-to-br ${service.gradient}/20 flex items-center justify-center`}
                          >
                            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-violet-400 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* <div className="mt-12 flex justify-center">
                <Link
                  to="https://awsaiapp.com/User_interface"
                  className="group/btn relative overflow-hidden px-8 py-3.5 md:px-10 md:py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm sm:text-base rounded-full transition-all duration-500 transform hover:scale-105 hover:shadow-[0_15px_30px_rgba(139,92,246,0.5)] flex items-center gap-3 mx-auto shadow-xl"
                >
                  <span className="relative z-10">Know More</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 group-hover/btn:translate-x-2 transition-transform duration-300" />


                  <div className="absolute inset-0 overflow-hidden rounded-full">
                    <div className="absolute -inset-2 bg-gradient-to-r from-violet-400 to-fuchsia-400 opacity-0 group-hover/btn:opacity-100 blur-md transition-opacity duration-500"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600/90 to-fuchsia-600/90 group-hover/btn:from-violet-500/90 group-hover/btn:to-fuchsia-500/90 transition-all duration-500"></div>
                  </div>
                </Link>
              </div> */}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OurServices;
