import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import VantaBackground from '../common/VantaBackground';

const MainLayout = () => {
  const location = useLocation();

  const noFooterPaths = [
    '/service',
    '/termsCondition'
  ];

  const hideFooter = noFooterPaths.some(path =>   
    location.pathname === path || location.pathname.startsWith(path + '/')
  );

  return (
    <div className="flex flex-col min-h-screen relative bg-transparent">
      <VantaBackground />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Outlet />
        </main>
        {!hideFooter && <Footer />}
      </div>
    </div>
  );
};

export default MainLayout;
