'use client';

import React, { useState, useEffect } from 'react';
import { FinGrowwLogo } from '@/components/FinGrowwLogo';
import { ShieldCheck, Lock, Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

const SYNC_STEPS = [
  'Securing session & encrypted vault...',
  'Connecting to Hostinger MySQL & Cache...',
  'Syncing bank accounts & Groww portfolio...',
  'Preparing your DhanVridhi Command Center...'
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % SYNC_STEPS.length);
    }, 1200);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 bg-[#f4f8fa] text-[#001D39] font-sans select-none overflow-hidden">
      
      {/* Ambient Frosted Glows */}
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#BDD8E9]/40 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-[#7BBDE8]/30 blur-3xl pointer-events-none" />

      {/* Top Spacer */}
      <div className="w-full flex justify-end">
        <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-[#BDD8E9]/50 text-[#001D39] border border-[#7BBDE8]/60 shadow-xs">
          v2.0 DhanVridhi
        </span>
      </div>

      {/* Centerpiece: Emblem, Brand & Animated Meter */}
      <div className="flex flex-col items-center justify-center text-center space-y-6 max-w-sm w-full -mt-6">
        
        {/* Breathing Logo Tile */}
        <div className="relative">
          <div className="p-3.5 rounded-2xl glass-modal border border-[#BDD8E9] shadow-md shadow-[#001D39]/10 relative z-10 animate-pulse">
            <FinGrowwLogo size={56} />
          </div>
          <div className="absolute inset-0 rounded-2xl bg-[#7BBDE8]/30 blur-lg animate-ping opacity-25" />
        </div>

        {/* Brand Name & Tagline */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#001D39]">
            Fin<span className="text-[#0A4174]">Groww</span>
          </h1>
          <p className="text-xs font-semibold text-[#49769F]">
            Personal Wealth, Accounts & FIRE Center
          </p>
        </div>

        {/* Custom High-Precision Progress Bar */}
        <div className="w-48 sm:w-56 space-y-3 pt-2">
          <div className="h-1.5 w-full bg-[#BDD8E9]/70 rounded-full overflow-hidden p-0.5 shadow-inner">
            <div className="h-full bg-[#0A4174] rounded-full animate-[progress_1.6s_ease-in-out_infinite]" />
          </div>

          {/* Changing Synced Message */}
          <div className="h-6 flex items-center justify-center">
            <p className="text-[11px] font-bold text-[#0A4174] transition-all duration-300 animate-fadeIn flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-[#4E8EA2] animate-spin" />
              <span>{message || SYNC_STEPS[stepIndex]}</span>
            </p>
          </div>
        </div>

      </div>

      {/* Bottom Trust & Security Assurance */}
      <div className="flex items-center gap-2 text-[11px] font-bold text-[#49769F] pb-2">
        <Lock className="h-3.5 w-3.5 text-[#0A4174]" />
        <span>Bank-Grade 256-Bit Encryption • 100% Private</span>
      </div>

    </div>
  );
};
