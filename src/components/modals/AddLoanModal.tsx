'use client';

import React, { useState } from 'react';
import { X, Building2, HandCoins } from 'lucide-react';
import { LoanLiability, LoanType, DebtDirection } from '@/types/finance';
import { getTodayDateString } from '@/lib/formatters';

interface AddLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (loan: Omit<LoanLiability, 'id'>) => void;
}

const LOAN_TYPES: { label: string; value: LoanType }[] = [
  { label: '🏠 Home Loan', value: 'home_loan' },
  { label: '🚗 Car / Bike Loan', value: 'car_loan' },
  { label: '💳 Credit Card EMI / Dues', value: 'credit_card_emi' },
  { label: '👤 Personal Loan', value: 'personal_loan' },
  { label: '🎓 Education Loan', value: 'education_loan' },
  { label: '⚡ BNPL / Amazon Pay Later', value: 'bnpl_paylater' },
  { label: '🤝 Udhaar (Friends & Family)', value: 'peer_debt' },
];

export const AddLoanModal: React.FC<AddLoanModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [direction, setDirection] = useState<DebtDirection>('i_owe');
  const [title, setTitle] = useState('');
  const [lenderOrBorrower, setLenderOrBorrower] = useState('');
  const [loanType, setLoanType] = useState<LoanType>('personal_loan');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [remainingBalance, setRemainingBalance] = useState('');
  const [interestRate, setInterestRate] = useState('8.5');
  const [monthlyEmi, setMonthlyEmi] = useState('');
  const [dueDayOfMonth, setDueDayOfMonth] = useState('5');
  const [startDate, setStartDate] = useState('2026-11-21');
  const [tenureMonths, setTenureMonths] = useState('36');
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    setStartDate(getTodayDateString());
  }, []);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const principal = parseFloat(principalAmount);
    const balance = parseFloat(remainingBalance || principalAmount);
    const interest = parseFloat(interestRate || '0');
    const emi = monthlyEmi ? parseFloat(monthlyEmi) : 0;
    const tenure = tenureMonths ? parseInt(tenureMonths) : 12;

    if (isNaN(principal) || principal <= 0) {
      alert('Please enter a valid loan or debt amount');
      return;
    }

    onAdd({
      title: title.trim() || `${loanType} debt`,
      lenderOrBorrower: lenderOrBorrower.trim() || 'Bank / Person',
      loanType,
      direction,
      principalAmount: principal,
      remainingBalance: isNaN(balance) ? principal : balance,
      interestRate: isNaN(interest) ? 0 : interest,
      monthlyEmi: isNaN(emi) ? 0 : emi,
      dueDayOfMonth: dueDayOfMonth ? parseInt(dueDayOfMonth) : undefined,
      startDate,
      tenureMonths: tenure,
      notes: notes.trim() || undefined,
    });

    setTitle('');
    setLenderOrBorrower('');
    setPrincipalAmount('');
    setRemainingBalance('');
    setMonthlyEmi('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl glass-modal p-6 max-h-[90vh] overflow-y-auto text-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-rose-600" />
            <span>Add Loan, EMI or Udhaari</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Direction Switcher (I Owe vs They Owe Me) */}
        <div className="mt-4 p-1 rounded-xl bg-slate-100 border border-slate-200 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setDirection('i_owe')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition ${
              direction === 'i_owe'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Mera Karz (I Owe)</span>
          </button>
          <button
            type="button"
            onClick={() => setDirection('they_owe_me')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition ${
              direction === 'they_owe_me'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HandCoins className="h-4 w-4" />
            <span>Paise Lene Hain (They Owe Me)</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          {/* Loan Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Loan / Debt Type *
            </label>
            <select
              value={loanType}
              onChange={(e) => setLoanType(e.target.value as LoanType)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs focus:ring-2 focus:ring-rose-500 focus:bg-white"
            >
              {LOAN_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Title & Counterparty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Loan Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Car Loan, Credit Card Dues"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:ring-2 focus:ring-rose-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {direction === 'i_owe' ? 'Bank / Lender Name' : 'Borrower (Person Name)'}
              </label>
              <input
                type="text"
                placeholder="e.g. SBI Bank, HDFC, Rahul Friend"
                value={lenderOrBorrower}
                onChange={(e) => setLenderOrBorrower(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:ring-2 focus:ring-rose-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Principal & Remaining Balance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total / Original Amount (₹) *
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="e.g. 500000"
                value={principalAmount}
                onChange={(e) => setPrincipalAmount(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold focus:ring-2 focus:ring-rose-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Remaining Outstanding (₹)
              </label>
              <input
                type="number"
                step="any"
                placeholder="Full amount if new"
                value={remainingBalance}
                onChange={(e) => setRemainingBalance(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold focus:ring-2 focus:ring-rose-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Monthly EMI & Interest Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Monthly EMI (₹)
              </label>
              <input
                type="number"
                step="any"
                placeholder="0 if lump sum"
                value={monthlyEmi}
                onChange={(e) => setMonthlyEmi(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:ring-2 focus:ring-rose-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Interest %
              </label>
              <input
                type="number"
                step="0.05"
                placeholder="8.5"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:ring-2 focus:ring-rose-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                EMI Day
              </label>
              <input
                type="number"
                min="1"
                max="31"
                placeholder="5"
                value={dueDayOfMonth}
                onChange={(e) => setDueDayOfMonth(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:ring-2 focus:ring-rose-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition shadow-sm bg-rose-600 hover:bg-rose-500 text-white"
            >
              Save {direction === 'i_owe' ? 'Loan / EMI' : 'Udhaar Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
