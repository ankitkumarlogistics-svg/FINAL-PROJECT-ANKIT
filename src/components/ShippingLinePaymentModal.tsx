import React, { useState, useEffect, useCallback } from 'react';
import {
  ShippingLinePayment,
  BookingConfirmation,
  Quotation,
  PaymentTransaction,
} from '../types';
import { computeShippingPaymentFinance } from '../utils/interconnection';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';
import { X, Link2, Anchor, PlusCircle, Sparkles } from 'lucide-react';

interface ShippingLinePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payment: ShippingLinePayment) => void;
  initialData?: ShippingLinePayment | null;
  prefillFromBooking?: BookingConfirmation | null;
  prefillFromQuotation?: Quotation | null;
  availableBookings: BookingConfirmation[];
  availableQuotations: Quotation[];
  shippingLines: string[];
}

export const ShippingLinePaymentModal: React.FC<ShippingLinePaymentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  prefillFromBooking,
  prefillFromQuotation,
  availableBookings,
  availableQuotations,
  shippingLines,
}) => {
  const [formData, setFormData] = useState<Partial<ShippingLinePayment>>({
    paymentRefNo: '',
    shippingLineName: '',
    bookingNo: '',
    shipmentNo: '',
    blNo: '',
    customerName: '',
    containerCount: 1,
    containerSize: "40' HC",
    containerDetails: '',
    vesselVoyage: '',
    portFrom: '',
    portTo: '',
    payableAmountJpy: 0,
    amountPaidJpy: 0,
    paymentDeadline: '',
    paymentDate: '',
    remarks: '',
  });

  const [paymentHistory, setPaymentHistory] = useState<PaymentTransaction[]>([]);
  const [addPayAmount, setAddPayAmount] = useState<number>(0);
  const [addPayDate, setAddPayDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [addPayRef, setAddPayRef] = useState<string>('');
  const [addPayNotes, setAddPayNotes] = useState<string>('');
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);

  const applyBooking = (b: BookingConfirmation) => {
    const count = b.containerCount || 1;
    const size = b.containerSize || "40' HC";
    const details = b.containerNumbers
      ? `${count} X ${size} (${b.containerNumbers})`
      : b.cargoVolumeSize || `${count} X ${size}`;
    setFormData((prev) => ({
      ...prev,
      linkedBookingId: b.id,
      bookingNo: b.bookingNumber,
      shipmentNo: b.shipmentNo || prev.shipmentNo || '',
      blNo: b.blNo || prev.blNo || '',
      customerName: b.customerCompany,
      shippingLineName: b.shippingCompany || prev.shippingLineName || '',
      containerCount: count,
      containerSize: size,
      containerDetails: details,
      vesselVoyage: `${b.vessel || ''} ${b.voyage || ''}`.trim(),
      portFrom: b.pol || b.por || '',
      portTo: b.pod || b.pody || '',
    }));
  };

  const applyQuotation = (q: Quotation) => {
    const details = q.containerNumbers
      ? `${q.containerCount || 1} X ${q.containerSize || "40' HC"} (${q.containerNumbers})`
      : q.shipmentMode || `${q.containerCount || 1} X ${q.containerSize || "40' HC"}`;
    setFormData((prev) => ({
      ...prev,
      linkedQuotationId: q.id,
      linkedBookingId: q.linkedBookingId || prev.linkedBookingId,
      linkedInvoiceId: q.linkedInvoiceId || prev.linkedInvoiceId,
      bookingNo: q.bookingNo || prev.bookingNo || '',
      shipmentNo: q.shipmentNo || prev.shipmentNo || '',
      blNo: q.blNo || prev.blNo || '',
      customerName: q.customerName,
      shippingLineName: q.shippingCompany || prev.shippingLineName || '',
      containerCount: q.containerCount || 1,
      containerSize: q.containerSize || "40' HC",
      containerDetails: details,
      vesselVoyage: q.vesselVoyage || '',
      portFrom: q.portFrom || '',
      portTo: q.portTo || '',
      payableAmountJpy: q.totalCostJpy > 0 ? Math.round(q.totalCostJpy) : prev.payableAmountJpy || 0,
    }));
  };

  useEffect(() => {
    if (!isOpen) {
      setIsDirty(false);
      setShowUnsavedPrompt(false);
      return;
    }
    setAddPayAmount(0);
    setAddPayDate(new Date().toISOString().slice(0, 10));
    setAddPayRef('');
    setAddPayNotes('');
    setIsDirty(false);
    setShowUnsavedPrompt(false);

    if (initialData) {
      setFormData(initialData);
      setPaymentHistory(initialData.paymentHistory || []);
    } else {
      const rnd = Math.floor(1000 + Math.random() * 9000);
      setFormData({
        paymentRefNo: `SLP-2026-${rnd}`,
        shippingLineName: '',
        bookingNo: '',
        shipmentNo: '',
        blNo: '',
        customerName: '',
        containerCount: 1,
        containerSize: "40' HC",
        containerDetails: '',
        vesselVoyage: '',
        portFrom: '',
        portTo: '',
        payableAmountJpy: 0,
        amountPaidJpy: 0,
        paymentDeadline: '',
        paymentDate: '',
        remarks: '',
      });
      setPaymentHistory([]);
      if (prefillFromBooking) {
        const timer = setTimeout(() => applyBooking(prefillFromBooking), 0);
        return () => clearTimeout(timer);
      } else if (prefillFromQuotation) {
        const timer = setTimeout(() => applyQuotation(prefillFromQuotation), 0);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, initialData, prefillFromBooking, prefillFromQuotation]);

  const forceClose = useCallback(() => {
    setShowUnsavedPrompt(false);
    setIsDirty(false);
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

  const payable = Math.max(0, Math.round(Number(formData.payableAmountJpy) || 0));
  const basePaid = Math.max(0, Math.round(Number(formData.amountPaidJpy) || 0));
  const extraPay = Math.max(0, Math.round(Number(addPayAmount) || 0));
  const projectedPaid = Math.min(payable > 0 ? payable : basePaid + extraPay, basePaid + extraPay);
  const projectedOutstanding = Math.max(0, payable - projectedPaid);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    const finalHistory = [...paymentHistory];
    let finalPayDate = formData.paymentDate || '';

    if (extraPay > 0) {
      finalHistory.push({
        id: `slh-${Date.now()}`,
        date: addPayDate,
        amountJpy: extraPay,
        method: 'Bank Wire / Domestic Transfer',
        reference: addPayRef.trim() || undefined,
        notes: addPayNotes.trim() || 'Shipping line payment recorded',
      });
      finalPayDate = addPayDate;
    }

    const baseRecord: ShippingLinePayment = {
      ...(formData as ShippingLinePayment),
      id: initialData?.id || `slp-${Date.now()}`,
      paymentRefNo:
        formData.paymentRefNo?.trim() || `SLP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      shippingLineName: formData.shippingLineName?.trim() || 'Shipping Line',
      bookingNo: formData.bookingNo?.trim() || '',
      shipmentNo: formData.shipmentNo?.trim() || '',
      blNo: formData.blNo?.trim() || '',
      customerName: formData.customerName?.trim() || '',
      containerCount: Number(formData.containerCount) || 1,
      containerSize: formData.containerSize || "40' HC",
      containerDetails: formData.containerDetails?.trim() || `${formData.containerCount || 1} Container`,
      payableAmountJpy: payable,
      amountPaidJpy: projectedPaid,
      outstandingAmountJpy: projectedOutstanding,
      paymentDeadline: formData.paymentDeadline || '',
      paymentDate: finalPayDate,
      status: 'PENDING',
      paymentHistory: finalHistory,
      remarks: formData.remarks || '',
      createdAt: initialData?.createdAt || now,
      updatedAt: now,
    };

    const fin = computeShippingPaymentFinance(baseRecord);
    baseRecord.status = fin.storageStatus;
    baseRecord.outstandingAmountJpy = fin.outstandingJpy;

    onSave(baseRecord);
    forceClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-5 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) requestClose();
        }}
      >
        <div
          className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl my-auto overflow-hidden flex flex-col max-h-[94vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
                <Anchor className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {initialData ? `Shipping Line Payment · ${initialData.paymentRefNo}` : 'Record Shipping Line Payable'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Link Booking/Quotation, set carrier payment deadline, and track outstanding carrier balance
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={requestClose}
              aria-label="Close modal"
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        {/* Link from Booking or Quotation */}
        <div className="px-5 py-2.5 bg-sky-50 border-b border-sky-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-sky-700 shrink-0" />
            <select
              value={formData.linkedBookingId || ''}
              onChange={(e) => {
                const b = availableBookings.find((x) => x.id === e.target.value);
                if (b) applyBooking(b);
              }}
              className="w-full text-xs bg-white border border-sky-300 rounded px-2 py-1.5 font-semibold"
            >
              <option value="">Autofill from Booking...</option>
              {availableBookings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bookingNumber} · {b.shippingCompany} ({b.customerCompany})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-amber-700 shrink-0" />
            <select
              value={formData.linkedQuotationId || ''}
              onChange={(e) => {
                const q = availableQuotations.find((x) => x.id === e.target.value);
                if (q) applyQuotation(q);
              }}
              className="w-full text-xs bg-white border border-amber-300 rounded px-2 py-1.5 font-semibold"
            >
              <option value="">Autofill Cost from Quotation...</option>
              {availableQuotations.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.quotationNo} · Cost ¥{Math.round(q.totalCostJpy).toLocaleString()} ({q.customerName})
                </option>
              ))}
            </select>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          onChange={() => setIsDirty(true)}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
            {/* Financial Summary Bar */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-900 text-white rounded-xl">
              <div>
                <div className="text-[10px] uppercase text-slate-400 font-bold">Payable Amount</div>
                <div className="text-base font-mono font-bold text-white tabular-nums">
                  ¥{payable.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-slate-400 font-bold">Total Paid</div>
                <div className="text-base font-mono font-bold text-emerald-400 tabular-nums">
                  ¥{projectedPaid.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-slate-400 font-bold">Outstanding</div>
                <div
                  className={`text-base font-mono font-extrabold tabular-nums ${
                    projectedOutstanding > 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  ¥{projectedOutstanding.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 uppercase">Payment Ref No</label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({
                        ...p,
                        paymentRefNo: `SLP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                      }))
                    }
                    className="text-[10px] text-sky-700 hover:underline flex items-center gap-0.5 font-semibold"
                  >
                    <Sparkles className="w-2.5 h-2.5" /> Auto
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.paymentRefNo || ''}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, paymentRefNo: e.target.value.toUpperCase() }))
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Shipping Line Name *
                </label>
                <input
                  type="text"
                  required
                  list="sl-names-list"
                  value={formData.shippingLineName || ''}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, shippingLineName: e.target.value }))
                  }
                  placeholder="e.g. CMA-CGM, ONE, TS LINES, MAERSK"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                />
                <datalist id="sl-names-list">
                  {shippingLines.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Linked Refs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Booking No</label>
                <input
                  type="text"
                  value={formData.bookingNo || ''}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, bookingNo: e.target.value.toUpperCase() }))
                  }
                  className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">B/L No</label>
                <input
                  type="text"
                  value={formData.blNo || ''}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, blNo: e.target.value.toUpperCase() }))
                  }
                  className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Shipment No</label>
                <input
                  type="text"
                  value={formData.shipmentNo || ''}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, shipmentNo: e.target.value.toUpperCase() }))
                  }
                  className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Customer</label>
                <input
                  type="text"
                  value={formData.customerName || ''}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, customerName: e.target.value }))
                  }
                  className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {/* Container Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Container Qty
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.containerCount || 1}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      containerCount: Math.max(1, parseInt(e.target.value, 10) || 1),
                    }))
                  }
                  className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Container Details (Size &amp; Numbers) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.containerDetails || ''}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, containerDetails: e.target.value }))
                  }
                  placeholder="e.g. 2 X 40' HC (MSCU1234567, TGHU7654321)"
                  className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg font-medium"
                />
              </div>
            </div>

            {/* Amounts & Manual Payment Deadline */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Payable Amount (JPY) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.payableAmountJpy ?? 0}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      payableAmountJpy: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                  className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Already Paid (JPY)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.amountPaidJpy ?? 0}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      amountPaidJpy: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                  className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold text-emerald-800"
                />
              </div>

              <div>
                <label className="block font-bold text-rose-700 uppercase mb-1">
                  Payment Deadline *
                </label>
                <input
                  type="date"
                  required
                  value={formData.paymentDeadline || ''}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, paymentDeadline: e.target.value }))
                  }
                  className="w-full px-2.5 py-2 text-xs border border-rose-300 bg-rose-50/40 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Last Payment Date
                </label>
                <input
                  type="date"
                  value={formData.paymentDate || ''}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, paymentDate: e.target.value }))
                  }
                  className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                />
              </div>
            </div>

            {/* Record New Installment Section */}
            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-emerald-700" />
                  <span>Record a New Payment Transaction (Optional)</span>
                </span>
                {projectedOutstanding > 0 && (
                  <button
                    type="button"
                    onClick={() => setAddPayAmount(Math.max(0, payable - basePaid))}
                    className="text-[11px] font-bold text-emerald-800 underline"
                  >
                    Fill Remaining ¥{Math.max(0, payable - basePaid).toLocaleString()}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="Amount JPY"
                  value={addPayAmount || ''}
                  onChange={(e) => setAddPayAmount(parseInt(e.target.value, 10) || 0)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-emerald-300 rounded font-mono font-bold"
                />
                <input
                  type="date"
                  value={addPayDate}
                  onChange={(e) => setAddPayDate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded font-mono"
                />
                <input
                  type="text"
                  placeholder="Wire / Slip Ref"
                  value={addPayRef}
                  onChange={(e) => setAddPayRef(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded font-mono"
                />
                <input
                  type="text"
                  placeholder="Payment note"
                  value={addPayNotes}
                  onChange={(e) => setAddPayNotes(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Remarks</label>
              <textarea
                rows={2}
                value={formData.remarks || ''}
                onChange={(e) => setFormData((p) => ({ ...p, remarks: e.target.value }))}
                placeholder="B/L release conditions or carrier remittance notes..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 px-5 py-3 bg-slate-50 border-t border-slate-200 shrink-0">
            <button
              type="button"
              onClick={requestClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-xs"
            >
              {initialData ? 'Update Shipping Line Payment' : 'Save Shipping Line Payment'}
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
