
import React from 'react';

interface LogoProps {
  className?: string;
  disableAnimation?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-10 h-10", disableAnimation = false }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={`${className} ${!disableAnimation ? 'group-hover:rotate-[30deg] transition-transform duration-700 ease-out' : ''}`} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Background Glow */}
      <circle cx="50" cy="50" r="40" fill="url(#logo-gradient)" opacity="0.1" filter="url(#glow)" />

      {/* Aperture Shutter Blades - Geometric construction */}
      <g stroke="url(#logo-gradient)" strokeWidth="0" fill="url(#logo-gradient)">
        {/* Blade 1 */}
        <path d="M50 50 L50 10 A40 40 0 0 1 85 30 Z" opacity="0.9" />
        {/* Blade 2 */}
        <path d="M50 50 L85 30 A40 40 0 0 1 85 70 Z" opacity="0.7" />
        {/* Blade 3 */}
        <path d="M50 50 L85 70 A40 40 0 0 1 50 90 Z" opacity="0.9" />
        {/* Blade 4 */}
        <path d="M50 50 L50 90 A40 40 0 0 1 15 70 Z" opacity="0.7" />
        {/* Blade 5 */}
        <path d="M50 50 L15 70 A40 40 0 0 1 15 30 Z" opacity="0.9" />
        {/* Blade 6 */}
        <path d="M50 50 L15 30 A40 40 0 0 1 50 10 Z" opacity="0.7" />
      </g>

      {/* Outer Ring */}
      <circle cx="50" cy="50" r="46" stroke="url(#logo-gradient)" strokeWidth="3" strokeOpacity="0.5" />
      <circle cx="50" cy="50" r="38" stroke="white" strokeWidth="1" strokeOpacity="0.2" />

      {/* Central AI Sparkle (Iris) */}
      <g transform="translate(50, 50)">
         <circle r="12" fill="white" />
         <path d="M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2 Z" fill="#3b82f6" />
      </g>
    </svg>
  );
};
