import { ExpenseCategory, IncomeCategory, FinancialAccount, TransactionType, PaymentMode } from '@/types/finance';

export interface ParsedVoiceResult {
  transcript: string;
  type: TransactionType;
  amount: number | null;
  category: ExpenseCategory | IncomeCategory | string;
  paymentMode: PaymentMode;
  accountId?: string;
  accountName?: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
}

// Convert common Hindi words for numbers to digits if spoken as words
const HINDI_NUMBER_WORDS: Record<string, number> = {
  'ek': 1,
  'do': 2,
  'teen': 3,
  'char': 4,
  'chaar': 4,
  'panch': 5,
  'paanch': 5,
  'che': 6,
  'chhe': 6,
  'sat': 7,
  'saat': 7,
  'aath': 8,
  'ath': 8,
  'nau': 9,
  'dus': 10,
  'das': 10,
  'sau': 100,
  'so': 100,
  'hazar': 1000,
  'hazaar': 1000,
  'lakh': 100000,
  'lac': 100000,
  'crore': 10000000,
  'karor': 10000000,
};

export function parseVoiceExpense(rawText: string, accounts: FinancialAccount[]): ParsedVoiceResult {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  // 1. Determine Type (Expense vs Income)
  let type: TransactionType = 'expense';
  const incomeKeywords = ['salary', 'tankhwah', 'credited', 'received', 'mila', 'aayi', 'aaya', 'bonus', 'freelance', 'dividend', 'cashback', 'income'];
  const isIncome = incomeKeywords.some(kw => lower.includes(kw));
  if (isIncome) {
    type = 'income';
  }

  // 2. Extract Amount
  let amount: number | null = null;
  // Match standard numbers: 500, 1500.50, 50k, 1.5 lakh
  const numRegex = /(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(k|hazar|hazaar|thousand|lakh|lac|crore|cr)?\b/i;
  const match = lower.match(numRegex);

  if (match) {
    let baseVal = parseFloat(match[1].replace(/,/g, ''));
    const multiplier = match[2]?.toLowerCase();
    if (multiplier === 'k' || multiplier === 'hazar' || multiplier === 'hazaar' || multiplier === 'thousand') {
      baseVal *= 1000;
    } else if (multiplier === 'lakh' || multiplier === 'lac') {
      baseVal *= 100000;
    } else if (multiplier === 'crore' || multiplier === 'cr') {
      baseVal *= 10000000;
    }
    amount = baseVal;
  } else {
    // Check for "panch sau" / "das hazar"
    const words = lower.split(/\s+/);
    for (let i = 0; i < words.length - 1; i++) {
      const w1 = words[i];
      const w2 = words[i + 1];
      if (HINDI_NUMBER_WORDS[w1] && HINDI_NUMBER_WORDS[w2]) {
        amount = HINDI_NUMBER_WORDS[w1] * HINDI_NUMBER_WORDS[w2];
        break;
      }
    }
    if (!amount) {
      for (const w of words) {
        if (HINDI_NUMBER_WORDS[w] && HINDI_NUMBER_WORDS[w] >= 100) {
          amount = HINDI_NUMBER_WORDS[w];
          break;
        }
      }
    }
  }

  // 3. Match Account
  let matchedAccountId: string | undefined = undefined;
  let matchedAccountName: string | undefined = undefined;
  let paymentMode: PaymentMode = 'UPI';

  // Check user accounts
  for (const acc of accounts) {
    const accNameLower = acc.name.toLowerCase();
    const cleanTokens = accNameLower.split(/[\s()/-]+/).filter(t => t.length > 2);
    
    // Check if whole name or distinct token is present
    const hasMatch = cleanTokens.some(tok => lower.includes(tok));
    if (hasMatch) {
      matchedAccountId = acc.id;
      matchedAccountName = acc.name;
      if (acc.accountType === 'credit_card') paymentMode = 'Credit Card';
      else if (acc.accountType === 'cash') paymentMode = 'Cash';
      else if (acc.accountType === 'wallet') paymentMode = 'UPI';
      break;
    }
  }

  // Fallback payment mode if mentioned in voice
  if (lower.includes('cash') || lower.includes('nagad')) {
    paymentMode = 'Cash';
    const cashAcc = accounts.find(a => a.accountType === 'cash');
    if (cashAcc) {
      matchedAccountId = cashAcc.id;
      matchedAccountName = cashAcc.name;
    }
  } else if (lower.includes('credit card') || lower.includes('card se')) {
    paymentMode = 'Credit Card';
    const ccAcc = accounts.find(a => a.accountType === 'credit_card');
    if (ccAcc && !matchedAccountId) {
      matchedAccountId = ccAcc.id;
      matchedAccountName = ccAcc.name;
    }
  } else if (lower.includes('upi') || lower.includes('phonepe') || lower.includes('gpay') || lower.includes('google pay') || lower.includes('paytm')) {
    paymentMode = 'UPI';
  }

  // If still no account, default to primary bank account or first account
  if (!matchedAccountId && accounts.length > 0) {
    const primary = accounts.find(a => a.isPrimary) || accounts[0];
    matchedAccountId = primary.id;
    matchedAccountName = primary.name;
  }

  // 4. Categorization
  let category: ExpenseCategory | IncomeCategory | string = type === 'income' ? 'Other Income' : 'Other Expense';
  let description = text;

  if (type === 'income') {
    if (lower.includes('salary') || lower.includes('tankhwah')) category = 'Salary / Wages';
    else if (lower.includes('freelance') || lower.includes('client') || lower.includes('project')) category = 'Business / Freelance';
    else if (lower.includes('dividend') || lower.includes('stock')) category = 'Stock Dividend / Returns';
    else if (lower.includes('rent') || lower.includes('kiraya')) category = 'Rental Income';
    else if (lower.includes('cashback') || lower.includes('reward')) category = 'Gift / Cashback';
    else if (lower.includes('interest') || lower.includes('byaaj')) category = 'Interest Income';
  } else {
    if (lower.includes('petrol') || lower.includes('diesel') || lower.includes('fuel') || lower.includes('uber') || lower.includes('ola') || lower.includes('auto') || lower.includes('metro') || lower.includes('cab')) {
      category = 'Transportation';
    } else if (lower.includes('swiggy') || lower.includes('zomato') || lower.includes('dinner') || lower.includes('lunch') || lower.includes('khana') || lower.includes('chai') || lower.includes('coffee') || lower.includes('restaurant') || lower.includes('burger') || lower.includes('pizza') || lower.includes('food')) {
      category = 'Food & Dining';
    } else if (lower.includes('blinkit') || lower.includes('zepto') || lower.includes('instamart') || lower.includes('groceries') || lower.includes('rashan') || lower.includes('sabzi') || lower.includes('doodh') || lower.includes('milk') || lower.includes('fruit')) {
      category = 'Groceries';
    } else if (lower.includes('recharge') || lower.includes('bijli') || lower.includes('electricity') || lower.includes('bill') || lower.includes('water') || lower.includes('wifi') || lower.includes('broadband')) {
      category = 'Utilities & Bills';
    } else if (lower.includes('rent') || lower.includes('kiraya') || lower.includes('flat') || lower.includes('maintenance')) {
      category = 'Rent & Housing';
    } else if (lower.includes('amazon') || lower.includes('flipkart') || lower.includes('myntra') || lower.includes('shopping') || lower.includes('clothes') || lower.includes('shoes')) {
      category = 'Shopping & Lifestyle';
    } else if (lower.includes('movie') || lower.includes('netflix') || lower.includes('cinema') || lower.includes('hotstar') || lower.includes('prime') || lower.includes('game')) {
      category = 'Entertainment & Subscriptions';
    } else if (lower.includes('medicine') || lower.includes('dawa') || lower.includes('doctor') || lower.includes('hospital') || lower.includes('medical') || lower.includes('clinic')) {
      category = 'Healthcare & Medical';
    } else if (lower.includes('emi') || lower.includes('loan') || lower.includes('installment') || lower.includes('kist')) {
      category = 'EMI & Debt Payment';
    } else if (lower.includes('flight') || lower.includes('hotel') || lower.includes('trip') || lower.includes('train') || lower.includes('irctc')) {
      category = 'Travel & Vacation';
    }
  }

  // Generate crisp description
  description = text
    .replace(/(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(k|hazar|thousand|lakh|lac|crore|cr)?/gi, '')
    .replace(/(?:se|ko|par|pe|from|to|rupaye|rupees|rs)\b/gi, '')
    .trim();
  if (!description || description.length < 2) {
    description = category.toString();
  }

  const confidence: 'high' | 'medium' | 'low' = amount && matchedAccountId ? 'high' : amount ? 'medium' : 'low';

  return {
    transcript: text,
    type,
    amount,
    category,
    paymentMode,
    accountId: matchedAccountId,
    accountName: matchedAccountName,
    description: description.charAt(0).toUpperCase() + description.slice(1),
    confidence,
  };
}
