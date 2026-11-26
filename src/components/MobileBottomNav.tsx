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
  X
} from 'lucide-react';
import { NavTabType } from './Navbar';
import { FinGrowwLogo } from './FinGrowwLogo';

interface MobileBottomNavProps {
  activeTab: NavTabType;
  setActiveTab: (tab: NavTabType) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
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
