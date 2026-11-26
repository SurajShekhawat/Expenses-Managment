'use client';

import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  ArrowDownRight, 
  ArrowUpRight, 
  Plus, 
  Trash2, 
  Wallet, 
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { FinancialData, Transaction } from '@/types/finance';
import { formatINR, formatDate, getTodayDateString } from '@/lib/formatters';

interface ExpenseCalendarProps {
  data: FinancialData;
  onOpenAddModal: (type: 'transaction') => void;
  onDeleteTransaction: (id: string) => void;
  privacyMode?: boolean;
}

export const ExpenseCalendar: React.FC<ExpenseCalendarProps> = ({
  data,
  onOpenAddModal,
  onDeleteTransaction,
  privacyMode = false,
}) => {
  const todayStr = getTodayDateString();
  const todayDate = new Date();

  // Current view month & year (0-indexed month)
  const [currentYear, setCurrentYear] = useState<number>(todayDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(todayDate.getMonth());
  
  // Selected date for day inspector (format YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Map transactions by YYYY-MM-DD
  const transactionsByDate = useMemo(() => {
    const map: Record<string, { transactions: Transaction[]; totalExpense: number; totalIncome: number }> = {};
    
    data.transactions.forEach((tx) => {
      const dateKey = tx.date; // format YYYY-MM-DD
      if (!map[dateKey]) {
        map[dateKey] = { transactions: [], totalExpense: 0, totalIncome: 0 };
      }
      map[dateKey].transactions.push(tx);
      if (tx.type === 'expense') {
        map[dateKey].totalExpense += tx.amount;
      } else if (tx.type === 'income') {
        map[dateKey].totalIncome += tx.amount;
      }
    });

    return map;
  }, [data.transactions]);

  // Account name lookup map
  const accountMap = useMemo(() => {
    return new Map(data.accounts.map((a) => [a.id, a.name]));
  }, [data.accounts]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleJumpToToday = () => {
    setCurrentMonth(todayDate.getMonth());
    setCurrentYear(todayDate.getFullYear());
    setSelectedDate(todayStr);
  };

  // Calendar matrix calculation for currentYear & currentMonth
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    const totalDays = lastDayOfMonth.getDate();
    
    // First day index (Monday = 0, Sunday = 6)
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    // Previous month filler days
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    const prevDays: { dayNum: number; dateStr: string; isCurrentMonth: boolean }[] = [];
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const m = currentMonth === 0 ? 12 : currentMonth;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      prevDays.push({ dayNum: d, dateStr, isCurrentMonth: false });
    }

    // Current month days
    const currentDays: { dayNum: number; dateStr: string; isCurrentMonth: boolean }[] = [];
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      currentDays.push({ dayNum: d, dateStr, isCurrentMonth: true });
    }

    // Next month filler days to complete 35 or 42 slots (grid of 7)
    const totalFilled = prevDays.length + currentDays.length;
    const remaining = totalFilled <= 35 ? 35 - totalFilled : 42 - totalFilled;
    const nextDays: { dayNum: number; dateStr: string; isCurrentMonth: boolean }[] = [];
    for (let d = 1; d <= remaining; d++) {
      const m = currentMonth === 11 ? 1 : currentMonth + 2;
      const y = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      nextDays.push({ dayNum: d, dateStr, isCurrentMonth: false });
    }

    return [...prevDays, ...currentDays, ...nextDays];
  }, [currentYear, currentMonth]);

  // Monthly aggregated statistics
  const monthStats = useMemo(() => {
    let totalExpense = 0;
    let totalIncome = 0;
    let daysWithExpense = 0;
    let maxExpenseDay = { date: '', amount: 0 };

    calendarDays.forEach((slot) => {
      if (slot.isCurrentMonth) {
        const entry = transactionsByDate[slot.dateStr];
        if (entry) {
          totalExpense += entry.totalExpense;
          totalIncome += entry.totalIncome;
          if (entry.totalExpense > 0) {
            daysWithExpense++;
            if (entry.totalExpense > maxExpenseDay.amount) {
              maxExpenseDay = { date: slot.dateStr, amount: entry.totalExpense };
            }
          }
        }
      }
    });

    const daysCount = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dailyAvg = daysCount > 0 ? Math.round(totalExpense / daysCount) : 0;

    return {
      totalExpense,
      totalIncome,
      daysWithExpense,
      dailyAvg,
      maxExpenseDay,
    };
  }, [calendarDays, transactionsByDate, currentYear, currentMonth]);

  // Selected date data
  const selectedDayData = transactionsByDate[selectedDate] || {
    transactions: [],
    totalExpense: 0,
    totalIncome: 0,
  };

  return (
    <div className="space-y-6">
      
      {/* Calendar Card Container */}
      <div className="rounded-2xl glass-panel p-4 sm:p-6 border border-[#BDD8E9] shadow-xs">
        
        {/* Month Navigation & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#BDD8E9]/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#0A4174] text-[#BDD8E9] shadow-xs">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#001D39] tracking-tight">
                {monthNames[currentMonth]} {currentYear}
              </h2>
              <p className="text-xs text-[#49769F] font-medium">
                Tareekh-wise Kharcha & Daily Spending Tracker
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleJumpToToday}
              className="px-3 py-1.5 rounded-xl bg-[#BDD8E9]/40 hover:bg-[#BDD8E9] text-[#001D39] font-bold text-xs border border-[#7BBDE8]/60 transition active:scale-95"
            >
              Today
            </button>
            <div className="flex items-center rounded-xl border border-[#BDD8E9] bg-white p-0.5 shadow-xs">
              <button
                onClick={handlePrevMonth}
                aria-label="Previous Month"
                className="p-1.5 rounded-lg text-[#001D39] hover:bg-[#BDD8E9]/30 transition active:scale-90"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNextMonth}
                aria-label="Next Month"
                className="p-1.5 rounded-lg text-[#001D39] hover:bg-[#BDD8E9]/30 transition active:scale-90"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Month Summary Snapshot Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 my-4">
          <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-100 shadow-xs">
            <span className="text-[10px] sm:text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
              Month Kharcha
            </span>
            <span className="text-base sm:text-xl font-extrabold text-[#001D39] mt-0.5 block truncate">
              {formatINR(monthStats.totalExpense, false, privacyMode)}
            </span>
            <span className="text-[9px] sm:text-[10px] text-rose-700 font-medium">
              Across {monthStats.daysWithExpense} active days
            </span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-100 shadow-xs">
            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
              Month Income
            </span>
            <span className="text-base sm:text-xl font-extrabold text-[#001D39] mt-0.5 block truncate">
              {formatINR(monthStats.totalIncome, false, privacyMode)}
            </span>
            <span className="text-[9px] sm:text-[10px] text-emerald-700 font-medium">
              Total Inflow received
            </span>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-100 shadow-xs">
            <span className="text-[10px] sm:text-[11px] font-bold text-blue-800 uppercase tracking-wider block">
              Daily Average
            </span>
            <span className="text-base sm:text-xl font-extrabold text-[#001D39] mt-0.5 block truncate">
              {formatINR(monthStats.dailyAvg, false, privacyMode)}
            </span>
            <span className="text-[9px] sm:text-[10px] text-blue-700 font-medium">
              Average spend / day
            </span>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-100 shadow-xs">
            <span className="text-[10px] sm:text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
              Highest Spend Day
            </span>
            <span className="text-base sm:text-xl font-extrabold text-[#001D39] mt-0.5 block truncate">
              {monthStats.maxExpenseDay.amount > 0 ? formatINR(monthStats.maxExpenseDay.amount, true, privacyMode) : '₹0'}
            </span>
            <span className="text-[9px] sm:text-[10px] text-amber-700 font-medium truncate block">
              {monthStats.maxExpenseDay.date ? formatDate(monthStats.maxExpenseDay.date) : 'No high spend'}
            </span>
          </div>
        </div>

        {/* Calendar Day Header (Mon..Sun) */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] sm:text-xs text-[#49769F] mb-1.5 py-1 uppercase tracking-wider">
          {weekDayLabels.map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid Cells */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {calendarDays.map((slot) => {
            const isToday = slot.dateStr === todayStr;
            const isSelected = slot.dateStr === selectedDate;
            const dayData = transactionsByDate[slot.dateStr];
            const hasExpense = dayData && dayData.totalExpense > 0;
            const hasIncome = dayData && dayData.totalIncome > 0;

            return (
              <button
                key={slot.dateStr}
                onClick={() => setSelectedDate(slot.dateStr)}
                className={`relative min-h-[58px] sm:min-h-[76px] p-1 sm:p-2 rounded-xl text-left flex flex-col justify-between transition-all duration-150 active:scale-95 ${
                  !slot.isCurrentMonth
                    ? 'opacity-35 bg-slate-100/50 text-slate-400 border border-transparent'
                    : isSelected
                    ? 'bg-[#0A4174] text-white shadow-md ring-2 ring-[#0A4174] ring-offset-1'
                    : isToday
                    ? 'bg-[#BDD8E9]/40 border-2 border-[#0A4174] text-[#001D39] hover:bg-[#BDD8E9]/60'
                    : hasExpense
                    ? 'bg-rose-50/50 hover:bg-rose-50 border border-rose-200/70 text-[#001D39]'
                    : 'bg-white/70 hover:bg-white border border-[#BDD8E9]/60 text-[#001D39]'
                }`}
              >
                {/* Top Row: Day Number & Income Dot */}
                <div className="flex items-center justify-between w-full">
                  <span className={`text-[11px] sm:text-xs font-black ${
                    isSelected ? 'text-white' : isToday ? 'text-[#0A4174]' : 'text-slate-700'
                  }`}>
                    {slot.dayNum}
                  </span>
                  
                  {hasIncome && (
                    <span 
                      title={`Income: ₹${dayData.totalIncome}`}
                      className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${isSelected ? 'bg-emerald-300' : 'bg-emerald-500'}`} 
                    />
                  )}
                </div>

                {/* Bottom Row: Expense Amount */}
                <div className="w-full truncate text-right">
                  {hasExpense ? (
                    <span className={`text-[10px] sm:text-xs font-black block truncate ${
                      isSelected ? 'text-rose-200' : 'text-rose-600'
                    }`}>
                      {privacyMode ? '••••' : `₹${dayData.totalExpense >= 1000 ? `${(dayData.totalExpense / 1000).toFixed(1)}k` : dayData.totalExpense}`}
                    </span>
                  ) : hasIncome ? (
                    <span className={`text-[9px] sm:text-[10px] font-bold block truncate ${
                      isSelected ? 'text-emerald-200' : 'text-emerald-600'
                    }`}>
                      +{privacyMode ? '••' : `₹${dayData.totalIncome >= 1000 ? `${(dayData.totalIncome / 1000).toFixed(1)}k` : dayData.totalIncome}`}
                    </span>
                  ) : (
                    <span className="text-[9px] text-slate-300 block select-none">-</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-3 mt-4 border-t border-[#BDD8E9]/60 text-[11px] text-[#49769F]">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Kharcha (Expense)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Income Received</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-[#0A4174] bg-[#BDD8E9]/40" />
              <span>Aaj (Today)</span>
            </div>
          </div>
          <span className="font-semibold text-slate-500">
            Click any tareekh to view details
          </span>
        </div>

      </div>

      {/* Selected Date Inspector: Detailed Transaction Breakdown */}
      <div className="rounded-2xl glass-panel p-4 sm:p-6 border border-[#BDD8E9] shadow-xs space-y-4">
        
        {/* Day Inspector Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#BDD8E9]/60">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#0A4174]" />
              <h3 className="text-base sm:text-lg font-extrabold text-[#001D39]">
                {formatDate(selectedDate)} ka Hisaab
              </h3>
              {selectedDate === todayStr && (
                <span className="px-2 py-0.5 rounded-md bg-[#BDD8E9] text-[#001D39] text-[10px] font-extrabold uppercase">
                  Aaj
                </span>
              )}
            </div>
            <p className="text-xs text-[#49769F] mt-0.5">
              {selectedDayData.transactions.length} transaction(s) recorded on this date
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">Total Kharcha</span>
              <span className="text-base sm:text-lg font-black text-rose-600 block">
                {formatINR(selectedDayData.totalExpense, false, privacyMode)}
              </span>
            </div>
            {selectedDayData.totalIncome > 0 && (
              <div className="text-right pl-3 border-l border-[#BDD8E9]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Total Income</span>
                <span className="text-base sm:text-lg font-black text-emerald-600 block">
                  +{formatINR(selectedDayData.totalIncome, false, privacyMode)}
                </span>
              </div>
            )}
            <button
              onClick={() => onOpenAddModal('transaction')}
              className="ml-2 px-3 py-1.5 rounded-xl bg-[#0A4174] hover:bg-[#001D39] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95"
            >
              <Plus className="h-3.5 w-3.5 text-[#BDD8E9]" />
              <span>+ Add Entry</span>
            </button>
          </div>
        </div>

        {/* Transactions List on Selected Date */}
        {selectedDayData.transactions.length === 0 ? (
          <div className="py-8 text-center text-slate-400 bg-white/40 rounded-xl border border-dashed border-[#BDD8E9]">
            <p className="text-xs font-semibold text-slate-600 mb-1">
              {formatDate(selectedDate)} ko koi kharcha ya income record nahi hai.
            </p>
            <p className="text-[11px] text-slate-400 mb-3">
              Agar aapne is tareekh ko koi kharcha kiya tha, toh abhi record karein:
            </p>
            <button
              onClick={() => onOpenAddModal('transaction')}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition active:scale-95"
            >
              + Record Kharcha for this Date
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#BDD8E9]/50">
            {selectedDayData.transactions.map((tx) => (
              <div 
                key={tx.id} 
                className="py-3 flex items-center justify-between gap-3 hover:bg-white/40 px-2 rounded-xl transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {tx.type === 'income' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-[#001D39] truncate">
                      {tx.description}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5 flex-wrap">
                      <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-medium">
                        {tx.category}
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-slate-600">{tx.paymentMode}</span>
                      {tx.accountId && accountMap.get(tx.accountId) && (
                        <>
                          <span>•</span>
                          <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-medium truncate max-w-[120px]">
                            {accountMap.get(tx.accountId)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-sm sm:text-base font-extrabold whitespace-nowrap ${
                    tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
                  }`}>
                    {tx.type === 'income' ? '+' : '-'}{formatINR(tx.amount, false, privacyMode)}
                  </span>
                  <button
                    onClick={() => onDeleteTransaction(tx.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition active:scale-90"
                    title="Delete Entry"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
};
