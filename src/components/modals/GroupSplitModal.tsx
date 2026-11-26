'use client';

import React, { useState } from 'react';
import { 
  X, 
  Users, 
  Plus, 
  Trash2, 
  Check, 
  Receipt,
  ArrowRight,
  HandCoins
} from 'lucide-react';
import { FinancialAccount } from '@/types/finance';
import { formatINR, getTodayDateString } from '@/lib/formatters';

interface GroupSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: FinancialAccount[];
  onConfirmSplit: (splitData: {
    description: string;
    totalAmount: number;
    myShare: number;
    accountId?: string;
    participants: { name: string; amountOwed: number }[];
  }) => void;
}

export const GroupSplitModal: React.FC<GroupSplitModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onConfirmSplit,
}) => {
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [friendNames, setFriendNames] = useState<string[]>(['Amit', 'Rahul']);
  const [newFriendInput, setNewFriendInput] = useState('');

  if (!isOpen) return null;

  const totalNum = parseFloat(totalAmount) || 0;
  const totalPeople = friendNames.length + 1; // friends + user
  const equalShare = totalNum > 0 ? Math.round(totalNum / totalPeople) : 0;
  const myShare = equalShare;
  const totalReceivables = equalShare * friendNames.length;

  const handleAddFriend = () => {
    if (newFriendInput.trim() && !friendNames.includes(newFriendInput.trim())) {
      setFriendNames([...friendNames, newFriendInput.trim()]);
      setNewFriendInput('');
    }
  };

  const handleRemoveFriend = (name: string) => {
    setFriendNames(friendNames.filter((f) => f !== name));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalNum <= 0) {
      alert('Kripya valid total bill amount enter karein');
      return;
    }
    if (friendNames.length === 0) {
      alert('Kripya kam se kam ek dost ka naam add karein');
      return;
    }

    const participants = friendNames.map((name) => ({
      name,
      amountOwed: equalShare,
    }));

    onConfirmSplit({
      description: description.trim() || 'Group Dinner / Outing',
      totalAmount: totalNum,
      myShare,
      accountId: selectedAccountId || undefined,
      participants,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-lg glass-modal rounded-3xl border border-white/80 p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Split Bill & Hisaab-Kitaab</h2>
              <p className="text-xs text-slate-500">Auto-records your share in Kharcha and friends&apos; share in Udhaari</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Bill Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Bill Title / Description *</label>
              <input
                type="text"
                required
                placeholder="e.g. Goa Trip Dinner, Cafe Bill"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white/90 text-xs text-slate-900 font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Total Bill Amount (₹) *</label>
              <input
                type="number"
                required
                placeholder="e.g. 3000"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white/90 text-xs text-slate-900 font-extrabold"
              />
            </div>
          </div>

          {/* Paid From Account */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">You Paid Total Bill Using</label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white/90 text-xs text-slate-900 font-medium"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.name} ({acc.accountType})</option>
              ))}
            </select>
          </div>

          {/* Friends In Split */}
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold text-slate-700">Friends Involved ({friendNames.length} friends + You)</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add friend's name (e.g. Vikas)"
                value={newFriendInput}
                onChange={(e) => setNewFriendInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFriend(); } }}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white/90 text-xs text-slate-900 font-medium"
              />
              <button
                type="button"
                onClick={handleAddFriend}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center gap-1 shadow-xs"
              >
                <Plus className="h-4 w-4" />
                <span>Add</span>
              </button>
            </div>

            {/* Friend Badges */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                You (Your share: {formatINR(myShare)})
              </span>
              {friendNames.map((name) => (
                <span key={name} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 font-medium">
                  <span>{name} ({formatINR(equalShare)})</span>
                  <button type="button" onClick={() => handleRemoveFriend(name)} className="hover:text-rose-600">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Real-Time Split Preview Card */}
          {totalNum > 0 && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex justify-between font-bold text-slate-800">
                <span>Your Real Kharcha:</span>
                <span className="text-rose-600">{formatINR(myShare)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-800">
                <span>Added to &quot;Paise Lene Hain&quot; (Receivables):</span>
                <span className="text-emerald-600">+{formatINR(totalReceivables)}</span>
              </div>
              <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                Bank account se total bill deduct hoga, lekin aapke expense budget me sirf aapka hissa (₹{myShare}) count hoga.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 font-semibold hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-md shadow-purple-600/20"
            >
              Split & Save Hisaab
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
