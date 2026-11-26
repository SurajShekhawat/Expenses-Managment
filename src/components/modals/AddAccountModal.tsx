'use client';

import React, { useState } from 'react';
import { X, Landmark, Wallet, CreditCard, Banknote, LineChart } from 'lucide-react';
import { FinancialAccount, AccountType } from '@/types/finance';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (account: Omit<FinancialAccount, 'id'>) => void;
}

const ACCOUNT_TYPES: { type: AccountType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'bank', label: 'Bank Account (Savings / Current)', icon: <Landmark className="h-4 w-4" />, color: '#0284c7' },
  { type: 'wallet', label: 'Digital Wallet (Paytm/PhonePe)', icon: <Wallet className="h-4 w-4" />, color: '#0891b2' },
  { type: 'credit_card', label: 'Credit Card', icon: <CreditCard className="h-4 w-4" />, color: '#ea580c' },
  { type: 'cash', label: 'Cash in Hand / Pocket', icon: <Banknote className="h-4 w-4" />, color: '#16a34a' },
  { type: 'demat_trading', label: 'Trading / Demat Account (Zerodha/Groww)', icon: <LineChart className="h-4 w-4" />, color: '#6366f1' },
];

export const AddAccountModal: React.FC<AddAccountModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('bank');
  const [balance, setBalance] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [accountNumberMasked, setAccountNumberMasked] = useState('');
  const [color, setColor] = useState('#0284c7');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const bal = parseFloat(balance);
    if (isNaN(bal)) {
      alert('Please enter a valid balance');
      return;
    }

    onAdd({
      name: name.trim() || 'My Account',
      accountType,
      balance: bal,
      creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
      accountNumberMasked: accountNumberMasked.trim() || undefined,
      color,
    });

    setName('');
    setBalance('');
    setCreditLimit('');
    setAccountNumberMasked('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#001D39]/40 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-2xl glass-modal p-5 sm:p-6 pb-[max(1.5rem,calc(1rem+env(safe-area-inset-bottom,0px)))] max-h-[92vh] sm:max-h-[90vh] overflow-y-auto text-slate-800 animate-in slide-in-from-bottom-4 sm:fade-in duration-200">
        
        {/* Mobile Pull Indicator */}
        <div className="sm:hidden w-10 h-1 bg-[#BDD8E9] rounded-full mx-auto mb-2 opacity-80" />
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#BDD8E9]/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#001D39]">Add New Account / Bank</h2>
              <p className="text-[11px] sm:text-xs text-[#49769F]">Track balance in your bank, wallet, or card</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          {/* Account Type Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Account Type *
            </label>
            <div className="space-y-1.5">
              {ACCOUNT_TYPES.map((t) => (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => {
                    setAccountType(t.type);
                    setColor(t.color);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl border text-xs font-medium transition ${
                    accountType === t.type
                      ? 'border-blue-500 bg-blue-50/60 text-blue-800 font-semibold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span style={{ color: t.color }}>{t.icon}</span>
                    <span>{t.label}</span>
                  </div>
                  {accountType === t.type && (
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Account Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Account / Bank Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. HDFC Salary Account, SBI Savings, Cash, ICICI Amazon Card"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Current Balance */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {accountType === 'credit_card' ? 'Current Outstanding Dues (₹) *' : 'Current Available Balance (₹) *'}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                step="any"
                required
                placeholder="0.00"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-semibold text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Credit Limit (If credit card) */}
          {accountType === 'credit_card' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Credit Limit (₹ optional)
              </label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 150000"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          )}

          {/* Account Number Last 4 digits */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Account / Card Last 4 Digits (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. •••• 4892"
              value={accountNumberMasked}
              onChange={(e) => setAccountNumberMasked(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition shadow-md shadow-blue-600/20 active:scale-98"
            >
              Save Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
