'use client';

import React, { useState, useEffect } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { FinancialAccount, InsurancePolicy, InsuranceType, PaymentFrequency } from '@/types/finance';

interface EditInsuranceModalProps {
  isOpen: boolean;
  onClose: () => void;
  insurance: InsurancePolicy | null;
  accounts: FinancialAccount[];
  onUpdate: (updatedIns: InsurancePolicy) => void;
}

export const EditInsuranceModal: React.FC<EditInsuranceModalProps> = ({
  isOpen,
  onClose,
  insurance,
  accounts,
  onUpdate,
}) => {
  const [type, setType] = useState<InsuranceType>('health');
  const [policyName, setPolicyName] = useState('');
  const [providerName, setProviderName] = useState('');
  const [sumInsured, setSumInsured] = useState('');
  const [premiumAmount, setPremiumAmount] = useState('');
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency>('monthly');
  const [renewalDate, setRenewalDate] = useState('2026-12-05');
  const [policyNumber, setPolicyNumber] = useState('');
  const [nominee, setNominee] = useState('');
  const [accountId, setAccountId] = useState('');
  const [autoDebit, setAutoDebit] = useState(true);

  useEffect(() => {
    if (insurance) {
      setType(insurance.type);
      setPolicyName(insurance.policyName);
      setProviderName(insurance.providerName);
      setSumInsured(String(insurance.sumInsured));
      const freq = insurance.paymentFrequency || 'yearly';
      setPaymentFrequency(freq);
      setPremiumAmount(String(insurance.premiumAmount || insurance.annualPremium));
      setRenewalDate(insurance.renewalDate || '2026-12-05');
      setPolicyNumber(insurance.policyNumber || '');
      setNominee(insurance.nominee || '');
      setAccountId(insurance.accountId || '');
      setAutoDebit(insurance.autoDebit ?? true);
    }
  }, [insurance]);

  if (!isOpen || !insurance) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sum = parseFloat(sumInsured);
    const prem = parseFloat(premiumAmount);

    if (isNaN(sum) || sum <= 0 || isNaN(prem) || prem <= 0) {
      alert('Kripya valid sum insured aur premium amount darj karein');
      return;
    }

    // Calculate annualized premium
    let annualPrem = prem;
    if (paymentFrequency === 'monthly') annualPrem = prem * 12;
    else if (paymentFrequency === 'quarterly') annualPrem = prem * 4;
    else if (paymentFrequency === 'half_yearly') annualPrem = prem * 2;

    onUpdate({
      ...insurance,
      policyName: policyName.trim() || insurance.policyName,
      providerName: providerName.trim() || insurance.providerName,
      type,
      sumInsured: sum,
      premiumAmount: prem,
      paymentFrequency,
      annualPremium: annualPrem,
      renewalDate,
      policyNumber: policyNumber.trim() || undefined,
      nominee: nominee.trim() || undefined,
      accountId: accountId || undefined,
      autoDebit,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Insurance Policy Edit Karein</h2>
              <p className="text-xs text-slate-500">Sum insured, kist amount aur payment frequency update karein</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Policy Type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as InsuranceType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="health">🏥 Health Insurance (Mediclaim)</option>
                <option value="term_life">🛡️ Term Life Insurance</option>
                <option value="vehicle">🚗 Vehicle / Motor Insurance</option>
                <option value="life">📑 Life Insurance / ULIP</option>
                <option value="other">🔒 Other Protection</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Provider *</label>
              <input
                type="text"
                required
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Plan / Policy Name *</label>
            <input
              type="text"
              required
              value={policyName}
              onChange={(e) => setPolicyName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sum Insured (Cover ₹) *</label>
              <input
                type="number"
                required
                min="0"
                step="any"
                value={sumInsured}
                onChange={(e) => setSumInsured(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Frequency *</label>
              <select
                value={paymentFrequency}
                onChange={(e) => setPaymentFrequency(e.target.value as PaymentFrequency)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="monthly">🗓️ Monthly (Har Mahine)</option>
                <option value="quarterly">📅 Quarterly (3 Mahine)</option>
                <option value="half_yearly">📆 Half-Yearly (6 Mahine)</option>
                <option value="yearly">💳 Yearly (Salana)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {paymentFrequency === 'monthly' ? 'Monthly Premium (₹/mo) *' :
                 paymentFrequency === 'quarterly' ? 'Quarterly Premium (₹/3m) *' :
                 paymentFrequency === 'half_yearly' ? 'Half-Yearly Premium (₹/6m) *' : 'Yearly Premium (₹/yr) *'}
              </label>
              <input
                type="number"
                required
                min="0"
                step="any"
                value={premiumAmount}
                onChange={(e) => setPremiumAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Renewal / Next Due Date</label>
              <input
                type="date"
                value={renewalDate}
                onChange={(e) => setRenewalDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Policy Number (Optional)</label>
              <input
                type="text"
                placeholder="e.g. POL-883921"
                value={policyNumber}
                onChange={(e) => setPolicyNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nominee Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Father / Spouse"
                value={nominee}
                onChange={(e) => setNominee(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-center">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Account</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Bank / Card --</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.accountType})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoDebit}
                  onChange={(e) => setAutoDebit(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span className="text-xs font-semibold text-slate-700">Auto-Debit Active on Account</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 active:scale-95 transition"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
