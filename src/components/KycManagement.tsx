import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  FileCheck2,
  Plus,
  Download,
  Search,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  FileSpreadsheet,
  Printer,
  X,
  Ship,
  Globe2,
  Receipt,
  UserCheck,
  ShieldCheck,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import {
  KycRecord,
  KycParty,
  KycStatus,
  CurrencyValueType,
  CompanyProfile,
  Customer,
} from '../types';
import { exportDedicatedKycRecordsToExcel } from '../utils/excelExport';
import { downloadElementAsPdf } from '../utils/pdfExport';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';

interface KycManagementProps {
  kycRecords: KycRecord[];
  companyProfile: CompanyProfile;
  customers: Customer[];
  onSaveKycRecord: (record: KycRecord) => Promise<void>;
  onDeleteKycRecord: (recordId: string) => Promise<void>;
}

const EMPTY_PARTY: KycParty = {
  name: '',
  addressLine1: '',
  addressLine2: '',
  tel: '',
  fax: '',
  email: '',
  taxId: '',
  remark: '',
};

export const KycManagement: React.FC<KycManagementProps> = ({
  kycRecords,
  companyProfile,
  customers,
  onSaveKycRecord,
  onDeleteKycRecord,
}) => {
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [customerFilter, setCustomerFilter] = useState<string>('ALL');

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Active items
  const [currentKyc, setCurrentKyc] = useState<KycRecord | null>(() => kycRecords[0] || null);
  const [deletingKycId, setDeletingKycId] = useState<string | null>(null);

  // Form State (No mandatory requirements, safe defaults)
  const [formData, setFormData] = useState<KycRecord>({
    id: '',
    kycNumber: '',
    customerCompany: '',
    shipper: { ...EMPTY_PARTY },
    consignee: { ...EMPTY_PARTY },
    notifyParty: { ...EMPTY_PARTY },
    hasAlsoNotify: false,
    alsoNotifyParty: { ...EMPTY_PARTY },
    fpod: '',
    pod: '',
    status: 'VERIFIED',
    documentDate: new Date().toISOString().slice(0, 10),
    remarks: '',
    createdAt: '',
    updatedAt: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Print ref for preview
  const previewCertificateRef = useRef<HTMLDivElement>(null);

  const attemptCloseEditor = useCallback(() => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      setIsEditorOpen(false);
      setShowDiscardConfirm(false);
    }
  }, [isDirty]);

  useEffect(() => {
    if (!isEditorOpen && !isPreviewOpen && !isDeleteModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (showDiscardConfirm) {
          setShowDiscardConfirm(false);
        } else if (isDeleteModalOpen) {
          setIsDeleteModalOpen(false);
          setDeletingKycId(null);
        } else if (isPreviewOpen) {
          setIsPreviewOpen(false);
        } else if (isEditorOpen) {
          attemptCloseEditor();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditorOpen, isPreviewOpen, isDeleteModalOpen, showDiscardConfirm, attemptCloseEditor]);

  // Filtered KYC Records
  const filteredRecords = useMemo(() => {
    return kycRecords.filter((rec) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (rec.kycNumber || '').toLowerCase().includes(q) ||
        (rec.customerCompany || '').toLowerCase().includes(q) ||
        (rec.shipper?.name || '').toLowerCase().includes(q) ||
        (rec.consignee?.name || '').toLowerCase().includes(q) ||
        (rec.notifyParty?.name || '').toLowerCase().includes(q) ||
        (rec.alsoNotifyParty?.name || '').toLowerCase().includes(q) ||
        (rec.pod || '').toLowerCase().includes(q) ||
        (rec.fpod || '').toLowerCase().includes(q) ||
        (rec.shipper?.taxId || '').toLowerCase().includes(q) ||
        (rec.consignee?.taxId || '').toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'ALL' || rec.status === statusFilter;
      const matchesCustomer = customerFilter === 'ALL' || rec.customerCompany === customerFilter;

      return matchesSearch && matchesStatus && matchesCustomer;
    });
  }, [kycRecords, searchTerm, statusFilter, customerFilter]);

  // Statistics
  const stats = useMemo(() => {
    const verified = kycRecords.filter((r) => r.status === 'VERIFIED').length;
    const pending = kycRecords.filter((r) => r.status === 'PENDING').length;
    const review = kycRecords.filter((r) => r.status === 'IN_REVIEW').length;
    return {
      total: kycRecords.length,
      verified,
      pending,
      review,
    };
  }, [kycRecords]);

  // Open Add modal with convenient defaults (none mandatory)
  const handleOpenAdd = () => {
    const year = new Date().getFullYear();
    const count = kycRecords.length + 1;
    const autoNo = `KYC-${year}-${String(count).padStart(3, '0')}`;

    setFormData({
      id: `kyc-${Date.now()}`,
      kycNumber: autoNo,
      customerCompany: '',
      shipper: { ...EMPTY_PARTY },
      consignee: { ...EMPTY_PARTY },
      notifyParty: { ...EMPTY_PARTY },
      hasAlsoNotify: false,
      alsoNotifyParty: { ...EMPTY_PARTY },
      fpod: '',
      pod: '',
      status: 'VERIFIED',
      documentDate: new Date().toISOString().slice(0, 10),
      remarks: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setIsDirty(false);
    setShowDiscardConfirm(false);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (record: KycRecord) => {
    setFormData({
      ...record,
      shipper: { ...record.shipper },
      consignee: { ...record.consignee },
      notifyParty: { ...record.notifyParty },
      alsoNotifyParty: record.alsoNotifyParty ? { ...record.alsoNotifyParty } : { ...EMPTY_PARTY },
    });
    setIsDirty(false);
    setShowDiscardConfirm(false);
    setIsEditorOpen(true);
  };

  const handleOpenPreview = (record: KycRecord) => {
    setCurrentKyc(record);
    setIsPreviewOpen(true);
  };

  // Safe Save: NO mandatory field restriction. User can save anytime.
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Auto-fill fallback number if left blank
    const fallbackKycNo =
      (formData.kycNumber && formData.kycNumber.trim()) ||
      `KYC-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

    try {
      setIsSaving(true);
      const recordToSave: KycRecord = {
        ...formData,
        id: formData.id || `kyc-${Date.now()}`,
        kycNumber: fallbackKycNo.toUpperCase(),
        fpod: formData.fpod || '',
        pod: formData.pod || '',
        status: formData.status || 'VERIFIED',
        documentDate: formData.documentDate || new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString(),
        createdAt: formData.createdAt || new Date().toISOString(),
      };
      await onSaveKycRecord(recordToSave);
      setCurrentKyc(recordToSave);
      setIsDirty(false);
      setShowDiscardConfirm(false);
      setIsEditorOpen(false);
    } catch (err) {
      console.error('Error saving KYC record to cloud:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingKycId) return;
    try {
      await onDeleteKycRecord(deletingKycId);
      setIsDeleteModalOpen(false);
      setDeletingKycId(null);
    } catch (err) {
      console.error('Error deleting KYC record:', err);
    }
  };

  // High-Resolution 1-Click PDF Download (Uses fixed-dimension offscreen element)
  const handleDownloadSinglePdf = async (record: KycRecord) => {
    setCurrentKyc(record);
    setDownloadingId(record.id);

    setTimeout(async () => {
      try {
        const el = document.getElementById('kyc-dedicated-pdf-canvas');
        if (el) {
          await downloadElementAsPdf({
            element: el,
            filename: `KYC_${record.kycNumber || 'Verification'}.pdf`,
          });
        } else {
          window.print();
        }
      } catch (err) {
        console.error('PDF generation error, falling back to print:', err);
        window.print();
      } finally {
        setDownloadingId(null);
      }
    }, 280);
  };

  return (
    <div className="space-y-6">
      {/* Module Title Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-xl border border-indigo-500/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-full text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              KYC Compliance & Party Verification
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <FileCheck2 className="w-8 h-8 text-indigo-400" />
              KYC Documents Module
            </h1>
            <p className="text-sm md:text-base text-slate-300 max-w-2xl leading-relaxed">
              本人確認・荷主・荷受人登録台帳. Complete logistics party compliance registry with Shippers, Consignees, Notify Parties, secondary Also-Notify, Value Types, Incoterms, and POD/FPOD.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => exportDedicatedKycRecordsToExcel(filteredRecords)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel Export (.xlsx)
            </button>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-indigo-500/30 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              New KYC Verification
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/10">
            <div className="text-xs text-slate-400 uppercase font-semibold">Total KYC Documents</div>
            <div className="text-2xl font-bold text-white mt-1">{stats.total}</div>
          </div>
          <div className="bg-emerald-500/10 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-emerald-500/20">
            <div className="text-xs text-emerald-400 uppercase font-semibold">Verified Compliance</div>
            <div className="text-2xl font-bold text-emerald-300 mt-1">{stats.verified}</div>
          </div>
          <div className="bg-amber-500/10 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-amber-500/20">
            <div className="text-xs text-amber-400 uppercase font-semibold">Pending Review</div>
            <div className="text-2xl font-bold text-amber-300 mt-1">{stats.pending}</div>
          </div>
          <div className="bg-blue-500/10 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-blue-500/20">
            <div className="text-xs text-blue-400 uppercase font-semibold">Under Inspection</div>
            <div className="text-2xl font-bold text-blue-300 mt-1">{stats.review}</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search */}
          <div className="relative md:col-span-6">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by KYC #, Shipper, Consignee, Tax ID, Port..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Status: All</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="PENDING">PENDING</option>
              <option value="IN_REVIEW">IN REVIEW</option>
            </select>
          </div>

          {/* Customer Filter */}
          <div className="md:col-span-3">
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Customers / Accounts</option>
              {Array.from(new Set(kycRecords.map((r) => r.customerCompany))).filter(Boolean).map((cust) => (
                <option key={cust} value={cust}>
                  {cust}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KYC Documents Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 md:p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                KYC Registered Records ({filteredRecords.length})
              </h2>
              <p className="text-xs text-slate-500">
                Persistent to Cloud Firestore with instant high-resolution PDF download and Excel export.
              </p>
            </div>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center">
            <FileCheck2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No KYC Documents Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Add a new party compliance record without any mandatory restrictions.
            </p>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
            >
              + Create New KYC Document
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">KYC File & Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Shipper</th>
                  <th className="py-3 px-4">Consignee</th>
                  <th className="py-3 px-4">Notify Party</th>
                  <th className="py-3 px-4">POD / FPOD</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-indigo-50/40 transition-colors">
                    {/* KYC File */}
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-700 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <FileCheck2 className="w-3.5 h-3.5 text-indigo-500" />
                        {record.kycNumber || 'KYC-RECORD'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans mt-0.5 font-normal">
                        {record.documentDate || '—'}
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                      {record.customerCompany || '—'}
                    </td>

                    {/* Shipper */}
                    <td className="py-3.5 px-4 max-w-[200px]">
                      <div className="font-semibold text-slate-800 truncate" title={record.shipper?.name}>
                        {record.shipper?.name || '—'}
                      </div>
                      {record.shipper?.taxId && (
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Receipt className="w-3 h-3 text-slate-400" />
                          {record.shipper.taxId}
                        </div>
                      )}
                    </td>

                    {/* Consignee */}
                    <td className="py-3.5 px-4 max-w-[200px]">
                      <div className="font-semibold text-slate-800 truncate" title={record.consignee?.name}>
                        {record.consignee?.name || '—'}
                      </div>
                      {record.consignee?.taxId && (
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Receipt className="w-3 h-3 text-slate-400" />
                          {record.consignee.taxId}
                        </div>
                      )}
                    </td>

                    {/* Notify */}
                    <td className="py-3.5 px-4 max-w-[180px]">
                      <div className="text-slate-700 truncate" title={record.notifyParty?.name}>
                        {record.notifyParty?.name || 'Same as Consignee'}
                      </div>
                      {record.hasAlsoNotify && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 mt-0.5">
                          + Also Notify
                        </span>
                      )}
                    </td>

                    {/* POD / FPOD */}
                    <td className="py-3.5 px-4 text-[11px] whitespace-nowrap">
                      <div className="font-medium text-slate-800 flex items-center gap-1">
                        <Ship className="w-3 h-3 text-slate-400" />
                        {record.pod || '—'}
                      </div>
                      {record.fpod && (
                        <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[120px]" title={record.fpod}>
                          FPOD: {record.fpod}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          record.status === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : record.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {record.status === 'VERIFIED' && <CheckCircle2 className="w-3 h-3" />}
                        {record.status === 'PENDING' && <Clock className="w-3 h-3" />}
                        {record.status === 'IN_REVIEW' && <AlertCircle className="w-3 h-3" />}
                        {record.status || 'VERIFIED'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        {/* 1-Click PDF Download */}
                        <button
                          onClick={() => handleDownloadSinglePdf(record)}
                          disabled={downloadingId === record.id}
                          title="1-Click Download PDF Certificate"
                          className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {downloadingId === record.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>

                        {/* View Preview */}
                        <button
                          onClick={() => handleOpenPreview(record)}
                          title="Preview Document Sheet & Print"
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEdit(record)}
                          title="Edit KYC Details"
                          className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => {
                            setDeletingKycId(record.id);
                            setIsDeleteModalOpen(true);
                          }}
                          title="Delete KYC Record"
                          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-100 rounded-lg transition-colors"
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
        )}
      </div>

      {/* ======================================================== */}
      {/* ADD / EDIT KYC MODAL (NO MANDATORY RESTRICTIONS) */}
      {/* ======================================================== */}
      {isEditorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) attemptCloseEditor();
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-auto border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 md:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-500/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-400/30">
                  <FileCheck2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">
                    {formData.id ? 'Edit KYC Document' : 'New KYC Document & Party Verification'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Enter party profiles, commercial valuation, incoterms, and ports (all fields optional)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={attemptCloseEditor}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close KYC editor"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={handleSave}
              onChange={() => setIsDirty(true)}
              className="p-4 md:p-6 overflow-y-auto space-y-6 flex-1 text-xs"
            >
              {/* Top Meta Bar */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">KYC File Number</label>
                  <input
                    type="text"
                    value={formData.kycNumber}
                    onChange={(e) => setFormData({ ...formData, kycNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="KYC-2026-001 (Auto generated if blank)"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Document Date</label>
                  <input
                    type="date"
                    value={formData.documentDate}
                    onChange={(e) => setFormData({ ...formData, documentDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Customer / Client Account</label>
                  <input
                    type="text"
                    list="customers-list"
                    value={formData.customerCompany}
                    onChange={(e) => setFormData({ ...formData, customerCompany: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                    placeholder="e.g. HBI CO., LTD"
                  />
                  <datalist id="customers-list">
                    {customers.map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">KYC Compliance Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as KycStatus })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="VERIFIED">VERIFIED (承認済)</option>
                    <option value="PENDING">PENDING (保留)</option>
                    <option value="IN_REVIEW">IN REVIEW (審査中)</option>
                  </select>
                </div>
              </div>

              {/* SHIPPER SECTION */}
              <div className="bg-indigo-50/40 rounded-xl p-4 border border-indigo-100 space-y-3">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm border-b border-indigo-200 pb-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  Shipper Details (荷送人・輸出者)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-slate-700 font-semibold mb-1">Shipper Name</label>
                    <input
                      type="text"
                      value={formData.shipper.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shipper: { ...formData.shipper, name: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
                      placeholder="e.g. YOKOHAMA TRADING & LOGISTICS CO., LTD."
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Address Line 1</label>
                    <input
                      type="text"
                      value={formData.shipper.addressLine1}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shipper: { ...formData.shipper, addressLine1: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g. 2833-165 Sakasai, Bando-shi"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Address Line 2</label>
                    <input
                      type="text"
                      value={formData.shipper.addressLine2}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shipper: { ...formData.shipper, addressLine2: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g. Ibaraki-ken 306-0501, Japan"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Tel Number</label>
                    <input
                      type="text"
                      value={formData.shipper.tel}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shipper: { ...formData.shipper, tel: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="+81-280-33-3423"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Fax Number</label>
                    <input
                      type="text"
                      value={formData.shipper.fax}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shipper: { ...formData.shipper, fax: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="+81-280-33-6367"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Mail ID (Email)</label>
                    <input
                      type="text"
                      value={formData.shipper.email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shipper: { ...formData.shipper, email: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="logistics@ytandl.co.jp"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Tax ID / 登録番号</label>
                    <input
                      type="text"
                      value={formData.shipper.taxId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shipper: { ...formData.shipper, taxId: e.target.value.toUpperCase() },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                      placeholder="T9120001213448"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-slate-700 font-semibold mb-1">Shipper Remark</label>
                    <input
                      type="text"
                      value={formData.shipper.remark}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shipper: { ...formData.shipper, remark: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Shipper remarks, export authorizations, license references"
                    />
                  </div>
                </div>
              </div>

              {/* CONSIGNEE SECTION */}
              <div className="bg-emerald-50/40 rounded-xl p-4 border border-emerald-100 space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm border-b border-emerald-200 pb-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  Consignee Details (荷受人・輸入者)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-slate-700 font-semibold mb-1">Consignee Name</label>
                    <input
                      type="text"
                      value={formData.consignee.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          consignee: { ...formData.consignee, name: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800"
                      placeholder="e.g. ROYAL DUBLIN MOTORS IRELAND LTD"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Address Line 1</label>
                    <input
                      type="text"
                      value={formData.consignee.addressLine1}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          consignee: { ...formData.consignee, addressLine1: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Unit 4, Clondalkin Industrial Estate"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Address Line 2</label>
                    <input
                      type="text"
                      value={formData.consignee.addressLine2}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          consignee: { ...formData.consignee, addressLine2: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Dublin 22, D22 X2N4, Ireland"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Tel Number</label>
                    <input
                      type="text"
                      value={formData.consignee.tel}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          consignee: { ...formData.consignee, tel: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="+353-1-457-8900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Fax Number</label>
                    <input
                      type="text"
                      value={formData.consignee.fax}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          consignee: { ...formData.consignee, fax: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="+353-1-457-8901"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Mail ID (Email)</label>
                    <input
                      type="text"
                      value={formData.consignee.email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          consignee: { ...formData.consignee, email: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="customs@royaldublinmotors.ie"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Tax ID / VAT / TRN / EORI</label>
                    <input
                      type="text"
                      value={formData.consignee.taxId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          consignee: { ...formData.consignee, taxId: e.target.value.toUpperCase() },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                      placeholder="IE9845120M"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-slate-700 font-semibold mb-1">Consignee Remark</label>
                    <input
                      type="text"
                      value={formData.consignee.remark}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          consignee: { ...formData.consignee, remark: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="EORI verified, bonded customs clearance warehouse details"
                    />
                  </div>
                </div>
              </div>

              {/* NOTIFY PARTY SECTION */}
              <div className="bg-amber-50/40 rounded-xl p-4 border border-amber-100 space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm border-b border-amber-200 pb-2">
                  <Globe2 className="w-4 h-4 text-amber-600" />
                  Notify Party (着荷通知先 - ALSO NOTIFY)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-slate-700 font-semibold mb-1">Notify Party Name</label>
                    <input
                      type="text"
                      value={formData.notifyParty.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notifyParty: { ...formData.notifyParty, name: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-800"
                      placeholder="e.g. CELTIC FREIGHT FORWARDING & LOGISTICS LTD"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Address Line 1</label>
                    <input
                      type="text"
                      value={formData.notifyParty.addressLine1}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notifyParty: { ...formData.notifyParty, addressLine1: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Terminal Road South, Dublin Port"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Address Line 2</label>
                    <input
                      type="text"
                      value={formData.notifyParty.addressLine2}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notifyParty: { ...formData.notifyParty, addressLine2: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Dublin 1, D01 K8F2, Ireland"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Tel Number</label>
                    <input
                      type="text"
                      value={formData.notifyParty.tel}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notifyParty: { ...formData.notifyParty, tel: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="+353-1-855-4300"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Fax Number</label>
                    <input
                      type="text"
                      value={formData.notifyParty.fax}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notifyParty: { ...formData.notifyParty, fax: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="+353-1-855-4301"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Mail ID (Email)</label>
                    <input
                      type="text"
                      value={formData.notifyParty.email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notifyParty: { ...formData.notifyParty, email: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="clearance@celticfreight.ie"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Tax ID / Registration</label>
                    <input
                      type="text"
                      value={formData.notifyParty.taxId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notifyParty: { ...formData.notifyParty, taxId: e.target.value.toUpperCase() },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                      placeholder="IE3391820B"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-slate-700 font-semibold mb-1">Notify Party Remark</label>
                    <input
                      type="text"
                      value={formData.notifyParty.remark}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notifyParty: { ...formData.notifyParty, remark: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Port clearance broker, release protocol"
                    />
                  </div>
                </div>
              </div>

              {/* RARE ALSO NOTIFY PARTY CONDITIONAL TOGGLE */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Secondary "Also Notify" Party (Rare - 1000 Mai Ek Bar Ata Hai)
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Check only if the shipment requires an extra secondary notify party.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasAlsoNotify}
                      onChange={(e) => setFormData({ ...formData, hasAlsoNotify: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {formData.hasAlsoNotify && (
                  <div className="pt-3 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-slate-700 font-semibold mb-1">Secondary Also-Notify Name</label>
                      <input
                        type="text"
                        value={formData.alsoNotifyParty?.name || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            alsoNotifyParty: {
                              ...(formData.alsoNotifyParty || EMPTY_PARTY),
                              name: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                        placeholder="Secondary Also Notify Company"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Address Line 1</label>
                      <input
                        type="text"
                        value={formData.alsoNotifyParty?.addressLine1 || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            alsoNotifyParty: {
                              ...(formData.alsoNotifyParty || EMPTY_PARTY),
                              addressLine1: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Street Address Line 1"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Address Line 2</label>
                      <input
                        type="text"
                        value={formData.alsoNotifyParty?.addressLine2 || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            alsoNotifyParty: {
                              ...(formData.alsoNotifyParty || EMPTY_PARTY),
                              addressLine2: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="City, State, Country"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Tel Number</label>
                      <input
                        type="text"
                        value={formData.alsoNotifyParty?.tel || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            alsoNotifyParty: {
                              ...(formData.alsoNotifyParty || EMPTY_PARTY),
                              tel: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="+XX-XXX-XXXX"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Fax Number</label>
                      <input
                        type="text"
                        value={formData.alsoNotifyParty?.fax || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            alsoNotifyParty: {
                              ...(formData.alsoNotifyParty || EMPTY_PARTY),
                              fax: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="+XX-XXX-XXXX"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Mail ID (Email)</label>
                      <input
                        type="text"
                        value={formData.alsoNotifyParty?.email || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            alsoNotifyParty: {
                              ...(formData.alsoNotifyParty || EMPTY_PARTY),
                              email: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="email@secondary-notify.com"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Tax ID</label>
                      <input
                        type="text"
                        value={formData.alsoNotifyParty?.taxId || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            alsoNotifyParty: {
                              ...(formData.alsoNotifyParty || EMPTY_PARTY),
                              taxId: e.target.value.toUpperCase(),
                            },
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                        placeholder="Tax / Registration ID"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-slate-700 font-semibold mb-1">Remark</label>
                      <input
                        type="text"
                        value={formData.alsoNotifyParty?.remark || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            alsoNotifyParty: {
                              ...(formData.alsoNotifyParty || EMPTY_PARTY),
                              remark: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Secondary notify specific conditions"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* PORTS: POD & FPOD (Manual Entry - Value Type & Incoterm Removed) */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                <div className="text-slate-800 font-bold text-sm border-b border-slate-200 pb-2 flex items-center gap-2">
                  <Ship className="w-4 h-4 text-indigo-600" />
                  Port Routing &amp; Discharge Ports (Manual Entry)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      POD (Port of Discharge) - MANUAL
                    </label>
                    <input
                      type="text"
                      value={formData.pod || ''}
                      onChange={(e) => setFormData({ ...formData, pod: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter Port of Discharge (e.g. DUBLIN, JEBEL ALI, KARACHI)"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      FPOD (Final Port / Destination) - MANUAL
                    </label>
                    <input
                      type="text"
                      value={formData.fpod || ''}
                      onChange={(e) => setFormData({ ...formData, fpod: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter Final Port of Discharge (e.g. DUBLIN BONDED COMPLEX, IRELAND)"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-slate-700 font-semibold mb-1">General Remarks & Verification Notes</label>
                    <textarea
                      rows={2}
                      value={formData.remarks}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="KYC verification notes, bilateral agreements, inspection certificates, EPA declarations..."
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={attemptCloseEditor}
                  className="px-5 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-95 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving to Cloud...
                    </>
                  ) : (
                    <>
                      <FileCheck2 className="w-4 h-4" />
                      Save KYC Record
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PREVIEW / PRINT MODAL */}
      {/* ======================================================== */}
      {isPreviewOpen && currentKyc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/70 backdrop-blur-sm overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPreviewOpen(false);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-auto border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Toolbar */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-indigo-400" />
                <span className="font-bold text-sm">
                  KYC Verification Sheet Preview: {currentKyc.kycNumber || 'Draft'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const el = previewCertificateRef.current;
                    if (el) {
                      downloadElementAsPdf({
                        element: el,
                        filename: `KYC_Verification_${currentKyc.kycNumber || 'Certificate'}.pdf`,
                      });
                    } else {
                      window.print();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-2"
                  aria-label="Close KYC preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Document Container */}
            <div className="p-4 md:p-8 overflow-y-auto bg-slate-100 flex justify-center">
              <div
                ref={previewCertificateRef}
                className="bg-white shadow-xl p-8 md:p-10 w-full max-w-[794px] border border-slate-200 text-slate-800 text-xs box-border"
              >
                <KycCertificateTemplate record={currentKyc} companyProfile={companyProfile} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsDeleteModalOpen(false);
              setDeletingKycId(null);
            }
          }}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-center text-slate-900">Delete KYC Document?</h3>
            <p className="text-xs text-center text-slate-500 mt-1 mb-6">
              This KYC compliance file will be removed from Cloud Firestore.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeletingKycId(null);
                }}
                className="flex-1 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all shadow-md text-xs"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <UnsavedChangesDialog
        isOpen={showDiscardConfirm}
        onKeepEditing={() => setShowDiscardConfirm(false)}
        onDiscardAndClose={() => {
          setShowDiscardConfirm(false);
          setIsDirty(false);
          setIsEditorOpen(false);
        }}
      />

      {/* ======================================================== */}
      {/* FIXED-DIMENSION OFFSCREEN ELEMENT FOR 1-CLICK PDF EXPORT */}
      {/* (Avoids sr-only clipping; rendered at standard 794px A4 width) */}
      {/* ======================================================== */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '794px',
          backgroundColor: '#ffffff',
          zIndex: -9999,
          pointerEvents: 'none',
          boxSizing: 'border-box',
        }}
      >
        {currentKyc && (
          <div
            id="kyc-dedicated-pdf-canvas"
            style={{
              width: '794px',
              padding: '36px',
              backgroundColor: '#ffffff',
              boxSizing: 'border-box',
            }}
          >
            <KycCertificateTemplate record={currentKyc} companyProfile={companyProfile} />
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * High-fidelity KYC Verification Certificate Template (KYC本人確認・荷受人登録台帳)
 * Rendered for print and PDF generation with Japanese Hanko Seal.
 */
interface KycCertificateTemplateProps {
  record: KycRecord;
  companyProfile: CompanyProfile;
}

const KycCertificateTemplate: React.FC<KycCertificateTemplateProps> = ({ record, companyProfile }) => {
  const shipper = record.shipper || EMPTY_PARTY;
  const consignee = record.consignee || EMPTY_PARTY;
  const notifyParty = record.notifyParty || EMPTY_PARTY;
  const alsoNotify = record.alsoNotifyParty || EMPTY_PARTY;

  return (
    <div className="space-y-5 bg-white text-slate-900 font-sans" style={{ minHeight: '980px' }}>
      {/* Header with Company details and Hanko Seal */}
      <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
        <div>
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
            {companyProfile.companyNameJp || '横浜トレーディング株式会社'}
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {companyProfile.companyNameEn || 'YOKOHAMA TRADING & LOGISTICS'}
          </h2>
          <div className="text-[11px] text-slate-600 space-y-0.5 mt-1">
            <div>
              Owner: {companyProfile.ownerNameEn || 'Muhammad Fareed'} / 代表取締役{' '}
              {companyProfile.ownerNameJp || 'ファリード ムハンマド'}
            </div>
            <div>{companyProfile.addressEn || '2833-165 Sakasai, Bando-shi, Ibaraki-ken 306-0501, Japan'}</div>
            <div>
              Tel: {companyProfile.phone || '0280-33-3423'} | Fax: {companyProfile.fax || '0280-33-6367'} | Email:{' '}
              {companyProfile.email || 'logistics@ytandl.co.jp'}
            </div>
            <div className="font-mono font-bold text-slate-800">
              Tax Registration No: {companyProfile.registrationNumber || 'T9120001213448'} (インボイス適格請求書発行事業者)
            </div>
          </div>
        </div>

        {/* Japanese Hanko Inkan Seal */}
        <div className="flex flex-col items-center justify-center pl-4 shrink-0">
          <div className="w-20 h-20 rounded-full border-2 border-red-600 p-1 flex items-center justify-center text-red-600 font-serif font-black text-[10px] text-center rotate-[-6deg] select-none shadow-xs">
            <div className="border border-red-500 rounded-full w-full h-full flex flex-col items-center justify-center leading-tight">
              <span>横浜</span>
              <span>貿易</span>
              <span className="text-[8px]">之印</span>
            </div>
          </div>
          <span className="text-[9px] text-red-700 font-bold uppercase tracking-wider mt-1">
            Certified Hanko
          </span>
        </div>
      </div>

      {/* Certificate Title Badge */}
      <div className="text-center py-2 bg-slate-900 text-white rounded-lg shadow-xs">
        <h3 className="text-sm font-black tracking-widest uppercase">
          KYC COMPLIANCE & LOGISTICS PARTY VERIFICATION SHEET
        </h3>
        <div className="text-[10px] text-indigo-300 font-bold tracking-wider">
          本人確認・荷送人・荷受人登録台帳 (OFFICIAL REGULATORY & CARRIER COMPLIANCE)
        </div>
      </div>

      {/* Meta Grid */}
      <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
        <div>
          <span className="text-slate-500 block text-[10px] uppercase font-bold">KYC Reference No</span>
          <span className="font-mono font-black text-slate-900 text-sm">{record.kycNumber || 'KYC-RECORD'}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px] uppercase font-bold">Client / Customer</span>
          <span className="font-bold text-slate-800 truncate block">{record.customerCompany || '—'}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px] uppercase font-bold">Registration Date</span>
          <span className="font-bold text-slate-800">{record.documentDate || '—'}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px] uppercase font-bold">Compliance Status</span>
          <span className="font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[10px] inline-block mt-0.5">
            {record.status || 'VERIFIED'}
          </span>
        </div>
      </div>

      {/* PARTIES INFORMATION GRID */}
      <div className="space-y-3">
        {/* Shipper */}
        <div className="border border-slate-300 rounded-lg overflow-hidden">
          <div className="bg-slate-100 px-3 py-1 font-bold text-slate-800 text-[11px] uppercase tracking-wider border-b border-slate-300 flex justify-between">
            <span>1. SHIPPER DETAILS (荷送人・輸出者)</span>
            <span className="font-mono text-slate-700 font-bold">TAX ID: {shipper.taxId || 'T9120001213448'}</span>
          </div>
          <div className="p-2.5 grid grid-cols-2 gap-2 text-xs">
            <div className="col-span-2">
              <span className="text-slate-500 text-[10px] block font-semibold">Company Name</span>
              <span className="font-bold text-slate-900 text-sm">{shipper.name || 'YOKOHAMA TRADING & LOGISTICS CO., LTD.'}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block font-semibold">Address</span>
              <span className="text-slate-800">{[shipper.addressLine1, shipper.addressLine2].filter(Boolean).join(', ') || '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block font-semibold">Contact</span>
              <span className="text-slate-800">
                Tel: {shipper.tel || '—'} | Fax: {shipper.fax || '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block font-semibold">Mail ID</span>
              <span className="text-slate-800">{shipper.email || '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block font-semibold">Remark</span>
              <span className="text-slate-800 italic">{shipper.remark || 'Standard Shipper Profile'}</span>
            </div>
          </div>
        </div>

        {/* Consignee */}
        <div className="border border-slate-300 rounded-lg overflow-hidden">
          <div className="bg-slate-100 px-3 py-1 font-bold text-slate-800 text-[11px] uppercase tracking-wider border-b border-slate-300 flex justify-between">
            <span>2. CONSIGNEE DETAILS (荷受人・輸入者)</span>
            <span className="font-mono text-slate-700 font-bold">TAX ID / VAT: {consignee.taxId || '—'}</span>
          </div>
          <div className="p-2.5 grid grid-cols-2 gap-2 text-xs">
            <div className="col-span-2">
              <span className="text-slate-500 text-[10px] block font-semibold">Company Name</span>
              <span className="font-bold text-slate-900 text-sm">{consignee.name || 'Consignee on record'}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block font-semibold">Address</span>
              <span className="text-slate-800">{[consignee.addressLine1, consignee.addressLine2].filter(Boolean).join(', ') || '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block font-semibold">Contact</span>
              <span className="text-slate-800">
                Tel: {consignee.tel || '—'} | Fax: {consignee.fax || '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block font-semibold">Mail ID</span>
              <span className="text-slate-800">{consignee.email || '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block font-semibold">Remark</span>
              <span className="text-slate-800 italic">{consignee.remark || '—'}</span>
            </div>
          </div>
        </div>

        {/* Notify Party */}
        <div className="border border-slate-300 rounded-lg overflow-hidden">
          <div className="bg-slate-100 px-3 py-1 font-bold text-slate-800 text-[11px] uppercase tracking-wider border-b border-slate-300 flex justify-between">
            <span>3. NOTIFY PARTY (着荷通知先 - ALSO NOTIFY)</span>
            <span className="font-mono text-slate-700 font-bold">TAX ID: {notifyParty.taxId || '—'}</span>
          </div>
          <div className="p-2.5 grid grid-cols-2 gap-2 text-xs">
            <div className="col-span-2">
              <span className="text-slate-500 text-[10px] block font-semibold">Company Name</span>
              <span className="font-bold text-slate-900 text-sm">{notifyParty.name || 'Same as Consignee'}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block font-semibold">Address</span>
              <span className="text-slate-800">{[notifyParty.addressLine1, notifyParty.addressLine2].filter(Boolean).join(', ') || '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block font-semibold">Contact</span>
              <span className="text-slate-800">
                Tel: {notifyParty.tel || '—'} | Fax: {notifyParty.fax || '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block font-semibold">Mail ID</span>
              <span className="text-slate-800">{notifyParty.email || '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block font-semibold">Remark</span>
              <span className="text-slate-800 italic">{notifyParty.remark || '—'}</span>
            </div>
          </div>
        </div>

        {/* Rare Also Notify Party */}
        {record.hasAlsoNotify && alsoNotify?.name && (
          <div className="border border-amber-300 bg-amber-50/20 rounded-lg overflow-hidden">
            <div className="bg-amber-100 px-3 py-1 font-bold text-amber-900 text-[11px] uppercase tracking-wider border-b border-amber-300 flex justify-between">
              <span>4. SECONDARY ALSO NOTIFY PARTY (稀発・二次通知先)</span>
              <span className="font-mono text-amber-800 font-bold">TAX ID: {alsoNotify.taxId || '—'}</span>
            </div>
            <div className="p-2.5 grid grid-cols-2 gap-2 text-xs">
              <div className="col-span-2">
                <span className="text-slate-500 text-[10px] block font-semibold">Company Name</span>
                <span className="font-bold text-slate-900">{alsoNotify.name}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block font-semibold">Address</span>
                <span className="text-slate-800">{[alsoNotify.addressLine1, alsoNotify.addressLine2].filter(Boolean).join(', ') || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block font-semibold">Contact</span>
                <span className="text-slate-800">
                  Tel: {alsoNotify.tel || '—'} | Fax: {alsoNotify.fax || '—'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Port Routing Table (Value Type & Incoterm Removed as requested) */}
      <div className="border border-slate-300 rounded-lg overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
            <tr>
              <th className="p-2 border-r border-slate-300 w-1/2">POD (Port of Discharge) - MANUAL</th>
              <th className="p-2 w-1/2">FPOD (Final Port / Destination) - MANUAL</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2 border-r border-slate-300 font-bold text-slate-800">{record.pod || '—'}</td>
              <td className="p-2 font-bold text-slate-800">{record.fpod || '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Remarks */}
      {record.remarks && (
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Verification Remarks</span>
          <p className="text-slate-700">{record.remarks}</p>
        </div>
      )}

      {/* Verification Signatures */}
      <div className="grid grid-cols-2 gap-8 pt-3 border-t border-slate-200">
        <div>
          <div className="text-[10px] text-slate-500 uppercase font-bold">Authorized Logistics Officer</div>
          <div className="h-10 border-b border-slate-400 mt-1 flex items-end pb-1 font-signature text-slate-700 text-sm font-semibold">
            {companyProfile.ownerNameEn || 'Muhammad Fareed'}
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">Yokohama Trading & Logistics Authorized Signatory</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 uppercase font-bold">Customer Compliance Acknowledgement</div>
          <div className="h-10 border-b border-slate-400 mt-1 flex items-end pb-1 font-serif text-slate-600 text-xs italic">
            {record.customerCompany || 'Registered Client'} Verified
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5">Registered Customer Representative</div>
        </div>
      </div>
    </div>
  );
};
