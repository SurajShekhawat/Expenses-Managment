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
      {/* Premium FinTech Geometric Growth Emblem */}
      <div 
        className="relative shrink-0 flex items-center justify-center rounded-2xl shadow-sm transition-transform hover:scale-105"
        style={{ 
          width: size, 
          height: size,
          background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%)',
          boxShadow: '0 4px 14px -2px rgba(5, 150, 105, 0.35), inset 0 1px 1px 0 rgba(255, 255, 255, 0.4)'
        }}
      >
        <svg 
          viewBox="0 0 44 44" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-[70%] h-[70%]"
        >
          {/* Subtle Ambient Backing Glow */}
          <circle cx="22" cy="22" r="18" fill="white" fillOpacity="0.06" />

          {/* Stepped Pillars of Wealth / Growth Bar Chart */}
          <rect x="8" y="24" width="4.5" height="11" rx="2" fill="white" fillOpacity="0.45" />
          <rect x="15.5" y="19" width="4.5" height="16" rx="2" fill="white" fillOpacity="0.75" />
          <rect x="23" y="14" width="4.5" height="21" rx="2" fill="white" fillOpacity="0.95" />

          {/* Dynamic Ascending Dhan-Vridhi Arrow */}
          <path 
            d="M9 22L17.5 14.5L25 18.5L34.5 9" 
            stroke="#ecfdf5" 
            strokeWidth="3.2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          {/* Arrow Pointer Head */}
          <path 
            d="M28.5 9H34.5V15" 
            stroke="#ecfdf5" 
            strokeWidth="3.2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />

          {/* Spark of Prosperity (Lakshmi / Dhan Sparkle) */}
          <circle cx="34.5" cy="9" r="2" fill="#34d399" />
        </svg>
      </div>

      {showText && (
        <div className="leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 font-sans">
              Fin<span className="text-emerald-600">Groww</span>
            </span>
            <span className="text-[10px] font-extrabold tracking-wider uppercase px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80">
              PRO
            </span>
          </div>
          {tagline && (
            <p className="text-[11px] font-medium text-slate-500 tracking-tight">
              DhanVridhi • Personal Wealth Engine
            </p>
          )}
        </div>
      )}
    </div>
  );
};
