'use client';

import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Calculator, 
  TrendingDown,
  HandCoins,
  Pencil
} from 'lucide-react';
import { FinancialData, LoanLiability } from '@/types/finance';
import { formatINR } from '@/lib/formatters';
import { EditLoanModal } from '@/components/modals/EditLoanModal';

interface LoansTabProps {
  data: FinancialData;
  onOpenAddModal: (type: 'loan') => void;
  onDeleteLoan: (id: string) => void;
  onPayEmi: (loanId: string, emiAmount: number) => void;
  onUpdateLoan?: (loan: LoanLiability) => void;
}

export const LoansTab: React.FC<LoansTabProps> = ({
  data,
  onOpenAddModal,
  onDeleteLoan,
  onPayEmi,
  onUpdateLoan,
}) => {
  const [editingLoan, setEditingLoan] = useState<LoanLiability | null>(null);
  const myLoans = data.loans.filter((l) => l.direction === 'i_owe');
  const theyOweMe = data.loans.filter((l) => l.direction === 'they_owe_me');

  const totalDebtOutstanding = myLoans.reduce((acc, l) => acc + l.remainingBalance, 0);
  const totalMonthlyEmi = myLoans.reduce((acc, l) => acc + l.monthlyEmi, 0);
  const totalReceivables = theyOweMe.reduce((acc, l) => acc + l.remainingBalance, 0);

  const totalIncome = data.transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0) || 85000;

  const dtiPercent = totalIncome > 0 ? (totalMonthlyEmi / totalIncome) * 100 : 0;

  const [selectedLoanId, setSelectedLoanId] = useState<string>(myLoans[0]?.id || '');
  const [extraPrepaymentMonthly, setExtraPrepaymentMonthly] = useState<number>(3000);

  const selectedLoan = myLoans.find((l) => l.id === selectedLoanId) || myLoans[0];

  const prepaymentImpact = useMemo(() => {
    if (!selectedLoan || selectedLoan.remainingBalance <= 0 || selectedLoan.monthlyEmi <= 0) {
      return { interestSaved: 0, monthsSaved: 0, newTenureMonths: 0 };
    }

    const principal = selectedLoan.remainingBalance;
    const r = (selectedLoan.interestRate / 100) / 12;
    const standardEmi = selectedLoan.monthlyEmi;
    const acceleratedEmi = standardEmi + extraPrepaymentMonthly;

    let standardMonths = 0;
    if (r > 0 && standardEmi > principal * r) {
      standardMonths = Math.ceil(-Math.log(1 - (principal * r) / standardEmi) / Math.log(1 + r));
    } else {
      standardMonths = selectedLoan.tenureMonths || 36;
    }

    let acceleratedMonths = 0;
    if (r > 0 && acceleratedEmi > principal * r) {
      acceleratedMonths = Math.ceil(-Math.log(1 - (principal * r) / acceleratedEmi) / Math.log(1 + r));
    } else {
      acceleratedMonths = Math.ceil(principal / acceleratedEmi);
    }

    const standardTotalPaid = standardEmi * standardMonths;
    const acceleratedTotalPaid = acceleratedEmi * acceleratedMonths;
    const interestSaved = Math.max(0, standardTotalPaid - acceleratedTotalPaid);
    const monthsSaved = Math.max(0, standardMonths - acceleratedMonths);

    return {
      interestSaved,
      monthsSaved,
      standardMonths,
      newTenureMonths: acceleratedMonths,
    };
  }, [selectedLoan, extraPrepaymentMonthly]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Debt & Liabilities Health */}
      <div className="rounded-2xl p-6 glass-panel">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                Total Outstanding Loans & Liabilities
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                Karz Tracker
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 mt-1">
              {formatINR(totalDebtOutstanding)}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Monthly EMI burden: <strong className="text-rose-600">{formatINR(totalMonthlyEmi)}/month</strong> across {myLoans.length} loans
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* DTI Ratio Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between gap-3 text-xs mb-1">
                <span className="text-slate-600 font-medium">Debt-to-Income (DTI)</span>
                <span className={`font-bold ${dtiPercent < 35 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {dtiPercent.toFixed(1)}%
                </span>
              </div>
              <div className="w-36 h-2 rounded-full bg-slate-200 overflow-hidden">
                <div 
                  className={`h-full rounded-full ${dtiPercent < 35 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(dtiPercent, 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                {dtiPercent < 35 ? '✅ Safe (under 35%)' : '⚠️ Heavy EMI load'}
              </span>
            </div>

            <button
              onClick={() => onOpenAddModal('loan')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-rose-600/20 transition active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Add Loan / Udhaar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Loans & Udhaari Register */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Active Loans List with Paid Progress */}
        <div className="lg:col-span-2 rounded-2xl glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-rose-600" />
                <span>Active Bank Loans & EMIs</span>
              </h2>
              <p className="text-xs text-slate-500">Track progress of repayment for each debt</p>
            </div>
            <span className="text-xs text-slate-500 font-medium">{myLoans.length} Active</span>
          </div>

          {myLoans.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-bold text-slate-800">🎉 Congratulations! You are 100% Debt-Free!</p>
              <p className="text-xs text-slate-400 mt-1">No active bank loans or EMIs.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myLoans.map((loan) => {
                const paidAmount = Math.max(0, loan.principalAmount - loan.remainingBalance);
                const paidPercent = Math.min(Math.round((paidAmount / loan.principalAmount) * 100), 100);

                return (
                  <div 
                    key={loan.id}
                    className="p-4 rounded-xl bg-white/60 backdrop-blur-md border border-white/80 hover:bg-white/90 transition space-y-3 group shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">{loan.title}</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold uppercase">
                            {loan.loanType.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Lender: <strong className="text-slate-700">{loan.lenderOrBorrower}</strong> • Interest: {loan.interestRate}% p.a.
                          {loan.dueDayOfMonth && ` • EMI Due: ${loan.dueDayOfMonth}th`}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-left sm:text-right">
                          <span className="block text-xs font-bold text-rose-600">
                            EMI: {formatINR(loan.monthlyEmi)}/mo
                          </span>
                          <span className="block text-[11px] text-slate-500">
                            Left: <strong className="text-slate-800">{formatINR(loan.remainingBalance)}</strong>
                          </span>
                        </div>

                        <button
                          onClick={() => setEditingLoan(loan)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                          title="Edit loan"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => onDeleteLoan(loan.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete loan"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Repayment Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span>Paid: {formatINR(paidAmount)} ({paidPercent}%)</span>
                        <span>Original: {formatINR(loan.principalAmount)}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div 
                          className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                          style={{ width: `${paidPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Quick Action: Mark EMI paid */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                      <span className="text-[11px] text-slate-400">
                        {loan.notes || 'Scheduled via auto-debit'}
                      </span>
                      <button
                        onClick={() => onPayEmi(loan.id, loan.monthlyEmi)}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200 transition flex items-center gap-1.5 shadow-xs"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Pay This Month EMI ({formatINR(loan.monthlyEmi)})</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Udhaari Tracker */}
        <div className="rounded-2xl glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HandCoins className="h-4 w-4 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-900">Udhaari Register</h2>
            </div>
            <span className="text-xs text-slate-500">Friends & Family</span>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs flex justify-between items-center">
              <span className="text-emerald-800 font-medium">Paise Wapas Lene Hain:</span>
              <span className="text-sm font-extrabold text-emerald-700">{formatINR(totalReceivables)}</span>
            </div>

            {theyOweMe.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No pending udhaar given to anyone.
              </p>
            ) : (
              theyOweMe.map((item) => (
                <div 
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs group"
                >
                  <div>
                    <h4 className="font-bold text-slate-900">{item.lenderOrBorrower}</h4>
                    <p className="text-[11px] text-slate-500">{item.title}</p>
                    {item.notes && <p className="text-[10px] text-slate-400">{item.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-emerald-600">{formatINR(item.remainingBalance)}</span>
                    <button
                      onClick={() => setEditingLoan(item)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-emerald-600"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteLoan(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600"
                      title="Settle/Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* --- EMI Pre-Payment & Early Debt Freedom Simulator --- */}
      {myLoans.length > 0 && (
        <div className="rounded-2xl glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                <Calculator className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Smart EMI Pre-Payment & Interest Saver</span>
                  <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200 font-bold">
                    Save Lakhs in Interest
                  </span>
                </h2>
                <p className="text-xs text-slate-500">See how paying a small extra amount monthly crushes your debt early</p>
              </div>
            </div>
            <TrendingDown className="h-5 w-5 text-emerald-600 hidden sm:block" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            
            {/* Input Controls */}
            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Loan to Accelerate
                </label>
                <select
                  value={selectedLoanId}
                  onChange={(e) => setSelectedLoanId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-rose-500"
                >
                  {myLoans.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title} ({formatINR(l.remainingBalance)} @ {l.interestRate}%)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-700 font-medium">Extra Pre-Payment / Month</span>
                  <span className="text-rose-600 font-bold text-sm">+{formatINR(extraPrepaymentMonthly)}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="25000"
                  step="500"
                  value={extraPrepaymentMonthly}
                  onChange={(e) => setExtraPrepaymentMonthly(Number(e.target.value))}
                  className="w-full accent-rose-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>+₹500</span>
                  <span>+₹10,000</span>
                  <span>+₹25,000</span>
                </div>
              </div>

              <div className="text-xs text-slate-600 pt-2 border-t border-slate-200">
                Current EMI: <strong className="text-slate-900">{formatINR(selectedLoan?.monthlyEmi || 0)}</strong>
                <br />
                New Total Monthly Outflow: <strong className="text-rose-600">{formatINR((selectedLoan?.monthlyEmi || 0) + extraPrepaymentMonthly)}</strong>
              </div>
            </div>

            {/* Impact Results */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              
              <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 shadow-xs relative overflow-hidden">
                <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider block">
                  💰 Interest You Will Save
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-2">
                  {formatINR(prepaymentImpact.interestSaved)}
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  Paisa jo seedhe aapki jeb me bachega bajaye bank ke interest me jaane ke!
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-200 shadow-xs relative overflow-hidden">
                <span className="text-xs text-blue-800 font-bold uppercase tracking-wider block">
                  ⏱️ Early Loan Closure
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-blue-700 mt-2">
                  {prepaymentImpact.monthsSaved} Months Early!
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  Aapka karz lagbhag {Math.floor(prepaymentImpact.monthsSaved / 12)} saal {prepaymentImpact.monthsSaved % 12} mahine pehle poora khatam ho jayega.
                </p>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Edit Loan / Udhaari Modal */}
      <EditLoanModal
        isOpen={!!editingLoan}
        onClose={() => setEditingLoan(null)}
        loan={editingLoan}
        onUpdate={(updated) => {
          onUpdateLoan?.(updated);
          setEditingLoan(null);
        }}
      />

    </div>
  );
};
