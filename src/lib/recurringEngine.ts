import { FinancialData, Transaction } from '@/types/finance';
import { getTodayDateString } from './formatters';

export interface DueRecurringItem {
  id: string;
  sourceType: 'insurance' | 'subscription' | 'loan_emi' | 'sip';
  title: string;
  amount: number;
  dueDate: string;
  accountId?: string;
  accountName?: string;
  category: string;
  isAutoDebit: boolean;
}

/**
 * Scans financial data for any recurring bills/commitments that are due today or in the current month
 */
export function getDueRecurringItems(data: FinancialData): DueRecurringItem[] {
  const dueItems: DueRecurringItem[] = [];
  const today = new Date();
  const todayStr = getTodayDateString();
  const currentDay = today.getDate();
  const accountMap = new Map(data.accounts.map((a) => [a.id, a.name]));

  // 1. Due Insurance Premiums
  data.insurances.forEach((ins) => {
    // If renewal/payment date is today or earlier in the current month and not yet recorded today
    if (ins.renewalDate && ins.renewalDate <= todayStr) {
      const amount = ins.premiumAmount || ins.annualPremium;
      dueItems.push({
        id: `due-ins-${ins.id}`,
        sourceType: 'insurance',
        title: `${ins.policyName} (${ins.providerName}) Premium`,
        amount,
        dueDate: ins.renewalDate,
        accountId: ins.accountId,
        accountName: ins.accountId ? accountMap.get(ins.accountId) : undefined,
        category: 'Insurance & Tax',
        isAutoDebit: Boolean(ins.autoDebit),
      });
    }
  });

  // 2. Due Subscriptions
  data.subscriptions.forEach((sub) => {
    if (sub.nextBillingDate && sub.nextBillingDate <= todayStr) {
      dueItems.push({
        id: `due-sub-${sub.id}`,
        sourceType: 'subscription',
        title: `${sub.name} Subscription`,
        amount: sub.amount,
        dueDate: sub.nextBillingDate,
        accountId: sub.accountId,
        accountName: sub.accountId ? accountMap.get(sub.accountId) : undefined,
        category: sub.category || 'Entertainment & Subscriptions',
        isAutoDebit: true,
      });
    }
  });

  // 3. Due Loan EMIs
  data.loans
    .filter((l) => l.direction === 'i_owe' && l.monthlyEmi > 0 && l.dueDayOfMonth)
    .forEach((loan) => {
      if (loan.dueDayOfMonth && loan.dueDayOfMonth <= currentDay) {
        dueItems.push({
          id: `due-loan-${loan.id}`,
          sourceType: 'loan_emi',
          title: `${loan.title} EMI (${loan.lenderOrBorrower})`,
          amount: loan.monthlyEmi,
          dueDate: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(loan.dueDayOfMonth).padStart(2, '0')}`,
          category: 'EMI & Debt Payment',
          isAutoDebit: true,
        });
      }
    });

  // 4. Due SIPs
  data.investments
    .filter((inv) => inv.sipMonthlyAmount && inv.sipMonthlyAmount > 0 && inv.sipDate)
    .forEach((inv) => {
      if (inv.sipDate && inv.sipDate <= currentDay) {
        dueItems.push({
          id: `due-sip-${inv.id}`,
          sourceType: 'sip',
          title: `${inv.name} Monthly SIP`,
          amount: inv.sipMonthlyAmount || 0,
          dueDate: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(inv.sipDate).padStart(2, '0')}`,
          category: 'Investment (Self-transfer)',
          isAutoDebit: true,
        });
      }
    });

  return dueItems;
}
