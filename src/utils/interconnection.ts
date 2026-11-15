import {
  BookingConfirmation,
  FreightInvoice,
  InvoiceStatus,
  Quotation,
  ShipmentCosting,
  ShippingLinePayment,
  ShippingLinePaymentStatus,
} from '../types';

export const DEFAULT_QUOTATION_TERMS: string[] = [
  'This is a provisional quotation based on the above-mentioned spot rates.',
  "USD-denominated ocean freight has been converted into JPY using an estimated exchange rate. The final exchange rate will be adjusted according to the exchange rate applied in the shipping line's invoice.",
  'Any additional or unforeseen charges, if applicable, will be charged separately.',
  'All rates are subject to reconfirmation at the time of booking.',
  'Cancellation and rollover charges will apply, wherever applicable.',
  'Payment must be made within 5 days from the ETD (Estimated Time of Departure).',
  'Late payment charges will apply if payment is not received within 5 days from the ETD.',
];

export function formatTermsListToText(terms: string[]): string {
  return terms
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, idx) => `${idx + 1}. ${line}`)
    .join('\n');
}

export function getQuotationTermsArray(quotation?: Pick<Quotation, 'termsList' | 'termsAndConditions'> | null): string[] {
  if (quotation?.termsList && quotation.termsList.length > 0) {
    return quotation.termsList.map((t) => t.trim()).filter(Boolean);
  }
  if (quotation?.termsAndConditions && quotation.termsAndConditions.trim().length > 0) {
    const lines = quotation.termsAndConditions
      .split(/\r?\n/)
      .map((line) => line.replace(/^\s*\d+\.\s*/, '').trim())
      .filter(Boolean);
    if (lines.length > 0) return lines;
  }
  return [...DEFAULT_QUOTATION_TERMS];
}

/**
 * A quotation becomes an actual confirmed business transaction ONLY when a Booking Number is assigned
 * and it is NOT REJECTED or EXPIRED.
 */
export function isQuotationConfirmedForBusiness(q: Quotation): boolean {
  const hasBookingNo = Boolean((q.bookingNo || '').trim());
  const isInactive = q.status === 'REJECTED' || q.status === 'EXPIRED';
  return hasBookingNo && !isInactive;
}

export interface DeadlineInfo {
  diffDays: number | null;
  isOverdue: boolean;
  isApproaching: boolean; // due within 0..5 days
  isUrgentRed: boolean; // overdue or approaching (and not fully paid)
  badgeLabel: string;
}

/**
 * Computes how many calendar days remain until a YYYY-MM-DD deadline.
 * Overdue (< 0 days) or Approaching (0..5 days) when unpaid => RED indicator.
 */
export function getDeadlineInfo(dueDate?: string, isPaid?: boolean): DeadlineInfo {
  if (!dueDate) {
    return {
      diffDays: null,
      isOverdue: false,
      isApproaching: false,
      isUrgentRed: false,
      badgeLabel: 'No Deadline',
    };
  }
  const parts = dueDate.split('-').map((p) => parseInt(p, 10));
  if (parts.length !== 3 || parts.some(isNaN)) {
    return {
      diffDays: null,
      isOverdue: false,
      isApproaching: false,
      isUrgentRed: false,
      badgeLabel: dueDate,
    };
  }
  const target = new Date(parts[0], parts[1] - 1, parts[2]);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (isPaid) {
    return {
      diffDays,
      isOverdue: false,
      isApproaching: false,
      isUrgentRed: false,
      badgeLabel: 'Settled',
    };
  }

  const isOverdue = diffDays < 0;
  const isApproaching = diffDays >= 0 && diffDays <= 5;
  const isUrgentRed = isOverdue || isApproaching;

  let badgeLabel = `${diffDays}d remaining`;
  if (isOverdue) {
    badgeLabel = `Overdue by ${Math.abs(diffDays)}d`;
  } else if (diffDays === 0) {
    badgeLabel = 'Due Today';
  } else if (diffDays === 1) {
    badgeLabel = 'Due Tomorrow';
  } else if (isApproaching) {
    badgeLabel = `Due in ${diffDays}d`;
  }

  return {
    diffDays,
    isOverdue,
    isApproaching,
    isUrgentRed,
    badgeLabel,
  };
}

export type CustomerPaymentDisplayStatus = 'Paid' | 'Partially Paid' | 'Pending' | 'Overdue';

export interface CustomerInvoiceFinance {
  totalJpy: number;
  receivedJpy: number;
  outstandingJpy: number;
  displayStatus: CustomerPaymentDisplayStatus;
  invoiceStatus: InvoiceStatus;
  deadlineInfo: DeadlineInfo;
}

