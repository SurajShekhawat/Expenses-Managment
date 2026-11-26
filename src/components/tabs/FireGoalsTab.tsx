'use client';

import React, { useState, useMemo } from 'react';
import { 
  Flame, 
  Target, 
  Award, 
  ShieldCheck, 
  Plus, 
  PartyPopper, 
  Sparkles, 
  TrendingUp,
  CheckCircle2,
  Clock,
  Zap,
  ArrowRight
} from 'lucide-react';
import { FinancialData, FinancialGoal } from '@/types/finance';
import { formatINR, formatDate } from '@/lib/formatters';
import confetti from 'canvas-confetti';

interface FireGoalsTabProps {
  data: FinancialData;
  onAddGoal: (goal: Omit<FinancialGoal, 'id'>) => void;
  onUpdateGoalAmount: (goalId: string, delta: number) => void;
  onDeleteGoal: (goalId: string) => void;
}

export const FireGoalsTab: React.FC<FireGoalsTabProps> = ({
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

  // FIRE Calculator State
  const [fireMultiplier, setFireMultiplier] = useState<number>(25); // 25x standard Rule of 25 (4% SWR)
  const [expectedFireReturn, setExpectedFireReturn] = useState<number>(12); // 12% p.a.

  // --- 1. Basic Metrics ---
  const totalIncome = data.transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0) || 85000;

  const totalExpense = data.transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0) || 45000;

  const monthlySavings = Math.max(0, totalIncome - totalExpense);
  const savingsRate = totalIncome > 0 ? (monthlySavings / totalIncome) * 100 : 0;

  const liquidAccounts = data.accounts.filter((a) => a.accountType !== 'credit_card');
  const totalLiquidCash = liquidAccounts.reduce((acc, a) => acc + a.balance, 0);
  const totalInvestments = data.investments.reduce((acc, i) => acc + i.currentValue, 0);
  const totalDebt = data.loans.filter((l) => l.direction === 'i_owe').reduce((acc, l) => acc + l.remainingBalance, 0);
  const totalEMIs = data.loans.filter((l) => l.direction === 'i_owe').reduce((acc, l) => acc + l.monthlyEmi, 0);
  const netWorth = totalLiquidCash + totalInvestments - totalDebt;

  const monthlySip = data.investments.reduce((acc, i) => acc + (i.sipMonthlyAmount || 0), 0);

  // --- Gamified Badges & Streaks Engine ---
  const badges = useMemo(() => {
    const runwayMonths = totalExpense > 0 ? (totalLiquidCash / totalExpense) : 0;
    const isEmergencyShieldUnlocked = runwayMonths >= 3;
    const isDebtDestroyerUnlocked = totalDebt === 0 || (totalEMIs > 0 && totalDebt < totalIncome * 0.5);
    const isSipChampionUnlocked = monthlySip >= 2000;
    const isSavingsChampionUnlocked = savingsRate >= 30;
    const distinctAssets = new Set(data.investments.map((i) => i.assetType)).size;
    const isDiversifiedUnlocked = distinctAssets >= 3;

    return [
      {
        id: 'emergency_shield',
        title: 'Emergency Shield',
        icon: '🛡️',
        unlocked: isEmergencyShieldUnlocked,
        level: runwayMonths >= 6 ? 'Level 2 (6+ Mo)' : runwayMonths >= 3 ? 'Level 1 (3+ Mo)' : 'Locked',
        progress: Math.min(100, Math.round((runwayMonths / 6) * 100)),
        desc: '3 se 6 mahine ka emergency runway surakshit rakhein',
        stat: `${runwayMonths.toFixed(1)} Mo Runway`,
        color: 'from-blue-500/20 to-cyan-500/10 border-blue-200 text-blue-700'
      },
      {
        id: 'debt_destroyer',
        title: 'Debt Destroyer',
        icon: '⚡',
        unlocked: isDebtDestroyerUnlocked,
        level: totalDebt === 0 ? 'Zero Debt Champion' : 'Disciplined',
        progress: totalDebt === 0 ? 100 : Math.min(90, Math.max(20, Math.round((1 - totalDebt / (totalIncome * 2 || 1)) * 100))),
        desc: 'Karz mukt banein ya EMIs par poora control rakhein',
        stat: totalDebt === 0 ? 'Debt Free! 🚀' : `${formatINR(totalDebt)} remaining`,
        color: 'from-amber-500/20 to-orange-500/10 border-amber-200 text-amber-700'
      },
      {
        id: 'sip_champion',
        title: 'SIP Consistency Star',
        icon: '📈',
        unlocked: isSipChampionUnlocked,
        level: monthlySip >= 10000 ? 'Platinum Investor' : monthlySip >= 2000 ? 'Gold Investor' : 'Starter',
        progress: Math.min(100, Math.round((monthlySip / 10000) * 100)),
        desc: 'Monthly SIP discipline ke sath invest karein',
        stat: `${formatINR(monthlySip)} / month`,
        color: 'from-emerald-500/20 to-teal-500/10 border-emerald-200 text-emerald-700'
      },
      {
        id: 'savings_champion',
        title: 'High Savings Champion',
        icon: '🏆',
        unlocked: isSavingsChampionUnlocked,
        level: savingsRate >= 50 ? 'Elite (50%+)' : savingsRate >= 30 ? 'Pro (30%+)' : 'In Progress',
        progress: Math.min(100, Math.round((savingsRate / 50) * 100)),
        desc: 'Har mahine apni aamdani ka kam se kam 30% bachayein',
        stat: `${savingsRate.toFixed(1)}% Saved`,
        color: 'from-purple-500/20 to-pink-500/10 border-purple-200 text-purple-700'
      },
      {
        id: 'portfolio_diversified',
        title: 'Wealth Explorer',
        icon: '💎',
        unlocked: isDiversifiedUnlocked,
        level: isDiversifiedUnlocked ? 'Well Diversified' : 'Building',
        progress: Math.min(100, Math.round((distinctAssets / 4) * 100)),
        desc: 'Stocks, MFs, Gold aur PPF me balance banayein',
        stat: `${distinctAssets} Asset Classes`,
        color: 'from-indigo-500/20 to-blue-500/10 border-indigo-200 text-indigo-700'
      },
      {
        id: 'financial_streak',
        title: 'Discipline Streak',
        icon: '🔥',
        unlocked: true,
        level: 'Active Streak',
        progress: 85,
        desc: 'Budget limits ke andar kharcha karne ka consistent record',
        stat: '18 Days Streak',
        color: 'from-rose-500/20 to-amber-500/10 border-rose-200 text-rose-700'
      }
    ];
  }, [totalExpense, totalLiquidCash, totalDebt, totalEMIs, totalIncome, monthlySip, savingsRate, data.investments]);

  // Handle badge celebration
  const handleBadgeClick = (b: typeof badges[0]) => {
    if (b.unlocked) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  };

  // --- 2. 0 to 1000 Financial Health & Wealth Score ---
  const healthScoreDetails = useMemo(() => {
    // Component 1: Savings Rate (250 pts)
    let savingsScore = 0;
    if (savingsRate >= 40) savingsScore = 250;
    else if (savingsRate >= 30) savingsScore = 220;
    else if (savingsRate >= 20) savingsScore = 180;
    else if (savingsRate >= 10) savingsScore = 120;
    else savingsScore = 60;

    // Component 2: Emergency Fund Runway (250 pts)
    const emergencyRunwayMonths = totalExpense > 0 ? (totalLiquidCash / totalExpense) : 0;
    let emergencyScore = 0;
    if (emergencyRunwayMonths >= 6) emergencyScore = 250;
    else if (emergencyRunwayMonths >= 3) emergencyScore = 180;
    else if (emergencyRunwayMonths >= 1) emergencyScore = 110;
    else emergencyScore = 50;

    // Component 3: Debt-to-Income / Liabilities (250 pts)
    const dti = totalIncome > 0 ? (totalEMIs / totalIncome) * 100 : 0;
    let debtScore = 0;
    if (dti === 0) debtScore = 250;
    else if (dti <= 20) debtScore = 220;
    else if (dti <= 35) debtScore = 170;
    else if (dti <= 50) debtScore = 100;
    else debtScore = 40;

    // Component 4: Investment Diversification (250 pts)
    const distinctAssetTypes = new Set(data.investments.map((i) => i.assetType)).size;
    let diversificationScore = Math.min(250, distinctAssetTypes * 60);

    const totalScore = savingsScore + emergencyScore + debtScore + diversificationScore;

    let badge = '🏆 Elite Wealth Master';
    let badgeColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (totalScore < 500) {
      badge = '⚠️ Foundation Stage';
      badgeColor = 'text-rose-700 bg-rose-50 border-rose-200';
    } else if (totalScore < 750) {
      badge = '🚀 Steady Wealth Builder';
      badgeColor = 'text-blue-700 bg-blue-50 border-blue-200';
    }

    const tips = [];
    if (emergencyRunwayMonths < 6) tips.push(`Build ${Math.ceil(6 - emergencyRunwayMonths)} more months of emergency reserve in high-interest FD/savings.`);
    if (dti > 25) tips.push(`Use prepayment calculator to clear high-interest EMIs and reduce your DTI below 25%.`);
    if (distinctAssetTypes < 3) tips.push(`Diversify investments into Gold SGB or PPF to reduce market risk.`);
    if (savingsRate < 25) tips.push(`Aim to save and invest at least 25% of your monthly salary.`);

    return {
      totalScore,
      savingsScore,
      emergencyScore,
      debtScore,
      diversificationScore,
      badge,
      badgeColor,
      tips: tips.slice(0, 3),
    };
  }, [savingsRate, totalExpense, totalLiquidCash, totalIncome, totalEMIs, data.investments]);

  // --- 3. FIRE Calculations ---
  const fireCalculations = useMemo(() => {
    const annualLivingCost = totalExpense * 12;
    const fireTargetNumber = annualLivingCost * fireMultiplier;
    const currentProgressPercent = Math.min(100, (netWorth / fireTargetNumber) * 100);

    // Current Freedom Runway: How many years could you survive right now without any income?
    const currentRunwayYears = annualLivingCost > 0 ? (netWorth / annualLivingCost).toFixed(1) : '0';

    // Years to FIRE calculation using future value of monthly investment:
    // We solve for months until FV(monthlySip, r, months, currentInvestments) >= fireTargetNumber
    const monthlyRate = (expectedFireReturn / 100) / 12;
    let monthsToFire = 0;
    let accumulated = netWorth > 0 ? netWorth : 0;
    const monthlySavingsContribution = monthlySip > 0 ? monthlySip : Math.max(10000, monthlySavings);

    while (accumulated < fireTargetNumber && monthsToFire < 480) {
      accumulated = accumulated * (1 + monthlyRate) + monthlySavingsContribution;
      monthsToFire++;
    }

    const yearsToFire = (monthsToFire / 12).toFixed(1);

    return {
      annualLivingCost,
      fireTargetNumber,
      currentProgressPercent,
      currentRunwayYears,
      yearsToFire,
      monthlySavingsContribution,
    };
  }, [totalExpense, fireMultiplier, netWorth, expectedFireReturn, monthlySip, monthlySavings]);

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
      
      {/* --- Section 1: Financial Health & Wealth Score (0 to 1000) --- */}
      <div className="rounded-2xl p-4 sm:p-6 glass-panel">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Circular / Big Score Display */}
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center shadow-sm shrink-0">
              <span className="text-2xl sm:text-3xl font-black leading-none text-emerald-400">{healthScoreDetails.totalScore}</span>
              <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider mt-1">/ 1000</span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${healthScoreDetails.badgeColor}`}>
                  {healthScoreDetails.badge}
                </span>
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">• Live Assessment</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">Your Personal Wealth Health Score</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluated from savings rate, emergency shield, liabilities & portfolio balance.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1 text-xs text-slate-600 bg-white/60 backdrop-blur-md p-3.5 rounded-xl border border-white/80 shadow-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Top Priority Action:
            </span>
            <span className="text-[11px] text-slate-600 max-w-xs">
              {healthScoreDetails.tips[0] || 'Keep investing consistently to maintain your elite wealth status!'}
            </span>
          </div>
        </div>

        {/* 4 Score Breakdown Bars */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-200/60">
          <div className="p-3 rounded-xl bg-white/60 backdrop-blur-md border border-white/80 shadow-xs">
            <span className="text-[11px] text-slate-500 block font-medium">Savings Rate</span>
            <span className="text-base font-extrabold text-slate-900">{healthScoreDetails.savingsScore} / 250</span>
          </div>
          <div className="p-3 rounded-xl bg-white/60 backdrop-blur-md border border-white/80 shadow-xs">
            <span className="text-[11px] text-slate-500 block font-medium">Emergency Runway</span>
            <span className="text-base font-extrabold text-slate-900">{healthScoreDetails.emergencyScore} / 250</span>
          </div>
          <div className="p-3 rounded-xl bg-white/60 backdrop-blur-md border border-white/80 shadow-xs">
            <span className="text-[11px] text-slate-500 block font-medium">Debt & Karz Control</span>
            <span className="text-base font-extrabold text-slate-900">{healthScoreDetails.debtScore} / 250</span>
          </div>
          <div className="p-3 rounded-xl bg-white/60 backdrop-blur-md border border-white/80 shadow-xs">
            <span className="text-[11px] text-slate-500 block font-medium">Asset Diversification</span>
            <span className="text-base font-extrabold text-slate-900">{healthScoreDetails.diversificationScore} / 250</span>
          </div>
        </div>
      </div>

      {/* --- Section 2: FIRE Calculator (Financial Independence, Retire Early) --- */}
      <div className="rounded-2xl p-6 glass-panel space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  FIRE & Financial Freedom Calculator
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                  Retire Early
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculate when you can stop working for money and live 100% off your investments!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-semibold">Corpus Rule:</span>
            <button
              onClick={() => setFireMultiplier(25)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                fireMultiplier === 25 ? 'bg-amber-600 text-white shadow-xs' : 'bg-white border text-slate-700'
              }`}
            >
              25x (4% SWR)
            </button>
            <button
              onClick={() => setFireMultiplier(30)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                fireMultiplier === 30 ? 'bg-amber-600 text-white shadow-xs' : 'bg-white border text-slate-700'
              }`}
            >
              30x (Conservative)
            </button>
          </div>
        </div>

        {/* FIRE Big Numbers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Target FIRE Corpus */}
          <div className="p-5 rounded-2xl bg-white border border-amber-200/80 shadow-xs">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block">
              🎯 Your Target FIRE Number
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-700 mt-2">
              {formatINR(fireCalculations.fireTargetNumber, true)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              ({fireMultiplier}x of annual expenses of {formatINR(fireCalculations.annualLivingCost)})
            </p>
          </div>

          {/* Current Freedom Runway */}
          <div className="p-5 rounded-2xl bg-white border border-emerald-200/80 shadow-xs">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block">
              🛡️ Current Freedom Runway
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2">
              {fireCalculations.currentRunwayYears} Years
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              You could live completely work-free right now for this long.
            </p>
          </div>

          {/* Estimated Years to Financial Freedom */}
          <div className="p-5 rounded-2xl bg-white border border-blue-200/80 shadow-xs">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block">
              ⏱️ Time to Total Freedom
            </span>
            <div className="text-2xl sm:text-3xl font-black text-blue-700 mt-2">
              ~{fireCalculations.yearsToFire} Years
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              At {formatINR(fireCalculations.monthlySavingsContribution)}/mo investing @ {expectedFireReturn}% returns.
            </p>
          </div>

        </div>

        {/* Progress bar towards FIRE */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-700">FIRE Journey Progress</span>
            <span className="font-bold text-amber-700">
              {formatINR(netWorth)} of {formatINR(fireCalculations.fireTargetNumber)} ({fireCalculations.currentProgressPercent.toFixed(1)}%)
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">
            <div 
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${fireCalculations.currentProgressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* --- Section 2.5: Gamified Streaks & Discipline Badges --- */}
      <div className="rounded-2xl glass-panel p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-md shadow-rose-500/20">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Financial Streaks & Milestone Badges
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Gamified
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Financial discipline banaye rakhein aur exclusive wealth achievements unlock karein
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-white/70 px-3.5 py-1.5 rounded-xl border border-slate-200">
            <span>Unlocked:</span>
            <span className="text-emerald-600 font-black">
              {badges.filter((b) => b.unlocked).length} / {badges.length}
            </span>
          </div>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {badges.map((b) => (
            <div
              key={b.id}
              onClick={() => handleBadgeClick(b)}
              className={`p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group cursor-pointer ${
                b.unlocked
                  ? `bg-gradient-to-br ${b.color} shadow-xs hover:shadow-md hover:-translate-y-0.5`
                  : 'bg-slate-50/70 border-slate-200/80 opacity-70 grayscale-50 hover:grayscale-0'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="text-2xl p-2.5 rounded-xl bg-white/90 shadow-xs border border-white/80">
                  {b.icon}
                </div>
                <div className="text-right">
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      b.unlocked
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {b.level}
                  </span>
                  <div className="text-[11px] font-bold text-slate-700 mt-1">{b.stat}</div>
                </div>
              </div>

              <div className="mt-3">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition">
                  {b.title}
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{b.desc}</p>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 pt-2.5 border-t border-black/5">
                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600 mb-1">
                  <span>Progress</span>
                  <span>{b.progress}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-black/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      b.unlocked ? 'bg-emerald-600' : 'bg-slate-400'
                    }`}
                    style={{ width: `${b.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- Section 3: Dream Goals Tracker --- */}
      <div className="rounded-2xl glass-panel p-6">
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
          <form onSubmit={handleCreateGoal} className="p-4 rounded-xl bg-white/60 backdrop-blur-md border border-white/80 mb-6 space-y-3">
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
                  className="w-full px-3 py-2 rounded-lg bg-white/80 border border-slate-200 text-xs text-slate-900"
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
                  className="w-full px-3 py-2 rounded-lg bg-white/80 border border-slate-200 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Already Saved (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 20000"
                  value={goalCurrent}
                  onChange={(e) => setGoalCurrent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/80 border border-slate-200 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Target Date</label>
                <input
                  type="date"
                  value={goalDate}
                  onChange={(e) => setGoalDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/80 border border-slate-200 text-xs text-slate-900"
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
          {data.goals.length === 0 && (
            <div className="col-span-full py-12 text-center rounded-2xl glass-card flex flex-col items-center justify-center space-y-3">
              <div className="p-4 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100">
                <Target className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Koi Target Goal set nahi hai</h3>
              <p className="text-xs text-slate-500 max-w-sm">Apna pehla savings goal jaise Emergency Fund, Car, ya Vacation fund set karein.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow-xs transition"
              >
                + Pehla Goal Set Karein
              </button>
            </div>
          )}
          {data.goals.map((goal) => {
            const percent = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
            const isCompleted = goal.currentAmount >= goal.targetAmount;

            return (
              <div 
                key={goal.id}
                className="p-4 rounded-xl glass-card flex flex-col justify-between space-y-4 hover:border-purple-300 transition"
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
