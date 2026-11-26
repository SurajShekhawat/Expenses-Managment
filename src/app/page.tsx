'use client';

import React, { useState, useEffect } from 'react';
import { 
  FinancialData, 
  FinancialAccount,
  Transaction, 
  Investment, 
  LoanLiability, 
  FinancialGoal,
  Subscription,
  InsurancePolicy
} from '@/types/finance';
import { 
  loadFinancialData, 
  saveFinancialData, 
  resetToDemoData, 
  exportDataAsJSON,
  INITIAL_DEMO_DATA 
} from '@/lib/storage';
import { 
  fetchRemoteFinancialData, 
  syncFullDataToRemote, 
  apiResetDemo 
} from '@/lib/apiClient';
import { Navbar, NavTabType } from '@/components/Navbar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { PWAInstallBanner } from '@/components/PWAInstallBanner';
import { DashboardTab } from '@/components/tabs/DashboardTab';
import { AccountsTab } from '@/components/tabs/AccountsTab';
import { ExpensesTab } from '@/components/tabs/ExpensesTab';
import { InvestmentsTab } from '@/components/tabs/InvestmentsTab';
import { LoansTab } from '@/components/tabs/LoansTab';
import { SubscriptionsTab } from '@/components/tabs/SubscriptionsTab';
import { InsuranceTaxTab } from '@/components/tabs/InsuranceTaxTab';
import { FireGoalsTab } from '@/components/tabs/FireGoalsTab';
import { AddTransactionModal } from '@/components/modals/AddTransactionModal';
import { AddAccountModal } from '@/components/modals/AddAccountModal';
import { AddInvestmentModal } from '@/components/modals/AddInvestmentModal';
import { AddLoanModal } from '@/components/modals/AddLoanModal';
import { SMSParserModal } from '@/components/modals/SMSParserModal';
import { VoiceExpenseModal } from '@/components/modals/VoiceExpenseModal';
import { CSVImportModal } from '@/components/modals/CSVImportModal';
import { AppLockModal } from '@/components/modals/AppLockModal';
import { GroupSplitModal } from '@/components/modals/GroupSplitModal';
import { getDueRecurringItems } from '@/lib/recurringEngine';
import { printMonthlyFinancialReport } from '@/lib/reportGenerator';
import { getTodayDateString } from '@/lib/formatters';
import { Plus, Receipt, Landmark, TrendingUp, Building2, X, Sparkles, Mic, FileSpreadsheet } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Home() {
  const [data, setData] = useState<FinancialData>(INITIAL_DEMO_DATA);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTabType>('overview');
  const [addModalType, setAddModalType] = useState<'transaction' | 'investment' | 'loan' | 'account' | null>(null);
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isGroupSplitOpen, setIsGroupSplitOpen] = useState(false);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [isAppLocked, setIsAppLocked] = useState(false);
  const [isLockSettingsOpen, setIsLockSettingsOpen] = useState(false);
  const [showMobileFabMenu, setShowMobileFabMenu] = useState(false);
  const [dbSource, setDbSource] = useState<'mysql' | 'local'>('mysql');

  // Load from MySQL (or local storage fallback) on client mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        const res = await fetchRemoteFinancialData();
        setData(res.data);
        setDbSource(res.source);
      } catch (e) {
        console.warn('Initial remote load failed, using local demo data', e);
      } finally {
        setIsLoaded(true);
      }
    }

    loadInitialData();

    if (typeof window !== 'undefined') {
      const savedPrivacy = localStorage.getItem('fingroww_privacy_mode');
      if (savedPrivacy === 'true') {
        setIsPrivacyMode(true);
      }
      const existingPin = localStorage.getItem('fingroww_security_pin');
      if (existingPin) {
        setIsAppLocked(true);
      }
    }
  }, []);

  const updateData = (newData: FinancialData) => {
    setData(newData);
    syncFullDataToRemote(newData);
  };

  const handleTogglePrivacyMode = () => {
    setIsPrivacyMode((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('fingroww_privacy_mode', String(next));
      }
      return next;
    });
  };

  const handleBulkAddTransactions = (
    newTxs: Omit<Transaction, 'id'>[],
    targetAccountId: string
  ) => {
    let netExpense = 0;
    let netIncome = 0;

    const formattedTxs: Transaction[] = newTxs.map((t, idx) => {
      if (t.type === 'expense') netExpense += t.amount;
      else if (t.type === 'income') netIncome += t.amount;

      return {
        ...t,
        id: `tx-bulk-${Date.now()}-${idx}`,
      };
    });

    const updatedAccounts = data.accounts.map((acc) => {
      if (acc.id === targetAccountId) {
        if (acc.accountType === 'credit_card') {
          return {
            ...acc,
            balance: Math.max(0, acc.balance + netExpense - netIncome),
          };
        } else {
          return {
            ...acc,
            balance: acc.balance + netIncome - netExpense,
          };
        }
      }
      return acc;
    });

    const updated: FinancialData = {
      ...data,
      transactions: [...formattedTxs, ...data.transactions],
      accounts: updatedAccounts,
    };

    updateData(updated);

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }
  };

  // --- Handlers ---
  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const tx: Transaction = {
      ...newTx,
      id: `tx-${Date.now()}`,
    };

    let updatedAccounts = [...data.accounts];
    if (newTx.accountId) {
      updatedAccounts = updatedAccounts.map((acc) => {
        if (acc.id === newTx.accountId) {
          if (acc.accountType === 'credit_card') {
            return {
              ...acc,
              balance: newTx.type === 'expense' ? acc.balance + newTx.amount : Math.max(0, acc.balance - newTx.amount),
            };
          } else {
            return {
              ...acc,
              balance: newTx.type === 'income' ? acc.balance + newTx.amount : acc.balance - newTx.amount,
            };
          }
        }
        return acc;
      });
    }

    const updated = {
      ...data,
      accounts: updatedAccounts,
      transactions: [tx, ...data.transactions],
    };
    updateData(updated);
  };

  const handleDeleteTransaction = (id: string) => {
    const updated = {
      ...data,
      transactions: data.transactions.filter((t) => t.id !== id),
    };
    updateData(updated);
  };

  // --- Account Handlers ---
  const handleAddAccount = (newAcc: Omit<FinancialAccount, 'id'>) => {
    const account: FinancialAccount = {
      ...newAcc,
      id: `acc-${Date.now()}`,
    };
    const updated = {
      ...data,
      accounts: [...data.accounts, account],
    };
    updateData(updated);
  };

  const handleUpdateAccountBalance = (accountId: string, newBalance: number) => {
    const updated = {
      ...data,
      accounts: data.accounts.map((a) => (a.id === accountId ? { ...a, balance: newBalance } : a)),
    };
    updateData(updated);
  };

  const handleDeleteAccount = (accountId: string) => {
    if (confirm('Kya aap is account ko remove karna chahte hain?')) {
      const updated = {
        ...data,
        accounts: data.accounts.filter((a) => a.id !== accountId),
      };
      updateData(updated);
    }
  };

  const handleTransferFunds = (fromAccountId: string, toAccountId: string, amount: number, note: string) => {
    const fromAcc = data.accounts.find((a) => a.id === fromAccountId);
    const toAcc = data.accounts.find((a) => a.id === toAccountId);
    if (!fromAcc || !toAcc) return;

    const updatedAccounts = data.accounts.map((a) => {
      if (a.id === fromAccountId) {
        return { ...a, balance: a.balance - amount };
      }
      if (a.id === toAccountId) {
        return { ...a, balance: a.balance + amount };
      }
      return a;
    });

    const transferTx: Transaction = {
      id: `tx-${Date.now()}`,
      date: getTodayDateString(),
      amount,
      type: 'transfer',
      category: 'Account Transfer',
      paymentMode: 'NetBanking',
      accountId: fromAccountId,
      toAccountId,
      description: `${note || 'Fund Transfer'} (${fromAcc.name} → ${toAcc.name})`,
    };

    const updated = {
      ...data,
      accounts: updatedAccounts,
      transactions: [transferTx, ...data.transactions],
    };
    updateData(updated);
  };

  // --- Investment Handlers ---
  const handleAddInvestment = (newInv: Omit<Investment, 'id' | 'lastUpdated'>) => {
    const inv: Investment = {
      ...newInv,
      id: `inv-${Date.now()}`,
      lastUpdated: getTodayDateString(),
    };
    const updated = {
      ...data,
      investments: [inv, ...data.investments],
    };
    updateData(updated);
  };

  const handleDeleteInvestment = (id: string) => {
    const updated = {
      ...data,
      investments: data.investments.filter((i) => i.id !== id),
    };
    updateData(updated);
  };

  const handleUpdateInvestment = (updatedInv: Investment) => {
    const updated = {
      ...data,
      investments: data.investments.map((i) => (i.id === updatedInv.id ? updatedInv : i)),
    };
    updateData(updated);
  };

  // --- Loan Handlers ---
  const handleAddLoan = (newLoan: Omit<LoanLiability, 'id'>) => {
    const loan: LoanLiability = {
      ...newLoan,
      id: `loan-${Date.now()}`,
    };
    const updated = {
      ...data,
      loans: [loan, ...data.loans],
    };
    updateData(updated);
  };

  const handleUpdateLoan = (updatedLoan: LoanLiability) => {
    const updated = {
      ...data,
      loans: data.loans.map((l) => (l.id === updatedLoan.id ? updatedLoan : l)),
    };
    updateData(updated);
  };

  const handleDeleteLoan = (id: string) => {
    const updated = {
      ...data,
      loans: data.loans.filter((l) => l.id !== id),
    };
    updateData(updated);
  };

  const handlePayEmi = (loanId: string, emiAmount: number) => {
    const loan = data.loans.find((l) => l.id === loanId);
    if (!loan) return;

    const updatedLoans = data.loans.map((l) => {
      if (l.id === loanId) {
        return {
          ...l,
          remainingBalance: Math.max(0, l.remainingBalance - emiAmount),
        };
      }
      return l;
    });

    const primaryAccount = data.accounts.find((a) => a.isPrimary) || data.accounts[0];
    let updatedAccounts = [...data.accounts];
    if (primaryAccount) {
      updatedAccounts = updatedAccounts.map((a) => 
        a.id === primaryAccount.id ? { ...a, balance: a.balance - emiAmount } : a
      );
    }

    const emiTx: Transaction = {
      id: `tx-${Date.now()}`,
      date: getTodayDateString(),
      amount: emiAmount,
      type: 'expense',
      category: 'EMI & Debt Payment',
      paymentMode: 'NetBanking',
      accountId: primaryAccount?.id,
      description: `EMI Payment for ${loan.title}`,
    };

    const updated = {
      ...data,
      loans: updatedLoans,
      accounts: updatedAccounts,
      transactions: [emiTx, ...data.transactions],
    };
    updateData(updated);
  };

  // --- Subscription Handlers ---
  const handleAddSubscription = (newSub: Omit<Subscription, 'id'>) => {
    const sub: Subscription = {
      ...newSub,
      id: `sub-${Date.now()}`,
    };
    const updated = {
      ...data,
      subscriptions: [sub, ...data.subscriptions],
    };
    updateData(updated);
  };

  const handleDeleteSubscription = (id: string) => {
    const updated = {
      ...data,
      subscriptions: data.subscriptions.filter((s) => s.id !== id),
    };
    updateData(updated);
  };

  const handleUpdateSubscription = (updatedSub: Subscription) => {
    const updated = {
      ...data,
      subscriptions: data.subscriptions.map((s) => (s.id === updatedSub.id ? updatedSub : s)),
    };
    updateData(updated);
  };

  // --- Insurance Handlers ---
  const handleAddInsurance = (newIns: Omit<InsurancePolicy, 'id'>) => {
    const ins: InsurancePolicy = {
      ...newIns,
      id: `ins-${Date.now()}`,
    };
    const updated = {
      ...data,
      insurances: [ins, ...data.insurances],
    };
    updateData(updated);
  };

  const handleUpdateInsurance = (updatedIns: InsurancePolicy) => {
    const updated = {
      ...data,
      insurances: data.insurances.map((i) => (i.id === updatedIns.id ? updatedIns : i)),
    };
    updateData(updated);
  };

  const handleDeleteInsurance = (id: string) => {
    const updated = {
      ...data,
      insurances: data.insurances.filter((i) => i.id !== id),
    };
    updateData(updated);
  };

  // --- Goal Handlers ---
  const handleAddGoal = (newGoal: Omit<FinancialGoal, 'id'>) => {
    const goal: FinancialGoal = {
      ...newGoal,
      id: `goal-${Date.now()}`,
    };
    const updated = {
      ...data,
      goals: [...data.goals, goal],
    };
    updateData(updated);
  };

  const handleUpdateGoalAmount = (goalId: string, delta: number) => {
    const updatedGoals = data.goals.map((g) => {
      if (g.id === goalId) {
        return {
          ...g,
          currentAmount: Math.min(g.targetAmount, g.currentAmount + delta),
        };
      }
      return g;
    });
    const updated = {
      ...data,
      goals: updatedGoals,
    };
    updateData(updated);
  };

  const handleDeleteGoal = (goalId: string) => {
    const updated = {
      ...data,
      goals: data.goals.filter((g) => g.id !== goalId),
    };
    updateData(updated);
  };

  // --- Group Bill Split Handler ---
  const handleConfirmGroupSplit = (splitData: {
    description: string;
    totalAmount: number;
    myShare: number;
    accountId?: string;
    participants: { name: string; amountOwed: number }[];
  }) => {
    const today = getTodayDateString();
    
    // 1. Record user's actual share as an Expense
    const myExpenseTx: Transaction = {
      id: `tx-split-${Date.now()}`,
      date: today,
      amount: splitData.myShare,
      type: 'expense',
      category: 'Food & Dining',
      paymentMode: 'UPI',
      accountId: splitData.accountId,
      description: `${splitData.description} (My Share: ₹${splitData.myShare} of ₹${splitData.totalAmount})`,
    };

    // 2. Record each friend's share into Loans/Udhaari ('they_owe_me')
    const newLoans: LoanLiability[] = splitData.participants.map((p, idx) => ({
      id: `loan-split-${Date.now()}-${idx}`,
      title: `${splitData.description} Share`,
      lenderOrBorrower: p.name,
      loanType: 'peer_debt',
      direction: 'they_owe_me',
      principalAmount: p.amountOwed,
      remainingBalance: p.amountOwed,
      interestRate: 0,
      monthlyEmi: 0,
      startDate: today,
      tenureMonths: 1,
      notes: `Split from total bill of ₹${splitData.totalAmount}`,
    }));

    // 3. Deduct total bill from user's account
    const updatedAccounts = data.accounts.map((acc) => {
      if (acc.id === splitData.accountId) {
        if (acc.accountType === 'credit_card') {
          return { ...acc, balance: acc.balance + splitData.totalAmount };
        } else {
          return { ...acc, balance: acc.balance - splitData.totalAmount };
        }
      }
      return acc;
    });

    const updated = {
      ...data,
      accounts: updatedAccounts,
      transactions: [myExpenseTx, ...data.transactions],
      loans: [...newLoans, ...data.loans],
    };

    updateData(updated);
    confetti({ particleCount: 40, spread: 60 });
  };

  // --- Auto-Process Due Recurring Bills Handler ---
  const handleProcessDueItem = (item: any) => {
    const today = getTodayDateString();
    const newTx: Transaction = {
      id: `tx-rec-${Date.now()}`,
      date: today,
      amount: item.amount,
      type: 'expense',
      category: item.category,
      paymentMode: 'Auto-Debit',
      accountId: item.accountId,
      description: `Auto-Debit: ${item.title}`,
      isRecurring: true,
    };

    const updatedAccounts = data.accounts.map((acc) => {
      if (acc.id === item.accountId) {
        if (acc.accountType === 'credit_card') {
          return { ...acc, balance: acc.balance + item.amount };
        } else {
          return { ...acc, balance: Math.max(0, acc.balance - item.amount) };
        }
      }
      return acc;
    });

    const updated = {
      ...data,
      accounts: updatedAccounts,
      transactions: [newTx, ...data.transactions],
    };

    updateData(updated);
    alert(`✅ Successfully recorded: ${item.title} (₹${item.amount})`);
  };

  const handleReset = async () => {
    if (confirm('Kya aap saare data ko default demo data par reset karna chahte hain?')) {
      const resetData = resetToDemoData();
      setData(resetData);
      await apiResetDemo();
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-semibold">FinGroww Loading Command Center...</p>
        </div>
      </div>
    );
  }

  const liquidAccounts = data.accounts.filter((a) => a.accountType !== 'credit_card');
  const totalLiquidCash = liquidAccounts.reduce((acc, a) => acc + a.balance, 0);
  const totalCurrentInvestments = data.investments.reduce((acc, inv) => acc + inv.currentValue, 0);
  const totalDebtOutstanding = data.loans
    .filter((l) => l.direction === 'i_owe')
    .reduce((acc, l) => acc + l.remainingBalance, 0);
  const totalReceivables = data.loans
    .filter((l) => l.direction === 'they_owe_me')
    .reduce((acc, l) => acc + l.remainingBalance, 0);

  const netWorth = totalLiquidCash + totalCurrentInvestments + totalReceivables - totalDebtOutstanding;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans relative">
      
      {/* PWA Install Banner */}
      <PWAInstallBanner />

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        netWorth={netWorth}
        totalLiquidCash={totalLiquidCash}
        dbSource={dbSource}
        onOpenAddModal={(type) => setAddModalType(type)}
        onOpenSmsParser={() => setIsSmsModalOpen(true)}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
        onOpenCsvModal={() => setIsCsvModalOpen(true)}
        onOpenGroupSplit={() => setIsGroupSplitOpen(true)}
        onGenerateReport={() => printMonthlyFinancialReport(data)}
        isPrivacyMode={isPrivacyMode}
        onTogglePrivacyMode={handleTogglePrivacyMode}
        onLockApp={() => setIsAppLocked(true)}
        onExport={exportDataAsJSON}
        onReset={handleReset}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 md:pb-8">
        
        {/* Due Recurring Bills / Kist Notification Alert */}
        {getDueRecurringItems(data).length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-amber-900">
                  {getDueRecurringItems(data).length} Recurring Payment(s) Due This Month!
                </h3>
                <p className="text-[11px] text-amber-700">
                  Insurance premiums, SIPs, ya Subscriptions due hain. Auto-debit record karein:
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {getDueRecurringItems(data).slice(0, 2).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleProcessDueItem(item)}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-xs transition"
                >
                  Pay ₹{item.amount} ({item.sourceType.toUpperCase()})
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <DashboardTab
            data={data}
            onOpenAddModal={(type) => setAddModalType(type)}
            onSelectTab={setActiveTab}
            privacyMode={isPrivacyMode}
          />
        )}

        {activeTab === 'accounts' && (
          <AccountsTab
            data={data}
            onOpenAddModal={() => setAddModalType('account')}
            onUpdateAccountBalance={handleUpdateAccountBalance}
            onDeleteAccount={handleDeleteAccount}
            onTransferFunds={handleTransferFunds}
            privacyMode={isPrivacyMode}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesTab
            data={data}
            onOpenAddModal={(type) => setAddModalType(type)}
            onOpenSmsParser={() => setIsSmsModalOpen(true)}
            onDeleteTransaction={handleDeleteTransaction}
            privacyMode={isPrivacyMode}
          />
        )}

        {activeTab === 'investments' && (
          <InvestmentsTab
            data={data}
            onOpenAddModal={(type) => setAddModalType(type)}
            onDeleteInvestment={handleDeleteInvestment}
            onUpdateInvestment={handleUpdateInvestment}
          />
        )}

        {activeTab === 'loans' && (
          <LoansTab
            data={data}
            onOpenAddModal={(type) => setAddModalType(type)}
            onDeleteLoan={handleDeleteLoan}
            onPayEmi={handlePayEmi}
            onUpdateLoan={handleUpdateLoan}
          />
        )}

        {activeTab === 'subscriptions' && (
          <SubscriptionsTab
            data={data}
            onAddSubscription={handleAddSubscription}
            onDeleteSubscription={handleDeleteSubscription}
            onUpdateSubscription={handleUpdateSubscription}
          />
        )}

        {activeTab === 'insurance_tax' && (
          <InsuranceTaxTab
            data={data}
            onAddInsurance={handleAddInsurance}
            onDeleteInsurance={handleDeleteInsurance}
            onUpdateInsurance={handleUpdateInsurance}
          />
        )}

        {activeTab === 'fire_goals' && (
          <FireGoalsTab
            data={data}
            onAddGoal={handleAddGoal}
            onUpdateGoalAmount={handleUpdateGoalAmount}
            onDeleteGoal={handleDeleteGoal}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="hidden md:block border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        FinGroww • Aapka Personal Bank Accounts, Groww Investments, Subscriptions & FIRE Command Center • 100% Private
      </footer>

      {/* Mobile Floating Action Button (FAB) */}
      <div className="md:hidden fixed bottom-18 right-4 z-40">
        <button
          onClick={() => setShowMobileFabMenu(!showMobileFabMenu)}
          className="h-14 w-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg flex items-center justify-center transition-transform active:scale-90"
          aria-label="Add entry"
        >
          {showMobileFabMenu ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6 stroke-[2.5]" />}
        </button>

        {showMobileFabMenu && (
          <div className="absolute bottom-16 right-0 w-52 rounded-2xl bg-white border border-slate-200 shadow-2xl p-2 space-y-1 animate-in fade-in slide-in-from-bottom-3 duration-150">
            <button
              onClick={() => {
                setIsVoiceModalOpen(true);
                setShowMobileFabMenu(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 flex items-center gap-2.5"
            >
              <Mic className="h-4 w-4 text-emerald-600" />
              <span>🎙️ Voice Input (Bol Kar)</span>
            </button>
            <button
              onClick={() => {
                setIsCsvModalOpen(true);
                setShowMobileFabMenu(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 flex items-center gap-2.5"
            >
              <FileSpreadsheet className="h-4 w-4 text-blue-600" />
              <span>📄 Import Bank CSV</span>
            </button>
            <button
              onClick={() => {
                setIsSmsModalOpen(true);
                setShowMobileFabMenu(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 flex items-center gap-2.5"
            >
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span>⚡ Paste Bank SMS</span>
            </button>
            <button
              onClick={() => {
                setAddModalType('transaction');
                setShowMobileFabMenu(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2.5"
            >
              <Receipt className="h-4 w-4 text-emerald-600" />
              <span>Record Kharcha</span>
            </button>
            <button
              onClick={() => {
                setAddModalType('account');
                setShowMobileFabMenu(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2.5"
            >
              <Landmark className="h-4 w-4 text-blue-600" />
              <span>Add Bank A/c</span>
            </button>
            <button
              onClick={() => {
                setAddModalType('investment');
                setShowMobileFabMenu(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2.5"
            >
              <TrendingUp className="h-4 w-4 text-teal-600" />
              <span>Add SIP / Stock</span>
            </button>
            <button
              onClick={() => {
                setAddModalType('loan');
                setShowMobileFabMenu(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-2.5"
            >
              <Building2 className="h-4 w-4 text-rose-600" />
              <span>Add Loan / Udhaar</span>
            </button>
          </div>
        )}
      </div>

      {/* Mobile Native Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Modals */}
      <AddTransactionModal
        isOpen={addModalType === 'transaction'}
        onClose={() => setAddModalType(null)}
        accounts={data.accounts}
        onAdd={handleAddTransaction}
      />

      <AddAccountModal
        isOpen={addModalType === 'account'}
        onClose={() => setAddModalType(null)}
        onAdd={handleAddAccount}
      />

      <AddInvestmentModal
        isOpen={addModalType === 'investment'}
        onClose={() => setAddModalType(null)}
        onAdd={handleAddInvestment}
      />

      <AddLoanModal
        isOpen={addModalType === 'loan'}
        onClose={() => setAddModalType(null)}
        onAdd={handleAddLoan}
      />

      <SMSParserModal
        isOpen={isSmsModalOpen}
        onClose={() => setIsSmsModalOpen(false)}
        accounts={data.accounts}
        onAddTransaction={handleAddTransaction}
      />

      <VoiceExpenseModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        accounts={data.accounts}
        onAddTransaction={handleAddTransaction}
      />

      <CSVImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        accounts={data.accounts}
        onBulkAddTransactions={handleBulkAddTransactions}
      />

      <GroupSplitModal
        isOpen={isGroupSplitOpen}
        onClose={() => setIsGroupSplitOpen(false)}
        accounts={data.accounts}
        onConfirmSplit={handleConfirmGroupSplit}
      />

      <AppLockModal
        isOpen={isAppLocked}
        isUnlocked={!isAppLocked}
        onUnlockSuccess={() => setIsAppLocked(false)}
      />

    </div>
  );
}
