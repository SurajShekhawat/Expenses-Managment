export type TransactionType = 'income' | 'expense' | 'transfer';

export type ExpenseCategory =
  | 'Food & Dining'
  | 'Rent & Housing'
  | 'Utilities & Bills'
  | 'Groceries'
  | 'Transportation'
  | 'Shopping & Lifestyle'
  | 'Entertainment & Subscriptions'
  | 'Healthcare & Medical'
  | 'Education & Learning'
  | 'Travel & Vacation'
  | 'EMI & Debt Payment'
  | 'Investment (Self-transfer)'
  | 'Account Transfer'
  | 'Other Expense';

export type IncomeCategory =
  | 'Salary / Wages'
  | 'Business / Freelance'
  | 'Stock Dividend / Returns'
  | 'Rental Income'
  | 'Gift / Cashback'
  | 'Interest Income'
  | 'Other Income';

export type PaymentMode = 'UPI' | 'Credit Card' | 'Debit Card' | 'NetBanking' | 'Cash' | 'Auto-Debit';

export type AccountType = 'bank' | 'wallet' | 'cash' | 'credit_card' | 'demat_trading';

export interface FinancialAccount {
  id: string;
  name: string;
  accountType: AccountType;
  accountNumberMasked?: string;
  balance: number;
  creditLimit?: number;
  billingDayOfMonth?: number; // e.g. 15th of month statement generation
  dueDayOfMonth?: number; // e.g. 5th of next month payment due
  color?: string;
  isPrimary?: boolean;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: TransactionType;
  category: ExpenseCategory | IncomeCategory | string;
  paymentMode: PaymentMode;
  accountId?: string;
  toAccountId?: string;
  description: string;
  isRecurring?: boolean;
}

export type AssetType =
  | 'stocks'
  | 'mutual_funds'
  | 'crypto'
  | 'gold'
  | 'fixed_deposit'
  | 'ppf_epf'
  | 'real_estate'
  | 'other';

export interface Investment {
  id: string;
  name: string;
  symbolOrPlatform?: string;
  assetType: AssetType;
  investedAmount: number;
  currentValue: number;
  units?: number;
  avgBuyPrice?: number;
  currentPrice?: number;
  sipMonthlyAmount?: number;
  sipDate?: number;
  expectedReturnRate?: number;
  lastUpdated: string;
  notes?: string;
}

export type LoanType =
  | 'home_loan'
  | 'car_loan'
  | 'personal_loan'
  | 'education_loan'
  | 'credit_card_emi'
  | 'bnpl_paylater'
  | 'peer_debt';

export type DebtDirection = 'i_owe' | 'they_owe_me';

export interface LoanLiability {
  id: string;
  title: string;
  lenderOrBorrower: string;
  loanType: LoanType;
  direction: DebtDirection;
  principalAmount: number;
  remainingBalance: number;
  interestRate: number;
  monthlyEmi: number;
  dueDayOfMonth?: number;
  startDate: string;
  tenureMonths: number;
  notes?: string;
}

export interface BudgetLimit {
  category: string;
  limit: number;
}

export interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: 'Emergency Fund' | 'Vehicle' | 'House Downpayment' | 'Vacation' | 'Retirement' | 'Gadget' | 'Other';
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  billingCycle: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';
  category: string;
  nextBillingDate: string; // YYYY-MM-DD
  accountId?: string;
  notes?: string;
}

export type InsuranceType = 'health' | 'term_life' | 'vehicle' | 'life' | 'other';
export type PaymentFrequency = 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';

export interface InsurancePolicy {
  id: string;
  type: InsuranceType;
  policyName: string;
  providerName: string;
  sumInsured: number;
  annualPremium: number; // Effective yearly cost
  premiumAmount: number; // Actual amount paid per cycle (e.g. ₹1,200 per month or ₹15,000 per year)
  paymentFrequency: PaymentFrequency; // monthly, quarterly, half_yearly, yearly
  renewalDate: string; // YYYY-MM-DD (next payment / renewal date)
  policyNumber?: string;
  nominee?: string;
  accountId?: string; // Auto-debit bank or card account
  autoDebit?: boolean;
}

export interface FinancialData {
  accounts: FinancialAccount[];
  transactions: Transaction[];
  investments: Investment[];
  loans: LoanLiability[];
  budgets: BudgetLimit[];
  goals: FinancialGoal[];
  subscriptions: Subscription[];
  insurances: InsurancePolicy[];
  monthlyIncomeTarget?: number;
}
