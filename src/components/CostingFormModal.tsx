import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShipmentCosting,
  Quotation,
  QuotationCostItem,
  InvoiceItem,
  BookingConfirmation,
} from '../types';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';
import {
  X,
  Plus,
  Trash2,
  Calculator,
  TrendingUp,
  TrendingDown,
  Search,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface CostingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (costing: ShipmentCosting) => void;
  onSwitchToExistingCosting?: (costing: ShipmentCosting) => void;
  initialData?: ShipmentCosting | null;
  prefillFromQuotation?: Quotation | null;
  quotations: Quotation[];
  bookings: BookingConfirmation[];
  existingCostings: ShipmentCosting[];
}

const COST_CATEGORIES = [
  'Shipping Line Ocean Freight',
  'THC & Port Charges',
  'Trucking / Drayage',
  'Customs / Doc Handling',
  'Inspection / Yard Fee',
  'Other Shipment Cost',
];

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

export const CostingFormModal: React.FC<CostingFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSwitchToExistingCosting,
  initialData,
  prefillFromQuotation,
  quotations,
  bookings,
  existingCostings,
}) => {
  const [quotationLookup, setQuotationLookup] = useState('');
  const [lookupFeedback, setLookupFeedback] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  const [formData, setFormData] = useState<Partial<ShipmentCosting>>({
    costingNo: '',
    date: new Date().toISOString().slice(0, 10),
    quotationNo: '',
    bookingNo: '',
    shipmentNo: '',
    blNo: '',
    customerName: '',
    customerAddress: '',
    portFrom: 'NAGOYA',
    portTo: '',
    shippingCompany: '',
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
  const [costItems, setCostItems] = useState<QuotationCostItem[]>([]);
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

  const applyQuotationRecord = useCallback(
    (q: Quotation, preserveExistingCosts = false) => {
      const rate = q.exchangeRate || 155;
      const cleanBk = (q.bookingNo || '').trim().toUpperCase();
      setQuotationLookup(q.quotationNo);

      if (!cleanBk) {
        setLookupFeedback({
          type: 'warning',
          message: `Quotation ${q.quotationNo} is currently Method 1 (no Booking Number assigned). Enter a Booking Number below before saving to Costing & P&L.`,
        });
      } else if (q.status === 'REJECTED' || q.status === 'EXPIRED') {
        setLookupFeedback({
          type: 'error',
          message: `Quotation ${q.quotationNo} is marked as ${q.status}. Only accepted/confirmed quotations should enter shipment costing.`,
        });
      } else {
        setLookupFeedback({
          type: 'success',
          message: `Linked Quotation ${q.quotationNo} (${q.customerName} · Booking #${cleanBk})`,
        });
      }

      setFormData((prev) => ({
        ...prev,
        linkedQuotationId: q.id,
        quotationNo: q.quotationNo,
        linkedBookingId: q.linkedBookingId || prev.linkedBookingId,
        bookingNo: cleanBk || prev.bookingNo || '',
        shipmentNo: q.shipmentNo || prev.shipmentNo || (cleanBk ? `SHP-${cleanBk}` : ''),
        blNo: q.blNo || prev.blNo || '',
        customerId: q.customerId,
        customerName: q.customerName,
        customerAddress: q.customerAddress || '',
        portFrom: q.portFrom,
        portTo: q.portTo,
        shippingCompany: q.shippingCompany,
        vesselVoyage: q.vesselVoyage,
        etd: q.etd,
        eta: q.eta,
        shipmentMode: q.shipmentMode,
        freightTerm: q.freightTerm,
        exchangeRate: rate,
        containerCount: q.containerCount || 1,
        containerSize: q.containerSize || "40' HC",
        containerNumbers: q.containerNumbers || '',
        linkedInvoiceId: q.linkedInvoiceId || prev.linkedInvoiceId,
        linkedInvoiceNo: q.linkedInvoiceNo || prev.linkedInvoiceNo,
      }));

      setSellingItems((q.sellingItems || []).map((i) => ({ ...i })));

      if (!preserveExistingCosts) {
        if (q.costItems && q.costItems.length > 0) {
          setCostItems(q.costItems.map((c) => ({ ...c })));
        } else {
          const count = q.containerCount || 1;
          setCostItems([
            {
              id: `cc-${Date.now()}-1`,
              category: 'Shipping Line Ocean Freight',
              description: `${q.shippingCompany || 'Carrier'} Actual Ocean Freight`,
              supplierName: q.shippingCompany || '',
              currency: 'USD',
              unitCost: 1900,
              quantity: count,
              taxRate: 0,
              lineCostJpy: Math.round(1900 * count * rate),
            },
            {
              id: `cc-${Date.now()}-2`,
              category: 'THC & Port Charges',
              description: 'Origin THC / Documentation / Local Cost',
              supplierName: q.shippingCompany || '',
              currency: 'JPY',
              unitCost: 30000,
              quantity: count,
              taxRate: 10,
              lineCostJpy: Math.round(30000 * count * 1.1),
            },
          ]);
        }
      }
    },
    []
  );

  useEffect(() => {
    if (!isOpen) {
      setShowUnsavedPrompt(false);
      setIsDirty(false);
      setValidationError('');
      setLookupFeedback(null);
      return;
    }

    setValidationError('');
    setIsDirty(false);
    setShowUnsavedPrompt(false);
    setLookupFeedback(null);

    if (initialData) {
      setQuotationLookup(initialData.quotationNo || '');
      setFormData({ ...initialData });
      setSellingItems(initialData.sellingItems || []);
      setCostItems(initialData.costItems || []);
    } else if (prefillFromQuotation) {
      const rnd = Math.floor(1000 + Math.random() * 9000);
      setFormData({
        costingNo: `CST-2026-${rnd}`,
        date: new Date().toISOString().slice(0, 10),
        exchangeRate: prefillFromQuotation.exchangeRate || 155,
      });
      const timer = setTimeout(() => applyQuotationRecord(prefillFromQuotation, false), 0);
      return () => clearTimeout(timer);
    } else {
      const rnd = Math.floor(1000 + Math.random() * 9000);
      setQuotationLookup('');
      setFormData({
        costingNo: `CST-2026-${rnd}`,
        date: new Date().toISOString().slice(0, 10),
        quotationNo: '',
        bookingNo: '',
        shipmentNo: '',
        blNo: '',
        customerName: '',
        customerAddress: '',
        portFrom: 'NAGOYA',
        portTo: '',
        shippingCompany: '',
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
      setSellingItems([]);
      setCostItems([
        {
          id: `cc-${Date.now()}-1`,
          category: 'Shipping Line Ocean Freight',
          description: 'Shipping Line Buy Rate',
          supplierName: '',
          currency: 'USD',
          unitCost: 1900,
          quantity: 1,
          taxRate: 0,
          lineCostJpy: Math.round(1900 * 155),
        },
      ]);
    }
  }, [isOpen, initialData, prefillFromQuotation, applyQuotationRecord]);

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

  // Duplicate booking detection
  const duplicateCostingForBooking = useMemo(() => {
    const cleanBk = (formData.bookingNo || '').trim().toUpperCase();
    if (!cleanBk) return null;
    return (
      existingCostings.find(
        (c) => c.id !== initialData?.id && (c.bookingNo || '').trim().toUpperCase() === cleanBk
      ) || null
    );
  }, [formData.bookingNo, existingCostings, initialData]);

  // Confirmed quotations first, but allow searching any quotation so user gets clear feedback
  const sortedQuotations = useMemo(() => {
    return [...quotations].sort((a, b) => {
      const aConf = Boolean((a.bookingNo || '').trim()) ? 1 : 0;
      const bConf = Boolean((b.bookingNo || '').trim()) ? 1 : 0;
      return bConf - aConf;
    });
  }, [quotations]);

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
  const computedCostItems = costItems.map((item) => ({
    ...item,
    lineCostJpy: computeLineJpy(
      item.currency,
      item.unitCost,
      item.quantity,
      item.taxRate,
      rate
    ),
  }));

  const totalSellingJpy = computedSellingItems.reduce((s, i) => s + i.lineTotalJpy, 0);
  const totalCostJpy = computedCostItems.reduce((s, i) => s + i.lineCostJpy, 0);
  const netProfitLossJpy = totalSellingJpy - totalCostJpy;
  const profitMarginPct =
    totalSellingJpy > 0 ? Math.round((netProfitLossJpy / totalSellingJpy) * 1000) / 10 : 0;

  const handleRetrieveByQuotationNo = () => {
    const query = quotationLookup.trim().toUpperCase();
    if (!query) {
      setLookupFeedback({
        type: 'warning',
        message: 'Enter a Quotation Number or pick one from the dropdown.',
      });
      return;
    }
    const found = quotations.find((q) => q.quotationNo.trim().toUpperCase() === query);
    if (!found) {
      setLookupFeedback({
        type: 'error',
        message: `No quotation found with number "${query}". Check the Quotation Number in Freight Quotations.`,
      });
      return;
    }
    setIsDirty(true);
    applyQuotationRecord(found, false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const cleanQuoteNo = (formData.quotationNo || quotationLookup || '').trim().toUpperCase();
    const cleanBk = (formData.bookingNo || '').trim().toUpperCase();

    if (!cleanQuoteNo) {
      setValidationError('Please enter or select a Quotation Number first.');
      return;
    }
    if (!cleanBk) {
      setValidationError(
        'A confirmed Booking Number is required before creating a Shipment Costing entry.'
      );
      return;
    }
    if (duplicateCostingForBooking) {
      setValidationError(
        `Duplicate prevented: Costing #${duplicateCostingForBooking.costingNo} already exists for Booking #${cleanBk}. Open the existing costing record to edit it.`
      );
      return;
    }

    const matchedBk = bookings.find(
      (b) => b.bookingNumber.trim().toUpperCase() === cleanBk
    );

    const now = new Date().toISOString();
    const record: ShipmentCosting = {
      ...(formData as ShipmentCosting),
      id: initialData?.id || `cst-${Date.now()}`,
      costingNo:
        formData.costingNo?.trim() || `CST-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: formData.date || now.slice(0, 10),
      quotationNo: cleanQuoteNo,
      bookingNo: cleanBk,
      linkedBookingId: matchedBk?.id || formData.linkedBookingId,
      shipmentNo:
        (formData.shipmentNo || '').trim().toUpperCase() ||
        matchedBk?.shipmentNo ||
        `SHP-${cleanBk}`,
      blNo: (formData.blNo || '').trim().toUpperCase() || matchedBk?.blNo || '',
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
      containerNumbers: formData.containerNumbers || '',
      sellingItems: computedSellingItems,
      totalSellingJpy,
      costItems: computedCostItems,
      totalCostJpy,
      netProfitLossJpy,
      profitMarginPct,
      remarks: formData.remarks || '',
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
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 bg-slate-50 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {initialData
                    ? `Edit Shipment Costing #${initialData.costingNo}`
                    : 'Add Shipment Costing (By Quotation Number)'}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500">
                  Enter or select a confirmed Quotation Number to pull selling rates and calculate actual shipment Profit &amp; Loss.
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
              {/* Step 1: Enter or Select Quotation Number */}
              <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl space-y-2.5">
                <div className="font-bold text-sky-950 uppercase tracking-wider text-[11px]">
                  Step 1: Retrieve Confirmed Quotation by Quotation Number
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
                  <div className="md:col-span-5 flex gap-1.5">
                    <input
                      type="text"
                      list="costing-quotation-nos"
                      value={quotationLookup}
                      onChange={(e) => setQuotationLookup(e.target.value.toUpperCase())}
                      placeholder="Type Quotation No (e.g. QT-2026-1001)"
                      className="flex-1 px-3 py-2 text-xs border border-sky-300 bg-white rounded-lg font-mono font-bold"
                    />
                    <datalist id="costing-quotation-nos">
                      {sortedQuotations.map((q) => (
                        <option key={q.id} value={q.quotationNo}>
                          {q.customerName} {q.bookingNo ? `(BK: ${q.bookingNo})` : '(No Booking)'}
                        </option>
                      ))}
                    </datalist>
                    <button
                      type="button"
                      onClick={handleRetrieveByQuotationNo}
                      className="px-3 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg flex items-center gap-1 shrink-0"
                    >
                      <Search className="w-3.5 h-3.5" /> Load
                    </button>
                  </div>

                  <div className="md:col-span-7">
                    <select
                      value={formData.linkedQuotationId || ''}
                      onChange={(e) => {
                        const q = quotations.find((x) => x.id === e.target.value);
                        if (q) {
                          setIsDirty(true);
                          applyQuotationRecord(q, Boolean(initialData));
                        }
                      }}
                      className="w-full px-3 py-2 text-xs bg-white border border-sky-300 rounded-lg font-semibold text-slate-800"
                    >
                      <option value="">Or select from Quotations list...</option>
                      {sortedQuotations.map((q) => {
                        const hasBk = Boolean((q.bookingNo || '').trim());
                        return (
                          <option key={q.id} value={q.id}>
                            {q.quotationNo} · {q.customerName} ·{' '}
                            {hasBk ? `BK: ${q.bookingNo}` : 'No Booking #'} · ¥
                            {Math.round(q.totalSellingJpy).toLocaleString()} [{q.status}]
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {lookupFeedback && (
                  <div
                    className={`px-3 py-2 rounded-lg text-[11px] font-semibold flex items-center gap-2 ${
                      lookupFeedback.type === 'success'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                        : lookupFeedback.type === 'warning'
                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                        : 'bg-rose-100 text-rose-900 border border-rose-200'
                    }`}
                  >
                    {lookupFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{lookupFeedback.message}</span>
                  </div>
                )}
              </div>

              {/* Duplicate Booking Blocker */}
              {duplicateCostingForBooking && (
                <div className="p-3.5 bg-rose-50 border-2 border-rose-400 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-900">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs">
                        Duplicate Costing Blocked for Booking #{duplicateCostingForBooking.bookingNo}
                      </div>
                      <p className="text-[11px] text-rose-800 mt-0.5">
                        A costing record (<strong>{duplicateCostingForBooking.costingNo}</strong>) already exists for this booking. Edit the existing costing entry instead of creating a duplicate.
                      </p>
                    </div>
                  </div>
                  {onSwitchToExistingCosting && (
                    <button
                      type="button"
                      onClick={() => onSwitchToExistingCosting(duplicateCostingForBooking)}
                      className="px-3 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-lg flex items-center gap-1.5 shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open Existing Costing
                    </button>
                  )}
                </div>
              )}

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

              {/* Live Profit & Loss Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3.5 bg-slate-900 text-white rounded-xl border border-slate-800">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    Customer Selling Price
                  </div>
                  <div className="text-lg font-mono font-bold text-sky-300 mt-0.5 tabular-nums">
                    ¥{totalSellingJpy.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    Total Shipment Cost
                  </div>
                  <div className="text-lg font-mono font-bold text-amber-300 mt-0.5 tabular-nums">
                    ¥{totalCostJpy.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    Net {netProfitLossJpy >= 0 ? 'Profit' : 'Loss'}
                  </div>
                  <div
                    className={`text-lg font-mono font-extrabold mt-0.5 flex items-center gap-1 tabular-nums ${
                      netProfitLossJpy >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {netProfitLossJpy >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span>
                      {netProfitLossJpy >= 0 ? '+' : '-'}¥{Math.abs(netProfitLossJpy).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    Profit Margin %
                  </div>
                  <div
                    className={`text-lg font-mono font-bold mt-0.5 tabular-nums ${
                      netProfitLossJpy >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {profitMarginPct.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Reference Header Fields */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 uppercase">Costing No</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDirty(true);
                        setFormData((p) => ({
                          ...p,
                          costingNo: `CST-2026-${Math.floor(1000 + Math.random() * 9000)}`,
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
                    value={formData.costingNo || ''}
                    onChange={(e) => {
                      setIsDirty(true);
                      setFormData((p) => ({ ...p, costingNo: e.target.value.toUpperCase() }));
                    }}
                    className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Quotation No *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.quotationNo || ''}
                    onChange={(e) => {
                      setIsDirty(true);
                      setFormData((p) => ({ ...p, quotationNo: e.target.value.toUpperCase() }));
                    }}
                    className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block font-bold text-emerald-800 uppercase mb-1">
                    Booking No *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.bookingNo || ''}
                    onChange={(e) => {
                      setIsDirty(true);
                      setFormData((p) => ({ ...p, bookingNo: e.target.value.toUpperCase() }));
                    }}
                    placeholder="TYO0799646"
                    className="w-full px-2.5 py-2 text-xs border border-emerald-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Shipment No</label>
                  <input
                    type="text"
                    value={formData.shipmentNo || ''}
                    onChange={(e) => {
                      setIsDirty(true);
                      setFormData((p) => ({ ...p, shipmentNo: e.target.value.toUpperCase() }));
                    }}
                    className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">B/L No</label>
                  <input
                    type="text"
                    value={formData.blNo || ''}
                    onChange={(e) => {
                      setIsDirty(true);
                      setFormData((p) => ({ ...p, blNo: e.target.value.toUpperCase() }));
                    }}
                    className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
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

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Customer *</label>
                  <input
                    type="text"
                    required
                    value={formData.customerName || ''}
                    onChange={(e) => {
                      setIsDirty(true);
                      setFormData((p) => ({ ...p, customerName: e.target.value }));
                    }}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">POL → POD</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={formData.portFrom || ''}
                      onChange={(e) => {
                        setIsDirty(true);
                        setFormData((p) => ({ ...p, portFrom: e.target.value.toUpperCase() }));
                      }}
                      className="w-1/2 px-2 py-1.5 text-xs border border-slate-300 rounded-lg font-semibold"
                    />
                    <input
                      type="text"
                      value={formData.portTo || ''}
                      onChange={(e) => {
                        setIsDirty(true);
                        setFormData((p) => ({ ...p, portTo: e.target.value.toUpperCase() }));
                      }}
                      className="w-1/2 px-2 py-1.5 text-xs border border-slate-300 rounded-lg font-semibold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Shipping Line</label>
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
                  <label className="block font-bold text-slate-700 uppercase mb-1">Costing Date</label>
                  <input
                    type="date"
                    value={formData.date || ''}
                    onChange={(e) => {
                      setIsDirty(true);
                      setFormData((p) => ({ ...p, date: e.target.value }));
                    }}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Customer Selling Price (Linked from Quotation, editable if final FX adjusted) */}
              <div className="border-t border-slate-200 pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold uppercase tracking-wider text-sky-900">
                      1. Agreed Customer Selling Price (From Quotation #{formData.quotationNo || '—'})
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDirty(true);
                      setSellingItems((prev) => [
                        ...prev,
                        {
                          id: `cs-${Date.now()}`,
                          details: 'Other Charges',
                          description: 'ADDITIONAL AGREED CHARGE',
                          currency: 'JPY',
                          unitPrice: 5000,
                          quantity: 1,
                          taxRate: 0,
                          lineTotalJpy: 5000,
                        },
                      ]);
                    }}
                    className="px-2.5 py-1 text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Revenue Line
                  </button>
                </div>

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
                      className="grid grid-cols-12 gap-2 items-center p-2 bg-sky-50/50 border border-sky-200 rounded-lg"
                    >
                      <div className="col-span-6 sm:col-span-2">
                        <input
                          type="text"
                          list={`cs-types-${idx}`}
                          value={item.details}
                          onChange={(e) => {
                            setIsDirty(true);
                            const next = [...sellingItems];
                            next[idx] = { ...next[idx], details: e.target.value };
                            setSellingItems(next);
                          }}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white font-bold"
                        />
                        <datalist id={`cs-types-${idx}`}>
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
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
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
                          className="w-full px-1 py-1 text-xs border border-slate-300 rounded bg-white font-mono font-bold"
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
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white font-mono font-semibold"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <input
                          type="number"
                          min="0"
                          step="any"
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
                          className="w-full px-1.5 py-1 text-xs border border-slate-300 rounded bg-white font-mono text-center"
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
                          className="w-full px-1 py-1 text-xs border border-slate-300 rounded bg-white font-mono"
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

              {/* Actual Shipment Expenses (Cost Items) */}
              <div className="border-t border-slate-200 pt-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold uppercase tracking-wider text-amber-900">
                      2. Actual Shipment Expenses (Carrier, THC, Drayage, Customs &amp; Other Costs)
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDirty(true);
                      setCostItems((prev) => [
                        ...prev,
                        {
                          id: `cc-${Date.now()}`,
                          category: 'Other Shipment Cost',
                          description: 'Port / Customs / Local Cost',
                          supplierName: formData.shippingCompany || '',
                          currency: 'JPY',
                          unitCost: 10000,
                          quantity: 1,
                          taxRate: 0,
                          lineCostJpy: 10000,
                        },
                      ]);
                    }}
                    className="px-2.5 py-1.5 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Expense Item
                  </button>
                </div>

                {costItems.map((cost, idx) => {
                  const totalCostItemJpy = computeLineJpy(
                    cost.currency,
                    cost.unitCost,
                    cost.quantity,
                    cost.taxRate,
                    rate
                  );
                  return (
                    <div
                      key={cost.id}
                      className="grid grid-cols-12 gap-2 items-center p-2.5 bg-amber-50/40 border border-amber-200 rounded-lg"
                    >
                      <div className="col-span-6 sm:col-span-2">
                        <input
                          type="text"
                          list={`cc-cats-${idx}`}
                          value={cost.category}
                          onChange={(e) => {
                            setIsDirty(true);
                            const next = [...costItems];
                            next[idx] = { ...next[idx], category: e.target.value };
                            setCostItems(next);
                          }}
                          placeholder="Category"
                          className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded bg-white font-bold"
                        />
                        <datalist id={`cc-cats-${idx}`}>
                          {COST_CATEGORIES.map((c) => (
                            <option key={c} value={c} />
                          ))}
                        </datalist>
                      </div>
                      <div className="col-span-6 sm:col-span-3">
                        <input
                          type="text"
                          value={cost.description}
                          onChange={(e) => {
                            setIsDirty(true);
                            const next = [...costItems];
                            next[idx] = { ...next[idx], description: e.target.value };
                            setCostItems(next);
                          }}
                          placeholder="Expense description / vendor"
                          className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded bg-white"
                        />
                      </div>
                      <div className="col-span-3 sm:col-span-1">
                        <select
                          value={cost.currency}
                          onChange={(e) => {
                            setIsDirty(true);
                            const next = [...costItems];
                            next[idx] = {
                              ...next[idx],
                              currency: e.target.value as 'USD' | 'JPY' | 'EURO',
                            };
                            setCostItems(next);
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
                          value={cost.unitCost}
                          onChange={(e) => {
                            setIsDirty(true);
                            const next = [...costItems];
                            next[idx] = {
                              ...next[idx],
                              unitCost: parseFloat(e.target.value) || 0,
                            };
                            setCostItems(next);
                          }}
                          className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded bg-white font-mono font-semibold"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={cost.quantity ?? ''}
                          onChange={(e) => {
                            setIsDirty(true);
                            const val = e.target.value.trim();
                            const next = [...costItems];
                            next[idx] = {
                              ...next[idx],
                              quantity: val === '' ? null : parseFloat(val) || 1,
                            };
                            setCostItems(next);
                          }}
                          className="w-full px-1.5 py-1.5 text-xs border border-slate-300 rounded bg-white font-mono text-center"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <select
                          value={cost.taxRate || 0}
                          onChange={(e) => {
                            setIsDirty(true);
                            const next = [...costItems];
                            next[idx] = {
                              ...next[idx],
                              taxRate: parseInt(e.target.value, 10) || 0,
                            };
                            setCostItems(next);
                          }}
                          className="w-full px-1 py-1.5 text-xs border border-slate-300 rounded bg-white font-mono"
                        >
                          <option value="0">0%</option>
                          <option value="10">10%</option>
                        </select>
                      </div>
                      <div className="col-span-8 sm:col-span-1 text-right font-mono font-bold text-amber-900">
                        ¥{totalCostItemJpy.toLocaleString()}
                      </div>
                      <div className="col-span-4 sm:col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setIsDirty(true);
                            setCostItems((prev) => prev.filter((_, i) => i !== idx));
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

              <div className="border-t border-slate-200 pt-3">
                <label className="block font-bold text-slate-700 uppercase mb-1">Costing Remarks</label>
                <input
                  type="text"
                  value={formData.remarks || ''}
                  onChange={(e) => {
                    setIsDirty(true);
                    setFormData((p) => ({ ...p, remarks: e.target.value }));
                  }}
                  placeholder="Optional internal remarks on FX adjustment or carrier rate notes..."
                  className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-600">
                Net Result:{' '}
                <strong
                  className={`font-mono text-sm ${
                    netProfitLossJpy >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {netProfitLossJpy >= 0 ? '+' : '-'}¥{Math.abs(netProfitLossJpy).toLocaleString()}
                </strong>
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
                  disabled={Boolean(duplicateCostingForBooking)}
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg shadow-xs"
                >
                  {initialData ? 'Save Costing Changes' : 'Save Shipment Costing'}
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
