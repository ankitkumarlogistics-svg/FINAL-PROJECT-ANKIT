import React, { useState, useRef, useEffect } from 'react';
import { BookingConfirmation, CompanyProfile } from '../types';
import { JapaneseSeal } from './JapaneseSeal';
import { CompanyLogo } from './CompanyLogo';
import {
  Printer,
  X,
  FileCheck2,
  AlertCircle,
  Download,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { downloadElementAsPdf } from '../utils/pdfExport';

interface KycPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingConfirmation | null;
  company: CompanyProfile;
}

export const KycPrintModal: React.FC<KycPrintModalProps> = ({
  isOpen,
  onClose,
  booking,
  company,
}) => {
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setHasConfirmed(false);
      return;
    }
    setHasConfirmed(false);
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, booking?.id, onClose]);

  if (!isOpen || !booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printAreaRef.current) return;
    setIsDownloading(true);
    try {
      await downloadElementAsPdf({
        elementId: 'kyc-print-area',
        filename: `KYC_Verification_${booking.customerCompany.replace(/[^a-zA-Z0-9]/g, '_')}_${booking.bookingNumber}.pdf`,
      });
    } catch (err) {
      console.error('PDF download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden my-6 border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-emerald-700" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              KYC Verification Document Generator
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Confirmation Prompt (Requested: "MUJE YE KYC PRINT KA OPTION HO TAB MUJE SE ASK KARE .JAB KYC PRINT KARU TO KYC SE -->>HEAD KA DATA NA AYE FPOD POD") */}
        {!hasConfirmed ? (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
              <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <h4 className="font-bold text-amber-950">Confirm KYC Print Format</h4>
                <p>
                  As per your KYC compliance requirement, printing this document will{' '}
                  <span className="font-bold underline text-amber-950">
                    EXCLUDE the Vessel, Voyage, Cut-off date, ETD, ETA, POD, and FPOD schedule header
                  </span>
                  .
                </p>
                <p className="text-xs text-amber-800 pt-1">
                  Only verified Shipper, Consignee, Notify Party, Customer, Tax IDs, and Addresses will be generated on this official KYC sheet.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="font-bold text-slate-700 uppercase tracking-wider">KYC Target Entity</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-800">
                <div>
                  <span className="text-slate-500">Customer:</span>{' '}
                  <span className="font-semibold">{booking.customerCompany}</span>
                </div>
                <div>
                  <span className="text-slate-500">Reference:</span>{' '}
                  <span className="font-mono font-semibold">{booking.bookingNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500">Shipper:</span>{' '}
                  <span className="font-semibold">{booking.shipperCompany || 'As per record'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Consignee:</span>{' '}
                  <span className="font-semibold">{booking.consigneeCompany || 'As per record'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setHasConfirmed(true)}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Yes, Confirm & Generate KYC (Exclude Schedule Head)</span>
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: KYC Print Preview */
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-200">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Schedule Head Excluded (POD / FPOD / Vessel / Voyage Hidden)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isDownloading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isDownloading ? 'Exporting PDF...' : 'Download KYC PDF'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-xs transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
              </div>
            </div>

            {/* Document Print Area */}
            <div className="max-h-[70vh] overflow-y-auto border border-slate-300 rounded-xl bg-slate-100 p-2 sm:p-6">
              <div
                ref={printAreaRef}
                id="kyc-print-area"
                className="bg-white mx-auto p-6 sm:p-10 shadow-md rounded-lg max-w-2xl text-slate-900 font-sans border border-slate-200"
                style={{ minHeight: '800px' }}
              >
                {/* Official Letterhead */}
                <div className="border-b-2 border-slate-900 pb-4 mb-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <CompanyLogo
                        customLogoUrl={company.customLogoUrl}
                        size="document"
                        className="max-h-[64px]"
                      />
                      <div>
                        <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                          {company.companyNameEn}
                        </h1>
                        <div className="text-xs font-semibold text-slate-700">
                          {company.companyNameJp}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {company.addressEn} | TEL: {company.phone} | FAX: {company.fax}
                        </div>
                        <div className="text-[11px] text-slate-600 font-medium">
                          Corporate Reg / Tax No: {company.registrationNumber}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <JapaneseSeal
                        text={company.companyNameJp}
                        size="md"
                      />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                    <div className="text-base font-extrabold tracking-wider uppercase text-slate-900">
                      KNOW YOUR CUSTOMER (KYC) VERIFICATION RECORD
                    </div>
                    <div className="text-xs font-mono text-slate-600">
                      Date: {booking.date || new Date().toISOString().split('T')[0]}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 italic mt-0.5">
                    Official Party & Consignment KYC Authentication Sheet
                  </div>
                </div>

                {/* Notice Badge in print */}
                <div className="mb-4 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-[11px] text-slate-600 flex items-center justify-between">
                  <span>
                    <strong>KYC Classification:</strong> Customer & Consignment Identity Verification
                  </span>
                  <span className="font-semibold text-slate-500">
                    Schedule Headers Stripped (Compliant)
                  </span>
                </div>

                {/* Customer Account */}
                <div className="mb-4 border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                  <div className="text-[11px] font-bold text-sky-800 uppercase tracking-wider mb-1">
                    1. Account & Customer Entity
                  </div>
                  <div className="text-sm font-bold text-slate-900">{booking.customerCompany}</div>
                  <div className="text-xs text-slate-600">
                    Forwarder / Handling Agent: {booking.forwarderCompany || company.companyNameEn}
                  </div>
                </div>

                {/* Shipper Details */}
                <div className="mb-4 border border-slate-200 rounded-lg p-3">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    2. Shipper Details
                  </div>
                  <div className="text-sm font-bold text-slate-900">{booking.shipperCompany}</div>
                  <div className="text-xs text-slate-600 mt-1">
                    Export Origin: JAPAN | Freight Term: {booking.freightTerm || 'PREPAID as arranged'}
                  </div>
                </div>

                {/* Consignee Details */}
                <div className="mb-4 border border-slate-200 rounded-lg p-3">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    3. Consignee Details (Receiving Party)
                  </div>
                  <div className="text-sm font-bold text-slate-900">{booking.consigneeCompany}</div>
                  <div className="text-xs text-slate-600 mt-1">
                    Destination Party Verified for Import Customs
                  </div>
                </div>

                {/* Notify Party */}
                <div className="mb-4 border border-slate-200 rounded-lg p-3">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    4. Notify Party (Also Notify)
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {booking.notifyParty || 'SAME AS CONSIGNEE'}
                  </div>
                  {booking.alsoNotifyParty && (
                    <div className="mt-2 pt-2 border-t border-slate-100 text-xs">
                      <span className="font-bold text-slate-700">Secondary Also Notify:</span>{' '}
                      <span className="text-slate-800 font-semibold">{booking.alsoNotifyParty}</span>
                    </div>
                  )}
                </div>

                {/* Cargo Volume Information */}
                <div className="mb-4">
                  <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Cargo Volume / Container Specification</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">
                      {booking.cargoVolumeSize || 'Containerized'}
                    </div>
                  </div>
                </div>

                {/* Commodity Description */}
                <div className="mb-4 border border-slate-200 rounded-lg p-3">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    5. Verified Commodity & Description
                  </div>
                  <div className="text-xs font-semibold text-slate-800">
                    {booking.commodity || 'USED MOTOR VEHICLES & AUTO PARTS'}
                  </div>
                  {booking.remarks && (
                    <div className="mt-2 text-[11px] text-slate-500 italic">
                      Remarks: {booking.remarks}
                    </div>
                  )}
                </div>

                {/* Sign-off & Verification Seal */}
                <div className="mt-8 pt-4 border-t-2 border-slate-300 flex items-end justify-between">
                  <div className="text-[10px] text-slate-500 space-y-1">
                    <div>Document Reference: {booking.bookingNumber}</div>
                    <div>Authorized Issuer: {company.ownerNameEn}</div>
                    <div>Yokohama Trading & Logistics Documentation Dept.</div>
                  </div>
                  <div className="text-center">
                    <div className="w-40 border-b border-slate-400 mb-1"></div>
                    <div className="text-[10px] font-bold text-slate-600 uppercase">
                      Authorized Signature & Seal
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
