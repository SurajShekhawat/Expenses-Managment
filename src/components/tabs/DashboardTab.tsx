'use client';

import React from 'react';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Building2, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Wallet,
  Plus,
  Landmark,
  ArrowRight,
  Calendar,
  CreditCard,
  Gauge,
  ShieldCheck,
  AlertOctagon,
  LineChart
} from 'lucide-react';
import { FinancialData, Transaction } from '@/types/finance';
import { NavTabType } from '../Navbar';
import { formatINR, formatPercent, formatDate, getTodayDateString } from '@/lib/formatters';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

interface DashboardTabProps {
  data: FinancialData;
  onOpenAddModal: (type: 'transaction' | 'investment' | 'loan' | 'account') => void;
  onSelectTab: (tab: NavTabType) => void;
  privacyMode?: boolean;
}

const ASSET_DONUT_COLORS = ['#059669', '#2563eb', '#d97706', '#7c3aed', '#db2777', '#0891b2'];

export const DashboardTab: React.FC<DashboardTabProps> = ({
  data,
  onOpenAddModal,
  onSelectTab,
  privacyMode = false,
}) => {
  // 1. Calculations
  const totalInvested = data.investments.reduce((acc, inv) => acc + inv.investedAmount, 0);
  const totalCurrentInvestments = data.investments.reduce((acc, inv) => acc + inv.currentValue, 0);
  const totalProfitLoss = totalCurrentInvestments - totalInvested;
  const portfolioReturnPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

  // Active debts (I owe)
  const myLoans = data.loans.filter((l) => l.direction === 'i_owe');
  const totalDebtOutstanding = myLoans.reduce((acc, l) => acc + l.remainingBalance, 0);
  const totalMonthlyEmi = myLoans.reduce((acc, l) => acc + l.monthlyEmi, 0);

  // Udhaar (They owe me)
  const theyOweMe = data.loans.filter((l) => l.direction === 'they_owe_me');
  const totalReceivables = theyOweMe.reduce((acc, l) => acc + l.remainingBalance, 0);

  // Bank & Cash Balances
  const liquidAccounts = data.accounts.filter((a) => a.accountType !== 'credit_card');
  const totalLiquidCash = liquidAccounts.reduce((acc, a) => acc + a.balance, 0);

  // Net worth = Bank Balances + Current Investments + Receivables - Debts
  const netWorth = totalLiquidCash + totalCurrentInvestments + totalReceivables - totalDebtOutstanding;

  // Monthly income vs expense
  const totalIncome = data.transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = data.transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Asset allocation for pie chart
  const assetMap: Record<string, number> = {};
  data.investments.forEach((inv) => {
    const typeLabel =
      inv.assetType === 'mutual_funds'
        ? 'Mutual Funds'
        : inv.assetType === 'stocks'
        ? 'Stocks'
        : inv.assetType === 'gold'
        ? 'Gold'
        : inv.assetType === 'fixed_deposit'
        ? 'Fixed Deposit'
        : inv.assetType === 'ppf_epf'
        ? 'PPF / EPF'
        : 'Others';
    assetMap[typeLabel] = (assetMap[typeLabel] || 0) + inv.currentValue;
  });

  const assetAllocationData = Object.keys(assetMap).map((key) => ({
    name: key,
    value: assetMap[key],
  }));

  // Cashflow timeline mock
  const cashflowTrend = [
    { month: 'Jun', income: 72000, expense: 42000 },
    { month: 'Jul', income: 75000, expense: 46000 },
    { month: 'Aug', income: 78000, expense: 41000 },
    { month: 'Sep', income: 82000, expense: 48000 },
    { month: 'Oct', income: 85000, expense: 52000 },
    { month: 'Nov', income: totalIncome, expense: totalExpense },
  ];

  const upcomingEmis = myLoans
    .filter((l) => l.monthlyEmi > 0 && l.dueDayOfMonth)
    .sort((a, b) => (a.dueDayOfMonth || 0) - (b.dueDayOfMonth || 0));

  // Smart Daily Safe Spend & Velocity Projection
  const now = new Date();
  const currentDay = now.getDate() || 21;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() || 30;
  const daysRemaining = Math.max(1, daysInMonth - currentDay);
  
  const totalMonthlyBudget = data.budgets.reduce((acc, b) => acc + b.limit, 0) || (totalIncome > 0 ? totalIncome * 0.65 : 55000);
  const remainingBudget = Math.max(0, totalMonthlyBudget - totalExpense);
  const dailySafeSpend = Math.round(remainingBudget / daysRemaining);

  const todayStr = getTodayDateString();
  const todayExpenses = data.transactions
    .filter(t => t.type === 'expense' && t.date === todayStr)
    .reduce((acc, t) => acc + t.amount, 0);

  const projectedMonthEndExpense = currentDay > 0 ? Math.round((totalExpense / currentDay) * daysInMonth) : totalExpense;
  const isPacingOverBudget = projectedMonthEndExpense > totalMonthlyBudget && totalMonthlyBudget > 0;
  const overspendDifference = Math.max(0, projectedMonthEndExpense - totalMonthlyBudget);

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Authentic Clean Wealth Header */}
      <div className="rounded-2xl p-4 sm:p-6 glass-panel border border-white/80 shadow-xs relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          
          {/* Net Worth */}
          <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-slate-200/80 pb-4 md:pb-0 md:pr-4">
            <span className="text-xs uppercase tracking-wider text-emerald-700 font-extrabold flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Total Net Worth
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight break-words">
              {formatINR(netWorth, false, privacyMode)}
            </h1>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              Bank {formatINR(totalLiquidCash, true, privacyMode)} + Invest {formatINR(totalCurrentInvestments, true, privacyMode)} - Karz {formatINR(totalDebtOutstanding, true, privacyMode)}
            </p>
          </div>

          {/* Monthly Inflow / Outflow */}
          <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3.5">
            
            {/* Income */}
            <div className="p-3.5 rounded-xl bg-emerald-50/70 backdrop-blur-md border border-emerald-100 shadow-xs hover:bg-emerald-50 transition">
              <div className="flex items-center justify-between text-xs text-emerald-800 mb-1 font-bold">
                <span>Total Income</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <p className="text-lg sm:text-xl font-extrabold text-slate-900">{formatINR(totalIncome, false, privacyMode)}</p>
              <span className="text-[11px] text-emerald-700 font-medium">Monthly inflow</span>
            </div>

            {/* Expenses */}
            <div className="p-3.5 rounded-xl bg-rose-50/70 backdrop-blur-md border border-rose-100 shadow-xs hover:bg-rose-50 transition">
              <div className="flex items-center justify-between text-xs text-rose-800 mb-1 font-bold">
                <span>Total Kharcha</span>
                <ArrowDownRight className="h-3.5 w-3.5 text-rose-600" />
              </div>
              <p className="text-lg sm:text-xl font-extrabold text-slate-900">{formatINR(totalExpense, false, privacyMode)}</p>
              <span className="text-[11px] text-rose-700 font-medium">Expenses + EMIs</span>
            </div>

            {/* Savings Rate */}
            <div className="p-3.5 rounded-xl bg-blue-50/70 backdrop-blur-md border border-blue-100 shadow-xs hover:bg-blue-50 transition">
              <div className="flex items-center justify-between text-xs text-blue-800 mb-1 font-bold">
                <span>Savings Rate</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <p className="text-lg sm:text-xl font-extrabold text-slate-900">{savingsRate.toFixed(1)}%</p>
              <span className="text-[11px] text-blue-700 font-medium">
                {savingsRate >= 20 ? 'Healthy 20%+ zone' : 'Target 20%+ savings'}
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* --- Smart Daily Safe Spend Meter & Velocity Alert --- */}
      <div className="rounded-2xl p-5 glass-panel space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 shadow-xs">
              <Gauge className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Today&apos;s Safe Spending Allowance</h2>
              <p className="text-xs text-slate-500">
                Pacing based on your remaining monthly budget ({daysRemaining} days left)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Remaining Budget:</span>
            <span className="text-xs font-bold text-slate-900 px-2.5 py-1 rounded-lg bg-white/60 backdrop-blur-md border border-white/80 shadow-xs">
              {formatINR(remainingBudget, false, privacyMode)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-white/60 backdrop-blur-md border border-white/80 shadow-xs">
            <span className="text-[11px] text-slate-500 font-medium block">Daily Safe Spend Limit</span>
            <span className="text-lg font-extrabold text-emerald-700 mt-0.5 block">
              {formatINR(dailySafeSpend, false, privacyMode)} / day
            </span>
            <span className="text-[10px] text-slate-400">Target to stay within budget</span>
          </div>

          <div className="p-3 rounded-xl bg-white/60 backdrop-blur-md border border-white/80 shadow-xs">
            <span className="text-[11px] text-slate-500 font-medium block">Spent Today</span>
            <span className={`text-lg font-extrabold mt-0.5 block ${
              todayExpenses > dailySafeSpend ? 'text-rose-600' : 'text-slate-900'
            }`}>
              {formatINR(todayExpenses, false, privacyMode)}
            </span>
            <span className="text-[10px] text-slate-400">
              {todayExpenses > dailySafeSpend ? 'Daily limit exceeded' : 'Within safe allowance'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white/60 backdrop-blur-md border border-white/80 shadow-xs">
            <span className="text-[11px] text-slate-500 font-medium block">Month-End Projection</span>
            <span className={`text-lg font-extrabold mt-0.5 block ${
              isPacingOverBudget ? 'text-rose-600' : 'text-blue-700'
            }`}>
              {formatINR(projectedMonthEndExpense, false, privacyMode)}
            </span>
            <span className="text-[10px] text-slate-400">
              {isPacingOverBudget ? `~${formatINR(overspendDifference, true, privacyMode)} over budget` : 'Safe velocity trajectory'}
            </span>
          </div>
        </div>

        {isPacingOverBudget && (
          <div className="p-3 rounded-xl bg-rose-50/80 backdrop-blur-md border border-rose-200/90 flex items-start gap-2.5 text-xs text-rose-800 shadow-xs">
            <AlertOctagon className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Overspending Velocity Alert:</strong> Aapka kharcha is mahine target budget se lagbhag {formatINR(overspendDifference, false, privacyMode)} exceed kar sakta hai. Is hafte Dining, Shopping aur unnecessary kharche control karein.
            </div>
          </div>
        )}
      </div>

      {/* --- Connected Bank Accounts Quick Row --- */}
      <div className="rounded-2xl glass-panel p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Your Bank & Wallet Balances</h2>
          </div>
          <button
            onClick={() => onSelectTab('accounts')}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
          >
            <span>Manage All ({data.accounts.length})</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {data.accounts.length === 0 ? (
          <div className="p-4 rounded-xl bg-white/60 backdrop-blur-md border border-white/80 text-center py-6">
            <p className="text-xs text-slate-500 font-medium">Koi Bank Account ya Wallet connected nahi hai.</p>
            <button
              onClick={() => onSelectTab('accounts')}
              className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-bold"
            >
              + Pehla Account Add Karein →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {data.accounts.slice(0, 6).map((acc) => (
              <div 
                key={acc.id}
                onClick={() => onSelectTab('accounts')}
                className="p-3 rounded-xl bg-white/60 hover:bg-white/90 backdrop-blur-md border border-white/80 cursor-pointer transition-all shadow-xs hover:-translate-y-0.5"
              >
                <span className="text-[10px] text-slate-500 truncate block font-medium">
                  {acc.name}
                </span>
                <span className="text-sm font-extrabold text-slate-900 mt-1 block">
                  {formatINR(acc.balance, false, privacyMode)}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block mt-0.5 font-bold">
                  {acc.accountType.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4 Cards: Investments, Debt, SIP, Udhaari */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Groww Investment Card */}
        <div 
          onClick={() => onSelectTab('investments')}
          className="cursor-pointer p-4 rounded-2xl glass-card hover:bg-white/85 border border-white/80 hover:border-emerald-300 hover:shadow-md transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Groww Portfolio</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-slate-900">{formatINR(totalCurrentInvestments, false, privacyMode)}</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span className={totalProfitLoss >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                {formatINR(totalProfitLoss, false, privacyMode)} ({formatPercent(portfolioReturnPercent)})
              </span>
              <span className="text-slate-400">Returns</span>
            </div>
          </div>
        </div>

        {/* Active Loans & Liabilities Card */}
        <div 
          onClick={() => onSelectTab('loans')}
          className="cursor-pointer p-4 rounded-2xl glass-card hover:bg-white/85 border border-white/80 hover:border-rose-300 hover:shadow-md transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Loans / Karz</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-slate-900">{formatINR(totalDebtOutstanding, false, privacyMode)}</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
              <span>Monthly EMI:</span>
              <span className="text-rose-600 font-bold">{formatINR(totalMonthlyEmi, false, privacyMode)}</span>
            </div>
          </div>
        </div>

        {/* Monthly SIP Running */}
        <div 
          onClick={() => onSelectTab('investments')}
          className="cursor-pointer p-4 rounded-2xl glass-card hover:bg-white/85 border border-white/80 hover:border-blue-300 hover:shadow-md transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly SIP</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <LineChart className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-slate-900">
              {formatINR(data.investments.reduce((acc, i) => acc + (i.sipMonthlyAmount || 0), 0), false, privacyMode)}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Auto-compounding wealth
            </div>
          </div>
        </div>

        {/* Udhaari Tracker */}
        <div 
          onClick={() => onSelectTab('loans')}
          className="cursor-pointer p-4 rounded-2xl glass-card hover:bg-white/85 border border-white/80 hover:border-slate-300 hover:shadow-md transition-all hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Paise Lene Hain</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-emerald-600">{formatINR(totalReceivables, false, privacyMode)}</div>
            <div className="mt-1 text-xs text-slate-500">
              {theyOweMe.length} Pending from friends
            </div>
          </div>
        </div>

      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Cash Flow Trend */}
        <div className="lg:col-span-2 rounded-2xl glass-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Income vs Kharcha Cashflow</h2>
              <p className="text-xs text-slate-500">Track monthly stability and savings power</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600 font-medium">Income</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-slate-600 font-medium">Kharcha</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashflowTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: any) => [typeof val === 'number' ? formatINR(val) : String(val || ''), '']}
                />
                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2.5} fillOpacity={0.12} fill="#10b981" />
                <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={0.12} fill="#f43f5e" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Asset Allocation Donut */}
        <div className="rounded-2xl glass-panel p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Investment Asset Breakdown</h2>
            <p className="text-xs text-slate-500">Diversification across equity, debt & gold</p>
            
            <div className="h-44 w-full mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assetAllocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {assetAllocationData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={ASSET_DONUT_COLORS[index % ASSET_DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(val: any) => [typeof val === 'number' ? formatINR(val) : String(val || ''), 'Value']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 mt-2 border-t border-slate-100 pt-3 text-xs">
            {assetAllocationData.slice(0, 4).map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ASSET_DONUT_COLORS[idx % ASSET_DONUT_COLORS.length] }} />
                  <span className="text-slate-600 truncate max-w-[120px] font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">{formatINR(item.value, true)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Section: Upcoming EMIs & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upcoming EMIs */}
        <div className="rounded-2xl glass-panel p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600" />
              <span>Upcoming EMI Due Dates</span>
            </h2>
            <button
              onClick={() => onSelectTab('loans')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
            >
              View all
            </button>
          </div>

          {upcomingEmis.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No active EMIs due!</p>
          ) : (
            <div className="space-y-2.5">
              {upcomingEmis.map((loan) => (
                <div key={loan.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{loan.title}</h3>
                    <p className="text-[11px] text-slate-500">
                      Due: {loan.dueDayOfMonth}th ({loan.lenderOrBorrower})
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-rose-600">{formatINR(loan.monthlyEmi)}</span>
                    <span className="block text-[10px] text-slate-400">Auto-debit</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions list */}
        <div className="lg:col-span-2 rounded-2xl glass-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Transactions</h2>
              <p className="text-xs text-slate-500">Latest income, expenses, and account transfers</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAddModal('transaction')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold border border-emerald-200 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Kharcha</span>
              </button>
              <button
                onClick={() => onSelectTab('expenses')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
              >
                Full History →
              </button>
            </div>
          </div>

          {data.transactions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Koi transaction record nahi hai. Click <strong className="text-emerald-700">+ Add Kharcha</strong> par naya kharcha ya income record karne ke liye.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${
                      tx.type === 'income' 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : 'bg-rose-50 text-rose-600'
                    }`}>
                      {tx.type === 'income' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{tx.description}</p>
                      <p className="text-[11px] text-slate-500">
                        {tx.category} • <span className="text-slate-600 font-medium">{tx.paymentMode}</span> • {formatDate(tx.date)}
                      </p>
                    </div>
                  </div>
                  <div className={`text-xs font-bold ${
                    tx.type === 'income' ? 'text-emerald-600' : 'text-slate-800'
                  }`}>
                    {tx.type === 'income' ? '+' : '-'}{formatINR(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
