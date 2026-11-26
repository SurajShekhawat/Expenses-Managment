import { FinancialData, FinancialAccount, Transaction, Investment, LoanLiability, FinancialGoal, Subscription, InsurancePolicy } from '@/types/finance';
import { loadFinancialData, saveFinancialData } from './storage';

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('fingroww_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

export async function fetchRemoteFinancialData(): Promise<{ data: FinancialData; source: 'mysql' | 'local' }> {
  try {
    const res = await fetch('/api/finance', {
      method: 'GET',
      credentials: 'include',
      headers: { 
        'Cache-Control': 'no-cache',
        ...getAuthHeaders()
      },
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        // Also cache locally for offline access (scoped to active user)
        saveFinancialData(json.data);
        return { data: json.data, source: 'mysql' };
      }
    }
  } catch (err) {
    console.warn('API fetch failed, falling back to local storage:', err);
  }

  // Fallback to local storage
  const local = loadFinancialData();
  return { data: local, source: 'local' };
}

export async function syncFullDataToRemote(data: FinancialData): Promise<boolean> {
  saveFinancialData(data);
  try {
    const res = await fetch('/api/finance', {
      method: 'POST',
      credentials: 'include',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ action: 'sync_all', payload: data }),
    });
    return res.ok;
  } catch (e) {
    console.warn('Background sync to MySQL failed:', e);
    return false;
  }
}

export async function apiAddTransaction(tx: Transaction): Promise<void> {
  try {
    await fetch('/api/finance', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ action: 'add_transaction', transaction: tx }),
    });
  } catch (e) {
    console.warn('apiAddTransaction failed:', e);
  }
}

export async function apiDeleteTransaction(id: string): Promise<void> {
  try {
    await fetch('/api/finance', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ action: 'delete_transaction', id }),
    });
  } catch (e) {
    console.warn('apiDeleteTransaction failed:', e);
  }
}

export async function apiAddAccount(acc: FinancialAccount): Promise<void> {
  try {
    await fetch('/api/finance', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ action: 'add_account', account: acc }),
    });
  } catch (e) {
    console.warn('apiAddAccount failed:', e);
  }
}

export async function apiUpdateAccountBalance(id: string, balance: number): Promise<void> {
  try {
    await fetch('/api/finance', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ action: 'update_account_balance', id, balance }),
    });
  } catch (e) {
    console.warn('apiUpdateAccountBalance failed:', e);
  }
}

export async function apiDeleteAccount(id: string): Promise<void> {
  try {
    await fetch('/api/finance', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ action: 'delete_account', id }),
    });
  } catch (e) {
    console.warn('apiDeleteAccount failed:', e);
  }
}

export async function apiTransferFunds(fromId: string, toId: string, amount: number): Promise<void> {
  try {
    await fetch('/api/finance', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ action: 'transfer_funds', fromId, toId, amount }),
    });
  } catch (e) {
    console.warn('apiTransferFunds failed:', e);
  }
}

export async function apiResetDemo(): Promise<void> {
  try {
    await fetch('/api/finance', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ action: 'reset_demo' }),
    });
  } catch (e) {
    console.warn('apiResetDemo failed:', e);
  }
}
