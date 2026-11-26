'use client';

import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Plus, 
  Calculator, 
  Trash2, 
  PieChart as PieIcon,
  Search,
  Filter,
  ArrowUpDown,
  X,
  Pencil
} from 'lucide-react';
import { FinancialData, AssetType, Investment } from '@/types/finance';
import { formatINR, formatPercent } from '@/lib/formatters';
import { EditInvestmentModal } from '@/components/modals/EditInvestmentModal';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface InvestmentsTabProps {
  data: FinancialData;
  onOpenAddModal: (type: 'investment') => void;
  onDeleteInvestment: (id: string) => void;
  onUpdateInvestment?: (inv: Investment) => void;
}

const ASSET_COLORS: Record<AssetType, string> = {
  mutual_funds: '#10b981',
  stocks: '#3b82f6',
  gold: '#f59e0b',
  fixed_deposit: '#06b6d4',
  ppf_epf: '#8b5cf6',
  crypto: '#ec4899',
  real_estate: '#f97316',
  other: '#64748b',
};

const ASSET_LABELS: Record<AssetType, string> = {
  mutual_funds: 'Mutual Funds',
  stocks: 'Stocks & Equities',
  gold: 'Gold & SGBs',
  fixed_deposit: 'Fixed Deposits',
  ppf_epf: 'PPF / EPF Debt',
  crypto: 'Crypto Currency',
  real_estate: 'Real Estate',
  other: 'Other Assets',
};

type InvSortOption = 'value_desc' | 'value_asc' | 'pnl_desc' | 'pnl_asc' | 'name_asc';

