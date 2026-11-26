'use client';

import React, { useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, Landmark } from 'lucide-react';
import { Transaction, TransactionType, PaymentMode, ExpenseCategory, IncomeCategory, FinancialAccount } from '@/types/finance';
import { getTodayDateString, formatINR } from '@/lib/formatters';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: FinancialAccount[];
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Food & Dining',
  'Rent & Housing',
  'Utilities & Bills',
  'Groceries',
  'Transportation',
  'Shopping & Lifestyle',
  'Entertainment & Subscriptions',
  'Healthcare & Medical',
  'Education & Learning',
  'Travel & Vacation',
  'EMI & Debt Payment',
  'Investment (Self-transfer)',
  'Other Expense',
];

const INCOME_CATEGORIES: IncomeCategory[] = [
  'Salary / Wages',
  'Business / Freelance',
  'Stock Dividend / Returns',
  'Rental Income',
  'Gift / Cashback',
  'Interest Income',
  'Other Income',
];

const PAYMENT_MODES: PaymentMode[] = ['UPI', 'Credit Card', 'Debit Card', 'NetBanking', 'Cash'];

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onAdd,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id || '');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>('2026-11-21');

  React.useEffect(() => {
    setDate(getTodayDateString());
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    onAdd({
      type,
      amount: parsedAmount,
      category,
      paymentMode,
      accountId: accountId || undefined,
      description: description.trim() || (type === 'income' ? 'Income' : 'Expense'),
      date,
    });

    setAmount('');
    setDescription('');
    onClose();
  };

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory(newType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl glass-modal p-4 sm:p-6 max-h-[90vh] overflow-y-auto text-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            Record New Transaction
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
          
          {/* Income vs Expense Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownRight className="h-4 w-4" />
              <span>Kharcha (Expense)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="h-4 w-4" />
              <span>Income (Kamai)</span>
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Amount (₹ INR) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                step="any"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Account Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Landmark className="h-3.5 w-3.5 text-blue-600" />
              <span>{type === 'expense' ? 'Paid From Account / Bank' : 'Deposit To Account / Bank'}</span>
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-medium"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({formatINR(acc.balance)})
                </option>
              ))}
            </select>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            >
              {(type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Mode
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {PAYMENT_MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition ${
                    paymentMode === mode
                      ? 'bg-slate-900 border-slate-900 text-white font-semibold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-100 bg-slate-50'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Swiggy lunch, Chai with friends, Client invoice"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className={`w-full py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition shadow-sm ${
                type === 'expense'
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              Save {type === 'expense' ? 'Kharcha' : 'Income'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
