'use client';

import React, { useState } from 'react';
import { 
  Target, 
  ShieldCheck, 
  Plus, 
  PartyPopper, 
  Award
} from 'lucide-react';
import { FinancialData, FinancialGoal } from '@/types/finance';
import { formatINR, formatDate } from '@/lib/formatters';
import confetti from 'canvas-confetti';

interface GoalsTabProps {
  data: FinancialData;
  onAddGoal: (goal: Omit<FinancialGoal, 'id'>) => void;
  onUpdateGoalAmount: (goalId: string, delta: number) => void;
  onDeleteGoal: (goalId: string) => void;
}

export const GoalsTab: React.FC<GoalsTabProps> = ({
  data,
  onAddGoal,
  onUpdateGoalAmount,
  onDeleteGoal,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('0');
  const [goalDate, setGoalDate] = useState('2027-12-31');
  const [goalCategory, setGoalCategory] = useState<FinancialGoal['category']>('Emergency Fund');

  const totalIncome = data.transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0) || 85000;

  let needsExpense = 0;
  let wantsExpense = 0;
  let investmentsSavings = 0;

  data.transactions.forEach((tx) => {
    if (tx.type === 'expense') {
      const cat = tx.category;
      if (
        cat === 'Rent & Housing' ||
        cat === 'Utilities & Bills' ||
        cat === 'Groceries' ||
        cat === 'Transportation' ||
        cat === 'Healthcare & Medical' ||
        cat === 'EMI & Debt Payment'
      ) {
        needsExpense += tx.amount;
      } else if (
        cat === 'Food & Dining' ||
        cat === 'Shopping & Lifestyle' ||
        cat === 'Entertainment & Subscriptions' ||
        cat === 'Travel & Vacation'
      ) {
        wantsExpense += tx.amount;
      } else if (cat === 'Investment (Self-transfer)') {
        investmentsSavings += tx.amount;
      } else {
        needsExpense += tx.amount;
      }
    }
  });

  const activeSips = data.investments.reduce((acc, i) => acc + (i.sipMonthlyAmount || 0), 0);
  if (investmentsSavings === 0 && activeSips > 0) {
    investmentsSavings = activeSips;
  }

  const needsPercent = Math.round((needsExpense / totalIncome) * 100);
  const wantsPercent = Math.round((wantsExpense / totalIncome) * 100);
  const investPercent = Math.round((investmentsSavings / totalIncome) * 100);

  const monthlySurvivalCost = needsExpense > 0 ? needsExpense : 40000;
  const target6MonthsEmergency = monthlySurvivalCost * 6;
  const currentEmergencyReserves = data.investments
    .filter((i) => i.assetType === 'fixed_deposit')
    .reduce((acc, i) => acc + i.currentValue, 0) || 200000;

  const monthsCovered = (currentEmergencyReserves / monthlySurvivalCost).toFixed(1);

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(goalTarget);
    const curr = parseFloat(goalCurrent || '0');

    if (isNaN(target) || target <= 0) {
      alert('Please enter a valid target amount');
      return;
    }

    onAddGoal({
      title: goalTitle.trim() || 'My Financial Goal',
      targetAmount: target,
      currentAmount: isNaN(curr) ? 0 : curr,
      targetDate: goalDate,
      category: goalCategory,
    });

    setGoalTitle('');
    setGoalTarget('');
    setGoalCurrent('0');
    setShowAddForm(false);
  };

  const handleCelebrate = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="space-y-6">
      
      {/* 50/30/20 Financial Health Rule Card */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
                <Award className="h-5 w-5" />
              </span>
              <h2 className="text-base font-bold text-slate-900">50 / 30 / 20 Budget Rule Check</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Golden personal finance framework: 50% Needs, 30% Wants, 20% Investments
            </p>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-500">Monthly Inflow Basis: </span>
            <strong className="text-slate-900">{formatINR(totalIncome)}</strong>
          </div>
        </div>

        {/* 3 Metric Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          
          {/* Needs */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-slate-700">Needs (Zarooratein)</span>
              <span className={`font-bold ${needsPercent <= 50 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {needsPercent}% / 50%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden mb-2">
              <div 
                className={`h-full rounded-full ${needsPercent <= 50 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                style={{ width: `${Math.min(needsPercent, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>Spent: {formatINR(needsExpense)}</span>
              <span>Target: ~{formatINR(totalIncome * 0.5)}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Rent, Groceries, Bills, Medicine & Loan EMIs
            </p>
          </div>

          {/* Wants */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-slate-700">Wants (Shauk / Lifestyle)</span>
              <span className={`font-bold ${wantsPercent <= 30 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {wantsPercent}% / 30%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden mb-2">
              <div 
                className={`h-full rounded-full ${wantsPercent <= 30 ? 'bg-teal-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.min(wantsPercent, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>Spent: {formatINR(wantsExpense)}</span>
              <span>Target: ~{formatINR(totalIncome * 0.3)}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Dining out, Shopping, Trips & Entertainment
            </p>
          </div>

          {/* Investments */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-slate-700">Investments (Future Wealth)</span>
              <span className={`font-bold ${investPercent >= 20 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {investPercent}% / 20%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden mb-2">
              <div 
                className={`h-full rounded-full ${investPercent >= 20 ? 'bg-indigo-500' : 'bg-rose-500'}`}
                style={{ width: `${Math.min(investPercent, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>Invested: {formatINR(investmentsSavings)}</span>
              <span>Target: ~{formatINR(totalIncome * 0.2)}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Monthly SIPs, Mutual Funds, Stocks, Emergency buffer
            </p>
          </div>

        </div>
      </div>

      {/* Emergency Fund Shield */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Emergency Fund Shield</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Recommended 6 months of basic living expenses saved in liquid cash/FD
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-2xl font-extrabold text-emerald-600">{monthsCovered} Months</span>
            <span className="block text-[11px] text-slate-500">Survival Runway Covered</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between text-xs text-slate-600 gap-2">
          <span>Current Liquid Emergency Buffer: <strong className="text-slate-900">{formatINR(currentEmergencyReserves)}</strong></span>
          <span>Target 6-Month Safety Shield: <strong className="text-emerald-700">{formatINR(target6MonthsEmergency)}</strong></span>
        </div>
      </div>

      {/* Goals Section */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              <span>Target Wealth & Purchase Goals</span>
            </h2>
            <p className="text-xs text-slate-500">Set milestones and stay motivated until you reach them</p>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>{showAddForm ? 'Cancel' : 'New Goal'}</span>
          </button>
        </div>

        {/* Add Goal Collapsible Form */}
        {showAddForm && (
          <form onSubmit={handleCreateGoal} className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700">Add New Financial Goal</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Goal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MacBook Pro, Car Downpayment"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Target Amount (₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 150000"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Already Saved (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 20000"
                  value={goalCurrent}
                  onChange={(e) => setGoalCurrent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Target Date</label>
                <input
                  type="date"
                  value={goalDate}
                  onChange={(e) => setGoalDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900"
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs"
              >
                Save Goal
              </button>
            </div>
          </form>
        )}

        {/* Goals List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.goals.map((goal) => {
            const percent = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
            const isCompleted = goal.currentAmount >= goal.targetAmount;

            return (
              <div 
                key={goal.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-4 hover:border-slate-300 transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                      {goal.category}
                    </span>
                    <button
                      onClick={() => onDeleteGoal(goal.id)}
                      className="text-slate-400 hover:text-rose-600 text-xs font-bold"
                      title="Delete goal"
                    >
                      ×
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-2">{goal.title}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Target: {formatDate(goal.targetDate)}</p>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-900">{formatINR(goal.currentAmount)}</span>
                      <span className="text-slate-500">of {formatINR(goal.targetAmount)}</span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-emerald-600' : 'bg-purple-600'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className={`font-semibold ${isCompleted ? 'text-emerald-700' : 'text-slate-600'}`}>
                    {percent}% Reached
                  </span>

                  <div className="flex items-center gap-1.5">
                    {!isCompleted ? (
                      <button
                        onClick={() => onUpdateGoalAmount(goal.id, 5000)}
                        className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200"
                      >
                        +₹5,000
                      </button>
                    ) : (
                      <button
                        onClick={handleCelebrate}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold"
                      >
                        <PartyPopper className="h-3.5 w-3.5" />
                        <span>Celebrate!</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};
