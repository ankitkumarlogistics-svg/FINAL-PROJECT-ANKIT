import React, { useState, useEffect, useRef } from 'react';
import { BookingConfirmation, FreightInvoice, Quotation, CompanyProfile } from '../types';
import { X, Mail, Download, Copy, Check } from 'lucide-react';

interface SendCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: 'booking' | 'invoice' | 'quotation';
  booking?: BookingConfirmation | null;
  invoice?: FreightInvoice | null;
  quotation?: Quotation | null;
  company: CompanyProfile;
  onDownloadPdf: () => void;
}

export const SendCustomerModal: React.FC<SendCustomerModalProps> = ({
  isOpen,
  onClose,
  documentType,
  booking,
  invoice,
  quotation,
  company,
  onDownloadPdf,
}) => {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
      return;
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const customerName =
    documentType === 'booking'
      ? booking?.customerCompany
      : documentType === 'quotation'
      ? quotation?.customerName
      : invoice?.customerName;
  const docRef =
    documentType === 'booking'
      ? `Booking Confirmation #${booking?.bookingNumber}`
      : documentType === 'quotation'
      ? `Freight Quotation #${quotation?.quotationNo}`
      : `Freight Invoice #${invoice?.invoiceNo}`;

  const subject = `${docRef} - ${company.companyNameEn}`;

  let body = '';
  if (documentType === 'booking' && booking) {
    body = `Dear ${booking.customerCompany},

Greetings from ${company.companyNameEn}.

Please find attached your official Booking Confirmation (${booking.bookingNumber}).

Shipment Summary:
- Booking No: ${booking.bookingNumber}
${booking.shipmentNo ? `- Shipment No: ${booking.shipmentNo}\n` : ''}- Shipping Line: ${booking.shippingCompany}
- Vessel / Voyage: ${booking.vessel} ${booking.voyage}
- Port of Loading (POL): ${booking.pol} (ETD: ${booking.etd})
- Port of Discharge (POD): ${booking.pod} (ETA: ${booking.eta})
- CY Cut Date: ${booking.cyCutDate}
- Cargo: ${booking.cargoVolumeSize} · ${booking.commodity}

Important Note:
${booking.note || 'Kindly send us D/R(ACL) and S/I one day prior to CY Cut Date to avoid penalty.'}

For any inquiries or B/L updates, please contact us:
Email: ${company.email}
Phone: ${company.phone} / ${company.mobile}
Fax: ${company.fax}

Best regards,
${company.ownerNameEn}
${company.companyNameEn} (${company.companyNameJp})
${company.addressEn}`;
  } else if (documentType === 'quotation' && quotation) {
    body = `Dear ${quotation.customerName},

Greetings from ${company.companyNameEn}.

Please find attached our Freight Quotation (${quotation.quotationNo}) valid until ${quotation.validUntil}.

Quotation Summary:
- Quotation No: ${quotation.quotationNo}
${quotation.bookingNo ? `- Booking Ref: ${quotation.bookingNo}\n` : ''}${quotation.shipmentNo ? `- Shipment No: ${quotation.shipmentNo}\n` : ''}- Route: ${quotation.portFrom} to ${quotation.portTo}
- Carrier: ${quotation.shippingCompany} (${quotation.vesselVoyage})
- Containers: ${quotation.containerCount} x ${quotation.containerSize || "40' HC"}
- Quoted Total: ¥${quotation.totalSellingJpy.toLocaleString()} JPY (Rate: ¥${quotation.exchangeRate}/USD)

Please confirm your acceptance so we may proceed with booking and invoicing.

Best regards,
${company.ownerNameEn}
${company.companyNameEn} (${company.companyNameJp})
${company.addressEn}`;
  } else if (documentType === 'invoice' && invoice) {
    const rate = invoice.exchangeRate || 155;
    const usdTotal = invoice.items
      .filter((i) => i.currency === 'USD')
      .reduce((s, i) => s + i.unitPrice * (i.quantity || 1), 0);
    const usdConvertedJpy = Math.round(usdTotal * rate);

    body = `Dear ${invoice.customerName},

Greetings from ${company.companyNameEn}.

Please find attached your official Freight Invoice (${invoice.invoiceNo}).

Invoice & Shipment Summary:
- Invoice No: ${invoice.invoiceNo}
- Date: ${invoice.date}
- Shipment Route: ${invoice.portFrom} to ${invoice.portTo}
- Vessel / Voyage: ${invoice.vesselVoyage}
- Container Qty: ${invoice.containerCount || 1} Containers (${invoice.containerSize || "40' HC"})
${invoice.containerNumbers ? `- Container Nos: ${invoice.containerNumbers}\n` : ''}${invoice.sealNumbers ? `- Seal Nos: ${invoice.sealNumbers}\n` : ''}- B/L Reference: ${invoice.blNo || '—'}
${usdTotal > 0 ? `- Ocean Freight (USD): $${usdTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD\n- Applied Exchange Rate: 1 USD = ¥${rate.toFixed(2)} JPY\n- Freight in JPY (Non-taxable): ¥${usdConvertedJpy.toLocaleString()} JPY\n` : ''}- TOTAL AMOUNT PAYABLE: ¥${invoice.grandTotalJpy.toLocaleString()} JPY
- Payment Due Date: ${invoice.paymentDueDate || 'AS AGREED'}

Bank Wire Transfer Information:
- Bank Name: ${company.bankDetails.bankNameEn} (${company.bankDetails.bankNameJp})
- Branch: ${company.bankDetails.branchNameEn} / ${company.bankDetails.branchNameJp}
- Beneficiary Name: ${company.bankDetails.accountNameEn}
- Account Number (口座番号): ${company.bankDetails.accountNumber}
- SWIFT Code: ${company.bankDetails.swiftCode}

Please reply with the bank remittance confirmation slip once payment has been executed.

Email: ${company.email}
Phone: ${company.phone} / ${company.mobile}

Best regards,
${company.ownerNameEn}
${company.companyNameEn} (${company.companyNameJp})
${company.addressEn}`;
  }

  const mailtoUrl = `mailto:?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(body);
    setCopied(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl my-auto overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-100 text-sky-800 rounded-lg">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Send Document to Customer
              </h3>
              <p className="text-xs text-slate-500">
                {customerName} · {docRef}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Step 1 banner: Download PDF */}
          <div className="p-3 sm:p-3.5 bg-sky-50 border border-sky-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <div className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                <span>Step 1: Download the PDF to your device</span>
              </div>
              <div className="text-[11px] text-sky-800 mt-0.5">
                Download the official A4 PDF file to attach to your email or WhatsApp message
              </div>
            </div>
            <button
              type="button"
              onClick={onDownloadPdf}
              className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-xs flex items-center justify-center gap-1.5 shrink-0 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>

          {/* Email Subject preview */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Subject
            </label>
            <input
              type="text"
              readOnly
              value={subject}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md font-medium text-slate-800"
            />
          </div>

          {/* Message Text preview */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Email / WhatsApp Message Content
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] text-sky-700 hover:text-sky-900 font-semibold flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Text
                  </>
                )}
              </button>
            </div>
            <textarea
              readOnly
              rows={6}
              value={body}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-md font-mono text-slate-800 leading-relaxed"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-t border-slate-200">
            <span className="text-[11px] text-slate-500">
              Sender: <strong className="text-slate-700">{company.email}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 sm:flex-none px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Text
              </button>

              <a
                href={mailtoUrl}
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                Open Email
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
