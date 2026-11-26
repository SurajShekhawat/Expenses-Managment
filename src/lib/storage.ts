import { FinancialData, FinancialAccount, Transaction, Investment, LoanLiability, BudgetLimit, FinancialGoal, Subscription, InsurancePolicy } from '@/types/finance';

const STORAGE_KEY = 'fingroww_personal_finance_v4_clean';

export const INITIAL_DEMO_ACCOUNTS: FinancialAccount[] = [];

export const INITIAL_DEMO_SUBSCRIPTIONS: Subscription[] = [];

export const INITIAL_DEMO_INSURANCES: InsurancePolicy[] = [];

export const INITIAL_DEFAULT_BUDGETS: BudgetLimit[] = [
  { category: 'Food & Dining', limit: 0 },
  { category: 'Groceries', limit: 0 },
  { category: 'Shopping & Lifestyle', limit: 0 },
  { category: 'Transportation', limit: 0 },
  { category: 'Utilities & Bills', limit: 0 },
  { category: 'Entertainment & Subscriptions', limit: 0 },
];

export const INITIAL_DEMO_DATA: FinancialData = {
  accounts: [],
  transactions: [],
  investments: [],
  loans: [],
  budgets: INITIAL_DEFAULT_BUDGETS,
  goals: [],
  subscriptions: [],
  insurances: [],
};

export function loadFinancialData(): FinancialData {
  if (typeof window === 'undefined') {
    return INITIAL_DEMO_DATA;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveFinancialData(INITIAL_DEMO_DATA);
      return INITIAL_DEMO_DATA;
    }
    const parsed = JSON.parse(raw);
    return {
      accounts: parsed.accounts || [],
      transactions: parsed.transactions || [],
      investments: parsed.investments || [],
      loans: parsed.loans || [],
      budgets: parsed.budgets || INITIAL_DEFAULT_BUDGETS,
      goals: parsed.goals || [],
      subscriptions: parsed.subscriptions || [],
      insurances: parsed.insurances || [],
    };
  } catch (err) {
    console.error('Failed to load data from localStorage:', err);
    return INITIAL_DEMO_DATA;
  }
}

export function saveFinancialData(data: FinancialData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save data to localStorage:', err);
  }
}

export function resetToDemoData(): FinancialData {
  saveFinancialData(INITIAL_DEMO_DATA);
  return INITIAL_DEMO_DATA;
}

export function exportDataAsJSON(): void {
  const data = loadFinancialData();
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `FinGroww_Backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
