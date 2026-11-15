import React, { useState, useEffect } from 'react';
import { BookingConfirmation, FreightInvoice, Quotation, CompanyProfile } from '../types';
import { BookingDocumentView } from './BookingDocumentView';
import { InvoiceDocumentView } from './InvoiceDocumentView';
import { QuotationDocumentView } from './QuotationDocumentView';
import { downloadElementAsPdf, printElement } from '../utils/pdfExport';
import { exportBookingsToExcel, exportInvoicesToExcel, exportQuotationsToExcel } from '../utils/excelExport';
import { X, Printer, Download, FileSpreadsheet, Edit3, ArrowRight, Check, Mail, ZoomIn, ZoomOut } from 'lucide-react';

interface DocumentViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: 'booking' | 'invoice' | 'quotation';
  booking?: BookingConfirmation | null;
  invoice?: FreightInvoice | null;
  quotation?: Quotation | null;
  company: CompanyProfile;
  onEdit: () => void;
  onConvertToInvoice?: (booking: BookingConfirmation) => void;
  onConvertQuotationToInvoice?: (quotation: Quotation) => void;
  onOpenSendModal?: () => void;
}

export const DocumentViewModal: React.FC<DocumentViewModalProps> = ({
  isOpen,
  onClose,
  documentType,
  booking,
  invoice,
  quotation,
  company,
  onEdit,
  onConvertToInvoice,
  onConvertQuotationToInvoice,
  onOpenSendModal,
}) => {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isFitMode, setIsFitMode] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const title =
    documentType === 'booking'
      ? `Booking #${booking?.bookingNumber}`
      : documentType === 'quotation'
      ? `Quotation #${quotation?.quotationNo}`
      : `Invoice #${invoice?.invoiceNo}`;

  const elementId =
    documentType === 'booking'
      ? 'booking-print-document'
      : documentType === 'quotation'
      ? 'quotation-print-document'
      : 'invoice-print-document';

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      const filename =
        documentType === 'booking'
          ? `Booking_${booking?.bookingNumber || 'doc'}.pdf`
          : documentType === 'quotation'
          ? `Quotation_${quotation?.quotationNo || 'doc'}.pdf`
          : `Invoice_${invoice?.invoiceNo || 'doc'}.pdf`;

      await downloadElementAsPdf({
        elementId,
        filename,
        fitToSinglePage: true,
        marginMm: 5,
      });
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('PDF generation error, falling back to print dialog:', err);
      // Fallback directly to native print dialog without window.alert
      window.print();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleExcelExportSingle = () => {
    if (documentType === 'booking' && booking) {
      exportBookingsToExcel([booking]);
    } else if (documentType === 'invoice' && invoice) {
      exportInvoicesToExcel([invoice]);
    } else if (documentType === 'quotation' && quotation) {
      exportQuotationsToExcel([quotation]);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-1 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-slate-100 rounded-xl shadow-2xl border border-slate-300 w-full max-w-5xl my-auto overflow-hidden flex flex-col max-h-[96vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between gap-2 px-3 sm:px-6 py-2.5 sm:py-3.5 bg-slate-900 text-white shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold tracking-tight text-white truncate">{title}</h3>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                A4 Standard (210×297mm)
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 hidden xs:block truncate">
              Official Document · Scaled to fit 1 A4 Page without cutoff
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Direct PDF Download button - PROMINENT */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-lg flex items-center gap-1 sm:gap-1.5 shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="hidden sm:inline">Downloaded!</span>
                </>
              ) : isDownloadingPdf ? (
                'Creating...'
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </>
              )}
            </button>

            {/* Print / Save as PDF native vector print */}
            <button
              type="button"
              onClick={printElement}
              className="hidden sm:flex px-3.5 py-2 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg items-center gap-1.5 shadow-xs transition-colors"
              title="Print directly or save as vector PDF with native print dialog"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>

            {/* Send to Customer button */}
            {onOpenSendModal && (
              <button
                type="button"
                onClick={onOpenSendModal}
                className="hidden sm:flex px-3.5 py-2 text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg items-center gap-1.5 shadow-xs transition-colors"
                title="Send via Email or Copy WhatsApp Message"
              >
                <Mail className="w-3.5 h-3.5" />
                Send
              </button>
            )}

            {/* Convert to Invoice button if it is a booking */}
            {documentType === 'booking' && booking && onConvertToInvoice && (
              <button
                type="button"
                onClick={() => {
                  onConvertToInvoice(booking);
                  onClose();
                }}
                className="hidden md:flex px-3 py-1.5 text-xs font-semibold text-sky-100 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 items-center gap-1.5 transition-colors"
                title="Create an invoice from this booking"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                To Invoice
              </button>
            )}

            {/* Convert to Invoice button if it is a quotation */}
            {documentType === 'quotation' && quotation && onConvertQuotationToInvoice && (
              <button
                type="button"
                onClick={() => {
                  onConvertQuotationToInvoice(quotation);
                  onClose();
                }}
                className="hidden md:flex px-3 py-1.5 text-xs font-semibold text-emerald-100 bg-emerald-800 hover:bg-emerald-700 rounded-md border border-emerald-700 items-center gap-1.5 transition-colors"
                title="Generate Invoice from Agreed Quotation"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                To Invoice
              </button>
            )}

            {/* Edit button */}
            <button
              type="button"
              onClick={() => {
                onEdit();
                onClose();
              }}
              className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 flex items-center gap-1 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </button>

            {/* Excel export */}
            <button
              type="button"
              onClick={handleExcelExportSingle}
              className="hidden sm:flex px-3 py-1.5 text-xs font-semibold text-emerald-200 bg-emerald-950/80 hover:bg-emerald-900 rounded-md border border-emerald-800 items-center gap-1.5 transition-colors"
              title="Download this record in Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              Excel
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Fit / Zoom Control Bar */}
        <div className="sm:hidden px-3 py-1.5 bg-slate-800 text-white flex items-center justify-between text-[11px] shrink-0 border-b border-slate-700">
          <span className="text-slate-300">
            {isFitMode ? 'A4 Scaled to Mobile' : 'A4 Full Scale (100%)'}
          </span>
          <button
            type="button"
            onClick={() => setIsFitMode(!isFitMode)}
            className="px-2.5 py-0.5 bg-sky-700 hover:bg-sky-600 text-white font-bold rounded flex items-center gap-1"
          >
            {isFitMode ? (
              <>
                <ZoomIn className="w-3 h-3" />
                <span>Zoom 100%</span>
              </>
            ) : (
              <>
                <ZoomOut className="w-3 h-3" />
                <span>Fit Screen</span>
              </>
            )}
          </button>
        </div>

        {/* Document Scrollable Area */}
        <div className="p-2 sm:p-8 overflow-y-auto overflow-x-auto bg-slate-200/80 flex-1 flex justify-center">
          <div
            className={`transition-transform duration-200 ${
              isFitMode
                ? 'scale-[0.43] xs:scale-[0.48] sm:scale-100 origin-top h-[540px] sm:h-auto'
                : 'scale-100'
            }`}
          >
            {documentType === 'booking' && booking && (
              <BookingDocumentView booking={booking} company={company} id={elementId} />
            )}

            {documentType === 'invoice' && invoice && (
              <InvoiceDocumentView invoice={invoice} company={company} id={elementId} />
            )}

            {documentType === 'quotation' && quotation && (
              <QuotationDocumentView quotation={quotation} company={company} id={elementId} />
            )}
          </div>
        </div>

        {/* Mobile Sticky Bottom Action Bar */}
        <div className="sm:hidden p-2.5 bg-slate-900 border-t border-slate-800 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="flex-1 py-2 px-3 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-lg flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloadSuccess ? 'Downloaded!' : isDownloadingPdf ? 'Creating...' : 'Download PDF'}</span>
          </button>

          {onOpenSendModal && (
            <button
              type="button"
              onClick={onOpenSendModal}
              className="py-2 px-3 text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg flex items-center justify-center gap-1 shadow-xs active:scale-95"
            >
              <Mail className="w-3.5 h-3.5 text-emerald-950" />
              <span>Send</span>
            </button>
          )}

          <button
            type="button"
            onClick={printElement}
            className="py-2 px-2.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg flex items-center justify-center"
            title="Print"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
