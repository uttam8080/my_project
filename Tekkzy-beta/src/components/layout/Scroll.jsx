import React from 'react';

const Scroll = () => {
  // Updated brands array with both text and image options
  const brands = [
    { name: 'R - Tigers', logo: '/logos/rtiger.png' },
    { name: 'B - Workz', logo: '/logos/bworkz.png' },
    { name: 'Jaganju', logo: null },
    { name: 'Lissome', logo: null }, 
    { name: 'NSG', logo: '/logos/nsg.png' },
    { name: 'Moda', logo: '/logos/moda.png' }, 
  ];

  return (
    <div className="w-full bg-transparent py-4 sm:py-6 overflow-hidden relative">
      {/* Fade gradients for entry and exit */}
      <div className="absolute left-0 top-0 w-32 h-full bg-gradient-to-r from-transparent via-black/40 to-transparent z-10 pointer-events-none"></div>
      <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-transparent via-black/40 to-transparent z-10 pointer-events-none"></div>
      
      {/* Container for the scrolling animation */}
      <div className="flex animate-scroll">
        {/* First set of cards */}
        <div className="flex space-x-4 sm:space-x-6 min-w-max">
          {brands.map((brand, index) => (
            <div
              key={`first-${index}`}
              className="bg-transparent px-8 sm:px-12 py-3 sm:py-4 min-w-max transition-all duration-300 shadow-lg flex items-center justify-center"
            >
              {brand.logo ? (
                <img 
                  src={brand.logo} 
                  alt={brand.name}
                  className="h-6 sm:h-8 max-w-[100px] sm:max-w-[120px] object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.parentNode.innerHTML = `<span class="text-white font-semibold text-base sm:text-lg whitespace-nowrap">${brand.name}</span>`;
                  }}
                />
              ) : (
                <span className="text-white font-semibold text-base sm:text-lg whitespace-nowrap">
                  {brand.name}
                </span>
              )}
            </div>
          ))}
        </div>
        
        {/* Duplicate set for seamless loop */}
        <div className="flex space-x-4 sm:space-x-6 min-w-max ml-4 sm:ml-6">
          {brands.map((brand, index) => (
            <div
              key={`second-${index}`}
              className="bg-transparent rounded-xl px-8 sm:px-12 py-3 sm:py-4 min-w-max transition-all duration-300 shadow-lg flex items-center justify-center"
            >
              {brand.logo ? (
                <img 
                  src={brand.logo} 
                  alt={brand.name}
                  className="h-6 sm:h-8 max-w-[100px] sm:max-w-[120px] object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.parentNode.innerHTML = `<span class="text-white font-semibold text-base sm:text-lg whitespace-nowrap">${brand.name}</span>`;
                  }}
                />
              ) : (
                <span className="text-white font-semibold text-base sm:text-lg whitespace-nowrap">
                  {brand.name}
                </span>
              )}
            </div>
          ))}
        </div>
        
        {/* Third set for better infinite scrolling */}
        <div className="flex space-x-4 sm:space-x-6 min-w-max ml-4 sm:ml-6">
          {brands.map((brand, index) => (
            <div
              key={`third-${index}`}
              className="bg-transparent border border-gray-800 rounded-xl px-8 sm:px-12 py-3 sm:py-4 min-w-max transition-all duration-300 shadow-lg flex items-center justify-center"
            >
              {brand.logo ? (
                <img 
                  src={brand.logo} 
                  alt={brand.name}
                  className="h-6 sm:h-8 max-w-[100px] sm:max-w-[120px] object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.parentNode.innerHTML = `<span class="text-white font-semibold text-base sm:text-lg whitespace-nowrap">${brand.name}</span>`;
                  }}
                />
              ) : (
                <span className="text-white font-semibold text-base sm:text-lg whitespace-nowrap">
                  {brand.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Custom CSS for the scrolling animation */}
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-100% / 3));
          }
        }

        .animate-scroll {
          animation: scroll 8s linear infinite;
        }

        /* Faster animation for mobile devices */
        @media (max-width: 768px) {
          .animate-scroll {
            animation: scroll 5s linear infinite;
          }
        }

        /* Even faster for small mobile devices */
        @media (max-width: 480px) {
          .animate-scroll {
            animation: scroll 4s linear infinite;
          }
        }
      `}</style>
    </div>
  );
};

export default Scroll;