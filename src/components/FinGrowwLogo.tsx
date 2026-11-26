'use client';

import React from 'react';

interface FinGrowwLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  tagline?: boolean;
}

export const FinGrowwLogo: React.FC<FinGrowwLogoProps> = ({
  className = '',
  size = 40,
  showText = false,
  tagline = false,
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Precision Geometric Monogram Emblem (Clean, Professional, Non-AI) */}
      <div 
        className="relative shrink-0 flex items-center justify-center rounded-xl transition-transform hover:scale-105"
        style={{ 
          width: size, 
          height: size,
          backgroundColor: '#0A4174',
          boxShadow: '0 2px 8px 0 rgba(10, 65, 116, 0.25)',
        }}
      >
        <svg 
          viewBox="0 0 32 32" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-[62%] h-[62%]"
        >
          {/* Lower Base Curve (F/G Foundation) */}
          <path
            d="M7 21C7 23.7614 9.23858 26 12 26H23C24.1046 26 25 25.1046 25 24C25 22.8954 24.1046 22 23 22H12C11.4477 22 11 21.5523 11 21V12"
            stroke="#BDD8E9"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Dynamic Ascending Compounding Arc */}
          <path
            d="M11 15C11 10.5817 14.5817 7 19 7H24C24.5523 7 25 7.44772 25 8V13C25 17.4183 21.4183 21 17 21H16"
            stroke="#ffffff"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Sharp Focal Core Dot */}
          <circle cx="19" cy="13" r="2" fill="#7BBDE8" />
        </svg>
      </div>

      {showText && (
        <div className="leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-[#001D39] font-sans">
              Fin<span className="text-[#0A4174]">Groww</span>
            </span>
            <span className="text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-[#BDD8E9] text-[#001D39]">
              PRO
            </span>
          </div>
          {tagline && (
            <p className="text-[11px] font-medium text-[#49769F] tracking-tight">
              Personal Wealth & Expenses Hub
            </p>
          )}
        </div>
      )}
    </div>
  );
};
