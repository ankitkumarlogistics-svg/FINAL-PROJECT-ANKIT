import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Customer } from '../types';
import {
  Users,
  Plus,
  Search,
  Building,
  Phone,
  Mail,
  FileSpreadsheet,
  Edit2,
  Trash2,
  Check,
  Briefcase,
  Copy,
  Download,
  Printer,
  X,
  FileText,
  Filter,
  AlertCircle,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { downloadElementAsPdf } from '../utils/pdfExport';
import { JapaneseSeal } from './JapaneseSeal';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';

interface CustomerManagementProps {
  customers: Customer[];
  onSaveCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
  customers,
  onSaveCustomer,
  onDeleteCustomer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSalesPerson, setFilterSalesPerson] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Active customer for PDF export
  const [pdfCustomer, setPdfCustomer] = useState<Customer | null>(null);
  const pdfPrintRef = useRef<HTMLDivElement>(null);

  // Form State
  const [name, setName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [tel, setTel] = useState('');
  const [fax, setFax] = useState('');
  const [email, setEmail] = useState('');
  const [taxId, setTaxId] = useState('');
  const [salesPerson, setSalesPerson] = useState('');
  const [remark1, setRemark1] = useState('');
  const [remark2, setRemark2] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const attemptCloseFormModal = useCallback(() => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      setIsModalOpen(false);
      setFormError(null);
      setShowDiscardConfirm(false);
    }
  }, [isDirty]);

  useEffect(() => {
    if (!isModalOpen && !deleteConfirmId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (showDiscardConfirm) {
          setShowDiscardConfirm(false);
        } else if (deleteConfirmId) {
          setDeleteConfirmId(null);
        } else if (isModalOpen) {
          attemptCloseFormModal();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, deleteConfirmId, showDiscardConfirm, attemptCloseFormModal]);

  const openAddModal = () => {
    setEditingCustomer(null);
    setName('');
    setAddressLine1('');
    setAddressLine2('');
    setTel('');
    setFax('');
    setEmail('');
    setTaxId('');
    setSalesPerson('');
    setRemark1('');
    setRemark2('');
    setFormError(null);
    setIsDirty(false);
    setShowDiscardConfirm(false);
    setIsModalOpen(true);
  };

  const openEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setName(cust.name || '');
    setAddressLine1(cust.addressLine1 || '');
    setAddressLine2(cust.addressLine2 || '');
    setTel(cust.tel || '');
    setFax(cust.fax || '');
    setEmail(cust.email || '');
    setTaxId(cust.taxId || '');
    setSalesPerson(cust.salesPerson || '');
    setRemark1(cust.remark1 || '');
    setRemark2(cust.remark2 || '');
    setFormError(null);
    setIsDirty(false);
    setShowDiscardConfirm(false);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Please enter customer name before saving.');
      return;
    }

    const updatedCustomer: Customer = {
      id: editingCustomer ? editingCustomer.id : `cust-${Date.now()}`,
      name: name.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim(),
      tel: tel.trim(),
      fax: fax.trim(),
      email: email.trim(),
      taxId: taxId.trim(),
      salesPerson: salesPerson.trim(),
      remark1: remark1.trim(),
      remark2: remark2.trim(),
      createdAt: editingCustomer ? editingCustomer.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveCustomer(updatedCustomer);
    setIsDirty(false);
    setFormError(null);
    setShowDiscardConfirm(false);
    setIsModalOpen(false);
  };

  const salesPersonsList = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => {
      if (c.salesPerson) set.add(c.salesPerson);
    });
    return Array.from(set);
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return customers.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(q) ||
        c.addressLine1.toLowerCase().includes(q) ||
        c.addressLine2.toLowerCase().includes(q) ||
        c.tel.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.taxId.toLowerCase().includes(q) ||
        c.salesPerson.toLowerCase().includes(q) ||
        c.remark1.toLowerCase().includes(q) ||
        c.remark2.toLowerCase().includes(q);

      const matchesSales = filterSalesPerson === 'ALL' || c.salesPerson === filterSalesPerson;

      return matchesSearch && matchesSales;
    });
  }, [customers, searchTerm, filterSalesPerson]);

  const handleExportExcel = () => {
    const data = filteredCustomers.map((c) => ({
      'Customer Name': c.name,
      'Address Line 1': c.addressLine1,
      'Address Line 2': c.addressLine2,
      Tel: c.tel,
      Fax: c.fax,
      'Mail ID': c.email,
      'Tax ID': c.taxId,
      'Sales Person': c.salesPerson,
      'Remark 1': c.remark1,
      'Remark 2': c.remark2,
      'Last Updated': new Date(c.updatedAt).toLocaleDateString(),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customers');
    XLSX.writeFile(wb, `Customers_Directory_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    if (copyTimerRef.current !== null) {
      window.clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = window.setTimeout(() => setCopiedId(null), 2000);
  };

  // Direct PDF Download for Customer Profile Sheet
  const handleDownloadCustomerPdf = async (cust: Customer) => {
    setDownloadingId(cust.id);
    setPdfCustomer(cust);
    await new Promise((r) => setTimeout(r, 80));
    if (pdfPrintRef.current) {
      await downloadElementAsPdf({
        element: pdfPrintRef.current,
        filename: `Customer_Profile_${cust.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      });
    }
    setDownloadingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-sky-800 text-xs font-bold uppercase tracking-wider">
            <Users className="w-4 h-4 text-sky-600" />
            <span>Customer Directory</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">Customer Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Client accounts, corporate tax IDs, sales representatives, remarks, and instant PDF/Excel exports.
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
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Search Bar & Sales Person Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer name, address, tax ID, email, sales person, remarks..."
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
          />
        </div>

        <div>
          <select
            value={filterSalesPerson}
            onChange={(e) => setFilterSalesPerson(e.target.value)}
            className="w-full px-3 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
          >
            <option value="ALL">All Sales Representatives</option>
            {salesPersonsList.map((sp) => (
              <option key={sp} value={sp}>
                {sp}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Responsive Customers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Address (1 & 2)</th>
                <th className="py-3 px-4">Contact (Tel / Fax / Mail)</th>
                <th className="py-3 px-4">Tax ID</th>
                <th className="py-3 px-4">Sales Person</th>
                <th className="py-3 px-4">Remarks</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No customers found matching &quot;{searchTerm}&quot;
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-sky-600 shrink-0" />
                        <span>{c.name}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                      <div>{c.addressLine1 || '-'}</div>
                      {c.addressLine2 && (
                        <div className="text-slate-400 text-[11px] mt-0.5">{c.addressLine2}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 space-y-0.5">
                      {c.tel && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{c.tel}</span>
                        </div>
                      )}
                      {c.fax && (
                        <div className="text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-400">FAX:</span> {c.fax}
                        </div>
                      )}
                      {c.email && (
                        <div className="flex items-center gap-1.5 text-sky-700">
                          <Mail className="w-3 h-3 text-sky-500 shrink-0" />
                          <span className="truncate">{c.email}</span>
                        </div>
                      )}
                      {!c.tel && !c.fax && !c.email && <span className="text-slate-400">-</span>}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      {c.taxId ? (
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {c.taxId}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {c.salesPerson ? (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-50 text-sky-800 font-semibold border border-sky-200">
                          <Briefcase className="w-3 h-3 text-sky-600" />
                          <span>{c.salesPerson}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs text-slate-600">
                      {c.remark1 && <div className="truncate font-medium">{c.remark1}</div>}
                      {c.remark2 && (
                        <div className="truncate text-slate-400 text-[11px]">{c.remark2}</div>
                      )}
                      {!c.remark1 && !c.remark2 && <span className="text-slate-400">-</span>}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Direct PDF Download Button */}
                        <button
                          type="button"
                          onClick={() => handleDownloadCustomerPdf(c)}
                          disabled={downloadingId === c.id}
                          className="px-2.5 py-1 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded flex items-center gap-1 shadow-xs transition-colors"
                          title="Download Customer KYC Profile PDF"
                        >
                          <Download className="w-3 h-3" />
                          <span>PDF</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => copyToClipboard(c.name, c.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                          title="Copy Company Name"
                        >
                          {copiedId === c.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(c)}
                          className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded"
                          title="Edit Customer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(c.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="Delete Customer"
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

      {/* Offscreen / Printable Customer Profile PDF Sheet (Guaranteed no data cut-off) */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0, opacity: 0, pointerEvents: 'none' }}>
        {pdfCustomer && (
          <div
            ref={pdfPrintRef}
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
                  2833-165 Sakasai, Bando-shi, Ibaraki 306-0501 | TEL: 0280-33-3423
                </div>
                <div className="text-xs text-slate-600 font-mono mt-0.5">Corporate Reg: T9120001213448</div>
              </div>
              <JapaneseSeal size="md" text="横浜トレーディング株式会社印" />
            </div>

            <div className="mb-6 pb-2 border-b border-slate-200 flex items-center justify-between">
              <div className="text-base font-extrabold uppercase text-slate-900">
                CUSTOMER ACCOUNT & KYC REGISTRATION RECORD
              </div>
              <div className="text-xs font-mono text-slate-500">
                Date: {new Date().toISOString().split('T')[0]}
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="border p-4 rounded-lg bg-slate-50/50">
                <div className="text-[10px] font-bold text-sky-800 uppercase">Customer Name</div>
                <div className="text-base font-bold text-slate-900 mt-0.5">{pdfCustomer.name}</div>
              </div>

              <div className="border p-4 rounded-lg">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Address Lines</div>
                <div className="text-sm font-semibold text-slate-800 mt-1">{pdfCustomer.addressLine1 || '-'}</div>
                {pdfCustomer.addressLine2 && (
                  <div className="text-xs text-slate-600 mt-0.5">{pdfCustomer.addressLine2}</div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Telephone (TEL)</div>
                  <div className="text-sm font-semibold text-slate-800 mt-0.5">{pdfCustomer.tel || '-'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">FAX</div>
                  <div className="text-sm font-semibold text-slate-800 mt-0.5">{pdfCustomer.fax || '-'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Mail ID (Email)</div>
                  <div className="text-sm font-semibold text-sky-800 mt-0.5">{pdfCustomer.email || '-'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Tax ID / Corporate No</div>
                  <div className="text-sm font-mono font-bold text-slate-900 mt-0.5">{pdfCustomer.taxId || '-'}</div>
                </div>
              </div>

              <div className="border p-4 rounded-lg">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Assigned Sales Representative</div>
                <div className="text-sm font-semibold text-slate-800 mt-0.5">{pdfCustomer.salesPerson || '-'}</div>
              </div>

              <div className="border p-4 rounded-lg space-y-2 bg-slate-50/50">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Communication Remarks & Notes</div>
                {pdfCustomer.remark1 && (
                  <div>
                    <strong className="text-slate-700">Primary Remark:</strong> {pdfCustomer.remark1}
                  </div>
                )}
                {pdfCustomer.remark2 && (
                  <div>
                    <strong className="text-slate-700">Secondary Remark:</strong> {pdfCustomer.remark2}
                  </div>
                )}
                {!pdfCustomer.remark1 && !pdfCustomer.remark2 && <span className="text-slate-400">None specified.</span>}
              </div>
            </div>

            <div className="mt-12 pt-4 border-t-2 border-slate-300 flex items-end justify-between text-[11px] text-slate-500">
              <div>
                Yokohama Trading & Logistics Documentation & Customer Relations Dept.
              </div>
              <div className="text-center">
                <div className="w-36 border-b border-slate-400 mb-1"></div>
                <span className="font-semibold text-slate-700">Authorized Account Sign</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) attemptCloseFormModal();
          }}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-8 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-700" />
                <h3 className="text-lg font-bold text-slate-900">
                  {editingCustomer ? 'Edit Customer Details' : 'Add New Customer'}
                </h3>
              </div>
              <button
                type="button"
                onClick={attemptCloseFormModal}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg"
                aria-label="Close customer form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSave}
              onChange={() => setIsDirty(true)}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="e.g. HBI CO., LTD"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="e.g. 4-12-10 Sakae, Naka-ku"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    placeholder="e.g. Nagoya-shi, Aichi 460-0008, Japan"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Telephone (TEL)
                  </label>
                  <input
                    type="text"
                    value={tel}
                    onChange={(e) => setTel(e.target.value)}
                    placeholder="e.g. +81-52-228-7611"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    FAX
                  </label>
                  <input
                    type="text"
                    value={fax}
                    onChange={(e) => setFax(e.target.value)}
                    placeholder="e.g. +81-52-228-7612"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Mail ID (Email)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. operations@hbi-japan.com"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tax ID.
                  </label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="e.g. T8180001045921 or VAT/TRN"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Sales Person
                </label>
                <input
                  type="text"
                  value={salesPerson}
                  onChange={(e) => setSalesPerson(e.target.value)}
                  placeholder="e.g. Kenji Sato / Muhammad Fareed"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Remark 1
                  </label>
                  <textarea
                    rows={2}
                    value={remark1}
                    onChange={(e) => setRemark1(e.target.value)}
                    placeholder="Primary client instruction or trading note"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Remark 2
                  </label>
                  <textarea
                    rows={2}
                    value={remark2}
                    onChange={(e) => setRemark2(e.target.value)}
                    placeholder="Secondary note, shipping port priority or terms"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={attemptCloseFormModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-xs"
                >
                  {editingCustomer ? 'Save Changes' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteConfirmId(null);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-base font-bold text-slate-900">Confirm Deletion</h4>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete this customer record? This will be permanently removed from cloud database.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteCustomer(deleteConfirmId);
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

      <UnsavedChangesDialog
        isOpen={showDiscardConfirm}
        onKeepEditing={() => setShowDiscardConfirm(false)}
        onDiscardAndClose={() => {
          setShowDiscardConfirm(false);
          setIsDirty(false);
          setFormError(null);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};
