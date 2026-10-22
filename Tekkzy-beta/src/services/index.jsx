import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Brain,
  Zap,
  Shield,
  Cloud,
  CreditCard,
  FileText,
  ChevronRight,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import Arrow from "/images/common_icon.png";

// ...servicesData (unchanged)
const servicesData = [
  {
    key: "User_interface",
    title: "User Interface & User Experience",
    icon: Users,
    image: "/images/userInterface.png",
    description: `At Tekkzy, we understand that the success of your web application hinges on delivering a delightful user experience. Our User Interface and User Experience service are dedicated to crafting intuitive, visually appealing, and user-friendly interfaces that captivate your audience from the moment they land on your site. Our team of skilled designers leverages the latest design trends and usability principles to create seamless interactions, ensuring that your users can navigate your web application effortlessly across various devices. With a focus on accessibility and responsive design, we guarantee that every user, regardless of their device or abilities, enjoys an exceptional experience that drives engagement and enhances satisfaction`,
    bullets: [
      {
        title: "Intuitive UI Design",
        description:
          "We create user interfaces that are intuitive, visually appealing, and easy to navigate. A well-designed UI enhances user engagement and satisfaction.",
      },
      {
        title: "Responsive Web Design",
        description:
          "Our web applications adapt seamlessly to different devices, ensuring a consistent user experience across desktops, tablets, and smartphones.",
      },
      {
        title: "Accessibility",
        description:
          "We prioritize accessibility, making sure that all users, including those with disabilities, can access and interact with your web app comfortably.",
      },
      {
        title: "Interactive Elements",
        description:
          "Engage your users with interactive elements such as animations, sliders, and buttons, enhancing the overall user experience.",
      },
      {
        title: "User Journey Mapping",
        description:
          "We analyze user behavior and preferences to map out optimized user journeys, leading to higher conversions and increased user retention.",
      },
    ],
  },
  {
    key: "Personalization",
    title: "Personalization",
    icon: Brain,
    image: "/images/Services_Personalization.png",
    description: `Customization is key to building lasting connections with your users, and our Personalization service is designed to deliver just that. Through sophisticated algorithms and data-driven insights, we personalize your web application to cater to each user's unique preferences, behavior, and context. Whether it's a personalized dashboard, tailored content recommendations, or adaptive user interfaces, we ensure that your users feel valued and engaged at every interaction. By providing a highly personalized experience, you can boost user satisfaction, drive conversions, and cultivate loyalty, setting your web application apart from the competition`,
    bullets: [
      {
        title: "Dynamic Content Personalization",
        description:
          "We use data-driven insights to deliver personalized content, product recommendations, and notifications tailored to each user's interests and behavior.",
      },
      {
        title: "Segmentation",
        description:
          "Group your users based on demographics, behavior, or preferences, allowing you to target specific segments with personalized experiences.",
      },
      {
        title: "Contextual Recommendations",
        description:
          "Our algorithms consider the user's current context, location, and previous interactions to offer real-time personalized recommendations.",
      },
      {
        title: "User Preference Management",
        description:
          "Empower users to customize their settings, enabling them to control the level of personalization they receive.",
      },
      {
        title: "Adaptive User Interfaces",
        description:
          "Personalize the user interface based on user preferences and roles, ensuring each user sees the most relevant information and features.",
      },
    ],
  },
  {
    key: "identity",
    title: "Login And identity management",
    icon: Zap,
    image: "/images/Services_Login.png",
    description: `Security is paramount in the digital world, and our Login & Identity Management service guarantees robust user authentication and access control. Through secure authentication mechanisms, such as two-factor authentication (2FA) and single sign-on (SSO), we safeguard user accounts from unauthorized access and potential threats. Our identity verification processes add an extra layer of protection, ensuring a trustworthy user base. Additionally, we provide seamless password management options, making it convenient for users to reset and recover their login credentials securely.`,
    bullets: [
      {
        title: "Secure Authentication",
        description:
          "Implement strong authentication mechanisms, such as two-factor authentication to safeguard user accounts.",
      },
      {
        title: "Single Sign-On (SSO)",
        description:
          "Streamline user access with SSO, allowing users to log in once and access multiple services seamlessly.",
      },
      {
        title: "Identity Verification",
        description:
          "Verify user identities through various methods, ensuring a trustworthy user base and reducing fraudulent activities.",
      },
      {
        title: "Password Management",
        description:
          "Offer password reset and recovery options to enhance user account security and convenience.",
      },
      {
        title: "User Access Control",
        description:
          "Define user roles and permissions to control access to specific features and information within the web app.",
      },
    ],
  },
  {
    key: "trade",
    title: "Trade Specific features",
    icon: Shield,
    image: "/images/Services_Trade.png",
    description: `Every industry has unique requirements, and our Trade Specific Features service ensures that your web application is tailored to meet the specific needs of your trade. Whether you operate in e-commerce, healthcare, education, or any other industry, our team customizes your web application with industry-specific functionalities and compliance features. From inventory management tools and real-time data updates to specialized reporting and analytics, our trade-specific approach positions your web application as a powerful asset, driving growth and success in your niche.`,
    bullets: [
      {
        title: "Industry-Specific Customization",
        description:
          "Tailor your web app to meet the unique needs of your industry, ensuring it becomes a valuable asset for your trade.",
      },
      {
        title: "Real-Time Data Updates",
        description:
          "Provide real-time information on pricing, availability, and product updates for timely decision-making.",
      },
      {
        title: "Compliance and Regulations",
        description:
          "Incorporate industry-specific compliance and regulatory features to ensure adherence to relevant guidelines.",
      },
      {
        title: "Reporting and Analytics",
        description:
          "Gain valuable insights with AWS AI's powerful Reporting & Analytics service. Unlock data-driven decision-making for your business success",
      },
      {
        title: "Inventory Management",
        description:
          "Optimize your business operations with our Inventory Management service. Effectively track, manage, and control your inventory, ensuring seamless supply chain management.",
      },
    ],
  },
  {
    key: "customer",
    title: "Leads & customer tracking",
    icon: Cloud,
    image: "/images/Services_Coustmer.png",
    description: `Understanding your customers and leads is vital for driving business growth, and our Leads & Customer Tracking service equips you with the tools to do just that. From lead capture forms and lead scoring systems to automated lead nurturing campaigns, we help you gather valuable customer data, prioritize leads effectively, and nurture them through the sales funnel. By monitoring customer interactions and tracking user behavior within your web application, we empower you to make data-driven decisions, optimize marketing strategies, and deliver personalized experiences that resonate with your audience.`,
    bullets: [
      {
        title: "Customer Activity Tracking",
        description:
          "Monitor customer interactions and behavior within your web app to identify trends and areas for improvement.",
      },
      {
        title: "Lead Scoring",
        description:
          "Assign scores to leads based on their engagement levels and potential, allowing you to prioritize follow-ups effectively.",
      },
      {
        title: "Performance Analytics",
        description:
          "Gain insights into lead conversion rates, customer acquisition costs, and customer lifetime value to optimize marketing strategies.",
      },
      {
        title: "SEO-Analytics Integration",
        description:
          "We align lead and customer tracking data with SEO analytics to identify high-performing keywords and optimize your content strategy.",
      },
      {
        title: "Lead Capture Forms",
        description:
          "Implement lead capture forms on your web app to gather valuable customer information and generate potential leads.",
      },
    ],
  },
  {
    key: "payment",
    title: "Payments",
    icon: CreditCard,
    image: "/images/Services_Payment.png",
    description: `Seamless and secure payment processing is fundamental to a successful web application. With our Payments service, we integrate robust and reliable payment gateways, enabling your users to make transactions with confidence. From credit card payments to digital wallets and recurring billing options, we offer a range of payment solutions that cater to diverse preferences. Our comprehensive payment tracking and reporting features provide valuable insights into your transaction data, empowering you to optimize your payment processes and enhance the overall customer experience.`,
    bullets: [
      {
        title: "Secure Payment Gateways",
        description:
          "We integrate robust and secure payment gateways to facilitate smooth and secure transactions.",
      },
      {
        title: "Multiple Payment Options",
        description:
          "Allow our customers to pay using various methods, such as credit cards, digital wallets, and bank transfers, catering to different preferences.",
      },
      {
        title: "Recurring Billing",
        description:
          "Enable subscription-based models and recurring billing options for your services, enhancing customer convenience and retention.",
      },
      {
        title: "Payment Tracking and Reporting",
        description:
          "Gain valuable insights into payment trends and performance through comprehensive tracking and reporting features.",
      },
      {
        title: "Invoice Generation",
        description:
          "Automatically generate and send professional invoices to customers upon successful transactions, streamlining your billing process.",
      },
    ],
  },
];

