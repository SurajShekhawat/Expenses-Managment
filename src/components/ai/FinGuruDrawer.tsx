'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  X, 
  Minimize2, 
  RefreshCw, 
  DollarSign, 
  ShieldCheck, 
  TrendingUp,
  HelpCircle,
  Lightbulb,
  Key,
  Check
} from 'lucide-react';
import { FinancialData } from '@/types/finance';
import { formatINR } from '@/lib/formatters';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface FinGuruDrawerProps {
  data: FinancialData;
  userName?: string;
}

const QUICK_PROMPTS = [
  'Mere loans aur karz jaldi khatam karne ka plan btao',
  'Is mahine ke kharche par aapka kya analysis hai?',
  'Old vs New Tax Regime: mere liye kaunsa better hai?',
  'Emergency Fund kitna hona chahiye aur SIP kaise badhayein?'
];

export const FinGuruDrawer: React.FC<FinGuruDrawerProps> = ({ data, userName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isKeyConfigOpen, setIsKeyConfigOpen] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Namaste ${userName || 'Dost'}! 🙏 Main hoon **FinGuru**, aapka personal AI Chartered Accountant (CA) aur Wealth Advisor.\n\nAapke FinGroww dashboard se connected hoon. Poochiye koi bhi sawaal - Tax, Investments, Budget ya Loan prepayment ke baare me!`,
      timestamp: 'Just now',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('fingroww_gemini_key') || '';
      setApiKey(savedKey);
      setKeyInput(savedKey);

      const handleOpenEvent = () => setIsOpen(true);
      window.addEventListener('open_finguru', handleOpenEvent);
      return () => window.removeEventListener('open_finguru', handleOpenEvent);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fingroww_gemini_key', keyInput.trim());
      setApiKey(keyInput.trim());
      setIsKeyConfigOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Compute financial context summary to pass to FinGuru
  const getFinancialContext = () => {
    const liquidCash = data.accounts
      .filter((a) => a.accountType !== 'credit_card')
      .reduce((acc, a) => acc + a.balance, 0);

    const totalInvestments = data.investments.reduce((acc, i) => acc + i.currentValue, 0);
    const totalDebt = data.loans.filter((l) => l.direction === 'i_owe').reduce((acc, l) => acc + l.remainingBalance, 0);
    const netWorth = liquidCash + totalInvestments - totalDebt;

    const totalIncome = data.transactions
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0) || 85000;

    const totalExpense = data.transactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0) || 45000;

    const savingsRate = totalIncome > 0 ? Math.max(0, (totalIncome - totalExpense) / totalIncome) * 100 : 0;
    const emergencyRunwayMonths = totalExpense > 0 ? liquidCash / totalExpense : 0;

    // Top categories
    const catMap: Record<string, number> = {};
    data.transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
      });

    const topExpenseCategories = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([category, amount]) => ({ category, amount }));

    const activeLoans = data.loans
      .filter((l) => l.direction === 'i_owe' && l.remainingBalance > 0)
      .map((l) => ({ name: l.title, remaining: l.remainingBalance, emi: l.monthlyEmi }));

    return {
      netWorth,
      liquidCash,
      totalInvestments,
      totalDebt,
      monthlyIncome: totalIncome,
      monthlyExpense: totalExpense,
      savingsRate,
      emergencyRunwayMonths,
      topExpenseCategories,
      activeLoans,
      userName,
    };
  };

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSend,
          context: getFinancialContext(),
          apiKey: apiKey.trim() || undefined,
        }),
      });

      const result = await res.json();
      const replyText = result.reply || 'Maaf kijiyega, main abhi response process nahi kar pa raha hoon.';

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'Connection me thodi dikkat aayi. Kripya dobara try karein.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating FinGuru Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 left-4 md:bottom-6 md:right-6 md:left-auto z-40 group flex items-center gap-2.5 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-full bg-[#001D39] text-white shadow-2xl shadow-[#001D39]/40 hover:scale-105 active:scale-95 transition-all duration-300 border border-[#7BBDE8]/40"
          title="Open FinGuru AI CA"
        >
          <div className="relative">
            <div className="p-1.5 rounded-full bg-[#7BBDE8] text-[#001D39]">
              <Bot className="h-5 w-5" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7BBDE8] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#7BBDE8]" />
            </span>
          </div>

          <div className="text-left">
            <span className="text-xs font-black tracking-wide flex items-center gap-1 text-white">
              FinGuru <Sparkles className="h-3 w-3 text-[#7BBDE8] fill-[#7BBDE8]" />
            </span>
            <span className="text-[10px] text-[#BDD8E9] font-bold block sm:inline">AI Advisor</span>
          </div>
        </button>
      )}

      {/* Slide-out Drawer */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-white shadow-2xl z-50 flex flex-col border-l border-[#BDD8E9]/60 animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-4 bg-[#001D39] text-white flex items-center justify-between border-b border-[#49769F]/40">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#0A4174] text-[#BDD8E9] shadow-xs">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-black text-white">FinGuru AI</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#BDD8E9]/20 text-[#BDD8E9] border border-[#BDD8E9]/30 font-bold">
                    CA Edition
                  </span>
                </div>
                <p className="text-[11px] text-[#BDD8E9]/80 flex items-center gap-1 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#7BBDE8] animate-pulse" />
                  Live synced with your finances
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsKeyConfigOpen(!isKeyConfigOpen)}
                className={`p-1.5 rounded-lg transition text-xs flex items-center gap-1 ${
                  apiKey 
                    ? 'bg-[#7BBDE8]/25 text-[#BDD8E9] hover:bg-[#7BBDE8]/35' 
                    : 'text-[#7BBDE8] hover:bg-white/10'
                }`}
                title="Gemini API Key Settings"
              >
                <Key className="h-4 w-4" />
                {apiKey ? <span className="text-[10px] font-bold">Live AI</span> : <span className="text-[10px] font-bold">API Key</span>}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* API Key Collapsible Config Banner */}
          {isKeyConfigOpen && (
            <div className="p-3.5 bg-slate-900 border-b border-emerald-500/20 text-white space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5" /> Google Gemini API Key
                </span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-emerald-300 underline hover:text-white"
                >
                  Get Free Key ↗
                </a>
              </div>
              <p className="text-[11px] text-slate-400">
                Google AI Studio se free API key lekar yahan daalein taaki Gemini 2.0 Flash ka full generative power mile.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  onClick={handleSaveApiKey}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1"
                >
                  <Check className="h-3.5 w-3.5" />
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Quick Stats Pill */}
          <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-[11px] font-semibold text-slate-600">
            <span>Net Worth: <strong className="text-slate-900">{formatINR(getFinancialContext().netWorth)}</strong></span>
            <span>Savings Rate: <strong className="text-emerald-700">{getFinancialContext().savingsRate.toFixed(1)}%</strong></span>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap ${
                    m.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-xs shadow-xs font-medium'
                      : 'bg-white text-slate-800 rounded-bl-xs border border-slate-200/80 shadow-xs'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {m.timestamp}
                </span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-white border border-slate-200 w-fit">
                <div className="h-3.5 w-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-500 font-medium">FinGuru is analyzing your finances...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="p-2.5 bg-white border-t border-slate-100 flex gap-2 overflow-x-auto no-scrollbar">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200/80 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Lightbulb className="h-3 w-3 text-amber-500" />
                <span>{prompt}</span>
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="FinGuru se poochein (e.g. loan prepayment advice)..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              disabled={isLoading}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#BDD8E9]/70 bg-slate-50 text-xs text-[#001D39] focus:outline-none focus:ring-2 focus:ring-[#4E8EA2] font-medium"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isLoading}
              className="p-2.5 rounded-xl bg-[#0A4174] hover:bg-[#001D39] text-white transition disabled:opacity-40 cursor-pointer shadow-xs"
            >
              <Send className="h-4 w-4 text-[#BDD8E9]" />
            </button>
          </form>

        </div>
      )}
    </>
  );
};
