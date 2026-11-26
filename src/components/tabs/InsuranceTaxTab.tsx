'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  HeartHandshake, 
  Calculator, 
  FileCheck2, 
  AlertTriangle,
  Award,
  Sparkles,
  HelpCircle,
  Calendar,
  CreditCard,
  Landmark,
  CheckCircle2,
  RefreshCw,
  Pencil
} from 'lucide-react';
import { FinancialData, InsurancePolicy, InsuranceType, PaymentFrequency } from '@/types/finance';
import { formatINR, formatDate } from '@/lib/formatters';
import { EditInsuranceModal } from '@/components/modals/EditInsuranceModal';

interface InsuranceTaxTabProps {
  data: FinancialData;
  onAddInsurance: (ins: Omit<InsurancePolicy, 'id'>) => void;
  onDeleteInsurance: (id: string) => void;
  onUpdateInsurance?: (ins: InsurancePolicy) => void;
}

const FREQUENCY_LABELS: Record<PaymentFrequency, string> = {
  monthly: 'Monthly (Har Mahine)',
  quarterly: 'Quarterly (Har 3 Mahine)',
  half_yearly: 'Half-Yearly (Har 6 Mahine)',
  yearly: 'Yearly (Salana)',
};

export const InsuranceTaxTab: React.FC<InsuranceTaxTabProps> = ({
  data,
  onAddInsurance,
  onDeleteInsurance,
  onUpdateInsurance,
}) => {
  // Edit Insurance State
  const [editingIns, setEditingIns] = useState<InsurancePolicy | null>(null);

  // New Insurance Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [type, setType] = useState<InsuranceType>('health');
  const [policyName, setPolicyName] = useState('');
  const [providerName, setProviderName] = useState('');
  const [sumInsured, setSumInsured] = useState('');
  const [premiumAmount, setPremiumAmount] = useState('');
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency>('monthly');
  const [renewalDate, setRenewalDate] = useState('2026-12-05');
  const [policyNumber, setPolicyNumber] = useState('');
  const [nominee, setNominee] = useState('');
  const [accountId, setAccountId] = useState(data.accounts[0]?.id || '');
  const [autoDebit, setAutoDebit] = useState(true);

  // Filter state for Policies
  const [frequencyFilter, setFrequencyFilter] = useState<'all' | PaymentFrequency>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | InsuranceType>('all');

  // Tax Simulator State
  const [grossAnnualIncome, setGrossAnnualIncome] = useState<number>(1200000); // 12 Lakhs default
  const [rentPaidAnnual, setRentPaidAnnual] = useState<number>(180000);

  // 1. Calculate 80C from investments: PPF/EPF + ELSS mutual funds
  const ppfAmount = data.investments
    .filter((i) => i.assetType === 'ppf_epf')
    .reduce((acc, i) => acc + i.investedAmount, 0);

  const elssAmount = data.investments
    .filter((i) => i.name.toLowerCase().includes('elss') || i.name.toLowerCase().includes('tax'))
    .reduce((acc, i) => acc + i.investedAmount, 0);

  const total80CUtilized = Math.min(150000, ppfAmount + elssAmount);
  const remaining80CRoom = Math.max(0, 150000 - total80CUtilized);

  // 2. Health Insurance Premium for 80D
  const healthInsurances = data.insurances.filter((i) => i.type === 'health');
  const total80DPremium = healthInsurances.reduce((acc, i) => acc + i.annualPremium, 0);
  const total80DUtilized = Math.min(25000, total80DPremium);

  // 3. New vs Old Tax Regime Calculator (FY 2025-26 / 2026-27 Slabs)
  const oldStandardDeduction = 50000;
  const newStandardDeduction = 75000;

  // Home loan interest deduction under Section 24(b) (Old regime up to ₹2,00,000)
  const homeLoanDeduction = Math.min(
    200000,
    data.loans
      .filter((l) => l.direction === 'i_owe' && (l.title.toLowerCase().includes('home') || l.lenderOrBorrower.toLowerCase().includes('home') || l.notes?.toLowerCase().includes('home')))
      .reduce((acc, l) => acc + (l.monthlyEmi * 12 * 0.6), 0) // Estimated interest portion
  );

  // Old Regime Tax Calculation
  const oldTaxableIncome = Math.max(0, grossAnnualIncome - oldStandardDeduction - total80CUtilized - total80DUtilized - homeLoanDeduction);
  let oldTax = 0;
  if (oldTaxableIncome > 1000000) {
    oldTax = 112500 + (oldTaxableIncome - 1000000) * 0.3;
  } else if (oldTaxableIncome > 500000) {
    oldTax = 12500 + (oldTaxableIncome - 500000) * 0.2;
  } else if (oldTaxableIncome > 250000) {
    oldTax = (oldTaxableIncome - 250000) * 0.05;
  }
  // Section 87A Rebate for Old Regime (up to 5L)
  if (oldTaxableIncome <= 500000) oldTax = 0;
  oldTax = Math.round(oldTax * 1.04); // 4% Health & Education Cess

  // New Regime Tax Calculation (Updated Slabs with ₹75k Std Deduction & ₹7L Rebate)
  const newTaxableIncome = Math.max(0, grossAnnualIncome - newStandardDeduction);
  let newTax = 0;
  if (newTaxableIncome > 1500000) {
    newTax = 140000 + (newTaxableIncome - 1500000) * 0.3;
  } else if (newTaxableIncome > 1200000) {
    newTax = 80000 + (newTaxableIncome - 1200000) * 0.2;
  } else if (newTaxableIncome > 1000000) {
    newTax = 50000 + (newTaxableIncome - 1000000) * 0.15;
  } else if (newTaxableIncome > 700000) {
    newTax = 20000 + (newTaxableIncome - 700000) * 0.1;
  } else if (newTaxableIncome > 300000) {
    newTax = (newTaxableIncome - 300000) * 0.05;
  }
  // Section 87A Rebate for New Regime (Tax free up to 7L taxable income, i.e. 7.75L CTC)
  if (newTaxableIncome <= 700000) newTax = 0;
  newTax = Math.round(newTax * 1.04); // 4% Cess

  const taxDifference = Math.abs(oldTax - newTax);
  const isNewBetter = newTax <= oldTax;

  // Monthly vs Yearly Insurance Commitments
  const totalMonthlyInsuranceOutflow = data.insurances.reduce((acc, i) => {
    const freq = i.paymentFrequency || 'yearly';
    const amount = i.premiumAmount || i.annualPremium;
    if (freq === 'monthly') return acc + amount;
    if (freq === 'quarterly') return acc + (amount / 3);
    if (freq === 'half_yearly') return acc + (amount / 6);
    return acc + (amount / 12);
  }, 0);

  const totalAnnualInsuranceCost = totalMonthlyInsuranceOutflow * 12;

  // Coverage metrics
  const totalHealthCover = healthInsurances.reduce((acc, i) => acc + i.sumInsured, 0);
  const termPolicies = data.insurances.filter((i) => i.type === 'term_life');
  const totalTermCover = termPolicies.reduce((acc, i) => acc + i.sumInsured, 0);

  const accountMap = new Map(data.accounts.map((a) => [a.id, a.name]));

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sum = parseFloat(sumInsured);
    const prem = parseFloat(premiumAmount);
    if (isNaN(sum) || isNaN(prem) || sum <= 0 || prem <= 0) {
      alert('Kripya valid sum insured aur premium amount enter karein');
      return;
    }

    // Calculate effective annual premium based on chosen frequency
    let effectiveAnnual = prem;
    if (paymentFrequency === 'monthly') effectiveAnnual = prem * 12;
    if (paymentFrequency === 'quarterly') effectiveAnnual = prem * 4;
    if (paymentFrequency === 'half_yearly') effectiveAnnual = prem * 2;

    onAddInsurance({
      type,
      policyName: policyName.trim() || 'Insurance Policy',
      providerName: providerName.trim() || 'Insurance Provider',
      sumInsured: sum,
      annualPremium: effectiveAnnual,
      premiumAmount: prem,
      paymentFrequency,
      renewalDate,
      policyNumber: policyNumber.trim() || undefined,
      nominee: nominee.trim() || undefined,
      accountId: accountId || undefined,
      autoDebit,
    });

    setPolicyName('');
    setProviderName('');
    setSumInsured('');
    setPremiumAmount('');
    setShowAddForm(false);
  };

  // Filtered Policies
  const filteredPolicies = data.insurances.filter((ins) => {
    const matchesFreq = frequencyFilter === 'all' || (ins.paymentFrequency || 'yearly') === frequencyFilter;
    const matchesType = typeFilter === 'all' || ins.type === typeFilter;
    return matchesFreq && matchesType;
  });

  return (
    <div className="space-y-4 sm:space-y-5">
      
      {/* Top Banner: Family Protection & Premium Cashflow */}
      <div className="rounded-xl p-4 sm:p-5 glass-panel">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                Insurance Shield & Cashflow
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                Monthly & Annual Support
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              {formatINR(totalHealthCover, true)} Health + {formatINR(totalTermCover, true)} Life Cover
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Monthly Insurance Outflow: <strong className="text-blue-700 font-bold">{formatINR(totalMonthlyInsuranceOutflow)}/mo</strong> (Annualized: {formatINR(totalAnnualInsuranceCost)}/yr)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>{showAddForm ? 'Cancel' : 'Add Policy'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add Policy Form with Flexible Payment Frequency */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="p-5 rounded-xl glass-card space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Add Policy with Monthly or Yearly Premium
            </h3>
            <span className="text-[11px] text-slate-500">Supports Monthly, Quarterly, Half-Yearly, Yearly</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Policy Type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as InsuranceType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white/80 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="health">🏥 Health Insurance (Mediclaim)</option>
                <option value="term_life">🛡️ Term Life Insurance</option>
                <option value="vehicle">🚗 Vehicle / Motor Insurance</option>
                <option value="life">📑 Life Insurance / ULIP</option>
                <option value="other">🔒 Other Protection</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Plan / Policy Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Optima Secure, Smart Term"
                value={policyName}
                onChange={(e) => setPolicyName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white/80 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Insurance Company *</label>
              <input
                type="text"
                required
                placeholder="e.g. HDFC ERGO, Max Life, Star Health"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white/80 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Cover Sum Insured (₹) *</label>
              <input
                type="number"
                required
                placeholder="e.g. 1500000"
                value={sumInsured}
                onChange={(e) => setSumInsured(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white/80 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Payment Frequency */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Payment Frequency (Kist Kab Jati Hai) *
              </label>
              <select
                value={paymentFrequency}
                onChange={(e) => setPaymentFrequency(e.target.value as PaymentFrequency)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white/80 text-xs text-slate-900 font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="monthly">🗓️ Monthly (Har Mahine)</option>
                <option value="quarterly">📅 Quarterly (3 Mahine)</option>
                <option value="half_yearly">📆 Half-Yearly (6 Mahine)</option>
                <option value="yearly">💳 Yearly (Salana Ek Baar)</option>
              </select>
            </div>

            {/* Premium Amount */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                {paymentFrequency === 'monthly' ? 'Monthly Premium (₹/Mahina) *' :
                 paymentFrequency === 'quarterly' ? 'Quarterly Premium (₹/3 Mahine) *' :
                 paymentFrequency === 'half_yearly' ? 'Half-Yearly Premium (₹/6 Mahine) *' : 'Yearly Premium (₹/Saal) *'}
              </label>
              <input
                type="number"
                required
                placeholder={paymentFrequency === 'monthly' ? 'e.g. 1250' : 'e.g. 15000'}
                value={premiumAmount}
                onChange={(e) => setPremiumAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white/80 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Next Payment / Due Date */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Next Payment / Renewal Date</label>
              <input
                type="date"
                value={renewalDate}
                onChange={(e) => setRenewalDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white/80 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Account linked */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Auto-debit Bank / Account</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white/80 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No Account Linked</option>
                {data.accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.accountType})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Policy Number</label>
              <input
                type="text"
                placeholder="e.g. POL-98472918"
                value={policyNumber}
                onChange={(e) => setPolicyNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white/80 text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nominee Name</label>
              <input
                type="text"
                placeholder="e.g. Spouse / Mother"
                value={nominee}
                onChange={(e) => setNominee(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white/80 text-xs text-slate-900"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="autoDebitCheck"
                checked={autoDebit}
                onChange={(e) => setAutoDebit(e.target.checked)}
                className="h-4 w-4 rounded accent-blue-600 cursor-pointer"
              />
              <label htmlFor="autoDebitCheck" className="text-xs text-slate-700 font-medium cursor-pointer">
                Auto-debit active on bank account
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl text-slate-600 text-xs font-semibold hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20"
            >
              Save Insurance Policy
            </button>
          </div>
        </form>
      )}

      {/* Insurance Policies List Header with Frequency Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Your Active Policies</h2>
          <p className="text-xs text-slate-500">Track monthly EMIs, yearly renewals & family security covers</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Frequency Filter Tabs */}
          <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs">
            <button
              onClick={() => setFrequencyFilter('all')}
              className={`px-2.5 py-1 rounded-md transition ${frequencyFilter === 'all' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600'}`}
            >
              All
            </button>
            <button
              onClick={() => setFrequencyFilter('monthly')}
              className={`px-2.5 py-1 rounded-md transition ${frequencyFilter === 'monthly' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600'}`}
            >
              Monthly Outflow
            </button>
            <button
              onClick={() => setFrequencyFilter('yearly')}
              className={`px-2.5 py-1 rounded-md transition ${frequencyFilter === 'yearly' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600'}`}
            >
              Yearly
            </button>
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 font-medium focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="health">Health Only</option>
            <option value="term_life">Term Life Only</option>
            <option value="vehicle">Vehicle Only</option>
          </select>
        </div>
      </div>

      {/* Policies Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPolicies.length === 0 ? (
          <div className="col-span-full py-12 text-center rounded-xl glass-card border-dashed border-slate-200">
            <ShieldCheck className="h-10 w-10 text-blue-500 mx-auto mb-2 opacity-60" />
            <p className="text-xs font-bold text-slate-700">Koi Insurance Policy record nahi hai</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Apni Health, Term Life ya Vehicle insurance policy yahan add karein.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-3 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-xs"
            >
              + Add First Policy
            </button>
          </div>
        ) : (
          filteredPolicies.map((ins) => {
            const freq = ins.paymentFrequency || 'yearly';
            const premAmount = ins.premiumAmount || ins.annualPremium;
            const isMonthly = freq === 'monthly';

            return (
              <div 
                key={ins.id}
                className="p-5 rounded-xl glass-card flex flex-col justify-between hover:shadow-md transition group relative overflow-hidden"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl border ${
                        ins.type === 'health' 
                          ? 'bg-rose-50 text-rose-600 border-rose-100' 
                          : ins.type === 'term_life' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : 'bg-blue-50 text-blue-600 border-blue-100'
                      }`}>
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-slate-900">{ins.policyName}</h3>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                            isMonthly ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {freq}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{ins.providerName} • {ins.type.toUpperCase()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingIns(ins)}
                        className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                        title="Edit policy"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => onDeleteInsurance(ins.id)}
                        className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-200/60">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Sum Insured (Cover)</span>
                      <span className="text-lg font-extrabold text-slate-900">{formatINR(ins.sumInsured)}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">
                        {isMonthly ? 'Monthly Premium' : 'Premium Amount'}
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-bold text-blue-700">
                          {formatINR(premAmount)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          /{freq === 'monthly' ? 'mo' : freq === 'quarterly' ? '3m' : freq === 'half_yearly' ? '6m' : 'yr'}
                        </span>
                      </div>
                      {isMonthly && (
                        <span className="text-[10px] text-slate-400 block">
                          Annualized: {formatINR(ins.annualPremium)}/yr
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2.5 border-t border-slate-200/60 space-y-1 text-[11px] text-slate-500">
                  <div className="flex items-center justify-between">
                    <span>Next Due: <strong className="text-slate-800 font-semibold">{formatDate(ins.renewalDate)}</strong></span>
                    {ins.autoDebit && (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Auto-Debit
                      </span>
                    )}
                  </div>
                  {ins.accountId && accountMap.get(ins.accountId) && (
                    <div className="flex items-center justify-between text-[10px]">
                      <span>Paid via: <strong className="text-blue-700">{accountMap.get(ins.accountId)}</strong></span>
                      {ins.nominee && <span>Nominee: <strong className="text-slate-700">{ins.nominee}</strong></span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* --- Section 80C & 80D Tax Savers --- */}
      <div className="rounded-xl glass-panel p-6 space-y-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-emerald-600" />
            <span>Indian Income Tax Saving Trackers (FY 2026-27)</span>
          </h2>
          <p className="text-xs text-slate-500">Live utilization of tax deductions from your actual portfolio & insurance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Section 80C Tracker */}
          <div className="p-4 rounded-xl bg-white/60 backdrop-blur-md border border-white/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">Section 80C (PPF, EPF, ELSS)</span>
              <span className="font-extrabold text-emerald-700">
                {formatINR(total80CUtilized)} / ₹1,50,000
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (total80CUtilized / 150000) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Used: {((total80CUtilized / 150000) * 100).toFixed(0)}%</span>
              <span>{remaining80CRoom > 0 ? `Room left: ${formatINR(remaining80CRoom)}` : '✅ 100% Tax Quota Utilized!'}</span>
            </div>
          </div>

          {/* Section 80D Tracker */}
          <div className="p-4 rounded-xl bg-white/60 backdrop-blur-md border border-white/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">Section 80D (Health Insurance Premium)</span>
              <span className="font-extrabold text-blue-700">
                {formatINR(total80DUtilized)} / ₹25,000
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (total80DUtilized / 25000) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Used: {((total80DUtilized / 25000) * 100).toFixed(0)}%</span>
              <span>Max deduction under 80D: ₹25,000</span>
            </div>
          </div>

        </div>
      </div>

      {/* --- Live Income Tax Comparison Calculator --- */}
      <div className="rounded-xl glass-panel p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-indigo-600" />
              <span>New vs Old Tax Regime Calculator</span>
            </h2>
            <p className="text-xs text-slate-500">Personalized comparison according to your real investments & insurance</p>
          </div>

          <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
            isNewBetter ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-blue-50 text-blue-800 border-blue-200'
          }`}>
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Recommended: {isNewBetter ? 'New Regime' : 'Old Regime'} (Saves {formatINR(taxDifference)})</span>
          </div>
        </div>

        {/* Sliders / Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className="text-slate-700">Gross Annual CTC / Income</span>
              <span className="text-indigo-700 font-extrabold">{formatINR(grossAnnualIncome)}</span>
            </div>
            <input 
              type="range"
              min={300000}
              max={5000000}
              step={50000}
              value={grossAnnualIncome}
              onChange={(e) => setGrossAnnualIncome(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className="text-slate-700">Annual House Rent Paid (HRA Exemption)</span>
              <span className="text-slate-800 font-extrabold">{formatINR(rentPaidAnnual)}</span>
            </div>
            <input 
              type="range"
              min={0}
              max={1200000}
              step={20000}
              value={rentPaidAnnual}
              onChange={(e) => setRentPaidAnnual(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Side-by-side Regime Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          
          {/* Old Regime */}
          <div className={`p-4 rounded-xl border transition ${
            !isNewBetter ? 'bg-white/90 border-blue-400 shadow-md ring-2 ring-blue-400/20' : 'bg-white/40 border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-extrabold uppercase text-slate-700">Old Tax Regime</h3>
              {!isNewBetter && <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">Winner</span>}
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Standard Deduction:</span>
                <span>{formatINR(oldStandardDeduction)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>80C Deductions (ELSS/PPF):</span>
                <span>{formatINR(total80CUtilized)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>80D Health Insurance:</span>
                <span>{formatINR(total80DUtilized)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-800 border-t border-slate-200 pt-1.5">
                <span>Taxable Income:</span>
                <span>{formatINR(oldTaxableIncome)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-base pt-2 text-rose-600">
                <span>Total Tax Payable:</span>
                <span>{formatINR(oldTax)}</span>
              </div>
            </div>
          </div>

          {/* New Regime */}
          <div className={`p-4 rounded-xl border transition ${
            isNewBetter ? 'bg-white/90 border-emerald-400 shadow-md ring-2 ring-emerald-400/20' : 'bg-white/40 border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-extrabold uppercase text-slate-700">New Tax Regime (Default)</h3>
              {isNewBetter && <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Winner</span>}
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Standard Deduction:</span>
                <span>{formatINR(newStandardDeduction)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>80C Deductions:</span>
                <span>Not allowed</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>80D Deductions:</span>
                <span>Not allowed</span>
              </div>
              <div className="flex justify-between font-bold text-slate-800 border-t border-slate-200 pt-1.5">
                <span>Taxable Income:</span>
                <span>{formatINR(newTaxableIncome)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-base pt-2 text-rose-600">
                <span>Total Tax Payable:</span>
                <span>{formatINR(newTax)}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Edit Insurance Modal */}
      <EditInsuranceModal
        isOpen={!!editingIns}
        onClose={() => setEditingIns(null)}
        insurance={editingIns}
        accounts={data.accounts}
        onUpdate={(updated) => {
          onUpdateInsurance?.(updated);
          setEditingIns(null);
        }}
      />

    </div>
  );
};
