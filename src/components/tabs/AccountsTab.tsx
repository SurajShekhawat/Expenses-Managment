'use client';

import React, { useState } from 'react';
import { 
  Landmark, 
  Wallet, 
  CreditCard, 
  Banknote, 
  LineChart, 
  Plus, 
  ArrowRightLeft, 
  Trash2, 
  Edit3,
  Check,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { FinancialData, FinancialAccount, AccountType } from '@/types/finance';
import { formatINR } from '@/lib/formatters';
import { getCreditCardOptimization } from '@/lib/creditCardOptimizer';

interface AccountsTabProps {
  data: FinancialData;
  onOpenAddModal: (type: 'account') => void;
  onUpdateAccountBalance: (accountId: string, newBalance: number) => void;
  onDeleteAccount: (accountId: string) => void;
  onTransferFunds: (fromAccountId: string, toAccountId: string, amount: number, note: string) => void;
  privacyMode?: boolean;
}

const ACCOUNT_ICONS: Record<AccountType, React.ReactNode> = {
  bank: <Landmark className="h-5 w-5 text-blue-600" />,
  wallet: <Wallet className="h-5 w-5 text-cyan-600" />,
  credit_card: <CreditCard className="h-5 w-5 text-orange-600" />,
  cash: <Banknote className="h-5 w-5 text-emerald-600" />,
  demat_trading: <LineChart className="h-5 w-5 text-indigo-600" />,
};

export const AccountsTab: React.FC<AccountsTabProps> = ({
  data,
  onOpenAddModal,
  onUpdateAccountBalance,
  onDeleteAccount,
  onTransferFunds,
  privacyMode = false,
}) => {
  // Editing balance state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempBalance, setTempBalance] = useState<string>('');

  // Fund Transfer state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [fromAcc, setFromAcc] = useState<string>(data.accounts[0]?.id || '');
  const [toAcc, setToAcc] = useState<string>(data.accounts[1]?.id || '');
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [transferNote, setTransferNote] = useState<string>('Self Account Transfer');

  // Calculations
  const liquidAccounts = data.accounts.filter((a) => a.accountType !== 'credit_card');
  const totalLiquidCash = liquidAccounts.reduce((acc, a) => acc + a.balance, 0);

  const creditCards = data.accounts.filter((a) => a.accountType === 'credit_card');
  const totalCardOutstanding = creditCards.reduce((acc, a) => acc + a.balance, 0);

  const startEdit = (acc: FinancialAccount) => {
    setEditingId(acc.id);
    setTempBalance(acc.balance.toString());
  };

  const saveEdit = (accId: string) => {
    const parsed = parseFloat(tempBalance);
    if (!isNaN(parsed)) {
      onUpdateAccountBalance(accId, parsed);
    }
    setEditingId(null);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid transfer amount');
      return;
    }
    if (fromAcc === toAcc) {
      alert('From and To accounts cannot be identical');
      return;
    }

    onTransferFunds(fromAcc, toAcc, amount, transferNote);
    setTransferAmount('');
    setShowTransferModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Credit Card Free Credit Period & Billing Cycle Optimizer */}
      {getCreditCardOptimization(data.accounts).length > 0 && (
        <div className="p-4 rounded-2xl glass-panel space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Credit Card Optimizer & Free Credit Engine</h2>
            </div>
            <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Up to 50 Days Free Credit
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {getCreditCardOptimization(data.accounts).map((advice) => (
              <div 
                key={advice.card.id}
                className={`p-3.5 rounded-xl border transition ${
                  advice.isBestChoice ? 'bg-emerald-50/80 border-emerald-300 shadow-xs ring-1 ring-emerald-300' : 'bg-white/60 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{advice.card.name}</span>
                    {advice.isBestChoice && (
                      <span className="text-[9px] bg-emerald-600 text-white font-extrabold px-1.5 py-0.5 rounded uppercase">
                        Best to Spend Today
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-extrabold text-blue-700">
                    ~{advice.daysFreeCreditRemaining} Days Free Credit
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-200/60 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Statement Date</span>
                    <strong className="text-slate-700">{advice.statementDateFormatted}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Due Date</span>
                    <strong className="text-slate-700">{advice.dueDateFormatted}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Limit Utilization</span>
                    <strong className={advice.isSafeUtilization ? 'text-emerald-700' : 'text-rose-600'}>
                      {advice.utilizationPercent}% {advice.isSafeUtilization ? '(Safe)' : '(High)'}
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Banner: Liquid Wealth vs Card Dues */}
      <div className="rounded-2xl p-6 glass-panel relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                Total Liquid Bank & Cash Balance
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                {data.accounts.length} Accounts Active
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 mt-1">
              {formatINR(totalLiquidCash, false, privacyMode)}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Money ready in savings accounts, digital wallets & cash.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {creditCards.length > 0 && (
              <div className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-200/80">
                <span className="text-[11px] text-orange-700 block font-medium">Credit Card Dues</span>
                <span className="text-base font-bold text-orange-900">{formatINR(totalCardOutstanding, false, privacyMode)}</span>
              </div>
            )}

            <button
              onClick={() => setShowTransferModal(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs sm:text-sm border border-slate-200 transition active:scale-95"
            >
              <ArrowRightLeft className="h-4 w-4 text-blue-600" />
              <span>Transfer Funds</span>
            </button>

            <button
              onClick={() => onOpenAddModal('account')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.accounts.length === 0 && (
          <div className="col-span-full p-12 text-center rounded-2xl glass-card flex flex-col items-center justify-center space-y-3">
            <div className="p-4 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
              <Landmark className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Koi Bank Account ya Wallet nahi hai</h3>
            <p className="text-xs text-slate-500 max-w-sm">Apna pehla bank account, credit card ya cash balance add kijiye taaki aap apna balance track kar sakein.</p>
            <button 
              onClick={() => onOpenAddModal('account')} 
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-xs transition"
            >
              + Pehla Account Add Karein
            </button>
          </div>
        )}
        {data.accounts.map((acc) => {
          const isCard = acc.accountType === 'credit_card';
          const isEditing = editingId === acc.id;

          return (
            <div
              key={acc.id}
              className="p-5 rounded-2xl glass-card hover:bg-white/85 border border-white/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group hover:-translate-y-0.5"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="p-2.5 rounded-xl border"
                      style={{ 
                        backgroundColor: `${acc.color || '#0284c7'}15`,
                        borderColor: `${acc.color || '#0284c7'}30`,
                      }}
                    >
                      {ACCOUNT_ICONS[acc.accountType]}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{acc.name}</h3>
                      <p className="text-[11px] text-slate-500">
                        {acc.accountType.toUpperCase()} {acc.accountNumberMasked && `• ${acc.accountNumberMasked}`}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteAccount(acc.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Delete Account"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Balance Display / In-place Edit */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium block">
                    {isCard ? 'Current Outstanding' : 'Available Balance'}
                  </span>
                  
                  {isEditing ? (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                        <input
                          type="number"
                          step="any"
                          value={tempBalance}
                          onChange={(e) => setTempBalance(e.target.value)}
                          className="w-full pl-6 pr-2 py-1 text-sm font-bold border border-blue-400 rounded-lg focus:outline-none"
                          autoFocus
                        />
                      </div>
                      <button
                        onClick={() => saveEdit(acc.id)}
                        className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                        title="Save"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mt-0.5">
                      <span className={`text-xl font-extrabold ${isCard ? 'text-orange-600' : 'text-slate-900'}`}>
                        {formatINR(acc.balance, false, privacyMode)}
                      </span>
                      <button
                        onClick={() => startEdit(acc)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 transition"
                        title="Update balance directly"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {isCard && acc.creditLimit && (() => {
                    const utilization = Math.min(100, Math.round((acc.balance / acc.creditLimit) * 100));
                    const isSafe = utilization <= 30;
                    const isWarning = utilization > 30 && utilization <= 50;
                    const isDanger = utilization > 50;

                    return (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">CIBIL 30% Utilization:</span>
                          <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                            isSafe 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : isWarning 
                              ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {utilization}% • {isSafe ? 'Healthy' : isWarning ? 'Elevated' : 'High Risk!'}
                          </span>
                        </div>

                        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              isSafe ? 'bg-emerald-600' : isWarning ? 'bg-amber-500' : 'bg-rose-600'
                            }`}
                            style={{ width: `${utilization}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                          <span>Available: <strong className="text-emerald-700">{formatINR(acc.creditLimit - acc.balance, true, privacyMode)}</strong></span>
                          <span>Limit: {formatINR(acc.creditLimit, true, privacyMode)}</span>
                        </div>

                        {acc.balance > 0 && (
                          <button
                            onClick={() => {
                              const bankAcc = data.accounts.find(a => a.accountType === 'bank' && a.id !== acc.id);
                              if (bankAcc) setFromAcc(bankAcc.id);
                              setToAcc(acc.id);
                              setTransferAmount(acc.balance.toString());
                              setTransferNote(`Credit card bill payment for ${acc.name}`);
                              setShowTransferModal(true);
                            }}
                            className="w-full mt-2 py-1.5 px-2 bg-orange-50 hover:bg-orange-100 text-orange-800 rounded-lg text-[11px] font-bold border border-orange-200 transition flex items-center justify-center gap-1.5"
                          >
                            <span>Pay Card Bill ({formatINR(acc.balance, true, privacyMode)})</span>
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="text-[11px] flex items-center gap-1 text-emerald-600 font-medium">
                  <ShieldCheck className="h-3.5 w-3.5" /> Active & Synced
                </span>
                <button
                  onClick={() => startEdit(acc)}
                  className="text-blue-600 hover:text-blue-700 font-semibold text-[11px]"
                >
                  Adjust Balance →
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Inter-Account Fund Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl glass-modal p-6 text-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-blue-600" />
                <span>Transfer Money Between Accounts</span>
              </h3>
              <button
                onClick={() => setShowTransferModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  From Account (Paisa kahan se nikalega)
                </label>
                <select
                  value={fromAcc}
                  onChange={(e) => setFromAcc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:ring-2 focus:ring-blue-500"
                >
                  {data.accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatINR(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  To Account (Paisa kahan jama hoga)
                </label>
                <select
                  value={toAcc}
                  onChange={(e) => setToAcc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:ring-2 focus:ring-blue-500"
                >
                  {data.accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatINR(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Transfer Amount (₹) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 5000"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Added funds to Zerodha, Transferred to savings"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-md shadow-blue-600/20"
                >
                  Complete Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
