import React, { useState, useMemo, useRef } from 'react';
import { TruckingSheet, Customer, Shipper, TruckingCompany } from '../types';
import {
  Truck,
  Plus,
  Search,
  FileSpreadsheet,
  Edit2,
  Trash2,
  X,
  Calendar,
  MapPin,
  CheckCircle,
  FileText,
  Printer,
  Download,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { downloadElementAsPdf } from '../utils/pdfExport';
import { JapaneseSeal } from './JapaneseSeal';

interface TruckingSheetsProps {
  sheets: TruckingSheet[];
  customers: Customer[];
  shippers: Shipper[];
  truckingCompanies: TruckingCompany[];
  onSaveSheet: (sheet: TruckingSheet) => void;
  onDeleteSheet: (id: string) => void;
}

export const TruckingSheets: React.FC<TruckingSheetsProps> = ({
  sheets,
  customers,
  shippers,
  truckingCompanies,
  onSaveSheet,
  onDeleteSheet,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterNonBillable, setFilterNonBillable] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSheet, setEditingSheet] = useState<TruckingSheet | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [printableSheet, setPrintableSheet] = useState<TruckingSheet | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Active sheet for PDF generation
  const [pdfSheet, setPdfSheet] = useState<TruckingSheet | null>(null);
  const sheetPrintRef = useRef<HTMLDivElement>(null);

  // Form State with exact  fields *
  const [sheetNumber, setSheetNumber] = useState('');
  const [customerCompany, setCustomerCompany] = useState('');
  const [shipperCompany, setShipperCompany] = useState('');
  const [truckingCompany, setTruckingCompany] = useState('');
  const [isNonBillable, setIsNonBillable] = useState(false);
  const [pickupDate, setPickupDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [auctionBuyer, setAuctionBuyer] = useState('');
  const [posNumber, setPosNumber] = useState('');
  const [truckingCompanyRemarks, setTruckingCompanyRemarks] = useState('');
  const [customerRemarks, setCustomerRemarks] = useState('');
  const [internalRemarks, setInternalRemarks] = useState('');

  const openAddModal = () => {
    setEditingSheet(null);
    setSheetNumber(`TRK-${new Date().getFullYear()}-${String(sheets.length + 1).padStart(4, '0')}`);
    setCustomerCompany(customers[0]?.name || '');
    setShipperCompany(shippers[0]?.name || 'YOKOHAMA TRADING & LOGISTICS CO., LTD.');
    setTruckingCompany(truckingCompanies[0]?.companyNameEn || '');
    setIsNonBillable(false);
    setPickupDate(new Date().toISOString().split('T')[0]);
    setDeliveryDate(new Date().toISOString().split('T')[0]);
    setPickupLocation('');
    setDeliveryLocation('');
    setAuctionBuyer('');
    setPosNumber('');
    setTruckingCompanyRemarks('');
    setCustomerRemarks('');
    setInternalRemarks('');
    setIsModalOpen(true);
  };

  const openEditModal = (s: TruckingSheet) => {
    setEditingSheet(s);
    setSheetNumber(s.sheetNumber || '');
    setCustomerCompany(s.customerCompany || '');
    setShipperCompany(s.shipperCompany || '');
    setTruckingCompany(s.truckingCompany || '');
    setIsNonBillable(!!s.isNonBillable);
    setPickupDate(s.pickupDate || '');
    setDeliveryDate(s.deliveryDate || '');
    setPickupLocation(s.pickupLocation || '');
    setDeliveryLocation(s.deliveryLocation || '');
    setAuctionBuyer(s.auctionBuyer || '');
    setPosNumber(s.posNumber || '');
    setTruckingCompanyRemarks(s.truckingCompanyRemarks || '');
    setCustomerRemarks(s.customerRemarks || '');
    setInternalRemarks(s.internalRemarks || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerCompany.trim()) {
      alert('Customer Company is ');
      return;
    }
    if (!shipperCompany.trim()) {
      alert('Shipper Company is ');
      return;
    }
    if (!truckingCompany.trim()) {
      alert('Trucking Company is ');
      return;
    }
    if (!pickupDate) {
      alert('Pickup Date is ');
      return;
    }
    if (!deliveryDate) {
      alert('Delivery Date is ');
      return;
    }
    if (!pickupLocation.trim()) {
      alert('Pickup Location is ');
      return;
    }
    if (!deliveryLocation.trim()) {
      alert('Delivery Location is ');
      return;
    }

    const sheetToSave: TruckingSheet = {
      id: editingSheet ? editingSheet.id : `ts-${Date.now()}`,
      sheetNumber: sheetNumber.trim(),
      customerCompany: customerCompany.trim(),
      shipperCompany: shipperCompany.trim(),
      truckingCompany: truckingCompany.trim(),
      isNonBillable,
      pickupDate,
      deliveryDate,
      pickupLocation: pickupLocation.trim(),
      deliveryLocation: deliveryLocation.trim(),
      auctionBuyer: auctionBuyer.trim(),
      posNumber: posNumber.trim(),
      truckingCompanyRemarks: truckingCompanyRemarks.trim(),
      customerRemarks: customerRemarks.trim(),
      internalRemarks: internalRemarks.trim(),
      createdAt: editingSheet ? editingSheet.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveSheet(sheetToSave);
    setIsModalOpen(false);
  };

  const filteredSheets = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return sheets.filter((s) => {
      const matchesSearch =
        s.sheetNumber.toLowerCase().includes(q) ||
        s.customerCompany.toLowerCase().includes(q) ||
        s.shipperCompany.toLowerCase().includes(q) ||
        s.truckingCompany.toLowerCase().includes(q) ||
        s.pickupLocation.toLowerCase().includes(q) ||
        s.deliveryLocation.toLowerCase().includes(q) ||
        s.auctionBuyer.toLowerCase().includes(q) ||
        s.posNumber.toLowerCase().includes(q);

      const matchesBillable =
        filterNonBillable === 'ALL'
          ? true
          : filterNonBillable === 'NON_BILLABLE'
          ? s.isNonBillable
          : !s.isNonBillable;

      return matchesSearch && matchesBillable;
    });
  }, [sheets, searchTerm, filterNonBillable]);

  const handleExportExcel = () => {
    const data = filteredSheets.map((s) => ({
      'Sheet Number': s.sheetNumber,
      'Customer Company': s.customerCompany,
      'Shipper Company': s.shipperCompany,
      'Trucking Company': s.truckingCompany,
      'Is Non Billable': s.isNonBillable ? 'Yes' : 'No',
      'Pickup Date': s.pickupDate,
      'Delivery Date': s.deliveryDate,
      'Pickup Location': s.pickupLocation,
      'Delivery Location': s.deliveryLocation,
      'Auction Buyer': s.auctionBuyer,
      'POS Number': s.posNumber,
      'Trucking Company Remarks': s.truckingCompanyRemarks,
      'Customer Remarks': s.customerRemarks,
      'Internal Remarks': s.internalRemarks,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Trucking_Sheets');
    XLSX.writeFile(wb, `Trucking_Sheets_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Direct PDF Download for Trucking Dispatch Sheet
  const handleDownloadTruckingPdf = async (s: TruckingSheet) => {
    setDownloadingId(s.id);
    setPdfSheet(s);
    await new Promise((r) => setTimeout(r, 80));
    if (sheetPrintRef.current) {
      await downloadElementAsPdf({
        element: sheetPrintRef.current,
        filename: `Trucking_Dispatch_${s.sheetNumber}.pdf`,
      });
    }
    setDownloadingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-sky-800 text-xs font-bold uppercase tracking-wider">
            <Truck className="w-4 h-4 text-sky-600" />
            <span>Transport Dispatch</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Trucking Sheets & Dispatch Orders
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Log dispatch movement orders, auction pickups, non-billable transfers, and generate PDF waybills.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Trucking Sheet</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Sheet #, Customer, Shipper, Carrier, Location, Auction Buyer, POS..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
          />
        </div>

        <div>
          <select
            value={filterNonBillable}
            onChange={(e) => setFilterNonBillable(e.target.value)}
            className="w-full px-3 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
          >
            <option value="ALL">All Billing Types</option>
            <option value="BILLABLE">Billable Transport</option>
            <option value="NON_BILLABLE">Non-Billable Only</option>
          </select>
        </div>
      </div>

      {/* Sheets List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1050px]">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
                <th className="py-3 px-4">Sheet Number</th>
                <th className="py-3 px-4">Customer* & Shipper*</th>
                <th className="py-3 px-4">Trucking Company</th>
                <th className="py-3 px-4">Pickup / Delivery Dates*</th>
                <th className="py-3 px-4">Locations (Pickup & Delivery)*</th>
                <th className="py-3 px-4">Auction Buyer / POS</th>
                <th className="py-3 px-4">Remarks</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSheets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No trucking sheets found.
                  </td>
                </tr>
              ) : (
                filteredSheets.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <div>{s.sheetNumber}</div>
                      {s.isNonBillable ? (
                        <span className="inline-block px-1.5 py-0.5 mt-1 bg-amber-100 text-amber-800 rounded text-[10px] font-bold">
                          Non-Billable
                        </span>
                      ) : (
                        <span className="inline-block px-1.5 py-0.5 mt-1 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                          Billable
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{s.customerCompany}</div>
                      <div className="text-slate-500 text-[11px]">Shipper: {s.shipperCompany}</div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      <div className="flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span>{s.truckingCompany}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center gap-1 font-medium text-slate-800">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>PU: {s.pickupDate}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">DL: {s.deliveryDate}</div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                      <div className="flex items-start gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="truncate">From: {s.pickupLocation}</span>
                      </div>
                      <div className="flex items-start gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-sky-600 shrink-0 mt-0.5" />
                        <span className="truncate">To: {s.deliveryLocation}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="font-medium text-slate-800">{s.auctionBuyer || '-'}</div>
                      {s.posNumber && (
                        <div className="text-[11px] font-mono text-slate-500">
                          POS: {s.posNumber}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs text-slate-600 text-[11px]">
                      {s.truckingCompanyRemarks && (
                        <div className="truncate">
                          <strong className="text-slate-700">Trk:</strong> {s.truckingCompanyRemarks}
                        </div>
                      )}
                      {s.customerRemarks && (
                        <div className="truncate">
                          <strong className="text-slate-700">Cust:</strong> {s.customerRemarks}
                        </div>
                      )}
                      {s.internalRemarks && (
                        <div className="truncate text-slate-500">
                          <strong>Int:</strong> {s.internalRemarks}
                        </div>
                      )}
                      {!s.truckingCompanyRemarks &&
                        !s.customerRemarks &&
                        !s.internalRemarks &&
                        '-'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Direct PDF Download Button */}
                        <button
                          type="button"
                          onClick={() => handleDownloadTruckingPdf(s)}
                          disabled={downloadingId === s.id}
                          className="px-2.5 py-1 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded flex items-center gap-1 shadow-xs transition-colors"
                          title="Download Waybill PDF"
                        >
                          <Download className="w-3 h-3" />
                          <span>PDF</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPrintableSheet(s)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                          title="Print Waybill / Dispatch Order"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(s)}
                          className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded"
                          title="Edit Sheet"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(s.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="Delete Sheet"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Offscreen / Printable Trucking Dispatch Sheet PDF */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0, opacity: 0, pointerEvents: 'none' }}>
        {pdfSheet && (
          <div
            ref={sheetPrintRef}
            className="bg-white p-10 max-w-2xl text-slate-900 font-sans border border-slate-300"
            style={{ width: '800px', minHeight: '900px' }}
          >
            <div className="border-b-2 border-slate-900 pb-4 mb-6 flex items-start justify-between">
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  YOKOHAMA TRADING & LOGISTICS
                </h1>
                <div className="text-sm font-semibold text-slate-700">横浜トレーディング株式会社</div>
                <div className="text-xs text-slate-500 mt-1">
                  Automotive Overland Transport & Terminal Dispatch Dept.
                </div>
                <div className="text-xs text-slate-600 font-mono mt-0.5">Corporate Reg: T9120001213448</div>
              </div>
              <JapaneseSeal size="md" text="横浜トレーディング株式会社印" />
            </div>

            <div className="mb-6 pb-2 border-b border-slate-200 flex items-center justify-between">
              <div className="text-base font-extrabold uppercase text-slate-900">
                TRUCKING DISPATCH ORDER / 陸送依頼指示書
              </div>
              <div className="text-xs font-mono text-slate-500">
                Sheet No: <strong className="text-slate-900">{pdfSheet.sheetNumber}</strong>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="border p-4 rounded-lg bg-slate-50/50 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Billing Classification</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {pdfSheet.isNonBillable ? 'NON-BILLABLE TRANSPORT' : 'BILLABLE COMMERCIAL ORDER'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Issue Date</div>
                  <div className="text-sm font-semibold text-slate-800 mt-0.5">{pdfSheet.pickupDate}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Customer Company</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{pdfSheet.customerCompany}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Shipper Company</div>
                  <div className="text-sm font-semibold text-slate-800 mt-0.5">{pdfSheet.shipperCompany}</div>
                </div>
              </div>

              <div className="border p-4 rounded-lg bg-sky-50/50 space-y-3">
                <div className="text-[10px] font-bold text-sky-800 uppercase">Assigned Trucking Carrier</div>
                <div className="text-base font-bold text-slate-900">{pdfSheet.truckingCompany}</div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-sky-100">
                  <div>
                    <span className="text-slate-500">Scheduled Pickup:</span>{' '}
                    <strong className="text-slate-900">{pdfSheet.pickupDate}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Scheduled Delivery:</span>{' '}
                    <strong className="text-slate-900">{pdfSheet.deliveryDate}</strong>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">PICKUP LOCATION</div>
                  <div className="text-xs font-semibold text-slate-900 mt-1">{pdfSheet.pickupLocation}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">DELIVERY LOCATION</div>
                  <div className="text-xs font-semibold text-slate-900 mt-1">{pdfSheet.deliveryLocation}</div>
                </div>
              </div>

              {(pdfSheet.auctionBuyer || pdfSheet.posNumber) && (
                <div className="grid grid-cols-2 gap-4 border p-3 rounded-lg">
                  <div>
                    <span className="text-slate-500">Auction Buyer Member:</span>{' '}
                    <strong>{pdfSheet.auctionBuyer || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">POS Number:</span>{' '}
                    <strong className="font-mono">{pdfSheet.posNumber || '-'}</strong>
                  </div>
                </div>
              )}

              <div className="border p-4 rounded-lg space-y-2 bg-slate-50/50">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Dispatch Remarks & Coordination Notes</div>
                {pdfSheet.truckingCompanyRemarks && (
                  <div>
                    <strong className="text-slate-700">Carrier Remarks:</strong> {pdfSheet.truckingCompanyRemarks}
                  </div>
                )}
                {pdfSheet.customerRemarks && (
                  <div>
                    <strong className="text-slate-700">Customer Remarks:</strong> {pdfSheet.customerRemarks}
                  </div>
                )}
                {pdfSheet.internalRemarks && (
                  <div>
                    <strong className="text-slate-700">Internal Operations:</strong> {pdfSheet.internalRemarks}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-12 pt-4 border-t-2 border-slate-300 flex items-end justify-between text-[11px] text-slate-500">
              <div>
                Driver / Carrier Receipt Stamp: ____________________
              </div>
              <div>
                Yokohama Trading Dispatch Coordinator
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Sheet Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden my-6 border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-sky-700" />
                <h3 className="text-lg font-bold text-slate-900">
                  {editingSheet ? 'Edit Trucking Sheet' : 'Add Trucking Sheet'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Sheet Reference Number
                  </label>
                  <input
                    type="text"
                    value={sheetNumber}
                    onChange={(e) => setSheetNumber(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isNonBillable}
                      onChange={(e) => setIsNonBillable(e.target.checked)}
                      className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500 border-slate-300"
                    />
                    <span className="text-xs font-bold text-slate-800 uppercase">
                      Is Non Billable
                    </span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Customer Company
                  </label>
                  <input
                    type="text"
                    
                    list="ts-cust-list"
                    value={customerCompany}
                    onChange={(e) => setCustomerCompany(e.target.value)}
                    placeholder="Customer Company"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                  <datalist id="ts-cust-list">
                    {customers.map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Shipper Company
                  </label>
                  <input
                    type="text"
                    
                    list="ts-ship-list"
                    value={shipperCompany}
                    onChange={(e) => setShipperCompany(e.target.value)}
                    placeholder="Shipper Company"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                  <datalist id="ts-ship-list">
                    {shippers.map((s) => (
                      <option key={s.id} value={s.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Trucking Company
                  </label>
                  <input
                    type="text"
                    
                    list="ts-trk-list"
                    value={truckingCompany}
                    onChange={(e) => setTruckingCompany(e.target.value)}
                    placeholder="Trucking Company"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                  <datalist id="ts-trk-list">
                    {truckingCompanies.map((t) => (
                      <option key={t.id} value={t.companyNameEn} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Pickup Date
                  </label>
                  <input
                    type="date"
                    
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Delivery Date
                  </label>
                  <input
                    type="date"
                    
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Pickup Location
                  </label>
                  <input
                    type="text"
                    
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    placeholder="e.g. USS Tokyo Auction Yard, Noda, Chiba"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Delivery Location
                  </label>
                  <input
                    type="text"
                    
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                    placeholder="e.g. Nagoya Tobishima Yard"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    AUCTION BUYER
                  </label>
                  <input
                    type="text"
                    value={auctionBuyer}
                    onChange={(e) => setAuctionBuyer(e.target.value)}
                    placeholder="e.g. Buyer Member #39012"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    POS NUMBER
                  </label>
                  <input
                    type="text"
                    value={posNumber}
                    onChange={(e) => setPosNumber(e.target.value)}
                    placeholder="e.g. POS-8921-TK"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Trucking Company Remarks
                  </label>
                  <input
                    type="text"
                    value={truckingCompanyRemarks}
                    onChange={(e) => setTruckingCompanyRemarks(e.target.value)}
                    placeholder="Notes for or from trucking company / car carrier"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Customer Remarks
                  </label>
                  <input
                    type="text"
                    value={customerRemarks}
                    onChange={(e) => setCustomerRemarks(e.target.value)}
                    placeholder="Customer requirements, gate arrival times"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Internal Remarks
                  </label>
                  <input
                    type="text"
                    value={internalRemarks}
                    onChange={(e) => setInternalRemarks(e.target.value)}
                    placeholder="Driver phone, toll slip, dispatch coordination notes"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-xs"
                >
                  {editingSheet ? 'Save Changes' : 'Create Trucking Sheet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Dispatch Sheet Modal */}
      {printableSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-6 border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">
                Trucking Dispatch Order / 陸送依頼書
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadTruckingPdf(printableSheet)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg shadow-xs"
                >
                  Print
                </button>
                <button
                  type="button"
                  onClick={() => setPrintableSheet(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6 text-xs text-slate-800">
              <div className="flex items-start justify-between border-b pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    TRUCKING WAYBILL / 自動車輸送指示書
                  </h2>
                  <div className="font-mono text-slate-600 mt-1">
                    Sheet No: {printableSheet.sheetNumber}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">
                    {printableSheet.isNonBillable ? 'NON-BILLABLE' : 'BILLABLE ORDER'}
                  </div>
                  <div className="text-slate-500">Issued: {printableSheet.pickupDate}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg bg-slate-50">
                <div>
                  <div className="font-bold text-slate-500 uppercase">Customer</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">
                    {printableSheet.customerCompany}
                  </div>
                </div>
                <div>
                  <div className="font-bold text-slate-500 uppercase">Shipper</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">
                    {printableSheet.shipperCompany}
                  </div>
                </div>
              </div>

              <div className="border p-4 rounded-lg space-y-3">
                <div className="font-bold text-sky-800 uppercase">Assigned Carrier</div>
                <div className="font-bold text-base text-slate-900">
                  {printableSheet.truckingCompany}
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <span className="text-slate-500">Pickup Date:</span>{' '}
                    <strong className="text-slate-900">{printableSheet.pickupDate}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Delivery Date:</span>{' '}
                    <strong className="text-slate-900">{printableSheet.deliveryDate}</strong>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <span className="text-slate-500">Pickup Location:</span>
                    <div className="font-semibold text-slate-900">
                      {printableSheet.pickupLocation}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Delivery Location:</span>
                    <div className="font-semibold text-slate-900">
                      {printableSheet.deliveryLocation}
                    </div>
                  </div>
                </div>
              </div>

              {(printableSheet.auctionBuyer || printableSheet.posNumber) && (
                <div className="grid grid-cols-2 gap-4 border p-3 rounded-lg">
                  <div>
                    <span className="text-slate-500">Auction Buyer:</span>{' '}
                    <strong>{printableSheet.auctionBuyer || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">POS Number:</span>{' '}
                    <strong className="font-mono">{printableSheet.posNumber || '-'}</strong>
                  </div>
                </div>
              )}

              <div className="border p-3 rounded-lg space-y-2 bg-slate-50/50">
                {printableSheet.truckingCompanyRemarks && (
                  <div>
                    <strong className="text-slate-700">Trucking Remarks:</strong>{' '}
                    {printableSheet.truckingCompanyRemarks}
                  </div>
                )}
                {printableSheet.customerRemarks && (
                  <div>
                    <strong className="text-slate-700">Customer Remarks:</strong>{' '}
                    {printableSheet.customerRemarks}
                  </div>
                )}
                {printableSheet.internalRemarks && (
                  <div>
                    <strong className="text-slate-700">Internal Remarks:</strong>{' '}
                    {printableSheet.internalRemarks}
                  </div>
                )}
              </div>

              <div className="pt-6 border-t flex items-end justify-between text-[11px] text-slate-500">
                <div>
                  Driver Sign / 受領印: ____________________
                </div>
                <div>
                  Yokohama Logistics Dispatch Center
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4 border border-slate-200">
            <h4 className="text-base font-bold text-slate-900">Confirm Deletion</h4>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete this trucking sheet?
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteSheet(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
