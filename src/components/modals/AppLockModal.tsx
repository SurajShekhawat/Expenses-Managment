'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Unlock, KeyRound, Shield, AlertCircle, X, Check, Delete } from 'lucide-react';

interface AppLockModalProps {
  isOpen: boolean;
  isUnlocked: boolean;
  onUnlockSuccess: () => void;
  onClose?: () => void;
  isSettingsMode?: boolean; // If opened from settings to change/remove PIN
}

const PIN_STORAGE_KEY = 'fingroww_security_pin';

export function AppLockModal({
  isOpen,
  isUnlocked,
  onUnlockSuccess,
  onClose,
  isSettingsMode = false,
}: AppLockModalProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [hasExistingPin, setHasExistingPin] = useState(false);
  const [isSettingNewPin, setIsSettingNewPin] = useState(false);
  const [step, setStep] = useState<'enter' | 'create' | 'confirm'>('enter');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(PIN_STORAGE_KEY);
      if (stored) {
        setHasExistingPin(true);
        setStep('enter');
      } else {
        setHasExistingPin(false);
        setStep('create');
      }
    }
    setPin('');
    setConfirmPin('');
    setErrorMsg(null);
  }, [isOpen]);

  const handleKeyPress = (num: string) => {
    setErrorMsg(null);
    if (step === 'enter') {
      if (pin.length < 4) {
        const nextPin = pin + num;
        setPin(nextPin);
        if (nextPin.length === 4) {
          verifyPin(nextPin);
        }
      }
    } else if (step === 'create') {
      if (pin.length < 4) {
        const nextPin = pin + num;
        setPin(nextPin);
        if (nextPin.length === 4) {
          setConfirmPin('');
          setStep('confirm');
        }
      }
    } else if (step === 'confirm') {
      if (confirmPin.length < 4) {
        const nextConfirm = confirmPin + num;
        setConfirmPin(nextConfirm);
        if (nextConfirm.length === 4) {
          if (nextConfirm === pin) {
            localStorage.setItem(PIN_STORAGE_KEY, nextConfirm);
            setHasExistingPin(true);
            onUnlockSuccess();
          } else {
            setErrorMsg('PIN match nahi hua! Dubara try karein.');
            setConfirmPin('');
          }
        }
      }
    }
  };

  const handleBackspace = () => {
    setErrorMsg(null);
    if (step === 'enter' || step === 'create') {
      setPin(prev => prev.slice(0, -1));
    } else if (step === 'confirm') {
      if (confirmPin.length > 0) {
        setConfirmPin(prev => prev.slice(0, -1));
      } else {
        setStep('create');
        setPin('');
      }
    }
  };

  const handleClear = () => {
    setPin('');
    setConfirmPin('');
    setErrorMsg(null);
  };

  const verifyPin = (entered: string) => {
    const stored = localStorage.getItem(PIN_STORAGE_KEY);
    if (stored === entered) {
      onUnlockSuccess();
    } else {
      setErrorMsg('Galat PIN! Kripya sahi PIN dalein.');
      setTimeout(() => {
        setPin('');
      }, 400);
    }
  };

  const handleRemovePin = () => {
    if (confirm('Kya aap security PIN hatana chahte hain?')) {
      localStorage.removeItem(PIN_STORAGE_KEY);
      setHasExistingPin(false);
      onUnlockSuccess();
    }
  };

  if (!isOpen) return null;

  const currentPinLength = step === 'confirm' ? confirmPin.length : pin.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm glass-modal rounded-3xl p-6 sm:p-8 flex flex-col items-center">
        
        {isSettingsMode && onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Shield Icon */}
        <div className="h-16 w-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mb-4">
          <Shield className="h-8 w-8" />
        </div>

        <h2 className="text-lg font-bold text-slate-900 text-center">
          {step === 'enter' ? 'FinGroww Secure Unlock' : step === 'create' ? 'Set 4-Digit Master PIN' : 'Confirm Master PIN'}
        </h2>
        <p className="text-xs text-slate-500 text-center mt-1">
          {step === 'enter' 
            ? 'Apna 4-digit PIN enter karke dashboard unlock karein'
            : step === 'create'
            ? 'Apne finance data ko protect karne ke liye PIN banayein'
            : 'Confirmation ke liye wahi PIN dubara enter karein'}
        </p>

        {/* 4 Digit Visual Dots */}
        <div className="flex items-center gap-3.5 my-6">
          {[0, 1, 2, 3].map(idx => (
            <div
              key={idx}
              className={`h-4 w-4 rounded-full transition-all duration-200 border-2 ${
                idx < currentPinLength
                  ? 'bg-emerald-600 border-emerald-600 scale-110'
                  : 'bg-slate-100 border-slate-300'
              }`}
            />
          ))}
        </div>

        {errorMsg && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 mb-4 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 animate-shake">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Responsive Numpad Grid */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-emerald-50 active:scale-95 text-slate-900 text-xl font-bold border border-slate-200 transition-all flex items-center justify-center shadow-xs"
            >
              {num}
            </button>
          ))}

          <button
            onClick={handleClear}
            className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-500 text-xs font-bold border border-slate-200 transition-all flex items-center justify-center"
          >
            Clear
          </button>

          <button
            onClick={() => handleKeyPress('0')}
            className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-emerald-50 active:scale-95 text-slate-900 text-xl font-bold border border-slate-200 transition-all flex items-center justify-center shadow-xs"
          >
            0
          </button>

          <button
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-600 border border-slate-200 transition-all flex items-center justify-center"
            title="Backspace"
          >
            <Delete className="h-5 w-5" />
          </button>
        </div>

        {/* Reset / Remove PIN options */}
        {hasExistingPin && (
          <div className="mt-5 pt-4 border-t border-slate-100 w-full flex justify-center">
            <button
              onClick={handleRemovePin}
              className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 transition"
            >
              PIN bhool gaye ya Reset karna hai?
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
