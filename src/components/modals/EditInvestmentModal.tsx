'use client';

import React, { useState, useEffect } from 'react';
import { X, TrendingUp } from 'lucide-react';
import { Investment, AssetType } from '@/types/finance';

interface EditInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  investment: Investment | null;
  onUpdate: (updatedInv: Investment) => void;
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

export const EditInvestmentModal: React.FC<EditInvestmentModalProps> = ({
  isOpen,
  onClose,
  investment,
  onUpdate,
}) => {
  const [name, setName] = useState('');
  const [symbolOrPlatform, setSymbolOrPlatform] = useState('');
  const [assetType, setAssetType] = useState<AssetType>('mutual_funds');
  const [investedAmount, setInvestedAmount] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [sipMonthlyAmount, setSipMonthlyAmount] = useState('');
  const [expectedReturnRate, setExpectedReturnRate] = useState('12');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (investment) {
      setName(investment.name);
      setSymbolOrPlatform(investment.symbolOrPlatform || '');
      setAssetType(investment.assetType);
      setInvestedAmount(String(investment.investedAmount));
      setCurrentValue(String(investment.currentValue));
      setSipMonthlyAmount(investment.sipMonthlyAmount ? String(investment.sipMonthlyAmount) : '');
      setExpectedReturnRate(investment.expectedReturnRate ? String(investment.expectedReturnRate) : '12');
      setNotes(investment.notes || '');
    }
  }, [investment]);

  if (!isOpen || !investment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const invested = parseFloat(investedAmount);
    const current = parseFloat(currentValue || investedAmount);

    if (isNaN(invested) || invested <= 0) {
      alert('Valid invested amount enter karein');
      return;
    }

    onUpdate({
      ...investment,
      name: name.trim() || investment.name,
      symbolOrPlatform: symbolOrPlatform.trim() || undefined,
      assetType,
      investedAmount: invested,
      currentValue: isNaN(current) ? invested : current,
      sipMonthlyAmount: sipMonthlyAmount ? parseFloat(sipMonthlyAmount) : undefined,
      expectedReturnRate: expectedReturnRate ? parseFloat(expectedReturnRate) : undefined,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl glass-modal p-6 max-h-[90vh] overflow-y-auto text-slate-800 animate-in zoom-in-95 duration-150">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-teal-600" />
            <span>Edit Investment Holding</span>
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Asset Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Platform / Broker</label>
              <input
                type="text"
                placeholder="Groww, Zerodha, MF Central"
                value={symbolOrPlatform}
                onChange={(e) => setSymbolOrPlatform(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Asset Category</label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value as AssetType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 font-medium"
              >
                {ASSET_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Invested Capital (₹) *</label>
              <input
                type="number"
                required
                value={investedAmount}
                onChange={(e) => setInvestedAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Current Market Value (₹) *</label>
              <input
                type="number"
                required
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 font-bold text-teal-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Monthly SIP (₹) (Optional)</label>
              <input
                type="number"
                placeholder="e.g. 5000"
                value={sipMonthlyAmount}
                onChange={(e) => setSipMonthlyAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Expected Return (% p.a.)</label>
              <input
                type="number"
                step="0.5"
                value={expectedReturnRate}
                onChange={(e) => setExpectedReturnRate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 font-semibold hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold shadow-md shadow-teal-600/20"
            >
              Update Holding
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
