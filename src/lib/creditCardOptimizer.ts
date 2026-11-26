import { FinancialAccount } from '@/types/finance';

export interface CardOptimizationAdvice {
  card: FinancialAccount;
  daysFreeCreditRemaining: number;
  statementDateFormatted: string;
  dueDateFormatted: string;
  utilizationPercent: number;
  isSafeUtilization: boolean;
  isBestChoice: boolean;
  recommendationReason: string;
}

/**
 * Evaluates connected Credit Cards to calculate maximum free credit period (up to 45-50 days)
 * and safe credit utilization to protect credit score (CIBIL).
 */
export function getCreditCardOptimization(accounts: FinancialAccount[]): CardOptimizationAdvice[] {
  const cards = accounts.filter((a) => a.accountType === 'credit_card');
  if (cards.length === 0) return [];

  const now = new Date();
  const currentDay = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const evaluated: CardOptimizationAdvice[] = cards.map((card) => {
    const billDay = card.billingDayOfMonth || 15;
    const dueDay = card.dueDayOfMonth || (billDay + 20 > daysInMonth ? (billDay + 20) - daysInMonth : billDay + 20);

    // Calculate days remaining until next statement generation
    let daysUntilBill = 0;
    if (currentDay <= billDay) {
      daysUntilBill = billDay - currentDay;
    } else {
      daysUntilBill = (daysInMonth - currentDay) + billDay;
    }

    // Free credit period = days until bill + payment window (~20 days)
    const daysFreeCreditRemaining = daysUntilBill + 20;

    // Credit limit utilization (balance is current unpaid spend)
    const limit = card.creditLimit || 100000;
    const currentSpend = Math.max(0, card.balance);
    const utilizationPercent = limit > 0 ? Math.min(100, Math.round((currentSpend / limit) * 100)) : 0;
    const isSafeUtilization = utilizationPercent <= 30;

    return {
      card,
      daysFreeCreditRemaining,
      statementDateFormatted: `${billDay}th of month`,
      dueDateFormatted: `${dueDay}th of month`,
      utilizationPercent,
      isSafeUtilization,
      isBestChoice: false,
      recommendationReason: '',
    };
  });

  // Sort by highest free credit period, prioritizing safe utilization
  evaluated.sort((a, b) => {
    if (a.isSafeUtilization && !b.isSafeUtilization) return -1;
    if (!a.isSafeUtilization && b.isSafeUtilization) return 1;
    return b.daysFreeCreditRemaining - a.daysFreeCreditRemaining;
  });

  if (evaluated.length > 0) {
    evaluated[0].isBestChoice = true;
    evaluated[0].recommendationReason = `Provides max ~${evaluated[0].daysFreeCreditRemaining} interest-free days before bill due!`;
  }

  return evaluated;
}
