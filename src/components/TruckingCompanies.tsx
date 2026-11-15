import React, { useState, useMemo, useRef } from 'react';
import { TruckingCompany } from '../types';
import {
  Truck,
  Plus,
  Search,
  Building2,
  Phone,
  Mail,
  FileSpreadsheet,
  Edit2,
  Trash2,
  X,
  MapPin,
  Globe,
  Compass,
  Check,
  Download,
  Filter,
  Printer,
  FileCheck2,
  Loader2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { downloadElementAsPdf } from '../utils/pdfExport';
import { JapaneseSeal } from './JapaneseSeal';

interface TruckingCompaniesProps {
  companies: TruckingCompany[];
  onSaveCompany: (company: TruckingCompany) => void;
  onDeleteCompany: (id: string) => void;
}

// Common Japanese Post Box / Postal Code auto-resolver for logistics hubs
const POST_BOX_DIRECTORY: Record<
  string,
  { prefJp: string; prefEn: string; cityJp: string; cityEn: string }
> = {
  '136-0082': { prefJp: '東京都', prefEn: 'Tokyo', cityJp: '江東区新砂', cityEn: 'Shinsuna, Koto-ku' },
  '140-0002': { prefJp: '東京都', prefEn: 'Tokyo', cityJp: '品川区東品川', cityEn: 'Higashishinagawa, Shinagawa-ku' },
  '231-0005': { prefJp: '神奈川県', prefEn: 'Kanagawa', cityJp: '横浜市中区本町', cityEn: 'Honcho, Naka-ku, Yokohama' },
  '230-0054': { prefJp: '神奈川県', prefEn: 'Kanagawa', cityJp: '横浜市鶴見区大黒ふ頭', cityEn: 'Daikoku Pier, Tsurumi-ku, Yokohama' },
  '455-0032': { prefJp: '愛知県', prefEn: 'Aichi', cityJp: '名古屋市港区入船', cityEn: 'Irifune, Minato-ku, Nagoya' },
  '490-1444': { prefJp: '愛知県', prefEn: 'Aichi', cityJp: '海部郡飛島村', cityEn: 'Tobishima, Ama-gun' },
  '559-0031': { prefJp: '大阪府', prefEn: 'Osaka', cityJp: '大阪市住之江区南港東', cityEn: 'Nankohigashi, Suminoe-ku, Osaka' },
  '650-0024': { prefJp: '兵庫県', prefEn: 'Hyogo', cityJp: '神戸市中央区海岸通', cityEn: 'Kaigandori, Chuo-ku, Kobe' },
  '306-0501': { prefJp: '茨城県', prefEn: 'Ibaraki', cityJp: '坂東市逆井', cityEn: 'Sakasai, Bando-shi' },
  '278-0051': { prefJp: '千葉県', prefEn: 'Chiba', cityJp: '野田市七光台', cityEn: 'Nanakodai, Noda-shi' },
  '801-0841': { prefJp: '福岡県', prefEn: 'Fukuoka', cityJp: '北九州市門司区', cityEn: 'Moji-ku, Kitakyushu' },
};

export const TruckingCompanies: React.FC<TruckingCompaniesProps> = ({
  companies,
  onSaveCompany,
  onDeleteCompany,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPrefecture, setFilterPrefecture] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<TruckingCompany | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [postBoxLookupStatus, setPostBoxLookupStatus] = useState<string | null>(null);

  // PDF Export State
  const [pdfCompany, setPdfCompany] = useState<TruckingCompany | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const companyPrintRef = useRef<HTMLDivElement>(null);

  // Form State - strictly includes all user-requested fields with *
  const [companyNameEn, setCompanyNameEn] = useState('');
  const [companyNameJp, setCompanyNameJp] = useState('');
  const [contactPersonEn, setContactPersonEn] = useState('');
  const [contactPersonJp, setContactPersonJp] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fax, setFax] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [postBox, setPostBox] = useState('');
  const [prefectureEn, setPrefectureEn] = useState('');
  const [prefectureJp, setPrefectureJp] = useState('');
  const [cityEn, setCityEn] = useState('');
  const [cityJp, setCityJp] = useState('');
  const [addressEn, setAddressEn] = useState('');
  const [addressJp, setAddressJp] = useState('');

  const openAddModal = () => {
    setEditingCompany(null);
    setCompanyNameEn('');
    setCompanyNameJp('');
    setContactPersonEn('');
    setContactPersonJp('');
    setEmail('');
    setPhoneNumber('');
    setFax('');
    setMobileNumber('');
    setPostBox('');
    setPrefectureEn('');
    setPrefectureJp('');
    setCityEn('');
    setCityJp('');
    setAddressEn('');
    setAddressJp('');
    setPostBoxLookupStatus(null);
    setIsModalOpen(true);
  };

  const openEditModal = (c: TruckingCompany) => {
    setEditingCompany(c);
    setCompanyNameEn(c.companyNameEn || '');
    setCompanyNameJp(c.companyNameJp || '');
    setContactPersonEn(c.contactPersonEn || '');
    setContactPersonJp(c.contactPersonJp || '');
    setEmail(c.email || '');
    setPhoneNumber(c.phoneNumber || '');
    setFax(c.fax || '');
    setMobileNumber(c.mobileNumber || '');
    setPostBox(c.postBox || '');
    setPrefectureEn(c.prefectureEn || '');
    setPrefectureJp(c.prefectureJp || '');
    setCityEn(c.cityEn || '');
    setCityJp(c.cityJp || '');
    setAddressEn(c.addressEn || '');
    setAddressJp(c.addressJp || '');
    setPostBoxLookupStatus(null);
    setIsModalOpen(true);
  };

  // Search Post Box Feature
  const handleSearchPostBox = () => {
    const cleaned = postBox.trim().replace(/[〒\s]/g, '');
    const standardFormat = cleaned.length === 7 && !cleaned.includes('-')
      ? `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
      : cleaned;

    if (POST_BOX_DIRECTORY[standardFormat]) {
      const match = POST_BOX_DIRECTORY[standardFormat];
      setPrefectureJp(match.prefJp);
      setPrefectureEn(match.prefEn);
      setCityJp(match.cityJp);
      setCityEn(match.cityEn);
      setPostBoxLookupStatus(`Auto-filled: ${match.prefJp} ${match.cityJp}`);
    } else {
      if (cleaned.startsWith('1')) {
        setPrefectureJp('東京都');
        setPrefectureEn('Tokyo');
        setPostBoxLookupStatus('Matched: Tokyo area');
      } else if (cleaned.startsWith('2')) {
        setPrefectureJp('神奈川県');
        setPrefectureEn('Kanagawa');
        setPostBoxLookupStatus('Matched: Kanagawa area');
      } else if (cleaned.startsWith('3')) {
        setPrefectureJp('茨城県 / 埼玉県');
        setPrefectureEn('Kanto (Ibaraki / Saitama)');
        setPostBoxLookupStatus('Matched: Kanto North');
      } else if (cleaned.startsWith('4')) {
        setPrefectureJp('愛知県');
        setPrefectureEn('Aichi');
        setPostBoxLookupStatus('Matched: Aichi / Chubu area');
      } else if (cleaned.startsWith('5')) {
        setPrefectureJp('大阪府');
        setPrefectureEn('Osaka');
        setPostBoxLookupStatus('Matched: Osaka / Kansai area');
      } else if (cleaned.startsWith('6')) {
        setPrefectureJp('兵庫県');
        setPrefectureEn('Hyogo');
        setPostBoxLookupStatus('Matched: Hyogo area');
      } else {
        setPostBoxLookupStatus('Custom Postal Code (Enter city manually)');
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyNameEn.trim()) {
      alert('Company Name (English) is ');
      return;
    }
    if (!companyNameJp.trim()) {
      alert('Company Name (Japanese) is ');
      return;
    }
    if (!contactPersonEn.trim()) {
      alert('Contact Person (English) is ');
      return;
    }
    if (!contactPersonJp.trim()) {
      alert('Contact Person (Japanese) is ');
      return;
    }
    if (!phoneNumber.trim()) {
      alert('Phone Number is ');
      return;
    }
    if (!fax.trim()) {
      alert('Fax is ');
      return;
    }

    const companyToSave: TruckingCompany = {
      id: editingCompany ? editingCompany.id : `tc-${Date.now()}`,
      companyNameEn: companyNameEn.trim(),
      companyNameJp: companyNameJp.trim(),
      contactPersonEn: contactPersonEn.trim(),
      contactPersonJp: contactPersonJp.trim(),
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
      fax: fax.trim(),
      mobileNumber: mobileNumber.trim(),
      postBox: postBox.trim(),
      prefectureEn: prefectureEn.trim(),
      prefectureJp: prefectureJp.trim(),
      cityEn: cityEn.trim(),
      cityJp: cityJp.trim(),
      addressEn: addressEn.trim(),
      addressJp: addressJp.trim(),
      createdAt: editingCompany ? editingCompany.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveCompany(companyToSave);
    setIsModalOpen(false);
  };

  // Extract unique prefectures for filter dropdown
  const uniquePrefectures = useMemo(() => {
    const set = new Set<string>();
    companies.forEach((c) => {
      if (c.prefectureEn) set.add(c.prefectureEn.trim());
      else if (c.prefectureJp) set.add(c.prefectureJp.trim());
    });
    return Array.from(set).sort();
  }, [companies]);

  const filteredCompanies = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return companies.filter((c) => {
      const matchesSearch =
        c.companyNameEn.toLowerCase().includes(q) ||
        c.companyNameJp.toLowerCase().includes(q) ||
        c.contactPersonEn.toLowerCase().includes(q) ||
        c.contactPersonJp.toLowerCase().includes(q) ||
        c.phoneNumber.toLowerCase().includes(q) ||
        c.fax.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.prefectureEn.toLowerCase().includes(q) ||
        c.cityEn.toLowerCase().includes(q) ||
        c.postBox.toLowerCase().includes(q);

      const matchesPref =
        filterPrefecture === 'ALL' ||
        c.prefectureEn.toLowerCase() === filterPrefecture.toLowerCase() ||
        c.prefectureJp === filterPrefecture;

      return matchesSearch && matchesPref;
    });
  }, [companies, searchTerm, filterPrefecture]);

  // Direct PDF Download for Trucking Carrier Registration Card
  const handleDownloadCompanyPdf = async (c: TruckingCompany) => {
    setDownloadingId(c.id);
    setPdfCompany(c);
    await new Promise((r) => setTimeout(r, 80));
    if (companyPrintRef.current) {
      await downloadElementAsPdf({
        element: companyPrintRef.current,
        filename: `Trucking_Carrier_${c.companyNameEn.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 25)}.pdf`,
      });
    }
    setDownloadingId(null);
  };

  const handleExportExcel = () => {
    const data = filteredCompanies.map((c) => ({
      'Company Name (EN)': c.companyNameEn,
      'Company Name (JP)': c.companyNameJp,
      'Contact Person (EN)': c.contactPersonEn,
      'Contact Person (JP)': c.contactPersonJp,
      Phone: c.phoneNumber,
      Fax: c.fax,
      Mobile: c.mobileNumber,
      Email: c.email,
      'Post Box': c.postBox,
      'Prefecture (EN)': c.prefectureEn,
      'Prefecture (JP)': c.prefectureJp,
      'City (EN)': c.cityEn,
      'City (JP)': c.cityJp,
      'Address (EN)': c.addressEn,
      'Address (JP)': c.addressJp,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Trucking_Companies');
    XLSX.writeFile(wb, `Trucking_Companies_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner - Cleaned of Module Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-sky-800 text-xs font-bold uppercase tracking-wider">
            <Truck className="w-4 h-4 text-sky-600" />
            <span>Carrier Network</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Trucking Companies & Carrier Master
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Bilingual English & Japanese carrier master, postal auto-lookup, and fleet contacts.
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
            <span>Add Trucking Company</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search company (English/Japanese), contact person, phone, post box, prefecture..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
          />
        </div>

        {/* Prefecture Filter */}
        <div className="flex items-center gap-2 bg-white px-3 py-2 border border-slate-200 rounded-lg shadow-xs shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Prefecture:</span>
          <select
            value={filterPrefecture}
            onChange={(e) => setFilterPrefecture(e.target.value)}
            className="text-xs font-semibold text-slate-800 bg-transparent border-none focus:ring-0 cursor-pointer"
          >
            <option value="ALL">All Prefectures</option>
            {uniquePrefectures.map((pref) => (
              <option key={pref} value={pref}>
                {pref}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
                <th className="py-3 px-4">Company Name (English / Japanese)*</th>
                <th className="py-3 px-4">Contact Person (EN / JP)*</th>
                <th className="py-3 px-4">Phone* / Fax / Mobile</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Post Box & Location</th>
                <th className="py-3 px-4">Address (EN & JP)</th>
                <th className="py-3 px-4 text-right">Actions & PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No trucking companies registered yet.
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{c.companyNameEn}</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">{c.companyNameJp}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{c.contactPersonEn}</div>
                      <div className="text-slate-400 text-[11px]">{c.contactPersonJp}</div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 space-y-0.5">
                      <div className="flex items-center gap-1 font-semibold">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{c.phoneNumber}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        <span className="text-slate-400">FAX:</span> {c.fax}
                      </div>
                      {c.mobileNumber && (
                        <div className="text-[11px] text-sky-700">
                          <span className="text-slate-400">MOB:</span> {c.mobileNumber}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {c.email ? (
                        <div className="flex items-center gap-1 text-sky-700">
                          <Mail className="w-3 h-3 text-sky-500 shrink-0" />
                          <span className="truncate max-w-[150px]">{c.email}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {c.postBox && (
                        <div className="font-mono font-medium text-slate-800">〒{c.postBox}</div>
                      )}
                      <div>
                        {c.prefectureEn} {c.cityEn}
                      </div>
                      {(c.prefectureJp || c.cityJp) && (
                        <div className="text-[11px] text-slate-400">
                          {c.prefectureJp} {c.cityJp}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs text-slate-600">
                      <div className="truncate">{c.addressEn || '-'}</div>
                      {c.addressJp && (
                        <div className="truncate text-slate-400 text-[11px] mt-0.5">
                          {c.addressJp}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* 1-Click PDF Download Button */}
                        <button
                          type="button"
                          onClick={() => handleDownloadCompanyPdf(c)}
                          disabled={downloadingId === c.id}
                          className="px-2.5 py-1 text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded flex items-center gap-1 transition-colors"
                          title="Download Carrier Profile & Registration PDF"
                        >
                          {downloadingId === c.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                          ) : (
                            <Download className="w-3.5 h-3.5 text-sky-600" />
                          )}
                          <span>PDF</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(c)}
                          className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded transition-colors"
                          title="Edit Company"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(c.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Delete Company"
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

      {/* Add / Edit Trucking Company Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden my-6 border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-sky-700" />
                <h3 className="text-lg font-bold text-slate-900">
                  {editingCompany ? 'Edit Trucking Company' : 'Add Trucking Company'}
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
              {/* Bilingual Company Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Company Name (English)
                  </label>
                  <input
                    type="text"
                    
                    value={companyNameEn}
                    onChange={(e) => setCompanyNameEn(e.target.value)}
                    placeholder="e.g. TOKYO EXPRESS TRANSPORT CO., LTD."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Company Name (Japanese)
                  </label>
                  <input
                    type="text"
                    
                    value={companyNameJp}
                    onChange={(e) => setCompanyNameJp(e.target.value)}
                    placeholder="e.g. 東京エクスプレス輸送株式会社"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-semibold"
                  />
                </div>
              </div>

              {/* Bilingual Contact Persons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Contact Person (English)
                  </label>
                  <input
                    type="text"
                    
                    value={contactPersonEn}
                    onChange={(e) => setContactPersonEn(e.target.value)}
                    placeholder="e.g. Takeshi Yamada (Fleet Coordinator)"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Contact Person (Japanese)
                  </label>
                  <input
                    type="text"
                    
                    value={contactPersonJp}
                    onChange={(e) => setContactPersonJp(e.target.value)}
                    placeholder="e.g. 山田 健司"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. 03-5599-8800"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Fax
                  </label>
                  <input
                    type="text"
                    
                    value={fax}
                    onChange={(e) => setFax(e.target.value)}
                    placeholder="e.g. 03-5599-8801"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="e.g. 090-3344-9988"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. dispatch@tokyo-express-transport.co.jp"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Post Box and Search Post Box Helper */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase">
                    Postal Code & Auto-Location
                  </span>
                  {postBoxLookupStatus && (
                    <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      {postBoxLookupStatus}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={postBox}
                      onChange={(e) => setPostBox(e.target.value)}
                      placeholder="Post Box (Postal Code e.g. 136-0082, 231-0005, 455-0032)"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSearchPostBox}
                    className="px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg shadow-xs flex items-center gap-1.5 shrink-0"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Search Post Box</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Tip: Clicking &quot;Search Post Box&quot; will automatically fill Prefecture and City in both English and Japanese.
                </p>
              </div>

              {/* Bilingual Prefecture */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Prefecture (English)
                  </label>
                  <input
                    type="text"
                    value={prefectureEn}
                    onChange={(e) => setPrefectureEn(e.target.value)}
                    placeholder="e.g. Tokyo / Kanagawa / Aichi"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Prefecture (Japanese)
                  </label>
                  <input
                    type="text"
                    value={prefectureJp}
                    onChange={(e) => setPrefectureJp(e.target.value)}
                    placeholder="e.g. 東京都 / 神奈川県 / 愛知県"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Bilingual City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    City (English)
                  </label>
                  <input
                    type="text"
                    value={cityEn}
                    onChange={(e) => setCityEn(e.target.value)}
                    placeholder="e.g. Koto-ku / Yokohama-shi Naka-ku"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    City (Japanese)
                  </label>
                  <input
                    type="text"
                    value={cityJp}
                    onChange={(e) => setCityJp(e.target.value)}
                    placeholder="e.g. 江東区 / 横浜市中区"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Bilingual Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Address (English)
                  </label>
                  <input
                    type="text"
                    value={addressEn}
                    onChange={(e) => setAddressEn(e.target.value)}
                    placeholder="e.g. 3-5-18 Shinsuna, Koto-ku, Tokyo"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Address (Japanese)
                  </label>
                  <input
                    type="text"
                    value={addressJp}
                    onChange={(e) => setAddressJp(e.target.value)}
                    placeholder="e.g. 東京都江東区新砂3-5-18 エクスプレス物流ビル4F"
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
                  {editingCompany ? 'Save Changes' : 'Save Trucking Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4 border border-slate-200">
            <h4 className="text-base font-bold text-slate-900">Confirm Deletion</h4>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete this trucking company profile?
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
                  onDeleteCompany(deleteConfirmId);
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

      {/* Offscreen Printable DOM Element for Trucking Company PDF Certificate */}
      {pdfCompany && (
        <div style={{ position: 'fixed', left: '-9999px', top: '0', width: '800px' }}>
          <div
            ref={companyPrintRef}
            className="bg-white p-8 font-sans text-slate-900 border border-slate-300"
            style={{ width: '800px', backgroundColor: '#ffffff' }}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b-2 border-sky-800 pb-5 mb-5">
              <div>
                <div className="text-[11px] font-bold tracking-widest text-sky-800 uppercase">
                  YOKOHAMA TRADING & LOGISTICS • CARRIER PARTNER
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                  TRUCKING CONTRACTOR REGISTRATION
                </h1>
                <div className="text-sm font-semibold text-slate-600 mt-0.5">
                  指定陸送会社 登録証明台帳
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <JapaneseSeal text="陸送証" size="md" />
                <span className="text-[10px] text-slate-500 font-mono mt-1">
                  ISSUED: {new Date().toISOString().slice(0, 10)}
                </span>
              </div>
            </div>

            {/* Carrier Details Card */}
            <div className="p-5 rounded-lg border border-slate-300 bg-slate-50/70 mb-5 space-y-4">
              <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-3">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Company Name (English)</div>
                  <div className="text-base font-bold text-slate-900">{pdfCompany.companyNameEn}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Company Name (Japanese)</div>
                  <div className="text-base font-bold text-slate-900">{pdfCompany.companyNameJp}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-3">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Contact Person (English)</div>
                  <div className="text-sm font-bold text-slate-800">{pdfCompany.contactPersonEn}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Contact Person (Japanese)</div>
                  <div className="text-sm font-bold text-slate-800">{pdfCompany.contactPersonJp}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-b border-slate-200 pb-3">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Telephone</div>
                  <div className="text-sm font-bold font-mono text-slate-900">{pdfCompany.phoneNumber}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Fax Number</div>
                  <div className="text-sm font-bold font-mono text-slate-900">{pdfCompany.fax}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Mobile Number</div>
                  <div className="text-sm font-bold font-mono text-slate-900">{pdfCompany.mobileNumber || '-'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-3">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Email Address</div>
                  <div className="text-sm font-mono text-sky-800">{pdfCompany.email || '-'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Postal Code (Post Box)</div>
                  <div className="text-sm font-bold font-mono text-slate-900">
                    {pdfCompany.postBox ? `〒${pdfCompany.postBox}` : '-'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-3">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Location (English)</div>
                  <div className="text-xs text-slate-800 font-medium">
                    {pdfCompany.prefectureEn} {pdfCompany.cityEn}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Location (Japanese)</div>
                  <div className="text-xs text-slate-800 font-medium">
                    {pdfCompany.prefectureJp} {pdfCompany.cityJp}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Registered Address (English)</div>
                  <div className="text-xs text-slate-800">{pdfCompany.addressEn || '-'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Registered Address (Japanese)</div>
                  <div className="text-xs text-slate-800">{pdfCompany.addressJp || '-'}</div>
                </div>
              </div>
            </div>

            {/* Official Certification Notice */}
            <div className="border border-slate-300 rounded-lg p-4 bg-white text-xs text-slate-700 leading-relaxed mb-6">
              <div className="font-bold text-slate-900 mb-1">CERTIFICATION STATEMENT (陸送協約条項)</div>
              This document certifies that the above-named transport contractor is registered in the Yokohama
              Logistics management system. Fleet vehicles operated by this partner are authorized for yard collection,
              auction transport, and port delivery under the terms of service.
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-300 text-xs">
              <div className="border border-dashed border-slate-300 p-4 rounded text-center">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Authorized Dispatch Officer</div>
                <div className="mt-8 pt-2 border-t border-slate-400 font-semibold text-slate-800">
                  Yokohama Logistics Dispatch Dept.
                </div>
              </div>
              <div className="border border-dashed border-slate-300 p-4 rounded text-center">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Partner Fleet Representative</div>
                <div className="mt-8 pt-2 border-t border-slate-400 font-semibold text-slate-800">
                  {pdfCompany.contactPersonEn}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