export function computeCustomerInvoiceFinance(inv: FreightInvoice): CustomerInvoiceFinance {
  const totalJpy = Math.max(0, Math.round(inv.grandTotalJpy || 0));
  let receivedJpy =
    typeof inv.amountReceivedJpy === 'number'
      ? Math.max(0, Math.round(inv.amountReceivedJpy))
      : inv.status === 'PAID'
      ? totalJpy
      : 0;

  if (receivedJpy > totalJpy && totalJpy > 0) {
    receivedJpy = totalJpy;
  }

  const outstandingJpy = Math.max(0, totalJpy - receivedJpy);
  const isPaid = (totalJpy > 0 && outstandingJpy === 0) || (inv.status === 'PAID' && receivedJpy >= totalJpy);
  const deadlineInfo = getDeadlineInfo(inv.paymentDueDate, isPaid);

  let displayStatus: CustomerPaymentDisplayStatus = 'Pending';
  let invoiceStatus: InvoiceStatus = 'UNPAID';

  if (isPaid) {
    displayStatus = 'Paid';
    invoiceStatus = 'PAID';
  } else if (deadlineInfo.isOverdue || inv.status === 'OVERDUE') {
    displayStatus = 'Overdue';
    invoiceStatus = 'OVERDUE';
  } else if (receivedJpy > 0) {
    displayStatus = 'Partially Paid';
    invoiceStatus = 'PARTIAL';
  } else {
    displayStatus = 'Pending';
    invoiceStatus = 'UNPAID';
  }

  return {
    totalJpy,
    receivedJpy,
    outstandingJpy,
    displayStatus,
    invoiceStatus,
    deadlineInfo,
  };
}

export type ShippingPaymentDisplayStatus = 'Paid' | 'Partially Paid' | 'Pending' | 'Overdue';

export interface ShippingPaymentFinance {
  payableJpy: number;
  paidJpy: number;
  outstandingJpy: number;
  displayStatus: ShippingPaymentDisplayStatus;
  storageStatus: ShippingLinePaymentStatus;
  deadlineInfo: DeadlineInfo;
}

export function computeShippingPaymentFinance(p: ShippingLinePayment): ShippingPaymentFinance {
  const payableJpy = Math.max(0, Math.round(p.payableAmountJpy || 0));
  const paidJpy = Math.max(0, Math.min(payableJpy, Math.round(p.amountPaidJpy || 0)));
  const outstandingJpy = Math.max(0, payableJpy - paidJpy);
  const isPaid = payableJpy > 0 ? outstandingJpy === 0 : p.status === 'PAID';
  const deadlineInfo = getDeadlineInfo(p.paymentDeadline, isPaid);

  let displayStatus: ShippingPaymentDisplayStatus = 'Pending';
  let storageStatus: ShippingLinePaymentStatus = 'PENDING';

  if (isPaid) {
    displayStatus = 'Paid';
    storageStatus = 'PAID';
  } else if (deadlineInfo.isOverdue || p.status === 'OVERDUE') {
    displayStatus = 'Overdue';
    storageStatus = 'OVERDUE';
  } else if (paidJpy > 0) {
    displayStatus = 'Partially Paid';
    storageStatus = 'PARTIAL';
  } else {
    displayStatus = 'Pending';
    storageStatus = 'PENDING';
  }

  return {
    payableJpy,
    paidJpy,
    outstandingJpy,
    displayStatus,
    storageStatus,
    deadlineInfo,
  };
}

export interface OverallProfitLossSummary {
  totalRevenueJpy: number;
  totalCostJpy: number;
  totalProfitJpy: number;
  totalLossJpy: number;
  netProfitLossJpy: number;
  overallMarginPct: number;
  confirmedShipmentsCount: number;
  referenceQuotesCount: number;
  pendingCustomerJpy: number;
  collectedCustomerJpy: number;
  urgentCustomerCount: number;
  pendingShippingLineJpy: number;
  paidShippingLineJpy: number;
  urgentShippingLineCount: number;
}

/**
 * Calculates company-wide Revenue, Shipment Cost, and Profit/Loss STRICTLY from confirmed business:
 * 1) Confirmed ShipmentCosting entries (which require an assigned Booking Number).
 * 2) Actual Invoices for confirmed bookings that do not already have a ShipmentCosting entry.
 * Unconfirmed, Reference-only (no Booking Number), Rejected, or Expired quotations NEVER count toward revenue or P&L.
 */
