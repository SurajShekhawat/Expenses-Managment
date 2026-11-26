'use client';

import React, { useEffect, useState } from 'react';
import { MarketData } from '@/app/api/market/route';
import { TrendingUp, TrendingDown, Coins, Activity, RefreshCw } from 'lucide-react';

export const MarketTicker: React.FC = () => {
  const [data, setData] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRates = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/market', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json.market);
        }
      }
    } catch (e) {
      console.warn('Market fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    const timer = setInterval(fetchRates, 60000); // 1 min refresh
    return () => clearInterval(timer);
  }, []);

  if (!data) return null;

  return (
    <div className="w-full bg-[#001D39]/95 backdrop-blur-xl text-white border-b border-[#49769F]/30 px-3 py-1.5 overflow-hidden text-[11px] shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        
        {/* Left Indicator Label */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#0A4174]/70 text-[#BDD8E9] font-bold border border-[#49769F]/50">
            <Coins className="h-3 w-3 text-[#7BBDE8]" />
            <span className="hidden xs:inline">Live MCX & Indices</span>
            <span className="xs:hidden">Live</span>
          </div>
          <span className="text-[10px] text-[#7BBDE8]/70 hidden md:inline">
            Updated {data.lastUpdated}
          </span>
        </div>

        {/* Scrollable / Responsive Ticker Items */}
        <div className="flex items-center gap-3 sm:gap-5 overflow-x-auto scrollbar-none py-0.5">
          
          {/* Gold 24K */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-amber-400 font-semibold">Gold 24K (10g):</span>
            <span className="font-extrabold text-white">₹{data.gold24k.price.toLocaleString('en-IN')}</span>
            <span className={`flex items-center text-[10px] font-bold ${data.gold24k.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {data.gold24k.change >= 0 ? <TrendingUp className="h-2.5 w-2.5 mr-0.5" /> : <TrendingDown className="h-2.5 w-2.5 mr-0.5" />}
              {data.gold24k.change >= 0 ? '+' : ''}₹{data.gold24k.change} ({data.gold24k.changePercent}%)
            </span>
          </div>

          <span className="text-slate-600 hidden sm:inline">•</span>

          {/* Gold 22K */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-amber-300 font-semibold">22K:</span>
            <span className="font-extrabold text-white">₹{data.gold22k.price.toLocaleString('en-IN')}</span>
          </div>

          <span className="text-slate-600 hidden sm:inline">•</span>

          {/* Silver */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-slate-300 font-semibold">Silver (1kg):</span>
            <span className="font-extrabold text-white">₹{data.silver.price.toLocaleString('en-IN')}</span>
            <span className={`text-[10px] font-bold ${data.silver.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {data.silver.change >= 0 ? '+' : ''}{data.silver.changePercent}%
            </span>
          </div>

          <span className="text-slate-600 hidden md:inline">•</span>

          {/* Nifty 50 */}
          <div className="flex items-center gap-1.5 shrink-0 hidden sm:flex">
            <span className="text-blue-300 font-semibold">NIFTY 50:</span>
            <span className="font-extrabold text-white">{data.nifty50.value.toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center">
              <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
              +{data.nifty50.changePercent}%
            </span>
          </div>

          <span className="text-slate-600 hidden lg:inline">•</span>

          {/* Sensex */}
          <div className="flex items-center gap-1.5 shrink-0 hidden md:flex">
            <span className="text-teal-300 font-semibold">SENSEX:</span>
            <span className="font-extrabold text-white">{data.sensex.value.toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-emerald-400 font-bold">+{data.sensex.changePercent}%</span>
          </div>

        </div>

        {/* Refresh Action */}
        <button
          onClick={fetchRates}
          disabled={isLoading}
          title="Refresh market rates"
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
        </button>

      </div>
    </div>
  );
};
