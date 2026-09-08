import React from 'react';

interface OnpeLogoProps {
  className?: string;
  onClick?: () => void;
}

export const OnpeLogo: React.FC<OnpeLogoProps> = ({ className = 'h-16 md:h-20 w-auto', onClick }) => {
  return (
    <div 
      id="onpe-official-logo-wrapper" 
      className={`flex items-center justify-center select-none cursor-pointer active:scale-98 transition-transform touch-manipulation ${className}`}
      onClick={onClick}
    >
      <svg 
        id="onpe-logo-svg"
        viewBox="0 0 500 240" 
        className="h-full w-auto"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Shadow filter for the ballot paper */}
        <defs>
          <filter id="ballot-shadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="3" dy="4" stdDeviation="2" floodColor="#000000" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* STYLIZED HAND AND BALLOT (Based on onp.png) */}
        <g id="voting-symbol" transform="translate(0, 5)">
          {/* 1. White ballot paper with shadow */}
          <path 
            d="M 235 55 L 295 40 L 310 95 L 250 110 Z" 
            fill="#FFFFFF" 
            filter="url(#ballot-shadow)"
          />

          {/* 2. Red hand coming from above */}
          {/* Left sleeve/arm line */}
          <path 
            d="M 205 2 L 210 48" 
            stroke="#D12026" 
            strokeWidth="4.5" 
            strokeLinecap="round"
          />

          {/* Finger 1 (Little) */}
          <path 
            d="M 226 44 L 226 56 C 226 63, 233 63, 233 56 L 233 41" 
            stroke="#D12026" 
            strokeWidth="4.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />

          {/* Finger 2 (Ring) */}
          <path 
            d="M 244 38 L 244 61 C 244 68, 251 68, 251 61 L 251 36" 
            stroke="#D12026" 
            strokeWidth="4.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />

          {/* Finger 3 (Middle) */}
          <path 
            d="M 262 33 L 262 67 C 262 74, 269 74, 269 67 L 269 29" 
            stroke="#D12026" 
            strokeWidth="4.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />

          {/* Finger 4 (Index) */}
          <path 
            d="M 280 24 L 280 60 C 280 67, 287 67, 287 60 L 287 14" 
            stroke="#D12026" 
            strokeWidth="4.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />

          {/* Thumb/Right arm curve */}
          <path 
            d="M 295 2 C 300 12, 305 22, 298 31 C 294 36, 291 40, 295 44" 
            stroke="#D12026" 
            strokeWidth="4.5" 
            strokeLinecap="round"
          />
        </g>

        {/* ONPE WORDMARK (Centered as in onp.png) */}
        <g id="onpe-text-lockup">
          {/* "ONPE" title in high contrast dark blue */}
          <text 
            x="250" 
            y="170" 
            textAnchor="middle"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Plus Jakarta Sans', Arial, sans-serif" 
            fontWeight="900" 
            fontSize="84" 
            fill="#002E5D" 
            letterSpacing="-1.5"
          >
            ONPE
          </text>
          
          {/* Subtitle: "Oficina Nacional de Procesos Electorales" */}
          <text 
            x="250" 
            y="208" 
            textAnchor="middle"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Plus Jakarta Sans', Arial, sans-serif" 
            fontWeight="750" 
            fontSize="18" 
            fill="#002E5D" 
            letterSpacing="-0.2"
          >
            Oficina Nacional de Procesos Electorales
          </text>

          {/* Bottom Solid Red Bar spanning the full bottom layout */}
          <rect 
            x="5" 
            y="226" 
            width="490" 
            height="8" 
            fill="#D12026" 
            rx="2"
          />
        </g>
      </svg>
    </div>
  );
};
