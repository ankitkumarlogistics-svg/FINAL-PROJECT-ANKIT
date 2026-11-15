import React, { useState, useMemo, useEffect } from 'react';
import { BookingConfirmation, BookingStatus, FreightInvoice, Language } from '../types';
import { translations } from '../utils/translations';
import {
  Search,
  Plus,
  Eye,
  Edit3,
  Trash2,
  Copy,
  FileSpreadsheet,
  ArrowRight,
  Filter,
  Ship,
  Anchor,
  Download,
  Mail,
  X,
  FileCheck2,
  Calculator,
} from 'lucide-react';
import { exportBookingsToExcel, exportKycToExcel } from '../utils/excelExport';

interface BookingListProps {
  bookings: BookingConfirmation[];
  invoices?: FreightInvoice[];
  language?: Language;
  onView: (booking: BookingConfirmation) => void;
  onEdit: (booking: BookingConfirmation) => void;
  onDelete: (id: string) => void;
  onDuplicate: (booking: BookingConfirmation) => void;
  onConvertToInvoice: (booking: BookingConfirmation) => void;
  onCreateQuotation?: (booking: BookingConfirmation) => void;
  onCreateShippingPayment?: (booking: BookingConfirmation) => void;
  onDownloadPdf: (booking: BookingConfirmation) => void;
  onSendCustomer: (booking: BookingConfirmation) => void;
  onPrintKyc?: (booking: BookingConfirmation) => void;
  onCreateNew: () => void;
}

