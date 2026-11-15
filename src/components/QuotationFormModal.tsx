import React, { useState, useEffect, useCallback } from 'react';
import {
  Quotation,
  QuotationStatus,
  QuotationMethod,
  InvoiceItem,
  BookingConfirmation,
  Customer,
} from '../types';
import {
  DEFAULT_QUOTATION_TERMS,
  formatTermsListToText,
  getQuotationTermsArray,
} from '../utils/interconnection';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';
import {
  X,
  Plus,
  Trash2,
  Link2,
  FileText,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Info,
} from 'lucide-react';

interface QuotationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (quotation: Quotation) => void;
  initialData?: Quotation | null;
  availableBookings: BookingConfirmation[];
  customers: Customer[];
  prefillFromBooking?: BookingConfirmation | null;
}

const SELLING_CHARGE_TYPES = [
  'Freight',
  'Doc Fee',
  'THC',
  'Seal Fee',
  'Custom Clearance',
  'Drayage',
  'Inspection Fee',
  'Other Charges',
];

export const QuotationFormModal: React.FC<QuotationFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  availableBookings,
  customers,
  prefillFromBooking,
}) => {
  const [quotationMethod, setQuotationMethod] = useState<QuotationMethod>('REFERENCE');
  const [formData, setFormData] = useState<Partial<Quotation>>({
    quotationNo: '',
    date: new Date().toISOString().slice(0, 10),
    validUntil: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    status: 'DRAFT',
    bookingNo: '',
    shipmentNo: '',
    blNo: '',
    customerName: '',
    customerAddress: '',
    customerEmail: '',
    portFrom: 'NAGOYA',
    portTo: 'DUBLIN',
    shippingCompany: 'CMA-CGM',
    vesselVoyage: '',
    etd: '',
    eta: '',
    shipmentMode: "1 X 40' HC",
    freightTerm: 'PREPAID',
    exchangeRate: 155,
    containerCount: 1,
    containerSize: "40' HC",
    containerNumbers: '',
    remarks: '',
  });

  const [sellingItems, setSellingItems] = useState<InvoiceItem[]>([]);
  const [termsList, setTermsList] = useState<string[]>([...DEFAULT_QUOTATION_TERMS]);
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);
  const [validationError, setValidationError] = useState('');

  const computeLineJpy = (
    currency: 'USD' | 'JPY' | 'EURO',
    unitAmount: number,
    quantity: number | undefined | null,
    taxRate: number,
    rate: number
  ) => {
    const qty =
      quantity === undefined || quantity === null || isNaN(Number(quantity)) || Number(quantity) <= 0
        ? 1
        : Number(quantity);
    const base = (Number(unitAmount) || 0) * qty;
    const withTax = base * (1 + (Number(taxRate) || 0) / 100);
    if (currency === 'USD' || currency === 'EURO') {
      return Math.round(withTax * (Number(rate) || 1));
    }
    return Math.round(withTax);
  };

  const applyBooking = useCallback(
    (b: BookingConfirmation, forceFillItems = false) => {
      const matchCount = b.cargoVolumeSize?.match(/(\d+)\s*X/i);
      const parsedCount = b.containerCount || (matchCount ? parseInt(matchCount[1], 10) : 1);
      const parsedSize = b.containerSize || (b.cargoVolumeSize?.includes('20') ? "20' GP" : "40' HC");
      const matchedCustomer = customers.find(
        (c) => c.name.trim().toLowerCase() === (b.customerCompany || '').trim().toLowerCase()
      );
      const addr = matchedCustomer
        ? [matchedCustomer.addressLine1, matchedCustomer.addressLine2].filter(Boolean).join(', ')
        : b.consigneeAddress || '';

      setQuotationMethod('CONFIRMED_BOOKING');
      setFormData((prev) => ({
        ...prev,
        linkedBookingId: b.id,
        bookingNo: b.bookingNumber,
        shipmentNo: b.shipmentNo || prev.shipmentNo || `SHP-${b.bookingNumber}`,
        blNo: b.blNo || prev.blNo || '',
        customerId: matchedCustomer?.id,
        customerName: b.customerCompany,
        customerAddress: addr || prev.customerAddress || '',
        customerEmail: matchedCustomer?.email || prev.customerEmail || '',
        portFrom: b.pol || b.por || 'NAGOYA',
        portTo: b.pod || b.pody || 'DUBLIN',
        shippingCompany: b.shippingCompany || '',
        vesselVoyage: `${b.vessel || ''} ${b.voyage || ''}`.trim(),
        etd: b.etd || '',
        eta: b.eta || '',
        shipmentMode: b.cargoVolumeSize || `${parsedCount} X ${parsedSize}`,
        freightTerm: (b.freightTerm || '').includes('COLLECT') ? 'COLLECT' : 'PREPAID',
        containerCount: parsedCount,
        containerSize: parsedSize,
        containerNumbers: b.containerNumbers || '',
        status: prev.status === 'DRAFT' ? 'ACCEPTED' : prev.status || 'ACCEPTED',
        remarks: b.commodity ? `COMMODITY: ${b.commodity}` : prev.remarks || '',
      }));

      setSellingItems((prev) => {
        if (prev.length > 0 && !forceFillItems) return prev;
        const fx = Number(formData.exchangeRate) || 155;
        return [
          {
            id: `qs-${Date.now()}-1`,
            details: 'Freight',
            description: `OCEAN FREIGHT TO ${b.pod || 'PORT'} (${parsedCount} X ${parsedSize})`,
            currency: 'USD',
            unitPrice: 2200,
            quantity: parsedCount,
            taxRate: 0,
            lineTotalJpy: Math.round(2200 * parsedCount * fx),
          },
          {
            id: `qs-${Date.now()}-2`,
            details: 'THC',
            description: `TERMINAL HANDLING & DOC FEE (${parsedCount} CONT.)`,
            currency: 'JPY',
            unitPrice: 35000,
            quantity: parsedCount,
            taxRate: 10,
            lineTotalJpy: Math.round(35000 * parsedCount * 1.1),
          },
        ];
      });
    },
    [customers, formData.exchangeRate]
  );

  useEffect(() => {
    if (!isOpen) {
      setShowUnsavedPrompt(false);
      setIsDirty(false);
      setValidationError('');
      return;
    }

    setValidationError('');
    setIsDirty(false);
    setShowUnsavedPrompt(false);

    if (initialData) {
      const hasBk = Boolean((initialData.bookingNo || '').trim());
      setQuotationMethod(
        initialData.quotationMethod || (hasBk ? 'CONFIRMED_BOOKING' : 'REFERENCE')
      );
      setFormData({
        ...initialData,
        bookingNo: initialData.bookingNo || '',
        shipmentNo: initialData.shipmentNo || '',
        blNo: initialData.blNo || '',
      });
      setSellingItems(initialData.sellingItems || []);
      setTermsList(getQuotationTermsArray(initialData));
    } else if (prefillFromBooking) {
      const rnd = Math.floor(1000 + Math.random() * 9000);
      setQuotationMethod('CONFIRMED_BOOKING');
      setFormData({
        quotationNo: `QT-2026-${rnd}`,
        date: new Date().toISOString().slice(0, 10),
        validUntil: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
        status: 'ACCEPTED',
        exchangeRate: 155,
      });
      setSellingItems([]);
      setTermsList([...DEFAULT_QUOTATION_TERMS]);
      const timer = setTimeout(() => applyBooking(prefillFromBooking, true), 0);
      return () => clearTimeout(timer);
    } else {
      const rnd = Math.floor(1000 + Math.random() * 9000);
      setQuotationMethod('REFERENCE');
      setFormData({
        quotationNo: `QT-2026-${rnd}`,
        date: new Date().toISOString().slice(0, 10),
        validUntil: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
        status: 'DRAFT',
        bookingNo: '',
        shipmentNo: '',
        blNo: '',
        customerName: '',
        customerAddress: '',
        customerEmail: '',
        portFrom: 'NAGOYA',
        portTo: 'DUBLIN',
        shippingCompany: 'CMA-CGM',
        vesselVoyage: '',
        etd: '',
        eta: '',
        shipmentMode: "1 X 40' HC",
        freightTerm: 'PREPAID',
        exchangeRate: 155,
        containerCount: 1,
        containerSize: "40' HC",
        containerNumbers: '',
        remarks: '',
      });
      setSellingItems([
        {
          id: `qs-${Date.now()}-1`,
          details: 'Freight',
          description: "OCEAN FREIGHT (40' HC)",
          currency: 'USD',
          unitPrice: 2200,
          quantity: 1,
          taxRate: 0,
          lineTotalJpy: Math.round(2200 * 155),
        },
        {
          id: `qs-${Date.now()}-2`,
          details: 'Doc Fee',
          description: 'DOCUMENTATION FEE',
          currency: 'JPY',
          unitPrice: 6600,
          quantity: 1,
          taxRate: 10,
          lineTotalJpy: 7260,
        },
      ]);
      setTermsList([...DEFAULT_QUOTATION_TERMS]);
    }
  }, [isOpen, initialData, prefillFromBooking]);

  const forceClose = useCallback(() => {
    setShowUnsavedPrompt(false);
    setIsDirty(false);
    setValidationError('');
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

  const rate = Number(formData.exchangeRate) || 155;

  const computedSellingItems = sellingItems.map((item) => ({
    ...item,
    lineTotalJpy: computeLineJpy(
      item.currency,
      item.unitPrice,
      item.quantity,
      item.taxRate,
      rate
    ),
  }));

  const totalSellingJpy = computedSellingItems.reduce((s, i) => s + i.lineTotalJpy, 0);

  const handleMethodSwitch = (method: QuotationMethod) => {
    setIsDirty(true);
    setValidationError('');
    setQuotationMethod(method);
    if (method === 'REFERENCE') {
      setFormData((p) => ({
        ...p,
        linkedBookingId: undefined,
        bookingNo: '',
        shipmentNo: '',
        blNo: '',
        status: p.status === 'ACCEPTED' || p.status === 'CONVERTED' ? 'SENT' : p.status,
      }));
    }
  };

  const handleCustomerSelect = (name: string) => {
    setIsDirty(true);
    const found = customers.find((c) => c.name.toLowerCase() === name.toLowerCase());
    setFormData((prev) => ({
      ...prev,
      customerName: name,
      customerId: found?.id || prev.customerId,
      customerAddress: found
        ? [found.addressLine1, found.addressLine2].filter(Boolean).join(', ')
        : prev.customerAddress || '',
      customerEmail: found?.email || prev.customerEmail || '',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const cleanBookingNo = (formData.bookingNo || '').trim().toUpperCase();
    if (quotationMethod === 'CONFIRMED_BOOKING' && !cleanBookingNo) {
      setValidationError(
        'Confirmed Booking method requires a Booking Number. Enter a Booking No or switch to Method 1 (Customer Quotation without Booking No).'
      );
      return;
    }

    const cleanTerms = termsList.map((t) => t.trim()).filter(Boolean);
    const finalTermsList = cleanTerms.length > 0 ? cleanTerms : [...DEFAULT_QUOTATION_TERMS];

    const now = new Date().toISOString();
    const nextStatus = (formData.status || 'DRAFT') as QuotationStatus;
    const prevHistory = initialData?.statusHistory || [];
    const statusChanged = !initialData || initialData.status !== nextStatus;
    const statusHistory = statusChanged
      ? [
          ...prevHistory,
          {
            id: `qh-${Date.now()}`,
            status: nextStatus,
            date: new Date().toISOString().slice(0, 10),
            note: initialData
              ? `Status updated to ${nextStatus}${cleanBookingNo ? ` (Booking #${cleanBookingNo})` : ''}`
              : cleanBookingNo
              ? `Confirmed booking quotation created (Booking #${cleanBookingNo})`
              : 'Reference customer quotation created',
          },
        ]
      : prevHistory;

    // Preserve existing costing totals if editing; new quotations keep cost at 0 until entered via Costing Module
    const preservedCostItems = initialData?.costItems || [];
    const preservedCostJpy = initialData?.totalCostJpy || 0;
    const netProfitLossJpy = initialData?.linkedCostingId ? totalSellingJpy - preservedCostJpy : 0;
    const profitMarginPct =
      initialData?.linkedCostingId && totalSellingJpy > 0
        ? Math.round((netProfitLossJpy / totalSellingJpy) * 1000) / 10
        : 0;

    const record: Quotation = {
      ...(formData as Quotation),
      id: initialData?.id || `quo-${Date.now()}`,
      quotationNo:
        formData.quotationNo?.trim() || `QT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: formData.date || now.slice(0, 10),
      validUntil: formData.validUntil || '',
      status: nextStatus,
      quotationMethod: cleanBookingNo ? 'CONFIRMED_BOOKING' : 'REFERENCE',
      bookingNo: cleanBookingNo,
      shipmentNo: cleanBookingNo ? (formData.shipmentNo || '').trim().toUpperCase() : '',
      blNo: cleanBookingNo ? (formData.blNo || '').trim().toUpperCase() : '',
      customerName: formData.customerName?.trim() || 'General Customer',
      customerAddress: formData.customerAddress || '',
      portFrom: formData.portFrom || 'NAGOYA',
      portTo: formData.portTo || '',
      shippingCompany: formData.shippingCompany || '',
      vesselVoyage: formData.vesselVoyage || '',
      etd: formData.etd || '',
      eta: formData.eta || '',
      shipmentMode:
        formData.shipmentMode ||
        `${formData.containerCount || 1} X ${formData.containerSize || "40' HC"}`,
      freightTerm: formData.freightTerm || 'PREPAID',
      exchangeRate: rate,
      containerCount: Number(formData.containerCount) || 1,
      containerSize: formData.containerSize || "40' HC",
      sellingItems: computedSellingItems,
      totalSellingJpy,
      costItems: preservedCostItems,
      totalCostJpy: preservedCostJpy,
      netProfitLossJpy,
      profitMarginPct,
      statusHistory,
      remarks: formData.remarks || '',
      termsList: finalTermsList,
      termsAndConditions: formatTermsListToText(finalTermsList),
      createdAt: initialData?.createdAt || now,
      updatedAt: now,
    };

    onSave(record);
    forceClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-5 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            requestClose();
          }
        }}
      >
        <div
          className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl my-auto overflow-hidden flex flex-col max-h-[94vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 bg-slate-50 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-sky-100 text-sky-800 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {initialData
                    ? `Edit Freight Quotation #${initialData.quotationNo}`
                    : 'Create Freight Quotation'}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500">
                  Prepare customer freight rate quotes. Link to Costing module later only after Booking Number confirmation.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={requestClose}
              aria-label="Close modal"
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              {validationError && (
                <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-lg font-semibold flex items-center justify-between gap-2">
                  <span>{validationError}</span>
                  <button
                    type="button"
                    onClick={() => setValidationError('')}
                    className="text-rose-500 hover:text-rose-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Two-Stage Quotation Method Selector */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Quotation Stage / Method
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleMethodSwitch('REFERENCE')}
                    className={`text-left p-3.5 rounded-xl border-2 transition-all ${
                      quotationMethod === 'REFERENCE'
                        ? 'border-sky-600 bg-sky-50/70 shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">
                        Method 1: Customer Quotation (Without Booking No)
                      </span>
                      {quotationMethod === 'REFERENCE' && (
                        <CheckCircle2 className="w-4 h-4 text-sky-700 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Spot rate quote for customer approval. Reference only — <strong>excluded</strong> from Shipment Costing &amp; P&amp;L.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMethodSwitch('CONFIRMED_BOOKING')}
                    className={`text-left p-3.5 rounded-xl border-2 transition-all ${
                      quotationMethod === 'CONFIRMED_BOOKING'
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">
                        Method 2: Confirmed Booking (With Booking No)
                      </span>
                      {quotationMethod === 'CONFIRMED_BOOKING' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Customer confirmed rate &amp; Booking No assigned. Eligible to enter in <strong>Costing &amp; P&amp;L</strong> module.
                    </p>
                  </button>
                </div>
              </div>

              {/* Method 2: Booking Link & Reference Inputs */}
              {quotationMethod === 'CONFIRMED_BOOKING' ? (
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <Link2 className="w-4 h-4 text-emerald-700" />
                      Link Booking Confirmation or Enter Booking Number
                    </span>
                    {availableBookings.length > 0 && (
                      <select
                        value={formData.linkedBookingId || ''}
                        onChange={(e) => {
                          setIsDirty(true);
                          const b = availableBookings.find((x) => x.id === e.target.value);
                          if (b) applyBooking(b);
                        }}
                        className="text-xs bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 text-slate-800 font-semibold"
                      >
                        <option value="">Select existing Booking to autofill...</option>
                        {availableBookings.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.bookingNumber} {b.shipmentNo ? `(${b.shipmentNo})` : ''} · {b.customerCompany} ({b.pol} → {b.pod})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-emerald-950 uppercase mb-1">
                        Booking No *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.bookingNo || ''}
                        onChange={(e) => {
                          setIsDirty(true);
                          setFormData((p) => ({
                            ...p,
                            bookingNo: e.target.value.toUpperCase(),
                          }));
                        }}
                        placeholder="e.g. TYO0799646"
                        className="w-full px-2.5 py-2 text-xs border border-emerald-300 bg-white rounded-lg font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">
                        Shipment No
                      </label>
                      <input
                        type="text"
                        value={formData.shipmentNo || ''}
                        onChange={(e) => {
                          setIsDirty(true);
                          setFormData((p) => ({
                            ...p,
                            shipmentNo: e.target.value.toUpperCase(),
                          }));
                        }}
                        placeholder="SHP-2026-0101"
                        className="w-full px-2.5 py-2 text-xs border border-slate-300 bg-white rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">
                        B/L No
                      </label>
                      <input
                        type="text"
                        value={formData.blNo || ''}
                        onChange={(e) => {
                          setIsDirty(true);
                          setFormData((p) => ({ ...p, blNo: e.target.value.toUpperCase() }));
                        }}
                        placeholder="B/L Reference"
                        className="w-full px-2.5 py-2 text-xs border border-slate-300 bg-white rounded-lg font-mono"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl flex items-start gap-2 text-sky-900">
                  <Info className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
                  <span className="text-[11px] leading-relaxed">
                    <strong>Reference Quotation Mode:</strong> No Booking Number attached. You can send this PDF to the customer for rate approval without affecting company revenue, costing, or Profit &amp; Loss. If the customer accepts later, switch to <strong>Method 2</strong> or click <strong>Assign Booking #</strong>.
                  </span>
                </div>
              )}

              {/* Section 1: Quotation Header */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 uppercase">Quote No</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDirty(true);
                        setFormData((p) => ({
                          ...p,
                          quotationNo: `QT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                        }));
                      }}
                      className="text-[10px] text-sky-700 hover:underline font-semibold flex items-center gap-0.5"
                    >
                      <Sparkles className="w-2.5 h-2.5" /> Auto
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.quotationNo || ''}
                    onChange={(e) => {
                      setIsDirty(true);
                      setFormData((p) => ({
                        ...p,
                        quotationNo: e.target.value.toUpperCase(),
                      }));
                    }}
                    className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Quote Date</label>
                  <input
                    type="date"
                    value={formData.date || ''}
                    onChange={(e) => {
                      setIsDirty(true);
                      setFormData((p) => ({ ...p, date: e.target.value }));
                    }}
                    className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Valid Until</label>
                  <input
                    type="date"
                    value={formData.validUntil || ''}
                    onChange={(e) => {
                      setIsDirty(true);
                      setFormData((p) => ({ ...p, validUntil: e.target.value }));
                    }}
                    className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Status</label>
                  <select
                    value={formData.status || 'DRAFT'}
                    onChange={(e) => {
                      setIsDirty(true);
                      setFormData((p) => ({ ...p, status: e.target.value as QuotationStatus }));
                    }}
                    className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg font-bold bg-white"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="SENT">SENT</option>
                    <option value="ACCEPTED">ACCEPTED</option>
                    <option value="CONVERTED">CONVERTED</option>
                    <option value="REJECTED">REJECTED</option>
                    <option value="EXPIRED">EXPIRED</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-sky-800 uppercase mb-1">FX Rate (¥/$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.exchangeRate || 155}
                    onChange={(e) => {
                      setIsDirty(true);
                      setFormData((p) => ({
                        ...p,
                        exchangeRate: parseFloat(e.target.value) || 1,
                      }));
                    }}
                    className="w-full px-2.5 py-2 text-xs border border-sky-300 bg-sky-50/40 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              {/* Section 2: Internal Customer Reference (Hidden from Quotation PDF) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Customer Name (Internal Ref — Not on PDF)
                  </label>
                  <input
                    type="text"
                    list="quo-customer-list"
                    placeholder="Optional (leave blank for multi-customer quote)"
                    value={formData.customerName || ''}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg font-semibold"
                  />
                  <datalist id="quo-customer-list">
                    {customers.map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Customer Address (Internal Ref — Not on PDF)
                  </label>
                  <input
                    type="text"
                    placeholder="Optional internal address"
                    value={formData.customerAddress || ''}
                    onChange={(e) => {
                      setIsDirty(true);
                      setFormData((p) => ({ ...p, customerAddress: e.target.value }));
                    }}
                    className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">POL (From)</label>
                  <input
                    type="text"
                    value={formData.portFrom || ''}
                    onChange={(e) => {
                      setIsDirty(true);
                      setFormData((p) => ({ ...p, portFrom: e.target.value.toUpperCase() }));
                    }}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">POD (To)</label>
                  <input
                    type="text"
                    value={formData.portTo || ''}
                    onChange={(e) => {
                      setIsDirty(true);
                      setFormData((p) => ({ ...p, portTo: e.target.value.toUpperCase() }));
                    }}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Shipping Line
                  </label>
                  <input
                    type="text"
                    value={formData.shippingCompany || ''}
                    onChange={(e) => {
                      setIsDirty(true);
                      setFormData((p) => ({ ...p, shippingCompany: e.target.value }));
                    }}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Vessel / Voyage
                  </label>
                  <input
                    type="text"
                    value={formData.vesselVoyage || ''}
                    onChange={(e) => {
                      setIsDirty(true);
                      setFormData((p) => ({ ...p, vesselVoyage: e.target.value }));
                    }}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Container / Mode
                  </label>
                  <input
                    type="text"
                    value={formData.shipmentMode || ''}
                    onChange={(e) => {
                      setIsDirty(true);
                      setFormData((p) => ({ ...p, shipmentMode: e.target.value }));
                    }}
                    placeholder="1 X 40' HC"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg font-semibold"
                  />
                </div>
              </div>

              {/* Section 3: Quoted Customer Freight & Charges */}
              <div className="border-t border-slate-200 pt-4 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold uppercase tracking-wider text-sky-900">
                      Quoted Freight &amp; Service Charges (Customer Rate)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Shown on the Freight Quotation PDF. Total Quoted Amount:{' '}
                      <strong className="font-mono text-sky-900">
                        ¥{totalSellingJpy.toLocaleString()}
                      </strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDirty(true);
                      setSellingItems((prev) => [
                        ...prev,
                        {
                          id: `qs-${Date.now()}`,
                          details: 'Other Charges',
                          description: 'HANDLING / PORT FEE',
                          currency: 'JPY',
                          unitPrice: 5000,
                          quantity: 1,
                          taxRate: 0,
                          lineTotalJpy: 5000,
                        },
                      ]);
                    }}
                    className="px-2.5 py-1.5 text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Charge Line
                  </button>
                </div>

                <div className="space-y-2">
                  {sellingItems.map((item, idx) => {
                    const totalJpy = computeLineJpy(
                      item.currency,
                      item.unitPrice,
                      item.quantity,
                      item.taxRate,
                      rate
                    );
                    return (
                      <div
                        key={item.id}
                        className="grid grid-cols-12 gap-2 items-center p-2.5 bg-sky-50/50 border border-sky-200 rounded-lg"
                      >
                        <div className="col-span-6 sm:col-span-2">
                          <input
                            type="text"
                            list={`qs-types-${idx}`}
                            value={item.details}
                            onChange={(e) => {
                              setIsDirty(true);
                              const next = [...sellingItems];
                              next[idx] = { ...next[idx], details: e.target.value };
                              setSellingItems(next);
                            }}
                            placeholder="Charge Type"
                            className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded bg-white font-bold"
                          />
                          <datalist id={`qs-types-${idx}`}>
                            {SELLING_CHARGE_TYPES.map((t) => (
                              <option key={t} value={t} />
                            ))}
                          </datalist>
                        </div>
                        <div className="col-span-6 sm:col-span-3">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => {
                              setIsDirty(true);
                              const next = [...sellingItems];
                              next[idx] = { ...next[idx], description: e.target.value };
                              setSellingItems(next);
                            }}
                            placeholder="Description"
                            className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded bg-white"
                          />
                        </div>
                        <div className="col-span-3 sm:col-span-1">
                          <select
                            value={item.currency}
                            onChange={(e) => {
                              setIsDirty(true);
                              const next = [...sellingItems];
                              next[idx] = {
                                ...next[idx],
                                currency: e.target.value as 'USD' | 'JPY' | 'EURO',
                              };
                              setSellingItems(next);
                            }}
                            className="w-full px-1 py-1.5 text-xs border border-slate-300 rounded bg-white font-mono font-bold"
                          >
                            <option value="USD">USD</option>
                            <option value="JPY">JPY</option>
                            <option value="EURO">EUR</option>
                          </select>
                        </div>
                        <div className="col-span-3 sm:col-span-2">
                          <input
                            type="number"
                            step="any"
                            value={item.unitPrice}
                            onChange={(e) => {
                              setIsDirty(true);
                              const next = [...sellingItems];
                              next[idx] = {
                                ...next[idx],
                                unitPrice: parseFloat(e.target.value) || 0,
                              };
                              setSellingItems(next);
                            }}
                            placeholder="Rate"
                            className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded bg-white font-mono font-semibold"
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="Qty"
                            value={item.quantity ?? ''}
                            onChange={(e) => {
                              setIsDirty(true);
                              const val = e.target.value.trim();
                              const next = [...sellingItems];
                              next[idx] = {
                                ...next[idx],
                                quantity: val === '' ? null : parseFloat(val) || 1,
                              };
                              setSellingItems(next);
                            }}
                            className="w-full px-1.5 py-1.5 text-xs border border-slate-300 rounded bg-white font-mono text-center"
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <select
                            value={item.taxRate || 0}
                            onChange={(e) => {
                              setIsDirty(true);
                              const next = [...sellingItems];
                              next[idx] = {
                                ...next[idx],
                                taxRate: parseInt(e.target.value, 10) || 0,
                              };
                              setSellingItems(next);
                            }}
                            className="w-full px-1 py-1.5 text-xs border border-slate-300 rounded bg-white font-mono"
                          >
                            <option value="0">0%</option>
                            <option value="10">10%</option>
                          </select>
                        </div>
                        <div className="col-span-8 sm:col-span-1 text-right font-mono font-bold text-sky-950">
                          ¥{totalJpy.toLocaleString()}
                        </div>
                        <div className="col-span-4 sm:col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setIsDirty(true);
                              setSellingItems((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 4: Remarks */}
              <div className="border-t border-slate-200 pt-3">
                <label className="block font-bold text-slate-700 uppercase mb-1">Remarks</label>
                <input
                  type="text"
                  value={formData.remarks || ''}
                  onChange={(e) => {
                    setIsDirty(true);
                    setFormData((p) => ({ ...p, remarks: e.target.value }));
                  }}
                  placeholder="Optional quotation notes or cargo commodity description..."
                  className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              {/* Section 5: Editable Terms & Conditions */}
              <div className="border-t border-slate-200 pt-4 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold uppercase tracking-wider text-slate-800">
                      Terms &amp; Conditions (Included in Quotation PDF)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Edit existing clauses, remove unused lines, or add custom terms before generating the PDF.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDirty(true);
                        setTermsList([...DEFAULT_QUOTATION_TERMS]);
                      }}
                      className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reset Default 7 Terms
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDirty(true);
                        setTermsList((prev) => [...prev, '']);
                      }}
                      className="px-2.5 py-1.5 text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Term
                    </button>
                  </div>
                </div>

                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {termsList.map((term, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="w-6 pt-2 text-right font-mono font-bold text-slate-500 shrink-0">
                        {idx + 1}.
                      </span>
                      <textarea
                        rows={term.length > 90 ? 2 : 1}
                        value={term}
                        onChange={(e) => {
                          setIsDirty(true);
                          const next = [...termsList];
                          next[idx] = e.target.value;
                          setTermsList(next);
                        }}
                        placeholder="Enter term & condition..."
                        className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white leading-snug"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsDirty(true);
                          setTermsList((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        title="Remove term"
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg shrink-0 mt-0.5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {termsList.length === 0 && (
                    <div className="text-center py-3 text-slate-500 text-xs">
                      No terms configured. Click <strong>Add Term</strong> or <strong>Reset Default 7 Terms</strong>.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-600">
                Total Quoted Rate:{' '}
                <strong className="font-mono text-sky-900 text-sm">
                  ¥{totalSellingJpy.toLocaleString()}
                </strong>
                <span className="ml-2 text-[11px] text-slate-400">
                  ({quotationMethod === 'CONFIRMED_BOOKING' ? 'Confirmed Booking Method' : 'Reference Quote Only'})
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={requestClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-xs"
                >
                  {initialData ? 'Save Quotation Changes' : 'Create Quotation'}
                </button>
              </div>
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
