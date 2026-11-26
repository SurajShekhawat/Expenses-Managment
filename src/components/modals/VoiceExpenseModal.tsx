'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FinancialAccount, Transaction, ExpenseCategory, IncomeCategory, PaymentMode, TransactionType } from '@/types/finance';
import { parseVoiceExpense, ParsedVoiceResult } from '@/lib/voiceParser';
import { formatINR, getTodayDateString } from '@/lib/formatters';
import { Mic, MicOff, Sparkles, Check, X, AlertCircle, RefreshCw, Volume2 } from 'lucide-react';

interface VoiceExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: FinancialAccount[];
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
}

export function VoiceExpenseModal({
  isOpen,
  onClose,
  accounts,
  onAddTransaction,
}: VoiceExpenseModalProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsed, setParsed] = useState<ParsedVoiceResult | null>(null);
  const [language, setLanguage] = useState<'hi-IN' | 'en-IN'>('hi-IN');
  const [manualText, setManualText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Editable parsed values
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<string>('Other Expense');
  const [accountId, setAccountId] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const recognitionRef = useRef<any>(null);

  // Check speech recognition support
  const isSpeechSupported = typeof window !== 'undefined' && 
    (('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window));

  useEffect(() => {
    if (!isOpen) {
      stopListening();
      setTranscript('');
      setParsed(null);
      setManualText('');
      setErrorMsg(null);
    }
  }, [isOpen]);

  // Update editable fields when parsed result changes
  useEffect(() => {
    if (parsed) {
      setAmount(parsed.amount ? parsed.amount.toString() : '');
      setType(parsed.type);
      setCategory(parsed.category);
      setAccountId(parsed.accountId || (accounts[0]?.id || ''));
      setDescription(parsed.description);
    }
  }, [parsed, accounts]);

  const startListening = () => {
    setErrorMsg(null);
    if (!isSpeechSupported) {
      setErrorMsg('Aapke browser me voice recognition support nahi hai. Neeche text likh kar try karein.');
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        
        // Auto parse in real-time
        const res = parseVoiceExpense(currentTranscript, accounts);
        setParsed(res);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMsg('Microphone access allow karein browser settings me.');
        } else if (event.error === 'no-speech') {
          setErrorMsg('Aawaz detect nahi hui. Dubara mic daba kar boliye.');
        } else {
          setErrorMsg(`Voice error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: any) {
      setErrorMsg('Mic start karne me samasya aayi.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      setIsListening(false);
    }
  };

  const handleManualParse = () => {
    if (!manualText.trim()) return;
    setTranscript(manualText);
    const res = parseVoiceExpense(manualText, accounts);
    setParsed(res);
  };

  const handleConfirmAdd = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Kripya valid amount darj karein.');
      return;
    }

    const matchedAcc = accounts.find(a => a.id === accountId);
    let paymentMode: PaymentMode = 'UPI';
    if (matchedAcc?.accountType === 'credit_card') paymentMode = 'Credit Card';
    else if (matchedAcc?.accountType === 'cash') paymentMode = 'Cash';

    onAddTransaction({
      date: getTodayDateString(),
      amount: numAmount,
      type,
      category,
      paymentMode,
      accountId: accountId || undefined,
      description: description.trim() || (type === 'income' ? 'Income' : 'Kharcha'),
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#001D39]/40 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg glass-modal rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 pb-[max(1.5rem,calc(1rem+env(safe-area-inset-bottom,0px)))] max-h-[92vh] sm:max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 sm:fade-in duration-200">
        
        {/* Mobile Pull Indicator */}
        <div className="sm:hidden w-10 h-1 bg-[#BDD8E9] rounded-full mx-auto mb-2 opacity-80" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#BDD8E9]/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Voice-to-Expense Assistant</h2>
              <p className="text-xs text-slate-500">Bol kar kharcha ya income record karein</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Language selector & hint */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setLanguage('hi-IN')}
              className={`px-3 py-1 rounded-lg transition-all ${
                language === 'hi-IN' 
                  ? 'bg-white text-emerald-700 shadow-sm font-bold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🇮🇳 Hindi / Hinglish
            </button>
            <button
              onClick={() => setLanguage('en-IN')}
              className={`px-3 py-1 rounded-lg transition-all ${
                language === 'en-IN' 
                  ? 'bg-white text-emerald-700 shadow-sm font-bold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
          </div>

          <span className="text-[11px] text-slate-400 hidden sm:inline">
            e.g. &ldquo;Petrol 500 HDFC se&rdquo;
          </span>
        </div>

        {/* Central Animated Mic Button */}
        <div className="my-6 flex flex-col items-center justify-center">
          <div className="relative">
            {isListening && (
              <span className="absolute -inset-3 rounded-full bg-emerald-500/20 animate-ping" />
            )}
            <button
              onClick={isListening ? stopListening : startListening}
              className={`relative z-10 h-20 w-20 rounded-full flex items-center justify-center transition-all shadow-md ${
                isListening
                  ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isListening ? (
                <MicOff className="h-8 w-8" />
              ) : (
                <Mic className="h-8 w-8" />
              )}
            </button>
          </div>

          <p className="mt-3 text-xs font-semibold text-slate-700">
            {isListening ? (
              <span className="text-rose-600 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                Listening... Boliye abhi!
              </span>
            ) : (
              'Mic par tap karein aur boliye'
            )}
          </p>

          {/* Quick speech examples carousel/chips */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 max-w-sm">
            <button
              onClick={() => {
                setTranscript('Petrol 500 rupaye HDFC se');
                setParsed(parseVoiceExpense('Petrol 500 rupaye HDFC se', accounts));
              }}
              className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full transition-colors"
            >
              &ldquo;Petrol 500 rupaye HDFC&rdquo;
            </button>
            <button
              onClick={() => {
                setTranscript('Swiggy 350 rupaye Paytm');
                setParsed(parseVoiceExpense('Swiggy 350 rupaye Paytm', accounts));
              }}
              className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full transition-colors"
            >
              &ldquo;Swiggy 350 Paytm&rdquo;
            </button>
            <button
              onClick={() => {
                setTranscript('Salary 85000 credited SBI');
                setParsed(parseVoiceExpense('Salary 85000 credited SBI', accounts));
              }}
              className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full transition-colors"
            >
              &ldquo;Salary 85000 SBI&rdquo;
            </button>
          </div>
        </div>

        {/* Live transcript or text input fallback */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={isListening ? transcript : manualText || transcript}
              onChange={(e) => {
                setManualText(e.target.value);
                setTranscript(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleManualParse();
              }}
              placeholder={isListening ? 'Suni ja rahi aawaz...' : 'Ya yahan type karein: e.g. Groceries 1200 Cash...'}
              className="w-full pl-3.5 pr-20 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            {!isListening && (manualText || transcript) && (
              <button
                onClick={handleManualParse}
                className="absolute right-1.5 top-1.5 px-3 py-1 bg-slate-900 text-white rounded-lg text-[11px] font-semibold hover:bg-slate-800"
              >
                Parse
              </button>
            )}
          </div>

          {errorMsg && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-2 bg-rose-50 p-2 rounded-xl border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Parsed Result Preview & Confirmation Card */}
        {parsed && (
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                <Check className="h-3.5 w-3.5 text-emerald-600" /> Auto-Parsed Result:
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {type}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-0.5">Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-0.5">Account</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatINR(acc.balance, true)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-0.5">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-0.5">Description / Note</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              onClick={handleConfirmAdd}
              className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all"
            >
              <Check className="h-4 w-4" />
              <span>Confirm & Add {type === 'income' ? 'Income' : 'Kharcha'} ({formatINR(parseFloat(amount) || 0)})</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
