import React, { useState, useMemo, useEffect } from 'react';
import {
  Quotation,
  QuotationStatus,
  BookingConfirmation,
  Customer,
} from '../types';
import { isQuotationConfirmedForBusiness } from '../utils/interconnection';
import { QuotationFormModal } from './QuotationFormModal';
import {
  Plus,
  Search,
  Download,
  Eye,
  Edit3,
  Trash2,
  Calculator,
  ArrowRight,
  History,
  X,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Hash,
} from 'lucide-react';
import { exportQuotationsToExcel } from '../utils/excelExport';

interface QuotationManagementProps {
  quotations: Quotation[];
  bookings: BookingConfirmation[];
  customers: Customer[];
  onSaveQuotation: (quotation: Quotation) => void;
  onDeleteQuotation: (id: string) => void;
  onViewQuotation: (quotation: Quotation) => void;
  onDownloadQuotationPdf: (quotation: Quotation) => void;
  onConvertQuotationToInvoice: (quotation: Quotation) => void;
  onCreateCostingFromQuotation: (quotation: Quotation) => void;
  prefillBooking?: BookingConfirmation | null;
  isModalRequestedExternally?: boolean;
  externalEditingQuotation?: Quotation | null;
  onClearExternalModal?: () => void;
}

export const QuotationManagement: React.FC<QuotationManagementProps> = ({
  quotations,
  bookings,
  customers,
  onSaveQuotation,
  onDeleteQuotation,
  onViewQuotation,
  onDownloadQuotationPdf,
  onConvertQuotationToInvoice,
  onCreateCostingFromQuotation,
  prefillBooking,
  isModalRequestedExternally,
  externalEditingQuotation,
  onClearExternalModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [deletingQuotation, setDeletingQuotation] = useState<Quotation | null>(null);
  const [historyQuotation, setHistoryQuotation] = useState<Quotation | null>(null);
  const [assignBookingTarget, setAssignBookingTarget] = useState<Quotation | null>(null);
  const [bookingInputValue, setBookingInputValue] = useState('');
  const [shipmentInputValue, setShipmentInputValue] = useState('');

  useEffect(() => {
    if (externalEditingQuotation) {
      setEditingQuotation(externalEditingQuotation);
      setIsFormOpen(true);
    }
  }, [externalEditingQuotation]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (assignBookingTarget) {
        setAssignBookingTarget(null);
      } else if (historyQuotation) {
        setHistoryQuotation(null);
      } else if (deletingQuotation) {
        setDeletingQuotation(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [assignBookingTarget, historyQuotation, deletingQuotation]);

  const stats = useMemo(() => {
    const total = quotations.length;
    const confirmed = quotations.filter((q) => isQuotationConfirmedForBusiness(q)).length;
    const referenceOnly = quotations.filter((q) => !(q.bookingNo || '').trim() && q.status !== 'REJECTED' && q.status !== 'EXPIRED').length;
    const rejectedOrExpired = quotations.filter(
      (q) => q.status === 'REJECTED' || q.status === 'EXPIRED'
    ).length;
    const costed = quotations.filter((q) => Boolean(q.linkedCostingId || q.linkedCostingNo)).length;
    return { total, confirmed, referenceOnly, rejectedOrExpired, costed };
  }, [quotations]);

  const filteredQuotations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return quotations.filter((q) => {
      if (statusFilter !== 'ALL' && q.status !== statusFilter) return false;
      const isConfirmed = Boolean((q.bookingNo || '').trim());
      if (methodFilter === 'CONFIRMED_BOOKING' && !isConfirmed) return false;
      if (methodFilter === 'REFERENCE' && isConfirmed) return false;
      if (!term) return true;
      return (
        q.quotationNo.toLowerCase().includes(term) ||
        q.customerName.toLowerCase().includes(term) ||
        (q.bookingNo || '').toLowerCase().includes(term) ||
        (q.shipmentNo || '').toLowerCase().includes(term) ||
        (q.blNo || '').toLowerCase().includes(term) ||
        (q.portTo || '').toLowerCase().includes(term)
      );
    });
  }, [quotations, searchTerm, statusFilter, methodFilter]);

  const effectiveModalOpen =
    isFormOpen || Boolean(isModalRequestedExternally) || Boolean(externalEditingQuotation);

  const handleCloseModal = () => {
    setIsFormOpen(false);
    setEditingQuotation(null);
    if (onClearExternalModal) onClearExternalModal();
  };

  const handleConfirmAssignBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignBookingTarget) return;
    const cleanBk = bookingInputValue.trim().toUpperCase();
    if (!cleanBk) return;
    const cleanShp = shipmentInputValue.trim().toUpperCase() || `SHP-${cleanBk}`;
    const matchedBk = bookings.find(
      (b) => b.bookingNumber.trim().toUpperCase() === cleanBk
    );
    const updated: Quotation = {
      ...assignBookingTarget,
      quotationMethod: 'CONFIRMED_BOOKING',
      linkedBookingId: matchedBk?.id || assignBookingTarget.linkedBookingId,
      bookingNo: cleanBk,
      shipmentNo: matchedBk?.shipmentNo || cleanShp,
      blNo: matchedBk?.blNo || assignBookingTarget.blNo || '',
      cyOpenDate: assignBookingTarget.cyOpenDate || matchedBk?.cyCutOpen || matchedBk?.cyOpenDate || '',
      cyCutDate: assignBookingTarget.cyCutDate || matchedBk?.cyCutDate || '',
      etd: assignBookingTarget.etd || matchedBk?.etd || '',
      eta: assignBookingTarget.eta || matchedBk?.eta || '',
      status:
        assignBookingTarget.status === 'DRAFT' || assignBookingTarget.status === 'SENT'
          ? 'ACCEPTED'
          : assignBookingTarget.status,
      statusHistory: [
        ...(assignBookingTarget.statusHistory || []),
        {
          id: `qh-${Date.now()}`,
          status: 'ACCEPTED',
          date: new Date().toISOString().slice(0, 10),
          note: `Booking #${cleanBk} assigned — eligible for Shipment Costing`,
        },
      ],
      updatedAt: new Date().toISOString(),
    };
    onSaveQuotation(updated);
    setAssignBookingTarget(null);
    setBookingInputValue('');
    setShipmentInputValue('');
  };

  const statusBadge = (status: QuotationStatus) => {
    switch (status) {
      case 'CONVERTED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'ACCEPTED':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'SENT':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'REJECTED':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'EXPIRED':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Freight Quotation Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Method 1 sends reference quotes without Booking #. Method 2 assigns Booking # so confirmed quotes link into Costing &amp; P&amp;L.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => exportQuotationsToExcel(filteredQuotations)}
            className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-lg flex items-center gap-1.5 shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Quotations (.xlsx)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingQuotation(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Quotation</span>
          </button>
        </div>
      </div>

      {/* Pipeline Overview Cards (Quotation Stage Visibility - No false Revenue inflation) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-500">
            <span>Total Quotations</span>
            <FileText className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-1.5 text-2xl font-mono font-bold text-slate-900 tabular-nums">
            {stats.total}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">All Customer Quotes</div>
        </div>

        <div className="bg-white border border-sky-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-bold uppercase text-sky-700">
            Method 1: Reference Only
          </div>
          <div className="mt-1.5 text-2xl font-mono font-bold text-sky-800 tabular-nums">
            {stats.referenceOnly}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">No Booking # (Excluded from P&amp;L)</div>
        </div>

        <div className="bg-white border border-emerald-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-emerald-700">
            <span>Method 2: Confirmed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1.5 text-2xl font-mono font-bold text-emerald-800 tabular-nums">
            {stats.confirmed}
          </div>
          <div className="text-[11px] text-emerald-700/80 mt-0.5">Booking # Assigned</div>
        </div>

        <div className="bg-white border border-indigo-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-bold uppercase text-indigo-700">
            Linked to Costing
          </div>
          <div className="mt-1.5 text-2xl font-mono font-bold text-indigo-900 tabular-nums">
            {stats.costed}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Active in P&amp;L Module</div>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-white border border-rose-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-bold uppercase text-rose-700">
            Rejected / Expired
          </div>
          <div className="mt-1.5 text-2xl font-mono font-bold text-rose-700 tabular-nums">
            {stats.rejectedOrExpired}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Excluded from Revenue</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* Search & Filters */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search quotation #, customer, booking #, shipment #, or destination..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600"
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

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 font-semibold text-slate-700"
            >
              <option value="ALL">All Stages</option>
              <option value="REFERENCE">Method 1: Reference Only (No Booking)</option>
              <option value="CONFIRMED_BOOKING">Method 2: Confirmed (With Booking #)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 font-semibold text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">DRAFT</option>
              <option value="SENT">SENT</option>
              <option value="ACCEPTED">ACCEPTED</option>
              <option value="CONVERTED">CONVERTED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="EXPIRED">EXPIRED</option>
            </select>
          </div>
        </div>

        {/* Records Table (Desktop) & Cards (Mobile) */}
        {filteredQuotations.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No quotations match your filter. Click <strong>New Quotation</strong> to create one.
          </div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="block md:hidden divide-y divide-slate-200">
              {filteredQuotations.map((q) => {
                const confirmed = isQuotationConfirmedForBusiness(q);
                return (
                  <div key={q.id} className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-sky-900 text-sm">
                          {q.quotationNo}
                        </span>
                        <span className="text-[11px] text-slate-400 ml-2">{q.date}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded border ${statusBadge(
                          q.status
                        )}`}
                      >
                        {q.status}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900">{q.customerName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {q.bookingNo ? `BK: ${q.bookingNo}` : 'Method 1: Reference Quote (No Booking)'} ·{' '}
                      {q.portFrom} → {q.portTo}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[10.5px] font-mono bg-slate-50 p-2 rounded border border-slate-200">
                      <div><span className="font-bold text-slate-500">CY OPEN:</span> {q.cyOpenDate || '—'}</div>
                      <div><span className="font-bold text-slate-500">CY CUT:</span> {q.cyCutDate || '—'}</div>
                      <div><span className="font-bold text-slate-500">ETD:</span> {q.etd || '—'}</div>
                      <div><span className="font-bold text-slate-500">ETA:</span> {q.eta || '—'}</div>
                    </div>
                    <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs">
                      <span className="text-slate-500 font-semibold">Quoted Selling Price</span>
                      <span className="font-mono font-bold text-slate-900 tabular-nums">
                        ¥{Math.round(q.totalSellingJpy).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => onDownloadQuotationPdf(q)}
                        className="flex-1 py-1.5 text-xs font-bold text-white bg-sky-700 rounded-lg flex items-center justify-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </button>
                      {!q.bookingNo && q.status !== 'REJECTED' && q.status !== 'EXPIRED' && (
                        <button
                          type="button"
                          onClick={() => {
                            setAssignBookingTarget(q);
                            setBookingInputValue('');
                            setShipmentInputValue('');
                          }}
                          className="px-2.5 py-1.5 text-xs font-bold text-emerald-900 bg-emerald-100 rounded-lg"
                        >
                          + Booking #
                        </button>
                      )}
                      {confirmed && (
                        <button
                          type="button"
                          onClick={() => onCreateCostingFromQuotation(q)}
                          className="px-2.5 py-1.5 text-xs font-bold text-amber-900 bg-amber-100 rounded-lg flex items-center gap-1"
                        >
                          <Calculator className="w-3.5 h-3.5" /> Costing
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingQuotation(q);
                          setIsFormOpen(true);
                        }}
                        className="p-1.5 bg-slate-100 rounded-lg"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingQuotation(q)}
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
                    <th className="py-3 px-3 font-bold">Quotation No</th>
                    <th className="py-3 px-3 font-bold">Stage / Method</th>
                    <th className="py-3 px-3 font-bold">Customer &amp; Route</th>
                    <th className="py-3 px-3 font-bold">CY Open / Cut · ETD / ETA</th>
                    <th className="py-3 px-3 font-bold">Booking / Refs</th>
                    <th className="py-3 px-3 font-bold text-right">Quoted Amount</th>
                    <th className="py-3 px-3 font-bold">Status</th>
                    <th className="py-3 px-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredQuotations.map((q) => {
                    const hasBooking = Boolean((q.bookingNo || '').trim());
                    const confirmed = isQuotationConfirmedForBusiness(q);

                    return (
                      <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-mono font-bold text-sky-900">{q.quotationNo}</div>
                          <div className="text-[10px] text-slate-500">
                            {q.date} · Valid: {q.validUntil || '—'}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {hasBooking ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">
                              <CheckCircle2 className="w-3 h-3" /> Confirmed Booking
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 rounded">
                              Reference Quote
                            </span>
                          )}
                          {q.linkedCostingNo && (
                            <div className="text-[10px] font-mono text-indigo-700 mt-1">
                              Costing: {q.linkedCostingNo}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900">{q.customerName}</div>
                          <div className="text-[11px] text-slate-500">
                            {q.portFrom} → <span className="font-semibold text-slate-700">{q.portTo}</span> ({q.shipmentMode})
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono text-[10.5px] text-slate-700 whitespace-nowrap">
                          <div>
                            <span className="font-bold text-emerald-800">CY OPEN:</span> {q.cyOpenDate || '—'}{' '}
                            <span className="text-slate-300">|</span>{' '}
                            <span className="font-bold text-amber-800">CY CUT:</span> {q.cyCutDate || '—'}
                          </div>
                          <div className="mt-0.5">
                            <span className="font-bold text-sky-800">ETD:</span> {q.etd || '—'}{' '}
                            <span className="text-slate-300">|</span>{' '}
                            <span className="font-bold text-indigo-800">ETA:</span> {q.eta || '—'}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-700">
                          {hasBooking ? (
                            <>
                              <div className="font-bold text-slate-900">BK: {q.bookingNo}</div>
                              <div className="text-[10px] text-slate-500">
                                {q.shipmentNo ? `SHP: ${q.shipmentNo}` : ''}{' '}
                                {q.blNo ? `· BL: ${q.blNo}` : ''}
                              </div>
                            </>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              No Booking Assigned
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                          ¥{Math.round(q.totalSellingJpy).toLocaleString()}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded border ${statusBadge(
                              q.status
                            )}`}
                          >
                            {q.status}
                          </span>
                          {q.linkedInvoiceNo && (
                            <div className="text-[10px] font-mono text-emerald-700 mt-0.5">
                              INV: {q.linkedInvoiceNo}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => onDownloadQuotationPdf(q)}
                              className="px-2 py-1 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded flex items-center gap-1"
                              title="Download Freight Quotation PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                              PDF
                            </button>
                            <button
                              type="button"
                              onClick={() => onViewQuotation(q)}
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                              title="Preview Freight Quotation"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {!hasBooking && q.status !== 'REJECTED' && q.status !== 'EXPIRED' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setAssignBookingTarget(q);
                                  setBookingInputValue('');
                                  setShipmentInputValue('');
                                }}
                                className="px-2 py-1 text-[11px] font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded flex items-center gap-1"
                                title="Assign Booking Number when Customer Confirms"
                              >
                                <Hash className="w-3 h-3" />
                                Assign BK#
                              </button>
                            )}
                            {confirmed && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onCreateCostingFromQuotation(q)}
                                  className="px-2 py-1 text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded flex items-center gap-1"
                                  title="Open Costing Module for this Confirmed Quotation"
                                >
                                  <Calculator className="w-3 h-3" />
                                  {q.linkedCostingId ? 'View Costing' : 'To Costing'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onConvertQuotationToInvoice(q)}
                                  className="px-2 py-1 text-[11px] font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded flex items-center gap-1"
                                  title="Generate Freight Invoice from Confirmed Quotation"
                                >
                                  <ArrowRight className="w-3 h-3" />
                                  Invoice
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => setHistoryQuotation(q)}
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                              title="View Quotation History"
                            >
                              <History className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingQuotation(q);
                                setIsFormOpen(true);
                              }}
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                              title="Edit Quotation"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingQuotation(q)}
                              className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded"
                              title="Delete Quotation"
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

      {/* Quotation Form Modal */}
      <QuotationFormModal
        isOpen={effectiveModalOpen}
        onClose={handleCloseModal}
        onSave={onSaveQuotation}
        initialData={editingQuotation}
        availableBookings={bookings}
        customers={customers}
        prefillFromBooking={prefillBooking}
      />

      {/* Quick Assign Booking Number Modal */}
      {assignBookingTarget && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAssignBookingTarget(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Confirm Booking · #{assignBookingTarget.quotationNo}
                </h3>
                <p className="text-xs text-slate-500">{assignBookingTarget.customerName}</p>
              </div>
              <button
                type="button"
                onClick={() => setAssignBookingTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleConfirmAssignBooking} className="space-y-3 text-xs">
              {bookings.length > 0 && (
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Pick Existing Booking (Optional)
                  </label>
                  <select
                    value=""
                    onChange={(e) => {
                      const b = bookings.find((x) => x.id === e.target.value);
                      if (b) {
                        setBookingInputValue(b.bookingNumber);
                        setShipmentInputValue(b.shipmentNo || `SHP-${b.bookingNumber}`);
                      }
                    }}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">Select existing booking to fill...</option>
                    {bookings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bookingNumber} · {b.customerCompany} ({b.pol} → {b.pod})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Confirmed Booking Number *
                </label>
                <input
                  type="text"
                  required
                  value={bookingInputValue}
                  onChange={(e) => setBookingInputValue(e.target.value.toUpperCase())}
                  placeholder="e.g. TYO0801234"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Shipment Number (Optional)
                </label>
                <input
                  type="text"
                  value={shipmentInputValue}
                  onChange={(e) => setShipmentInputValue(e.target.value.toUpperCase())}
                  placeholder="Auto-generated if left blank"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssignBookingTarget(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg"
                >
                  Confirm &amp; Enable Costing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quotation History Modal */}
      {historyQuotation && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setHistoryQuotation(null);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Quotation History · #{historyQuotation.quotationNo}
                </h3>
                <p className="text-xs text-slate-500">{historyQuotation.customerName}</p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryQuotation(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto text-xs">
              {(historyQuotation.statusHistory || []).length === 0 ? (
                <div className="text-slate-500 py-4 text-center">No status history entries yet.</div>
              ) : (
                historyQuotation.statusHistory?.map((h) => (
                  <div key={h.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>{h.status}</span>
                      <span className="font-mono text-[11px] text-slate-500">{h.date}</span>
                    </div>
                    {h.note && <div className="text-slate-600 mt-1">{h.note}</div>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingQuotation && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeletingQuotation(null);
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
                <h3 className="font-bold text-slate-900 text-base">Delete Quotation?</h3>
                <p className="text-xs text-slate-500 font-mono">
                  #{deletingQuotation.quotationNo}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Remove quotation for <strong>{deletingQuotation.customerName}</strong> permanently?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingQuotation(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteQuotation(deletingQuotation.id);
                  setDeletingQuotation(null);
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
