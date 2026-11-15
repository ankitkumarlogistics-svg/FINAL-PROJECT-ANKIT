import React, { useState } from 'react';
import { ActiveTab, AppUser, Language } from '../types';
import { translations } from '../utils/translations';
import {
  FileSpreadsheet,
  Settings,
  ShieldCheck,
  LogOut,
  User,
  Cloud,
  Users,
  Ship,
  Database,
  Menu,
  X,
  LayoutDashboard,
  Receipt,
  FileCheck2,
  FileText,
  Wallet,
  Anchor,
  Building2,
} from 'lucide-react';

import { CloudSyncStatus } from '../services/firebase';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser: AppUser | null;
  language: Language;
  cloudStatus?: CloudSyncStatus;
  urgentCustomerCount?: number;
  urgentShippingLineCount?: number;
  onToggleLanguage: (lang: Language) => void;
  onOpenSettings: () => void;
  onExportAllExcel: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  language,
  cloudStatus,
  urgentCustomerCount = 0,
  urgentShippingLineCount = 0,
  onToggleLanguage,
  onOpenSettings,
  onExportAllExcel,
  onLogout,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isAdmin = currentUser?.role === 'ADMIN';
  const t = translations[language];

  const handleTabClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.ReactNode;
    alertCount?: number;
  }[] = [
    {
      id: 'dashboard',
      label: t.overview || 'Overview',
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'bookings',
      label: 'Bookings',
      icon: <Ship className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'quotations',
      label: 'Quotations',
      icon: <FileText className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'invoices',
      label: t.invoices || 'Invoices',
      icon: <Receipt className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'customerPayments',
      label: 'Customer Payments',
      icon: <Wallet className="w-4 h-4 shrink-0" />,
      alertCount: urgentCustomerCount,
    },
    {
      id: 'shippingPayments',
      label: 'Shipping Line Pay',
      icon: <Anchor className="w-4 h-4 shrink-0" />,
      alertCount: urgentShippingLineCount,
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: <Users className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'kyc',
      label: 'KYC',
      icon: <FileCheck2 className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'masters',
      label: 'Masters',
      icon: <Database className="w-4 h-4 shrink-0" />,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
      {/* Tier 1: Workspace Identity & Global Utilities */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 border-b border-slate-100">
        <div className="flex items-center justify-between gap-2 sm:gap-4 h-14">
          {/* Left: Mobile Menu Button + Neutral Workspace Portal Title (No company logo/name in GUI) */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg focus:outline-none shrink-0"
              title="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={() => handleTabClick('dashboard')}
              className="flex items-center gap-2.5 text-left select-none group min-w-0"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:bg-sky-800 transition-colors">
                <Ship className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900 tracking-tight truncate">
                  Freight Operations &amp; Accounting
                </div>
                <div className="text-[10px] font-medium text-slate-500 hidden sm:block truncate">
                  Interconnected Shipping, Quotations, Invoices &amp; Payments
                </div>
              </div>
            </button>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => onToggleLanguage('en')}
                className={`px-1.5 py-0.5 text-[11px] font-bold rounded transition-all ${
                  language === 'en'
                    ? 'bg-sky-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => onToggleLanguage('ja')}
                className={`px-1.5 py-0.5 text-[11px] font-bold rounded transition-all ${
                  language === 'ja'
                    ? 'bg-sky-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                JP
              </button>
            </div>

            {/* Cloud Synced Status */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                cloudStatus?.isConnected !== false
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
              title={`Cloud Firestore: ${cloudStatus?.statusText || 'Active'}`}
            >
              <Cloud
                className={`w-3.5 h-3.5 ${
                  cloudStatus?.isConnected !== false ? 'text-emerald-700' : 'text-amber-700'
                }`}
              />
              <span className="hidden sm:inline">
                {cloudStatus?.isConnected !== false ? 'Cloud Synced' : 'Connecting...'}
              </span>
              <span className="sm:hidden text-[11px]">
                {cloudStatus?.isConnected !== false ? 'Sync' : '...'}
              </span>
            </div>

            {/* Export All Excel Button */}
            <button
              type="button"
              onClick={onExportAllExcel}
              className="hidden sm:flex px-2.5 py-1 text-xs font-semibold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors items-center gap-1 whitespace-nowrap"
              title="Download all Bookings, Quotations, Invoices & SL Payments into Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-800" />
              <span className="hidden md:inline">Excel</span>
            </button>

            {/* Document Letterhead, Logo & Bank Settings Modal Trigger */}
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors shrink-0 whitespace-nowrap"
              title="Configure Document Letterhead, Logo & Bank Details for PDFs"
            >
              <Building2 className="w-3.5 h-3.5 text-sky-700" />
              <span className="hidden md:inline">Document Branding &amp; Bank</span>
              <span className="md:hidden">Branding</span>
            </button>

            {/* Current User & Logout */}
            {currentUser && (
              <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 flex items-center justify-end gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>{currentUser.userId}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {currentUser.role === 'ADMIN' ? 'Admin' : 'Staff'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title={t.logout}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tier 2: Desktop Horizontal Single-Line Module Navigation */}
      <div className="hidden lg:block bg-slate-50/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1 py-1.5 overflow-x-auto scrollbar-none text-xs font-semibold">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabClick(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-sky-700 text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-200/70 hover:text-slate-900'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {typeof item.alertCount === 'number' && item.alertCount > 0 && (
                    <span
                      className={`ml-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold font-mono ${
                        isActive
                          ? 'bg-rose-500 text-white'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      {item.alertCount}
                    </span>
                  )}
                </button>
              );
            })}

            {isAdmin && (
              <>
                <div className="h-4 w-px bg-slate-300 mx-1 shrink-0" />
                <button
                  type="button"
                  onClick={() => handleTabClick('admin')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${
                    activeTab === 'admin'
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-200/70'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>{t.adminTeam}</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="flex items-center gap-1 px-2 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg whitespace-nowrap shrink-0"
                  title={t.settings}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Doc Settings</span>
                </button>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 shadow-lg max-h-[85vh] overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleTabClick(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg font-semibold transition-all ${
                activeTab === item.id
                  ? 'bg-sky-50 text-sky-900 font-bold border border-sky-200'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {typeof item.alertCount === 'number' && item.alertCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-600 text-white rounded">
                  {item.alertCount} Urgent
                </span>
              )}
            </button>
          ))}

          {isAdmin && (
            <button
              type="button"
              onClick={() => handleTabClick('admin')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg font-semibold transition-all ${
                activeTab === 'admin'
                  ? 'bg-sky-50 text-sky-900 font-bold border border-sky-200'
                  : 'text-sky-800 hover:bg-slate-50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-sky-600" />
              <span>{t.adminTeam}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onOpenSettings();
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 text-sm bg-sky-50 text-sky-900 border border-sky-200 hover:bg-sky-100 rounded-lg font-bold"
          >
            <div className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-sky-700" />
              <span>Document Logo, Address &amp; Bank</span>
            </div>
            <span className="text-xs text-sky-700 font-semibold">Edit</span>
          </button>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onExportAllExcel}
              className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-emerald-950 bg-emerald-200 rounded-lg"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export All to Excel</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
