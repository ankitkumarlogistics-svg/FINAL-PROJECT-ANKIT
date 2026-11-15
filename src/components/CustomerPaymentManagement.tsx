import React, { useState, useMemo, useEffect } from 'react';
import { FreightInvoice, PaymentTransaction } from '../types';
import { computeCustomerInvoiceFinance } from '../utils/interconnection';
import {
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  PlusCircle,
  History,
  Calendar,
  X,
  Receipt,
} from 'lucide-react';

interface CustomerPaymentManagementProps {
  invoices: FreightInvoice[];
  onSaveInvoice: (invoice: FreightInvoice) => void;
  onViewInvoiceDocument: (invoice: FreightInvoice) => void;
}

export const CustomerPaymentManagement: React.FC<CustomerPaymentManagementProps> = ({
  invoices,
  onSaveInvoice,
  onViewInvoiceDocument,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewFilter, setViewFilter] = useState<'ALL' | 'PENDING_ONLY' | 'URGENT_RED' | 'PAID'>('ALL');
  const [recordingInvoice, setRecordingInvoice] = useState<FreightInvoice | null>(null);
  const [historyInvoice, setHistoryInvoice] = useState<FreightInvoice | null>(null);

  // Payment modal fields
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [payMethod, setPayMethod] = useState<string>('Bank Transfer (SMBC)');
  const [payRef, setPayRef] = useState<string>('');
  const [payNotes, setPayNotes] = useState<string>('');
  const [manualDueDate, setManualDueDate] = useState<string>('');

  useEffect(() => {
    if (!recordingInvoice && !historyInvoice) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (historyInvoice) {
          setHistoryInvoice(null);
        } else if (recordingInvoice) {
          setRecordingInvoice(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recordingInvoice, historyInvoice]);

  const enrichedInvoices = useMemo(() => {
    return invoices
      .map((inv) => ({
        invoice: inv,
        finance: computeCustomerInvoiceFinance(inv),
      }))
      .sort((a, b) => {
        // Urgent unpaid red deadlines first, then earliest due date
        const aUrgent = a.finance.deadlineInfo.isUrgentRed && a.finance.outstandingJpy > 0 ? 0 : 1;
        const bUrgent = b.finance.deadlineInfo.isUrgentRed && b.finance.outstandingJpy > 0 ? 0 : 1;
        if (aUrgent !== bUrgent) return aUrgent - bUrgent;
        return (a.invoice.paymentDueDate || '9999-12-31').localeCompare(
          b.invoice.paymentDueDate || '9999-12-31'
        );
      });
  }, [invoices]);

  const metrics = useMemo(() => {
    let totalInvoiced = 0;
    let totalReceived = 0;
    let totalOutstanding = 0;
    let overdueCount = 0;
    let approachingCount = 0;
    let pendingCount = 0;

    enrichedInvoices.forEach(({ finance }) => {
      totalInvoiced += finance.totalJpy;
      totalReceived += finance.receivedJpy;
      totalOutstanding += finance.outstandingJpy;
      if (finance.outstandingJpy > 0) {
        pendingCount += 1;
        if (finance.deadlineInfo.isOverdue) overdueCount += 1;
        else if (finance.deadlineInfo.isApproaching) approachingCount += 1;
      }
    });

    return {
      totalInvoiced,
      totalReceived,
      totalOutstanding,
      overdueCount,
      approachingCount,
      pendingCount,
    };
  }, [enrichedInvoices]);

  const filteredList = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return enrichedInvoices.filter(({ invoice, finance }) => {
      if (viewFilter === 'PENDING_ONLY' && finance.outstandingJpy <= 0) return false;
      if (viewFilter === 'URGENT_RED' && (!finance.deadlineInfo.isUrgentRed || finance.outstandingJpy <= 0)) {
        return false;
      }
      if (viewFilter === 'PAID' && finance.displayStatus !== 'Paid') return false;

      if (!term) return true;
      return (
        invoice.invoiceNo.toLowerCase().includes(term) ||
        invoice.customerName.toLowerCase().includes(term) ||
        (invoice.bookingNo || '').toLowerCase().includes(term) ||
        (invoice.shipmentNo || '').toLowerCase().includes(term) ||
        (invoice.blNo || '').toLowerCase().includes(term)
      );
    });
  }, [enrichedInvoices, searchTerm, viewFilter]);

  const urgentItems = useMemo(
    () =>
      enrichedInvoices.filter(
        ({ finance }) => finance.deadlineInfo.isUrgentRed && finance.outstandingJpy > 0
      ),
    [enrichedInvoices]
  );

  const openPaymentModal = (inv: FreightInvoice) => {
    const fin = computeCustomerInvoiceFinance(inv);
    setRecordingInvoice(inv);
    setPayAmount(fin.outstandingJpy);
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayMethod('Bank Transfer (SMBC)');
    setPayRef('');
    setPayNotes('');
    setManualDueDate(inv.paymentDueDate || '');
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordingInvoice) return;
    const prevFin = computeCustomerInvoiceFinance(recordingInvoice);
    const addAmount = Math.max(0, Math.round(Number(payAmount) || 0));
    const newReceived = Math.min(prevFin.totalJpy, prevFin.receivedJpy + addAmount);
    const newOutstanding = Math.max(0, prevFin.totalJpy - newReceived);

    const newTx: PaymentTransaction | null =
      addAmount > 0
        ? {
            id: `cpay-${Date.now()}`,
            date: payDate,
            amountJpy: addAmount,
            method: payMethod,
            reference: payRef.trim() || undefined,
            notes: payNotes.trim() || undefined,
          }
        : null;

    const updatedHistory = newTx
      ? [...(recordingInvoice.paymentHistory || []), newTx]
      : recordingInvoice.paymentHistory || [];

    const draftUpdated: FreightInvoice = {
      ...recordingInvoice,
      paymentDueDate: manualDueDate || recordingInvoice.paymentDueDate,
      amountReceivedJpy: newReceived,
      outstandingBalanceJpy: newOutstanding,
      lastPaymentDate: addAmount > 0 ? payDate : recordingInvoice.lastPaymentDate,
      paymentHistory: updatedHistory,
      updatedAt: new Date().toISOString(),
    };

    const nextFin = computeCustomerInvoiceFinance(draftUpdated);
    draftUpdated.status = nextFin.invoiceStatus;

    onSaveInvoice(draftUpdated);
    setRecordingInvoice(null);
  };

  const handleUpdateDueDateOnly = (inv: FreightInvoice, newDue: string) => {
    const fin = computeCustomerInvoiceFinance({ ...inv, paymentDueDate: newDue });
    onSaveInvoice({
      ...inv,
      paymentDueDate: newDue,
      status: fin.invoiceStatus,
      amountReceivedJpy: fin.receivedJpy,
      outstandingBalanceJpy: fin.outstandingJpy,
      updatedAt: new Date().toISOString(),
    });
  };

  const statusBadgeClasses = (status: 'Paid' | 'Partially Paid' | 'Pending' | 'Overdue') => {
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Customer Payment &amp; Deadline Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track invoiced amounts, record customer receipts, auto-calculate outstanding balances, and monitor RED deadline alerts.
          </p>
        </div>
      </div>

      {/* RED Urgent Deadlines Alert Banner */}
      {urgentItems.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-400 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>
                Action Required: {urgentItems.length} Customer Payment
                {urgentItems.length > 1 ? 's' : ''} Overdue or Approaching Deadline
              </span>
            </div>
            <button
              type="button"
              onClick={() => setViewFilter('URGENT_RED')}
              className="px-2.5 py-1 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700"
            >
              Show Urgent Only
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {urgentItems.slice(0, 6).map(({ invoice, finance }) => (
              <div
                key={invoice.id}
                className="bg-white border border-rose-300 rounded-lg p-2.5 flex items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-bold text-rose-900 truncate">
                    {invoice.customerName}
                  </div>
                  <div className="text-[11px] font-mono text-slate-600">
                    {invoice.invoiceNo} · Due: <strong className="text-rose-700">{invoice.paymentDueDate}</strong>
                  </div>
                  <div className="text-[10px] font-bold text-rose-700 uppercase">
                    {finance.deadlineInfo.badgeLabel} · Bal: ¥{finance.outstandingJpy.toLocaleString()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openPaymentModal(invoice)}
                  className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-[11px] shrink-0"
                >
                  Collect
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-500">
            <span>Total Invoice Amount</span>
            <DollarSign className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-1.5 text-xl font-mono font-bold text-slate-900 tabular-nums">
            ¥{metrics.totalInvoiced.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{invoices.length} Total Invoices</div>
        </div>

        <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-emerald-700">
            <span>Amount Received</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1.5 text-xl font-mono font-bold text-emerald-700 tabular-nums">
            ¥{metrics.totalReceived.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-700/80 mt-1">Collected Payments</div>
        </div>

        <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-amber-800">
            <span>Pending Customer Balance</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-1.5 text-xl font-mono font-bold text-amber-800 tabular-nums">
            ¥{metrics.totalOutstanding.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {metrics.pendingCount} Pending Invoice{metrics.pendingCount !== 1 ? 's' : ''}
          </div>
        </div>

        <div
          className={`rounded-xl p-4 shadow-2xs border ${
            metrics.overdueCount + metrics.approachingCount > 0
              ? 'bg-rose-50 border-rose-300'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-rose-800">
            <span>Deadline Alerts (RED)</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-1.5 text-xl font-mono font-black text-rose-700 tabular-nums">
            {metrics.overdueCount + metrics.approachingCount}
          </div>
          <div className="text-[11px] text-rose-700 font-semibold mt-1">
            {metrics.overdueCount} Overdue · {metrics.approachingCount} Due Soon (≤5d)
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customer, invoice #, booking #, shipment #, or B/L #..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {[
              { id: 'ALL', label: `All (${enrichedInvoices.length})` },
              { id: 'PENDING_ONLY', label: `Pending (${metrics.pendingCount})` },
              {
                id: 'URGENT_RED',
                label: `Overdue / Due Soon (${urgentItems.length})`,
              },
              {
                id: 'PAID',
                label: `Paid (${enrichedInvoices.filter((x) => x.finance.displayStatus === 'Paid').length})`,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setViewFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  viewFilter === tab.id
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200">
                <th className="py-3 px-3 font-bold">Invoice &amp; Shipment Refs</th>
                <th className="py-3 px-3 font-bold">Customer</th>
                <th className="py-3 px-3 font-bold text-right">Invoice Amount</th>
                <th className="py-3 px-3 font-bold text-right">Amount Received</th>
                <th className="py-3 px-3 font-bold text-right">Outstanding Bal.</th>
                <th className="py-3 px-3 font-bold">Payment Deadline</th>
                <th className="py-3 px-3 font-bold">Status</th>
                <th className="py-3 px-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    No customer payment records match your filter.
                  </td>
                </tr>
              ) : (
                filteredList.map(({ invoice, finance }) => {
                  const isRed = finance.deadlineInfo.isUrgentRed && finance.outstandingJpy > 0;
                  return (
                    <tr
                      key={invoice.id}
                      className={`transition-colors ${
                        isRed ? 'bg-rose-50/70 hover:bg-rose-100/70' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-sky-900 flex items-center gap-1">
                          <Receipt className="w-3.5 h-3.5 text-sky-600" />
                          <span>{invoice.invoiceNo}</span>
                        </div>
                        <div className="text-[10.5px] font-mono text-slate-500 mt-0.5">
                          BK: {invoice.bookingNo || '—'} · BL: {invoice.blNo || '—'}
                        </div>
                        {invoice.shipmentNo && (
                          <div className="text-[10px] font-mono text-slate-500">
                            SHP: {invoice.shipmentNo}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{invoice.customerName}</div>
                        <div className="text-[10.5px] text-slate-500">
                          {invoice.portFrom} → {invoice.portTo}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                        ¥{finance.totalJpy.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 tabular-nums">
                        ¥{finance.receivedJpy.toLocaleString()}
                        {invoice.lastPaymentDate && (
                          <div className="text-[10px] font-normal text-slate-500">
                            Last: {invoice.lastPaymentDate}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-extrabold tabular-nums">
                        <span className={finance.outstandingJpy > 0 ? 'text-rose-700' : 'text-emerald-700'}>
                          ¥{finance.outstandingJpy.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="date"
                            value={invoice.paymentDueDate || ''}
                            onChange={(e) => handleUpdateDueDateOnly(invoice, e.target.value)}
                            className={`px-2 py-1 text-xs font-mono rounded border ${
                              isRed
                                ? 'border-rose-500 bg-rose-100 text-rose-900 font-bold'
                                : 'border-slate-300 bg-white text-slate-800'
                            }`}
                            title="Manually edit customer payment deadline"
                          />
                        </div>
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
                          className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded border ${statusBadgeClasses(
                            finance.displayStatus
                          )}`}
                        >
                          {finance.displayStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openPaymentModal(invoice)}
                            className={`px-2.5 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1 ${
                              finance.outstandingJpy > 0
                                ? isRed
                                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                  : 'bg-sky-700 hover:bg-sky-800 text-white'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>{finance.outstandingJpy > 0 ? 'Record Payment' : 'Update'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setHistoryInvoice(invoice)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200"
                            title="Payment History"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onViewInvoiceDocument(invoice)}
                            className="px-2 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg"
                          >
                            Invoice
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

      {/* Record Payment Modal */}
      {recordingInvoice && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setRecordingInvoice(null);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Record Customer Payment</h3>
                <p className="text-[11px] text-slate-300 font-mono">
                  {recordingInvoice.invoiceNo} · {recordingInvoice.customerName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRecordingInvoice(null)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="p-5 space-y-4 text-xs">
              {(() => {
                const fin = computeCustomerInvoiceFinance(recordingInvoice);
                const projectedReceived = Math.min(
                  fin.totalJpy,
                  fin.receivedJpy + Math.max(0, Math.round(Number(payAmount) || 0))
                );
                const projectedBal = Math.max(0, fin.totalJpy - projectedReceived);
                return (
                  <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Invoice Total</div>
                      <div className="font-mono font-bold text-slate-900">
                        ¥{fin.totalJpy.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Already Paid</div>
                      <div className="font-mono font-bold text-emerald-700">
                        ¥{fin.receivedJpy.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">After This Pay</div>
                      <div className="font-mono font-extrabold text-rose-700">
                        ¥{projectedBal.toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Amount Received Now (JPY)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={payAmount}
                    onChange={(e) => setPayAmount(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 text-sm border border-sky-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Receipt Date
                  </label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-rose-600" />
                  <span>Payment Due Date / Deadline</span>
                </label>
                <input
                  type="date"
                  value={manualDueDate}
                  onChange={(e) => setManualDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Payment Method
                  </label>
                  <input
                    type="text"
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Bank / Slip Ref
                  </label>
                  <input
                    type="text"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    placeholder="Optional ref #"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Notes</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Optional payment note"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setRecordingInvoice(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                >
                  Save Payment &amp; Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {historyInvoice && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setHistoryInvoice(null);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Payment History · #{historyInvoice.invoiceNo}
                </h3>
                <p className="text-xs text-slate-500">{historyInvoice.customerName}</p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryInvoice(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto text-xs">
              {(historyInvoice.paymentHistory || []).length === 0 ? (
                <div className="text-slate-500 py-6 text-center">
                  No payments recorded yet for this invoice.
                </div>
              ) : (
                historyInvoice.paymentHistory?.map((tx) => (
                  <div key={tx.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-emerald-700 font-mono">
                        +¥{tx.amountJpy.toLocaleString()}
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
    </div>
  );
};
