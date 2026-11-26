'use client';

import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  Search, 
  Trash2, 
  Plus, 
  ArrowDownRight, 
  ArrowUpRight,
  AlertTriangle,
  Landmark,
  Filter,
  Calendar,
  X,
  CreditCard,
  ArrowUpDown,
  Download
} from 'lucide-react';
import { FinancialData, Transaction, TransactionType } from '@/types/finance';
import { formatINR, formatDate } from '@/lib/formatters';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { ExpenseCalendar } from '@/components/calendar/ExpenseCalendar';

interface ExpensesTabProps {
  data: FinancialData;
  onOpenAddModal: (type: 'transaction') => void;
  onOpenSmsParser?: () => void;
  onDeleteTransaction: (id: string) => void;
  privacyMode?: boolean;
}

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#ec4899', '#8b5cf6'];

type DateRangeFilter = 'all' | 'today' | 'this_week' | 'this_month' | 'last_month' | 'custom';
type SortOption = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';

export const ExpensesTab: React.FC<ExpensesTabProps> = ({
  data,
  onOpenAddModal,
  onOpenSmsParser,
  onDeleteTransaction,
  privacyMode = false,
}) => {
  // View mode switcher: List vs Calendar
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Standard filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Advanced filters
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRangeFilter>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Extract distinct payment modes and categories
  const allCategories = useMemo(() => Array.from(new Set(data.transactions.map((t) => t.category))), [data.transactions]);
  const allPaymentModes = useMemo(() => Array.from(new Set(data.transactions.map((t) => t.paymentMode).filter(Boolean))), [data.transactions]);
  const accountMap = useMemo(() => new Map(data.accounts.map((a) => [a.id, a.name])), [data.accounts]);

  // Date filtering helper
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).getTime();

  // Filter & Sort pipeline
  const filteredTransactions = useMemo(() => {
    return data.transactions.filter((tx) => {
      // 1. Text Search
      const matchesSearch = 
        !searchTerm.trim() ||
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.paymentMode.toLowerCase().includes(searchTerm.toLowerCase());

      // 2. Type Filter (all, expense, income)
      const matchesType = typeFilter === 'all' || tx.type === typeFilter;

      // 3. Category Filter
      const matchesCategory = categoryFilter === 'all' || tx.category === categoryFilter;

      // 4. Account Filter
      const matchesAccount = accountFilter === 'all' || tx.accountId === accountFilter;

      // 5. Payment Mode Filter
      const matchesPaymentMode = paymentModeFilter === 'all' || tx.paymentMode === paymentModeFilter;

      // 6. Min & Max Amount Filter
      const minNum = minAmount ? parseFloat(minAmount) : null;
      const maxNum = maxAmount ? parseFloat(maxAmount) : null;
      const matchesMin = minNum === null || isNaN(minNum) || tx.amount >= minNum;
      const matchesMax = maxNum === null || isNaN(maxNum) || tx.amount <= maxNum;

      // 7. Date Range Filter
      const txTime = new Date(tx.date).getTime();
      let matchesDate = true;
      if (dateRange === 'today') {
        matchesDate = txTime >= startOfToday;
      } else if (dateRange === 'this_week') {
        matchesDate = txTime >= startOfWeek.getTime();
      } else if (dateRange === 'this_month') {
        matchesDate = txTime >= startOfMonth;
      } else if (dateRange === 'last_month') {
        matchesDate = txTime >= startOfLastMonth && txTime <= endOfLastMonth;
      } else if (dateRange === 'custom') {
        if (customStartDate) {
          const start = new Date(customStartDate).getTime();
          if (txTime < start) matchesDate = false;
        }
        if (customEndDate) {
          const end = new Date(customEndDate).getTime() + 86400000;
          if (txTime > end) matchesDate = false;
        }
      }

      return matchesSearch && matchesType && matchesCategory && matchesAccount && matchesPaymentMode && matchesMin && matchesMax && matchesDate;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortBy === 'date_asc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === 'amount_desc') {
        return b.amount - a.amount;
      } else if (sortBy === 'amount_asc') {
        return a.amount - b.amount;
      }
      return 0;
    });
  }, [
    data.transactions,
    searchTerm,
    typeFilter,
    categoryFilter,
    accountFilter,
    paymentModeFilter,
    minAmount,
    maxAmount,
    dateRange,
    customStartDate,
    customEndDate,
    sortBy,
    startOfToday,
    startOfWeek,
    startOfMonth,
    startOfLastMonth,
    endOfLastMonth
  ]);

  // Active filters count
  const activeFilterCount = (typeFilter !== 'all' ? 1 : 0) +
    (categoryFilter !== 'all' ? 1 : 0) +
    (accountFilter !== 'all' ? 1 : 0) +
    (paymentModeFilter !== 'all' ? 1 : 0) +
    (dateRange !== 'all' ? 1 : 0) +
    (minAmount ? 1 : 0) +
    (maxAmount ? 1 : 0) +
    (searchTerm ? 1 : 0);

  const handleResetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setAccountFilter('all');
    setPaymentModeFilter('all');
    setDateRange('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setSortBy('date_desc');
  };

  // Aggregated amounts for the current filtered view
  const filteredExpenseAmount = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const filteredIncomeAmount = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  // Category breakdown for donut
  const expenseTransactions = data.transactions.filter((t) => t.type === 'expense');
  const categoryTotals: Record<string, number> = {};
  expenseTransactions.forEach((tx) => {
    categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
  });

  const categoryChartData = Object.keys(categoryTotals).map((cat) => ({
    name: cat,
    value: categoryTotals[cat],
  })).sort((a, b) => b.value - a.value);

  const totalExpenseAmount = expenseTransactions.reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="space-y-4 sm:space-y-5">
      
      {/* View Switcher: List View vs Calendar View */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl glass-panel border border-[#BDD8E9] shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#0A4174] text-[#BDD8E9] shadow-xs">
            <Receipt className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-[#001D39]">Kharcha & Income Command Hub</h2>
            <p className="text-[11px] text-[#49769F] font-medium">List history ya Tareekh-wise Calendar view chunein</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-white/90 rounded-lg border border-[#BDD8E9] shadow-xs self-start sm:self-auto">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition active:scale-95 ${
              viewMode === 'list'
                ? 'bg-[#0A4174] text-white shadow-xs'
                : 'text-[#49769F] hover:text-[#001D39]'
            }`}
          >
            <Receipt className="h-3.5 w-3.5" />
            <span>List View</span>
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition active:scale-95 ${
              viewMode === 'calendar'
                ? 'bg-[#0A4174] text-white shadow-xs'
                : 'text-[#49769F] hover:text-[#001D39]'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>📅 Expense Calendar</span>
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <ExpenseCalendar
          data={data}
          onOpenAddModal={onOpenAddModal}
          onDeleteTransaction={onDeleteTransaction}
          privacyMode={privacyMode}
        />
      ) : (
        <>
      {/* Top Banner & Budget Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-4">
        
        {/* Category Breakdown Donut */}
        <div className="rounded-xl glass-panel p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Kharcha Breakdown</h2>
                <p className="text-xs text-slate-500">Total Spent: {formatINR(totalExpenseAmount)}</p>
              </div>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <Receipt className="h-4 w-4" />
              </div>
            </div>

            <div className="h-44 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#BDD8E9', borderRadius: '8px', fontSize: '11px', boxShadow: '0 2px 4px rgba(0,29,57,0.06)' }}
                    formatter={(val: any) => [typeof val === 'number' ? formatINR(val) : String(val || ''), 'Kharcha']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 border-t border-slate-100 pt-3 text-xs">
            {categoryChartData.slice(0, 3).map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-slate-600 truncate max-w-[130px] font-medium text-[11px]">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900 text-[11px]">{formatINR(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Budget Limits & Warnings */}
        <div className="lg:col-span-2 rounded-xl glass-panel p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Monthly Category Budgets</h2>
              <p className="text-xs text-slate-500">Control spending before it overflows</p>
            </div>
            <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-semibold">
              Active Budgets
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mt-2">
            {data.budgets.map((budget) => {
              const spent = categoryTotals[budget.category] || 0;
              const percent = Math.min(Math.round((spent / budget.limit) * 100), 100);
              const isOver = spent > budget.limit;
              const isNear = percent >= 80 && !isOver;

              return (
                <div key={budget.category} className="p-3 rounded-lg bg-white/70 backdrop-blur-md border border-[#BDD8E9]/70 shadow-xs">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-800">{budget.category}</span>
                    <span className={`text-[11px] font-bold ${
                      isOver ? 'text-rose-600' : isNear ? 'text-amber-600' : 'text-slate-600'
                    }`}>
                      {formatINR(spent)} / {formatINR(budget.limit)}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${
                        isOver ? 'bg-rose-500' : isNear ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                    <span>{percent}% used</span>
                    {isOver && (
                      <span className="text-rose-600 font-bold flex items-center gap-0.5">
                        <AlertTriangle className="h-3 w-3" /> Over budget!
                      </span>
                    )}
                    {isNear && (
                      <span className="text-amber-600 font-bold">Caution (80%+)</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Transactions Table Section with Comprehensive Filters */}
      <div className="rounded-xl glass-panel p-4 sm:p-5">
        
        {/* Header & Main Search Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search kharcha, bank, UPI, note..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Actions & Filter Toggle */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                showAdvancedFilters || activeFilterCount > 0
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-emerald-600 text-white rounded-full text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Paste SMS Quick Button */}
            {onOpenSmsParser && (
              <button
                onClick={onOpenSmsParser}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition whitespace-nowrap shadow-xs"
              >
                <span>⚡ Paste SMS</span>
              </button>
            )}

            {/* Add Button */}
            <button
              onClick={() => onOpenAddModal('transaction')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span>Record New</span>
            </button>
          </div>
        </div>

        {/* Primary Filter Strip (Type, Date Range, Category) */}
        <div className="flex flex-wrap items-center gap-2 pb-3 mb-3 border-b border-slate-100 text-xs">
          {/* Type Filter */}
          <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-2.5 py-1 rounded-md transition ${typeFilter === 'all' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600'}`}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`px-2.5 py-1 rounded-md transition ${typeFilter === 'expense' ? 'bg-rose-600 text-white font-bold' : 'text-slate-600'}`}
            >
              Kharcha
            </button>
            <button
              onClick={() => setTypeFilter('income')}
              className={`px-2.5 py-1 rounded-md transition ${typeFilter === 'income' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600'}`}
            >
              Income
            </button>
          </div>

          {/* Date Range Quick Filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1">
            <Calendar className="h-3.5 w-3.5 text-slate-400 ml-1.5" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRangeFilter)}
              className="bg-transparent text-xs text-slate-700 pr-2 py-0.5 focus:outline-none font-medium cursor-pointer"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="custom">Custom Range...</option>
            </select>
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          >
            <option value="all">All Categories</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Sort By Filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1 ml-auto">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 ml-1.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-xs text-slate-700 pr-2 py-0.5 focus:outline-none font-medium cursor-pointer"
            >
              <option value="date_desc">Latest First (Date ↓)</option>
              <option value="date_asc">Oldest First (Date ↑)</option>
              <option value="amount_desc">Highest Amount (₹ ↓)</option>
              <option value="amount_asc">Lowest Amount (₹ ↑)</option>
            </select>
          </div>

          {/* Reset Filters button if any active */}
          {activeFilterCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 px-2.5 py-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-dashed border-slate-200 transition text-[11px]"
            >
              <X className="h-3 w-3" />
              <span>Clear ({activeFilterCount})</span>
            </button>
          )}
        </div>

        {/* Collapsible Advanced Filters Drawer */}
        {showAdvancedFilters && (
          <div className="p-3 mb-4 rounded-xl bg-slate-50/80 border border-slate-200/90 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
            {/* Account / Bank Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Bank / Account
              </label>
              <select
                value={accountFilter}
                onChange={(e) => setAccountFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Accounts</option>
                {data.accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.accountType})</option>
                ))}
              </select>
            </div>

            {/* Payment Mode Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Payment Mode
              </label>
              <select
                value={paymentModeFilter}
                onChange={(e) => setPaymentModeFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Modes</option>
                {allPaymentModes.map((mode) => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
            </div>

            {/* Min Amount */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Min Amount (₹)
              </label>
              <input
                type="number"
                placeholder="0"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Max Amount */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Max Amount (₹)
              </label>
              <input
                type="number"
                placeholder="e.g. 50000"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Custom Date Inputs if custom range selected */}
            {dateRange === 'custom' && (
              <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">From Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">To Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filter Summary Badge Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 mb-3 px-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span>Showing <strong className="text-slate-900 font-bold">{filteredTransactions.length}</strong> of {data.transactions.length} entries</span>
            {filteredTransactions.length < data.transactions.length && (
              <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                Filtered view
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs flex-wrap">
            {filteredExpenseAmount > 0 && (
              <span>Kharcha: <strong className="text-rose-600 font-bold">{formatINR(filteredExpenseAmount)}</strong></span>
            )}
            {filteredIncomeAmount > 0 && (
              <span>Income: <strong className="text-emerald-600 font-bold">{formatINR(filteredIncomeAmount)}</strong></span>
            )}
          </div>
        </div>

        {/* Empty State */}
        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 rounded-xl bg-white/40 border border-dashed border-slate-200">
            <p className="font-semibold text-slate-600 mb-1">No transactions match your filters.</p>
            <p className="text-xs text-slate-400 mb-3">Try clearing filters or changing search keywords.</p>
            {activeFilterCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Cards View (< 768px) */}
            <div className="md:hidden space-y-2.5">
              {filteredTransactions.map((tx) => (
                <div 
                  key={tx.id} 
                  className="p-3.5 rounded-xl bg-white/70 border border-slate-200/80 shadow-xs flex items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-2 rounded-xl shrink-0 ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {tx.type === 'income' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 truncate">{tx.description}</div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5 flex-wrap">
                        <span>{formatDate(tx.date)}</span>
                        <span>•</span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-medium">{tx.category}</span>
                        {tx.accountId && accountMap.get(tx.accountId) && (
                          <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-100 font-medium truncate max-w-[100px]">
                            {accountMap.get(tx.accountId)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className={`text-right font-extrabold text-xs sm:text-sm whitespace-nowrap ${
                      tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}{formatINR(tx.amount, false, privacyMode)}
                    </div>
                    <button
                      onClick={() => onDeleteTransaction(tx.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Delete transaction"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400 bg-slate-50/50">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Account / Bank</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Mode</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition group">
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {formatDate(tx.date)}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          {tx.type === 'income' ? (
                            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <ArrowDownRight className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                          )}
                          <span>{tx.description}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {tx.accountId && accountMap.get(tx.accountId) ? (
                          <span className="text-[11px] text-blue-700 font-medium bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                            {accountMap.get(tx.accountId)}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                          {tx.category}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-slate-500 text-[11px]">{tx.paymentMode}</span>
                      </td>
                      <td className={`py-3 px-3 text-right font-bold whitespace-nowrap ${
                        tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
                      }`}>
                        {tx.type === 'income' ? '+' : '-'}{formatINR(tx.amount, false, privacyMode)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete transaction"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

      </div>
      </>
      )}

    </div>
  );
};
