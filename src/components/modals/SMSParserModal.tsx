'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, CheckCircle2, ArrowDownRight, ArrowUpRight, Copy, Landmark } from 'lucide-react';
import { Transaction, FinancialAccount } from '@/types/finance';
import { parseIndianBankSMS, ParsedSMSResult } from '@/lib/smsParser';
import { formatINR } from '@/lib/formatters';

interface SMSParserModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: FinancialAccount[];
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
}

const SAMPLE_SMS = [
  'Debited INR 480.00 from A/c **4892 via UPI to Swiggy on 21-Nov-26. Ref 43219082. If not you, SMS BLOCK to 56767.',
  'HDFC Bank: Rs 1,899.00 spent on your Credit Card ending 9021 at ZARA MUMBAI on 20-Nov-26. Avl Lmt Rs 1,24,000.',
  'Dear Customer, INR 85,000.00 credited to your A/c **4892 on 20-Nov-26 by Salary Payroll. Avl Bal INR 1,49,500.',
];

export const SMSParserModal: React.FC<SMSParserModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onAddTransaction,
}) => {
  const [smsText, setSmsText] = useState('');
  const [parsed, setParsed] = useState<ParsedSMSResult | null>(null);

  // Editable fields once parsed
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [type, setType] = useState<'income' | 'expense'>('expense');

  useEffect(() => {
    if (smsText.trim()) {
      const res = parseIndianBankSMS(smsText, accounts);
      setParsed(res);
      if (res) {
        setAmount(res.amount);
        setDescription(res.description);
        setCategory(res.category);
        setAccountId(res.matchedAccountId || accounts[0]?.id || '');
        setType(res.type === 'income' ? 'income' : 'expense');
      }
    } else {
      setParsed(null);
    }
  }, [smsText, accounts]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (amount <= 0) return;

    onAddTransaction({
      amount,
      type,
      category,
      paymentMode: parsed?.paymentMode || 'UPI',
      accountId: accountId || undefined,
      description: description || 'Bank Transaction',
      date: parsed?.date || new Date().toISOString().slice(0, 10),
    });

    setSmsText('');
    setParsed(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl glass-modal p-6 text-slate-800 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Paste Bank SMS / UPI</h2>
              <p className="text-xs text-slate-500">Auto-detects Amount, Bank, Category & Merchant in 1 click!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Textarea */}
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Paste SMS or Notification Text Here:
            </label>
            <textarea
              rows={3}
              value={smsText}
              onChange={(e) => setSmsText(e.target.value)}
              placeholder="e.g. Debited INR 450.00 from A/c **4892 via UPI to Swiggy on 21-Nov..."
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-none"
            />
          </div>

          {/* Quick Samples */}
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mb-1">
              Try Sample SMS:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSmsText(SAMPLE_SMS[0])}
                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition"
              >
                Swiggy UPI ₹480
              </button>
              <button
                type="button"
                onClick={() => setSmsText(SAMPLE_SMS[1])}
                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition"
              >
                Zara Card ₹1,899
              </button>
              <button
                type="button"
                onClick={() => setSmsText(SAMPLE_SMS[2])}
                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition"
              >
                Salary ₹85,000
              </button>
            </div>
          </div>

          {/* Parsed Result Card */}
          {parsed ? (
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>SMS Detected Successfully!</span>
                </span>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                  type === 'income' ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                }`}>
                  {type === 'income' ? 'Income' : 'Kharcha'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Amount (₹)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-white font-bold text-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Merchant / Desc</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-white font-semibold text-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-white text-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Linked Account</label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-emerald-300 bg-white text-slate-900 text-xs font-medium"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleConfirm}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition active:scale-95"
              >
                Confirm & Add {formatINR(amount)} Kharcha
              </button>
            </div>
          ) : smsText.trim() ? (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
              ⚠️ Could not detect amount or bank details from this text. Please check the SMS format or enter manually.
            </div>
          ) : null}

        </div>
      </div>
    </div>
  );
};
