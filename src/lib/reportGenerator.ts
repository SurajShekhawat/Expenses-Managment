import { FinancialData } from '@/types/finance';
import { formatINR, formatDate, getTodayDateString } from './formatters';

/**
 * Generates an official, printable CA-Grade Financial Health & Net Worth Statement
 * formatted cleanly with print media queries.
 */
export function printMonthlyFinancialReport(data: FinancialData): void {
  const todayStr = formatDate(getTodayDateString());

  // Key Aggregations
  const totalLiquid = data.accounts.filter(a => a.accountType !== 'credit_card').reduce((acc, a) => acc + a.balance, 0);
  const totalInvested = data.investments.reduce((acc, i) => acc + i.investedAmount, 0);
  const totalCurrentInvest = data.investments.reduce((acc, i) => acc + i.currentValue, 0);
  const totalDebt = data.loans.filter(l => l.direction === 'i_owe').reduce((acc, l) => acc + l.remainingBalance, 0);
  const totalReceivables = data.loans.filter(l => l.direction === 'they_owe_me').reduce((acc, l) => acc + l.remainingBalance, 0);
  const netWorth = totalLiquid + totalCurrentInvest + totalReceivables - totalDebt;

  const totalIncome = data.transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = data.transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const savings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((savings / totalIncome) * 100).toFixed(1) : '0.0';

  // Section 80C & 80D
  const ppf = data.investments.filter(i => i.assetType === 'ppf_epf').reduce((acc, i) => acc + i.investedAmount, 0);
  const elss = data.investments.filter(i => i.name.toLowerCase().includes('elss')).reduce((acc, i) => acc + i.investedAmount, 0);
  const total80C = Math.min(150000, ppf + elss);
  const healthInsurances = data.insurances.filter(i => i.type === 'health');
  const total80D = Math.min(25000, healthInsurances.reduce((acc, i) => acc + i.annualPremium, 0));

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to download the Financial Report PDF');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>FinGroww Financial Statement - ${todayStr}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; line-height: 1.4; margin: 0; padding: 20px; font-size: 13px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-b: 2px solid #059669; padding-bottom: 12px; margin-bottom: 20px; }
          .logo-title { font-size: 24px; font-weight: 800; color: #059669; }
          .badge { background: #ecfdf5; color: #065f46; font-size: 10px; font-weight: bold; padding: 3px 8px; border-radius: 4px; border: 1px solid #a7f3d0; text-transform: uppercase; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
          .card-label { font-size: 10px; text-transform: uppercase; font-weight: 700; color: #64748b; margin-bottom: 4px; }
          .card-value { font-size: 18px; font-weight: 800; color: #0f172a; }
          h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-top: 24px; margin-bottom: 12px; color: #1e293b; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; }
          th { background: #f1f5f9; text-align: left; padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 700; color: #475569; }
          td { padding: 8px 10px; border: 1px solid #e2e8f0; }
          .text-right { text-align: right; }
          .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; text-align: right;">
          <button onclick="window.print()" style="background: #059669; color: white; border: none; padding: 10px 18px; border-radius: 6px; font-weight: bold; cursor: pointer;">
            🖨️ Print / Save as PDF
          </button>
        </div>

        <div class="header">
          <div>
            <div class="logo-title">FinGroww <span style="color:#0f172a;">DhanVridhi</span></div>
            <div style="color: #64748b; font-size: 12px;">Personal Net Worth & Financial Health Audit Statement</div>
          </div>
          <div style="text-align: right;">
            <span class="badge">Verified Financial Record</span>
            <div style="font-size: 11px; color: #64748b; margin-top: 6px;">Generated on: <strong>${todayStr}</strong></div>
          </div>
        </div>

        <!-- Metric Grid -->
        <div class="grid">
          <div class="card">
            <div class="card-label">Total Net Worth</div>
            <div class="card-value" style="color: #059669;">${formatINR(netWorth)}</div>
          </div>
          <div class="card">
            <div class="card-label">Liquid Bank Balance</div>
            <div class="card-value">${formatINR(totalLiquid)}</div>
          </div>
          <div class="card">
            <div class="card-label">Investments Value</div>
            <div class="card-value" style="color: #2563eb;">${formatINR(totalCurrentInvest)}</div>
          </div>
          <div class="card">
            <div class="card-label">Total Debt / Loans</div>
            <div class="card-value" style="color: #e11d48;">${formatINR(totalDebt)}</div>
          </div>
        </div>

        <!-- Cashflow & Savings Performance -->
        <h2>1. Cashflow & Monthly Pacing</h2>
        <table>
          <thead>
            <tr>
              <th>Total Recorded Income</th>
              <th>Total Recorded Kharcha</th>
              <th>Net Surplus / Savings</th>
              <th>Savings Rate</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>${formatINR(totalIncome)}</strong></td>
              <td><strong>${formatINR(totalExpense)}</strong></td>
              <td style="color: #059669; font-weight: bold;">${formatINR(savings)}</td>
              <td><strong>${savingsRate}%</strong></td>
            </tr>
          </tbody>
        </table>

        <!-- Tax Savings Audit (Section 80C & 80D) -->
        <h2>2. Income Tax Saving Deductions (FY 2026-27)</h2>
        <table>
          <thead>
            <tr>
              <th>Section</th>
              <th>Components Included</th>
              <th>Max Limit</th>
              <th>Actual Utilized</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Section 80C</strong></td>
              <td>PPF, EPF, ELSS Tax Mutual Funds</td>
              <td>₹1,50,000</td>
              <td><strong>${formatINR(total80C)}</strong></td>
              <td>${total80C >= 150000 ? '✅ 100% Tax Quota Exhausted' : 'Pending deduction room'}</td>
            </tr>
            <tr>
              <td><strong>Section 80D</strong></td>
              <td>Health Insurance Premiums (Self + Family)</td>
              <td>₹25,000</td>
              <td><strong>${formatINR(total80D)}</strong></td>
              <td>${total80D > 0 ? '✅ Deductible under Old Regime' : 'No health policy logged'}</td>
            </tr>
          </tbody>
        </table>

        <!-- Active Accounts -->
        <h2>3. Bank & Demat Accounts</h2>
        <table>
          <thead>
            <tr>
              <th>Account Name</th>
              <th>Type</th>
              <th class="text-right">Current Balance / Outstanding</th>
            </tr>
          </thead>
          <tbody>
            ${data.accounts.map(a => `
              <tr>
                <td><strong>${a.name}</strong></td>
                <td>${a.accountType.toUpperCase()}</td>
                <td class="text-right">${formatINR(a.balance)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Recent Transactions -->
        <h2>4. Recent High-Value Transactions</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Mode</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${data.transactions.slice(0, 15).map(t => `
              <tr>
                <td>${formatDate(t.date)}</td>
                <td>${t.description}</td>
                <td>${t.category}</td>
                <td>${t.paymentMode}</td>
                <td class="text-right" style="font-weight: bold; color: ${t.type === 'income' ? '#059669' : '#0f172a'};">
                  ${t.type === 'income' ? '+' : '-'}${formatINR(t.amount)}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <div>Report automatically compiled by FinGroww (Hostinger MySQL Backed)</div>
          <div>Page 1 of 1 • Confidential Personal Financial Document</div>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
