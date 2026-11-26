/**
 * Indian Rupee (INR) and date formatting utilities
 */

export function formatINR(amount: number, compact: boolean = false, privacyMode: boolean = false): string {
  if (privacyMode) return '₹ ••••••';
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
  
  const sign = amount < 0 ? '-' : '';
  const absAmount = Math.abs(amount);

  if (compact) {
    if (absAmount >= 10000000) {
      return `${sign}₹${(absAmount / 10000000).toFixed(2)} Cr`;
    }
    if (absAmount >= 100000) {
      return `${sign}₹${(absAmount / 100000).toFixed(2)} L`;
    }
    if (absAmount >= 1000) {
      return `${sign}₹${(absAmount / 1000).toFixed(1)} K`;
    }
    return `${sign}₹${Math.round(absAmount).toLocaleString('en-IN')}`;
  }

  // Standard Indian comma format (e.g. 1,50,000)
  return `${sign}₹${Math.round(absAmount).toLocaleString('en-IN')}`;
}

export function formatPercent(value: number): string {
  if (isNaN(value)) return '0.0%';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const month = months[monthIndex] || parts[1];
    const day = parseInt(parts[2], 10);
    return `${day} ${month} ${year}`;
  }
  return dateString;
}

export function getTodayDateString(): string {
  if (typeof window === 'undefined') return '2026-11-21';
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
