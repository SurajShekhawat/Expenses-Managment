'use client';

import React, { useState } from 'react';
import { 
  TrendingUp, 
  Wallet, 
  Receipt, 
  Building2, 
  Target, 
  Download, 
  RotateCcw, 
  PlusCircle,
  ShieldCheck,
  Landmark,
  Calendar,
  Compass,
  FileCheck2,
  Mic,
  FileSpreadsheet,
  Users,
  Printer,
  Eye,
  EyeOff,
  Lock,
  MoreHorizontal
} from 'lucide-react';
import { formatINR } from '@/lib/formatters';
import { FinGrowwLogo } from './FinGrowwLogo';

export type NavTabType = 
  | 'overview' 
  | 'accounts' 
  | 'expenses' 
  | 'investments' 
  | 'loans' 
  | 'subscriptions' 
  | 'insurance_tax' 
  | 'fire_goals';

interface NavbarProps {
  activeTab: NavTabType;
  setActiveTab: (tab: NavTabType) => void;
  netWorth: number;
  totalLiquidCash: number;
  dbSource?: 'mysql' | 'local';
  onOpenAddModal: (type: 'transaction' | 'investment' | 'loan' | 'account') => void;
  onOpenSmsParser: () => void;
  onOpenVoiceModal?: () => void;
  onOpenCsvModal?: () => void;
  onOpenGroupSplit?: () => void;
  onGenerateReport?: () => void;
  isPrivacyMode?: boolean;
  onTogglePrivacyMode?: () => void;
  onLockApp?: () => void;
  onExport: () => void;
  onReset: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  netWorth,
  totalLiquidCash,
  dbSource = 'mysql',
  onOpenAddModal,
  onOpenSmsParser,
  onOpenVoiceModal,
  onOpenCsvModal,
  onOpenGroupSplit,
  onGenerateReport,
  isPrivacyMode = false,
  onTogglePrivacyMode,
  onLockApp,
  onExport,
  onReset,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/60 bg-white/75 backdrop-blur-xl shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Row 1: Brand, Metrics & Action Suite (Clean Laptop View) */}
        <div className="flex items-center justify-between h-16 gap-3 lg:gap-6">
          
          {/* Left: Brand Identity with Custom Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <FinGrowwLogo size={40} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 font-sans">
                  Fin<span className="text-emerald-600">Groww</span>
                </span>
                <span className="text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-xs">
                  DhanVridhi
                </span>
                {dbSource === 'mysql' ? (
                  <span className="hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50/80 backdrop-blur-md text-emerald-700 border border-emerald-200/80 shadow-xs items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Hostinger MySQL</span>
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/60 backdrop-blur-md text-slate-600 border border-white/80 shadow-xs items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                    <span>Local Cache</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden xl:block">
                Wealth, Balances & Protection Hub
              </p>
            </div>
          </div>

          {/* Right: Balance Metrics & Primary Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            
            {/* Quick Metrics Duo */}
            <div className="hidden md:flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/60 backdrop-blur-md border border-white/80 shadow-xs">
                <Landmark className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block leading-none">Bank & Cash</span>
                  <p className="text-xs font-extrabold text-slate-900 mt-0.5 leading-none">
                    {formatINR(totalLiquidCash, false, isPrivacyMode)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/60 backdrop-blur-md border border-white/80 shadow-xs">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block leading-none">Net Worth</span>
                  <p className="text-xs font-extrabold text-slate-900 mt-0.5 leading-none">
                    {formatINR(netWorth, false, isPrivacyMode)}
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy Mode Toggle */}
            {onTogglePrivacyMode && (
              <button
                onClick={onTogglePrivacyMode}
                title={isPrivacyMode ? 'Show Balances' : 'Hide Balances (Privacy Mode)'}
                className={`p-2 rounded-xl backdrop-blur-md border transition text-xs flex items-center justify-center shadow-xs ${
                  isPrivacyMode 
                    ? 'bg-purple-50/90 text-purple-700 border-purple-200 font-bold' 
                    : 'bg-white/60 hover:bg-white/90 text-slate-600 border-white/80'
                }`}
              >
                {isPrivacyMode ? <EyeOff className="h-4 w-4 text-purple-600" /> : <Eye className="h-4 w-4 text-slate-500" />}
              </button>
            )}

            {/* Lock App Button */}
            {onLockApp && (
              <button
                onClick={onLockApp}
                title="Lock FinGroww with Master PIN"
                className="p-2 rounded-xl bg-white/60 backdrop-blur-md hover:bg-white/90 text-slate-600 border border-white/80 transition text-xs flex items-center justify-center shadow-xs"
              >
                <Lock className="h-4 w-4 text-slate-500" />
              </button>
            )}

            {/* More Menu (Backup & Clear Data) */}
            <div className="relative">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                title="Backup & Data Options"
                className="p-2 rounded-xl bg-white/60 backdrop-blur-md hover:bg-white/90 text-slate-600 border border-white/80 transition text-xs flex items-center justify-center shadow-xs"
              >
                <MoreHorizontal className="h-4 w-4 text-slate-500" />
              </button>

              {showMoreMenu && (
                <div 
                  className="absolute right-0 top-full mt-1.5 w-48 rounded-2xl glass-modal shadow-2xl py-1.5 z-50 animate-fadeIn"
                  onMouseLeave={() => setShowMoreMenu(false)}
                >
                  <button
                    onClick={() => {
                      onExport();
                      setShowMoreMenu(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-500" />
                    <span>Download Backup (JSON)</span>
                  </button>
                  <button
                    onClick={() => {
                      onReset();
                      setShowMoreMenu(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-rose-500" />
                    <span>Clear & Reset All Data</span>
                  </button>
                </div>
              )}
            </div>

            {/* Primary "+ Add" Button with Dropdown */}
            <div className="relative group">
              <button
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-xs transition active:scale-95"
              >
                <PlusCircle className="h-4 w-4" />
                <span>+ Add Entry</span>
              </button>
              
              <div className="absolute right-0 top-full mt-1.5 w-56 rounded-2xl glass-modal shadow-2xl py-1.5 hidden group-hover:block hover:block z-50">
                <button
                  onClick={() => onOpenAddModal('transaction')}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-emerald-50/80 hover:text-emerald-700 flex items-center gap-2.5 transition"
                >
                  <Receipt className="h-4 w-4 text-emerald-600" />
                  <span>Record Kharcha / Income</span>
                </button>
                {onOpenVoiceModal && (
                  <button
                    onClick={onOpenVoiceModal}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-emerald-50/80 hover:text-emerald-700 flex items-center gap-2.5 transition"
                  >
                    <Mic className="h-4 w-4 text-emerald-600" />
                    <span>Voice Expense Assistant</span>
                  </button>
                )}
                {onOpenCsvModal && (
                  <button
                    onClick={onOpenCsvModal}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-blue-50/80 hover:text-blue-700 flex items-center gap-2.5 transition"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                    <span>Import Bank CSV Statement</span>
                  </button>
                )}
                <button
                  onClick={() => onOpenAddModal('account')}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-blue-50/80 hover:text-blue-700 flex items-center gap-2.5 transition"
                >
                  <Landmark className="h-4 w-4 text-blue-600" />
                  <span>Add Bank Account / Card</span>
                </button>
                <button
                  onClick={() => onOpenAddModal('investment')}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-teal-50/80 hover:text-teal-700 flex items-center gap-2.5 transition"
                >
                  <TrendingUp className="h-4 w-4 text-teal-600" />
                  <span>Add Investment / SIP</span>
                </button>
                <button
                  onClick={() => onOpenAddModal('loan')}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-rose-50/80 hover:text-rose-700 flex items-center gap-2.5 transition"
                >
                  <Building2 className="h-4 w-4 text-rose-600" />
                  <span>Add Loan / Udhaar</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Row 2: Sub-Navigation Tabs & Quick Assist Shortcuts (Balanced Laptop View) */}
        <div className="hidden md:flex items-center justify-between py-2 border-t border-white/60 text-xs">
          
          {/* Left: 8 Navigation Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                activeTab === 'overview'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <Wallet className={`h-3.5 w-3.5 ${activeTab === 'overview' ? 'text-emerald-400' : ''}`} />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('accounts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                activeTab === 'accounts'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <Landmark className={`h-3.5 w-3.5 ${activeTab === 'accounts' ? 'text-blue-400' : ''}`} />
              <span>Bank Accounts</span>
            </button>

            <button
              onClick={() => setActiveTab('expenses')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                activeTab === 'expenses'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <Receipt className={`h-3.5 w-3.5 ${activeTab === 'expenses' ? 'text-amber-400' : ''}`} />
              <span>Kharcha & Budget</span>
            </button>

            <button
              onClick={() => setActiveTab('investments')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                activeTab === 'investments'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <TrendingUp className={`h-3.5 w-3.5 ${activeTab === 'investments' ? 'text-teal-400' : ''}`} />
              <span>Groww Investments</span>
            </button>

            <button
              onClick={() => setActiveTab('loans')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                activeTab === 'loans'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <Building2 className={`h-3.5 w-3.5 ${activeTab === 'loans' ? 'text-rose-400' : ''}`} />
              <span>Loans & Karz</span>
            </button>

            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                activeTab === 'subscriptions'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <Calendar className={`h-3.5 w-3.5 ${activeTab === 'subscriptions' ? 'text-purple-400' : ''}`} />
              <span>Subscriptions</span>
            </button>

            <button
              onClick={() => setActiveTab('insurance_tax')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                activeTab === 'insurance_tax'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <ShieldCheck className={`h-3.5 w-3.5 ${activeTab === 'insurance_tax' ? 'text-emerald-400' : ''}`} />
              <span>Insurance & Tax</span>
            </button>

            <button
              onClick={() => setActiveTab('fire_goals')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                activeTab === 'fire_goals'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <Target className={`h-3.5 w-3.5 ${activeTab === 'fire_goals' ? 'text-amber-400' : ''}`} />
              <span>FIRE & Goals</span>
            </button>
          </div>

          {/* Right: Quick Fast-Entry Helpers (Utilizing the empty space) */}
          <div className="hidden lg:flex items-center gap-2 shrink-0 pl-3">
            {onOpenGroupSplit && (
              <button
                onClick={onOpenGroupSplit}
                title="Split bill with friends"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50/80 hover:bg-purple-100 text-purple-800 font-semibold text-[11px] border border-purple-200/80 transition shadow-xs"
              >
                <Users className="h-3 w-3 text-purple-600" />
                <span>Split Bill</span>
              </button>
            )}

            {onGenerateReport && (
              <button
                onClick={onGenerateReport}
                title="Print or Export CA-Grade Financial PDF Statement"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/90 hover:bg-slate-200 text-slate-800 font-semibold text-[11px] border border-slate-300/80 transition shadow-xs"
              >
                <Printer className="h-3 w-3 text-slate-600" />
                <span>CA Report</span>
              </button>
            )}

            {onOpenVoiceModal && (
              <button
                onClick={onOpenVoiceModal}
                title="Speak to record expense or income"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 font-semibold text-[11px] border border-emerald-200/80 transition shadow-xs"
              >
                <Mic className="h-3 w-3 text-emerald-600" />
                <span>Voice</span>
              </button>
            )}

            <button
              onClick={onOpenSmsParser}
              title="Paste bank SMS to auto-detect transaction"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50/80 hover:bg-amber-100 text-amber-800 font-semibold text-[11px] border border-amber-200/80 transition shadow-xs"
            >
              <Receipt className="h-3 w-3 text-amber-600" />
              <span>Paste SMS</span>
            </button>

            {onOpenCsvModal && (
              <button
                onClick={onOpenCsvModal}
                title="Import statement CSV"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50/80 hover:bg-blue-100 text-blue-800 font-semibold text-[11px] border border-blue-200/80 transition shadow-xs"
              >
                <FileSpreadsheet className="h-3 w-3 text-blue-600" />
                <span>CSV</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
