'use client';

import React, { useState } from 'react';
import { 
  Wallet, 
  Receipt, 
  TrendingUp, 
  Building2, 
  Landmark, 
  MoreHorizontal,
  Target,
  Calendar,
  ShieldCheck,
  X,
  LogOut,
  Bot,
  Sparkles
} from 'lucide-react';
import { NavTabType } from './Navbar';
import { FinGrowwLogo } from './FinGrowwLogo';
import { User } from '@/types/auth';

interface MobileBottomNavProps {
  activeTab: NavTabType;
  setActiveTab: (tab: NavTabType) => void;
  currentUser?: User | null;
  onLogout?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const mainNavItems = [
    { id: 'overview' as NavTabType, label: 'Home', icon: Wallet },
    { id: 'accounts' as NavTabType, label: 'Banks', icon: Landmark },
    { id: 'expenses' as NavTabType, label: 'Kharcha', icon: Receipt },
    { id: 'investments' as NavTabType, label: 'Groww', icon: TrendingUp },
    { id: 'loans' as NavTabType, label: 'Loans', icon: Building2 },
  ];

  const handleSelectMoreTab = (tab: NavTabType) => {
    setActiveTab(tab);
    setShowMoreMenu(false);
  };

  const isMoreActive = activeTab === 'subscriptions' || activeTab === 'insurance_tax' || activeTab === 'fire_goals';

  return (
    <>
      {/* More Options Popover on Mobile */}
      {showMoreMenu && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex items-end">
          <div className="w-full glass-modal rounded-t-3xl border-t border-white/80 p-5 space-y-3 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-white/40">
              <div className="flex items-center gap-2">
                <FinGrowwLogo size={24} />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">More Financial Tools</span>
              </div>
              <button onClick={() => setShowMoreMenu(false)} className="p-1 rounded-lg text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <button
                onClick={() => handleSelectMoreTab('fire_goals')}
                className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition ${
                  activeTab === 'fire_goals' ? 'bg-amber-50/80 border-amber-300 text-amber-800' : 'bg-white/60 border-white/80 text-slate-700'
                }`}
              >
                <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
                  <Target className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold">FIRE & Score</span>
              </button>

              <button
                onClick={() => handleSelectMoreTab('subscriptions')}
                className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition ${
                  activeTab === 'subscriptions' ? 'bg-purple-50/80 border-purple-300 text-purple-800' : 'bg-white/60 border-white/80 text-slate-700'
                }`}
              >
                <div className="p-2 rounded-xl bg-purple-100 text-purple-600">
                  <Calendar className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold">Subscriptions</span>
              </button>

              <button
                onClick={() => handleSelectMoreTab('insurance_tax')}
                className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition ${
                  activeTab === 'insurance_tax' ? 'bg-emerald-50/80 border-emerald-300 text-emerald-800' : 'bg-white/60 border-white/80 text-slate-700'
                }`}
              >
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold">Insurance/Tax</span>
              </button>
            </div>

            {/* FinGuru AI Advisor Quick Trigger */}
            <button
              onClick={() => {
                setShowMoreMenu(false);
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('open_finguru'));
                }
              }}
              className="w-full p-3 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between shadow-lg cursor-pointer hover:opacity-95 transition"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500 text-slate-900 shadow-md">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-black block flex items-center gap-1">
                    FinGuru AI CA Advisor <Sparkles className="h-3 w-3 text-emerald-400 fill-emerald-400" />
                  </span>
                  <span className="text-[10px] text-emerald-400">Ask any question on Tax, SIP & Loans</span>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2 py-1 rounded-lg bg-white/10 text-emerald-300">
                Open ↗
              </span>
            </button>

            {/* Mobile User Profile & Logout */}
            {currentUser && onLogout && (
              <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs uppercase">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">{currentUser.name}</span>
                    <span className="text-[10px] text-slate-400 block">@{currentUser.username}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    onLogout();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 font-bold text-xs border border-rose-200 flex items-center gap-1.5 hover:bg-rose-100 transition"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/75 backdrop-blur-xl border-t border-white/80 shadow-lg px-2 py-1.5">
        <div className="flex items-center justify-around">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-emerald-700 font-bold scale-105'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className={`p-1 rounded-lg ${isActive ? 'bg-emerald-50' : ''}`}>
                  <Icon className={`h-5 w-5 ${isActive ? 'text-emerald-600 stroke-[2.5]' : ''}`} />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* More Button */}
          <button
            onClick={() => setShowMoreMenu(true)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 ${
              isMoreActive
                ? 'text-amber-700 font-bold scale-105'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className={`p-1 rounded-lg ${isMoreActive ? 'bg-amber-50' : ''}`}>
              <MoreHorizontal className={`h-5 w-5 ${isMoreActive ? 'text-amber-600 stroke-[2.5]' : ''}`} />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};
