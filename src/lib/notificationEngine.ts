import { FinancialData } from '@/types/finance';
import { formatINR } from './formatters';

export interface DueAlert {
  id: string;
  type: 'emi' | 'subscription' | 'insurance' | 'budget';
  title: string;
  message: string;
  dueDate?: string;
  amount?: number;
  urgency: 'high' | 'medium' | 'low';
}

/**
 * Checks all financial entities and returns active upcoming due alerts
 */
export function computeDueAlerts(data: FinancialData): DueAlert[] {
  const alerts: DueAlert[] = [];
  const today = new Date();
  const currentDay = today.getDate();

  // 1. Check EMIs due in next 3 days
  data.loans
    .filter((l) => l.direction === 'i_owe' && l.remainingBalance > 0 && l.monthlyEmi > 0)
    .forEach((loan) => {
      const dueDay = loan.dueDayOfMonth || 10;
      let daysRemaining = dueDay - currentDay;
      if (daysRemaining < 0) {
        // Already passed this month or upcoming next month
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        daysRemaining += daysInMonth;
      }

      if (daysRemaining <= 3) {
        alerts.push({
          id: `emi-${loan.id}`,
          type: 'emi',
          title: `EMI Alert: ${loan.title}`,
          message: daysRemaining === 0 
            ? `Aaj ${formatINR(loan.monthlyEmi)} ki EMI due hai!` 
            : `${daysRemaining} din me ${formatINR(loan.monthlyEmi)} ki EMI due hai.`,
          dueDate: `${dueDay}th of this month`,
          amount: loan.monthlyEmi,
          urgency: daysRemaining <= 1 ? 'high' : 'medium',
        });
      }
    });

  // 2. Check Subscriptions due in next 3 days
  data.subscriptions.forEach((sub) => {
    const nextBilling = new Date(sub.nextBillingDate);
    const diffTime = nextBilling.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays <= 3) {
      alerts.push({
        id: `sub-${sub.id}`,
        type: 'subscription',
        title: `Subscription Due: ${sub.name}`,
        message: diffDays === 0
          ? `Aaj ${formatINR(sub.amount)} ka auto-debit hoga!`
          : `${diffDays} din me ${formatINR(sub.amount)} renewal due hai.`,
        dueDate: sub.nextBillingDate,
        amount: sub.amount,
        urgency: diffDays <= 1 ? 'high' : 'medium',
      });
    }
  });

  // 3. Check Insurance renewals in next 7 days
  data.insurances.forEach((ins) => {
    const renew = new Date(ins.renewalDate);
    const diffTime = renew.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays <= 7) {
      alerts.push({
        id: `ins-${ins.id}`,
        type: 'insurance',
        title: `Insurance Renewal: ${ins.policyName}`,
        message: `${diffDays} din me ${formatINR(ins.annualPremium || ins.premiumAmount)} ka premium renewal due hai.`,
        dueDate: ins.renewalDate,
        amount: ins.annualPremium || ins.premiumAmount,
        urgency: diffDays <= 2 ? 'high' : 'low',
      });
    }
  });

  // 4. Check Budget limits (>80%)
  const currentMonth = today.toISOString().slice(0, 7);
  const monthlyExpenses = data.transactions.filter(
    (t) => t.type === 'expense' && t.date.startsWith(currentMonth)
  );

  const spentPerCat: Record<string, number> = {};
  monthlyExpenses.forEach((t) => {
    spentPerCat[t.category] = (spentPerCat[t.category] || 0) + t.amount;
  });

  data.budgets.forEach((b) => {
    const spent = spentPerCat[b.category] || 0;
    const pct = b.limit > 0 ? (spent / b.limit) * 100 : 0;
    if (pct >= 85) {
      alerts.push({
        id: `budget-${b.category}`,
        type: 'budget',
        title: `Budget Limit Warning: ${b.category}`,
        message: `${b.category} me budget ka ${pct.toFixed(0)}% kharch ho chuka hai (${formatINR(spent)} / ${formatINR(b.limit)}).`,
        amount: spent,
        urgency: pct >= 100 ? 'high' : 'medium',
      });
    }
  });

  return alerts;
}

/**
 * Request notification permission from user and register service worker
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  try {
    const perm = await Notification.requestPermission();
    if (perm === 'granted' && 'serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      (reg as any).showNotification('FinGroww Alerts Active 🚀', {
        body: 'Aapko sabhi bill aur EMI dues ki samay par notification milti rahegi!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        tag: 'fingroww-welcome',
      });
    }
    return perm;
  } catch (err) {
    console.warn('Notification permission error:', err);
    return 'denied';
  }
}

/**
 * Dispatches a native push notification for top alerts
 */
export async function dispatchAlertNotification(alert: DueAlert): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        (reg as any).showNotification(alert.title, {
          body: alert.message,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
          tag: alert.id,
          vibrate: [200, 100, 200],
        });
      } else {
        new Notification(alert.title, {
          body: alert.message,
          icon: '/icons/icon-192x192.png',
        });
      }
    } catch (e) {
      console.warn('Error dispatching notification:', e);
    }
  }
}
