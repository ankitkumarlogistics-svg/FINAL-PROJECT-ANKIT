import React, { useState } from 'react';
import { AppUser, Language } from '../types';
import { translations } from '../utils/translations';
import { Lock, User, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowRight, Clock, Ship } from 'lucide-react';

interface LoginPageProps {
  users: AppUser[];
  onLoginSuccess: (user: AppUser) => void;
  companyName: string;
  language: Language;
  onToggleLanguage: (lang: Language) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  users,
  onLoginSuccess,
  companyName,
  language,
  onToggleLanguage,
}) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const t = translations[language];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanId = userId.trim().toLowerCase();
    const foundUser = users.find(
      (u) => u.userId.toLowerCase() === cleanId
    );

    if (!foundUser) {
      setErrorMessage(t.authErrorNotFound);
      return;
    }

    if (foundUser.status === 'DISABLED') {
      setErrorMessage(t.authErrorDisabled);
      return;
    }

    if (foundUser.password !== password) {
      setErrorMessage(t.authErrorPassword);
      return;
    }

    // Success! Update last login timestamp
    const updatedUser = {
      ...foundUser,
      lastLoginAt: new Date().toISOString(),
    };
    onLoginSuccess(updatedUser);
  };

  const handleQuickFill = (userAccount: AppUser) => {
    setUserId(userAccount.userId);
    setPassword(userAccount.password);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Top Header Banner with Language Switcher */}
        <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 p-8 text-white text-center border-b border-slate-800 relative">
          {/* Top-Right Language Toggle */}
          <div className="absolute top-4 right-4 flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={() => onToggleLanguage('en')}
              className={`px-2 py-0.5 text-xs font-bold rounded transition-all ${
                language === 'en'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => onToggleLanguage('ja')}
              className={`px-2 py-0.5 text-xs font-bold rounded transition-all ${
                language === 'ja'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              日本語
            </button>
          </div>

          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 bg-sky-600/20 border border-sky-400/40 rounded-2xl shadow-lg inline-flex items-center justify-center">
              <Ship className="w-7 h-7 text-sky-300" />
            </div>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white mt-2">
            {t.loginTitle}
          </h2>
          <p className="text-xs text-sky-300 mt-1">
            {t.loginSubtitle}
          </p>
        </div>

        {/* 24-Hour Session Banner */}
        <div className="bg-sky-50 px-4 py-2.5 border-b border-sky-100 flex items-center gap-2 text-xs text-sky-900">
          <Clock className="w-4 h-4 text-sky-700 shrink-0" />
          <span className="leading-tight text-[11.5px]">
            {t.persistentSessionNotice}
          </span>
        </div>

        {/* Login Form */}
        <div className="p-6 sm:p-8 space-y-6">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User ID Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t.userIdLabel}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder={t.userIdPlaceholder}
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600 focus:border-sky-600 bg-white"
                  autoFocus
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t.passwordLabel}
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600 focus:border-sky-600 bg-white font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-sky-700 hover:bg-sky-800 text-white font-bold text-sm rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 mt-2"
            >
              <span>{t.loginButton}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Switcher — shown only while default demo accounts are unchanged */}
          {(() => {
            const defaultAdmin = users.find(
              (u) => u.userId.toLowerCase() === 'admin' && u.password === 'admin123'
            );
            const defaultStaff = users.find(
              (u) => u.userId.toLowerCase() === 'staff1' && u.password === 'staff123'
            );
            if (!defaultAdmin && !defaultStaff) return null;
            return (
              <div className="pt-4 border-t border-slate-200">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-2.5">
                  {t.quickDemoAccess}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {defaultAdmin && (
                    <button
                      type="button"
                      onClick={() => handleQuickFill(defaultAdmin)}
                      className="p-2.5 text-left border border-sky-200 bg-sky-50/70 hover:bg-sky-100/80 rounded-lg transition-colors group"
                    >
                      <div className="font-bold text-sky-950 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-sky-700" />
                        {t.demoAdminText}
                      </div>
                      <div className="text-[10px] text-sky-800 font-mono mt-0.5">
                        ID: admin / pass: admin123
                      </div>
                    </button>
                  )}

                  {defaultStaff && (
                    <button
                      type="button"
                      onClick={() => handleQuickFill(defaultStaff)}
                      className="p-2.5 text-left border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors group"
                    >
                      <div className="font-bold text-slate-800 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-600" />
                        {t.demoStaffText}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        ID: staff1 / pass: staff123
                      </div>
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500">
          Freight Operations &amp; Accounting Portal · Authorized Personnel Only · 24-Hour Active
        </div>
      </div>
    </div>
  );
};
