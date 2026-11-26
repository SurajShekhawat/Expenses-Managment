import { FinancialData, FinancialAccount, Transaction, Investment, LoanLiability, BudgetLimit, FinancialGoal, Subscription, InsurancePolicy } from '@/types/finance';

const STORAGE_KEY = 'fingroww_personal_finance_v4_clean';

function getStorageKey(userId?: string): string {
  if (userId) return `fingroww_data_${userId}`;
  if (typeof window !== 'undefined') {
    try {
      const userRaw = localStorage.getItem('fingroww_user');
      if (userRaw) {
        const u = JSON.parse(userRaw);
        if (u?.id) return `fingroww_data_${u.id}`;
      }
    } catch (e) {}
  }
  return STORAGE_KEY;
}

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

export function loadFinancialData(userId?: string): FinancialData {
  if (typeof window === 'undefined') {
    return INITIAL_DEMO_DATA;
  }

  try {
    const key = getStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      saveFinancialData(INITIAL_DEMO_DATA, userId);
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

export function saveFinancialData(data: FinancialData, userId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save data to localStorage:', err);
  }
}

export function resetToDemoData(userId?: string): FinancialData {
  saveFinancialData(INITIAL_DEMO_DATA, userId);
  return INITIAL_DEMO_DATA;
}

export function exportDataAsJSON(userId?: string): void {
  const data = loadFinancialData(userId);
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `FinGroww_Backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
