import React, { useState, useRef, useEffect } from "react";
import { FileText, ChevronRight } from "lucide-react";

const privacyData = [
  {
    id: 1,
    title: "Applicability and Consent",
    content:
      'This Privacy Policy governs the collection, use, storage, processing, and disclosure of personal and business information by Tekkzy Intelligent Cloud Applications Pvt. Ltd., a company incorporated under the Companies Act, 2013 with its registered office in Odisha, India ("Company", "We", "Us"). This Policy applies to all clients, users, visitors, and entities ("User") who interact with the Company through its websites, software applications, platforms, services, communications, or payments. By accessing or using the Company\'s services or by providing any information to the Company, the User expressly consents to the collection and use of such information in accordance with this Privacy Policy. If the User does not agree with this Policy, they must discontinue use of the services immediately.',
  },
  {
    id: 2,
    title: "Information Collected",
    content:
      "The Company may collect personal, business, and technical information including but not limited to name, email address, phone number, business details, billing information, payment records, login credentials, IP address, device information, usage data, project-related data, and communication records. Information may be collected directly from the User, automatically through system logs, cookies, or third-party integrations, or through lawful business interactions. The Company does not intentionally collect sensitive personal data unless required for service delivery or compliance with legal obligations.",
  },
  {
    id: 3,
    title: "Use of Information",
    content:
      "Information collected by the Company is used strictly for legitimate business purposes including service delivery, software development, customization, account management, billing, payment processing, customer support, internal analysis, security monitoring, compliance with legal obligations, and communication regarding services. The Company does not sell, rent, or trade User data for marketing purposes. Information may also be used to improve service quality, troubleshoot technical issues, prevent fraud, and enforce contractual obligations.",
  },
  {
    id: 4,
    title: "Data Sharing and Disclosure",
    content:
      "The Company may share User information with employees, contractors, service providers, and third-party vendors strictly on a need-to-know basis for service delivery, hosting, payment processing, cloud infrastructure, analytics, or legal compliance. Such parties are bound by confidentiality obligations. The Company may disclose information where required by law, court order, government authority, or to protect its legal rights, property, or safety. The Company shall not be responsible for data practices of third-party platforms, hosting providers, APIs, or integrations used as part of the services.",
  },
  {
    id: 5,
    title: "Data Security and Retention",
    content:
      "The Company implements reasonable technical and organizational measures to protect User information against unauthorized access, loss, misuse, or alteration. However, no system is completely secure and the Company does not guarantee absolute data security. User data is retained only for as long as necessary to fulfill business, contractual, or legal requirements. Upon termination of services, certain data may be retained as required by law, accounting standards, or dispute resolution needs.",
  },
  {
    id: 6,
    title: "User Rights, Limitation and Governing Law",
    content:
      "Users may request access, correction, or deletion of their personal information subject to legal and contractual limitations. The Company reserves the right to refuse requests that are impractical, excessive, or legally restricted. The Company shall not be liable for any indirect, incidental, or consequential damages arising from data usage or unauthorized access beyond reasonable control. This Privacy Policy shall be governed by and construed in accordance with the laws of India, and any disputes shall be subject to the exclusive jurisdiction of the courts of Bhawanipatna, Odisha, India. Continued use of the Company's services constitutes unconditional acceptance of this Privacy Policy.",
  },
];

const PrivacyPolicy = () => {
  const [activeSection, setActiveSection] = useState(1);
  const sectionRefs = useRef({});
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Load Google Fonts
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:wght@400;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const handleScrollToSection = (id) => {
    const section = sectionRefs.current[id];
    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      setActiveSection(id);
    }
  };

  return (
    <>
      <div
        className="min-h-screen bg-white"
        style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="flex">
          {/* Sticky Sidebar - Desktop Only */}
          <aside className="hidden lg:block lg:w-64 flex-shrink-0">
            <div className="sticky top-0 h-screen overflow-y-auto bg-gray-50 border-r border-gray-200">
              <div className="p-6 pt-24">
                <h3 className="text-xs font-semibold text-gray-900 mb-4 uppercase tracking-wider">
                  Contents
                </h3>

                <nav className="space-y-1">
                  {privacyData.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleScrollToSection(item.id)}
                      className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                        activeSection === item.id
                          ? "bg-gray-900 text-white font-medium"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}>
                      {item.id}. {item.title}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            <div className="max-w-4xl mx-auto px-6 py-12 pt-24">
              {/* Header */}
              <div className="mb-12 pb-8 border-b border-gray-200">
                <h1
                  className="text-5xl font-bold text-gray-900 mb-4"
                  style={{
                    fontFamily: "'Merriweather', serif",
                    letterSpacing: "-0.02em",
                  }}>
                  Privacy Policy
                </h1>
                <p className="text-lg text-gray-600 mb-4 font-medium">
                  Tekkzy Intelligent Cloud Applications Pvt. Ltd.
                </p>
                <p className="text-sm text-gray-500 font-medium">
                  Last Updated: October 23, 2023
                </p>
              </div>

              {/* Content Sections */}
              <div className="space-y-12">
                {privacyData.map((item) => (
                  <section
                    key={item.id}
                    ref={(el) => (sectionRefs.current[item.id] = el)}
                    className="scroll-mt-24">
                    <h2
                      className="text-2xl font-bold text-gray-900 mb-4"
                      style={{
                        fontFamily: "'Merriweather', serif",
                        letterSpacing: "-0.01em",
                      }}>
                      {item.id}. {item.title}
                    </h2>
                    <p
                      className="text-base text-gray-700 leading-relaxed"
                      style={{ lineHeight: "1.75" }}>
                      {item.content}
                    </p>
                  </section>
                ))}
              </div>

              {/* Contact Section */}
              <div className="mt-16 pt-8 border-t border-gray-200">
                <h3
                  className="text-xl font-bold text-gray-900 mb-4"
                  style={{ fontFamily: "'Merriweather', serif" }}>
                  Have Privacy Concerns?
                </h3>
                <p
                  className="text-base text-gray-700 mb-4"
                  style={{ lineHeight: "1.75" }}>
                  Our privacy team is dedicated to addressing any questions or
                  requests you may have.
                </p>
                <a
                  href="mailto:admin@tekkzy.com"
                  className="inline-flex items-center text-gray-900 font-semibold hover:underline"
                  target="_blank"
                  rel="noopener noreferrer">
                  admin@tekkzy.com
                  <ChevronRight className="w-4 h-4 ml-1" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Nav Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50 lg:hidden">
        <button
          onClick={() => setIsMobileNavOpen(true)}
          className="p-3 rounded-full bg-gray-900 text-white shadow-lg hover:bg-gray-800 transition-colors"
          aria-label="Open navigation menu">
          <FileText className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 flex justify-end lg:hidden"
          onClick={() => setIsMobileNavOpen(false)}>
          <div
            className="w-4/5 max-w-sm bg-white p-6 shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                Contents
              </h3>
              <button
                onClick={() => setIsMobileNavOpen(false)}
                className="text-gray-500 hover:text-gray-900 text-2xl"
                aria-label="Close navigation menu">
                ×
              </button>
            </div>

            <nav className="space-y-1">
              {privacyData.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    handleScrollToSection(item.id);
                    setIsMobileNavOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    activeSection === item.id
                      ? "bg-gray-900 text-white font-medium"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}>
                  {item.id}. {item.title}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default PrivacyPolicy;