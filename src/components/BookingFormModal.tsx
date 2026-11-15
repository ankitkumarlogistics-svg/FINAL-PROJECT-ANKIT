import React, { useState, useEffect, useCallback } from 'react';
import {
  BookingConfirmation,
  BookingStatus,
  CurrencyValueType,
  Customer,
  Shipper,
  Consignee,
  NotifyParty,
  MasterData,
} from '../types';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';
import { X, Sparkles, Building2, Ship, Calendar, PlusCircle, Check, ChevronDown, FileText } from 'lucide-react';

interface BookingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (booking: BookingConfirmation) => void;
  initialData?: BookingConfirmation | null;
  customers?: Customer[];
  shippers?: Shipper[];
  consignees?: Consignee[];
  notifyParties?: NotifyParty[];
  masters?: MasterData;
}

const INCOTERMS = ['FOB', 'CIF', 'CFR', 'EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'];

export const BookingFormModal: React.FC<BookingFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  customers = [],
  shippers = [],
  consignees = [],
  notifyParties = [],
  masters,
}) => {
  const [formData, setFormData] = useState<Partial<BookingConfirmation>>({
    bookingNumber: '',
    shipmentNo: '',
    blNo: '',
    status: 'CONFIRMED',
    date: new Date().toISOString().slice(0, 10),
    customerCompany: '',
    forwarderCompany: 'YOKOHAMA TRADING & LOGISTICS',
    shipperCompany: 'YOKOHAMA TRADING & LOGISTICS CO., LTD.',
    consigneeCompany: '',
    notifyParty: 'SAME AS CONSIGNEE',
    alsoNotifyParty: '',
    hasAlsoNotify: false,
    por: 'YOKOHAMA',
    pol: 'YOKOHAMA',
    fpod: 'DUBLIN (IE)',
    pod: 'DUBLIN',
    shippingCompany: 'CMA-CGM',
    vessel: 'CMA CGM ELBE',
    voyage: '0R11MW1MA',
    cyCutOpen: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
    docCyCut: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    cyCutDate: new Date(Date.now() + 6 * 86400000).toISOString().slice(0, 10),
    etd: new Date(Date.now() + 9 * 86400000).toISOString().slice(0, 10),
    eta: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
    cargoVolumeSize: "1 X 40' HC",
    containerCount: 1,
    containerSize: "40' HC",
    containerNumbers: '',
    commodity: 'USED VEHICLE',
    blType: 'ORIGINAL',
    freightTerm: 'PREPAID',
    blIssuePlace: 'TOKYO, JAPAN',
    showFullPartyDetails: false,
    shipperAddress: '2833-165 SAKASAI, BANDO-SHI, IBARAKI-KEN, JAPAN',
    shipperTel: '0280-33-3423',
    shipperTaxId: 'T9120001213448',
    consigneeAddress: '',
    consigneeTel: '',
    consigneeTaxId: '',
    notifyAddress: 'SAME AS CONSIGNEE',
    notifyTel: '',
    notifyTaxId: '',
    remarks: 'CUSTOM BY CUSTOMER >> DOC CUT / CY CUT ARRANGED AS PER SCHEDULE',
  });

  const [showAlsoNotify, setShowAlsoNotify] = useState(false);
  const [showFullPartyDetails, setShowFullPartyDetails] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsDirty(false);
      setShowUnsavedPrompt(false);
      return;
    }
    setIsDirty(false);
    setShowUnsavedPrompt(false);
    if (initialData) {
      setFormData(initialData);
      setShowAlsoNotify(!!initialData.alsoNotifyParty || !!initialData.hasAlsoNotify);
      setShowFullPartyDetails(!!initialData.showFullPartyDetails || !!initialData.shipperAddress || !!initialData.consigneeAddress);
    } else {
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      setFormData({
        bookingNumber: `TYO${randomNum}`,
        shipmentNo: `SHP-${new Date().getFullYear()}-${String(randomNum).slice(0, 4)}`,
        blNo: '',
        status: 'CONFIRMED',
        date: new Date().toISOString().slice(0, 10),
        customerCompany: customers[0]?.name || '',
        forwarderCompany: 'YOKOHAMA TRADING & LOGISTICS',
        shipperCompany: shippers[0]?.name || 'YOKOHAMA TRADING & LOGISTICS CO., LTD.',
        consigneeCompany: consignees[0]?.name || '',
        notifyParty: 'SAME AS CONSIGNEE',
        alsoNotifyParty: '',
        hasAlsoNotify: false,
        por: 'YOKOHAMA',
        pol: 'YOKOHAMA',
        fpod: masters?.finalDestinations[0] || 'DUBLIN (IE)',
        pod: 'DUBLIN',
        shippingCompany: masters?.shippingCompanies[0] || 'CMA-CGM',
        vessel: 'CMA CGM ELBE',
        voyage: '0R11MW1MA',
        cyCutOpen: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
        docCyCut: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
        cyCutDate: new Date(Date.now() + 6 * 86400000).toISOString().slice(0, 10),
        etd: new Date(Date.now() + 9 * 86400000).toISOString().slice(0, 10),
        eta: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
        cargoVolumeSize: "1 X 40' HC",
        containerCount: 1,
        containerSize: "40' HC",
        containerNumbers: '',
        commodity: 'USED VEHICLE',
        blType: 'ORIGINAL',
        freightTerm: 'PREPAID',
        blIssuePlace: 'TOKYO, JAPAN',
        showFullPartyDetails: false,
        shipperAddress: '2833-165 SAKASAI, BANDO-SHI, IBARAKI-KEN, JAPAN',
        shipperTel: '0280-33-3423',
        shipperTaxId: 'T9120001213448',
        consigneeAddress: '',
        consigneeTel: '',
        consigneeTaxId: '',
        notifyAddress: 'SAME AS CONSIGNEE',
        notifyTel: '',
        notifyTaxId: '',
        remarks: 'CUSTOM BY CUSTOMER >> DOC CUT / CY CUT AS PER SCHEDULE',
      });
      setShowAlsoNotify(false);
      setShowFullPartyDetails(false);
    }
  }, [initialData, isOpen]);

  const forceClose = useCallback(() => {
    setShowUnsavedPrompt(false);
    setIsDirty(false);
    onClose();
  }, [onClose]);

  const requestClose = useCallback(() => {
    if (isDirty) {
      setShowUnsavedPrompt(true);
    } else {
      forceClose();
    }
  }, [isDirty, forceClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showUnsavedPrompt) {
        e.preventDefault();
        e.stopPropagation();
        requestClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, showUnsavedPrompt, requestClose]);

  if (!isOpen) return null;

  const handleChange = (field: keyof BookingConfirmation, value: any) => {
    setIsDirty(true);
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleShipperSelect = (name: string) => {
    handleChange('shipperCompany', name);
    const found = shippers.find((s) => s.name.toLowerCase() === name.toLowerCase());
    if (found) {
      const fullAddr = [found.addressLine1, found.addressLine2].filter(Boolean).join(', ');
      handleChange('shipperAddress', fullAddr);
      handleChange('shipperTel', found.tel || found.email || '');
      handleChange('shipperTaxId', found.taxId || '');
    }
  };

  const handleConsigneeSelect = (name: string) => {
    handleChange('consigneeCompany', name);
    const found = consignees.find((c) => c.name.toLowerCase() === name.toLowerCase()) ||
                  customers.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (found) {
      const fullAddr = [found.addressLine1, found.addressLine2].filter(Boolean).join(', ');
      handleChange('consigneeAddress', fullAddr);
      handleChange('consigneeTel', found.tel || found.email || '');
      handleChange('consigneeTaxId', found.taxId || '');
    }
  };

  const handleNotifySelect = (name: string) => {
    handleChange('notifyParty', name);
    if (name === 'SAME AS CONSIGNEE') {
      handleChange('notifyAddress', 'SAME AS CONSIGNEE');
      handleChange('notifyTel', '');
      handleChange('notifyTaxId', '');
      return;
    }
    const found = notifyParties.find((n) => n.name.toLowerCase() === name.toLowerCase());
    if (found) {
      const fullAddr = [found.addressLine1, found.addressLine2].filter(Boolean).join(', ');
      handleChange('notifyAddress', fullAddr);
      handleChange('notifyTel', found.tel || found.email || '');
      handleChange('notifyTaxId', found.taxId || '');
    }
  };

  const handleContainerCountChange = (cnt: number) => {
    const count = Math.max(1, cnt);
    const size = formData.containerSize || "40' HC";
    handleChange('containerCount', count);
    handleChange('cargoVolumeSize', `${count} X ${size}`);
  };

  const handleContainerSizeChange = (size: string) => {
    const count = formData.containerCount || 1;
    handleChange('containerSize', size);
    handleChange('cargoVolumeSize', `${count} X ${size}`);
  };

  const handleQuickNumber = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    setFormData((prev) => ({ ...prev, bookingNumber: `TYO${randomNum}` }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fallbackBookingNo =
      formData.bookingNumber || `TYO${Math.floor(100000 + Math.random() * 900000)}`;
    const fallbackCustomer = formData.customerCompany || 'General Customer';

    const now = new Date().toISOString();
    const finalRecord: BookingConfirmation = {
      ...(formData as BookingConfirmation),
      id: initialData?.id || `bkg-${Date.now()}`,
      bookingNumber: fallbackBookingNo,
      customerCompany: fallbackCustomer,
      cyCutOpen: formData.cyCutOpen || formData.cyOpenDate || '',
      docCyCut: formData.docCyCut || '',
      cyOpenDate: formData.cyCutOpen || formData.cyOpenDate || '',
      por: formData.por || '',
      pol: formData.pol || '',
      fpod: formData.fpod || '',
      pod: formData.pod || '',
      blType: formData.blType || 'ORIGINAL',
      freightTerm: formData.freightTerm || 'PREPAID',
      blIssuePlace: formData.blIssuePlace || 'TOKYO, JAPAN',
      alsoNotifyParty: showAlsoNotify ? formData.alsoNotifyParty || '' : '',
      hasAlsoNotify: showAlsoNotify && !!formData.alsoNotifyParty,
      createdAt: initialData?.createdAt || now,
      updatedAt: now,
    };

    onSave(finalRecord);
    forceClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) requestClose();
        }}
      >
        <div
          className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl my-auto overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-slate-50 shrink-0">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {initialData ? 'Edit Shipping & Booking Confirmation' : 'New Shipping / Booking Order (Module 2)'}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Enter Shipper, Consignee, Notify, Commercial Value, FPOD/POD, and Schedule
              </p>
            </div>
            <button
              type="button"
              onClick={requestClose}
              aria-label="Close modal"
              className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} onChange={() => setIsDirty(true)} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 text-xs">
            {/* Top row: Booking No, Date, Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Booking No
                  </label>
                  <button
                    type="button"
                    onClick={handleQuickNumber}
                    className="text-[11px] text-sky-700 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Sparkles className="w-3 h-3" /> Auto
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.bookingNumber || ''}
                  onChange={(e) => handleChange('bookingNumber', e.target.value.toUpperCase())}
                  placeholder="e.g. TYO0799646"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Booking Date
                </label>
                <input
                  type="date"
                  value={formData.date || ''}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Booking Status
                </label>
                <select
                  value={formData.status || 'CONFIRMED'}
                  onChange={(e) => handleChange('status', e.target.value as BookingStatus)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-semibold bg-white"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            </div>

            {/* Linked Reference Row: Shipment No & B/L No */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Shipment No (Linked across Quotation, Invoice &amp; SL Pay)
                </label>
                <input
                  type="text"
                  value={formData.shipmentNo || ''}
                  onChange={(e) => handleChange('shipmentNo', e.target.value.toUpperCase())}
                  placeholder="e.g. SHP-2026-001"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  B/L Number (Optional / Auto-synced)
                </label>
                <input
                  type="text"
                  value={formData.blNo || ''}
                  onChange={(e) => handleChange('blNo', e.target.value.toUpperCase())}
                  placeholder="e.g. CMAU0799646"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono font-semibold"
                />
              </div>
            </div>

            {/* Customer Entity */}
            <div className="border-t border-slate-200 pt-4">
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Customer Name / Account
              </label>
              <input
                type="text"
                
                list="bkg-customer-list"
                value={formData.customerCompany || ''}
                onChange={(e) => handleChange('customerCompany', e.target.value)}
                placeholder="Select or enter customer"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-semibold"
              />
              <datalist id="bkg-customer-list">
                {customers.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>

            {/* Module 2: Shipper & Consignee */}
            <div className="border-t border-slate-200 pt-4 space-y-4">
              <h4 className="font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-sky-600" />
                <span>Module 2: Shipper & Consignee</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    SHIPPER
                  </label>
                  <input
                    type="text"
                    list="bkg-shipper-list"
                    value={formData.shipperCompany || ''}
                    onChange={(e) => handleShipperSelect(e.target.value)}
                    placeholder="Enter or select Shipper"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-semibold"
                  />
                  <datalist id="bkg-shipper-list">
                    {shippers.map((s) => (
                      <option key={s.id} value={s.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    CONSIGNEE
                  </label>
                  <input
                    type="text"
                    list="bkg-consignee-list"
                    value={formData.consigneeCompany || ''}
                    onChange={(e) => handleConsigneeSelect(e.target.value)}
                    placeholder="Enter or select Consignee"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-semibold"
                  />
                  <datalist id="bkg-consignee-list">
                    {consignees.map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Notify Party */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 uppercase">
                    NOTIFY (Also Notify)
                  </label>
                  <button
                    type="button"
                    onClick={() => handleNotifySelect('SAME AS CONSIGNEE')}
                    className="text-[11px] text-sky-700 hover:underline font-semibold"
                  >
                    Set &quot;SAME AS CONSIGNEE&quot;
                  </button>
                </div>
                <input
                  type="text"
                  list="bkg-notify-list"
                  value={formData.notifyParty || ''}
                  onChange={(e) => handleNotifySelect(e.target.value)}
                  placeholder="SAME AS CONSIGNEE or specific Notify Party"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
                <datalist id="bkg-notify-list">
                  {notifyParties.map((n) => (
                    <option key={n.id} value={n.name} />
                  ))}
                </datalist>
              </div>

              {/* Full Party Details Toggle: For Customer Booking Confirmation */}
              <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showFullPartyDetails}
                      onChange={(e) => {
                        setShowFullPartyDetails(e.target.checked);
                        handleChange('showFullPartyDetails', e.target.checked);
                      }}
                      className="w-4 h-4 text-sky-600 rounded border-slate-300"
                    />
                    <span className="font-bold text-sky-950 text-xs sm:text-sm">
                      Include Full Shipper, Consignee &amp; Notify Details on Customer Confirmation
                    </span>
                  </label>
                  <span className="text-[10px] text-sky-700 bg-sky-100 font-semibold px-2 py-0.5 rounded-full">
                    Customer Copy
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  When enabled, full address lines, telephone numbers, and Tax IDs are printed on the official Booking Confirmation.
                </p>

                {showFullPartyDetails && (
                  <div className="space-y-3 pt-2 border-t border-sky-200">
                    {/* Shipper Full Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 bg-white border border-slate-200 rounded-lg">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Shipper Full Address</label>
                        <input
                          type="text"
                          value={formData.shipperAddress || ''}
                          onChange={(e) => handleChange('shipperAddress', e.target.value)}
                          placeholder="2833-165 SAKASAI, BANDO-SHI, IBARAKI-KEN, JAPAN"
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Shipper TEL / Tax ID</label>
                        <div className="grid grid-cols-2 gap-1">
                          <input
                            type="text"
                            value={formData.shipperTel || ''}
                            onChange={(e) => handleChange('shipperTel', e.target.value)}
                            placeholder="TEL"
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
                          />
                          <input
                            type="text"
                            value={formData.shipperTaxId || ''}
                            onChange={(e) => handleChange('shipperTaxId', e.target.value)}
                            placeholder="Tax ID"
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Consignee Full Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 bg-white border border-slate-200 rounded-lg">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Consignee Full Address</label>
                        <input
                          type="text"
                          value={formData.consigneeAddress || ''}
                          onChange={(e) => handleChange('consigneeAddress', e.target.value)}
                          placeholder="Consignee complete street address, city, country..."
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Consignee TEL / Tax ID</label>
                        <div className="grid grid-cols-2 gap-1">
                          <input
                            type="text"
                            value={formData.consigneeTel || ''}
                            onChange={(e) => handleChange('consigneeTel', e.target.value)}
                            placeholder="TEL"
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
                          />
                          <input
                            type="text"
                            value={formData.consigneeTaxId || ''}
                            onChange={(e) => handleChange('consigneeTaxId', e.target.value)}
                            placeholder="Tax ID"
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Notify Full Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 bg-white border border-slate-200 rounded-lg">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Notify Full Address</label>
                        <input
                          type="text"
                          value={formData.notifyAddress || ''}
                          onChange={(e) => handleChange('notifyAddress', e.target.value)}
                          placeholder="SAME AS CONSIGNEE or specific Notify address..."
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Notify TEL / Tax ID</label>
                        <div className="grid grid-cols-2 gap-1">
                          <input
                            type="text"
                            value={formData.notifyTel || ''}
                            onChange={(e) => handleChange('notifyTel', e.target.value)}
                            placeholder="TEL"
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
                          />
                          <input
                            type="text"
                            value={formData.notifyTaxId || ''}
                            onChange={(e) => handleChange('notifyTaxId', e.target.value)}
                            placeholder="Tax ID"
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SOME TIME ALSO NOTIFY */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showAlsoNotify}
                      onChange={(e) => setShowAlsoNotify(e.target.checked)}
                      className="w-4 h-4 text-sky-600 rounded border-slate-300"
                    />
                    <span className="font-bold text-slate-800">
                      Include &quot;Also Notify&quot; (Rare / Conditional)
                    </span>
                  </label>
                  <span className="text-[10px] text-slate-500 italic">
                    (Used 1 in 1000 times — click to toggle)
                  </span>
                </div>

                {showAlsoNotify && (
                  <div className="pt-2 border-t border-slate-200">
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Secondary Also Notify Party Details
                    </label>
                    <input
                      type="text"
                      value={formData.alsoNotifyParty || ''}
                      onChange={(e) => handleChange('alsoNotifyParty', e.target.value)}
                      placeholder="Enter second Also Notify company name, contact, address..."
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Ports & Routing: POR, POL, POD, FPOD */}
            <div className="border-t border-slate-200 pt-4 space-y-4">
              <h4 className="font-bold uppercase tracking-wider text-slate-600">
                Ports &amp; Routing (Manual Entries)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    POR (Port of Receipt)
                  </label>
                  <input
                    type="text"
                    list="bkg-por-list"
                    value={formData.por || ''}
                    onChange={(e) => handleChange('por', e.target.value)}
                    placeholder="e.g. YOKOHAMA, TOKYO"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-semibold"
                  />
                  <datalist id="bkg-por-list">
                    <option value="YOKOHAMA" />
                    <option value="TOKYO" />
                    <option value="NAGOYA" />
                    <option value="OSAKA" />
                    <option value="KOBE" />
                    <option value="MOJI" />
                    <option value="HAKATA" />
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    POL (Port of Loading)
                  </label>
                  <input
                    type="text"
                    list="bkg-pol-list"
                    value={formData.pol || ''}
                    onChange={(e) => handleChange('pol', e.target.value)}
                    placeholder="e.g. YOKOHAMA, TOKYO"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-semibold"
                  />
                  <datalist id="bkg-pol-list">
                    <option value="YOKOHAMA" />
                    <option value="TOKYO" />
                    <option value="NAGOYA" />
                    <option value="OSAKA" />
                    <option value="KOBE" />
                    <option value="MOJI" />
                    <option value="HAKATA" />
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    POD (Port of Discharge)
                  </label>
                  <input
                    type="text"
                    list="bkg-pod-list"
                    value={formData.pod || ''}
                    onChange={(e) => handleChange('pod', e.target.value)}
                    placeholder="e.g. DUBLIN, MOMBASA"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-semibold"
                  />
                  <datalist id="bkg-pod-list">
                    {masters?.destinations.map((d) => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    FPOD (Final Port)
                  </label>
                  <input
                    type="text"
                    list="bkg-fpod-list"
                    value={formData.fpod || ''}
                    onChange={(e) => handleChange('fpod', e.target.value)}
                    placeholder="e.g. DUBLIN (IE), NAIROBI"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-semibold"
                  />
                  <datalist id="bkg-fpod-list">
                    {masters?.finalDestinations.map((f) => (
                      <option key={f} value={f} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>

            {/* Schedule & Vessel Details: BOOKING NO, VESSEL VOY CUT OFF ,ETD ,ETA, CY CUT OPEN, DOC CY CUT */}
            <div className="border-t border-slate-200 pt-4 space-y-4">
              <h4 className="font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Ship className="w-4 h-4 text-sky-600" />
                <span>Vessel / Voyage Schedule &amp; Cut-off Dates</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Shipping Company
                  </label>
                  <input
                    type="text"
                    list="bkg-carrier-list"
                    value={formData.shippingCompany || ''}
                    onChange={(e) => handleChange('shippingCompany', e.target.value)}
                    placeholder="Carrier line"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-semibold"
                  />
                  <datalist id="bkg-carrier-list">
                    {masters?.shippingCompanies.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Vessel Name
                  </label>
                  <input
                    type="text"
                    value={formData.vessel || ''}
                    onChange={(e) => handleChange('vessel', e.target.value)}
                    placeholder="e.g. CMA CGM ELBE"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Voyage (VOY)
                  </label>
                  <input
                    type="text"
                    value={formData.voyage || ''}
                    onChange={(e) => handleChange('voyage', e.target.value)}
                    placeholder="e.g. 0R11MW1MA"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              {/* Cut-off Dates: CY CUT OPEN, DOC CY CUT, CY CUT OFF */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1 text-emerald-800">
                    CY CUT OPEN
                  </label>
                  <input
                    type="date"
                    value={formData.cyCutOpen || formData.cyOpenDate || ''}
                    onChange={(e) => {
                      handleChange('cyCutOpen', e.target.value);
                      handleChange('cyOpenDate', e.target.value);
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1 text-amber-800">
                    DOC CY CUT
                  </label>
                  <input
                    type="date"
                    value={formData.docCyCut || ''}
                    onChange={(e) => handleChange('docCyCut', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1 text-rose-700">
                    CY CUT OFF (Cut Date)
                  </label>
                  <input
                    type="date"
                    value={formData.cyCutDate || ''}
                    onChange={(e) => handleChange('cyCutDate', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>
              </div>

              {/* Transit Schedule: ETD, ETA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    ETD (Estimated Departure)
                  </label>
                  <input
                    type="date"
                    value={formData.etd || ''}
                    onChange={(e) => handleChange('etd', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    ETA (Estimated Arrival)
                  </label>
                  <input
                    type="date"
                    value={formData.eta || ''}
                    onChange={(e) => handleChange('eta', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Container Quantity, Size & Container Numbers */}
              <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
                    <span>📦 Container Details & Quantity</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-slate-500 font-semibold mr-1">Quick Select:</span>
                    {[1, 2, 3, 4].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => handleContainerCountChange(cnt)}
                        className={`px-2.5 py-0.5 text-xs font-bold rounded border transition-colors ${
                          (formData.containerCount || 1) === cnt
                            ? 'bg-sky-600 text-white border-sky-700 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-sky-100'
                        }`}
                      >
                        {cnt} CONT
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Container Qty (Count)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.containerCount || 1}
                      onChange={(e) => handleContainerCountChange(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 text-sm font-bold text-slate-800 bg-white border border-sky-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Container Size / Type
                    </label>
                    <select
                      value={formData.containerSize || "40' HC"}
                      onChange={(e) => handleContainerSizeChange(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-semibold text-slate-800 bg-white border border-sky-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="40' HC">40' HC (High Cube)</option>
                      <option value="20' GP">20' GP (Standard)</option>
                      <option value="40' GP">40' GP (General)</option>
                      <option value="45' HC">45' HC (High Cube)</option>
                      <option value="40' REEFER">40' REEFER</option>
                      <option value="20' REEFER">20' REEFER</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Cargo Volume (Display)
                    </label>
                    <input
                      type="text"
                      value={formData.cargoVolumeSize || ''}
                      onChange={(e) => handleChange('cargoVolumeSize', e.target.value)}
                      placeholder="e.g. 3 X 40' HC"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Container Numbers (Separated by commas)
                    </label>
                    <input
                      type="text"
                      value={formData.containerNumbers || ''}
                      onChange={(e) => handleChange('containerNumbers', e.target.value)}
                      placeholder="e.g. MSCU1234567, TGHU7654321, TEMU9876543"
                      className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Commodity
                    </label>
                    <input
                      type="text"
                      value={formData.commodity || ''}
                      onChange={(e) => handleChange('commodity', e.target.value)}
                      placeholder="e.g. USED MOTOR VEHICLES"
                      className="w-full px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                    />
                  </div>
                </div>

                {/* Additional Shipping Specifications: Seal Numbers, Gross Weight, Volume (CBM), HS Code */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 border-t border-sky-200/60">
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-700 uppercase mb-1">
                      Seal Number(s)
                    </label>
                    <input
                      type="text"
                      value={formData.sealNumbers || ''}
                      onChange={(e) => handleChange('sealNumbers', e.target.value)}
                      placeholder="e.g. ML-JP048291"
                      className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-700 uppercase mb-1">
                      Gross Weight (KG)
                    </label>
                    <input
                      type="text"
                      value={formData.grossWeightKg || ''}
                      onChange={(e) => handleChange('grossWeightKg', e.target.value)}
                      placeholder="e.g. 14,250 KG"
                      className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-700 uppercase mb-1">
                      Volume (M3 / CBM)
                    </label>
                    <input
                      type="text"
                      value={formData.measurementCbm || ''}
                      onChange={(e) => handleChange('measurementCbm', e.target.value)}
                      placeholder="e.g. 68.4 CBM"
                      className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-700 uppercase mb-1">
                      HS / Tariff Code
                    </label>
                    <input
                      type="text"
                      value={formData.hsCode || ''}
                      onChange={(e) => handleChange('hsCode', e.target.value)}
                      placeholder="e.g. 8703.23"
                      className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* B/L Documentation & Freight Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    BL/TYPE (Bill of Lading)
                  </label>
                  <input
                    type="text"
                    list="bkg-bltype-list"
                    value={formData.blType || ''}
                    onChange={(e) => handleChange('blType', e.target.value)}
                    placeholder="e.g. ORIGINAL, WAYBILL"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-semibold"
                  />
                  <datalist id="bkg-bltype-list">
                    <option value="ORIGINAL" />
                    <option value="WAYBILL (EXPRESS)" />
                    <option value="SURRENDERED" />
                    <option value="SEAWAY BILL" />
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    FREIGHT (Terms)
                  </label>
                  <input
                    type="text"
                    list="bkg-freight-list"
                    value={formData.freightTerm || ''}
                    onChange={(e) => handleChange('freightTerm', e.target.value)}
                    placeholder="e.g. PREPAID, COLLECT"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-semibold"
                  />
                  <datalist id="bkg-freight-list">
                    <option value="PREPAID" />
                    <option value="COLLECT" />
                    <option value="PAYABLE AT DESTINATION" />
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    BL PLACE OF ISSUE
                  </label>
                  <input
                    type="text"
                    value={formData.blIssuePlace || ''}
                    onChange={(e) => handleChange('blIssuePlace', e.target.value)}
                    placeholder="e.g. TOKYO, JAPAN"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Remarks / D/R Note
                </label>
                <textarea
                  rows={2}
                  value={formData.remarks || ''}
                  onChange={(e) => handleChange('remarks', e.target.value)}
                  placeholder="Operational notes, customs info, cut date notice"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 bg-slate-50 shrink-0">
            <button
              type="button"
              onClick={requestClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-xs"
            >
              {initialData ? 'Update Booking' : 'Save Booking & Shipping'}
            </button>
          </div>
        </form>
      </div>
    </div>

    <UnsavedChangesDialog
      isOpen={showUnsavedPrompt}
      onKeepEditing={() => setShowUnsavedPrompt(false)}
      onDiscardAndClose={forceClose}
    />
    </>
  );
};
