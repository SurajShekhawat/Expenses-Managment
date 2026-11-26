import { Transaction, TransactionType, PaymentMode, ExpenseCategory, IncomeCategory } from '@/types/finance';

export interface ParsedCsvRow {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: ExpenseCategory | IncomeCategory | string;
  paymentMode: PaymentMode;
  selected: boolean;
}

// Helper to normalize various date formats to YYYY-MM-DD
function normalizeDate(rawDate: string): string {
  if (!rawDate) return new Date().toISOString().split('T')[0];
  const clean = rawDate.trim().replace(/\//g, '-');

  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }

  // DD-MM-YYYY or DD-MM-YY
  const dmyMatch = clean.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    let year = dmyMatch[3];
    if (year.length === 2) {
      year = parseInt(year, 10) > 50 ? `19${year}` : `20${year}`;
    }
    return `${year}-${month}-${day}`;
  }

  // DD-MMM-YYYY (e.g. 15-Nov-2024)
  const monthMap: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };
  const dMmmYMatch = clean.match(/^(\d{1,2})-([a-zA-Z]{3})-(\d{2,4})$/);
  if (dMmmYMatch) {
    const day = dMmmYMatch[1].padStart(2, '0');
    const month = monthMap[dMmmYMatch[2].toLowerCase()] || '01';
    let year = dMmmYMatch[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }

  return clean;
}

// Auto-categorize based on bank narration
function categorizeNarration(narration: string, type: TransactionType): string {
  const lower = narration.toLowerCase();

  if (type === 'income') {
    if (lower.includes('salary') || lower.includes('payroll')) return 'Salary / Wages';
    if (lower.includes('dividend') || lower.includes('div')) return 'Stock Dividend / Returns';
    if (lower.includes('interest') || lower.includes('int:')) return 'Interest Income';
    if (lower.includes('cashback') || lower.includes('reward')) return 'Gift / Cashback';
    if (lower.includes('rent')) return 'Rental Income';
    return 'Other Income';
  }

  if (lower.includes('swiggy') || lower.includes('zomato') || lower.includes('mcdonald') || lower.includes('restaurant') || lower.includes('cafe') || lower.includes('starbucks')) {
    return 'Food & Dining';
  }
  if (lower.includes('petrol') || lower.includes('fuel') || lower.includes('hpcl') || lower.includes('bpcl') || lower.includes('ioc') || lower.includes('uber') || lower.includes('ola') || lower.includes('metro')) {
    return 'Transportation';
  }
  if (lower.includes('blinkit') || lower.includes('zepto') || lower.includes('instamart') || lower.includes('bigbasket') || lower.includes('grocer') || lower.includes('supermarket') || lower.includes('dmart')) {
    return 'Groceries';
  }
  if (lower.includes('amazon') || lower.includes('flipkart') || lower.includes('myntra') || lower.includes('ajio') || lower.includes('zara')) {
    return 'Shopping & Lifestyle';
  }
  if (lower.includes('netflix') || lower.includes('hotstar') || lower.includes('prime') || lower.includes('spotify') || lower.includes('youtube') || lower.includes('bookmyshow') || lower.includes('pvr')) {
    return 'Entertainment & Subscriptions';
  }
  if (lower.includes('electricity') || lower.includes('bescom') || lower.includes('tata power') || lower.includes('airtel') || lower.includes('jio') || lower.includes('vi ') || lower.includes('billdesk') || lower.includes('recharge')) {
    return 'Utilities & Bills';
  }
  if (lower.includes('pharmacy') || lower.includes('apollo') || lower.includes('medplus') || lower.includes('1mg') || lower.includes('hospital') || lower.includes('clinic') || lower.includes('dr.')) {
    return 'Healthcare & Medical';
  }
  if (lower.includes('emi') || lower.includes('loan') || lower.includes('hdfc loan') || lower.includes('bajaj')) {
    return 'EMI & Debt Payment';
  }
  if (lower.includes('zerodha') || lower.includes('groww') || lower.includes('angelone') || lower.includes('upstox') || lower.includes('mf') || lower.includes('sip')) {
    return 'Investment (Self-transfer)';
  }

  return 'Other Expense';
}

