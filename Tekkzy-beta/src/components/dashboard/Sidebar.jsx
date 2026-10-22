import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  FiLayout,
  FiGlobe,
  FiCreditCard,
  FiSettings,
  FiArrowLeft,
  FiLogOut
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../context/ApiContext';

const Sidebar = ({ onClose }) => {
  const { signOut, user } = useAuth();
  const { userData } = useApi();

  const displayName =
    userData?.name ||
    userData?.email?.split('@')[0] ||
    'My';

  const navItems = [
    { label: 'My Sites', path: '/dashboard/sites', icon: <FiLayout /> },
    { label: 'Domains', path: '/dashboard/domains', icon: <FiGlobe /> },
    { label: 'Billing', path: '/dashboard/billing', icon: <FiCreditCard /> },
    { label: 'Settings', path: '/dashboard/settings', icon: <FiSettings /> },
  ];

  return (
    <aside className="w-64 bg-[#0a0a0a] border-r border-[#1a1a1a] h-screen flex flex-col sticky top-0 transition-all duration-300">

      {/* Brand area */}
      <div className="h-16 flex items-center px-6 border-b border-[#1a1a1a]">
        <Link to="/" className="flex items-center gap-2 group hover:opacity-80 transition-opacity">
          <img src="/logos/t1.png" alt="Tekkzy" className="h-6 w-auto object-contain" />
          <span className="text-xl font-semibold bg-gradient-to-r from-blue-400 via-white to-blue-500 text-transparent bg-clip-text">
            Tekkzy
          </span>
        </Link>
      </div>

      {/* Workspace Selector (Design only) */}
      <div className="px-4 py-6">
        <div className="flex items-center gap-3 px-3 py-2 bg-[#141414] border border-[#222] rounded-lg cursor-pointer hover:border-[#333] transition-colors">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-200 truncate">
              {`${displayName}'s Workspace`}
            </h3>
            <p className="text-xs text-gray-500 truncate">Personal</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
          Overview
        </div>

        {navItems.map((item) => (
          item.external ? (
            <Link
              key={item.label}
              to={item.path}
              className="group flex items-center px-3 py-2.5 text-sm font-medium text-gray-400 rounded-md hover:text-white hover:bg-[#1f1f1f] transition-colors"
            >
              <span className="text-gray-500 group-hover:text-gray-300 mr-3 text-lg">
                {item.icon}
              </span>
              {item.label}
            </Link>
          ) : (
            <NavLink
              key={item.label}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                  isActive
                    ? 'bg-[#1f1f1f] text-white'
                    : 'text-gray-400 hover:bg-[#1f1f1f] hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`mr-3 text-lg transition-colors ${isActive ? 'text-blue-500' : 'text-gray-500 group-hover:text-gray-300'}`}>
                    {item.icon}
                  </span>
                  {item.label}
                </>
              )}
            </NavLink>
          )
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-[#1a1a1a]">
        <Link
          to="/"
          onClick={onClose}
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-400 rounded-md hover:text-white hover:bg-[#1f1f1f] transition-colors w-full mb-1"
        >
          <FiArrowLeft className="mr-3 text-lg text-gray-500" />
          Back to Home
        </Link>
        <button
          onClick={signOut}
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-400 rounded-md hover:text-red-400 hover:bg-[#1f1f1f] transition-colors w-full text-left"
        >
          <FiLogOut className="mr-3 text-lg text-gray-500" />
          Log Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
