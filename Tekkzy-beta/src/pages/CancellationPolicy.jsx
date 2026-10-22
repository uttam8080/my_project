import { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiMail, FiClock, FiDollarSign, FiFileText } from 'react-icons/fi';

const CancellationPolicyPage = () => {
  const [activeSection, setActiveSection] = useState(null);

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-transparent text-gray-100">
      {/* Header */}
      <header className="py-16 px-4 sm:px-8 lg:px-16 bg-opacity-90 bg-gray-900 border-b border-gray-700">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
            Cancellation & Refund Policy
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl">
            Our transparent policies ensure you have complete clarity on cancellations and refunds for our premium services.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-16 py-12">
        {/* Policy Sections */}
        <div className="space-y-6">
          {/* Cancellation Policy Section */}
          <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-2xl">
            <button
              onClick={() => toggleSection('cancellation')}
              className="w-full flex justify-between items-center p-6 md:p-8 focus:outline-none"
            >
              <div className="flex items-center">
                <div className="bg-purple-600 p-3 rounded-lg mr-4">
                  <FiClock className="text-2xl" />
                </div>
                <h2 className="text-2xl font-semibold text-left">Cancellation Policy</h2>
              </div>
              {activeSection === 'cancellation' ? (
                <FiChevronUp className="text-2xl text-gray-400" />
              ) : (
                <FiChevronDown className="text-2xl text-gray-400" />
              )}
            </button>
            {activeSection === 'cancellation' && (
              <div className="px-6 md:px-8 pb-6 md:pb-8">
                <div className="border-t border-gray-700 pt-6 space-y-6">
                  <div className="bg-gray-700 p-6 rounded-lg border-l-4 border-purple-500">
                    <h3 className="text-xl font-medium mb-3 text-purple-300">Web Application & Digital Marketing</h3>
                    <p className="text-gray-300">
                      To cancel web application development or digital marketing services, please provide written notice at least 15 days before the scheduled start date. A cancellation fee may apply at our discretion.
                    </p>
                  </div>
                  
                  <div className="bg-gray-700 p-6 rounded-lg border-l-4 border-blue-500">
                    <h3 className="text-xl font-medium mb-3 text-blue-300">Payment Solutions</h3>
                    <p className="text-gray-300">
                      Cancellation of payment solutions is subject to the terms of the payment processing provider. Please contact them directly for cancellation requests.
                    </p>
                  </div>
                  
                  <div className="bg-gray-700 p-6 rounded-lg border-l-4 border-emerald-500">
                    <h3 className="text-xl font-medium mb-3 text-emerald-300">Personal Dashboard</h3>
                    <p className="text-gray-300">
                      Cancellation must be requested in writing and will be processed according to your service agreement terms.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Refund Policy Section */}
          <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-2xl">
            <button
              onClick={() => toggleSection('refund')}
              className="w-full flex justify-between items-center p-6 md:p-8 focus:outline-none"
            >
              <div className="flex items-center">
                <div className="bg-blue-600 p-3 rounded-lg mr-4">
                  <FiDollarSign className="text-2xl" />
                </div>
                <h2 className="text-2xl font-semibold text-left">Refund Policy</h2>
              </div>
              {activeSection === 'refund' ? (
                <FiChevronUp className="text-2xl text-gray-400" />
              ) : (
                <FiChevronDown className="text-2xl text-gray-400" />
              )}
            </button>
            {activeSection === 'refund' && (
              <div className="px-6 md:px-8 pb-6 md:pb-8">
                <div className="border-t border-gray-700 pt-6 space-y-6">
                  <div className="bg-gray-700 p-6 rounded-lg border-l-4 border-purple-500">
                    <h3 className="text-xl font-medium mb-3 text-purple-300">Web Application & Digital Marketing</h3>
                    <p className="text-gray-300">
                      Refunds are issued on a case-by-case basis. If dissatisfied, please contact us within 15 days of service completion. We'll assess your situation and may offer a refund or alternative solution.
                    </p>
                  </div>
                  
                  <div className="bg-gray-700 p-6 rounded-lg border-l-4 border-blue-500">
                    <h3 className="text-xl font-medium mb-3 text-blue-300">Payment Solutions</h3>
                    <p className="text-gray-300">
                      Refunds are subject to the policies of the payment processing provider. Please contact them directly.
                    </p>
                  </div>
                  
                  <div className="bg-gray-700 p-6 rounded-lg border-l-4 border-emerald-500">
                    <h3 className="text-xl font-medium mb-3 text-emerald-300">Personal Dashboard</h3>
                    <p className="text-gray-300">
                      Refunds will be issued according to the terms specified in your service agreement.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Processing Section */}
          <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-2xl">
            <button
              onClick={() => toggleSection('processing')}
              className="w-full flex justify-between items-center p-6 md:p-8 focus:outline-none"
            >
              <div className="flex items-center">
                <div className="bg-emerald-600 p-3 rounded-lg mr-4">
                  <FiFileText className="text-2xl" />
                </div>
                <h2 className="text-2xl font-semibold text-left">Processing Details</h2>
              </div>
              {activeSection === 'processing' ? (
                <FiChevronUp className="text-2xl text-gray-400" />
              ) : (
                <FiChevronDown className="text-2xl text-gray-400" />
              )}
            </button>
            {activeSection === 'processing' && (
              <div className="px-6 md:px-8 pb-6 md:pb-8">
                <div className="border-t border-gray-700 pt-6 space-y-6">
                  <div className="bg-gray-700 p-6 rounded-lg">
                    <p className="text-gray-300 mb-4">
                      To request a cancellation or refund, please contact our customer support team at <span className="text-blue-400">admin@awsaiapp.com</span>. Provide all necessary details to expedite your request.
                    </p>
                    <p className="text-gray-300 mb-4">
                      Approved refunds will be processed within <span className="font-medium">15 days</span> from approval date. The refund method will be determined by Intelligent Cloud Application.
                    </p>
                    <p className="text-gray-300">
                      Any applicable cancellation fees will be deducted from the refund amount.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="mt-16 bg-gradient-to-r from-purple-900 to-blue-900 rounded-xl p-8 md:p-12 border border-purple-700 shadow-xl">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-2/3 mb-6 md:mb-0">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Need Further Assistance?</h2>
              <p className="text-purple-200 max-w-2xl">
                Our dedicated support team is ready to help with any questions about cancellations or refunds.
              </p>
            </div>
            <div className="md:w-1/3 flex justify-center md:justify-end">
              <a
                href="mailto:admin@awsaiapp.com"
                className="flex items-center justify-center px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition duration-300 shadow-lg"
              >
                <FiMail className="mr-2" />
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Note */}
      <footer className="py-8 px-4 sm:px-8 lg:px-16 bg-opacity-70">
        <div className="max-w-6xl mx-auto text-center text-gray-400">
          <p>Effective Date: October 23, 2023 | Policy subject to change. Please check back for updates.</p>
        </div>
      </footer>
    </div>
  );
};

export default CancellationPolicyPage;