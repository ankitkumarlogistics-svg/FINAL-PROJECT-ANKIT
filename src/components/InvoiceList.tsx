import React, { useState, useMemo, useEffect } from 'react';
import {
  BookingConfirmation,
  FreightInvoice,
  InvoiceStatus,
  Language,
  ShippingLinePayment,
} from '../types';
import { translations } from '../utils/translations';
import {
  Search,
  Plus,
  Eye,
  Edit3,
  Trash2,
  Copy,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Filter,
  Receipt,
  Download,
  Mail,
  X,
  TrendingUp,
  TrendingDown,
  Calculator,
  Lock,
} from 'lucide-react';
import {
  computeCustomerInvoiceFinance,
  computeInvoiceProfitLoss,
} from '../utils/interconnection';
import { exportInvoicesToExcel } from '../utils/excelExport';

interface InvoiceListProps {
  invoices: FreightInvoice[];
  bookings?: BookingConfirmation[];
  shippingPayments?: ShippingLinePayment[];
  language?: Language;
  onView: (invoice: FreightInvoice) => void;
  onEdit: (invoice: FreightInvoice) => void;
  onEditCosting: (invoice: FreightInvoice) => void;
  onDelete: (id: string) => void;
  onDuplicate: (invoice: FreightInvoice) => void;
  onToggleStatus: (id: string) => void;
  onDownloadPdf: (invoice: FreightInvoice) => void;
  onSendCustomer: (invoice: FreightInvoice) => void;
  onCreateNew: () => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  bookings = [],
  shippingPayments = [],
  language = 'en',
  onView,
  onEdit,
  onEditCosting,
  onDelete,
  onDuplicate,
  onToggleStatus,
  onDownloadPdf,
  onSendCustomer,
  onCreateNew,
}) => {
  const t = translations[language];
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [plFilter, setPlFilter] = useState<'ALL' | 'PROFIT' | 'LOSS' | 'COST_PENDING'>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deletingInvoice, setDeletingInvoice] = useState<FreightInvoice | null>(null);

  // Internal Overall Selling, Actual Cost & Profit/Loss KPIs across all invoices
  const plTotals = useMemo(() => {
    let totalSelling = 0;
    let totalActualCost = 0;
    let totalProfit = 0;
    let totalLoss = 0;
    let profitCount = 0;
    let lossCount = 0;
    let costedCount = 0;

    invoices.forEach((inv) => {
      const pl = computeInvoiceProfitLoss(inv, shippingPayments);
      totalSelling += pl.sellingJpy;
      totalActualCost += pl.actualCostJpy;
      if (pl.hasCostEntered) costedCount += 1;
      if (pl.netProfitLossJpy >= 0) {
        totalProfit += pl.netProfitLossJpy;
        profitCount += 1;
      } else {
        totalLoss += Math.abs(pl.netProfitLossJpy);
        lossCount += 1;
      }
    });

    const netProfitLoss = totalSelling - totalActualCost;
    const marginPct =
      totalSelling > 0 ? Math.round((netProfitLoss / totalSelling) * 1000) / 10 : 0;

    return {
      totalSelling,
      totalActualCost,
      totalProfit,
      totalLoss,
      netProfitLoss,
      marginPct,
      profitCount,
      lossCount,
      costedCount,
    };
  }, [invoices, shippingPayments]);

  // Filtered and searched records by Invoice Number, Booking Number, Customer Name, Status & P/L filter
  const filteredInvoices = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return invoices.filter((inv) => {
      // 1. Status Filter
      if (statusFilter !== 'ALL' && inv.status !== statusFilter) {
        return false;
      }

      // 1B. Internal P&L Filter
      if (plFilter !== 'ALL') {
        const pl = computeInvoiceProfitLoss(inv, shippingPayments);
        if (plFilter === 'LOSS' && !pl.isLoss) return false;
        if (plFilter === 'PROFIT' && (!pl.hasCostEntered || pl.isLoss)) return false;
        if (plFilter === 'COST_PENDING' && pl.hasCostEntered) return false;
      }

      if (!term) return true;

      // 2. Invoice Number match
      if (inv.invoiceNo.toLowerCase().includes(term)) return true;

      // 3. Customer Name match
      if (inv.customerName?.toLowerCase().includes(term)) return true;
      if (inv.customerAddress?.toLowerCase().includes(term)) return true;

      // 4. Booking Number / Shipment No / Quotation No match
      if (inv.bookingNo?.toLowerCase().includes(term)) return true;
      if (inv.shipmentNo?.toLowerCase().includes(term)) return true;
      if (inv.quotationNo?.toLowerCase().includes(term)) return true;

      // 5. B/L Number match
      if (inv.blNo?.toLowerCase().includes(term)) return true;

      // 6. Routing & Vessel match
      if (inv.portFrom?.toLowerCase().includes(term)) return true;
      if (inv.portTo?.toLowerCase().includes(term)) return true;
      if (inv.vesselVoyage?.toLowerCase().includes(term)) return true;
      if (inv.shippingCompany?.toLowerCase().includes(term)) return true;

      // 7. Check if linked booking has matching shipper/consignee
      if (bookings.length > 0 && inv.bookingNo) {
        const linkedBooking = bookings.find(
          (b) => b.bookingNumber.toLowerCase() === inv.bookingNo.toLowerCase()
        );
        if (linkedBooking) {
          if (linkedBooking.customerCompany?.toLowerCase().includes(term)) return true;
          if (linkedBooking.shipperCompany?.toLowerCase().includes(term)) return true;
          if (linkedBooking.consigneeCompany?.toLowerCase().includes(term)) return true;
        }
      }

      return false;
    });
  }, [invoices, bookings, shippingPayments, searchTerm, statusFilter, plFilter]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredInvoices.map((i) => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleExportSelected = () => {
    const listToExport =
      selectedIds.length > 0
        ? invoices.filter((i) => selectedIds.includes(i.id))
        : filteredInvoices;
    exportInvoicesToExcel(listToExport);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setPlFilter('ALL');
  };

  const statusStyles: Record<InvoiceStatus, { text: string; icon: any }> = {
    PAID: { text: 'text-emerald-700 font-semibold', icon: CheckCircle2 },
    UNPAID: { text: 'text-amber-700 font-semibold', icon: AlertCircle },
    PENDING: { text: 'text-amber-700 font-semibold', icon: AlertCircle },
    PARTIAL: { text: 'text-sky-700 font-semibold', icon: AlertCircle },
    OVERDUE: { text: 'text-rose-700 font-semibold', icon: AlertCircle },
  };

  const isFilteringActive =
    searchTerm.trim().length > 0 || statusFilter !== 'ALL' || plFilter !== 'ALL';

  return (
    <div className="space-y-4">
      {/* INTERNAL PROFIT & LOSS SUMMARY DASHBOARD (Hidden from Customer PDF) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
              <Lock className="w-3 h-3" /> Internal Accounting
            </span>
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
              Selling Price, Actual Shipping Line Cost &amp; Net Profit/Loss Summary
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Single entry linked via Booking No · Excludes provisional quotations
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-sky-50/60 border border-sky-200 rounded-xl p-3">
            <div className="text-[10.5px] font-bold uppercase text-sky-800">
              Total Selling Amount
            </div>
            <div className="mt-1 text-lg sm:text-xl font-mono font-extrabold text-slate-900 tabular-nums">
              ¥{plTotals.totalSelling.toLocaleString()}
            </div>
            <div className="text-[10.5px] text-slate-500 mt-0.5">
              Across {invoices.length} freight invoice(s)
            </div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3">
            <div className="text-[10.5px] font-bold uppercase text-amber-900">
              Actual Shipping Line Cost
            </div>
            <div className="mt-1 text-lg sm:text-xl font-mono font-extrabold text-amber-950 tabular-nums">
              ¥{plTotals.totalActualCost.toLocaleString()}
            </div>
            <div className="text-[10.5px] text-slate-600 mt-0.5">
              {plTotals.costedCount} of {invoices.length} shipments costed
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3">
            <div className="text-[10.5px] font-bold uppercase text-slate-600">
              Total Profit / Total Loss
            </div>
            <div className="mt-1 text-sm font-mono font-extrabold text-emerald-700 tabular-nums">
              +¥{plTotals.totalProfit.toLocaleString()}{' '}
              <span className="text-[10px] font-sans font-semibold text-slate-500">
                ({plTotals.profitCount})
              </span>
            </div>
            <div className="text-sm font-mono font-extrabold text-rose-700 tabular-nums">
              -¥{plTotals.totalLoss.toLocaleString()}{' '}
              <span className="text-[10px] font-sans font-semibold text-slate-500">
                ({plTotals.lossCount} loss)
              </span>
            </div>
          </div>

          <div
            className={`border-2 rounded-xl p-3 ${
              plTotals.netProfitLoss >= 0
                ? 'bg-emerald-50/80 border-emerald-400'
                : 'bg-rose-50 border-rose-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[10.5px] font-extrabold uppercase ${
                  plTotals.netProfitLoss >= 0 ? 'text-emerald-900' : 'text-rose-900'
                }`}
              >
                Overall Net {plTotals.netProfitLoss >= 0 ? 'Profit' : 'Loss'}
              </span>
              {plTotals.netProfitLoss >= 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-700" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-700" />
              )}
            </div>
            <div
              className={`mt-1 text-lg sm:text-xl font-mono font-extrabold tabular-nums ${
                plTotals.netProfitLoss >= 0 ? 'text-emerald-800' : 'text-rose-700'
              }`}
            >
              {plTotals.netProfitLoss >= 0 ? '+' : '-'}¥{Math.abs(plTotals.netProfitLoss).toLocaleString()}
            </div>
            <div className="text-[10.5px] font-semibold text-slate-600 mt-0.5">
              Net Margin: {plTotals.marginPct}%
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* Top Filter & Action Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Bar - High Visibility Input */}
            <div className="flex flex-1 flex-wrap items-center gap-2 max-w-3xl">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t.searchInvoicesPlaceholder || 'Search by invoice #, booking #, or customer name...'}
                  className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-sky-600 focus:border-sky-600 placeholder:text-slate-400 transition-all font-medium text-slate-900"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                    title={t.clearSearch || 'Clear search'}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Dropdown */}
              <div className="flex items-center gap-1.5 shrink-0">
                <Filter className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 font-semibold focus:ring-2 focus:ring-sky-600 shadow-2xs"
                >
                  <option value="ALL">{t.allStatuses}</option>
                  <option value="PENDING">PENDING</option>
                  <option value="UNPAID">UNPAID</option>
                  <option value="PAID">PAID</option>
                  <option value="PARTIAL">PARTIAL</option>
                  <option value="OVERDUE">OVERDUE</option>
                </select>
              </div>

              {/* Internal P&L Filter */}
              <select
                value={plFilter}
                onChange={(e) => setPlFilter(e.target.value as any)}
                className="text-xs bg-white border border-amber-300 rounded-lg px-2.5 py-2 text-slate-800 font-semibold focus:ring-2 focus:ring-amber-500 shadow-2xs"
              >
                <option value="ALL">All Cost &amp; P/L</option>
                <option value="PROFIT">Profitable Shipments</option>
                <option value="LOSS">Loss Shipments</option>
                <option value="COST_PENDING">Actual Cost Pending</option>
              </select>
            </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-end">
            {/* Excel download */}
            <button
              type="button"
              onClick={handleExportSelected}
              className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
              title="Download records in Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Excel ({selectedIds.length > 0 ? selectedIds.length : 'All'})
            </button>

            {/* Create New Invoice Button */}
            <button
              type="button"
              onClick={onCreateNew}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              {t.addNewInvoice}
            </button>
          </div>
        </div>

        {/* Live Filter Indicator & Results Counter */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-200/60">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              Showing <strong className="text-slate-900 font-bold">{filteredInvoices.length}</strong> of{' '}
              <strong className="text-slate-900 font-bold">{invoices.length}</strong> invoices
            </span>

            {isFilteringActive && (
              <span className="inline-flex items-center gap-1 bg-sky-100 text-sky-900 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                <span>Active Filter</span>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="hover:text-rose-700 p-0.5"
                  title="Clear all filters"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          {isFilteringActive && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-sky-700 hover:text-sky-900 font-medium text-xs hover:underline"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Invoices Display: Mobile Touch Cards (< md) & Desktop Table (>= md) */}
      {filteredInvoices.length === 0 ? (
        <div className="py-12 sm:py-16 text-center px-4">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-700">{t.noRecordsFound}</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {searchTerm
              ? `No invoices match "${searchTerm}". Check the invoice #, booking #, or customer name.`
              : 'Create your first freight invoice or convert from an existing booking confirmation.'}
          </p>
          {isFilteringActive ? (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-300 rounded-lg transition-colors"
            >
              {t.clearSearch || 'Clear search'}
            </button>
          ) : (
            <button
              type="button"
              onClick={onCreateNew}
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-xs"
            >
              {t.addNewInvoice}
            </button>
          )}
        </div>
      ) : (
        <>
          {/* 1. MOBILE TOUCH CARDS VIEW (Visible on mobile/tablet screens < 768px) */}
          <div className="block md:hidden divide-y divide-slate-200">
            {filteredInvoices.map((inv) => {
              const fin = computeCustomerInvoiceFinance(inv);
              const pl = computeInvoiceProfitLoss(inv, shippingPayments);
              const StatusIcon = (statusStyles[inv.status] || statusStyles.PENDING).icon;
              return (
                <div
                  key={inv.id}
                  className={`p-3.5 sm:p-4 transition-colors space-y-2.5 ${
                    fin.deadlineInfo.isUrgentRed && fin.outstandingJpy > 0
                      ? 'bg-rose-50/60 hover:bg-rose-50'
                      : 'bg-white hover:bg-slate-50/80'
                  }`}
                >
                  {/* Header: Invoice #, Date, Quick Toggle Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Receipt className="w-4 h-4 text-sky-700 shrink-0" />
                      <span className="font-mono font-bold text-sky-950 text-sm truncate">
                        {inv.invoiceNo}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">
                        · {inv.date}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleStatus(inv.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-transform active:scale-95 shrink-0 ${
                        fin.displayStatus === 'Paid'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                          : fin.displayStatus === 'Overdue'
                          ? 'bg-rose-600 text-white border border-rose-700'
                          : fin.displayStatus === 'Partially Paid'
                          ? 'bg-sky-100 text-sky-800 border border-sky-300'
                          : 'bg-amber-50 text-amber-800 border border-amber-300'
                      }`}
                      title="Tap to toggle Paid / Pending"
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{fin.displayStatus}</span>
                    </button>
                  </div>

                  {/* Customer & Ref */}
                  <div className="bg-slate-50/80 border border-slate-100 rounded-lg p-2.5 text-xs">
                    <div className="font-bold text-slate-900 text-sm">{inv.customerName}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap gap-x-2">
                      {inv.bookingNo && <span>Booking: <strong>{inv.bookingNo}</strong></span>}
                      {inv.shipmentNo && <span>· SHP: <strong>{inv.shipmentNo}</strong></span>}
                      {inv.blNo && <span>· B/L: <strong>{inv.blNo}</strong></span>}
                      {inv.quotationNo && <span>· QT: <strong>{inv.quotationNo}</strong></span>}
                    </div>
                  </div>

                  {/* Route & Grand Total in JPY/USD */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-sky-50/60 border border-sky-100 rounded-lg p-2">
                      <div className="text-[10px] uppercase font-semibold text-sky-800">Route</div>
                      <div className="font-bold text-sky-950 mt-0.5 truncate">
                        {inv.portFrom} → {inv.portTo}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        {inv.vesselVoyage || 'Ocean Freight'}
                      </div>
                    </div>

                    <div
                      className={`border rounded-lg p-2 ${
                        fin.deadlineInfo.isUrgentRed && fin.outstandingJpy > 0
                          ? 'bg-rose-100/70 border-rose-300'
                          : 'bg-emerald-50/60 border-emerald-100'
                      }`}
                    >
                      <div className="text-[10px] uppercase font-semibold text-slate-700">
                        Total / Bal Due
                      </div>
                      <div className="font-mono font-extrabold text-slate-900 text-sm mt-0.5 tabular-nums">
                        ¥{inv.grandTotalJpy.toLocaleString()}
                      </div>
                      <div
                        className={`text-[10px] truncate mt-0.5 font-mono font-semibold ${
                          fin.deadlineInfo.isUrgentRed && fin.outstandingJpy > 0
                            ? 'text-rose-700'
                            : 'text-slate-500'
                        }`}
                      >
                        {fin.outstandingJpy > 0
                          ? `Bal: ¥${fin.outstandingJpy.toLocaleString()} · ${fin.deadlineInfo.badgeLabel}`
                          : `Settled · ${inv.paymentDueDate || '—'}`}
                      </div>
                    </div>
                  </div>

                  {/* Internal Selling / Actual Cost / Profit & Loss Strip */}
                  <div className="grid grid-cols-3 gap-1.5 bg-amber-50/60 border border-amber-200 rounded-lg p-2 text-[10.5px]">
                    <div>
                      <div className="text-slate-500 font-semibold">Selling</div>
                      <div className="font-mono font-bold text-slate-900">
                        ¥{pl.sellingJpy.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-amber-800 font-semibold">Actual SL Cost</div>
                      <div className="font-mono font-bold text-amber-950">
                        ¥{pl.actualCostJpy.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-500 font-semibold">
                        {pl.hasCostEntered ? (pl.isProfit ? 'Profit' : 'Loss') : 'Cost Pending'}
                      </div>
                      <div
                        className={`font-mono font-extrabold ${
                          pl.isLoss ? 'text-rose-700' : 'text-emerald-700'
                        }`}
                      >
                        {pl.netProfitLossJpy >= 0 ? '+' : '-'}¥
                        {Math.abs(pl.netProfitLossJpy).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Mobile Action Bar */}
                  <div className="pt-1 flex items-center gap-1.5">
                    {/* Direct PDF Download */}
                    <button
                      type="button"
                      onClick={() => onDownloadPdf(inv)}
                      className="flex-1 py-2 px-3 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 active:scale-95 rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-transform"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </button>

                    {/* Edit Cost & P&L */}
                    <button
                      type="button"
                      onClick={() => onEditCosting(inv)}
                      className="py-2 px-2.5 text-xs font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 rounded-lg flex items-center gap-1"
                      title="Manage Actual Shipping Cost & P/L"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      <span>Cost</span>
                    </button>

                    {/* Send to Customer */}
                    <button
                      type="button"
                      onClick={() => onSendCustomer(inv)}
                      className="py-2 px-3 text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 active:scale-95 rounded-lg flex items-center justify-center gap-1 transition-transform"
                      title="Send Invoice"
                    >
                      <Mail className="w-3.5 h-3.5 text-emerald-700" />
                      <span className="hidden xs:inline">Send</span>
                    </button>

                    {/* Preview / View Invoice */}
                    <button
                      type="button"
                      onClick={() => onView(inv)}
                      className="p-2 text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-lg"
                      title="Preview Invoice"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => onEdit(inv)}
                      className="p-2 text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-lg"
                      title="Edit Invoice"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Duplicate */}
                    <button
                      type="button"
                      onClick={() => onDuplicate(inv)}
                      className="p-2 text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-lg"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => setDeletingInvoice(inv)}
                      className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 active:scale-95 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2. DESKTOP FULL TABLE VIEW (Visible on >= 768px) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/75 text-slate-700 border-b border-slate-200">
                  <th className="py-3 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.length === filteredInvoices.length &&
                        filteredInvoices.length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                  </th>
                  <th className="py-3 px-3 font-bold">{t.invoiceNo}</th>
                  <th className="py-3 px-3 font-bold">{t.customer}</th>
                  <th className="py-3 px-3 font-bold">{t.vesselVoyage}</th>
                  <th className="py-3 px-3 font-bold">B/L & Ref</th>
                  <th className="py-3 px-3 font-bold">Rate</th>
                  <th className="py-3 px-3 font-bold text-right">Selling (Inv)</th>
                  <th className="py-3 px-3 font-bold text-right bg-amber-50/70">Actual Cost &amp; P/L</th>
                  <th className="py-3 px-3 font-bold">{t.dueDate}</th>
                  <th className="py-3 px-3 font-bold">{t.paymentStatus}</th>
                  <th className="py-3 px-3 font-bold text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredInvoices.map((inv) => {
                  const fin = computeCustomerInvoiceFinance(inv);
                  const pl = computeInvoiceProfitLoss(inv, shippingPayments);
                  const StatusIcon = (statusStyles[inv.status] || statusStyles.PENDING).icon;
                  return (
                    <tr
                      key={inv.id}
                      className={`transition-colors group text-slate-800 ${
                        fin.deadlineInfo.isUrgentRed && fin.outstandingJpy > 0
                          ? 'bg-rose-50/60 hover:bg-rose-50'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-3 px-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(inv.id)}
                          onChange={() => handleSelectOne(inv.id)}
                          className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                      </td>

                      {/* Invoice Number */}
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-sky-900 flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                          {inv.invoiceNo}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{inv.date}</div>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{inv.customerName}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[170px]">
                          {inv.customerAddress}
                        </div>
                      </td>

                      {/* Routing & Vessel */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-900">
                          {inv.portFrom} → <span className="font-bold text-sky-900">{inv.portTo}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                          {inv.vesselVoyage}
                        </div>
                      </td>

                      {/* B/L & Booking Ref */}
                      <td className="py-3 px-3 font-mono text-[11px]">
                        <div>BL: {inv.blNo || '—'}</div>
                        <div className="text-slate-500">BK: {inv.bookingNo || '—'}</div>
                        {inv.shipmentNo && <div className="text-slate-500">SHP: {inv.shipmentNo}</div>}
                        {inv.quotationNo && <div className="text-indigo-700 font-semibold">QT: {inv.quotationNo}</div>}
                      </td>

                      {/* Rate & Containers */}
                      <td className="py-3 px-3 text-[11px]">
                        <div className="font-mono text-slate-700">¥{inv.exchangeRate}/$</div>
                        <div className="mt-0.5">
                          {inv.containerCount && inv.containerCount > 1 ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold text-sky-800 bg-sky-100 rounded border border-sky-300 shadow-2xs">
                              {inv.containerCount} Containers {inv.containerSize ? `(${inv.containerSize})` : ''}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-medium">
                              1 Container {inv.containerSize ? `(${inv.containerSize})` : ''}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Grand Total & Outstanding Balance */}
                      <td className="py-3 px-3 text-right">
                        <div className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                          ¥{inv.grandTotalJpy.toLocaleString()}
                        </div>
                        {fin.outstandingJpy > 0 ? (
                          <div className="text-[10.5px] font-mono font-bold text-rose-700">
                            Bal: ¥{fin.outstandingJpy.toLocaleString()}
                          </div>
                        ) : (
                          <div className="text-[10.5px] font-mono font-semibold text-emerald-700">
                            Paid in Full
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400">
                          {inv.items.length} line items
                        </div>
                      </td>

                      {/* Internal Actual Shipping Line Cost & Profit/Loss */}
                      <td className="py-3 px-3 text-right bg-amber-50/30">
                        {pl.hasCostEntered ? (
                          <div className="space-y-0.5">
                            <div className="text-[10.5px] font-mono text-amber-900 font-semibold">
                              Cost: ¥{pl.actualCostJpy.toLocaleString()}
                            </div>
                            <div
                              className={`font-mono font-extrabold text-xs tabular-nums ${
                                pl.isLoss ? 'text-rose-700' : 'text-emerald-700'
                              }`}
                            >
                              {pl.netProfitLossJpy >= 0 ? '+' : '-'}¥
                              {Math.abs(pl.netProfitLossJpy).toLocaleString()}
                            </div>
                            <div className="flex items-center justify-end gap-1">
                              <span
                                className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded ${
                                  pl.isLoss
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {pl.isLoss ? 'LOSS' : 'PROFIT'} {pl.marginPct}%
                              </span>
                              <button
                                type="button"
                                onClick={() => onEditCosting(inv)}
                                className="text-[9.5px] font-bold text-amber-800 hover:underline"
                                title="Edit Actual Shipping Line Cost"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onEditCosting(inv)}
                            className="px-2 py-1 text-[10.5px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded inline-flex items-center gap-1"
                            title="Enter Actual Shipping Line Cost for this Shipment"
                          >
                            <Calculator className="w-3 h-3" />
                            + Actual Cost
                          </button>
                        )}
                      </td>

                      {/* Due Date with RED Deadline Alert */}
                      <td className="py-3 px-3 font-mono text-xs">
                        <div
                          className={
                            fin.deadlineInfo.isUrgentRed && fin.outstandingJpy > 0
                              ? 'text-rose-700 font-extrabold'
                              : 'text-slate-700'
                          }
                        >
                          {inv.paymentDueDate || '—'}
                        </div>
                        {fin.outstandingJpy > 0 && (
                          <span
                            className={`inline-block mt-0.5 text-[10px] font-sans font-bold px-1.5 py-0.5 rounded ${
                              fin.deadlineInfo.isUrgentRed
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {fin.deadlineInfo.badgeLabel}
                          </span>
                        )}
                      </td>

                      {/* Status with Toggle Button */}
                      <td className="py-3 px-3 text-xs">
                        <button
                          type="button"
                          onClick={() => onToggleStatus(inv.id)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors ${
                            fin.displayStatus === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : fin.displayStatus === 'Overdue'
                              ? 'bg-rose-600 text-white hover:bg-rose-700'
                              : fin.displayStatus === 'Partially Paid'
                              ? 'bg-sky-100 text-sky-800 hover:bg-sky-200'
                              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                          }`}
                          title="Click to toggle Paid/Pending"
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          <span className="font-semibold">{fin.displayStatus}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Direct PDF Download */}
                          <button
                            type="button"
                            onClick={() => onDownloadPdf(inv)}
                            className="px-2.5 py-1 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded flex items-center gap-1 shadow-xs transition-colors"
                            title="Download PDF to send to customer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            PDF
                          </button>

                          {/* Send to Customer */}
                          <button
                            type="button"
                            onClick={() => onSendCustomer(inv)}
                            className="px-2 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded flex items-center gap-1 transition-colors"
                            title="Send invoice to customer via email or message"
                          >
                            <Mail className="w-3.5 h-3.5 text-emerald-600" />
                            Send
                          </button>

                          {/* View & Preview */}
                          <button
                            type="button"
                            onClick={() => onView(inv)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                            title="Preview Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => onEdit(inv)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                            title="Edit Invoice"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Duplicate */}
                          <button
                            type="button"
                            onClick={() => onDuplicate(inv)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                            title="Duplicate Invoice"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setDeletingInvoice(inv)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Table Footer info */}
      <div className="px-4 py-2.5 sm:py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-1.5">
        <div>
          Showing {filteredInvoices.length} of {invoices.length} invoices
        </div>
        <div className="text-[11px] text-slate-400">
          Touch status badge to toggle Paid / Unpaid
        </div>
      </div>

      {/* In-App Delete Confirmation Modal (iFrame safe, never blocked by browser) */}
      {deletingInvoice && (
        <DeleteInvoiceModalBackdrop
          onClose={() => setDeletingInvoice(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Delete Freight Invoice?</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">#{deletingInvoice.invoiceNo}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete invoice <strong className="text-slate-800">#{deletingInvoice.invoiceNo}</strong> for <strong className="text-slate-800">{deletingInvoice.customerName}</strong>? This action will permanently remove the record from Cloud Firestore and local storage.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingInvoice(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(deletingInvoice.id);
                  setDeletingInvoice(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </DeleteInvoiceModalBackdrop>
      )}
      </div>
    </div>
  );
};

const DeleteInvoiceModalBackdrop: React.FC<{
  onClose: () => void;
  children: React.ReactNode;
}> = ({ onClose, children }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </div>
  );
};
