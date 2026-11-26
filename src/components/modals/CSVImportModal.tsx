'use client';

import React, { useState } from 'react';
import { FinancialAccount, Transaction } from '@/types/finance';
import { parseBankCsv, ParsedCsvRow } from '@/lib/csvParser';
import { formatINR } from '@/lib/formatters';
import { FileSpreadsheet, Upload, Check, X, AlertCircle, FileText, CheckSquare, Square } from 'lucide-react';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: FinancialAccount[];
  onBulkAddTransactions: (transactions: Omit<Transaction, 'id'>[], accountId: string) => void;
}

export function CSVImportModal({
  isOpen,
  onClose,
  accounts,
  onBulkAddTransactions,
}: CSVImportModalProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [parsedRows, setParsedRows] = useState<ParsedCsvRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = parseBankCsv(text);
        if (rows.length === 0) {
          setErrorMsg('CSV file me koi valid transactions detect nahi huye. Format check karein.');
        } else {
          setParsedRows(rows);
        }
      } catch (err: any) {
        setErrorMsg('File parse karne me samasya aayi: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const loadSampleData = () => {
    const sample = `Date,Narration,Withdrawal,Deposit,Balance
2026-11-01,SALARY CREDIT NOV 2026,,85000,92450
2026-11-03,UPI-SWIGGY FOOD ORDER-BANGALORE,450,,92000
2026-11-05,HPCL PETROL PUMP MUMBAI,1800,,90200
2026-11-08,BLINKIT GROCERY PURCHASE,1250,,88950
2026-11-10,ELECTRICITY BILL PAYMENT BESCOM,2400,,86550
2026-11-15,NETFLIX RECURRING SUBSCRIPTION,649,,85901`;
    setFileName('Sample_Bank_Statement.csv');
    setParsedRows(parseBankCsv(sample));
  };

  const toggleSelectRow = (id: string) => {
    setParsedRows(prev =>
      prev.map(r => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  };

  const toggleSelectAll = () => {
    const allSelected = parsedRows.every(r => r.selected);
    setParsedRows(prev => prev.map(r => ({ ...r, selected: !allSelected })));
  };

  const selectedRows = parsedRows.filter(r => r.selected);
  const totalExpense = selectedRows
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + r.amount, 0);
  const totalIncome = selectedRows
    .filter(r => r.type === 'income')
    .reduce((sum, r) => sum + r.amount, 0);

  const handleConfirmImport = () => {
    if (selectedRows.length === 0) {
      setErrorMsg('Kam se kam 1 transaction select karein.');
      return;
    }
    if (!selectedAccountId) {
      setErrorMsg('Kripya target bank account select karein.');
      return;
    }

    const payload: Omit<Transaction, 'id'>[] = selectedRows.map(r => ({
      date: r.date,
      amount: r.amount,
      type: r.type,
      category: r.category,
      paymentMode: r.paymentMode,
      accountId: selectedAccountId,
      description: r.description,
    }));

    onBulkAddTransactions(payload, selectedAccountId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#001D39]/40 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-3xl glass-modal rounded-t-2xl sm:rounded-xl p-4 sm:p-6 pb-[max(1.5rem,calc(1rem+env(safe-area-inset-bottom,0px)))] max-h-[92vh] sm:max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-4 sm:fade-in duration-200">
        
        {/* Mobile Pull Indicator */}
        <div className="sm:hidden w-10 h-1 bg-[#BDD8E9] rounded-full mx-auto mb-2 opacity-80" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#BDD8E9]/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Import Bank CSV Statement</h2>
              <p className="text-xs text-slate-500">HDFC, SBI, ICICI ya kisi bhi bank ka CSV upload karein</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Account Selector & Upload Area */}
        <div className="mt-4 shrink-0 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Target Bank Account
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({formatINR(acc.balance, true)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <div className="relative flex-1">
                <input
                  type="file"
                  accept=".csv,.txt"
                  id="csv-file-input"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="csv-file-input"
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/40 text-xs font-bold text-slate-700 cursor-pointer transition"
                >
                  <Upload className="h-4 w-4 text-blue-600" />
                  <span>{fileName ? fileName : 'Upload .CSV File'}</span>
                </label>
              </div>

              <button
                type="button"
                onClick={loadSampleData}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition"
                title="Test with pre-filled sample bank statement"
              >
                Test Sample
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 p-2 rounded-xl border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Parsed Preview Table */}
        {parsedRows.length > 0 && (
          <div className="mt-4 flex-1 flex flex-col min-h-0 border border-slate-200 rounded-2xl overflow-hidden">
            {/* Table Header Summary */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-1.5 font-bold text-slate-700 hover:text-slate-900"
                >
                  {parsedRows.every(r => r.selected) ? (
                    <CheckSquare className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Square className="h-4 w-4 text-slate-400" />
                  )}
                  <span>{selectedRows.length} of {parsedRows.length} Selected</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-emerald-700 font-bold">
                  + Income: {formatINR(totalIncome)}
                </span>
                <span className="text-rose-700 font-bold">
                  - Kharcha: {formatINR(totalExpense)}
                </span>
              </div>
            </div>

            {/* Scrollable Rows */}
            <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
              {parsedRows.map((row) => (
                <div
                  key={row.id}
                  onClick={() => toggleSelectRow(row.id)}
                  className={`p-3 flex items-center justify-between gap-3 text-xs cursor-pointer transition ${
                    row.selected ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={row.selected}
                      onChange={() => toggleSelectRow(row.id)}
                      className="rounded text-emerald-600 focus:ring-0 cursor-pointer h-4 w-4"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate max-w-sm">
                        {row.description}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span>{row.date}</span>
                        <span>•</span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                          {row.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`font-black text-sm block ${
                      row.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
                    }`}>
                      {row.type === 'income' ? '+' : '-'}{formatINR(row.amount)}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {row.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Cancel
          </button>

          {parsedRows.length > 0 && (
            <button
              onClick={handleConfirmImport}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition active:scale-95"
            >
              <Check className="h-4 w-4" />
              <span>Import {selectedRows.length} Transactions into {accounts.find(a => a.id === selectedAccountId)?.name || 'Account'}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
