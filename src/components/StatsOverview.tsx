import React from 'react';
import {
  BookingConfirmation,
  FreightInvoice,
  Quotation,
  ShippingLinePayment,
} from '../types';
import { computeOverallProfitLossSummary } from '../utils/interconnection';
import {
  FileText,
  Receipt,
  TrendingUp,
  TrendingDown,
  Clock,
  Anchor,
  Calculator,
  AlertTriangle,
} from 'lucide-react';

interface StatsOverviewProps {
  bookings: BookingConfirmation[];
  invoices: FreightInvoice[];
  quotations?: Quotation[];
  shippingPayments?: ShippingLinePayment[];
  onSelectBookingsTab: () => void;
  onSelectQuotationsTab?: () => void;
  onSelectInvoicesTab: () => void;
  onSelectCustomerPaymentsTab?: () => void;
  onSelectShippingPaymentsTab?: () => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  bookings,
  invoices,
  quotations = [],
  shippingPayments = [],
  onSelectBookingsTab,
  onSelectQuotationsTab,
  onSelectInvoicesTab,
  onSelectCustomerPaymentsTab,
  onSelectShippingPaymentsTab,
}) => {
  const pl = computeOverallProfitLossSummary(quotations, invoices, shippingPayments);
  const activeBookingsCount = bookings.filter((b) => b.status === 'CONFIRMED').length;

  return (
    <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
      {/* Row 1: Financial Profitability Summary (Selling Amount, Actual Shipping Line Cost, Net Profit/Loss, Operations) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Total Selling / Revenue */}
        <div
          onClick={onSelectInvoicesTab}
          className="cursor-pointer bg-white border border-slate-200 rounded-xl p-3 sm:p-4 hover:border-sky-300 transition-all shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              Total Selling (Invoices)
            </span>
            <div className="p-1.5 bg-sky-50 text-sky-700 rounded-lg shrink-0">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1.5 text-lg sm:text-2xl font-bold font-mono text-slate-900 tabular-nums truncate">
            ¥{pl.totalRevenueJpy.toLocaleString()}
          </div>
          <div className="mt-1 text-[10.5px] text-slate-500 flex items-center justify-between">
            <span>{pl.confirmedShipmentsCount} invoices · {pl.referenceQuotesCount} quotes excl.</span>
          </div>
        </div>

        {/* Card 2: Total Actual Shipping Line Cost */}
        <div
          onClick={onSelectInvoicesTab}
          className="cursor-pointer bg-white border border-slate-200 rounded-xl p-3 sm:p-4 hover:border-amber-300 transition-all shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              Actual Shipping Cost
            </span>
            <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg shrink-0">
              <Calculator className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1.5 text-lg sm:text-2xl font-bold font-mono text-slate-900 tabular-nums truncate">
            ¥{pl.totalCostJpy.toLocaleString()}
          </div>
          <div className="mt-1 text-[10.5px] text-slate-500 flex items-center justify-between">
            <span>{pl.costEnteredCount} costed · SL Paid: ¥{pl.paidShippingLineJpy.toLocaleString()}</span>
          </div>
        </div>

        {/* Card 3: Overall Net Profit / Loss */}
        <div
          onClick={onSelectInvoicesTab}
          className={`cursor-pointer border rounded-xl p-3 sm:p-4 transition-all shadow-xs ${
            pl.netProfitLossJpy >= 0
              ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300'
              : 'bg-rose-50/60 border-rose-300 hover:border-rose-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider truncate ${
                pl.netProfitLossJpy >= 0 ? 'text-emerald-800' : 'text-rose-800'
              }`}
            >
              Overall Net {pl.netProfitLossJpy >= 0 ? 'Profit' : 'Loss'}
            </span>
            <div
              className={`p-1.5 rounded-lg shrink-0 ${
                pl.netProfitLossJpy >= 0
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {pl.netProfitLossJpy >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
            </div>
          </div>
          <div
            className={`mt-1.5 text-lg sm:text-2xl font-extrabold font-mono tabular-nums truncate ${
              pl.netProfitLossJpy >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {pl.netProfitLossJpy >= 0 ? '+' : '-'}¥{Math.abs(pl.netProfitLossJpy).toLocaleString()}
          </div>
          <div className="mt-1 text-[10px] font-medium flex items-center justify-between text-slate-600">
            <span>Margin: {pl.overallMarginPct}%</span>
            <span>
              +¥{pl.totalProfitJpy.toLocaleString()} / -¥{pl.totalLossJpy.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Card 4: Bookings & Quotations */}
        <div
          onClick={onSelectBookingsTab}
          className="cursor-pointer bg-white border border-slate-200 rounded-xl p-3 sm:p-4 hover:border-sky-300 transition-all shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              Bookings &amp; Quotes
            </span>
            <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg shrink-0">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-lg sm:text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {bookings.length}
            </span>
            <span className="text-[11px] text-sky-700 font-semibold">
              ({activeBookingsCount} active)
            </span>
          </div>
          <div className="mt-1 text-[10.5px] text-slate-500 flex items-center justify-between">
            <span>{quotations.length} quotations</span>
            <span>{invoices.length} invoices</span>
          </div>
        </div>
      </div>

      {/* Row 2: Pending Payments & Deadline Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-4">
        {/* Pending Customer Payments */}
        <div
          onClick={onSelectCustomerPaymentsTab || onSelectInvoicesTab}
          className={`cursor-pointer border rounded-xl p-3.5 sm:p-4 transition-all shadow-xs flex items-center justify-between gap-3 ${
            pl.urgentCustomerCount > 0
              ? 'bg-rose-50/70 border-rose-300 hover:border-rose-400'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Pending Customer Payments
              </span>
              {pl.urgentCustomerCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold">
                  <AlertTriangle className="w-3 h-3" />
                  {pl.urgentCustomerCount} Due Soon / Overdue
                </span>
              )}
            </div>
            <div className="mt-1 text-xl font-extrabold font-mono text-slate-900 tabular-nums">
              ¥{pl.pendingCustomerJpy.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Click to track customer receivables &amp; due date deadlines
            </div>
          </div>
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              pl.urgentCustomerCount > 0
                ? 'bg-rose-100 text-rose-700'
                : 'bg-amber-50 text-amber-700'
            }`}
          >
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Shipping Line Payments */}
        <div
          onClick={onSelectShippingPaymentsTab}
          className={`cursor-pointer border rounded-xl p-3.5 sm:p-4 transition-all shadow-xs flex items-center justify-between gap-3 ${
            pl.urgentShippingLineCount > 0
              ? 'bg-rose-50/70 border-rose-300 hover:border-rose-400'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Pending Shipping Line Payments
              </span>
              {pl.urgentShippingLineCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold">
                  <AlertTriangle className="w-3 h-3" />
                  {pl.urgentShippingLineCount} Urgent Deadline
                </span>
              )}
            </div>
            <div className="mt-1 text-xl font-extrabold font-mono text-slate-900 tabular-nums">
              ¥{pl.pendingShippingLineJpy.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Payable to carriers · Highlighted RED before deadlines expire
            </div>
          </div>
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              pl.urgentShippingLineCount > 0
                ? 'bg-rose-100 text-rose-700'
                : 'bg-sky-50 text-sky-700'
            }`}
          >
            <Anchor className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};