const variants = {
  enter: { opacity: 0, x: 50 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
};
const bulletVariants = {
  rest: { scale: 1, backgroundColor: "#111827" },
  hover: { scale: 1.02, backgroundColor: "#232870" },
};

const ServicesSinglePage = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [screensize, setScreensize] = useState({ width: window.innerWidth });
  const [searchParams] = useSearchParams();

  const defaultService = searchParams.get("service");
  const [activeKey, setActiveKey] = useState(
    servicesData.find((s) => s.key === defaultService)?.key ||
      servicesData[0].key
  );

  // Responsive behavior tracking
  useEffect(() => {
    const handleResize = () => setScreensize({ width: window.innerWidth });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const shouldDisplaySidebarAsPopup = screensize.width <= 900;
  const activeService = servicesData.find((s) => s.key === activeKey);

  const toggleBullet = (index) =>
    setOpenIndex((prev) => (prev === index ? null : index));

  return (
    <div className="min-h-screen bg-transparent text-gray-200 flex flex-col md:flex-row gap-4 p-4">
      {/* Toggle Button (Arrow) */}
      {shouldDisplaySidebarAsPopup && (
        <div
          className="h-[30px] w-[30px] bg-[#a9aeaf] fixed top-[5rem] left-0 z-50"
          style={{
            boxShadow: "2px 2px 4px #353535",
            borderTopRightRadius: "10px",
            borderBottomRightRadius: "10px",
          }}
        >
          <img
            src={Arrow}
            alt="Toggle Sidebar"
            className="p-2 cursor-pointer"
            style={{
              width: "30px",
              height: "30px",
              transform: sidebarOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.1s ",
            }}
            onClick={() => setSidebarOpen((prev) => !prev)}
          />
        </div>
      )}

      {/* Sidebar */}
      {(sidebarOpen || !shouldDisplaySidebarAsPopup) && (
        <motion.nav
          key="sidebar"
          initial={{ x: shouldDisplaySidebarAsPopup ? -320 : 0, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -320, opacity: 0 }}
          transition={{ type: "tween", ease: "easeOut", duration: 0.15 }}
          className={`${
            shouldDisplaySidebarAsPopup
              ? "fixed z-40 top-0 left-0 w-[300px] h-full transition-transform bg-gray-900"
              : "sticky top-4 md:w-80 h-fit backdrop-blur-sm bg-gray-900/80"
          }   rounded-xl border border-gray-800 p-6 shadow-lg overflow-y-auto`}
        >
          {/* Close Button inside sidebar for popup mode */}
          {shouldDisplaySidebarAsPopup && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 z-50 text-white text-2xl font-bold"
            >
              &times;
            </button>
          )}

          <h3 className="text-lg font-medium text-purple-300 mb-6 flex items-center">
            <FileText className="w-5 h-5 mr-3" />
            Quick Navigation
          </h3>

          <nav className="space-y-2">
            {servicesData.map(({ key, title, icon: Icon }) => {
              const isActive = key === activeKey;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setActiveKey(key);
                    setOpenIndex(null);
                    if (shouldDisplaySidebarAsPopup) setSidebarOpen(false);
                  }}
                  className={`w-full text-left p-4 rounded-lg transition-all flex items-center space-x-3 group ${
                    isActive
                      ? "bg-gradient-to-r from-purple-900/40 to-blue-900/30 text-white border border-purple-700/30"
                      : "text-gray-400 hover:bg-gray-800/60 hover:text-white border border-gray-800 hover:border-purple-600/30"
                  }`}
                >
                  <span
                    className={`${
                      isActive
                        ? "text-purple-300"
                        : "text-purple-500/60 group-hover:text-purple-300"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="flex-1 font-medium text-left text-sm">
                    {title}
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      isActive
                        ? "rotate-90 text-purple-300"
                        : "text-gray-500 group-hover:text-purple-300 group-hover:translate-x-1"
                    }`}
                  />
                </button>
              );
            })}
          </nav>
        </motion.nav>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-5 bg-gradient-to-br from-gray-950 to-gray-900 text-gray-200">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeService.key}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-8 bg-gray-900/80 rounded-2xl shadow-lg border border-gray-800/50 p-4 sm:p-6 md:p-10"
          >
            <img
              src={activeService.image}
              alt={activeService.title}
              className="w-full max-w-3xl max-h-90 mx-auto rounded-2xl shadow-lg object-cover"
              style={{
                filter: "drop-shadow(0 4px 18px rgba(99,102,241,0.65))",
              }}
            />
            <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 text-center">
              {activeService.title}
            </h1>
            <p className="text-gray-300 leading-relaxed text-base max-w-5xl mx-auto">
              {activeService.description}
            </p>
            <ul className="grid gap-6 md:gap-4">
              {activeService.bullets.map((bullet, i) => (
                <motion.li
                  key={i}
                  onClick={() => toggleBullet(i)} // ✅ Make the entire card clickable
                  initial="rest"
                  whileHover="hover"
                  animate="rest"
                  variants={bulletVariants}
                  className="border border-white/10 rounded-xl bg-black/30 p-4 min-h-[70px] cursor-pointer shadow hover:shadow-blue-600/30"
                >
                  <div className="flex items-center justify-between w-full text-left text-blue-300 font-semibold text-base">
                    <span>{bullet.title}</span>
                    <motion.span
                      animate={{
                        rotate: openIndex === i ? 90 : 0,
                        color: openIndex === i ? "#60a5fa" : "#cbd5e1",
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M9 5l7 7-7 7" />
                      </svg>
                    </motion.span>
                  </div>
                  <AnimatePresence initial={false}>
                    {openIndex === i && (
                      <motion.p
                        className="mt-3 text-gray-400 text-sm"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                      >
                        {bullet.description}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default ServicesSinglePage;
