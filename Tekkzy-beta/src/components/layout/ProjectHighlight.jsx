import React from "react";
import { motion } from "framer-motion";
import { LineChart, RefreshCw, Layers } from "lucide-react";

const ProjectsHighlight = () => {
  const features = [
    {
      icon: "/career-highlighting/Icon1.png",
      title: "Growth-Oriented Environment",
      description:
        "Continuous learning, upskilling, and leadership growth at every stage.",
    },
    {
      icon: "/career-highlighting/Icon2.png",
      title: "Flexible & Supportive Culture",
      description:
        "Collaborative, inclusive, and remote-friendly workspaces that values your well-being.",
    },
    {
      icon: "/career-highlighting/Icon3.png",
      title: "Real Impact. Real Projects",
      description:
        "Work on meaningful products that shape the future of branding and design.",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    },
    hover: {
      y: -10,
      scale: 1.03,
      transition: {
        duration: 0.3,
      },
    },
  };

  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 15,
      },
    },
    hover: {
      rotate: 10,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <section className="pb-20 pt-12 overflow-hidden">
      <div className="container mx-auto px-4 text-center">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="mb-10 relative"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.1 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500 rounded-full filter blur-3xl opacity-10"
          />
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-3 relative z-10">
            Work on impactful{" "}
            <motion.span 
              className="text-blue-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Projects
            </motion.span>
          </h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-gray-300 max-w-2xl mx-auto"
          >
            Unleash innovation and accelerate growth with our dynamic product.
          </motion.p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white/10 min-h-80 md:min-h-[300px] relative overflow-hidden"
        >
          {/* Background decorative elements */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.05 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-400 rounded-full filter blur-xl"
          />
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.05 }}
            transition={{ delay: 1, duration: 1 }}
            className="absolute -top-20 -left-20 w-64 h-64 bg-purple-500 rounded-full filter blur-xl"
          />

          {/* Using flex instead of grid to implement dividers more easily */}
          <div className="flex flex-col md:flex-row h-full items-stretch justify-center space-y-6 md:space-y-0 md:space-x-6 relative z-10">
            {features.map((feature, index) => (
              <React.Fragment key={index}>
                {/* Feature Card */}
                <motion.div
                  variants={itemVariants}
                  whileHover="hover"
                  className="flex flex-col items-center text-center flex-1 px-4 py-6 md:py-0 h-full"
                >
                  {/* Icon with circle background */}
                  <motion.div
                    variants={iconVariants}
                    className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mb-4 relative"
                  >
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="absolute inset-0 rounded-full border-2 border-blue-400 opacity-0 hover:opacity-100 transition-all duration-300"
                    />
                    <img 
                      src={feature.icon} 
                      alt={feature.title} 
                      className="w-8 h-8" 
                    />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {feature.title}
                  </h3>
                  <motion.p 
                    className="text-gray-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    {feature.description}
                  </motion.p>
                </motion.div>

                {/* Vertical Divider with animation */}
                {index < features.length - 1 && (
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                    className="hidden md:block w-px bg-gradient-to-b from-transparent via-blue-400 to-transparent opacity-50 mx-4 self-stretch"
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProjectsHighlight;