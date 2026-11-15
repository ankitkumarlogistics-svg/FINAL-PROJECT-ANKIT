import React, { useState, useMemo, useRef } from 'react';
import { StockItem, Customer, Shipper, MasterData } from '../types';
import {
  Car,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  Edit2,
  Trash2,
  X,
  Warehouse,
  Calendar,
  MapPin,
  CheckCircle,
  Clock,
  Truck,
  Ship,
  AlertTriangle,
  Download,
  Printer,
  FileText,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { downloadElementAsPdf } from '../utils/pdfExport';
import { JapaneseSeal } from './JapaneseSeal';

interface StockManagementProps {
  stocks: StockItem[];
  customers: Customer[];
  shippers: Shipper[];
  masters: MasterData;
  onSaveStock: (stock: StockItem) => void;
  onDeleteStock: (id: string) => void;
}

export const StockManagement: React.FC<StockManagementProps> = ({
  stocks,
  customers,
  shippers,
  masters,
  onSaveStock,
  onDeleteStock,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterYard, setFilterYard] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<StockItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Active stock item for PDF export
  const [pdfStock, setPdfStock] = useState<StockItem | null>(null);
  const stockPrintRef = useRef<HTMLDivElement>(null);

  // Form State with exact  fields marked with *
  const [chassisNumber, setChassisNumber] = useState('');
  const [engineNumber, setEngineNumber] = useState('');
  const [auctionNumber, setAuctionNumber] = useState('');
  const [customerStockNumber, setCustomerStockNumber] = useState('');
  const [customerCompany, setCustomerCompany] = useState('');
  const [shipperCompany, setShipperCompany] = useState('');
  const [color, setColor] = useState('');
  const [model, setModel] = useState('');
  const [portTo, setPortTo] = useState('');
  const [destination, setDestination] = useState('');
  const [yardIn, setYardIn] = useState('');
  const [yardOut, setYardOut] = useState('');
  const [yardName, setYardName] = useState('');
  const [yardPosition, setYardPosition] = useState('');
  const [status, setStatus] = useState('IN YARD');
  const [remarks, setRemarks] = useState('');

  const openAddModal = () => {
    setEditingStock(null);
    setChassisNumber('');
    setEngineNumber('');
    setAuctionNumber('');
    setCustomerStockNumber('');
    setCustomerCompany(customers[0]?.name || '');
    setShipperCompany(shippers[0]?.name || 'YOKOHAMA TRADING & LOGISTICS CO., LTD.');
    setColor(masters.vehicleColors[0] || 'PEARL WHITE (070)');
    setModel(masters.makeModels[0] || '');
    setPortTo(masters.portNames[0] || 'NAGOYA, JAPAN');
    setDestination(masters.destinations[0] || 'DUBLIN, IRELAND');
    setYardIn(new Date().toISOString().split('T')[0]);
    setYardOut('');
    setYardName('Nagoya Tobishima Yard');
    setYardPosition('');
    setStatus('IN YARD');
    setRemarks('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: StockItem) => {
    setEditingStock(item);
    setChassisNumber(item.chassisNumber || '');
    setEngineNumber(item.engineNumber || '');
    setAuctionNumber(item.auctionNumber || '');
    setCustomerStockNumber(item.customerStockNumber || '');
    setCustomerCompany(item.customerCompany || '');
    setShipperCompany(item.shipperCompany || '');
    setColor(item.color || '');
    setModel(item.model || '');
    setPortTo(item.portTo || '');
    setDestination(item.destination || '');
    setYardIn(item.yardIn || '');
    setYardOut(item.yardOut || '');
    setYardName(item.yardName || '');
    setYardPosition(item.yardPosition || '');
    setStatus(item.status || 'IN YARD');
    setRemarks(item.remarks || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chassisNumber.trim()) {
      alert('Chassis Number is ');
      return;
    }
    if (!customerCompany.trim()) {
      alert('Customer Company Name is ');
      return;
    }
    if (!shipperCompany.trim()) {
      alert('Shipper Company is ');
      return;
    }
    if (!model.trim()) {
      alert('Model is ');
      return;
    }
    if (!status.trim()) {
      alert('Status is ');
      return;
    }

    const itemToSave: StockItem = {
      id: editingStock ? editingStock.id : `stk-${Date.now()}`,
      chassisNumber: chassisNumber.trim().toUpperCase(),
      engineNumber: engineNumber.trim().toUpperCase(),
      auctionNumber: auctionNumber.trim(),
      customerStockNumber: customerStockNumber.trim(),
      customerCompany: customerCompany.trim(),
      shipperCompany: shipperCompany.trim(),
      color: color.trim(),
      model: model.trim(),
      portTo: portTo.trim(),
      destination: destination.trim(),
      yardIn: yardIn.trim(),
      yardOut: yardOut.trim(),
      yardName: yardName.trim(),
      yardPosition: yardPosition.trim(),
      status: status.trim(),
      remarks: remarks.trim(),
      createdAt: editingStock ? editingStock.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveStock(itemToSave);
    setIsModalOpen(false);
  };

  const filteredStocks = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return stocks.filter((s) => {
      const matchesSearch =
        s.chassisNumber.toLowerCase().includes(q) ||
        s.model.toLowerCase().includes(q) ||
        s.customerCompany.toLowerCase().includes(q) ||
        s.shipperCompany.toLowerCase().includes(q) ||
        s.auctionNumber.toLowerCase().includes(q) ||
        s.customerStockNumber.toLowerCase().includes(q) ||
        s.yardName.toLowerCase().includes(q) ||
        s.destination.toLowerCase().includes(q);

      const matchesStatus = filterStatus === 'ALL' || s.status === filterStatus;
      const matchesYard = filterYard === 'ALL' || s.yardName === filterYard;

      return matchesSearch && matchesStatus && matchesYard;
    });
  }, [stocks, searchTerm, filterStatus, filterYard]);

  const uniqueYards = useMemo(() => {
    const set = new Set<string>();
    stocks.forEach((s) => {
      if (s.yardName) set.add(s.yardName);
    });
    return Array.from(set);
  }, [stocks]);

  const handleExportExcel = () => {
    const data = filteredStocks.map((s) => ({
      'Chassis Number': s.chassisNumber,
      Model: s.model,
      Color: s.color,
      Status: s.status,
      'Customer Company': s.customerCompany,
      'Shipper Company': s.shipperCompany,
      'Auction Number': s.auctionNumber,
      'Customer Stock #': s.customerStockNumber,
      'Yard Name': s.yardName,
      'Yard Position': s.yardPosition,
      'Yard In': s.yardIn,
      'Yard Out': s.yardOut,
      'Port To': s.portTo,
      Destination: s.destination,
      'Engine Number': s.engineNumber,
      Remarks: s.remarks,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock_Inventory');
    XLSX.writeFile(wb, `Stock_Inventory_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Direct PDF Download for Stock Receipt Slip
  const handleDownloadStockPdf = async (item: StockItem) => {
    setDownloadingId(item.id);
    setPdfStock(item);
    await new Promise((r) => setTimeout(r, 80));
    if (stockPrintRef.current) {
      await downloadElementAsPdf({
        element: stockPrintRef.current,
        filename: `Vehicle_Stock_Slip_${item.chassisNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      });
    }
    setDownloadingId(null);
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'IN YARD':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'INSPECTED':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'DISPATCHED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'SHIPPED':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'AUCTION':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-sky-800 text-xs font-bold uppercase tracking-wider">
            <Car className="w-4 h-4 text-sky-600" />
            <span>Yard Inventory</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Vehicle Stock Inventory
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Track chassis numbers, yard in/out, auction refs, and logistics clearance status with instant PDF slips.
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
            <span>Add Stock</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Chassis #, Model, Customer, Auction #..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
          />
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="IN YARD">IN YARD</option>
            <option value="INSPECTED">INSPECTED</option>
            <option value="DISPATCHED">DISPATCHED</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="AUCTION">AUCTION</option>
            <option value="PENDING">PENDING</option>
          </select>
        </div>

        <div>
          <select
            value={filterYard}
            onChange={(e) => setFilterYard(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
          >
            <option value="ALL">All Yard Locations</option>
            {uniqueYards.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1050px]">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
                <th className="py-3 px-4">Chassis Number</th>
                <th className="py-3 px-4">Model & Color</th>
                <th className="py-3 px-4">Customer* & Shipper*</th>
                <th className="py-3 px-4">Yard Location & In/Out</th>
                <th className="py-3 px-4">Destination / Port To</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No vehicle stock found.
                  </td>
                </tr>
              ) : (
                filteredStocks.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span>{s.chassisNumber}</span>
                      </div>
                      {s.engineNumber && (
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                          Eng: {s.engineNumber}
                        </div>
                      )}
                      {s.auctionNumber && (
                        <div className="text-[10px] text-amber-700 font-normal">
                          Auc: {s.auctionNumber}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{s.model}</div>
                      <div className="text-slate-500 text-[11px]">{s.color || 'Standard'}</div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="font-medium text-slate-900">{s.customerCompany}</div>
                      <div className="text-slate-400 text-[11px]">Shipper: {s.shipperCompany}</div>
                      {s.customerStockNumber && (
                        <div className="text-[10px] text-sky-700">Ref: {s.customerStockNumber}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center gap-1 font-medium text-slate-800">
                        <Warehouse className="w-3 h-3 text-slate-400" />
                        <span>{s.yardName || '-'}</span>
                      </div>
                      {s.yardPosition && (
                        <div className="text-[11px] text-slate-500">Pos: {s.yardPosition}</div>
                      )}
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        In: {s.yardIn || '-'} {s.yardOut ? `| Out: ${s.yardOut}` : ''}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="font-medium text-slate-800">{s.destination || '-'}</div>
                      <div className="text-slate-400 text-[11px]">Port: {s.portTo || '-'}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded border ${getStatusBadge(
                          s.status
                        )}`}
                      >
                        {s.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Direct PDF Download Button */}
                        <button
                          type="button"
                          onClick={() => handleDownloadStockPdf(s)}
                          disabled={downloadingId === s.id}
                          className="px-2.5 py-1 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded flex items-center gap-1 shadow-xs transition-colors"
                          title="Download Vehicle Yard Receipt PDF"
                        >
                          <Download className="w-3 h-3" />
                          <span>PDF</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(s)}
                          className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded"
                          title="Edit Stock"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(s.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="Delete Stock"
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

      {/* Offscreen / Printable Stock Yard Receipt PDF */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0, opacity: 0, pointerEvents: 'none' }}>
        {pdfStock && (
          <div
            ref={stockPrintRef}
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
                  Automotive Storage, Yard Clearance & Export Terminal Service
                </div>
                <div className="text-xs text-slate-600 font-mono mt-0.5">Corporate Reg: T9120001213448</div>
              </div>
              <JapaneseSeal size="md" text="横浜トレーディング株式会社印" />
            </div>

            <div className="mb-6 pb-2 border-b border-slate-200 flex items-center justify-between">
              <div className="text-base font-extrabold uppercase text-slate-900">
                VEHICLE YARD RECEIPT & INSPECTION SLIP / 車両保管票
              </div>
              <div className="text-xs font-mono text-slate-500">
                Issued: {new Date().toISOString().split('T')[0]}
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="border p-4 rounded-lg bg-sky-50/60 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-sky-800 uppercase">Chassis Number</div>
                  <div className="text-lg font-mono font-extrabold text-slate-900 mt-0.5">
                    {pdfStock.chassisNumber}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Storage Status</div>
                  <div className="inline-block px-3 py-1 bg-white font-bold text-slate-900 border rounded mt-0.5">
                    {pdfStock.status}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Make & Model</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">{pdfStock.model}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Vehicle Color</div>
                  <div className="text-sm font-semibold text-slate-800 mt-0.5">{pdfStock.color || 'Standard'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Engine Number</div>
                  <div className="text-sm font-mono text-slate-800 mt-0.5">{pdfStock.engineNumber || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Auction Reference</div>
                  <div className="text-sm font-semibold text-slate-800 mt-0.5">{pdfStock.auctionNumber || 'Direct Purchase'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Customer Company</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{pdfStock.customerCompany}</div>
                  {pdfStock.customerStockNumber && (
                    <div className="text-xs text-sky-700 mt-0.5">Ref: {pdfStock.customerStockNumber}</div>
                  )}
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Shipper Company</div>
                  <div className="text-sm font-semibold text-slate-800 mt-0.5">{pdfStock.shipperCompany}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg bg-slate-50">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Yard Name & Position</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{pdfStock.yardName || '-'}</div>
                  <div className="text-xs text-slate-600">Spot: {pdfStock.yardPosition || 'General Lot'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Yard Movement Dates</div>
                  <div className="text-xs text-slate-800 mt-0.5">In Date: <strong>{pdfStock.yardIn || '-'}</strong></div>
                  <div className="text-xs text-slate-800 mt-0.5">Out Date: <strong>{pdfStock.yardOut || 'Present in Yard'}</strong></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Destination Port</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{pdfStock.destination || '-'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Origin Port</div>
                  <div className="text-sm font-semibold text-slate-800 mt-0.5">{pdfStock.portTo || '-'}</div>
                </div>
              </div>

              {pdfStock.remarks && (
                <div className="border p-4 rounded-lg bg-slate-50/50">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Inspection & Vehicle Condition Remarks</div>
                  <div className="text-xs text-slate-700 mt-1">{pdfStock.remarks}</div>
                </div>
              )}
            </div>

            <div className="mt-12 pt-4 border-t-2 border-slate-300 flex items-end justify-between text-[11px] text-slate-500">
              <div>
                Yard Master / Security Clearance Section
              </div>
              <div className="text-center">
                <div className="w-36 border-b border-slate-400 mb-1"></div>
                <span className="font-semibold text-slate-700">Authorized Gate Pass</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Stock Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden my-6 border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-sky-700" />
                <h3 className="text-lg font-bold text-slate-900">
                  {editingStock ? 'Edit Stock Record' : 'Add Vehicle Stock'}
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
                    Chassis Number
                  </label>
                  <input
                    type="text"
                    
                    value={chassisNumber}
                    onChange={(e) => setChassisNumber(e.target.value)}
                    placeholder="e.g. ZVW50-1092834"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Engine Number
                  </label>
                  <input
                    type="text"
                    value={engineNumber}
                    onChange={(e) => setEngineNumber(e.target.value)}
                    placeholder="e.g. 2ZR-FXE-99120"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Auction Number
                  </label>
                  <input
                    type="text"
                    value={auctionNumber}
                    onChange={(e) => setAuctionNumber(e.target.value)}
                    placeholder="e.g. USS Tokyo #50921"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Customer Stock Number
                  </label>
                  <input
                    type="text"
                    value={customerStockNumber}
                    onChange={(e) => setCustomerStockNumber(e.target.value)}
                    placeholder="e.g. CUST-HB-901"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Customer Company Name
                  </label>
                  <input
                    type="text"
                    
                    list="customer-list-opt"
                    value={customerCompany}
                    onChange={(e) => setCustomerCompany(e.target.value)}
                    placeholder="Select or enter customer"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                  <datalist id="customer-list-opt">
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
                    
                    list="shipper-list-opt"
                    value={shipperCompany}
                    onChange={(e) => setShipperCompany(e.target.value)}
                    placeholder="Select or enter shipper"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                  <datalist id="shipper-list-opt">
                    {shippers.map((s) => (
                      <option key={s.id} value={s.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    
                    list="model-list-opt"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. TOYOTA PRIUS"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                  <datalist id="model-list-opt">
                    {masters.makeModels.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Color
                  </label>
                  <input
                    type="text"
                    list="color-list-opt"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="e.g. PEARL WHITE (070)"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                  <datalist id="color-list-opt">
                    {masters.vehicleColors.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Port To
                  </label>
                  <input
                    type="text"
                    list="port-list-opt"
                    value={portTo}
                    onChange={(e) => setPortTo(e.target.value)}
                    placeholder="e.g. NAGOYA, JAPAN"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                  <datalist id="port-list-opt">
                    {masters.portNames.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Destination
                  </label>
                  <input
                    type="text"
                    list="dest-list-opt"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. DUBLIN, IRELAND"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                  <datalist id="dest-list-opt">
                    {masters.destinations.map((d) => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Yard In (Date)
                  </label>
                  <input
                    type="date"
                    value={yardIn}
                    onChange={(e) => setYardIn(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Yard Out (Date)
                  </label>
                  <input
                    type="date"
                    value={yardOut}
                    onChange={(e) => setYardOut(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Yard Name
                  </label>
                  <input
                    type="text"
                    value={yardName}
                    onChange={(e) => setYardName(e.target.value)}
                    placeholder="e.g. Nagoya Tobishima Yard"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Yard Position
                  </label>
                  <input
                    type="text"
                    value={yardPosition}
                    onChange={(e) => setYardPosition(e.target.value)}
                    placeholder="e.g. Bay 14-Row 3"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Status
                  </label>
                  <select
                    
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white font-semibold"
                  >
                    <option value="IN YARD">IN YARD</option>
                    <option value="INSPECTED">INSPECTED</option>
                    <option value="DISPATCHED">DISPATCHED</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="AUCTION">AUCTION</option>
                    <option value="PENDING">PENDING</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  REMARKS
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Key location, condition, auction grades, or inspection notes"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
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
                  {editingStock ? 'Save Changes' : 'Save Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4 border border-slate-200">
            <h4 className="text-base font-bold text-slate-900">Confirm Deletion</h4>
            <p className="text-xs text-slate-600">
              Are you sure you want to remove this stock record from the inventory?
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
                  onDeleteStock(deleteConfirmId);
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
