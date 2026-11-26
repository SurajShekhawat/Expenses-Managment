'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  DollarSign,
  X,
  Sparkles
} from 'lucide-react';
import { FinancialData } from '@/types/finance';
import { computeDueAlerts, requestNotificationPermission, DueAlert } from '@/lib/notificationEngine';
import { formatINR } from '@/lib/formatters';

interface NotificationCenterProps {
  data: FinancialData;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ data }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState<DueAlert[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
    const computed = computeDueAlerts(data);
    setAlerts(computed);
  }, [data]);

  const handleEnablePush = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
  };

  const highPriorityCount = alerts.filter(a => a.urgency === 'high').length;

  return (
    <div className="relative">
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-[#BDD8E9]/40 hover:bg-[#BDD8E9]/70 text-[#001D39] border border-[#7BBDE8]/50 transition flex items-center justify-center cursor-pointer shadow-xs"
        title="Due Alerts & Notifications"
      >
        {alerts.length > 0 ? (
          <BellRing className="h-4 w-4 text-[#0A4174] animate-pulse" />
        ) : (
          <Bell className="h-4 w-4 text-[#49769F]" />
        )}

        {/* Badge counter */}
        {alerts.length > 0 && (
          <span className={`absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full text-[10px] font-black flex items-center justify-center text-white ${
            highPriorityCount > 0 ? 'bg-rose-500 animate-bounce' : 'bg-[#0A4174]'
          }`}>
            {alerts.length}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-[#001D39]/30 backdrop-blur-xs" 
            onClick={() => setIsOpen(false)} 
          />

          <div className="fixed inset-x-3 top-16 sm:top-auto sm:inset-auto sm:right-0 sm:mt-2 w-auto sm:w-96 rounded-2xl glass-modal shadow-2xl border border-[#BDD8E9] p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#BDD8E9]/60 shrink-0">
              <div className="flex items-center gap-2">
                <BellRing className="h-4 w-4 text-[#0A4174]" />
                <h3 className="text-sm font-extrabold text-[#001D39]">
                  Dues & Bill Reminders
                </h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-[#001D39] p-1 rounded-lg active:scale-90"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Notification Permission Banner */}
            {permission !== 'granted' && (
              <div className="mt-3 p-3 rounded-xl bg-[#BDD8E9]/30 border border-[#7BBDE8]/60 text-xs flex items-center justify-between gap-2 shrink-0">
                <div>
                  <span className="font-bold text-[#001D39] block">Push Notifications</span>
                  <span className="text-[11px] text-[#49769F]">Mobile par direct payment alerts paayein</span>
                </div>
                <button
                  onClick={handleEnablePush}
                  className="px-2.5 py-1.5 rounded-lg bg-[#0A4174] hover:bg-[#001D39] text-white font-bold text-[11px] shrink-0 transition active:scale-95"
                >
                  Turn On
                </button>
              </div>
            )}

            {/* Alerts List */}
            <div className="mt-3 space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <div className="py-8 text-center text-slate-500 space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-semibold">Sabhi dues clear hain!</p>
                  <p className="text-[11px] text-slate-400">Agale 3 dinon me koi EMI ya renewal pending nahi hai.</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-xl border transition flex items-start gap-3 ${
                      alert.urgency === 'high'
                        ? 'bg-rose-50/60 border-rose-200/80 text-rose-900'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-white shadow-xs shrink-0 mt-0.5">
                      {alert.type === 'emi' && <DollarSign className="h-4 w-4 text-amber-600" />}
                      {alert.type === 'subscription' && <Calendar className="h-4 w-4 text-blue-600" />}
                      {alert.type === 'insurance' && <Sparkles className="h-4 w-4 text-purple-600" />}
                      {alert.type === 'budget' && <AlertTriangle className="h-4 w-4 text-rose-600" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold truncate">{alert.title}</span>
                        {alert.amount && (
                          <span className="text-xs font-extrabold shrink-0 text-slate-900">
                            {formatINR(alert.amount)}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                        {alert.message}
                      </p>
                      {alert.dueDate && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                          <Clock className="h-3 w-3" />
                          <span>Due: {alert.dueDate}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {alerts.length > 0 && (
              <div className="mt-3 pt-2 border-t border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 font-medium">
                  FinGroww automated bill tracker (Web & App unified)
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