// Split CSV lines accounting for quoted values
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseBankCsv(csvContent: string): ParsedCsvRow[] {
  const lines = csvContent
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length < 2) return [];

  // Find header line
  let headerIndex = -1;
  let headers: string[] = [];

  for (let i = 0; i < Math.min(15, lines.length); i++) {
    const tokens = parseCsvLine(lines[i]).map(t => t.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const hasDate = tokens.some(t => t.includes('date') || t.includes('txn'));
    const hasAmount = tokens.some(t => t.includes('amount') || t.includes('debit') || t.includes('credit') || t.includes('dr') || t.includes('cr'));
    const hasNarration = tokens.some(t => t.includes('narration') || t.includes('particulars') || t.includes('desc') || t.includes('remark') || t.includes('details'));

    if (hasDate && (hasAmount || hasNarration)) {
      headerIndex = i;
      headers = parseCsvLine(lines[i]);
      break;
    }
  }

  if (headerIndex === -1) {
    headerIndex = 0;
    headers = parseCsvLine(lines[0]);
  }

  // Find column indices
  let dateIdx = -1;
  let descIdx = -1;
  let debitIdx = -1;
  let creditIdx = -1;
  let amountIdx = -1;
  let typeIdx = -1; // For files with a Cr/Dr column

  headers.forEach((h, idx) => {
    const clean = h.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (clean.includes('date') || clean.includes('txndate') || clean.includes('valuedate')) {
      if (dateIdx === -1) dateIdx = idx;
    } else if (clean.includes('narration') || clean.includes('particular') || clean.includes('desc') || clean.includes('remark') || clean.includes('details')) {
      if (descIdx === -1) descIdx = idx;
    } else if (clean === 'debit' || clean === 'dr' || clean === 'debitamount' || clean === 'withdrawal') {
      debitIdx = idx;
    } else if (clean === 'credit' || clean === 'cr' || clean === 'creditamount' || clean === 'deposit') {
      creditIdx = idx;
    } else if (clean === 'amount' || clean === 'txnamount' || clean === 'transactionamount') {
      amountIdx = idx;
    } else if (clean === 'type' || clean === 'drcr' || clean === 'crdr') {
      typeIdx = idx;
    }
  });

  const parsedRows: ParsedCsvRow[] = [];

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < 2) continue;

    const rawDate = dateIdx >= 0 ? cols[dateIdx] : '';
    const rawDesc = descIdx >= 0 ? cols[descIdx] : 'Bank Transaction';
    
    let type: TransactionType = 'expense';
    let amount = 0;

    if (debitIdx >= 0 || creditIdx >= 0) {
      const debitVal = debitIdx >= 0 ? parseFloat(cols[debitIdx]?.replace(/[^0-9.-]/g, '') || '0') : 0;
      const creditVal = creditIdx >= 0 ? parseFloat(cols[creditIdx]?.replace(/[^0-9.-]/g, '') || '0') : 0;

      if (creditVal > 0) {
        type = 'income';
        amount = creditVal;
      } else if (debitVal > 0) {
        type = 'expense';
        amount = debitVal;
      }
    } else if (amountIdx >= 0) {
      const rawAmt = parseFloat(cols[amountIdx]?.replace(/[^0-9.-]/g, '') || '0');
      if (typeIdx >= 0) {
        const typeToken = cols[typeIdx]?.toLowerCase() || '';
        if (typeToken.includes('cr') || typeToken.includes('deposit')) {
          type = 'income';
        }
      } else if (rawAmt > 0 && cols[amountIdx]?.includes('+')) {
        type = 'income';
      }
      amount = Math.abs(rawAmt);
    }

    if (amount <= 0 || isNaN(amount)) continue;

    const cleanDate = normalizeDate(rawDate);
    const cleanDesc = rawDesc.replace(/\s+/g, ' ').trim() || 'Bank Transaction';
    const category = categorizeNarration(cleanDesc, type);

    let paymentMode: PaymentMode = 'NetBanking';
    if (cleanDesc.toLowerCase().includes('upi')) paymentMode = 'UPI';
    else if (cleanDesc.toLowerCase().includes('pos') || cleanDesc.toLowerCase().includes('card')) paymentMode = 'Debit Card';
    else if (cleanDesc.toLowerCase().includes('atm') || cleanDesc.toLowerCase().includes('cash')) paymentMode = 'Cash';

    parsedRows.push({
      id: `csv-${i}-${Date.now()}`,
      date: cleanDate,
      description: cleanDesc,
      amount,
      type,
      category,
      paymentMode,
      selected: true,
    });
  }

  return parsedRows;
}
