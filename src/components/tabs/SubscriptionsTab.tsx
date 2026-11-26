'use client';

import React, { useState } from 'react';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  CreditCard,
  Tv,
  Music,
  Wifi,
  Dumbbell,
  ShoppingBag,
  Bell,
  Pencil
} from 'lucide-react';
import { FinancialData, Subscription } from '@/types/finance';
import { formatINR, formatDate, getTodayDateString } from '@/lib/formatters';
import { EditSubscriptionModal } from '@/components/modals/EditSubscriptionModal';

interface SubscriptionsTabProps {
  data: FinancialData;
  onAddSubscription: (sub: Omit<Subscription, 'id'>) => void;
  onDeleteSubscription: (id: string) => void;
  onUpdateSubscription?: (sub: Subscription) => void;
}

export const SubscriptionsTab: React.FC<SubscriptionsTabProps> = ({
  data,
  onAddSubscription,
  onDeleteSubscription,
  onUpdateSubscription,
}) => {
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'half_yearly' | 'yearly'>('monthly');
  const [category, setCategory] = useState('Entertainment');
  const [nextBillingDate, setNextBillingDate] = useState('2026-12-01');
  const [accountId, setAccountId] = useState(data.accounts[0]?.id || '');
  const [notes, setNotes] = useState('');

  // Calculations
  const monthlyFixedCost = data.subscriptions.reduce((acc, sub) => {
    if (sub.billingCycle === 'monthly') return acc + sub.amount;
    if (sub.billingCycle === 'quarterly') return acc + (sub.amount / 3);
    if (sub.billingCycle === 'half_yearly') return acc + (sub.amount / 6);
    return acc + (sub.amount / 12);
  }, 0);

  const yearlyFixedCost = monthlyFixedCost * 12;

  // Account lookup
  const accountMap = new Map(data.accounts.map((a) => [a.id, a.name]));

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    onAddSubscription({
      name: name.trim() || 'New Subscription',
      amount: amt,
      billingCycle,
      category,
      nextBillingDate,
      accountId: accountId || undefined,
      notes: notes.trim() || undefined,
    });

    setName('');
    setAmount('');
    setNotes('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      
      {/* Top Banner: Monthly Fixed Commitment */}
      <div className="rounded-xl p-4 sm:p-5 glass-panel">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                Recurring Subscriptions & Auto-Debits
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-bold">
                {data.subscriptions.length} Active Services
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 mt-1">
              {formatINR(monthlyFixedCost)} <span className="text-base font-normal text-slate-500">/ month</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Annual recurring commitment: <strong className="text-slate-800">{formatINR(yearlyFixedCost)}/year</strong> (Netflix, Broadband, Gym, etc.)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-purple-600/20 transition active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>{showAddForm ? 'Cancel' : 'Add Subscription'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add Subscription Collapsible Form */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="p-5 rounded-xl glass-card space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700">Add New Subscription</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Service / App Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Netflix, Spotify, Gym, Broadband"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white/80 text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Amount (₹) *</label>
              <input
                type="number"
                required
                placeholder="e.g. 649"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white/80 text-xs text-slate-900 font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Billing Cycle</label>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white/80 text-xs text-slate-900"
              >
                <option value="monthly">🗓️ Monthly (Har Mahine)</option>
                <option value="quarterly">📅 Quarterly (3 Mahine)</option>
                <option value="half_yearly">📆 Half-Yearly (6 Mahine)</option>
                <option value="yearly">💳 Yearly (Salana)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Next Billing Date</label>
              <input
                type="date"
                value={nextBillingDate}
                onChange={(e) => setNextBillingDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white/80 text-xs text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Deducted From Account</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white/80 text-xs text-slate-900"
              >
                {data.accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Notes (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 4 screens shared with family"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white/80 text-xs text-slate-900"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
            >
              Save Subscription
            </button>
          </div>
        </form>
      )}

      {/* Subscriptions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.subscriptions.length === 0 && (
          <div className="col-span-full py-12 text-center rounded-xl glass-card flex flex-col items-center justify-center space-y-3">
            <div className="p-4 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <Calendar className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Koi Recurring Subscription nahi hai</h3>
            <p className="text-xs text-slate-500 max-w-sm">Netflix, Prime, Gym, Wifi ya Mobile plan add kijiye taaki aapke auto-debit dates track rahein.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-xs transition"
            >
              + Pehla Subscription Add Karein
            </button>
          </div>
        )}
        {data.subscriptions.map((sub) => {
          return (
            <div 
              key={sub.id}
              className="p-4 rounded-xl glass-card hover:border-purple-300 transition flex flex-col justify-between space-y-4 group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                      <Tv className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{sub.name}</h3>
                      <p className="text-[11px] text-slate-500">{sub.category}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingSub(sub)}
                      className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => onDeleteSubscription(sub.id)}
                      className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-lg font-extrabold text-slate-900">{formatINR(sub.amount)}</span>
                    <span className="text-xs text-slate-500 font-medium ml-1">/ {sub.billingCycle}</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                    {sub.billingCycle}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1 text-slate-600 font-medium">
                  <Calendar className="h-3.5 w-3.5 text-purple-600" /> Due: {formatDate(sub.nextBillingDate)}
                </span>
                {sub.accountId && (
                  <span className="text-slate-400 truncate max-w-[120px]">
                    {accountMap.get(sub.accountId)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Subscription Modal */}
      <EditSubscriptionModal
        isOpen={!!editingSub}
        onClose={() => setEditingSub(null)}
        subscription={editingSub}
        accounts={data.accounts}
        onUpdate={(updated) => {
          onUpdateSubscription?.(updated);
          setEditingSub(null);
        }}
      />

    </div>
  );
};