export const BookingList: React.FC<BookingListProps> = ({
  bookings,
  invoices = [],
  language = 'en',
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onConvertToInvoice,
  onCreateQuotation,
  onCreateShippingPayment,
  onDownloadPdf,
  onSendCustomer,
  onPrintKyc,
  onCreateNew,
}) => {
  const t = translations[language];
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deletingBooking, setDeletingBooking] = useState<BookingConfirmation | null>(null);

  // Filtered and searched records by Booking Number, Invoice Number, or Customer Name
  const filteredBookings = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return bookings.filter((b) => {
      // 1. Status Filter
      if (statusFilter !== 'ALL' && b.status !== statusFilter) {
        return false;
      }

      // If no search term, keep
      if (!term) return true;

      // 2. Booking Number / Shipment No / BL No match
      if (b.bookingNumber.toLowerCase().includes(term)) return true;
      if (b.shipmentNo?.toLowerCase().includes(term)) return true;
      if (b.blNo?.toLowerCase().includes(term)) return true;

      // 3. Customer Name / Shipper / Consignee / Notify match
      if (b.customerCompany?.toLowerCase().includes(term)) return true;
      if (b.shipperCompany?.toLowerCase().includes(term)) return true;
      if (b.consigneeCompany?.toLowerCase().includes(term)) return true;
      if (b.notifyParty?.toLowerCase().includes(term)) return true;

      // 4. Invoice Number match (matches any invoice associated with this booking number)
      if (invoices.length > 0) {
        const hasMatchingInvoice = invoices.some(
          (inv) =>
            inv.bookingNo.toLowerCase() === b.bookingNumber.toLowerCase() &&
            inv.invoiceNo.toLowerCase().includes(term)
        );
        if (hasMatchingInvoice) return true;
      }

      // 5. Vessel, Carrier, Routing match
      if (b.vessel?.toLowerCase().includes(term)) return true;
      if (b.voyage?.toLowerCase().includes(term)) return true;
      if (b.shippingCompany?.toLowerCase().includes(term)) return true;
      if (b.por?.toLowerCase().includes(term)) return true;
      if (b.pol?.toLowerCase().includes(term)) return true;
      if (b.pod?.toLowerCase().includes(term)) return true;
      if (b.commodity?.toLowerCase().includes(term)) return true;

      return false;
    });
  }, [bookings, invoices, searchTerm, statusFilter]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredBookings.map((b) => b.id));
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
        ? bookings.filter((b) => selectedIds.includes(b.id))
        : filteredBookings;
    exportBookingsToExcel(listToExport);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
  };

  const statusStyles: Record<BookingStatus, string> = {
    CONFIRMED: 'text-emerald-700 font-semibold',
    DRAFT: 'text-slate-600 font-medium',
    SHIPPED: 'text-sky-700 font-semibold',
    CANCELLED: 'text-rose-600 font-medium',
  };

  const isFilteringActive = searchTerm.trim().length > 0 || statusFilter !== 'ALL';

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      {/* Top Filter & Action Bar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Bar - High Visibility Input */}
          <div className="flex flex-1 items-center gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.searchBookingsPlaceholder || 'Search by booking #, invoice #, or customer name...'}
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
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="DRAFT">DRAFT</option>
                <option value="SHIPPED">SHIPPED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-end">
            {/* Export to Excel */}
            <button
              type="button"
              onClick={handleExportSelected}
              className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
              title="Download records in Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Excel ({selectedIds.length > 0 ? selectedIds.length : 'All'})
            </button>

            {/* Export KYC to Excel */}
            <button
              type="button"
              onClick={() => {
                const listToExport =
                  selectedIds.length > 0
                    ? bookings.filter((b) => selectedIds.includes(b.id))
                    : filteredBookings;
                exportKycToExcel(listToExport);
              }}
              className="px-3 py-2 text-xs font-semibold text-teal-800 bg-white hover:bg-teal-50 border border-teal-300 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
              title="Export KYC Parties & Verification Details to Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
              <span>Export KYC (.xlsx)</span>
            </button>

            {/* Create New Booking Button */}
            <button
              type="button"
              onClick={onCreateNew}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              {t.addNewBooking}
            </button>
          </div>
        </div>

        {/* Live Filter Indicator & Results Counter */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-200/60">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              Showing <strong className="text-slate-900 font-bold">{filteredBookings.length}</strong> of{' '}
              <strong className="text-slate-900 font-bold">{bookings.length}</strong> bookings
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

      {/* Bookings Display: Mobile Touch Cards (< md) & Desktop Table (>= md) */}
      {filteredBookings.length === 0 ? (
        <div className="py-12 sm:py-16 text-center px-4">
          <Ship className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-700">{t.noRecordsFound}</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {searchTerm
              ? `No bookings match "${searchTerm}". Check the booking #, invoice #, or customer name.`
              : 'Create your first shipping booking confirmation to print A4 confirmation and generate invoices.'}
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
              {t.addNewBooking}
            </button>
          )}
        </div>
      ) : (
        <>
          {/* 1. MOBILE TOUCH CARDS VIEW (Visible on mobile/tablet screens < 768px) */}
          <div className="block md:hidden divide-y divide-slate-200">
            {filteredBookings.map((b) => (
              <div
                key={b.id}
                className="p-3.5 sm:p-4 bg-white hover:bg-slate-50/80 transition-colors space-y-2.5"
              >
                {/* Header: Booking #, Date, Status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Anchor className="w-4 h-4 text-sky-700 shrink-0" />
                    <span className="font-mono font-bold text-sky-950 text-sm truncate">
                      {b.bookingNumber}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0">
                      · {b.date}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                      b.status === 'CONFIRMED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : b.status === 'SHIPPED'
                        ? 'bg-sky-50 text-sky-700 border border-sky-200'
                        : b.status === 'CANCELLED'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>

                {/* Customer & Shipper */}
                <div className="bg-slate-50/80 border border-slate-100 rounded-lg p-2.5 text-xs">
                  <div className="font-bold text-slate-900 text-sm">{b.customerCompany}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap gap-x-2">
                    <span>Shipper: {b.shipperCompany || 'AS ACTUAL'}</span>
                    <span>·</span>
                    <span>Line: <strong className="text-slate-700">{b.shippingCompany}</strong></span>
                  </div>
                </div>

                {/* Route & Cargo Pill Info */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-sky-50/60 border border-sky-100 rounded-lg p-2">
                    <div className="text-[10px] uppercase font-semibold text-sky-800">Route</div>
                    <div className="font-bold text-sky-950 mt-0.5 truncate">
                      {b.pol || b.por} → {b.pod}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                      {b.vessel} {b.voyage && `· ${b.voyage}`}
                    </div>
                  </div>

                  <div className="bg-rose-50/60 border border-rose-100 rounded-lg p-2">
                    <div className="text-[10px] uppercase font-semibold text-rose-800">CY Cut Date</div>
                    <div className="font-mono font-bold text-rose-900 mt-0.5">
                      {b.cyCutDate || '—'}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                      {b.cargoVolumeSize}
                    </div>
                  </div>
                </div>

                {/* Mobile Action Bar - High tactile touch targets */}
                <div className="pt-1 flex items-center gap-1.5">
                  {/* Direct PDF Download */}
                  <button
                    type="button"
                    onClick={() => onDownloadPdf(b)}
                    className="flex-1 py-2 px-3 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 active:scale-95 rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-transform"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>

                  {/* Send to Customer */}
                  <button
                    type="button"
                    onClick={() => onSendCustomer(b)}
                    className="py-2 px-3 text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 active:scale-95 rounded-lg flex items-center justify-center gap-1 transition-transform"
                    title="Send via Email or WhatsApp"
                  >
                    <Mail className="w-3.5 h-3.5 text-emerald-700" />
                    <span className="hidden xs:inline">Send</span>
                  </button>

                  {/* Print KYC Button */}
                  {onPrintKyc && (
                    <button
                      type="button"
                      onClick={() => onPrintKyc(b)}
                      className="py-2 px-3 text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 active:scale-95 rounded-lg flex items-center justify-center gap-1 transition-transform"
                      title="Print KYC Document (Strips Schedule Headers)"
                    >
                      <FileCheck2 className="w-3.5 h-3.5 text-emerald-950" />
                      <span>Print KYC</span>
                    </button>
                  )}

                  {/* Preview / View Document */}
                  <button
                    type="button"
                    onClick={() => onView(b)}
                    className="p-2 text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-lg"
                    title="Preview Document"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {/* Create Quotation */}
                  {onCreateQuotation && (
                    <button
                      type="button"
                      onClick={() => onCreateQuotation(b)}
                      className="p-2 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 active:scale-95 rounded-lg"
                      title="Create Quotation & Costing"
                    >
                      <Calculator className="w-4 h-4" />
                    </button>
                  )}

                  {/* Shipping Line Payment */}
                  {onCreateShippingPayment && (
                    <button
                      type="button"
                      onClick={() => onCreateShippingPayment(b)}
                      className="p-2 text-amber-700 bg-amber-50 hover:bg-amber-100 active:scale-95 rounded-lg"
                      title="Record Shipping Line Payable"
                    >
                      <Anchor className="w-4 h-4" />
                    </button>
                  )}

                  {/* 1-Click Convert to Invoice */}
                  <button
                    type="button"
                    onClick={() => onConvertToInvoice(b)}
                    className="p-2 text-sky-800 bg-sky-100 hover:bg-sky-200 active:scale-95 rounded-lg"
                    title="Convert to Invoice"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Edit */}
                  <button
                    type="button"
                    onClick={() => onEdit(b)}
                    className="p-2 text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-lg"
                    title="Edit Booking"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => setDeletingBooking(b)}
                    className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 active:scale-95 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
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
                        selectedIds.length === filteredBookings.length &&
                        filteredBookings.length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                  </th>
                  <th className="py-3 px-3 font-bold">{t.bkgNumber}</th>
                  <th className="py-3 px-3 font-bold">{t.customer}</th>
                  <th className="py-3 px-3 font-bold">{t.vesselVoyage}</th>
                  <th className="py-3 px-3 font-bold">{t.polPod}</th>
                  <th className="py-3 px-3 font-bold">{t.cyCut}</th>
                  <th className="py-3 px-3 font-bold">{t.volume}</th>
                  <th className="py-3 px-3 font-bold">{t.status}</th>
                  <th className="py-3 px-3 font-bold text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredBookings.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-slate-50/80 transition-colors group text-slate-800"
                  >
                    <td className="py-3 px-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(b.id)}
                        onChange={() => handleSelectOne(b.id)}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                    </td>

                    {/* Booking Number */}
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-sky-900 flex items-center gap-1.5">
                        <Anchor className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        {b.bookingNumber}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{b.date}</div>
                      {(b.shipmentNo || b.blNo) && (
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                          {b.shipmentNo ? `SHP: ${b.shipmentNo}` : ''}
                          {b.shipmentNo && b.blNo ? ' · ' : ''}
                          {b.blNo ? `BL: ${b.blNo}` : ''}
                        </div>
                      )}
                    </td>

                    {/* Customer Company */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{b.customerCompany}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[160px]">
                        Shipper: {b.shipperCompany || 'AS ACTUAL'}
                      </div>
                    </td>

                    {/* Shipping Line & Vessel */}
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-900">{b.shippingCompany}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {b.vessel} {b.voyage && `· Voy ${b.voyage}`}
                      </div>
                    </td>

                    {/* Routing */}
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-900">
                        {b.pol || b.por} → <span className="font-bold text-sky-900">{b.pod}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        ETD: {b.etd} · ETA: {b.eta}
                      </div>
                    </td>

                    {/* CY Cut Dates: Cut Off, Cut Open, Doc Cut */}
                    <td className="py-3 px-3 text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-rose-700">
                          Cut: {b.cyCutDate || '—'}
                        </span>
                        {(() => {
                          if (!b.cyCutDate) return null;
                          const cut = new Date(b.cyCutDate).getTime();
                          const today = new Date().setHours(0, 0, 0, 0);
                          const diff = Math.ceil((cut - today) / (1000 * 60 * 60 * 24));
                          if (isNaN(diff)) return null;
                          if (diff < 0) {
                            return <span className="text-[9.5px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-semibold">Closed</span>;
                          }
                          if (diff === 0) {
                            return <span className="text-[9.5px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-extrabold animate-pulse">Cutoff Today!</span>;
                          }
                          if (diff <= 2) {
                            return <span className="text-[9.5px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">{diff}d left</span>;
                          }
                          return <span className="text-[9.5px] bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded font-medium">{diff}d</span>;
                        })()}
                      </div>
                      {(b.cyCutOpen || b.docCyCut) && (
                        <div className="text-[10px] text-slate-500 mt-0.5 space-y-0.5">
                          {b.cyCutOpen && (
                            <div className="text-emerald-700 font-medium">Open: {b.cyCutOpen}</div>
                          )}
                          {b.docCyCut && (
                            <div className="text-amber-800 font-medium">Doc: {b.docCyCut}</div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Cargo & Commodity */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5 flex-wrap">
                        <span>{b.cargoVolumeSize}</span>
                        {b.containerCount && b.containerCount > 1 && (
                          <span className="px-1.5 py-0.5 bg-sky-100 text-sky-800 text-[10px] font-bold rounded border border-sky-300">
                            {b.containerCount}C
                          </span>
                        )}
                        {b.sealNumbers && (
                          <span className="px-1 py-0.2 bg-slate-100 text-slate-600 text-[9.5px] font-mono rounded" title={`Seal: ${b.sealNumbers}`}>
                            Seal ✓
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                        {b.commodity}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-xs">
                      <span className={statusStyles[b.status]}>{b.status}</span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Direct PDF Download */}
                        <button
                          type="button"
                          onClick={() => onDownloadPdf(b)}
                          className="px-2.5 py-1 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded flex items-center gap-1 shadow-xs transition-colors"
                          title="Download PDF to send to customer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          PDF
                        </button>

                        {/* Send to Customer */}
                        <button
                          type="button"
                          onClick={() => onSendCustomer(b)}
                          className="px-2 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded flex items-center gap-1 transition-colors"
                          title="Send document to customer via email or message"
                        >
                          <Mail className="w-3.5 h-3.5 text-emerald-600" />
                          Send
                        </button>

                        {/* Print KYC Button */}
                        {onPrintKyc && (
                          <button
                            type="button"
                            onClick={() => onPrintKyc(b)}
                            className="px-2.5 py-1 text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded flex items-center gap-1 shadow-xs transition-colors"
                            title="Print KYC Document (Excludes Schedule Headers)"
                          >
                            <FileCheck2 className="w-3.5 h-3.5" />
                            KYC
                          </button>
                        )}

                        {/* View & Preview */}
                        <button
                          type="button"
                          onClick={() => onView(b)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                          title="Preview Document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Create Quotation */}
                        {onCreateQuotation && (
                          <button
                            type="button"
                            onClick={() => onCreateQuotation(b)}
                            className="px-2 py-1 text-[11px] font-semibold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded flex items-center gap-1 transition-colors"
                            title="Create Quotation & Costing from Booking"
                          >
                            <Calculator className="w-3 h-3" />
                            Quote
                          </button>
                        )}

                        {/* Shipping Line Payment */}
                        {onCreateShippingPayment && (
                          <button
                            type="button"
                            onClick={() => onCreateShippingPayment(b)}
                            className="p-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded"
                            title="Record Shipping Line Payable"
                          >
                            <Anchor className="w-4 h-4" />
                          </button>
                        )}

                        {/* Convert to Invoice */}
                        <button
                          type="button"
                          onClick={() => onConvertToInvoice(b)}
                          className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded"
                          title="1-Click Convert to Freight Invoice"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => onEdit(b)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                          title="Edit Booking"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Duplicate */}
                        <button
                          type="button"
                          onClick={() => onDuplicate(b)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                          title="Duplicate Booking"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => setDeletingBooking(b)}
                          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded"
                          title="Delete Booking"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Table Footer info */}
      <div className="px-4 py-2.5 sm:py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-1.5">
        <div>
          Showing {filteredBookings.length} of {bookings.length} booking records
        </div>
        <div className="text-[11px] text-slate-400">
          Touch or click any card/row to download PDF or send
        </div>
      </div>

      {/* In-App Delete Confirmation Modal (iFrame safe, never blocked by browser) */}
      {deletingBooking && (
        <DeleteBookingModalBackdrop
          onClose={() => setDeletingBooking(null)}
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
                <h3 className="font-bold text-slate-900 text-base">Delete Booking Confirmation?</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">#{deletingBooking.bookingNumber}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete this booking for <strong className="text-slate-800">{deletingBooking.customerCompany}</strong>? This action will permanently remove the record from Cloud Firestore and local storage.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingBooking(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(deletingBooking.id);
                  setDeletingBooking(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </DeleteBookingModalBackdrop>
      )}
    </div>
  );
};

const DeleteBookingModalBackdrop: React.FC<{
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
