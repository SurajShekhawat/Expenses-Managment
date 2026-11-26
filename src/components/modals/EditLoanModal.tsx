'use client';

import React, { useState, useEffect } from 'react';
import { X, Building2 } from 'lucide-react';
import { LoanLiability, LoanType, DebtDirection } from '@/types/finance';

interface EditLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: LoanLiability | null;
  onUpdate: (updatedLoan: LoanLiability) => void;
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

export const EditLoanModal: React.FC<EditLoanModalProps> = ({
  isOpen,
  onClose,
  loan,
  onUpdate,
}) => {
  const [direction, setDirection] = useState<DebtDirection>('i_owe');
  const [title, setTitle] = useState('');
  const [lenderOrBorrower, setLenderOrBorrower] = useState('');
  const [loanType, setLoanType] = useState<LoanType>('personal_loan');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [remainingBalance, setRemainingBalance] = useState('');
  const [interestRate, setInterestRate] = useState('0');
  const [monthlyEmi, setMonthlyEmi] = useState('');
  const [dueDayOfMonth, setDueDayOfMonth] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (loan) {
      setDirection(loan.direction);
      setTitle(loan.title);
      setLenderOrBorrower(loan.lenderOrBorrower);
      setLoanType(loan.loanType);
      setPrincipalAmount(String(loan.principalAmount));
      setRemainingBalance(String(loan.remainingBalance));
      setInterestRate(String(loan.interestRate));
      setMonthlyEmi(String(loan.monthlyEmi));
      setDueDayOfMonth(loan.dueDayOfMonth ? String(loan.dueDayOfMonth) : '');
      setNotes(loan.notes || '');
    }
  }, [loan]);

  if (!isOpen || !loan) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const principal = parseFloat(principalAmount);
    const balance = parseFloat(remainingBalance);
    const interest = parseFloat(interestRate || '0');
    const emi = monthlyEmi ? parseFloat(monthlyEmi) : 0;

    if (isNaN(principal) || principal <= 0) {
      alert('Valid amount enter karein');
      return;
    }

    onUpdate({
      ...loan,
      title: title.trim() || loan.title,
      lenderOrBorrower: lenderOrBorrower.trim() || loan.lenderOrBorrower,
      loanType,
      direction,
      principalAmount: principal,
      remainingBalance: isNaN(balance) ? principal : balance,
      interestRate: isNaN(interest) ? 0 : interest,
      monthlyEmi: isNaN(emi) ? 0 : emi,
      dueDayOfMonth: dueDayOfMonth ? parseInt(dueDayOfMonth) : undefined,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl glass-modal p-6 max-h-[90vh] overflow-y-auto text-slate-800 animate-in zoom-in-95 duration-150">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-rose-600" />
            <span>Edit Loan / Udhaar Details</span>
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Loan Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Lender / Person *</label>
              <input
                type="text"
                required
                value={lenderOrBorrower}
                onChange={(e) => setLenderOrBorrower(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Loan Category</label>
              <select
                value={loanType}
                onChange={(e) => setLoanType(e.target.value as LoanType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 font-medium"
              >
                {LOAN_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Original Principal (₹) *</label>
              <input
                type="number"
                required
                value={principalAmount}
                onChange={(e) => setPrincipalAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Remaining Balance (Left ₹) *</label>
              <input
                type="number"
                required
                value={remainingBalance}
                onChange={(e) => setRemainingBalance(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 font-bold text-rose-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Monthly EMI (₹)</label>
              <input
                type="number"
                value={monthlyEmi}
                onChange={(e) => setMonthlyEmi(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Interest Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Due Day (1-31)</label>
              <input
                type="number"
                min="1"
                max="31"
                value={dueDayOfMonth}
                onChange={(e) => setDueDayOfMonth(e.target.value)}
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
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-md shadow-rose-600/20"
            >
              Update Loan
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
