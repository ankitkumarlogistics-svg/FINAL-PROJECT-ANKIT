import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  FreightInvoice,
  InvoiceItem,
  InvoiceStatus,
  BookingConfirmation,
  Quotation,
  QuotationCostItem,
  ShippingLinePayment,
  Customer,
} from '../types';
import { computeCustomerInvoiceFinance } from '../utils/interconnection';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  Link2,
  Calculator,
  TrendingUp,
  TrendingDown,
  Anchor,
  Lock,
  Search,
} from 'lucide-react';

interface InvoiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: FreightInvoice) => void;
  initialData?: FreightInvoice | null;
  availableBookings?: BookingConfirmation[];
  availableQuotations?: Quotation[];
  availableShippingPayments?: ShippingLinePayment[];
  customers?: Customer[];
  prefillFromBooking?: BookingConfirmation | null;
  prefillFromQuotation?: Quotation | null;
  initialFocusSection?: 'billing' | 'costing';
}

const COMMON_ITEM_TYPES = [
  'Freight',
  'Doc Fee',
  'THC',
  'Seal Fee',
  'Other Charges',
  'Custom Clearance',
  'Storage',
  'Drayage',
  'Inspection Fee',
  'Courier / BL Fee',
];

const ACTUAL_COST_CATEGORIES = [
  'Shipping Line Ocean Freight',
  'THC & Port Charges',
  'Doc / B/L Fee',
  'Container Seal Fee',
  'Trucking / Drayage',
  'Other Carrier Cost',
];

const getLocalIsoDate = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDaysToDate = (baseDateStr?: string, days = 5): string => {
  const raw = (baseDateStr || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + days);
    return getLocalIsoDate(dt);
  }
  if (raw) {
    const parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) {
      parsed.setDate(parsed.getDate() + days);
      return getLocalIsoDate(parsed);
    }
  }
  const fallback = new Date();
  fallback.setDate(fallback.getDate() + days);
  return getLocalIsoDate(fallback);
};

const parseValidIsoDate = (dateStr?: string): string | null => {
  const raw = (dateStr || '').trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (isNaN(parsed.getTime())) return null;
  return getLocalIsoDate(parsed);
};

