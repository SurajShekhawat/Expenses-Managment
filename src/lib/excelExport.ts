import * as XLSX from 'xlsx';
import { FinancialData } from '@/types/finance';
import { formatINR, formatDate, getTodayDateString } from './formatters';

export function exportFinancialDataToExcel(data: FinancialData, userName: string = 'User'): void {
  const wb = XLSX.utils.book_new();

  // 1. Calculations for Executive Summary
  const liquidAccounts = data.accounts.filter((a) => a.accountType !== 'credit_card');
  const totalLiquidCash = liquidAccounts.reduce((acc, a) => acc + a.balance, 0);
  const totalCurrentInvestments = data.investments.reduce((acc, inv) => acc + inv.currentValue, 0);
  const totalInvestedAmount = data.investments.reduce((acc, inv) => acc + inv.investedAmount, 0);
  const totalInvestmentPnl = totalCurrentInvestments - totalInvestedAmount;

  const myLoans = data.loans.filter((l) => l.direction === 'i_owe');
  const totalDebtOutstanding = myLoans.reduce((acc, l) => acc + l.remainingBalance, 0);
  const totalMonthlyEmi = myLoans.reduce((acc, l) => acc + l.monthlyEmi, 0);

  const theyOweMe = data.loans.filter((l) => l.direction === 'they_owe_me');
  const totalReceivables = theyOweMe.reduce((acc, l) => acc + l.remainingBalance, 0);

  const netWorth = totalLiquidCash + totalCurrentInvestments + totalReceivables - totalDebtOutstanding;

  const totalIncome = data.transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = data.transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) + '%' : '0.0%';

  // Sheet 1: Executive Summary
  const summaryRows = [
    ['FinGroww Personal Financial Statement', ''],
    ['Generated For', userName],
    ['Date Generated', getTodayDateString()],
    ['Report Grade', 'CA-Certified Personal Audit'],
    ['', ''],
    ['KEY WEALTH METRIC', 'AMOUNT (INR)'],
    ['Total Net Worth', netWorth],
    ['Liquid Cash & Bank Balances', totalLiquidCash],
    ['Groww & Market Investments (Current Value)', totalCurrentInvestments],
    ['Investments Cost Basis (Invested)', totalInvestedAmount],
    ['Investment Net Profit / Loss', totalInvestmentPnl],
    ['Total Outstanding Liabilities & Bank Loans', totalDebtOutstanding],
    ['Total Receivables (Udhaar Given to Friends)', totalReceivables],
    ['', ''],
    ['MONTHLY CASHFLOW', 'VALUE'],
    ['Total Monthly Inflow (Income)', totalIncome],
    ['Total Monthly Outflow (Expenses + EMIs)', totalExpense],
    ['Net Monthly Savings', netSavings],
    ['Monthly Savings Rate', savingsRate],
    ['Total Monthly Fixed EMIs', totalMonthlyEmi],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 45 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive_Summary');

  // Sheet 2: Bank Accounts & Wallets
  const accountsData = data.accounts.map((acc, idx) => ({
    'S.No': idx + 1,
    'Account Name': acc.name,
    'Account Type': acc.accountType.toUpperCase(),
    'Masked A/c Number': acc.accountNumberMasked || 'N/A',
    'Balance (₹)': acc.balance,
    'Credit Limit (₹)': acc.creditLimit || 'N/A',
    'Primary Account': acc.isPrimary ? 'YES' : 'NO',
  }));
  const wsAccounts = XLSX.utils.json_to_sheet(accountsData.length > 0 ? accountsData : [{ 'Status': 'No accounts recorded' }]);
  wsAccounts['!cols'] = [{ wch: 6 }, { wch: 25 }, { wch: 18 }, { wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsAccounts, 'Bank_Accounts');

  // Sheet 3: Transactions Ledger
  const transactionsData = data.transactions.map((tx, idx) => {
    const acc = data.accounts.find(a => a.id === tx.accountId);
    return {
      'S.No': idx + 1,
      'Date': tx.date,
      'Description': tx.description,
      'Type': tx.type.toUpperCase(),
      'Category': tx.category,
      'Amount (₹)': tx.amount,
      'Payment Mode': tx.paymentMode,
      'Account / Bank': acc ? acc.name : 'N/A',
      'Is Recurring': tx.isRecurring ? 'YES' : 'NO',
    };
  });
  const wsTransactions = XLSX.utils.json_to_sheet(transactionsData.length > 0 ? transactionsData : [{ 'Status': 'No transactions recorded' }]);
  wsTransactions['!cols'] = [{ wch: 6 }, { wch: 14 }, { wch: 32 }, { wch: 12 }, { wch: 25 }, { wch: 16 }, { wch: 16 }, { wch: 20 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsTransactions, 'Transactions_Ledger');

  // Sheet 4: Groww Investments Portfolio
  const investmentsData = data.investments.map((inv, idx) => {
    const pnl = inv.currentValue - inv.investedAmount;
    const returnPct = inv.investedAmount > 0 ? ((pnl / inv.investedAmount) * 100).toFixed(2) + '%' : '0.00%';
    return {
      'S.No': idx + 1,
      'Asset Name': inv.name,
      'Asset Type': inv.assetType.replace('_', ' ').toUpperCase(),
      'Platform / Symbol': inv.symbolOrPlatform || 'Groww',
      'Invested Amount (₹)': inv.investedAmount,
      'Current Value (₹)': inv.currentValue,
      'Profit / Loss (₹)': pnl,
      'Return %': returnPct,
      'Monthly SIP (₹)': inv.sipMonthlyAmount || 0,
      'SIP Due Date': inv.sipDate ? `${inv.sipDate}th of month` : 'N/A',
      'Expected Return Rate (%)': inv.expectedReturnRate || 12,
      'Notes': inv.notes || '',
    };
  });
  const wsInvestments = XLSX.utils.json_to_sheet(investmentsData.length > 0 ? investmentsData : [{ 'Status': 'No investments recorded' }]);
  wsInvestments['!cols'] = [{ wch: 6 }, { wch: 35 }, { wch: 18 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 18 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 22 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsInvestments, 'Groww_Investments');

  // Sheet 5: Loans & Liabilities
  const loansData = data.loans.map((l, idx) => {
    const paid = Math.max(0, l.principalAmount - l.remainingBalance);
    return {
      'S.No': idx + 1,
      'Title': l.title,
      'Lender / Borrower': l.lenderOrBorrower,
      'Direction': l.direction === 'i_owe' ? 'I Owe (Bank / Lender)' : 'They Owe Me (Friend Udhaar)',
      'Loan Type': l.loanType.replace('_', ' ').toUpperCase(),
      'Principal Amount (₹)': l.principalAmount,
      'Remaining Balance (₹)': l.remainingBalance,
      'Repaid Amount (₹)': paid,
      'Interest Rate (% p.a.)': l.interestRate,
      'Monthly EMI (₹)': l.monthlyEmi,
      'EMI Due Day': l.dueDayOfMonth ? `${l.dueDayOfMonth}th` : 'N/A',
      'Tenure (Months)': l.tenureMonths,
      'Notes': l.notes || '',
    };
  });
  const wsLoans = XLSX.utils.json_to_sheet(loansData.length > 0 ? loansData : [{ 'Status': 'No active loans' }]);
  wsLoans['!cols'] = [{ wch: 6 }, { wch: 25 }, { wch: 25 }, { wch: 28 }, { wch: 18 }, { wch: 20 }, { wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsLoans, 'Loans_Liabilities');

  // Sheet 6: Insurance & Protection
  const insuranceData = data.insurances.map((ins, idx) => ({
    'S.No': idx + 1,
    'Policy Name': ins.policyName,
    'Provider': ins.providerName,
    'Type': ins.type.toUpperCase(),
    'Sum Insured Cover (₹)': ins.sumInsured,
    'Premium Amount (₹)': ins.premiumAmount || ins.annualPremium,
    'Frequency': (ins.paymentFrequency || 'yearly').toUpperCase(),
    'Annualized Premium (₹)': ins.annualPremium,
    'Renewal Date': ins.renewalDate,
    'Policy Number': ins.policyNumber || 'N/A',
    'Nominee': ins.nominee || 'N/A',
    'Auto-Debit': ins.autoDebit ? 'YES' : 'NO',
  }));
  const wsInsurance = XLSX.utils.json_to_sheet(insuranceData.length > 0 ? insuranceData : [{ 'Status': 'No insurance policies recorded' }]);
  wsInsurance['!cols'] = [{ wch: 6 }, { wch: 28 }, { wch: 22 }, { wch: 16 }, { wch: 22 }, { wch: 20 }, { wch: 14 }, { wch: 22 }, { wch: 15 }, { wch: 20 }, { wch: 18 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsInsurance, 'Insurance_Shield');

  // Sheet 7: Subscriptions
  const subscriptionData = data.subscriptions.map((sub, idx) => ({
    'S.No': idx + 1,
    'Service / App': sub.name,
    'Category': sub.category,
    'Amount (₹)': sub.amount,
    'Billing Cycle': sub.billingCycle.toUpperCase(),
    'Next Renewal Date': sub.nextBillingDate,
    'Notes': sub.notes || '',
  }));
  const wsSub = XLSX.utils.json_to_sheet(subscriptionData.length > 0 ? subscriptionData : [{ 'Status': 'No subscriptions recorded' }]);
  wsSub['!cols'] = [{ wch: 6 }, { wch: 25 }, { wch: 20 }, { wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsSub, 'Subscriptions');

  // Trigger Native Client Download
  const fileName = `FinGroww_Financial_Report_${getTodayDateString()}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
