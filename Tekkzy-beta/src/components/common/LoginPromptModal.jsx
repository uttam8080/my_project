import React from "react";
import { useNavigate } from "react-router-dom";

const LoginPromptModal = ({ isOpen, onClose, title = "Create your website", description = "Sign in to start customizing this template and save your progress." }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSignIn = () => {
    try {
      const currentPath = window.location.pathname + (window.location.search || "") + (window.location.hash || "");
      localStorage.setItem("postLoginRedirect", currentPath);
    } catch {}
    navigate("/signin");
  };

  const handleSignUp = () => {
    try {
      const currentPath = window.location.pathname + (window.location.search || "") + (window.location.hash || "");
      localStorage.setItem("postLoginRedirect", currentPath);
    } catch {}
    navigate("/signup");
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm bg-[#121212] border border-[#333] rounded-2xl shadow-2xl overflow-hidden flex flex-col items-center p-8">
        {/* Decor */}
        <div className="w-12 h-12 bg-blue-500/10 text-blue-500 flex items-center justify-center rounded-full mb-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
        </div>

        <h3 className="text-xl font-bold text-white mb-2 text-center">{title}</h3>
        <p className="text-gray-400 text-sm mb-6 text-center">{description}</p>

        <div className="w-full flex flex-col gap-3">
          <button
            onClick={handleSignIn}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={handleSignUp}
            className="w-full bg-[#1a1a1a] border border-[#333] hover:bg-[#222] text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            Create Account
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-6 text-gray-500 hover:text-white text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default LoginPromptModal;
