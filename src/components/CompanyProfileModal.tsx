import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CompanyProfile } from '../types';
import { CompanyLogo, OFFICIAL_LOGO_URL } from './CompanyLogo';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';
import { X, Upload, RotateCcw, Check, Building2 } from 'lucide-react';

interface CompanyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CompanyProfile;
  onSave: (updated: CompanyProfile) => void;
  onResetData: () => void;
}

export const CompanyProfileModal: React.FC<CompanyProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
  onResetData,
}) => {
  const [formData, setFormData] = useState<CompanyProfile>(profile);
  const [savedAlert, setSavedAlert] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      setSavedAlert(false);
      setShowResetConfirm(false);
      setIsDirty(false);
      setShowUnsavedPrompt(false);
      return;
    }
    setFormData(profile);
    setSavedAlert(false);
    setShowResetConfirm(false);
    setIsDirty(false);
    setShowUnsavedPrompt(false);
  }, [isOpen, profile]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, []);

  const forceClose = useCallback(() => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    setSavedAlert(false);
    setShowResetConfirm(false);
    setIsDirty(false);
    setShowUnsavedPrompt(false);
    onClose();
  }, [onClose]);

  const requestClose = useCallback(() => {
    if (isDirty) {
      setShowUnsavedPrompt(true);
    } else {
      forceClose();
    }
  }, [isDirty, forceClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showUnsavedPrompt) {
        e.preventDefault();
        e.stopPropagation();
        requestClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, showUnsavedPrompt, requestClose]);

  if (!isOpen) return null;

  const handleFieldChange = (field: keyof CompanyProfile, value: any) => {
    setIsDirty(true);
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBankChange = (field: keyof CompanyProfile['bankDetails'], value: string) => {
    setIsDirty(true);
    setFormData((prev) => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        [field]: value,
      },
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleFieldChange('customLogoUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setIsDirty(false);
    setSavedAlert(true);
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      setSavedAlert(false);
      onClose();
    }, 900);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) requestClose();
        }}
      >
        <div
          className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl my-auto overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Company Branding & Bank Configuration
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              These details automatically populate all Booking Confirmations, Freight Invoices, and Bank Transfer instructions
            </p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close modal"
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
            {savedAlert && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                Company profile updated successfully!
              </div>
            )}

          {/* Logo & Brand Display with Live Preview */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Official Company Logo & Letterhead Emblem</span>
                  <span className="text-[10px] bg-sky-100 text-sky-800 font-semibold px-2 py-0.5 rounded-full">
                    Auto-Applied Across App
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Used on Header, Booking Confirmations, Freight Invoices, KYC Documents, and Excel/PDF exports.
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <label className="cursor-pointer px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 flex items-center gap-1.5 shadow-xs transition-colors">
                  <Upload className="w-3.5 h-3.5 text-sky-700" />
                  <span>Upload New Logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                {formData.customLogoUrl && formData.customLogoUrl !== OFFICIAL_LOGO_URL && (
                  <button
                    type="button"
                    onClick={() => handleFieldChange('customLogoUrl', OFFICIAL_LOGO_URL)}
                    className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg font-medium transition-colors"
                  >
                    Reset to Yokohama Logo
                  </button>
                )}
              </div>
            </div>

            {/* Dual Live Preview: Header Preview & Document Letterhead Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">
                  Header Bar Preview:
                </div>
                <div className="h-14 bg-slate-50 border border-slate-200 rounded-lg px-3 flex items-center">
                  <CompanyLogo customLogoUrl={formData.customLogoUrl} size="header" />
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">
                  Document Letterhead (PDF) Preview:
                </div>
                <div className="h-14 bg-white border border-slate-200 rounded-lg px-3 flex items-center">
                  <CompanyLogo customLogoUrl={formData.customLogoUrl} size="document" className="max-h-12" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Company Names & Representative */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company Name (English) *
              </label>
              <input
                type="text"
                required
                value={formData.companyNameEn}
                onChange={(e) => handleFieldChange('companyNameEn', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company Name (Japanese)
              </label>
              <input
                type="text"
                value={formData.companyNameJp}
                onChange={(e) => handleFieldChange('companyNameJp', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Representative / Owner Name
              </label>
              <input
                type="text"
                value={formData.ownerNameEn}
                onChange={(e) => handleFieldChange('ownerNameEn', e.target.value)}
                placeholder="Muhammad Fareed"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Registration No (登録番号)
              </label>
              <input
                type="text"
                value={formData.registrationNumber}
                onChange={(e) => handleFieldChange('registrationNumber', e.target.value)}
                placeholder="T9120001213448"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono font-semibold"
              />
            </div>
          </div>

          {/* Section 2: Addresses & Contact Numbers */}
          <div className="border-t border-slate-200 pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Location & Contact Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => handleFieldChange('postalCode', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Address (Japanese)
                </label>
                <input
                  type="text"
                  value={formData.addressJp}
                  onChange={(e) => handleFieldChange('addressJp', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Address (English)
                </label>
                <input
                  type="text"
                  value={formData.addressEn}
                  onChange={(e) => handleFieldChange('addressEn', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Office Phone
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Phone
                </label>
                <input
                  type="text"
                  value={formData.mobile}
                  onChange={(e) => handleFieldChange('mobile', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fax
                </label>
                <input
                  type="text"
                  value={formData.fax}
                  onChange={(e) => handleFieldChange('fax', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Website
                </label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => handleFieldChange('website', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Dual Bank Details (Printed on Freight Invoices) */}
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-sky-700" />
                  <span>Bank Wire Transfer Details (Printed on Invoices)</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Customers use these details to pay your freight invoices via domestic Japanese Furikomi or Overseas SWIFT wire.
                </p>
              </div>
            </div>

            {/* Highlighted Primary Account Number Banner */}
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex-1">
                <label className="block text-xs font-extrabold text-amber-950 mb-1">
                  ★ Bank Account Number / 口座番号 (Required for Invoices)
                </label>
                <input
                  type="text"
                  value={formData.bankDetails.accountNumber}
                  onChange={(e) => handleBankChange('accountNumber', e.target.value)}
                  placeholder="e.g. 1439210"
                  className="w-full px-3 py-2 text-sm font-mono font-extrabold text-slate-900 border-2 border-amber-400 bg-white rounded-lg focus:ring-2 focus:ring-amber-500 shadow-inner"
                />
                <span className="text-[10.5px] text-amber-800 mt-1 block">
                  This account number is printed in prominent bold on every Freight Invoice.
                </span>
              </div>
              <div className="sm:w-56">
                <label className="block text-xs font-bold text-amber-950 mb-1">
                  SWIFT / BIC Code
                </label>
                <input
                  type="text"
                  value={formData.bankDetails.swiftCode}
                  onChange={(e) => handleBankChange('swiftCode', e.target.value.toUpperCase())}
                  placeholder="e.g. SMBCJPJT"
                  className="w-full px-3 py-2 text-sm font-mono font-bold text-sky-950 border border-amber-300 bg-white rounded-lg focus:ring-2 focus:ring-sky-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  For overseas wire transfers
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Japanese Bank Details - English Headings for Japanese Data Entry */}
              <div className="p-3.5 bg-slate-50 border border-slate-300 rounded-xl space-y-2.5">
                <div className="text-xs font-bold text-sky-900 border-b border-slate-200 pb-1.5 flex items-center justify-between">
                  <span className="font-extrabold uppercase tracking-wide">Japanese Bank Account (Domestic Furikomi)</span>
                  <span className="text-[10px] bg-sky-100 text-sky-900 font-bold px-2 py-0.5 rounded">国内振込</span>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5">
                    Account Holder Name (Enter in Japanese Katakana or Kanji)
                  </label>
                  <input
                    type="text"
                    value={formData.bankDetails.accountNameJp}
                    onChange={(e) => handleBankChange('accountNameJp', e.target.value)}
                    placeholder="e.g. カ）ヨコハマロジスティクス"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white font-medium"
                  />
                  <span className="text-[10px] text-slate-500">Prints in Japanese 口座名義 box on invoice</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5">
                      Bank Name (Input in Japanese)
                    </label>
                    <input
                      type="text"
                      value={formData.bankDetails.bankNameJp}
                      onChange={(e) => handleBankChange('bankNameJp', e.target.value)}
                      placeholder="e.g. 三井住友銀行"
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5">
                      Bank Code (4 Digits)
                    </label>
                    <input
                      type="text"
                      value={formData.bankDetails.bankCode}
                      onChange={(e) => handleBankChange('bankCode', e.target.value)}
                      placeholder="e.g. 0009"
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white font-mono"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5">
                      Branch Name (Input in Japanese)
                    </label>
                    <input
                      type="text"
                      value={formData.bankDetails.branchNameJp}
                      onChange={(e) => handleBankChange('branchNameJp', e.target.value)}
                      placeholder="e.g. 横浜支店"
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5">
                      Branch Code (3 Digits)
                    </label>
                    <input
                      type="text"
                      value={formData.bankDetails.branchCode}
                      onChange={(e) => handleBankChange('branchCode', e.target.value)}
                      placeholder="e.g. 210"
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5">
                    Account Type (e.g. 普通 - Futsu / 当座 - Toza)
                  </label>
                  <input
                    type="text"
                    value={formData.bankDetails.accountTypeJp}
                    onChange={(e) => handleBankChange('accountTypeJp', e.target.value)}
                    placeholder="普通 (Futsu / Ordinary Savings)"
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                  />
                </div>
              </div>

              {/* English Bank Details */}
              <div className="p-3.5 bg-slate-50 border border-slate-300 rounded-xl space-y-2.5">
                <div className="text-xs font-bold text-emerald-950 border-b border-slate-200 pb-1.5 flex items-center justify-between">
                  <span className="font-extrabold uppercase tracking-wide">English Bank Account (International Wire)</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded font-mono">SWIFT WIRE</span>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5">
                    Beneficiary / Account Holder Name (English)
                  </label>
                  <input
                    type="text"
                    value={formData.bankDetails.accountNameEn}
                    onChange={(e) => handleBankChange('accountNameEn', e.target.value)}
                    placeholder="e.g. YOKOHAMA TRADING & LOGISTICS CO., LTD."
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white font-medium"
                  />
                  <span className="text-[10px] text-slate-500">Official company name registered with bank</span>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5">
                    Bank Name (English)
                  </label>
                  <input
                    type="text"
                    value={formData.bankDetails.bankNameEn}
                    onChange={(e) => handleBankChange('bankNameEn', e.target.value)}
                    placeholder="e.g. SUMITOMO MITSUI BANKING CORPORATION"
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5">
                      Branch Name (English)
                    </label>
                    <input
                      type="text"
                      value={formData.bankDetails.branchNameEn}
                      onChange={(e) => handleBankChange('branchNameEn', e.target.value)}
                      placeholder="e.g. YOKOHAMA BRANCH"
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5">
                      Account Type (English)
                    </label>
                    <input
                      type="text"
                      value={formData.bankDetails.accountTypeEn}
                      onChange={(e) => handleBankChange('accountTypeEn', e.target.value)}
                      placeholder="SAVINGS / CURRENT"
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5">
                    Account Number (Wire Transfer)
                  </label>
                  <input
                    type="text"
                    value={formData.bankDetails.accountNumber}
                    onChange={(e) => handleBankChange('accountNumber', e.target.value)}
                    placeholder="e.g. 1439210"
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white font-mono font-bold text-sky-950"
                  />
                </div>
              </div>
            </div>

            {/* Live Invoice Bank Layout Preview */}
            <div className="p-3 bg-white border border-sky-200 rounded-xl shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-950 flex items-center gap-1.5">
                  <span>📄 Live Invoice Payment Box Preview (How customers see this on Invoices)</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Real-time sync</span>
              </div>
              <div className="border border-sky-900 rounded overflow-hidden text-[10.5px]">
                <div className="grid grid-cols-2 bg-sky-900 text-white font-bold py-1 px-3 text-center text-xs">
                  <div>JAPANESE (国内振込)</div>
                  <div className="border-l border-sky-800">ENGLISH (SWIFT WIRE)</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 p-2.5 bg-slate-50/90 divide-y md:divide-y-0 md:divide-x divide-slate-300 gap-2">
                  <div className="space-y-0.5">
                    <div><span className="font-bold text-slate-600">口座名義:</span> <span className="font-semibold text-slate-900">{formData.bankDetails.accountNameJp || '—'}</span></div>
                    <div><span className="font-bold text-slate-600">銀行名:</span> {formData.bankDetails.bankNameJp || '—'} (コード: {formData.bankDetails.bankCode || '—'})</div>
                    <div><span className="font-bold text-slate-600">支店名:</span> {formData.bankDetails.branchNameJp || '—'} (コード: {formData.bankDetails.branchCode || '—'})</div>
                    <div><span className="font-bold text-slate-600">口座種別:</span> {formData.bankDetails.accountTypeJp || '普通'}</div>
                    <div className="pt-1 flex items-center gap-2">
                      <span className="font-bold text-slate-800">口座番号:</span>
                      <span className="font-mono font-extrabold text-sky-950 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded text-[11px]">
                        {formData.bankDetails.accountNumber || '—'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-0.5 md:pl-3">
                    <div><span className="font-bold text-slate-600">ACCOUNT NAME:</span> <span className="font-semibold text-slate-900">{formData.bankDetails.accountNameEn || '—'}</span></div>
                    <div><span className="font-bold text-slate-600">BANK:</span> {formData.bankDetails.bankNameEn || '—'}</div>
                    <div><span className="font-bold text-slate-600">BRANCH:</span> {formData.bankDetails.branchNameEn || '—'}</div>
                    <div><span className="font-bold text-slate-600">SWIFT CODE:</span> <span className="font-mono font-bold text-slate-900">{formData.bankDetails.swiftCode || '—'}</span></div>
                    <div className="pt-1 flex items-center gap-2">
                      <span className="font-bold text-slate-800">ACCOUNT NO:</span>
                      <span className="font-mono font-extrabold text-sky-950 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded text-[11px]">
                        {formData.bankDetails.accountNumber || '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reset Demo Data options */}
          <div className="pt-4 border-t border-slate-200">
            {!showResetConfirm ? (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 font-medium transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Demo Records
              </button>
            ) : (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs text-rose-800 font-medium">
                  Reset all bookings, invoices, and settings to original sample records?
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="px-2.5 py-1 text-xs text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onResetData();
                      setShowResetConfirm(false);
                      onClose();
                    }}
                    className="px-2.5 py-1 text-xs text-white bg-rose-600 hover:bg-rose-700 rounded font-semibold shadow-xs"
                  >
                    Yes, Reset
                  </button>
                </div>
              </div>
            )}
          </div>
          </div>

          {/* Sticky Actions Footer */}
          <div className="flex items-center justify-end gap-2.5 px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 shrink-0">
            <button
              type="button"
              onClick={requestClose}
              className="flex-1 sm:flex-none px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 sm:flex-none px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-sky-700 rounded-lg hover:bg-sky-800 shadow-sm transition-colors"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>

    <UnsavedChangesDialog
      isOpen={showUnsavedPrompt}
      onKeepEditing={() => setShowUnsavedPrompt(false)}
      onDiscardAndClose={forceClose}
    />
    </>
  );
};
