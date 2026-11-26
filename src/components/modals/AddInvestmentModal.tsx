'use client';

import React, { useState } from 'react';
import { X, TrendingUp } from 'lucide-react';
import { Investment, AssetType } from '@/types/finance';

interface AddInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (investment: Omit<Investment, 'id' | 'lastUpdated'>) => void;
}

const ASSET_TYPES: { label: string; value: AssetType }[] = [
  { label: '📈 Mutual Funds (SIP / Lumpsum)', value: 'mutual_funds' },
  { label: '📊 Stocks / Shares', value: 'stocks' },
  { label: '🪙 Gold / Sovereign Gold Bonds (SGB)', value: 'gold' },
  { label: '🏦 Fixed Deposit (FD / RD)', value: 'fixed_deposit' },
  { label: '🛡️ PPF / EPF (Provident Fund)', value: 'ppf_epf' },
  { label: '₿ Crypto Currency', value: 'crypto' },
  { label: '🏠 Real Estate / Land', value: 'real_estate' },
  { label: '📦 Other Asset', value: 'other' },
];

export const AddInvestmentModal: React.FC<AddInvestmentModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState('');
  const [symbolOrPlatform, setSymbolOrPlatform] = useState('');
  const [assetType, setAssetType] = useState<AssetType>('mutual_funds');
  const [investedAmount, setInvestedAmount] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [sipMonthlyAmount, setSipMonthlyAmount] = useState('');
  const [sipDate, setSipDate] = useState('');
  const [expectedReturnRate, setExpectedReturnRate] = useState('13.5');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const invested = parseFloat(investedAmount);
    const current = parseFloat(currentValue || investedAmount);

    if (isNaN(invested) || invested <= 0) {
      alert('Please enter a valid invested amount');
      return;
    }

    onAdd({
      name: name.trim() || 'Investment Holding',
      symbolOrPlatform: symbolOrPlatform.trim() || undefined,
      assetType,
      investedAmount: invested,
      currentValue: isNaN(current) ? invested : current,
      sipMonthlyAmount: sipMonthlyAmount ? parseFloat(sipMonthlyAmount) : undefined,
      sipDate: sipDate ? parseInt(sipDate) : undefined,
      expectedReturnRate: expectedReturnRate ? parseFloat(expectedReturnRate) : undefined,
      notes: notes.trim() || undefined,
    });

    setName('');
    setInvestedAmount('');
    setCurrentValue('');
    setSipMonthlyAmount('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl glass-modal p-6 max-h-[90vh] overflow-y-auto text-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-teal-600" />
            <span>Add New Groww Investment</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          {/* Asset Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Asset Type *
            </label>
            <select
              value={assetType}
              onChange={(e) => setAssetType(e.target.value as AssetType)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs focus:ring-2 focus:ring-teal-500 focus:bg-white"
            >
              {ASSET_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Name & Platform */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fund / Stock / Asset Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Parag Parikh Flexi Cap, TCS"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:ring-2 focus:ring-teal-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                App / Platform
              </label>
              <input
                type="text"
                placeholder="e.g. Groww, Zerodha, Kuvera"
                value={symbolOrPlatform}
                onChange={(e) => setSymbolOrPlatform(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:ring-2 focus:ring-teal-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Invested vs Current Value */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Invested Amount (₹) *
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="e.g. 50000"
                value={investedAmount}
                onChange={(e) => setInvestedAmount(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold focus:ring-2 focus:ring-teal-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Market Value (₹)
              </label>
              <input
                type="number"
                step="any"
                placeholder="If blank, equals invested"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold focus:ring-2 focus:ring-teal-500 focus:bg-white"
              />
            </div>
          </div>

          {/* SIP & Expected Returns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Monthly SIP (₹ optional)
              </label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 5000"
                value={sipMonthlyAmount}
                onChange={(e) => setSipMonthlyAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:ring-2 focus:ring-teal-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                SIP Day (1-28)
              </label>
              <input
                type="number"
                min="1"
                max="28"
                placeholder="e.g. 5"
                value={sipDate}
                onChange={(e) => setSipDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:ring-2 focus:ring-teal-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Exp. Return %
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="13.5"
                value={expectedReturnRate}
                onChange={(e) => setExpectedReturnRate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:ring-2 focus:ring-teal-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Long-term wealth holding"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:ring-2 focus:ring-teal-500 focus:bg-white"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition shadow-sm bg-teal-600 hover:bg-teal-500 text-white"
            >
              Save Investment Holding
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
