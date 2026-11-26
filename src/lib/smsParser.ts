import { TransactionType, PaymentMode, ExpenseCategory, IncomeCategory, FinancialAccount } from '@/types/finance';
import { getTodayDateString } from './formatters';

export interface ParsedSMSResult {
  amount: number;
  type: TransactionType;
  paymentMode: PaymentMode;
  category: ExpenseCategory | IncomeCategory | string;
  description: string;
  matchedAccountId?: string;
  date: string;
  confidence: 'high' | 'medium' | 'low';
}

export function parseIndianBankSMS(smsText: string, accounts: FinancialAccount[]): ParsedSMSResult | null {
  if (!smsText || typeof smsText !== 'string' || smsText.trim().length === 0) {
    return null;
  }

  const cleanText = smsText.replace(/[\r\n]+/g, ' ').trim();
  const lowerText = cleanText.toLowerCase();

  // 1. Determine Transaction Type
  let type: TransactionType = 'expense';
  if (
    lowerText.includes('credited') ||
    lowerText.includes('deposited') ||
    lowerText.includes('received') ||
    lowerText.includes('salary') ||
    lowerText.includes('refund')
  ) {
    type = 'income';
  }

  // 2. Extract Amount
  // Matches: INR 450, Rs. 1,499.50, ₹850, 450.00 debited, etc.
  let amount = 0;
  const amountRegexes = [
    /(?:inr|rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /([\d,]+(?:\.\d{1,2})?)\s*(?:inr|rs\.?|₹)/i,
    /(?:debited|spent|paid|credited)\s*(?:by|for|of)?\s*(?:inr|rs\.?|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
  ];

  for (const regex of amountRegexes) {
    const match = cleanText.match(regex);
    if (match && match[1]) {
      const cleanNumStr = match[1].replace(/,/g, '');
      const parsed = parseFloat(cleanNumStr);
      if (!isNaN(parsed) && parsed > 0) {
        amount = parsed;
        break;
      }
    }
  }

  if (amount <= 0) {
    return null;
  }

  // 3. Extract Payment Mode
  let paymentMode: PaymentMode = 'UPI';
  if (lowerText.includes('credit card') || lowerText.includes('creditcard') || lowerText.includes('card ending')) {
    paymentMode = 'Credit Card';
  } else if (lowerText.includes('debit card') || lowerText.includes('debitcard')) {
    paymentMode = 'Debit Card';
  } else if (lowerText.includes('upi') || lowerText.includes('vpa')) {
    paymentMode = 'UPI';
  } else if (lowerText.includes('neft') || lowerText.includes('rtgs') || lowerText.includes('imps') || lowerText.includes('netbanking')) {
    paymentMode = 'NetBanking';
  } else if (lowerText.includes('cash') || lowerText.includes('atm')) {
    paymentMode = 'Cash';
  }

  // 4. Try matching Account from last 4 digits
  let matchedAccountId: string | undefined = undefined;
  for (const acc of accounts) {
    if (acc.accountNumberMasked) {
      const digits = acc.accountNumberMasked.replace(/\D/g, '');
      if (digits.length >= 3 && cleanText.includes(digits)) {
        matchedAccountId = acc.id;
        break;
      }
    }
    // Match by name keyword e.g. "HDFC", "ICICI", "SBI"
    const bankName = acc.name.split(' ')[0].toLowerCase();
    if (bankName.length >= 3 && lowerText.includes(bankName)) {
      matchedAccountId = acc.id;
    }
  }

  // If no match found, fallback to primary or first bank account
  if (!matchedAccountId && accounts.length > 0) {
    const defaultAcc = accounts.find((a) => a.isPrimary) || accounts[0];
    matchedAccountId = defaultAcc?.id;
  }

  // 5. Extract Merchant & Auto-Guess Category
  let description = type === 'income' ? 'Income Credited' : 'Payment / Expense';
  let category: ExpenseCategory | IncomeCategory | string = type === 'income' ? 'Salary / Wages' : 'Other Expense';

  // Check merchant patterns e.g. "to Swiggy", "at Starbucks", "info VPA*swiggy@icici"
  const merchantMatch = 
    cleanText.match(/(?:to|at|info|vpa|paid to)\s+([A-Za-z0-9&.\-_/ ]{2,25})/i) ||
    cleanText.match(/(?:towards|for)\s+([A-Za-z0-9&.\-_/ ]{2,25})/i);

  if (merchantMatch && merchantMatch[1]) {
    const rawMerchant = merchantMatch[1].trim().split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
    if (rawMerchant.length >= 2) {
      description = rawMerchant.charAt(0).toUpperCase() + rawMerchant.slice(1);
    }
  }

  // Category mapping dictionary
  const lowerDesc = (description + ' ' + cleanText).toLowerCase();

  if (type === 'income') {
    if (lowerDesc.includes('salary') || lowerDesc.includes('payroll')) {
      category = 'Salary / Wages';
      description = 'Monthly Salary';
    } else if (lowerDesc.includes('dividend')) {
      category = 'Stock Dividend / Returns';
    } else if (lowerDesc.includes('cashback') || lowerDesc.includes('reward')) {
      category = 'Gift / Cashback';
    } else if (lowerDesc.includes('interest')) {
      category = 'Interest Income';
    } else {
      category = 'Other Income';
    }
  } else {
    if (
      lowerDesc.includes('swiggy') ||
      lowerDesc.includes('zomato') ||
      lowerDesc.includes('mcdonald') ||
      lowerDesc.includes('starbucks') ||
      lowerDesc.includes('kfc') ||
      lowerDesc.includes('domino') ||
      lowerDesc.includes('restaurant') ||
      lowerDesc.includes('cafe') ||
      lowerDesc.includes('dine')
    ) {
      category = 'Food & Dining';
    } else if (
      lowerDesc.includes('blinkit') ||
      lowerDesc.includes('zepto') ||
      lowerDesc.includes('instamart') ||
      lowerDesc.includes('bigbasket') ||
      lowerDesc.includes('dmart') ||
      lowerDesc.includes('grocery') ||
      lowerDesc.includes('supermarket') ||
      lowerDesc.includes('vegetable')
    ) {
      category = 'Groceries';
    } else if (
      lowerDesc.includes('amazon') ||
      lowerDesc.includes('flipkart') ||
      lowerDesc.includes('myntra') ||
      lowerDesc.includes('ajio') ||
      lowerDesc.includes('zara') ||
      lowerDesc.includes('h&m') ||
      lowerDesc.includes('shopping') ||
      lowerDesc.includes('nykaa')
    ) {
      category = 'Shopping & Lifestyle';
    } else if (
      lowerDesc.includes('uber') ||
      lowerDesc.includes('ola') ||
      lowerDesc.includes('rapido') ||
      lowerDesc.includes('metro') ||
      lowerDesc.includes('petrol') ||
      lowerDesc.includes('fuel') ||
      lowerDesc.includes('indianoil') ||
      lowerDesc.includes('bpcl') ||
      lowerDesc.includes('hpcl') ||
      lowerDesc.includes('irctc')
    ) {
      category = 'Transportation';
    } else if (
      lowerDesc.includes('netflix') ||
      lowerDesc.includes('spotify') ||
      lowerDesc.includes('hotstar') ||
      lowerDesc.includes('prime video') ||
      lowerDesc.includes('bookmyshow') ||
      lowerDesc.includes('pvr') ||
      lowerDesc.includes('inox')
    ) {
      category = 'Entertainment & Subscriptions';
    } else if (
      lowerDesc.includes('airtel') ||
      lowerDesc.includes('jio') ||
      lowerDesc.includes('electricity') ||
      lowerDesc.includes('bescom') ||
      lowerDesc.includes('broadband') ||
      lowerDesc.includes('wifi') ||
      lowerDesc.includes('water bill') ||
      lowerDesc.includes('gas bill')
    ) {
      category = 'Utilities & Bills';
    } else if (
      lowerDesc.includes('pharmacy') ||
      lowerDesc.includes('apollo') ||
      lowerDesc.includes('1mg') ||
      lowerDesc.includes('hospital') ||
      lowerDesc.includes('clinic') ||
      lowerDesc.includes('dr.') ||
      lowerDesc.includes('medplus')
    ) {
      category = 'Healthcare & Medical';
    } else if (lowerDesc.includes('rent') || lowerDesc.includes('landlord')) {
      category = 'Rent & Housing';
    } else if (lowerDesc.includes('emi') || lowerDesc.includes('loan')) {
      category = 'EMI & Debt Payment';
    } else {
      category = 'Other Expense';
    }
  }

  return {
    amount,
    type,
    paymentMode,
    category,
    description,
    matchedAccountId,
    date: getTodayDateString(),
    confidence: 'high',
  };
}
