'use client';

import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2,
  KeyRound,
  UserPlus
} from 'lucide-react';
import { FinGrowwLogo } from '../FinGrowwLogo';
import { User as UserType } from '@/types/auth';

interface LoginViewProps {
  onLoginSuccess: (user: UserType, token: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form state
  const [registerName, setRegisterName] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!loginUsername.trim() || !loginPassword) {
      setErrorMsg('Kripya username aur password dono fill karein');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          username: loginUsername.trim(),
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Login fail ho gaya');
      }

      setSuccessMsg(`Welcome, ${data.user.name}!`);
      if (typeof window !== 'undefined') {
        localStorage.setItem('fingroww_user', JSON.stringify(data.user));
        localStorage.setItem('fingroww_token', data.token);
      }

      setTimeout(() => {
        onLoginSuccess(data.user, data.token);
      }, 400);
    } catch (err: any) {
      setErrorMsg(err.message || 'Server se connect nahi ho paya');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!registerName.trim() || !registerUsername.trim() || !registerPassword) {
      setErrorMsg('Sabhi fields bharna zaroori hai');
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setErrorMsg('Password aur Confirm Password match nahi ho rahe');
      return;
    }

    if (registerPassword.length < 4) {
      setErrorMsg('Password kam se kam 4 characters ka hona chahiye');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          name: registerName.trim(),
          username: registerUsername.trim(),
          password: registerPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Registration fail ho gaya');
      }

      setSuccessMsg('Account ban gaya! Logging you in...');
      if (typeof window !== 'undefined') {
        localStorage.setItem('fingroww_user', JSON.stringify(data.user));
        localStorage.setItem('fingroww_token', data.token);
      }

      setTimeout(() => {
        onLoginSuccess(data.user, data.token);
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration me error aayi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#f4f8fa]">
      
      {/* Auth Card (Clean Solid Matte Frost) */}
      <div className="w-full max-w-md bg-white/90 backdrop-blur-2xl rounded-2xl p-5 sm:p-8 border border-[#BDD8E9] shadow-xl shadow-[#001D39]/8 relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-white shadow-xs border border-[#BDD8E9]/70 mb-1">
            <FinGrowwLogo size={48} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#001D39] tracking-tight">
              Fin<span className="text-[#0A4174]">Groww</span>
            </h1>
            <p className="text-xs text-[#49769F] font-medium mt-0.5">
              Personal Wealth, Expenses & Groww Portfolio Hub
            </p>
          </div>
        </div>

        {/* Tab Switcher: Login vs Register */}
        <div className="flex p-1 rounded-2xl bg-[#BDD8E9]/40 border border-[#BDD8E9] text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-[#0A4174] text-white shadow-xs'
                : 'text-[#49769F] hover:text-[#001D39]'
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Log In (लॉग इन)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-[#0A4174] text-white shadow-xs'
                : 'text-[#49769F] hover:text-[#001D39]'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Sign Up (नया खाता)</span>
          </button>
        </div>

        {/* Error / Success Feedback */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-200">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* --- FORM 1: LOGIN --- */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email ID / Login ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="name@email.com ya username"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  <span>{showPassword ? 'Chupayein' : 'Dikhayein'}</span>
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Apna password darj karein"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 rounded-xl bg-[#0A4174] hover:bg-[#001D39] active:scale-98 text-white font-bold text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Log In Karein</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* --- FORM 2: REGISTER --- */
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Aapka Poora Naam (Full Name) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Suraj Shekhawat"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A4174]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Unique Login ID / Username *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. suraj_fin"
                value={registerUsername}
                onChange={(e) => setRegisterUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A4174] lowercase font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Naya Password *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Kam se kam 4 characters"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A4174]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Confirm Password *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Password dobara likhein"
                value={registerConfirmPassword}
                onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A4174]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[#0A4174] hover:bg-[#001D39] active:scale-98 text-white font-bold text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account & Start Growing</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Security Badge */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-[#0A4174]" />
          <span>100% Encrypted & Private (PBKDF2-SHA512 Salted Hashing)</span>
        </div>

      </div>
    </div>
  );
};