export const InvestmentsTab: React.FC<InvestmentsTabProps> = ({
  data,
  onOpenAddModal,
  onDeleteInvestment,
  onUpdateInvestment,
}) => {
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [sipMonthly, setSipMonthly] = useState<number>(15000);
  const [sipReturnRate, setSipReturnRate] = useState<number>(13.5);
  const [sipYears, setSipYears] = useState<number>(10);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>('all');
  const [pnlFilter, setPnlFilter] = useState<'all' | 'profit' | 'loss'>('all');
  const [sipFilter, setSipFilter] = useState<'all' | 'sip_only' | 'lumpsum_only'>('all');
  const [sortBy, setSortBy] = useState<InvSortOption>('value_desc');

  const totalInvested = data.investments.reduce((acc, inv) => acc + inv.investedAmount, 0);
  const totalCurrent = data.investments.reduce((acc, inv) => acc + inv.currentValue, 0);
  const totalProfit = totalCurrent - totalInvested;
  const overallReturn = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
  const activeMonthlySip = data.investments.reduce((acc, inv) => acc + (inv.sipMonthlyAmount || 0), 0);

  const assetBreakdown = useMemo(() => {
    const map: Record<string, { value: number; color: string; label: string }> = {};
    data.investments.forEach((inv) => {
      const type = inv.assetType;
      if (!map[type]) {
        map[type] = {
          value: 0,
          color: ASSET_COLORS[type] || '#64748b',
          label: ASSET_LABELS[type] || type,
        };
      }
      map[type].value += inv.currentValue;
    });
    return Object.values(map);
  }, [data.investments]);

  // Filtered and sorted holdings
  const filteredInvestments = useMemo(() => {
    return data.investments.filter((inv) => {
      // 1. Search filter
      const matchesSearch = 
        !searchTerm.trim() ||
        inv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.symbolOrPlatform && inv.symbolOrPlatform.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (inv.notes && inv.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      // 2. Asset Type filter
      const matchesType = assetTypeFilter === 'all' || inv.assetType === assetTypeFilter;

      // 3. Profit / Loss filter
      const pnl = inv.currentValue - inv.investedAmount;
      let matchesPnl = true;
      if (pnlFilter === 'profit') matchesPnl = pnl >= 0;
      if (pnlFilter === 'loss') matchesPnl = pnl < 0;

      // 4. SIP filter
      let matchesSip = true;
      if (sipFilter === 'sip_only') matchesSip = !!inv.sipMonthlyAmount && inv.sipMonthlyAmount > 0;
      if (sipFilter === 'lumpsum_only') matchesSip = !inv.sipMonthlyAmount || inv.sipMonthlyAmount === 0;

      return matchesSearch && matchesType && matchesPnl && matchesSip;
    }).sort((a, b) => {
      const pnlA = a.currentValue - a.investedAmount;
      const pnlB = b.currentValue - b.investedAmount;

      if (sortBy === 'value_desc') return b.currentValue - a.currentValue;
      if (sortBy === 'value_asc') return a.currentValue - b.currentValue;
      if (sortBy === 'pnl_desc') return pnlB - pnlA;
      if (sortBy === 'pnl_asc') return pnlA - pnlB;
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [data.investments, searchTerm, assetTypeFilter, pnlFilter, sipFilter, sortBy]);

  const activeFilterCount = (assetTypeFilter !== 'all' ? 1 : 0) +
    (pnlFilter !== 'all' ? 1 : 0) +
    (sipFilter !== 'all' ? 1 : 0) +
    (searchTerm ? 1 : 0);

  const handleResetFilters = () => {
    setSearchTerm('');
    setAssetTypeFilter('all');
    setPnlFilter('all');
    setSipFilter('all');
    setSortBy('value_desc');
  };

  const sipProjection = useMemo(() => {
    const monthlyRate = sipReturnRate / 100 / 12;
    const totalMonths = sipYears * 12;

    const timeline = [];
    let currentInvested = 0;
    let currentWealth = 0;

    for (let yr = 1; yr <= sipYears; yr++) {
      const months = yr * 12;
      currentInvested = sipMonthly * months;
      currentWealth = sipMonthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
      timeline.push({
        year: `Yr ${yr}`,
        invested: Math.round(currentInvested),
        wealth: Math.round(currentWealth),
        gains: Math.round(currentWealth - currentInvested),
      });
    }

    const finalTotalInvested = sipMonthly * totalMonths;
    const finalCorpus = sipMonthly * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate);
    const finalWealthGain = finalCorpus - finalTotalInvested;

    return {
      timeline,
      finalTotalInvested,
      finalWealthGain,
      finalCorpus,
    };
  }, [sipMonthly, sipReturnRate, sipYears]);

  return (
    <div className="space-y-4 sm:space-y-5">
      
      {/* Portfolio Overview Banner */}
      <div className="rounded-xl p-4 sm:p-5 glass-panel">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                Total Portfolio Value
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 font-bold">
                Groww Mode
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              {formatINR(totalCurrent)}
            </h1>
            <div className="flex items-center gap-3 mt-1.5 text-xs">
              <span className="text-slate-500">
                Invested: <strong className="text-slate-900">{formatINR(totalInvested)}</strong>
              </span>
              <span>•</span>
              <span className={`font-bold flex items-center gap-1 ${totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {totalProfit >= 0 ? '+' : ''}{formatINR(totalProfit)} ({formatPercent(overallReturn)})
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="p-2.5 sm:p-3 rounded-lg bg-teal-50/70 border border-teal-100">
              <span className="text-[10px] sm:text-[11px] text-teal-700 block font-medium">Monthly Active SIP</span>
              <span className="text-sm sm:text-base font-bold text-teal-900">{formatINR(activeMonthlySip)} / mo</span>
            </div>

            <button
              onClick={() => onOpenAddModal('investment')}
              className="btn-primary flex items-center gap-1.5 px-3.5 py-2 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Investment</span>
            </button>
          </div>
        </div>
      </div>

      {/* Asset Allocation & Holdings Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-4">
        
        {/* Asset Allocation Donut */}
        <div className="rounded-xl glass-panel p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Asset Allocation</h2>
                <p className="text-xs text-slate-500">Diversification across equity, debt & gold</p>
              </div>
              <PieIcon className="h-4 w-4 text-teal-600" />
            </div>

            <div className="h-48 w-full mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assetBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {assetBreakdown.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#BDD8E9', borderRadius: '8px', fontSize: '11px', boxShadow: '0 2px 4px rgba(0,29,57,0.06)' }}
                    formatter={(val: any) => [typeof val === 'number' ? formatINR(val) : String(val || ''), 'Value']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 border-t border-slate-100 pt-3 text-xs">
            {assetBreakdown.map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 font-medium text-[11px]">{item.label}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 text-[11px]">{formatINR(item.value)}</span>
                  <span className="text-[10px] text-slate-400 ml-1.5">
                    ({totalCurrent > 0 ? ((item.value / totalCurrent) * 100).toFixed(0) : 0}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Investment Holdings Table / Cards with Filter */}
        <div className="lg:col-span-2 rounded-xl glass-panel p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Your Investment Holdings</h2>
              <p className="text-xs text-slate-500">Stocks, Mutual Funds, Gold & Fixed Deposits</p>
            </div>
            
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search holding or symbol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Holdings Filter Controls */}
          <div className="flex flex-wrap items-center gap-2 pb-3 mb-3 border-b border-slate-100 text-xs">
            {/* Asset Type Filter */}
            <select
              value={assetTypeFilter}
              onChange={(e) => setAssetTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Asset Types</option>
              <option value="mutual_funds">Mutual Funds</option>
              <option value="stocks">Stocks & Equities</option>
              <option value="gold">Gold & SGBs</option>
              <option value="fixed_deposit">Fixed Deposits</option>
              <option value="ppf_epf">PPF / EPF</option>
              <option value="crypto">Crypto</option>
            </select>

            {/* Profit / Loss Filter */}
            <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
              <button
                onClick={() => setPnlFilter('all')}
                className={`px-2 py-1 rounded-md transition text-[11px] ${pnlFilter === 'all' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600'}`}
              >
                All
              </button>
              <button
                onClick={() => setPnlFilter('profit')}
                className={`px-2 py-1 rounded-md transition text-[11px] ${pnlFilter === 'profit' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600'}`}
              >
                Profit
              </button>
              <button
                onClick={() => setPnlFilter('loss')}
                className={`px-2 py-1 rounded-md transition text-[11px] ${pnlFilter === 'loss' ? 'bg-rose-600 text-white font-bold' : 'text-slate-600'}`}
              >
                Loss
              </button>
            </div>

            {/* SIP / Lumpsum Filter */}
            <select
              value={sipFilter}
              onChange={(e) => setSipFilter(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Investment Modes</option>
              <option value="sip_only">Active SIPs</option>
              <option value="lumpsum_only">Lump Sum Only</option>
            </select>

            {/* Sort Options */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1 ml-auto">
              <ArrowUpDown className="h-3 w-3 text-slate-400 ml-1" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as InvSortOption)}
                className="bg-transparent text-xs text-slate-700 pr-1 py-0.5 focus:outline-none font-medium cursor-pointer"
              >
                <option value="value_desc">Highest Value (₹ ↓)</option>
                <option value="value_asc">Lowest Value (₹ ↑)</option>
                <option value="pnl_desc">Highest Profit (₹ ↓)</option>
                <option value="pnl_asc">Lowest Profit / Loss</option>
                <option value="name_asc">Name (A-Z)</option>
              </select>
            </div>

            {/* Clear filter button */}
            {activeFilterCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 px-2 py-1 text-slate-500 hover:text-rose-600 rounded-lg border border-dashed border-slate-200 transition text-[11px]"
              >
                <X className="h-3 w-3" />
                <span>Clear ({activeFilterCount})</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {filteredInvestments.length === 0 ? (
              <div className="py-12 text-center rounded-xl bg-white/40 border border-dashed border-slate-200">
                <TrendingUp className="h-8 w-8 text-teal-600 mx-auto mb-2 opacity-60" />
                <p className="text-xs font-bold text-slate-700">Koi holding match nahi hui</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Filter criteria badlein ya naya investment add karein.</p>
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleResetFilters}
                    className="mt-3 px-3.5 py-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 font-semibold text-xs shadow-xs"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              filteredInvestments.map((inv) => {
                const pnl = inv.currentValue - inv.investedAmount;
                const pnlPercent = inv.investedAmount > 0 ? (pnl / inv.investedAmount) * 100 : 0;
                const assetColor = ASSET_COLORS[inv.assetType] || '#64748b';

                return (
                  <div 
                    key={inv.id} 
                    className="p-3.5 rounded-xl bg-white/60 backdrop-blur-md border border-white/80 hover:bg-white/90 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group shadow-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-2 h-10 rounded-full shrink-0 mt-0.5" 
                        style={{ backgroundColor: assetColor }} 
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900">{inv.name}</h3>
                          {inv.sipMonthlyAmount && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 font-semibold">
                              SIP {formatINR(inv.sipMonthlyAmount)}/m
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {inv.symbolOrPlatform || ASSET_LABELS[inv.assetType]} • Exp. Return: {inv.expectedReturnRate || 12}%
                          {inv.notes && <span className="text-slate-400"> — {inv.notes}</span>}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                      <div className="text-left sm:text-right">
                        <span className="block text-xs font-bold text-slate-900">{formatINR(inv.currentValue)}</span>
                        <span className="block text-[10px] text-slate-500">Invested: {formatINR(inv.investedAmount)}</span>
                      </div>

                      <div className="text-right">
                        <span className={`block text-xs font-bold ${pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {pnl >= 0 ? '+' : ''}{formatINR(pnl)}
                        </span>
                        <span className={`block text-[10px] font-semibold ${pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {formatPercent(pnlPercent)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingInvestment(inv)}
                          className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition"
                          title="Edit holding"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => onDeleteInvestment(inv.id)}
                          className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete holding"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* SIP Wealth & Goal Multiplier Calculator */}
      <div className="rounded-xl glass-panel p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="h-4 w-4 text-teal-600" />
              <span>Interactive SIP Future Wealth Simulator</span>
            </h2>
            <p className="text-xs text-slate-500">
              Calculate power of compounding for your long-term goals
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700">Monthly SIP Amount</span>
                <span className="text-teal-700">{formatINR(sipMonthly)}</span>
              </div>
              <input 
                type="range" 
                min={1000} 
                max={100000} 
                step={1000} 
                value={sipMonthly}
                onChange={(e) => setSipMonthly(Number(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700">Expected Annual Return</span>
                <span className="text-teal-700">{sipReturnRate}% p.a.</span>
              </div>
              <input 
                type="range" 
                min={6} 
                max={25} 
                step={0.5} 
                value={sipReturnRate}
                onChange={(e) => setSipReturnRate(Number(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700">Investment Horizon</span>
                <span className="text-teal-700">{sipYears} Years</span>
              </div>
              <input 
                type="range" 
                min={1} 
                max={30} 
                step={1} 
                value={sipYears}
                onChange={(e) => setSipYears(Number(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Invested Amount:</span>
                <span className="font-bold text-slate-800">{formatINR(sipProjection.finalTotalInvested)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estimated Gains:</span>
                <span className="font-bold text-emerald-600">+{formatINR(sipProjection.finalWealthGain)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold">
                <span className="text-slate-900">Total Future Corpus:</span>
                <span className="text-teal-800">{formatINR(sipProjection.finalCorpus)}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sipProjection.timeline}>
                <defs>
                  <linearGradient id="wealthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64748b" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#64748b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false} 
                  tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: any) => [typeof val === 'number' ? formatINR(val) : String(val || ''), 'Amount']}
                />
                <Area type="monotone" dataKey="wealth" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#wealthGrad)" name="Future Wealth" />
                <Area type="monotone" dataKey="invested" stroke="#64748b" strokeWidth={1.5} fillOpacity={1} fill="url(#invGrad)" name="Total Invested" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Edit Investment Modal */}
      <EditInvestmentModal
        isOpen={!!editingInvestment}
        onClose={() => setEditingInvestment(null)}
        investment={editingInvestment}
        onUpdate={(updated) => {
          onUpdateInvestment?.(updated);
          setEditingInvestment(null);
        }}
      />

    </div>
  );
};
