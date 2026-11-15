import React, { useState, useMemo, useEffect } from 'react';
import {
  ShippingLinePayment,
  BookingConfirmation,
  Quotation,
} from '../types';
import { computeShippingPaymentFinance } from '../utils/interconnection';
import { ShippingLinePaymentModal } from './ShippingLinePaymentModal';
import {
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Anchor,
  Edit3,
  Trash2,
  History,
  X,
  PlusCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { exportShippingLinePaymentsToExcel } from '../utils/excelExport';

interface ShippingLinePaymentManagementProps {
  payments: ShippingLinePayment[];
  bookings: BookingConfirmation[];
  quotations: Quotation[];
  shippingLines: string[];
  onSavePayment: (payment: ShippingLinePayment) => void;
  onDeletePayment: (id: string) => void;
  prefillFromBooking?: BookingConfirmation | null;
  prefillFromQuotation?: Quotation | null;
  isModalRequestedExternally?: boolean;
  onClearExternalModal?: () => void;
}

export const ShippingLinePaymentManagement: React.FC<ShippingLinePaymentManagementProps> = ({
  payments,
  bookings,
  quotations,
  shippingLines,
  onSavePayment,
  onDeletePayment,
  prefillFromBooking,
  prefillFromQuotation,
  isModalRequestedExternally,
  onClearExternalModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'PENDING' | 'URGENT_RED' | 'PAID'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<ShippingLinePayment | null>(null);
  const [historyPayment, setHistoryPayment] = useState<ShippingLinePayment | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<ShippingLinePayment | null>(null);

  useEffect(() => {
    if (!historyPayment && !deletingPayment) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (deletingPayment) {
          setDeletingPayment(null);
        } else if (historyPayment) {
          setHistoryPayment(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyPayment, deletingPayment]);

  const enrichedPayments = useMemo(() => {
    return payments
      .map((p) => ({
        payment: p,
        finance: computeShippingPaymentFinance(p),
      }))
      .sort((a, b) => {
        const aUrg = a.finance.deadlineInfo.isUrgentRed && a.finance.outstandingJpy > 0 ? 0 : 1;
        const bUrg = b.finance.deadlineInfo.isUrgentRed && b.finance.outstandingJpy > 0 ? 0 : 1;
        if (aUrg !== bUrg) return aUrg - bUrg;
        return (a.payment.paymentDeadline || '9999-12-31').localeCompare(
          b.payment.paymentDeadline || '9999-12-31'
        );
      });
  }, [payments]);

  const metrics = useMemo(() => {
    let totalPayable = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let pendingCount = 0;
    let overdueCount = 0;
    let approachingCount = 0;

    enrichedPayments.forEach(({ finance }) => {
      totalPayable += finance.payableJpy;
      totalPaid += finance.paidJpy;
      totalPending += finance.outstandingJpy;
      if (finance.outstandingJpy > 0) {
        pendingCount += 1;
        if (finance.deadlineInfo.isOverdue) overdueCount += 1;
        else if (finance.deadlineInfo.isApproaching) approachingCount += 1;
      }
    });

    return {
      totalPayable,
      totalPaid,
      totalPending,
      pendingCount,
      overdueCount,
      approachingCount,
    };
  }, [enrichedPayments]);

  const urgentDeadlines = useMemo(
    () =>
      enrichedPayments.filter(
        ({ finance }) => finance.deadlineInfo.isUrgentRed && finance.outstandingJpy > 0
      ),
    [enrichedPayments]
  );

  const filteredList = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return enrichedPayments.filter(({ payment, finance }) => {
      if (filterMode === 'PENDING' && finance.outstandingJpy <= 0) return false;
      if (
        filterMode === 'URGENT_RED' &&
        (!finance.deadlineInfo.isUrgentRed || finance.outstandingJpy <= 0)
      ) {
        return false;
      }
      if (filterMode === 'PAID' && finance.displayStatus !== 'Paid') return false;

      if (!term) return true;
      return (
        payment.shippingLineName.toLowerCase().includes(term) ||
        payment.paymentRefNo.toLowerCase().includes(term) ||
        (payment.bookingNo || '').toLowerCase().includes(term) ||
        (payment.blNo || '').toLowerCase().includes(term) ||
        (payment.shipmentNo || '').toLowerCase().includes(term) ||
        (payment.customerName || '').toLowerCase().includes(term) ||
        (payment.containerDetails || '').toLowerCase().includes(term)
      );
    });
  }, [enrichedPayments, searchTerm, filterMode]);

  const effectiveModalOpen = isModalOpen || Boolean(isModalRequestedExternally);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPayment(null);
    if (onClearExternalModal) onClearExternalModal();
  };

  const handleUpdateDeadlineInline = (p: ShippingLinePayment, newDeadline: string) => {
    const fin = computeShippingPaymentFinance({ ...p, paymentDeadline: newDeadline });
    onSavePayment({
      ...p,
      paymentDeadline: newDeadline,
      status: fin.storageStatus,
      outstandingAmountJpy: fin.outstandingJpy,
      updatedAt: new Date().toISOString(),
    });
  };

  const statusBadge = (status: 'Paid' | 'Partially Paid' | 'Pending' | 'Overdue') => {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Partially Paid':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'Overdue':
        return 'bg-rose-600 text-white border-rose-700';
      default:
        return 'bg-amber-50 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Shipping Line Payment Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track amounts payable to shipping lines, manual deadlines, payment history, and RED deadline alerts before B/L release cutoff.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => exportShippingLinePaymentsToExcel(payments)}
            className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-lg flex items-center gap-1.5 shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export (.xlsx)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingPayment(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Shipping Line Payment</span>
          </button>
        </div>
      </div>

      {/* Upcoming / Overdue Shipping Line Deadline Alert Banner (RED) */}
      {urgentDeadlines.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-500 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>
                URGENT SHIPPING LINE DEADLINES: {urgentDeadlines.length} Carrier Payment
                {urgentDeadlines.length > 1 ? 's' : ''} Must Be Paid Before Deadline
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFilterMode('URGENT_RED')}
              className="px-2.5 py-1 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700"
            >
              Filter Urgent ({urgentDeadlines.length})
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {urgentDeadlines.map(({ payment, finance }) => (
              <div
                key={payment.id}
                className="bg-white border border-rose-300 rounded-lg p-3 flex items-center justify-between gap-2 text-xs shadow-2xs"
              >
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 truncate">
                    {payment.shippingLineName}
                  </div>
                  <div className="text-[11px] font-mono text-slate-600">
                    BK: {payment.bookingNo || '—'} · BL: {payment.blNo || '—'}
                  </div>
                  <div className="text-[11px] font-bold text-rose-700 mt-0.5">
                    {finance.deadlineInfo.badgeLabel} (Due: {payment.paymentDeadline}) · Bal: ¥
                    {finance.outstandingJpy.toLocaleString()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingPayment(payment);
                    setIsModalOpen(true);
                  }}
                  className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-[11px] shrink-0"
                >
                  Pay Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shipping Line Payment Summary Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-500">
            <span>Total Carrier Payable</span>
            <Anchor className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-1.5 text-xl font-mono font-bold text-slate-900 tabular-nums">
            ¥{metrics.totalPayable.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{payments.length} Carrier Records</div>
        </div>

        <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-emerald-700">
            <span>Total Paid to Lines</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1.5 text-xl font-mono font-bold text-emerald-700 tabular-nums">
            ¥{metrics.totalPaid.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-700/80 mt-1">Settled Carrier Costs</div>
        </div>

        <div className="bg-white border border-amber-300 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-amber-800">
            <span>Total SL Payments Pending</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-1.5 text-xl font-mono font-extrabold text-amber-800 tabular-nums">
            ¥{metrics.totalPending.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-600 mt-1">
            {metrics.pendingCount} Pending Carrier Bill{metrics.pendingCount !== 1 ? 's' : ''}
          </div>
        </div>

        <div
          className={`rounded-xl p-4 shadow-2xs border ${
            metrics.overdueCount + metrics.approachingCount > 0
              ? 'bg-rose-50 border-rose-400'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-rose-800">
            <span>Red Deadline Alerts</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-1.5 text-xl font-mono font-black text-rose-700 tabular-nums">
            {metrics.overdueCount + metrics.approachingCount}
          </div>
          <div className="text-[11px] font-semibold text-rose-700 mt-1">
            {metrics.overdueCount} Overdue · {metrics.approachingCount} Approaching (≤5d)
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search shipping line, booking #, B/L #, shipment #, container..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {[
              { id: 'ALL', label: `All (${enrichedPayments.length})` },
              { id: 'PENDING', label: `Pending (${metrics.pendingCount})` },
              { id: 'URGENT_RED', label: `Urgent RED (${urgentDeadlines.length})` },
              {
                id: 'PAID',
                label: `Paid (${enrichedPayments.filter((x) => x.finance.displayStatus === 'Paid').length})`,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterMode(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  filterMode === tab.id
                    ? tab.id === 'URGENT_RED'
                      ? 'bg-rose-600 text-white'
                      : 'bg-sky-700 text-white'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200">
                <th className="py-3 px-3 font-bold">Shipping Line &amp; Ref</th>
                <th className="py-3 px-3 font-bold">Booking / B/L / Shipment</th>
                <th className="py-3 px-3 font-bold">Container Details</th>
                <th className="py-3 px-3 font-bold text-right">Payable</th>
                <th className="py-3 px-3 font-bold text-right">Paid &amp; Date</th>
                <th className="py-3 px-3 font-bold text-right">Outstanding</th>
                <th className="py-3 px-3 font-bold">Payment Deadline</th>
                <th className="py-3 px-3 font-bold">Status</th>
                <th className="py-3 px-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-500">
                    No shipping line payments match your filter.
                  </td>
                </tr>
              ) : (
                filteredList.map(({ payment, finance }) => {
                  const isRed = finance.deadlineInfo.isUrgentRed && finance.outstandingJpy > 0;
                  return (
                    <tr
                      key={payment.id}
                      className={`transition-colors ${
                        isRed ? 'bg-rose-50/70 hover:bg-rose-100/70' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{payment.shippingLineName}</div>
                        <div className="text-[10.5px] font-mono text-slate-500">
                          {payment.paymentRefNo}
                          {payment.customerName ? ` · ${payment.customerName}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px]">
                        <div className="font-bold text-sky-900">BK: {payment.bookingNo || '—'}</div>
                        <div className="text-slate-600">BL: {payment.blNo || '—'}</div>
                        {payment.shipmentNo && (
                          <div className="text-[10px] text-slate-500">SHP: {payment.shipmentNo}</div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-900 max-w-[200px]">
                          {payment.containerDetails}
                        </div>
                        {payment.portFrom && payment.portTo && (
                          <div className="text-[10px] text-slate-500">
                            {payment.portFrom} → {payment.portTo}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                        ¥{finance.payableJpy.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        <div className="font-bold text-emerald-700">
                          ¥{finance.paidJpy.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {payment.paymentDate ? `Paid: ${payment.paymentDate}` : 'Not paid yet'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-extrabold tabular-nums">
                        <span
                          className={
                            finance.outstandingJpy > 0 ? 'text-rose-700' : 'text-emerald-700'
                          }
                        >
                          ¥{finance.outstandingJpy.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="date"
                          value={payment.paymentDeadline || ''}
                          onChange={(e) => handleUpdateDeadlineInline(payment, e.target.value)}
                          className={`px-2 py-1 text-xs font-mono rounded border ${
                            isRed
                              ? 'border-rose-500 bg-rose-100 text-rose-900 font-bold'
                              : 'border-slate-300 bg-white text-slate-800'
                          }`}
                          title="Manually adjust shipping line payment deadline"
                        />
                        <div
                          className={`text-[10.5px] mt-1 font-bold ${
                            isRed ? 'text-rose-700' : 'text-slate-500'
                          }`}
                        >
                          {finance.deadlineInfo.badgeLabel}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded border ${statusBadge(
                            finance.displayStatus
                          )}`}
                        >
                          {finance.displayStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPayment(payment);
                              setIsModalOpen(true);
                            }}
                            className={`px-2 py-1 text-xs font-bold rounded flex items-center gap-1 ${
                              finance.outstandingJpy > 0
                                ? isRed
                                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                  : 'bg-sky-700 hover:bg-sky-800 text-white'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>{finance.outstandingJpy > 0 ? 'Pay' : 'Edit'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setHistoryPayment(payment)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded border border-slate-200"
                            title="Payment History"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPayment(payment);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"
                            title="Edit Record"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingPayment(payment)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit / Pay Modal */}
      <ShippingLinePaymentModal
        isOpen={effectiveModalOpen}
        onClose={handleCloseModal}
        onSave={onSavePayment}
        initialData={editingPayment}
        prefillFromBooking={prefillFromBooking}
        prefillFromQuotation={prefillFromQuotation}
        availableBookings={bookings}
        availableQuotations={quotations}
        shippingLines={shippingLines}
      />

      {/* Payment History Modal */}
      {historyPayment && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setHistoryPayment(null);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Carrier Payment History · {historyPayment.paymentRefNo}
                </h3>
                <p className="text-xs text-slate-500">{historyPayment.shippingLineName}</p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryPayment(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto text-xs">
              {(historyPayment.paymentHistory || []).length === 0 ? (
                <div className="text-slate-500 py-6 text-center">
                  No payments recorded yet for this carrier payable.
                </div>
              ) : (
                historyPayment.paymentHistory?.map((tx) => (
                  <div key={tx.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-emerald-700 font-mono">
                        ¥{tx.amountJpy.toLocaleString()}
                      </span>
                      <span className="font-mono text-slate-500">{tx.date}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1">
                      {tx.method} {tx.reference ? `· Ref: ${tx.reference}` : ''}
                    </div>
                    {tx.notes && <div className="text-[11px] text-slate-500 mt-0.5">{tx.notes}</div>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingPayment && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeletingPayment(null);
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
                <h3 className="font-bold text-slate-900 text-base">
                  Delete Shipping Line Payment?
                </h3>
                <p className="text-xs text-slate-500 font-mono">{deletingPayment.paymentRefNo}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Permanently delete carrier payable record for{' '}
              <strong>{deletingPayment.shippingLineName}</strong> (Booking:{' '}
              {deletingPayment.bookingNo || '—'})?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingPayment(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeletePayment(deletingPayment.id);
                  setDeletingPayment(null);
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
