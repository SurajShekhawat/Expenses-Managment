import { NextRequest, NextResponse } from 'next/server';

interface FinContext {
  netWorth: number;
  liquidCash: number;
  totalInvestments: number;
  totalDebt: number;
  monthlyIncome: number;
  monthlyExpense: number;
  savingsRate: number;
  emergencyRunwayMonths: number;
  topExpenseCategories: { category: string; amount: number }[];
  activeLoans: { name: string; remaining: number; emi: number }[];
  userName?: string;
}

function generateLocalCAAdvice(query: string, context: FinContext): string {
  const q = query.toLowerCase();
  const name = context.userName || 'Dost';

  // 1. Debt & Loans queries
  if (q.includes('loan') || q.includes('karz') || q.includes('emi') || q.includes('debt')) {
    if (context.totalDebt === 0) {
      return `Namaste ${name}! Badhai ho, aapke paas abhi koi active loan ya karz nahi hai. Aap Debt-Free hain! Mera sujhav hai ki jo paise EMI me jaate, unhe index mutual funds ya SIPs me invest karein.`;
    }
    const loanList = context.activeLoans.map(l => `• ${l.name}: ₹${l.remaining.toLocaleString('en-IN')} (EMI: ₹${l.emi.toLocaleString('en-IN')})`).join('\n');
    return `Namaste ${name}! Aapka total pending debt ₹${context.totalDebt.toLocaleString('en-IN')} hai.\n\nActive Loans:\n${loanList}\n\n💡 **AI CA Advice (Debt Snowball/Avalanche)**:\n1. Sabse pehle jis loan ka interest rate sabse high hai (e.g. Credit Card ya Personal Loan), us par 10-20% extra prepayment karein.\n2. Isse aapka interest cost kam se kam 30-40% bach jayega aur loan saalon pehle khatam ho jayega.`;
  }

  // 2. Budget & Expense queries
  if (q.includes('kharcha') || q.includes('expense') || q.includes('budget') || q.includes('spend')) {
    const topCats = context.topExpenseCategories.map(c => `• ${c.category}: ₹${c.amount.toLocaleString('en-IN')}`).join('\n');
    return `Namaste ${name}! Is mahine aapka total kharcha lagbhag ₹${context.monthlyExpense.toLocaleString('en-IN')} raha hai.\n\nTop Spending Categories:\n${topCats || 'Koi expense record nahi mila'}\n\n💡 **AI CA Recommendation**:\n1. 50-30-20 rule follow karein: Aamdani ka 50% zaroori kharchon (rent, groceries) par, 30% lifestyle par, aur kam se kam 20% savings/investments me jana chahiye.\n2. Aapki current Savings Rate ${context.savingsRate.toFixed(1)}% hai${context.savingsRate >= 30 ? ' - Bahut badhiya discipline! 👏' : ' - Ise 30% tak le jane ki koshish karein.'}`;
  }

  // 3. Tax saving queries
  if (q.includes('tax') || q.includes('80c') || q.includes('regime') || q.includes('save tax')) {
    return `Namaste ${name}! FY 2026-27 ke rules ke hisaab se:\n\n1. **New Tax Regime**: Isme ₹75,000 ka standard deduction milta hai aur Section 87A rebate ke sath ₹7.75 Lakhs tak ki CTC par ZERO tax banta hai.\n2. **Old Tax Regime**: Agar aapke paas Home Loan interest (Section 24b up to ₹2L), HRA, PPF/ELSS (80C up to ₹1.5L) aur Health Insurance (80D up to ₹25k) ke deductions hain, tabhi Old Regime faydemand hota hai.\n\n💡 FinGroww ke **Insurance & Tax** tab me jaakar live calculator me apna CTC slide karke exact savings dekhein!`;
  }

  // 4. Investment / FIRE / Savings queries
  if (q.includes('sip') || q.includes('invest') || q.includes('fire') || q.includes('retire') || q.includes('wealth')) {
    return `Namaste ${name}! Aapka total investment portfolio ₹${context.totalInvestments.toLocaleString('en-IN')} aur net worth ₹${context.netWorth.toLocaleString('en-IN')} hai.\n\n💡 **Wealth Creation Strategy**:\n1. **Emergency Runway**: Aapke paas abhi ${context.emergencyRunwayMonths.toFixed(1)} mahine ka cash backup hai. Minimum 6 mahine ka reserve bank FD ya liquid funds me rakhein.\n2. **Compounding SIP**: Har saal apni monthly SIP ko 10% step-up karein. Agar aap Nifty 50 Index fund me invest karte hain, toh 12-14% CAGR compounding ke sath aapka FIRE target 5 saal pehle achieve ho sakta hai!`;
  }

  // Generic comprehensive CA summary
  return `Namaste ${name}! Main hoon aapka AI CA & Financial Guru FinGroww par. 📊\n\n**Aapka Financial Snapshot**:\n• Net Worth: ₹${context.netWorth.toLocaleString('en-IN')}\n• Liquid Cash: ₹${context.liquidCash.toLocaleString('en-IN')} (${context.emergencyRunwayMonths.toFixed(1)} mahine ka kharcha)\n• Monthly Kharcha: ₹${context.monthlyExpense.toLocaleString('en-IN')}\n• Active Loans: ₹${context.totalDebt.toLocaleString('en-IN')}\n• Savings Rate: ${context.savingsRate.toFixed(1)}%\n\nAap mujhse kisi bhi cheez par advice le sakte hain:\n- "Mere loans jaldi chukane ka plan kya hona chahiye?"\n- "Old vs New tax regime me mere liye kaunsa better hai?"\n- "Emergency fund kitna hona chahiye?"`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, context, history, apiKey: clientApiKey } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const finContext: FinContext = context || {
      netWorth: 0,
      liquidCash: 0,
      totalInvestments: 0,
      totalDebt: 0,
      monthlyIncome: 0,
      monthlyExpense: 0,
      savingsRate: 0,
      emergencyRunwayMonths: 0,
      topExpenseCategories: [],
      activeLoans: [],
    };

    const apiKey = clientApiKey || process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const systemPrompt = `You are FinGuru, a prestigious, highly experienced Indian Chartered Accountant (CA) and CFP (Certified Financial Planner) embedded in the FinGroww financial dashboard app.
Your tone is respectful, encouraging, practical, and conversational in friendly Hinglish (Hindi written in Roman English with key Hindi terms).
You have real-time visibility into the user's financial metrics:
- User Name: ${finContext.userName || 'Investor'}
- Net Worth: ₹${finContext.netWorth.toLocaleString('en-IN')}
- Liquid Cash: ₹${finContext.liquidCash.toLocaleString('en-IN')} (${finContext.emergencyRunwayMonths.toFixed(1)} months expense runway)
- Monthly Income: ₹${finContext.monthlyIncome.toLocaleString('en-IN')}
- Monthly Expenses: ₹${finContext.monthlyExpense.toLocaleString('en-IN')}
- Savings Rate: ${finContext.savingsRate.toFixed(1)}%
- Total Debt/Loans: ₹${finContext.totalDebt.toLocaleString('en-IN')}
- Top Expense Categories: ${finContext.topExpenseCategories.map(c => `${c.category}: ₹${c.amount}`).join(', ')}
- Active Loans: ${finContext.activeLoans.map(l => `${l.name}: ₹${l.remaining}`).join(', ')}

Guidelines:
1. Provide accurate, mathematically disciplined financial guidance tailored specifically to their figures.
2. Comply with Indian taxation (FY 2026-27: Standard deduction ₹75,000 in New Regime, 87A rebate up to 7L taxable, 80C/80D, Section 24b).
3. Do not invent fake stock tips or guarantee get-rich-quick schemes.
4. Keep answers crisp, readable with bullet points and emojis.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: `${systemPrompt}\n\nUser Question: ${query}` }],
                },
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 800,
              },
            }),
          }
        );

        if (response.ok) {
          const geminiData = await response.json();
          const reply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            return NextResponse.json({ reply, source: 'gemini' });
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini API call failed, falling back to local CA engine:', geminiErr);
      }
    }

    // Fallback to local intelligent CA Engine
    const localReply = generateLocalCAAdvice(query, finContext);
    return NextResponse.json({ reply: localReply, source: 'local_engine' });
  } catch (error: any) {
    console.error('Advisor error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