export const InvoiceFormModal: React.FC<InvoiceFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  availableBookings = [],
  availableQuotations = [],
  availableShippingPayments = [],
  customers = [],
  prefillFromBooking,
  prefillFromQuotation,
  initialFocusSection = 'billing',
}) => {
  const [formData, setFormData] = useState<Partial<FreightInvoice>>(() => {
    const today = getLocalIsoDate();
    return {
      invoiceNo: '',
      date: today,
      paymentDueDate: addDaysToDate(today, 5),
      status: 'PENDING',
    customerName: '',
    customerAddress: '',
    portFrom: '',
    portTo: '',
    shippingCompany: '',
    vesselVoyage: '',
    etd: '',
    eta: '',
    blNo: '',
    bookingNo: '',
    shipmentNo: '',
    shipmentMode: '',
    freightTerm: 'PREPAID',
    exchangeRate: 155.0,
    containerCount: 1,
    containerSize: "40' HC",
    containerNumbers: '',
    subTotalJpy: 0,
    discountJpy: 0,
    remarks: '',
    grandTotalJpy: 0,
    amountReceivedJpy: 0,
    outstandingBalanceJpy: 0,
    quotationNo: '',
    linkedQuotationId: '',
    actualShippingCostJpy: 0,
    };
  });

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [actualCostItems, setActualCostItems] = useState<QuotationCostItem[]>([]);
  const [directActualCostJpy, setDirectActualCostJpy] = useState<number>(0);
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');
  const [isBookingDropdownOpen, setIsBookingDropdownOpen] = useState(false);
  const [isDueDateManual, setIsDueDateManual] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const costingSectionRef = useRef<HTMLDivElement | null>(null);
  const bookingSearchRef = useRef<HTMLDivElement | null>(null);

  // Calculate row total JPY
  const calculateLineTotal = (
    currency: 'USD' | 'JPY' | 'EURO',
    unitPrice: number,
    quantity: number | undefined | null,
    taxRate: number,
    rate: number
  ) => {
    const effectiveQty =
      quantity === undefined ||
      quantity === null ||
      isNaN(Number(quantity)) ||
      Number(quantity) <= 0
        ? 1
        : Number(quantity);
    const base = unitPrice * effectiveQty;
    const withTax = base * (1 + (taxRate || 0) / 100);
    if (currency === 'USD' || currency === 'EURO') {
      return Math.round(withTax * (rate || 1));
    }
    return Math.round(withTax);
  };

  // Recompute overall totals whenever items, exchange rate, or discount change
  useEffect(() => {
    if (!isOpen) return;
    const rate = formData.exchangeRate || 1;
    const updatedItems = items.map((item) => ({
      ...item,
      lineTotalJpy: calculateLineTotal(
        item.currency,
        item.unitPrice,
        item.quantity,
        item.taxRate,
        rate
      ),
    }));

    const subTotal = updatedItems.reduce((acc, cur) => acc + cur.lineTotalJpy, 0);
    const discount = formData.discountJpy || 0;
    const grandTotal = Math.max(0, subTotal - discount);

    setFormData((prev) => ({
      ...prev,
      subTotalJpy: subTotal,
      grandTotalJpy: grandTotal,
    }));
  }, [isOpen, items, formData.exchangeRate, formData.discountJpy]);

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
    if (!isBookingDropdownOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (bookingSearchRef.current && !bookingSearchRef.current.contains(e.target as Node)) {
        setIsBookingDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isBookingDropdownOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showUnsavedPrompt) {
        e.preventDefault();
        e.stopPropagation();
        if (isBookingDropdownOpen) {
          setIsBookingDropdownOpen(false);
        } else {
          requestClose();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, showUnsavedPrompt, isBookingDropdownOpen, requestClose]);

  useEffect(() => {
    if (!isOpen) {
      setIsDirty(false);
      setShowUnsavedPrompt(false);
      setBookingSearchQuery('');
      setIsBookingDropdownOpen(false);
      return;
    }
    setIsDirty(false);
    setShowUnsavedPrompt(false);
    setBookingSearchQuery('');
    setIsBookingDropdownOpen(false);
    setIsDueDateManual(Boolean(initialData));
    if (initialData) {
      setFormData(initialData);
      setItems(initialData.items || []);
      const existingCostItems = initialData.actualCostItems || [];
      setActualCostItems(existingCostItems);
      setDirectActualCostJpy(
        existingCostItems.length === 0 ? Math.max(0, Math.round(initialData.actualShippingCostJpy || 0)) : 0
      );
    } else if (prefillFromQuotation) {
      applyQuotationData(prefillFromQuotation);
      setActualCostItems([]);
      setDirectActualCostJpy(0);
    } else if (prefillFromBooking) {
      applyBookingData(prefillFromBooking);
      setActualCostItems([]);
      setDirectActualCostJpy(0);
    } else {
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      const today = getLocalIsoDate();
      setFormData({
        invoiceNo: `YTL-FI-${randomNum}`,
        date: today,
        paymentDueDate: addDaysToDate(today, 5),
        status: 'UNPAID',
        customerName: '',
        customerAddress: '',
        portFrom: '',
        portTo: '',
        shippingCompany: '',
        vesselVoyage: '',
        etd: '',
        eta: '',
        blNo: '',
        bookingNo: '',
        shipmentNo: '',
        shipmentMode: '',
        freightTerm: 'PREPAID',
        exchangeRate: 155.0,
        containerCount: 1,
        containerSize: "40' HC",
        containerNumbers: '',
        subTotalJpy: 0,
        discountJpy: 0,
        remarks: '',
        grandTotalJpy: 0,
        actualShippingCostJpy: 0,
      });
      setItems([
        {
          id: `item-${Date.now()}-1`,
          details: '',
          description: '',
          currency: 'USD',
          unitPrice: 0,
          quantity: null,
          taxRate: 0,
          lineTotalJpy: 0,
        },
      ]);
      setActualCostItems([]);
      setDirectActualCostJpy(0);
    }
  }, [initialData, prefillFromBooking, prefillFromQuotation, isOpen]);

  useEffect(() => {
    if (!isOpen || initialFocusSection !== 'costing') return;
    const timer = window.setTimeout(() => {
      costingSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [isOpen, initialFocusSection]);

  const matchedBookingShippingPayments = useMemo(() => {
    const cleanBk = (formData.bookingNo || '').trim().toUpperCase();
    if (!cleanBk && !formData.linkedShippingPaymentId) return [];
    return availableShippingPayments.filter((p) => {
      if (formData.linkedShippingPaymentId && p.id === formData.linkedShippingPaymentId) return true;
      if (cleanBk && (p.bookingNo || '').trim().toUpperCase() === cleanBk) return true;
      return false;
    });
  }, [availableShippingPayments, formData.bookingNo, formData.linkedShippingPaymentId]);

  const linkedShippingPayableTotalJpy = useMemo(
    () =>
      matchedBookingShippingPayments.reduce(
        (sum, p) => sum + Math.max(0, Math.round(p.payableAmountJpy || 0)),
        0
      ),
    [matchedBookingShippingPayments]
  );

  const computedActualCostItems = useMemo(() => {
    const rate = formData.exchangeRate || 1;
    return actualCostItems.map((ci) => ({
      ...ci,
      lineCostJpy: calculateLineTotal(ci.currency, ci.unitCost, ci.quantity, ci.taxRate, rate),
    }));
  }, [actualCostItems, formData.exchangeRate]);

  const resolvedActualCostJpy = useMemo(() => {
    if (computedActualCostItems.length > 0) {
      return computedActualCostItems.reduce((sum, ci) => sum + ci.lineCostJpy, 0);
    }
    return Math.max(0, Math.round(directActualCostJpy || 0));
  }, [computedActualCostItems, directActualCostJpy]);

  const liveSellingJpy = Math.max(0, Math.round(formData.grandTotalJpy || 0));
  const liveNetProfitLossJpy = liveSellingJpy - resolvedActualCostJpy;
  const liveProfitMarginPct =
    liveSellingJpy > 0 ? Math.round((liveNetProfitLossJpy / liveSellingJpy) * 1000) / 10 : 0;

  // Filter From Booking STRICTLY by Booking Number only
  const bookingFilteredResults = useMemo(() => {
    const q = bookingSearchQuery.trim().toLowerCase();
    if (!q) return availableBookings;
    return availableBookings.filter((b) =>
      (b.bookingNumber || '').toLowerCase().includes(q)
    );
  }, [availableBookings, bookingSearchQuery]);

  if (!isOpen) return null;

  const applyQuotationData = (q: Quotation) => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const today = getLocalIsoDate();
    setIsDueDateManual(false);
    setFormData((prev) => ({
      ...prev,
      invoiceNo: prev.invoiceNo || `YTL-FI-${randomNum}`,
      date: today,
      paymentDueDate: addDaysToDate(today, 5),
      status: 'PENDING',
      customerName: q.customerName,
      customerAddress: q.customerAddress || 'TOKYO, JAPAN',
      portFrom: q.portFrom,
      portTo: q.portTo,
      shippingCompany: q.shippingCompany,
      vesselVoyage: q.vesselVoyage,
      etd: q.etd,
      eta: q.eta,
      bookingNo: q.bookingNo || '',
      shipmentNo: q.shipmentNo || '',
      blNo: q.blNo || (q.bookingNo ? `BL-${q.bookingNo}` : ''),
      shipmentMode: q.shipmentMode || `${q.containerCount} X ${q.containerSize || "40' HC"}`,
      freightTerm: (q.freightTerm || '').includes('COLLECT') ? 'COLLECT' : 'PREPAID',
      exchangeRate: q.exchangeRate || 155.0,
      containerCount: q.containerCount || 1,
      containerSize: q.containerSize || "40' HC",
      containerNumbers: q.containerNumbers || '',
      linkedBookingId: q.linkedBookingId,
      linkedQuotationId: q.id,
      quotationNo: q.quotationNo,
      amountReceivedJpy: 0,
      remarks: `FROM AGREED QUOTATION ${q.quotationNo}${q.remarks ? ` · ${q.remarks}` : ''}`,
    }));
    setItems(
      (q.sellingItems || []).map((item, idx) => ({
        ...item,
        id: `item-${Date.now()}-${idx}`,
      }))
    );
  };

  const applyBookingData = (booking: BookingConfirmation) => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const today = getLocalIsoDate();
    setIsDueDateManual(false);
    // Parse container count from booking.containerCount or from cargoVolumeSize (e.g. "3 X 40' Dry High")
    const matchCount = booking.cargoVolumeSize?.match(/(\d+)\s*X/i);
    const parsedCount = booking.containerCount || (matchCount ? parseInt(matchCount[1]) : 1);
    const parsedSize = booking.containerSize || (booking.cargoVolumeSize?.includes('20') ? "20' GP" : "40' HC");
    const parsedNumbers = booking.containerNumbers || '';

    const matchedCustomer = customers.find(
      (c) => c.name.toLowerCase() === booking.customerCompany.toLowerCase()
    );
    const matchedQuote = availableQuotations.find(
      (q) =>
        (q.linkedBookingId && q.linkedBookingId === booking.id) ||
        (q.bookingNo && q.bookingNo.toUpperCase() === booking.bookingNumber.toUpperCase())
    );

    setFormData((prev) => ({
      ...prev,
      invoiceNo: prev.invoiceNo || `YTL-FI-${randomNum}`,
      date: today,
      paymentDueDate: addDaysToDate(today, 5),
      status: 'PENDING',
      customerName: booking.customerCompany,
      customerAddress:
        matchedCustomer
          ? [matchedCustomer.addressLine1, matchedCustomer.addressLine2].filter(Boolean).join(', ')
          : booking.customerCompany.includes('HBI')
          ? 'YATOMI-SHI, TOKAI, JAPAN'
          : 'TOKYO, JAPAN',
      portFrom: booking.pol || booking.por || 'NAGOYA',
      portTo: booking.pod || booking.pody || 'DUBLIN',
      shippingCompany: booking.shippingCompany,
      vesselVoyage: `${booking.vessel} ${booking.voyage}`.trim(),
      etd: booking.etd,
      eta: booking.eta,
      bookingNo: booking.bookingNumber,
      shipmentNo: booking.shipmentNo || matchedQuote?.shipmentNo || '',
      blNo: booking.blNo || matchedQuote?.blNo || `BL-${booking.bookingNumber}`,
      shipmentMode: `${parsedCount} X ${parsedSize}`,
      freightTerm: (booking.freightTerm || '').includes('COLLECT') ? 'COLLECT' : 'PREPAID',
      exchangeRate: matchedQuote?.exchangeRate || 155.0,
      containerCount: parsedCount,
      containerSize: parsedSize,
      containerNumbers: parsedNumbers,
      linkedBookingId: booking.id,
      linkedQuotationId: matchedQuote?.id || prev.linkedQuotationId,
      quotationNo: matchedQuote?.quotationNo || prev.quotationNo,
      remarks: `SHIPPER: ${booking.shipperCompany || 'AS ACTUAL'} · COMMODITY: ${booking.commodity}`,
    }));

    if (matchedQuote && matchedQuote.sellingItems.length > 0 && items.length === 0) {
      setItems(
        matchedQuote.sellingItems.map((it, idx) => ({
          ...it,
          id: `item-${Date.now()}-${idx}`,
        }))
      );
      return;
    }

    if (items.length === 0) {
      setItems([
        {
          id: `item-${Date.now()}-1`,
          details: 'Freight',
          description: `OCEAN FREIGHT TO ${booking.pod || 'DESTINATION'} - $ 1,800 X ${parsedCount} CONT. (${parsedSize})`,
          currency: 'USD',
          unitPrice: 1800,
          quantity: parsedCount,
          taxRate: 0,
          lineTotalJpy: 1800 * parsedCount * 155,
        },
        {
          id: `item-${Date.now()}-2`,
          details: 'Doc Fee',
          description: 'DOCUMENTATION FEE (PER B/L)',
          currency: 'JPY',
          unitPrice: 6600,
          quantity: 1,
          taxRate: 10,
          lineTotalJpy: 7260,
        },
        {
          id: `item-${Date.now()}-3`,
          details: 'THC',
          description: `TERMINAL HANDLING CHARGE (THC) - ${parsedCount} CONT.`,
          currency: 'JPY',
          unitPrice: 35000,
          quantity: parsedCount,
          taxRate: 10,
          lineTotalJpy: 35000 * parsedCount * 1.1,
        },
        {
          id: `item-${Date.now()}-4`,
          details: 'Seal Fee',
          description: `CONTAINER SEAL FEE - ${parsedCount} CONT.`,
          currency: 'JPY',
          unitPrice: 1500,
          quantity: parsedCount,
          taxRate: 10,
          lineTotalJpy: 1500 * parsedCount * 1.1,
        },
      ]);
    }
  };

  const handleSyncContainerCharges = (targetCount?: number, targetSize?: string) => {
    const count = targetCount !== undefined ? targetCount : (formData.containerCount || 1);
    const size = targetSize !== undefined ? targetSize : (formData.containerSize || "40' HC");

    setItems((prevItems) =>
      prevItems.map((item) => {
        const isContainerCharge =
          item.details === 'Freight' ||
          item.details === 'THC' ||
          item.details === 'Seal Fee' ||
          item.details === 'Drayage' ||
          item.details === 'Inspection Fee' ||
          /CONT|CONTAINER|FREIGHT/i.test(item.details) ||
          /CONT|CONTAINER/i.test(item.description);

        if (isContainerCharge) {
          let updatedDesc = item.description;
          if (item.details === 'Freight') {
            const sym = item.currency === 'USD' ? '$' : item.currency === 'EURO' ? '€' : '¥';
            updatedDesc = `OCEAN FREIGHT - ${sym} ${item.unitPrice.toLocaleString()} X ${count} CONT. (${size}) TAX FREE`;
          } else if (item.details === 'THC') {
            updatedDesc = `TERMINAL HANDLING CHARGE (THC) - ${count} CONT.`;
          } else if (item.details === 'Seal Fee') {
            updatedDesc = `CONTAINER SEAL FEE - ${count} CONT.`;
          }

          return {
            ...item,
            quantity: count,
            description: updatedDesc,
          };
        }
        return item;
      })
    );
  };

  const handleContainerCountInput = (newCount: number) => {
    const count = Math.max(1, newCount);
    setFormData((prev) => ({
      ...prev,
      containerCount: count,
      shipmentMode: `${count} X ${prev.containerSize || "40' HC"}`,
    }));
    handleSyncContainerCharges(count, formData.containerSize);
  };

  const handleFieldChange = (field: keyof FreightInvoice, value: any) => {
    setIsDirty(true);
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddItem = (detailsType = 'Other Charges') => {
    setIsDirty(true);
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      details: detailsType,
      description: `${detailsType.toUpperCase()} CHARGE`,
      currency: 'JPY',
      unitPrice: 5000,
      quantity: 1,
      taxRate: 0,
      lineTotalJpy: 5000,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: any
  ) => {
    setIsDirty(true);
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setIsDirty(true);
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAutoNumber = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    setFormData((prev) => ({ ...prev, invoiceNo: `YTL-FI-${randomNum}` }));
  };

  const handleAddCostItem = (category = 'Shipping Line Ocean Freight') => {
    setIsDirty(true);
    const seedAmount =
      actualCostItems.length === 0 && directActualCostJpy > 0 ? directActualCostJpy : 0;
    const newItem: QuotationCostItem = {
      id: `aci-${Date.now()}`,
      category,
      description: '',
      supplierName: formData.shippingCompany || '',
      currency: 'JPY',
      unitCost: seedAmount,
      quantity: 1,
      taxRate: 0,
      lineCostJpy: seedAmount,
    };
    setActualCostItems((prev) => [...prev, newItem]);
    if (seedAmount > 0) setDirectActualCostJpy(0);
  };

  const handleCostItemChange = (
    index: number,
    field: keyof QuotationCostItem,
    value: any
  ) => {
    setIsDirty(true);
    setActualCostItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveCostItem = (index: number) => {
    setIsDirty(true);
    setActualCostItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImportLinkedShippingCost = () => {
    if (matchedBookingShippingPayments.length === 0) return;
    setIsDirty(true);
    const imported: QuotationCostItem[] = matchedBookingShippingPayments.map((p, idx) => ({
      id: `aci-sl-${Date.now()}-${idx}`,
      category: 'Shipping Line Ocean Freight',
      description: `${p.shippingLineName} (${p.paymentRefNo}) · ${p.containerDetails || 'Carrier Payable'}`,
      supplierName: p.shippingLineName,
      currency: 'JPY',
      unitCost: Math.max(0, Math.round(p.payableAmountJpy || 0)),
      quantity: 1,
      taxRate: 0,
      lineCostJpy: Math.max(0, Math.round(p.payableAmountJpy || 0)),
    }));
    setActualCostItems(imported);
    setDirectActualCostJpy(0);
    setFormData((prev) => ({
      ...prev,
      linkedShippingPaymentId: matchedBookingShippingPayments[0].id,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const rate = formData.exchangeRate || 1;
    const finalItems = items.map((item) => ({
      ...item,
      lineTotalJpy: calculateLineTotal(
        item.currency,
        item.unitPrice,
        item.quantity,
        item.taxRate,
        rate
      ),
    }));

    const finalCostItems = actualCostItems.map((ci) => ({
      ...ci,
      lineCostJpy: calculateLineTotal(
        ci.currency,
        ci.unitCost,
        ci.quantity,
        ci.taxRate,
        rate
      ),
    }));

    const subTotal = finalItems.reduce((acc, cur) => acc + cur.lineTotalJpy, 0);
    const discount = Number(formData.discountJpy) || 0;
    const grandTotal = Math.max(0, subTotal - discount);
    const finalActualCostJpy =
      finalCostItems.length > 0
        ? finalCostItems.reduce((acc, ci) => acc + ci.lineCostJpy, 0)
        : Math.max(0, Math.round(directActualCostJpy || 0));
    const finalNetPL = grandTotal - finalActualCostJpy;
    const finalMarginPct =
      grandTotal > 0 ? Math.round((finalNetPL / grandTotal) * 1000) / 10 : 0;
    const now = new Date().toISOString();

    const received = Math.max(0, Math.min(grandTotal, Number(formData.amountReceivedJpy) || 0));
    const hasCostInfo = finalCostItems.length > 0 || finalActualCostJpy > 0;
    const fallbackInvoiceNo = `YTL-FI-${Math.floor(100000 + Math.random() * 900000)}`;
    const resolvedInvoiceNo = (formData.invoiceNo || '').trim() || fallbackInvoiceNo;
    const resolvedLinkedShippingPaymentId =
      formData.linkedShippingPaymentId || matchedBookingShippingPayments[0]?.id || '';
    const resolvedCostUpdatedAt = hasCostInfo
      ? now
      : initialData?.actualCostUpdatedAt || '';

    const draftInvoice: FreightInvoice = {
      ...(formData as FreightInvoice),
      id: initialData?.id || `inv-${Date.now()}`,
      invoiceNo: resolvedInvoiceNo,
      date: formData.date || now.slice(0, 10),
      paymentDueDate: formData.paymentDueDate || '',
      customerName: (formData.customerName || '').trim(),
      customerAddress: (formData.customerAddress || '').trim(),
      portFrom: (formData.portFrom || '').trim(),
      portTo: (formData.portTo || '').trim(),
      shippingCompany: (formData.shippingCompany || '').trim(),
      vesselVoyage: (formData.vesselVoyage || '').trim(),
      etd: (formData.etd || '').trim(),
      eta: (formData.eta || '').trim(),
      blNo: (formData.blNo || '').trim(),
      bookingNo: (formData.bookingNo || '').trim(),
      shipmentNo: (formData.shipmentNo || '').trim(),
      shipmentMode: (formData.shipmentMode || '').trim(),
      freightTerm: formData.freightTerm || 'PREPAID',
      exchangeRate: Number(formData.exchangeRate) || 155,
      containerCount: Number(formData.containerCount) || 1,
      containerSize: formData.containerSize || "40' HC",
      containerNumbers: formData.containerNumbers || '',
      remarks: formData.remarks || '',
      items: finalItems,
      subTotalJpy: subTotal,
      discountJpy: discount,
      grandTotalJpy: grandTotal,
      amountReceivedJpy: received,
      outstandingBalanceJpy: Math.max(0, grandTotal - received),
      actualCostItems: finalCostItems,
      actualShippingCostJpy: finalActualCostJpy,
      netProfitLossJpy: finalNetPL,
      profitMarginPct: finalMarginPct,
      ...(resolvedLinkedShippingPaymentId
        ? { linkedShippingPaymentId: resolvedLinkedShippingPaymentId }
        : {}),
      ...(resolvedCostUpdatedAt ? { actualCostUpdatedAt: resolvedCostUpdatedAt } : {}),
      createdAt: initialData?.createdAt || now,
      updatedAt: now,
    };

    const computedFinance = computeCustomerInvoiceFinance(draftInvoice);
    draftInvoice.status = computedFinance.invoiceStatus;
    draftInvoice.outstandingBalanceJpy = computedFinance.outstandingJpy;

    onSave(draftInvoice);
    forceClose();
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
          className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl my-auto overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-slate-50 shrink-0">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {initialData ? 'Edit Freight Invoice' : 'Create New Freight Invoice'}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Auto-computes USD/JPY exchange rates, tax breakdown, and A4 print layout
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

        {/* Autofill from Booking or Agreed Quotation (Optional — leave blank for manual invoice) */}
        {(availableBookings.length > 0 || availableQuotations.length > 0) && !initialData && (
          <div className="px-4 sm:px-6 py-2.5 bg-sky-50 border-b border-sky-100 space-y-1.5 text-xs shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {availableQuotations.length > 0 && (
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-indigo-900 flex items-center gap-1.5 shrink-0">
                    <Calculator className="w-4 h-4 text-indigo-600" />
                    From Agreed Quote:
                  </span>
                  <select
                    onChange={(e) => {
                      const q = availableQuotations.find((x) => x.id === e.target.value);
                      if (q) {
                        applyQuotationData(q);
                        setBookingSearchQuery(q.bookingNo || '');
                        setIsDirty(true);
                      }
                    }}
                    className="flex-1 text-xs bg-white border border-indigo-300 rounded px-2.5 py-1.5 text-slate-800 font-medium"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select quotation selling price...
                    </option>
                    {availableQuotations.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.quotationNo} · {q.customerName} (¥{q.totalSellingJpy.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {availableBookings.length > 0 && (
                <div ref={bookingSearchRef} className="relative flex items-center justify-between gap-2">
                  <span className="font-semibold text-sky-900 flex items-center gap-1.5 shrink-0">
                    <Link2 className="w-4 h-4 text-sky-600" />
                    From Booking:
                  </span>
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-sky-600 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={bookingSearchQuery}
                      onFocus={() => setIsBookingDropdownOpen(true)}
                      onChange={(e) => {
                        setBookingSearchQuery(e.target.value.toUpperCase());
                        setIsBookingDropdownOpen(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (bookingFilteredResults.length > 0) {
                            const exact =
                              bookingFilteredResults.find(
                                (b) =>
                                  b.bookingNumber.toUpperCase() === bookingSearchQuery.trim().toUpperCase()
                              ) || bookingFilteredResults[0];
                            applyBookingData(exact);
                            setBookingSearchQuery(exact.bookingNumber);
                            setIsBookingDropdownOpen(false);
                            setIsDirty(true);
                          }
                        }
                      }}
                      placeholder="Search Booking No only..."
                      className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-sky-300 rounded text-slate-900 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    {bookingSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setBookingSearchQuery('');
                          setIsBookingDropdownOpen(true);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        title="Clear booking search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isBookingDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-sky-300 rounded-lg shadow-xl z-40 max-h-56 overflow-y-auto divide-y divide-slate-100">
                        {bookingFilteredResults.length === 0 ? (
                          <div className="px-3 py-2.5 text-[11px] text-slate-500 italic">
                            No booking found matching Booking No &ldquo;{bookingSearchQuery}&rdquo;. You can still enter a manual invoice below.
                          </div>
                        ) : (
                          bookingFilteredResults.map((b) => (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => {
                                applyBookingData(b);
                                setBookingSearchQuery(b.bookingNumber);
                                setIsBookingDropdownOpen(false);
                                setIsDirty(true);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-sky-50 transition-colors flex items-center justify-between gap-2"
                            >
                              <span className="font-mono font-bold text-sky-900 text-xs">
                                {b.bookingNumber}
                              </span>
                              <span className="text-[11px] text-slate-500 truncate">
                                {b.customerCompany} · {b.pod || b.pody}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="text-[10.5px] text-sky-800/80 font-medium">
              Optional quick import above (Booking search filters by Booking No only) — or fill fields manually below for a direct invoice.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div ref={scrollContainerRef} className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
            {/* Section 1: Invoice Header Info */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Invoice No
                </label>
                <button
                  type="button"
                  onClick={handleAutoNumber}
                  className="text-[11px] text-sky-700 hover:underline flex items-center gap-1 font-medium"
                >
                  <Sparkles className="w-3 h-3" /> Auto
                </button>
              </div>
              <input
                type="text"
                
                value={formData.invoiceNo || ''}
                onChange={(e) => handleFieldChange('invoiceNo', e.target.value.toUpperCase())}
                placeholder="YTL-FI-133916"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Invoice Date
              </label>
              <input
                type="date"
                value={formData.date || ''}
                onChange={(e) => {
                  const nextDate = e.target.value;
                  setIsDirty(true);
                  setFormData((prev) => ({
                    ...prev,
                    date: nextDate,
                    ...(!isDueDateManual && nextDate
                      ? { paymentDueDate: addDaysToDate(nextDate, 5) }
                      : {}),
                  }));
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <label className="block text-xs font-semibold text-rose-700">
                  Payment Due Date *
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDueDateManual(false);
                      handleFieldChange('paymentDueDate', addDaysToDate(formData.date, 5));
                    }}
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-200 transition-colors"
                    title="Set Due Date to 5 days from Invoice Date"
                  >
                    +5 Days
                  </button>
                  {parseValidIsoDate(formData.etd) && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsDueDateManual(true);
                        handleFieldChange('paymentDueDate', addDaysToDate(formData.etd, 5));
                      }}
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 hover:bg-sky-200 border border-sky-200 transition-colors"
                      title="Set Due Date to 5 days from ETD"
                    >
                      ETD +5d
                    </button>
                  )}
                </div>
              </div>
              <input
                type="date"
                value={formData.paymentDueDate || ''}
                onChange={(e) => {
                  setIsDueDateManual(true);
                  handleFieldChange('paymentDueDate', e.target.value);
                }}
                className="w-full px-3 py-2 text-sm border border-rose-300 bg-rose-50/40 rounded-lg focus:ring-2 focus:ring-rose-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Status
              </label>
              <select
                value={formData.status || 'PENDING'}
                onChange={(e) => handleFieldChange('status', e.target.value as InvoiceStatus)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-medium"
              >
                <option value="PENDING">PENDING</option>
                <option value="UNPAID">UNPAID</option>
                <option value="PAID">PAID</option>
                <option value="PARTIAL">PARTIAL</option>
                <option value="OVERDUE">OVERDUE</option>
              </select>
            </div>
          </div>

          {/* Section 2: Customer M/S & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                M / S (Customer Name) *
              </label>
              <input
                type="text"
                list="inv-customer-list"
                value={formData.customerName || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  handleFieldChange('customerName', val);
                  const found = customers.find((c) => c.name.toLowerCase() === val.toLowerCase());
                  if (found) {
                    const addr = [found.addressLine1, found.addressLine2].filter(Boolean).join(', ');
                    if (addr) handleFieldChange('customerAddress', addr);
                  }
                }}
                placeholder="e.g. HBI CO., LTD"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-semibold"
              />
              <datalist id="inv-customer-list">
                {customers.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Address
              </label>
              <input
                type="text"
                value={formData.customerAddress || ''}
                onChange={(e) => handleFieldChange('customerAddress', e.target.value)}
                placeholder="e.g. YATOMI-SHI, TOKAI, AICHI"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Section 3: Vessel, Voyage, Ports, Reference */}
          <div className="border-t border-slate-200 pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Shipment & Logistics Parameters
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Port from
                </label>
                <input
                  type="text"
                  value={formData.portFrom || ''}
                  onChange={(e) => handleFieldChange('portFrom', e.target.value.toUpperCase())}
                  placeholder="NAGOYA"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Port to
                </label>
                <input
                  type="text"
                  value={formData.portTo || ''}
                  onChange={(e) => handleFieldChange('portTo', e.target.value.toUpperCase())}
                  placeholder="KARACHI"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shipping Line
                </label>
                <input
                  type="text"
                  value={formData.shippingCompany || ''}
                  onChange={(e) => handleFieldChange('shippingCompany', e.target.value)}
                  placeholder="TS LINES"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vessel & Voy
                </label>
                <input
                  type="text"
                  value={formData.vesselVoyage || ''}
                  onChange={(e) => handleFieldChange('vesselVoyage', e.target.value)}
                  placeholder="OKEE AURELIA 167W"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ETD
                </label>
                <input
                  type="text"
                  value={formData.etd || ''}
                  onChange={(e) => handleFieldChange('etd', e.target.value)}
                  placeholder="30-Aug-2026"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ETA
                </label>
                <input
                  type="text"
                  value={formData.eta || ''}
                  onChange={(e) => handleFieldChange('eta', e.target.value)}
                  placeholder="20-Sep-2026"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  B/L No.
                </label>
                <input
                  type="text"
                  value={formData.blNo || ''}
                  onChange={(e) => handleFieldChange('blNo', e.target.value)}
                  placeholder="120610087601"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Booking No
                </label>
                <input
                  type="text"
                  value={formData.bookingNo || ''}
                  onChange={(e) => handleFieldChange('bookingNo', e.target.value.toUpperCase())}
                  placeholder="120BK6009764"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shipment No (Linked)
                </label>
                <input
                  type="text"
                  value={formData.shipmentNo || ''}
                  onChange={(e) => handleFieldChange('shipmentNo', e.target.value.toUpperCase())}
                  placeholder="SHP-2026-001"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shipment Mode
                </label>
                <input
                  type="text"
                  value={formData.shipmentMode || ''}
                  onChange={(e) => handleFieldChange('shipmentMode', e.target.value)}
                  placeholder="Container"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Freight Term
                </label>
                <select
                  value={formData.freightTerm || 'PREPAID'}
                  onChange={(e) => handleFieldChange('freightTerm', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-semibold"
                >
                  <option value="PREPAID">PREPAID</option>
                  <option value="COLLECT">COLLECT</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-sky-800">
                    Exchange Rate (USD → JPY)
                  </label>
                  <div className="flex items-center gap-1 text-[10px]">
                    {[150, 152, 155, 158].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleFieldChange('exchangeRate', r)}
                        className={`px-1.5 py-0.5 rounded border font-mono font-bold transition-colors ${
                          formData.exchangeRate === r
                            ? 'bg-sky-700 text-white border-sky-800 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-300 hover:bg-sky-50'
                        }`}
                      >
                        ¥{r}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={formData.exchangeRate || 155}
                  onChange={(e) => handleFieldChange('exchangeRate', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm border border-sky-300 bg-sky-50/40 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  No. of Containers
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    value={formData.containerCount || 1}
                    onChange={(e) => handleContainerCountInput(parseInt(e.target.value) || 1)}
                    className="w-20 px-3 py-2 text-sm border-2 border-sky-400 bg-sky-50/50 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono font-bold text-sky-950"
                  />
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => handleContainerCountInput(cnt)}
                        className={`px-2 py-1.5 text-xs font-bold rounded border transition-colors ${
                          formData.containerCount === cnt
                            ? 'bg-sky-700 text-white border-sky-800 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {cnt}C
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Container Type & Container Numbers Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3 p-3 bg-sky-50/60 border border-sky-200 rounded-xl">
              <div>
                <label className="block text-xs font-bold text-sky-900 mb-1">
                  Container Size / Type
                </label>
                <select
                  value={formData.containerSize || "40' HC"}
                  onChange={(e) => {
                    const newSize = e.target.value;
                    handleFieldChange('containerSize', newSize);
                    handleFieldChange('shipmentMode', `${formData.containerCount || 1} X ${newSize}`);
                    handleSyncContainerCharges(formData.containerCount, newSize);
                  }}
                  className="w-full px-3 py-2 text-xs border border-sky-300 rounded-lg bg-white font-semibold text-slate-900"
                >
                  <option value="40' HC">40' High Cube (40' HC)</option>
                  <option value="20' GP">20' General Purpose (20' GP)</option>
                  <option value="40' GP">40' General Purpose (40' GP)</option>
                  <option value="45' HC">45' High Cube (45' HC)</option>
                  <option value="40' RF">40' Reefer Container (40' RF)</option>
                  <option value="40' FR">40' Flat Rack (40' FR)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-sky-900">
                    Container Numbers (コンテナ番号)
                  </label>
                  <button
                    type="button"
                    onClick={() => handleSyncContainerCharges()}
                    className="text-[11px] font-bold text-sky-700 hover:text-sky-900 underline flex items-center gap-1"
                    title="Recalculate line items for current container count"
                  >
                    <span>⚡ Re-Multiply {formData.containerCount || 1} Containers</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.containerNumbers || ''}
                  onChange={(e) => handleFieldChange('containerNumbers', e.target.value.toUpperCase())}
                  placeholder="e.g. MSCU1234567, TGHU7654321, TEMU9876543"
                  className="w-full px-3 py-2 text-xs border border-sky-300 rounded-lg bg-white font-mono font-semibold"
                />
              </div>

              {/* Seal Numbers, Gross Weight, Volume (CBM) */}
              <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-sky-200/60">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5">
                    Seal Number(s)
                  </label>
                  <input
                    type="text"
                    value={formData.sealNumbers || ''}
                    onChange={(e) => handleFieldChange('sealNumbers', e.target.value)}
                    placeholder="e.g. ML-JP048291"
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5">
                    Gross Weight
                  </label>
                  <input
                    type="text"
                    value={formData.grossWeightKg || ''}
                    onChange={(e) => handleFieldChange('grossWeightKg', e.target.value)}
                    placeholder="e.g. 14,500 KG"
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5">
                    Measurement / Volume
                  </label>
                  <input
                    type="text"
                    value={formData.measurementCbm || ''}
                    onChange={(e) => handleFieldChange('measurementCbm', e.target.value)}
                    placeholder="e.g. 68.4 CBM"
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Line Items Table */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Line Items & Charges Breakdown
                </h4>
                <p className="text-[11px] text-slate-500">
                  Select USD or JPY; USD items automatically convert to JPY at rate {formData.exchangeRate}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleAddItem('Other Charges')}
                  className="px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg border border-sky-200 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Charge Item
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => {
                const calculatedJpy = calculateLineTotal(
                  item.currency,
                  item.unitPrice,
                  item.quantity,
                  item.taxRate,
                  formData.exchangeRate || 1
                );

                return (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-50 border border-slate-300 rounded-xl space-y-2 shadow-2xs"
                  >
                    <div className="grid grid-cols-12 gap-2 items-center">
                      {/* Item Details Type */}
                      <div className="col-span-12 sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
                          Charge Type
                        </label>
                        <input
                          type="text"
                          list={`item-types-${index}`}
                          value={item.details}
                          onChange={(e) => handleItemChange(index, 'details', e.target.value)}
                          placeholder="Freight / THC"
                          className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded bg-white font-bold text-slate-800"
                        />
                        <datalist id={`item-types-${index}`}>
                          {COMMON_ITEM_TYPES.map((t) => (
                            <option key={t} value={t} />
                          ))}
                        </datalist>
                      </div>

                      {/* Description */}
                      <div className="col-span-12 sm:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
                          Description
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          placeholder="e.g. OCEAN FREIGHT (40' HC)"
                          className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded bg-white font-medium"
                        />
                      </div>

                      {/* Currency */}
                      <div className="col-span-4 sm:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
                          Currency
                        </label>
                        <select
                          value={item.currency}
                          onChange={(e) =>
                            handleItemChange(index, 'currency', e.target.value as 'USD' | 'JPY')
                          }
                          className="w-full px-1.5 py-1.5 text-xs border border-sky-300 rounded bg-white font-mono font-bold text-sky-950"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="JPY">JPY (¥)</option>
                        </select>
                      </div>

                      {/* Unit Price */}
                      <div className="col-span-4 sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
                          Unit Price {item.currency === 'USD' ? '($)' : '(¥)'}
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded bg-white font-mono font-semibold"
                        />
                      </div>

                      {/* Container Quantity */}
                      <div className="col-span-4 sm:col-span-1.5">
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="block text-[10px] font-bold text-slate-700 uppercase">
                            Qty
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const isBlank =
                                item.quantity === undefined ||
                                item.quantity === null ||
                                item.quantity === 0;
                              handleItemChange(index, 'quantity', isBlank ? 1 : null);
                            }}
                            className="text-[9.5px] text-sky-700 hover:text-sky-900 underline font-semibold cursor-pointer"
                            title="Toggle between Blank and 1"
                          >
                            {item.quantity === undefined ||
                            item.quantity === null ||
                            item.quantity === 0
                              ? 'Set 1'
                              : 'Blank'}
                          </button>
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="Blank"
                          value={
                            item.quantity === undefined ||
                            item.quantity === null ||
                            item.quantity === 0
                              ? ''
                              : item.quantity
                          }
                          onChange={(e) => {
                            const val = e.target.value.trim();
                            if (val === '') {
                              handleItemChange(index, 'quantity', null);
                            } else {
                              const num = parseFloat(val);
                              handleItemChange(
                                index,
                                'quantity',
                                isNaN(num) || num <= 0 ? null : num
                              );
                            }
                          }}
                          className={`w-full px-1.5 py-1.5 text-xs border rounded font-mono text-center font-bold transition-colors ${
                            item.quantity !== undefined &&
                            item.quantity !== null &&
                            item.quantity > 0
                              ? 'border-sky-400 bg-sky-50/50 text-sky-950'
                              : 'border-slate-300 bg-slate-50 text-slate-400 placeholder:italic'
                          }`}
                        />
                      </div>

                      {/* Tax Rate */}
                      <div className="col-span-4 sm:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
                          Tax %
                        </label>
                        <select
                          value={item.taxRate || 0}
                          onChange={(e) =>
                            handleItemChange(index, 'taxRate', parseInt(e.target.value) || 0)
                          }
                          className="w-full px-1 py-1.5 text-xs border border-slate-300 rounded bg-white font-mono font-semibold"
                        >
                          <option value="0">0%</option>
                          <option value="10">10%</option>
                        </select>
                      </div>

                      {/* Calculated JPY Total */}
                      <div className="col-span-6 sm:col-span-1 text-right">
                        <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">
                          JPY Total
                        </label>
                        <span className="font-mono text-xs font-extrabold text-sky-950 block py-1 bg-white px-2 rounded border border-slate-200">
                          ¥{calculatedJpy.toLocaleString()}
                        </span>
                      </div>

                      {/* Delete button */}
                      <div className="col-span-2 sm:col-span-0.5 text-center">
                        <label className="block text-[10px] text-transparent mb-0.5">X</label>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Live Formula Display for this Row */}
                    <div className="text-[10.5px] px-2 py-1 bg-white rounded border border-slate-200 font-mono text-slate-700 flex flex-wrap items-center justify-between gap-1">
                      <div>
                        <span className="font-bold text-slate-900 font-sans">Formula: </span>
                        {item.currency === 'USD' ? (
                          <span>
                            ${item.unitPrice.toLocaleString()}{' '}
                            {item.quantity && Number(item.quantity) > 0
                              ? `× ${item.quantity} QTY`
                              : '(Blank Qty)'}{' '}
                            ={' '}
                            <strong className="text-sky-900">
                              ${(item.unitPrice * (item.quantity || 1)).toLocaleString()} USD
                            </strong>{' '}
                            → Converted @ ¥{formData.exchangeRate || 155}/$ ={' '}
                            <strong className="text-emerald-900">
                              ¥{calculatedJpy.toLocaleString()} JPY
                            </strong>
                            <span className="text-slate-600 font-semibold font-sans ml-1.5">
                              [Tax: {item.taxRate || 0}%]
                            </span>
                          </span>
                        ) : (
                          <span>
                            ¥{item.unitPrice.toLocaleString()}{' '}
                            {item.quantity && Number(item.quantity) > 0
                              ? `× ${item.quantity} QTY`
                              : '(Blank Qty)'}{' '}
                            = ¥{(item.unitPrice * (item.quantity || 1)).toLocaleString()} JPY
                            <span className="text-slate-600 font-semibold font-sans ml-1.5">
                              [Tax: {item.taxRate || 0}%]
                            </span>
                            {item.taxRate > 0 &&
                              ` (+10% Tax = ¥${calculatedJpy.toLocaleString()} JPY)`}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-sans">Row #{index + 1}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 5: Totals, Discount & Transparent Currency Breakdown */}
          <div className="border-t border-slate-200 pt-4 space-y-4">
            {/* Currency & Tax Summary Card */}
            {(() => {
              const rate = formData.exchangeRate || 155;
              const usdItems = items.filter((i) => i.currency === 'USD');
              const jpyItems = items.filter((i) => i.currency !== 'USD');
              const totalUsdOriginal = usdItems.reduce(
                (acc, i) => acc + i.unitPrice * (i.quantity || 1),
                0
              );
              const totalUsdInJpy = Math.round(totalUsdOriginal * rate);

              const jpySubtotalNet = jpyItems.reduce(
                (acc, i) => acc + i.unitPrice * (i.quantity || 1),
                0
              );
              const jpyTaxAmount = jpyItems.reduce((acc, i) => {
                const base = i.unitPrice * (i.quantity || 1);
                return acc + Math.round(base * ((i.taxRate || 0) / 100));
              }, 0);
              const jpyTotalWithTax = jpySubtotalNet + jpyTaxAmount;

              return (
                <div className="bg-sky-50/70 border border-sky-300 rounded-xl p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-sky-200 pb-1.5">
                    <span className="font-extrabold uppercase tracking-wide text-sky-950 flex items-center gap-1.5">
                      <span>📊 Currency &amp; Tax Breakdown (Customer Invoice Summary)</span>
                    </span>
                    <span className="font-mono text-sky-800 font-bold bg-white px-2 py-0.5 rounded border border-sky-200">
                      1 USD = ¥{rate.toFixed(2)} JPY
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white p-2.5 rounded-lg border border-sky-200 space-y-1">
                      <div className="flex justify-between font-bold text-sky-900">
                        <span>Ocean Freight (USD):</span>
                        <span className="font-mono text-sm">${totalUsdOriginal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 text-[11px]">
                        <span>Conversion to JPY:</span>
                        <span className="font-mono">${totalUsdOriginal.toLocaleString()} × ¥{rate}</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-1">
                        <span>Freight in JPY (0% Tax):</span>
                        <span className="font-mono text-sky-950 font-extrabold">¥{totalUsdInJpy.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>Domestic Port Charges (JPY):</span>
                        <span className="font-mono">¥{jpySubtotalNet.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-amber-800 text-[11px]">
                        <span>Consumption Tax (10%):</span>
                        <span className="font-mono font-semibold">+¥{jpyTaxAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-1">
                        <span>Total Domestic Fees:</span>
                        <span className="font-mono font-extrabold">¥{jpyTotalWithTax.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Remarks (e.g. Shipper / Reference)
                </label>
                <textarea
                  rows={3}
                  value={formData.remarks || ''}
                  onChange={(e) => handleFieldChange('remarks', e.target.value)}
                  placeholder="SHIPPER - CARCADE INTERNATIONAL LTD."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-600">
                  <span>Sub Total (JPY):</span>
                  <span className="font-mono font-semibold text-slate-900">
                    ¥{(formData.subTotalJpy || 0).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-600">
                  <span>Discount (JPY):</span>
                  <div className="w-32">
                    <input
                      type="number"
                      min="0"
                      value={formData.discountJpy || 0}
                      onChange={(e) =>
                        handleFieldChange('discountJpy', parseInt(e.target.value) || 0)
                      }
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded text-right font-mono"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-300 pt-2 flex justify-between items-center bg-emerald-50 p-2.5 rounded">
                  <span className="font-bold text-slate-900 text-sm">Grand Total (JPY):</span>
                  <span className="font-mono font-extrabold text-lg text-emerald-800">
                    ¥{(formData.grandTotalJpy || 0).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-700 pt-1">
                  <span className="font-semibold">Amount Received (JPY):</span>
                  <div className="w-36">
                    <input
                      type="number"
                      min="0"
                      value={formData.amountReceivedJpy ?? 0}
                      onChange={(e) =>
                        handleFieldChange('amountReceivedJpy', parseInt(e.target.value) || 0)
                      }
                      className="w-full px-2 py-1 text-xs border border-sky-300 bg-white rounded text-right font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs font-bold pt-1 border-t border-slate-200">
                  <span className="text-slate-700">Auto Outstanding Balance:</span>
                  <span
                    className={`font-mono ${
                      Math.max(0, (formData.grandTotalJpy || 0) - (formData.amountReceivedJpy || 0)) > 0
                        ? 'text-rose-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    ¥
                    {Math.max(
                      0,
                      (formData.grandTotalJpy || 0) - (formData.amountReceivedJpy || 0)
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 6: INTERNAL ONLY — Selling Price, Actual Shipping Line Cost & Profit/Loss Analysis */}
          <div
            id="internal-costing-section"
            ref={costingSectionRef}
            className="border-2 border-amber-300 bg-amber-50/40 rounded-xl p-4 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-amber-200">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                    <Lock className="w-3 h-3" /> Internal Only · Hidden From Customer PDF
                  </span>
                  {formData.bookingNo && (
                    <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-900 font-mono text-[10px] font-bold border border-sky-200">
                      Linked Booking: {formData.bookingNo}
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-extrabold text-slate-900 mt-1.5">
                  A. Selling Price, B. Actual Shipping Line Cost &amp; Profit / Loss
                </h4>
                <p className="text-[11px] text-slate-600">
                  Enter actual charges billed by the shipping line. Provisional/unconfirmed quotations are never treated as actual costs.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleAddCostItem('Shipping Line Ocean Freight')}
                className="px-3 py-1.5 text-xs font-bold text-amber-950 bg-amber-200 hover:bg-amber-300 rounded-lg border border-amber-400 flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add Carrier Cost Line
              </button>
            </div>

            {/* Linked Shipping Line Payment Helper Banner */}
            {matchedBookingShippingPayments.length > 0 && (
              <div className="bg-sky-50 border border-sky-300 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-sky-950">
                  <Anchor className="w-4 h-4 text-sky-700 shrink-0" />
                  <div>
                    <span className="font-bold">
                      Linked Shipping Line Payment ({matchedBookingShippingPayments.map((p) => p.paymentRefNo).join(', ')}):
                    </span>{' '}
                    <span className="font-mono font-extrabold text-sky-900">
                      ¥{linkedShippingPayableTotalJpy.toLocaleString()}
                    </span>{' '}
                    <span className="text-slate-600">
                      ({matchedBookingShippingPayments[0].shippingLineName})
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleImportLinkedShippingCost}
                  className="px-3 py-1.5 text-[11px] font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shrink-0"
                >
                  Import Linked SL Cost
                </button>
              </div>
            )}

            {/* Quick Single-Amount Entry (when no itemized cost rows added) */}
            {actualCostItems.length === 0 ? (
              <div className="bg-white border border-amber-200 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Actual Shipping Line Cost (Total JPY)
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Enter total actual carrier cost directly, or click <strong>Add Carrier Cost Line</strong> for USD/JPY itemized breakdown.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-bold text-slate-600">¥</span>
                  <input
                    type="number"
                    min="0"
                    value={directActualCostJpy || ''}
                    onChange={(e) => {
                      setIsDirty(true);
                      setDirectActualCostJpy(Math.max(0, parseInt(e.target.value, 10) || 0));
                    }}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm border border-amber-300 bg-amber-50/40 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {computedActualCostItems.map((ci, idx) => (
                  <div
                    key={ci.id}
                    className="bg-white border border-amber-200 rounded-lg p-2.5 grid grid-cols-12 gap-2 items-end text-xs"
                  >
                    <div className="col-span-12 sm:col-span-3">
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                        Carrier Cost Category
                      </label>
                      <input
                        type="text"
                        list={`aci-cat-${idx}`}
                        value={ci.category}
                        onChange={(e) => handleCostItemChange(idx, 'category', e.target.value)}
                        placeholder="Ocean Freight Cost"
                        className="w-full px-2 py-1.5 border border-slate-300 rounded font-semibold"
                      />
                      <datalist id={`aci-cat-${idx}`}>
                        {ACTUAL_COST_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat} />
                        ))}
                      </datalist>
                    </div>

                    <div className="col-span-12 sm:col-span-3">
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                        Description / Carrier Ref
                      </label>
                      <input
                        type="text"
                        value={ci.description}
                        onChange={(e) => handleCostItemChange(idx, 'description', e.target.value)}
                        placeholder="Carrier bill details"
                        className="w-full px-2 py-1.5 border border-slate-300 rounded"
                      />
                    </div>

                    <div className="col-span-4 sm:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                        Curr
                      </label>
                      <select
                        value={ci.currency}
                        onChange={(e) =>
                          handleCostItemChange(idx, 'currency', e.target.value as 'USD' | 'JPY' | 'EURO')
                        }
                        className="w-full px-1 py-1.5 border border-slate-300 rounded font-mono font-bold"
                      >
                        <option value="USD">USD</option>
                        <option value="JPY">JPY</option>
                        <option value="EURO">EUR</option>
                      </select>
                    </div>

                    <div className="col-span-4 sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                        Unit Cost
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={ci.unitCost}
                        onChange={(e) =>
                          handleCostItemChange(idx, 'unitCost', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1.5 border border-slate-300 rounded font-mono font-semibold"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                        Qty
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="1"
                        value={ci.quantity ?? 1}
                        onChange={(e) =>
                          handleCostItemChange(idx, 'quantity', parseFloat(e.target.value) || 1)
                        }
                        className="w-full px-1.5 py-1.5 border border-slate-300 rounded font-mono text-center"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                        Tax
                      </label>
                      <select
                        value={ci.taxRate || 0}
                        onChange={(e) =>
                          handleCostItemChange(idx, 'taxRate', parseInt(e.target.value, 10) || 0)
                        }
                        className="w-full px-1 py-1.5 border border-slate-300 rounded font-mono"
                      >
                        <option value="0">0%</option>
                        <option value="10">10%</option>
                      </select>
                    </div>

                    <div className="col-span-10 sm:col-span-1 text-right">
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                        JPY
                      </label>
                      <div className="font-mono font-bold text-slate-900 py-1.5">
                        ¥{ci.lineCostJpy.toLocaleString()}
                      </div>
                    </div>

                    <div className="col-span-2 sm:col-span-12 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveCostItem(idx)}
                        className="text-[11px] text-rose-600 hover:text-rose-800 flex items-center gap-1 font-semibold"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove Cost Line
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Live Selling vs Actual Cost vs Net Profit / Loss Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="bg-white border border-sky-200 rounded-lg p-3">
                <div className="text-[10px] font-bold uppercase text-sky-800">
                  A. Selling Price (Customer)
                </div>
                <div className="text-lg font-mono font-extrabold text-slate-900 mt-0.5 tabular-nums">
                  ¥{liveSellingJpy.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500">Synced automatically from Grand Total</div>
              </div>

              <div className="bg-white border border-amber-300 rounded-lg p-3">
                <div className="text-[10px] font-bold uppercase text-amber-800">
                  B. Actual Shipping Line Cost
                </div>
                <div className="text-lg font-mono font-extrabold text-amber-950 mt-0.5 tabular-nums">
                  ¥{resolvedActualCostJpy.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500">
                  {actualCostItems.length > 0
                    ? `${actualCostItems.length} carrier cost item(s)`
                    : resolvedActualCostJpy > 0
                    ? 'Direct carrier cost amount'
                    : 'Not entered yet'}
                </div>
              </div>

              <div
                className={`border-2 rounded-lg p-3 ${
                  liveNetProfitLossJpy >= 0
                    ? 'bg-emerald-50 border-emerald-400'
                    : 'bg-rose-50 border-rose-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-extrabold uppercase ${
                      liveNetProfitLossJpy >= 0 ? 'text-emerald-800' : 'text-rose-800'
                    }`}
                  >
                    C. Net {liveNetProfitLossJpy >= 0 ? 'Profit' : 'Loss'}
                  </span>
                  {liveNetProfitLossJpy >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-emerald-700" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-rose-700" />
                  )}
                </div>
                <div
                  className={`text-lg font-mono font-extrabold mt-0.5 tabular-nums ${
                    liveNetProfitLossJpy >= 0 ? 'text-emerald-800' : 'text-rose-700'
                  }`}
                >
                  {liveNetProfitLossJpy >= 0 ? '+' : '-'}¥{Math.abs(liveNetProfitLossJpy).toLocaleString()}
                </div>
                <div className="text-[10px] font-semibold text-slate-600">
                  Margin: {liveProfitMarginPct}% · Selling − Actual Cost
                </div>
              </div>
            </div>
          </div>
          </div>

          {/* Actions Sticky Footer */}
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
              {initialData ? 'Update Freight Invoice' : 'Save & Generate Invoice'}
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
