import React, { useState, useMemo, useEffect } from 'react';
import {
  ShipmentCosting,
  Quotation,
  BookingConfirmation,
  FreightInvoice,
  ShippingLinePayment,
} from '../types';
import { computeOverallProfitLossSummary } from '../utils/interconnection';
import { CostingFormModal } from './CostingFormModal';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calculator,
  ArrowRight,
  Anchor,
  X,
  FileSpreadsheet,
  Info,
} from 'lucide-react';
import { exportCostingsToExcel } from '../utils/excelExport';

interface CostingManagementProps {
  costings: ShipmentCosting[];
  quotations: Quotation[];
  bookings: BookingConfirmation[];
  invoices: FreightInvoice[];
  shippingPayments: ShippingLinePayment[];
  onSaveCosting: (costing: ShipmentCosting) => void;
  onDeleteCosting: (id: string) => void;
  onConvertCostingToInvoice: (costing: ShipmentCosting) => void;
  onCreateShippingPaymentFromCosting: (costing: ShipmentCosting) => void;
  prefillQuotation?: Quotation | null;
  isModalRequestedExternally?: boolean;
  onClearExternalModal?: () => void;
}

export const CostingManagement: React.FC<CostingManagementProps> = ({
  costings,
  quotations,
  bookings,
  invoices,
  shippingPayments,
  onSaveCosting,
  onDeleteCosting,
  onConvertCostingToInvoice,
  onCreateShippingPaymentFromCosting,
  prefillQuotation,
  isModalRequestedExternally,
  onClearExternalModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCosting, setEditingCosting] = useState<ShipmentCosting | null>(null);
  const [deletingCosting, setDeletingCosting] = useState<ShipmentCosting | null>(null);

  // If jumped here with a quotation that already has a costing record, open that existing record instead of creating duplicate
  useEffect(() => {
    if (prefillQuotation && isModalRequestedExternally) {
      const cleanBk = (prefillQuotation.bookingNo || '').trim().toUpperCase();
      const existing = costings.find(
        (c) =>
          c.linkedQuotationId === prefillQuotation.id ||
          (cleanBk && (c.bookingNo || '').trim().toUpperCase() === cleanBk)
      );
      if (existing) {
        setEditingCosting(existing);
      } else {
        setEditingCosting(null);
      }
      setIsFormOpen(true);
    }
  }, [prefillQuotation, isModalRequestedExternally, costings]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && deletingCosting) {
        setDeletingCosting(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [deletingCosting]);

  const summary = useMemo(
    () => computeOverallProfitLossSummary(quotations, costings, invoices, shippingPayments),
    [quotations, costings, invoices, shippingPayments]
  );

  const filteredCostings = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return costings;
    return costings.filter(
      (c) =>
        c.costingNo.toLowerCase().includes(term) ||
        c.quotationNo.toLowerCase().includes(term) ||
        c.customerName.toLowerCase().includes(term) ||
        (c.bookingNo || '').toLowerCase().includes(term) ||
        (c.shipmentNo || '').toLowerCase().includes(term) ||
        (c.blNo || '').toLowerCase().includes(term) ||
        (c.portTo || '').toLowerCase().includes(term)
    );
  }, [costings, searchTerm]);

  const effectiveModalOpen = isFormOpen || Boolean(isModalRequestedExternally);

  const handleCloseModal = () => {
    setIsFormOpen(false);
    setEditingCosting(null);
    if (onClearExternalModal) onClearExternalModal();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Shipment Costing &amp; Profit / Loss Analysis
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Enter Quotation Number for confirmed bookings to record actual shipment expenses and compute company Profit &amp; Loss.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => exportCostingsToExcel(filteredCostings)}
            className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-lg flex items-center gap-1.5 shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export P&amp;L (.xlsx)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingCosting(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-lg flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Costing (By Quote #)</span>
          </button>
        </div>
      </div>

      {/* Business Logic Clarity Banner */}
      <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs text-sky-900">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-sky-700 shrink-0" />
          <span>
            Only <strong>Confirmed Bookings</strong> ({summary.confirmedShipmentsCount} shipments) count toward Revenue &amp; P&amp;L.{' '}
            <strong>{summary.referenceQuotesCount}</strong> unconfirmed / rejected / expired quotation(s) are strictly excluded.
          </span>
        </div>
      </div>

      {/* Profit & Loss Summary Dashboard (5 Required Metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-500">
            <span>Total Revenue</span>
            <DollarSign className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-1.5 text-xl font-mono font-bold text-slate-900 tabular-nums">
            ¥{summary.totalRevenueJpy.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Confirmed Shipments Only</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-500">
            <span>Total Shipment Cost</span>
            <Calculator className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-1.5 text-xl font-mono font-bold text-amber-800 tabular-nums">
            ¥{summary.totalCostJpy.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Actual Carrier &amp; Port Costs</div>
        </div>

        <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-emerald-700">
            <span>Total Profit</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1.5 text-xl font-mono font-bold text-emerald-700 tabular-nums">
            +¥{summary.totalProfitJpy.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-700/80 mt-1">Profitable Shipments</div>
        </div>

        <div className="bg-white border border-rose-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-rose-700">
            <span>Total Loss</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-1.5 text-xl font-mono font-bold text-rose-700 tabular-nums">
            -¥{summary.totalLossJpy.toLocaleString()}
          </div>
          <div className="text-[11px] text-rose-700/80 mt-1">Deficit Shipments</div>
        </div>

        <div
          className={`col-span-2 lg:col-span-1 rounded-xl p-4 shadow-2xs border ${
            summary.netProfitLossJpy >= 0
              ? 'bg-emerald-950 text-white border-emerald-800'
              : 'bg-rose-950 text-white border-rose-800'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
            Overall Net Profit/Loss
          </div>
          <div className="mt-1.5 text-xl font-mono font-black tabular-nums">
            {summary.netProfitLossJpy >= 0 ? '+' : '-'}¥
            {Math.abs(summary.netProfitLossJpy).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-300 mt-1 font-mono">
            Net Margin: {summary.overallMarginPct.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Main Costings Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search costing #, quotation #, booking #, shipment #, B/L #, or customer..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {filteredCostings.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No shipment costing records found. Click <strong>New Costing (By Quote #)</strong> and enter a confirmed Quotation Number.
          </div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="block md:hidden divide-y divide-slate-200">
              {filteredCostings.map((c) => {
                const net = Math.round((c.totalSellingJpy || 0) - (c.totalCostJpy || 0));
                const isProfit = net >= 0;
                return (
                  <div key={c.id} className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-amber-900 text-sm">
                          {c.costingNo}
                        </span>
                        <span className="text-[11px] font-mono text-sky-800 ml-2">
                          ({c.quotationNo})
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">{c.date}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-900">{c.customerName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      BK: {c.bookingNo} · {c.portFrom} → {c.portTo}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <div>
                        <div className="text-[10px] text-slate-500">Selling</div>
                        <div className="font-mono font-bold text-slate-900 tabular-nums">
                          ¥{Math.round(c.totalSellingJpy).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500">Actual Cost</div>
                        <div className="font-mono font-bold text-amber-800 tabular-nums">
                          ¥{Math.round(c.totalCostJpy).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500">
                          {isProfit ? 'Net Profit' : 'Net Loss'}
                        </div>
                        <div
                          className={`font-mono font-bold tabular-nums ${
                            isProfit ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {isProfit ? '+' : '-'}¥{Math.abs(net).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => onConvertCostingToInvoice(c)}
                        className="flex-1 py-1.5 text-xs font-bold text-emerald-900 bg-emerald-100 rounded-lg flex items-center justify-center gap-1"
                      >
                        <ArrowRight className="w-3.5 h-3.5" /> Invoice
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCosting(c);
                          setIsFormOpen(true);
                        }}
                        className="p-1.5 bg-slate-100 rounded-lg"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingCosting(c)}
                        className="p-1.5 bg-rose-50 text-rose-600 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200">
                    <th className="py-3 px-3 font-bold">Costing / Quote #</th>
                    <th className="py-3 px-3 font-bold">Customer &amp; Route</th>
                    <th className="py-3 px-3 font-bold">Booking / Refs</th>
                    <th className="py-3 px-3 font-bold text-right">Selling Price</th>
                    <th className="py-3 px-3 font-bold text-right">Actual Cost</th>
                    <th className="py-3 px-3 font-bold text-right">Net Profit / Loss</th>
                    <th className="py-3 px-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredCostings.map((c) => {
                    const net = Math.round((c.totalSellingJpy || 0) - (c.totalCostJpy || 0));
                    const isProfit = net >= 0;
                    const margin =
                      c.totalSellingJpy > 0
                        ? Math.round((net / c.totalSellingJpy) * 1000) / 10
                        : 0;

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-mono font-bold text-amber-900">{c.costingNo}</div>
                          <div className="text-[10px] font-mono text-sky-800">
                            QT: {c.quotationNo} · {c.date}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900">{c.customerName}</div>
                          <div className="text-[11px] text-slate-500">
                            {c.portFrom} → <span className="font-semibold text-slate-700">{c.portTo}</span> ({c.shipmentMode})
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-700">
                          <div className="font-bold text-slate-900">BK: {c.bookingNo}</div>
                          <div className="text-[10px] text-slate-500">
                            SHP: {c.shipmentNo || '—'} · BL: {c.blNo || '—'}
                          </div>
                          {c.linkedInvoiceNo && (
                            <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                              INV: {c.linkedInvoiceNo}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                          ¥{Math.round(c.totalSellingJpy).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-amber-800 tabular-nums">
                          ¥{Math.round(c.totalCostJpy).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div
                            className={`font-mono font-extrabold tabular-nums ${
                              isProfit ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {isProfit ? '+' : '-'}¥{Math.abs(net).toLocaleString()}
                          </div>
                          <div
                            className={`text-[10px] font-semibold ${
                              isProfit ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {isProfit ? 'Profit' : 'Loss'} ({margin.toFixed(1)}%)
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => onConvertCostingToInvoice(c)}
                              className="px-2 py-1 text-[11px] font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded flex items-center gap-1"
                              title="Generate Invoice from Agreed Costing Selling Price"
                            >
                              <ArrowRight className="w-3 h-3" />
                              To Invoice
                            </button>
                            <button
                              type="button"
                              onClick={() => onCreateShippingPaymentFromCosting(c)}
                              className="px-2 py-1 text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded flex items-center gap-1"
                              title="Record / Update Shipping Line Payable"
                            >
                              <Anchor className="w-3 h-3" />
                              SL Pay
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCosting(c);
                                setIsFormOpen(true);
                              }}
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                              title="Edit Shipment Costing"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingCosting(c)}
                              className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded"
                              title="Delete Shipment Costing"
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
      </div>

      {/* Costing Form Modal */}
      <CostingFormModal
        isOpen={effectiveModalOpen}
        onClose={handleCloseModal}
        onSave={onSaveCosting}
        onSwitchToExistingCosting={(existing) => {
          setEditingCosting(existing);
        }}
        initialData={editingCosting}
        prefillFromQuotation={editingCosting ? null : prefillQuotation}
        quotations={quotations}
        bookings={bookings}
        existingCostings={costings}
      />

      {/* Delete Confirmation Modal */}
      {deletingCosting && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeletingCosting(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Delete Shipment Costing?</h3>
                <p className="text-xs text-slate-500 font-mono">
                  #{deletingCosting.costingNo} · Booking #{deletingCosting.bookingNo}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Remove shipment costing for <strong>{deletingCosting.customerName}</strong> permanently?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingCosting(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteCosting(deletingCosting.id);
                  setDeletingCosting(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
