import React, { useState, useRef, useEffect } from 'react';
import { MasterData } from '../types';
import {
  Database,
  Ship,
  MapPin,
  Car,
  Anchor,
  Palette,
  Plus,
  Trash2,
  Check,
  Search,
  Cloud,
  FileSpreadsheet,
  Download,
  Edit2,
  CheckCircle2,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { downloadElementAsPdf } from '../utils/pdfExport';
import { JapaneseSeal } from './JapaneseSeal';

interface MasterDataManagerProps {
  masters: MasterData;
  onSaveMasters: (masters: MasterData) => void;
}

type MasterCategory =
  | 'shippingCompanies'
  | 'destinations'
  | 'makeModels'
  | 'finalDestinations'
  | 'portNames'
  | 'vehicleColors';

export const MasterDataManager: React.FC<MasterDataManagerProps> = ({
  masters,
  onSaveMasters,
}) => {
  const [activeCategory, setActiveCategory] = useState<MasterCategory>('shippingCompanies');
  const [newItemValue, setNewItemValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Edit / Update State
  const [editingItem, setEditingItem] = useState<{ category: MasterCategory; value: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Delete State
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{ category: MasterCategory; value: string } | null>(null);

  // Cloud Sync Status State
  const [isSavingToCloud, setIsSavingToCloud] = useState(false);
  const [cloudSyncedNotice, setCloudSyncedNotice] = useState(false);

  // PDF Export State
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const masterCatalogPrintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!deleteConfirmItem) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setDeleteConfirmItem(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteConfirmItem]);

  const categories: {
    id: MasterCategory;
    title: string;
    description: string;
    icon: React.ReactNode;
    placeholder: string;
  }[] = [
    {
      id: 'shippingCompanies',
      title: 'Shipping Lines',
      description: 'Ocean carrier lines & shipping companies (e.g. CMA-CGM, ONE, MAERSK, MSC)',
      icon: <Ship className="w-4 h-4 text-sky-600" />,
      placeholder: 'e.g. HAPAG-LLOYD',
    },
    {
      id: 'destinations',
      title: 'Destinations (POD)',
      description: 'Discharge ports & overseas destinations (e.g. DUBLIN, KARACHI, MOMBASA)',
      icon: <MapPin className="w-4 h-4 text-emerald-600" />,
      placeholder: 'e.g. DAR ES SALAAM, TANZANIA',
    },
    {
      id: 'makeModels',
      title: 'Make & Models',
      description: 'Vehicle makes, models, and chassis codes (e.g. TOYOTA PRIUS, LAND CRUISER)',
      icon: <Car className="w-4 h-4 text-indigo-600" />,
      placeholder: 'e.g. TOYOTA HARRIER (MXUA80)',
    },
    {
      id: 'finalDestinations',
      title: 'Final Destinations (FPOD)',
      description: 'Final place of delivery / inland destination points',
      icon: <MapPin className="w-4 h-4 text-purple-600" />,
      placeholder: 'e.g. KAMPALA (UG via MBA)',
    },
    {
      id: 'portNames',
      title: 'Port Names',
      description: 'Origin & discharge ports (e.g. NAGOYA, YOKOHAMA, KOBE, MOJI)',
      icon: <Anchor className="w-4 h-4 text-amber-600" />,
      placeholder: 'e.g. MOJI, JAPAN',
    },
    {
      id: 'vehicleColors',
      title: 'Vehicle Colors',
      description: 'Factory color designations & color codes (e.g. PEARL WHITE 070, BLACK 202)',
      icon: <Palette className="w-4 h-4 text-rose-600" />,
      placeholder: 'e.g. PEARL WHITE (070)',
    },
  ];

  const currentCategoryDef = categories.find((c) => c.id === activeCategory)!;
  const currentItems = masters[activeCategory] || [];

  const showErrorNotice = (msg: string) => {
    setErrorNotice(msg);
    window.setTimeout(() => setErrorNotice(null), 3500);
  };

  // Add Item
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newItemValue.trim();
    if (!trimmed) return;

    if (currentItems.includes(trimmed)) {
      showErrorNotice('This entry already exists in the master list.');
      return;
    }

    const updatedList = [...currentItems, trimmed];
    const updatedMasters: MasterData = {
      ...masters,
      [activeCategory]: updatedList,
    };

    onSaveMasters(updatedMasters);
    setNewItemValue('');
    setErrorNotice(null);
    setSuccessNotice(`Added "${trimmed}" to ${currentCategoryDef.title}`);
    window.setTimeout(() => setSuccessNotice(null), 2500);
  };

  // Start Edit
  const handleStartEdit = (item: string) => {
    setEditingItem({ category: activeCategory, value: item });
    setEditValue(item);
    setErrorNotice(null);
  };

  // Save Edit / Update
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const trimmed = editValue.trim();
    if (!trimmed) {
      showErrorNotice('Value cannot be empty.');
      return;
    }

    const currentList = masters[editingItem.category] || [];
    // If name changed and already exists elsewhere in the same list
    if (trimmed !== editingItem.value && currentList.includes(trimmed)) {
      showErrorNotice('Another entry with this name already exists.');
      return;
    }

    const updatedList = currentList.map((i) => (i === editingItem.value ? trimmed : i));
    const updatedMasters: MasterData = {
      ...masters,
      [editingItem.category]: updatedList,
    };

    onSaveMasters(updatedMasters);
    setEditingItem(null);
    setEditValue('');
    setErrorNotice(null);
    setSuccessNotice(`Updated "${editingItem.value}" to "${trimmed}"`);
    window.setTimeout(() => setSuccessNotice(null), 2500);
  };

  // Remove Item
  const handleConfirmDelete = () => {
    if (!deleteConfirmItem) return;
    const currentList = masters[deleteConfirmItem.category] || [];
    const updatedList = currentList.filter((i) => i !== deleteConfirmItem.value);
    const updatedMasters: MasterData = {
      ...masters,
      [deleteConfirmItem.category]: updatedList,
    };
    onSaveMasters(updatedMasters);
    setDeleteConfirmItem(null);
    setSuccessNotice(`Deleted "${deleteConfirmItem.value}" from master list`);
    setTimeout(() => setSuccessNotice(null), 2500);
  };

  // Manual Trigger: Save All to Cloud
  const handleSaveAllToCloud = async () => {
    setIsSavingToCloud(true);
    try {
      await onSaveMasters(masters);
      setCloudSyncedNotice(true);
      setTimeout(() => setCloudSyncedNotice(false), 3500);
    } finally {
      setIsSavingToCloud(false);
    }
  };

  // Export Master Catalog to Excel
  const handleExportExcelCatalog = () => {
    const wb = XLSX.utils.book_new();

    categories.forEach((cat) => {
      const items = masters[cat.id] || [];
      const data = items.map((val, idx) => ({
        'No.': idx + 1,
        Category: cat.title,
        Value: val,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, cat.title.slice(0, 31));
    });

    XLSX.writeFile(wb, `Logistics_Master_Catalog_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Download Master Catalog as PDF
  const handleDownloadPdfCatalog = async () => {
    setIsExportingPdf(true);
    await new Promise((r) => setTimeout(r, 80));
    if (masterCatalogPrintRef.current) {
      await downloadElementAsPdf({
        element: masterCatalogPrintRef.current,
        filename: `Master_Catalog_YokohamaLogistics_${new Date().toISOString().split('T')[0]}.pdf`,
      });
    }
    setIsExportingPdf(false);
  };

  const filteredItems = currentItems.filter((i) =>
    i.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner with Direct Cloud Save and Export Options */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-sky-800 text-xs font-bold uppercase tracking-wider">
            <Database className="w-4 h-4 text-sky-600" />
            <span>Master Configuration</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Master Data Management
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Maintain drop-down master options for Shipping Lines, Destinations, Make & Models, FPOD, Port Names, and Colors.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* Cloud Save Button */}
          <button
            type="button"
            onClick={handleSaveAllToCloud}
            disabled={isSavingToCloud}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
            title="Save and synchronize all master data to Cloud Firestore"
          >
            {isSavingToCloud ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : cloudSyncedNotice ? (
              <CheckCircle2 className="w-4 h-4 text-white" />
            ) : (
              <Cloud className="w-4 h-4" />
            )}
            <span>{cloudSyncedNotice ? 'Cloud Synced!' : 'Save Masters to Cloud'}</span>
          </button>

          {/* Export Excel Catalog */}
          <button
            type="button"
            onClick={handleExportExcelCatalog}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
            title="Export full catalog to Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Excel</span>
          </button>

          {/* Download PDF Catalog */}
          <button
            type="button"
            onClick={handleDownloadPdfCatalog}
            disabled={isExportingPdf}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors"
            title="Download complete Master Catalog as PDF"
          >
            {isExportingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin text-sky-700" />
            ) : (
              <Download className="w-4 h-4 text-sky-700" />
            )}
            <span>PDF Catalog</span>
          </button>
        </div>
      </div>

      {cloudSyncedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>All master lists have been permanently saved & synchronized with Cloud Firestore database!</span>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => {
              setActiveCategory(cat.id);
              setSearchTerm('');
              setEditingItem(null);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg border transition-all whitespace-nowrap shrink-0 ${
              activeCategory === cat.id
                ? 'bg-sky-700 text-white border-sky-700 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat.icon}
            <span>{cat.title}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeCategory === cat.id ? 'bg-sky-800 text-sky-100' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {(masters[cat.id] || []).length}
            </span>
          </button>
        ))}
      </div>

      {/* Active Category Content */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-base font-bold text-slate-900">
            {currentCategoryDef.icon}
            <span>Manage {currentCategoryDef.title}</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{currentCategoryDef.description}</p>
        </div>

        {/* Add Entry Input */}
        <form onSubmit={handleAddItem} className="flex items-center gap-2">
          <input
            type="text"
            value={newItemValue}
            onChange={(e) => setNewItemValue(e.target.value)}
            placeholder={currentCategoryDef.placeholder}
            className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Entry</span>
          </button>
        </form>

        {errorNotice && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorNotice}</span>
          </div>
        )}

        {successNotice && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Search within Category */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Filter ${currentCategoryDef.title.toLowerCase()}...`}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Items Grid with Inline Edit, Update, and Delete */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {filteredItems.length === 0 ? (
            <div className="col-span-full py-8 text-center text-slate-400 text-xs">
              No entries found.
            </div>
          ) : (
            filteredItems.map((item) => {
              const isBeingEdited = editingItem?.value === item;
              return (
                <div
                  key={item}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 text-xs text-slate-800 transition-colors"
                >
                  {isBeingEdited ? (
                    <form onSubmit={handleSaveEdit} className="flex items-center gap-1.5 w-full">
                      <input
                        type="text"
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 px-2 py-1 text-xs bg-white border border-sky-500 rounded focus:outline-none font-semibold text-slate-900"
                      />
                      <button
                        type="submit"
                        className="p-1 text-emerald-600 hover:bg-emerald-100 rounded"
                        title="Save edit"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingItem(null)}
                        className="p-1 text-slate-400 hover:bg-slate-200 rounded"
                        title="Cancel edit"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  ) : (
                    <>
                      <span className="font-semibold truncate">{item}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Edit / Update Button */}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          className="p-1 text-slate-400 hover:text-sky-700 hover:bg-sky-50 rounded transition-colors"
                          title="Edit / Rename entry"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmItem({ category: activeCategory, value: item })}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteConfirmItem(null);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-base font-bold text-slate-900">Delete Master Entry</h4>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete <strong className="text-slate-900">&quot;{deleteConfirmItem.value}&quot;</strong> from{' '}
              {categories.find((c) => c.id === deleteConfirmItem.category)?.title}?
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Master Catalog PDF Template (Offscreen) */}
      <div style={{ position: 'fixed', left: '-9999px', top: '0', width: '800px' }}>
        <div
          ref={masterCatalogPrintRef}
          className="bg-white p-8 font-sans text-slate-900 border border-slate-300"
          style={{ width: '800px', backgroundColor: '#ffffff' }}
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-sky-800 pb-5 mb-5">
            <div>
              <div className="text-[11px] font-bold tracking-widest text-sky-800 uppercase">
                YOKOHAMA TRADING & LOGISTICS • SYSTEM MASTER DIRECTORY
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                MASTER LOGISTICS CATALOG
              </h1>
              <div className="text-sm font-semibold text-slate-600 mt-0.5">
                業務基本マスタ台帳 (Carriers, Ports, Models, Colors)
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <JapaneseSeal text="台帳証" size="md" />
              <span className="text-[10px] text-slate-500 font-mono mt-1">
                EXPORT DATE: {new Date().toISOString().slice(0, 10)}
              </span>
            </div>
          </div>

          {/* Master Categories Sections */}
          <div className="space-y-6">
            {categories.map((cat) => {
              const list = masters[cat.id] || [];
              return (
                <div key={cat.id} className="border border-slate-300 rounded-lg p-4 bg-slate-50/50">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      {cat.title} ({list.length} Records)
                    </h3>
                    <span className="text-[10px] text-slate-500">{cat.description}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {list.length === 0 ? (
                      <div className="col-span-3 text-xs text-slate-400 italic">No entries configured</div>
                    ) : (
                      list.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded bg-white border border-slate-200 text-xs font-semibold text-slate-800 truncate"
                        >
                          <span className="text-[10px] text-slate-400 mr-1.5 font-mono">{idx + 1}.</span>
                          {item}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Notice */}
          <div className="mt-8 pt-4 border-t border-slate-300 flex items-center justify-between text-xs text-slate-500">
            <span>Yokohama Logistics Cloud Database — Verified Master Configuration</span>
            <span className="font-mono">Security: Restricted Administrator Access</span>
          </div>
        </div>
      </div>
    </div>
  );
};