export function computeOverallProfitLossSummary(
  quotations: Quotation[],
  costings: ShipmentCosting[],
  invoices: FreightInvoice[],
  shippingPayments: ShippingLinePayment[]
): OverallProfitLossSummary {
  let totalRevenueJpy = 0;
  let totalCostJpy = 0;
  let totalProfitJpy = 0;
  let totalLossJpy = 0;

  const confirmedCostings = costings.filter((c) => Boolean((c.bookingNo || '').trim()));
  const costedBookingSet = new Set(
    confirmedCostings.map((c) => (c.bookingNo || '').trim().toUpperCase()).filter(Boolean)
  );
  const costedInvoiceIdSet = new Set(
    confirmedCostings.map((c) => c.linkedInvoiceId).filter(Boolean) as string[]
  );

  confirmedCostings.forEach((c) => {
    const rev = Math.round(c.totalSellingJpy || 0);
    const cost = Math.round(c.totalCostJpy || 0);
    const net = rev - cost;
    totalRevenueJpy += rev;
    totalCostJpy += cost;
    if (net >= 0) {
      totalProfitJpy += net;
    } else {
      totalLossJpy += Math.abs(net);
    }
  });

  // Include confirmed invoices not yet entered in Costing so invoiced shipments still reflect accurately
  let extraConfirmedCount = 0;
  invoices.forEach((inv) => {
    const invBk = (inv.bookingNo || '').trim().toUpperCase();
    const isCovered = costedInvoiceIdSet.has(inv.id) || (invBk && costedBookingSet.has(invBk));
    if (!isCovered) {
      extraConfirmedCount += 1;
      const rev = Math.round(inv.grandTotalJpy || 0);
      const slCost = invBk
        ? shippingPayments
            .filter((s) => (s.bookingNo || '').trim().toUpperCase() === invBk)
            .reduce((sum, s) => sum + Math.round(s.payableAmountJpy || 0), 0)
        : 0;
      const net = rev - slCost;
      totalRevenueJpy += rev;
      totalCostJpy += slCost;
      if (net >= 0) {
        totalProfitJpy += net;
      } else {
        totalLossJpy += Math.abs(net);
      }
    }
  });

  const referenceQuotesCount = quotations.filter((q) => !isQuotationConfirmedForBusiness(q)).length;
  const netProfitLossJpy = totalRevenueJpy - totalCostJpy;
  const overallMarginPct =
    totalRevenueJpy > 0 ? Math.round((netProfitLossJpy / totalRevenueJpy) * 1000) / 10 : 0;

  let pendingCustomerJpy = 0;
  let collectedCustomerJpy = 0;
  let urgentCustomerCount = 0;
  invoices.forEach((inv) => {
    const fin = computeCustomerInvoiceFinance(inv);
    pendingCustomerJpy += fin.outstandingJpy;
    collectedCustomerJpy += fin.receivedJpy;
    if (fin.deadlineInfo.isUrgentRed && fin.outstandingJpy > 0) {
      urgentCustomerCount += 1;
    }
  });

  let pendingShippingLineJpy = 0;
  let paidShippingLineJpy = 0;
  let urgentShippingLineCount = 0;
  shippingPayments.forEach((p) => {
    const fin = computeShippingPaymentFinance(p);
    pendingShippingLineJpy += fin.outstandingJpy;
    paidShippingLineJpy += fin.paidJpy;
    if (fin.deadlineInfo.isUrgentRed && fin.outstandingJpy > 0) {
      urgentShippingLineCount += 1;
    }
  });

  return {
    totalRevenueJpy,
    totalCostJpy,
    totalProfitJpy,
    totalLossJpy,
    netProfitLossJpy,
    overallMarginPct,
    confirmedShipmentsCount: confirmedCostings.length + extraConfirmedCount,
    referenceQuotesCount,
    pendingCustomerJpy,
    collectedCustomerJpy,
    urgentCustomerCount,
    pendingShippingLineJpy,
    paidShippingLineJpy,
    urgentShippingLineCount,
  };
}

/**
 * Helper to find matching records across Booking, Quotation, Costing, Invoice, and ShippingLinePayment
 */
export function matchByShipmentKeys(
  recordKeys: { id?: string; bookingId?: string; bookingNo?: string; shipmentNo?: string; blNo?: string },
  targetKeys: { id?: string; bookingId?: string; bookingNo?: string; shipmentNo?: string; blNo?: string }
): boolean {
  if (recordKeys.bookingId && targetKeys.id && recordKeys.bookingId === targetKeys.id) return true;
  if (recordKeys.id && targetKeys.bookingId && recordKeys.id === targetKeys.bookingId) return true;
  const rBk = (recordKeys.bookingNo || '').trim().toUpperCase();
  const tBk = (targetKeys.bookingNo || '').trim().toUpperCase();
  if (rBk && tBk && rBk === tBk) return true;
  const rSh = (recordKeys.shipmentNo || '').trim().toUpperCase();
  const tSh = (targetKeys.shipmentNo || '').trim().toUpperCase();
  if (rSh && tSh && rSh === tSh) return true;
  const rBl = (recordKeys.blNo || '').trim().toUpperCase();
  const tBl = (targetKeys.blNo || '').trim().toUpperCase();
  if (rBl && tBl && rBl === tBl) return true;
  return false;
}

export function formatContainerSummary(booking: BookingConfirmation): string {
  const count = booking.containerCount || 1;
  const size = booking.containerSize || booking.cargoVolumeSize || "40' HC";
  const nums = booking.containerNumbers ? ` [${booking.containerNumbers}]` : '';
  return `${count} x ${size}${nums}`;
}
