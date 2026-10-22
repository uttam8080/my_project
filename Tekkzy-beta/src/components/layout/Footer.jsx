import React, { useState } from "react";
import { Link } from "react-router-dom";
import { HiPhone, HiMail, HiLocationMarker } from "react-icons/hi";
import { useAuth } from "../../context/AuthContext";
import { useApi } from "../../context/ApiContext";
import LoginPromptModal from "../common/LoginPromptModal";
import "../../styles/footer.css";

const Footer = () => {
  const { isAuthenticated } = useAuth();
  const { userData } = useApi();
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);

  // Check both context and localStorage for compatibility
  const isAuthenticatedLocally = localStorage.getItem('isAuthenticated') === 'true';
  const isAdmin = userData?.userType === "admin" || localStorage.getItem('isAdmin') === 'true';

  return (
    <>
      <footer className="solar-gradient text-white py-8 md:py-12 z-50">
        <div className="container mx-auto px-4">
          <div className="border-t border-b-cyan-300 my-6"></div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-10 md:gap-x-8 mt-8">
            {/* Reach Us Section */}
            <div className="text-center md:text-left">
              <h3 className="text-lg font-medium mb-6">Reach us</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-center md:justify-start">
                  <HiPhone className="w-5 h-5 mr-3 flex-shrink-0" />
                  <a
                    href="tel:+919692064432"
                    className="hover:text-gray-300 transition duration-200">
                    (+91) 9692064432
                  </a>
                </div>

                <div className="flex items-center justify-center md:justify-start">
                  <HiMail className="w-5 h-5 mr-3 flex-shrink-0" />
                  <a
                    href="mailto:admin@awsaiapp.com"
                    className="hover:text-gray-300 transition duration-200">
                    admin@awsaiapp.com
                  </a>
                </div>

                <div className="flex items-start justify-center md:justify-start">
                  <HiLocationMarker className="w-5 h-5 mr-3 mt-1 flex-shrink-0" />
                  <span className="text-center md:text-left">
                    V5W5+34J, W Lane 2,
                    <br /> Hilltown, Sambhunagar Pada,
                    <br /> Bhawanipatna, Odisha 766001
                  </span>
                </div>
              </div>
            </div>

            {/* Company Section */}
            <div className="text-center md:text-left">
              <h3 className="text-lg font-medium mb-6">Company</h3>
              <ul className="space-y-4">
                <li>
                  <Link
                    to="/"
                    className="hover:text-gray-300 transition duration-200">
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    to="/about"
                    className="hover:text-gray-300 transition duration-200">
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact?type=career"
                    className="hover:text-gray-300 transition duration-200">
                    Contact
                  </Link>
                </li>
                {/* Admin Login Button */}
                <li>
                  <button
                    onClick={() => setShowAdminLoginModal(true)}
                    className="hover:text-gray-300 transition duration-200 font-medium cursor-pointer">
                    Admin Login
                  </button>
                </li>
                {/* <li><Link to="/career" className="hover:text-gray-300 transition duration-200">Career</Link></li> */}
              </ul>
            </div>

            {/* Legal Section */}
            <div className="text-center md:text-left">
              <h3 className="text-lg font-medium mb-6">Legal</h3>
              <ul className="space-y-4">
                <li>
                  <Link
                    to="/privacypolicy"
                    className="hover:text-gray-300 transition duration-200">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/termscondition"
                    className="hover:text-gray-300 transition duration-200">
                    Terms & Conditions
                  </Link>
                </li>
                {/* <li><Link to="/terms-of-use" className="hover:text-gray-300 transition duration-200">Terms of Use</Link></li> */}
                <li>
                  <Link
                    to="/cancellation"
                    className="hover:text-gray-300 transition duration-200">
                    Cancellation & Refund Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-b-cyan-300 text-center">
            <p>© {new Date().getFullYear()} Tekkzy. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Admin Login Modal */}
      <LoginPromptModal
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        title="Admin Login"
        description="Sign in to access admin features and manage templates."
      />
    </>
  );
};

export default Footer;
