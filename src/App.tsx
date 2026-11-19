import { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import {
  BookingConfirmation,
  FreightInvoice,
  InvoiceStatus,
  CompanyProfile,
  ActiveTab,
  AppUser,
  AuthSession,
  Language,
  Customer,
  Shipper,
  Consignee,
  NotifyParty,
  StockItem,
  TruckingSheet,
  TruckingCompany,
  MasterData,
  KycRecord,
  Quotation,
  ShippingLinePayment,
} from './types';
import {
  getCompanyProfile,
  saveCompanyProfile,
  getBookings,
  saveBookings,
  getInvoices,
  saveInvoices,
  getQuotations,
  saveQuotations,
  getShippingLinePayments,
  saveShippingLinePayments,
  getUsers,
  saveUsers,
  getCurrentSession,
  saveCurrentSession,
  clearCurrentSession,
  resetAllToDefault,
  getCustomers,
  saveCustomers,
  getShippers,
  saveShippers,
  getConsignees,
  saveConsignees,
  getNotifyParties,
  saveNotifyParties,
  getStocks,
  saveStocks,
  getTruckingSheets,
  saveTruckingSheets,
  getTruckingCompanies,
  saveTruckingCompanies,
  getMasters,
  saveMasters,
  getKycRecords,
  saveKycRecords,
} from './utils/storage';
import {
  initializeAndSeedCloudData,
  subscribeToCloudBookings,
  saveBookingToCloud,
  deleteBookingFromCloud,
  subscribeToCloudInvoices,
  saveInvoiceToCloud,
  deleteInvoiceFromCloud,
  subscribeToCloudQuotations,
  saveQuotationToCloud,
  deleteQuotationFromCloud,
  subscribeToCloudShippingLinePayments,
  saveShippingLinePaymentToCloud,
  deleteShippingLinePaymentFromCloud,
  subscribeToCloudCompanyProfile,
  saveCompanyProfileToCloud,
  subscribeToCloudUsers,
  saveUserToCloud,
  deleteUserFromCloud,
  subscribeToCloudCustomers,
  saveCustomerToCloud,
  deleteCustomerFromCloud,
  subscribeToCloudShippers,
  saveShipperToCloud,
  deleteShipperFromCloud,
  subscribeToCloudConsignees,
  saveConsigneeToCloud,
  deleteConsigneeFromCloud,
  subscribeToCloudNotifyParties,
  saveNotifyPartyToCloud,
  deleteNotifyPartyFromCloud,
  subscribeToCloudStocks,
  saveStockToCloud,
  deleteStockFromCloud,
  subscribeToCloudTruckingSheets,
  saveTruckingSheetToCloud,
  deleteTruckingSheetFromCloud,
  subscribeToCloudTruckingCompanies,
  saveTruckingCompanyToCloud,
  deleteTruckingCompanyFromCloud,
  subscribeToCloudMasters,
  saveMastersToCloud,
  subscribeToCloudKycRecords,
  saveKycRecordToCloud,
  deleteKycRecordFromCloud,
  subscribeToCloudStatus,
  getCloudStatus,
  CloudSyncStatus,
} from './services/firebase';
import {
  computeOverallProfitLossSummary,
  computeCustomerInvoiceFinance,
  computeShippingPaymentFinance,
  matchByShipmentKeys,
  formatContainerSummary,
} from './utils/interconnection';
import { exportAllRecordsToExcel } from './utils/excelExport';
import { downloadElementAsPdf } from './utils/pdfExport';
import { getStoredLanguage, setStoredLanguage, translations } from './utils/translations';
import { Header } from './components/Header';
import { LoginPage } from './components/LoginPage';
import { AdminTeamManagement } from './components/AdminTeamManagement';
import { StatsOverview } from './components/StatsOverview';
import { BookingList } from './components/BookingList';
import { InvoiceList } from './components/InvoiceList';
import { BookingFormModal } from './components/BookingFormModal';
import { InvoiceFormModal } from './components/InvoiceFormModal';
import { DocumentViewModal } from './components/DocumentViewModal';
import { CompanyProfileModal } from './components/CompanyProfileModal';
import { SendCustomerModal } from './components/SendCustomerModal';
import { BookingDocumentView } from './components/BookingDocumentView';
import { InvoiceDocumentView } from './components/InvoiceDocumentView';
import { QuotationDocumentView } from './components/QuotationDocumentView';
import { QuotationManagement } from './components/QuotationManagement';
import { CustomerPaymentManagement } from './components/CustomerPaymentManagement';
import { ShippingLinePaymentManagement } from './components/ShippingLinePaymentManagement';
import { CustomerManagement } from './components/CustomerManagement';
import { KycManagement } from './components/KycManagement';
import { MasterDataManager } from './components/MasterDataManager';
import { KycPrintModal } from './components/KycPrintModal';
import {
  FileText,
  Receipt,
  FileSpreadsheet,
  Plus,
  ArrowRight,
  ShieldCheck,
  Download,
  Check,
  Loader2,
  Users,
  FileCheck2,
  Cloud,
  Wallet,
  Anchor,
  AlertTriangle,
} from 'lucide-react';

export default function App() {
  const [company, setCompany] = useState<CompanyProfile>(getCompanyProfile);
  const [bookings, setBookings] = useState<BookingConfirmation[]>(getBookings);
  const [invoices, setInvoices] = useState<FreightInvoice[]>(getInvoices);
  const [quotations, setQuotations] = useState<Quotation[]>(getQuotations);
  const [shippingLinePayments, setShippingLinePayments] = useState<ShippingLinePayment[]>(
    getShippingLinePayments
  );
  const [users, setUsers] = useState<AppUser[]>(getUsers);
  const [session, setSession] = useState<AuthSession>(getCurrentSession);
  const [language, setLanguage] = useState<Language>(getStoredLanguage);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Logistics Module State
  const [customers, setCustomers] = useState<Customer[]>(getCustomers);
  const [shippers, setShippers] = useState<Shipper[]>(getShippers);
  const [consignees, setConsignees] = useState<Consignee[]>(getConsignees);
  const [notifyParties, setNotifyParties] = useState<NotifyParty[]>(getNotifyParties);
  const [stocks, setStocks] = useState<StockItem[]>(getStocks);
  const [truckingSheets, setTruckingSheets] = useState<TruckingSheet[]>(getTruckingSheets);
  const [truckingCompanies, setTruckingCompanies] = useState<TruckingCompany[]>(getTruckingCompanies);
  const [masters, setMasters] = useState<MasterData>(getMasters);
  const [kycRecords, setKycRecords] = useState<KycRecord[]>(getKycRecords);

  const t = translations[language];

  const handleToggleLanguage = (newLang: Language) => {
    setLanguage(newLang);
    setStoredLanguage(newLang);
  };

  // Modals state
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<BookingConfirmation | null>(null);

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<FreightInvoice | null>(null);
  const [invoiceModalFocusSection, setInvoiceModalFocusSection] = useState<'billing' | 'costing'>(
    'billing'
  );
  const [prefillBookingForInvoice, setPrefillBookingForInvoice] =
    useState<BookingConfirmation | null>(null);
  const [prefillQuotationForInvoice, setPrefillQuotationForInvoice] =
    useState<Quotation | null>(null);

  // Cross-module quick-creation & editing states for Quotation & Shipping Line Payment
  const [prefillBookingForQuote, setPrefillBookingForQuote] =
    useState<BookingConfirmation | null>(null);
  const [isQuoteExternalOpen, setIsQuoteExternalOpen] = useState(false);
  const [editingQuotationForTab, setEditingQuotationForTab] = useState<Quotation | null>(null);

  const [prefillBookingForSlPay, setPrefillBookingForSlPay] =
    useState<BookingConfirmation | null>(null);
  const [prefillQuotationForSlPay, setPrefillQuotationForSlPay] =
    useState<Quotation | null>(null);
  const [isSlPayExternalOpen, setIsSlPayExternalOpen] = useState(false);

  const [isDocViewOpen, setIsDocViewOpen] = useState(false);
  const [docViewType, setDocViewType] = useState<'booking' | 'invoice' | 'quotation'>('booking');
  const [viewingBooking, setViewingBooking] = useState<BookingConfirmation | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<FreightInvoice | null>(null);
  const [viewingQuotation, setViewingQuotation] = useState<Quotation | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // KYC Print Modal State
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [kycBooking, setKycBooking] = useState<BookingConfirmation | null>(null);

  // Send to Customer Modal state
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [sendDocType, setSendDocType] = useState<'booking' | 'invoice' | 'quotation'>('booking');
  const [sendBooking, setSendBooking] = useState<BookingConfirmation | null>(null);
  const [sendInvoice, setSendInvoice] = useState<FreightInvoice | null>(null);
  const [sendQuotation, setSendQuotation] = useState<Quotation | null>(null);

  // Offscreen PDF state for instant table-row PDF downloads
  const [activeBookingForPdf, setActiveBookingForPdf] = useState<BookingConfirmation | null>(
    () => bookings[0] || null
  );
  const [activeInvoiceForPdf, setActiveInvoiceForPdf] = useState<FreightInvoice | null>(
    () => invoices[0] || null
  );
  const [activeQuotationForPdf, setActiveQuotationForPdf] = useState<Quotation | null>(
    () => quotations[0] || null
  );
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);
  const [cloudSaveError, setCloudSaveError] = useState<string | null>(null);

  const [cloudStatus, setCloudStatus] = useState<CloudSyncStatus>(getCloudStatus);

  // Initialize and subscribe to real-time Cloud Firestore updates
  useEffect(() => {
    initializeAndSeedCloudData();

    const unsubStatus = subscribeToCloudStatus(setCloudStatus);
    const unsubBookings = subscribeToCloudBookings(setBookings);
    const unsubInvoices = subscribeToCloudInvoices(setInvoices);
    const unsubQuotations = subscribeToCloudQuotations(setQuotations);
    const unsubSlPayments = subscribeToCloudShippingLinePayments(setShippingLinePayments);
    const unsubCompany = subscribeToCloudCompanyProfile(setCompany);
    const unsubUsers = subscribeToCloudUsers(setUsers);
    const unsubCust = subscribeToCloudCustomers(setCustomers);
    const unsubShip = subscribeToCloudShippers(setShippers);
    const unsubCon = subscribeToCloudConsignees(setConsignees);
    const unsubNot = subscribeToCloudNotifyParties(setNotifyParties);
    const unsubStocks = subscribeToCloudStocks(setStocks);
    const unsubSheets = subscribeToCloudTruckingSheets(setTruckingSheets);
    const unsubTrkCo = subscribeToCloudTruckingCompanies(setTruckingCompanies);
    const unsubMasters = subscribeToCloudMasters(setMasters);
    const unsubKyc = subscribeToCloudKycRecords(setKycRecords);

    return () => {
      unsubStatus();
      unsubBookings();
      unsubInvoices();
      unsubQuotations();
      unsubSlPayments();
      unsubCompany();
      unsubUsers();
      unsubCust();
      unsubShip();
      unsubCon();
      unsubNot();
      unsubStocks();
      unsubSheets();
      unsubTrkCo();
      unsubMasters();
      unsubKyc();
    };
  }, []);

  // --- Auth Handlers ---
  const handleLoginSuccess = (user: AppUser) => {
    const updatedUsers = users.map((u) => (u.id === user.id ? user : u));
    setUsers(updatedUsers);
    saveUsers(updatedUsers);
    saveUserToCloud(user).catch(console.error);

    const newSession: AuthSession = {
      currentUser: user,
      isAuthenticated: true,
      loginTimestamp: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };
    setSession(newSession);
    saveCurrentSession(newSession);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    clearCurrentSession();
    setSession({
      currentUser: null,
      isAuthenticated: false,
    });
  };

  // --- User Management Handlers (Admin) ---
  const handleAddUser = (newUser: AppUser) => {
    setCloudSaveError(null);
    const updated = [newUser, ...users];
    setUsers(updated);
    saveUsers(updated);
    saveUserToCloud(newUser).catch((err) => {
      console.error(err);
      setCloudSaveError(`Failed to save user "${newUser.userId}" to database.`);
    });
  };

  const handleUpdateUser = (updatedUser: AppUser) => {
    setCloudSaveError(null);
    const updated = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    setUsers(updated);
    saveUsers(updated);
    saveUserToCloud(updatedUser).catch((err) => {
      console.error(err);
      setCloudSaveError(`Failed to update user "${updatedUser.userId}" in database.`);
    });
    if (session.currentUser?.id === updatedUser.id) {
      const updatedSession = { ...session, currentUser: updatedUser };
      setSession(updatedSession);
      saveCurrentSession(updatedSession);
    }
  };

  const handleDeleteUser = (userId: string) => {
    const updated = users.filter((u) => u.id !== userId);
    setUsers(updated);
    saveUsers(updated);
    deleteUserFromCloud(userId).catch(console.error);
  };

  // Direct PDF Download Handler for Bookings
  const handleDirectDownloadBooking = async (booking: BookingConfirmation) => {
    try {
      setDownloadingId(booking.id);
      flushSync(() => {
        setActiveBookingForPdf(booking);
      });
      await new Promise((r) => setTimeout(r, 60));
      await downloadElementAsPdf({
        elementId: 'direct-pdf-booking',
        filename: `Booking_Confirmation_${booking.bookingNumber}.pdf`,
      });
      setDownloadSuccessMessage(`Booking #${booking.bookingNumber} PDF downloaded!`);
      setTimeout(() => setDownloadSuccessMessage(null), 3500);
    } catch (err) {
      console.error('PDF download error:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  // Direct PDF Download Handler for Invoices
  const handleDirectDownloadInvoice = async (invoice: FreightInvoice) => {
    try {
      setDownloadingId(invoice.id);
      flushSync(() => {
        setActiveInvoiceForPdf(invoice);
      });
      await new Promise((r) => setTimeout(r, 60));
      await downloadElementAsPdf({
        elementId: 'direct-pdf-invoice',
        filename: `Freight_Invoice_${invoice.invoiceNo}.pdf`,
      });
      setDownloadSuccessMessage(`Invoice #${invoice.invoiceNo} PDF downloaded!`);
      setTimeout(() => setDownloadSuccessMessage(null), 3500);
    } catch (err) {
      console.error('PDF download error:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  // Direct PDF Download Handler for Quotations
  const handleDirectDownloadQuotation = async (quotation: Quotation) => {
    try {
      setDownloadingId(quotation.id);
      flushSync(() => {
        setActiveQuotationForPdf(quotation);
      });
      await new Promise((r) => setTimeout(r, 60));
      await downloadElementAsPdf({
        elementId: 'direct-pdf-quotation',
        filename: `Quotation_${quotation.quotationNo}.pdf`,
      });
      setDownloadSuccessMessage(`Quotation #${quotation.quotationNo} PDF downloaded!`);
      setTimeout(() => setDownloadSuccessMessage(null), 3500);
    } catch (err) {
      console.error('Quotation PDF download error:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  // Send to Customer Handlers
  const handleSendBooking = (booking: BookingConfirmation) => {
    setSendBooking(booking);
    setSendInvoice(null);
    setSendQuotation(null);
    setSendDocType('booking');
    setIsSendModalOpen(true);
  };

  const handleSendInvoice = (invoice: FreightInvoice) => {
    setSendInvoice(invoice);
    setSendBooking(null);
    setSendQuotation(null);
    setSendDocType('invoice');
    setIsSendModalOpen(true);
  };

  const handleSendQuotation = (quotation: Quotation) => {
    setSendQuotation(quotation);
    setSendBooking(null);
    setSendInvoice(null);
    setSendDocType('quotation');
    setIsSendModalOpen(true);
  };

  // KYC Print Handler
  const handleOpenKycModal = (booking: BookingConfirmation) => {
    setKycBooking(booking);
    setIsKycModalOpen(true);
  };

  // --- Booking CRUD Handlers + Cross-Module Cascade Sync ---
  const handleSaveBooking = (booking: BookingConfirmation) => {
    const exists = bookings.some((b) => b.id === booking.id);
    const updated = exists
      ? bookings.map((b) => (b.id === booking.id ? booking : b))
      : [booking, ...bookings];
    setBookings(updated);
    saveBookings(updated);
    saveBookingToCloud(booking).catch(console.error);

    // Cascade shared booking details across connected Quotations, Invoices & Shipping Line Payments
    const targetKeys = {
      id: booking.id,
      bookingNo: booking.bookingNumber,
      shipmentNo: booking.shipmentNo,
      blNo: booking.blNo,
    };
    const vesselVoy = `${booking.vessel} ${booking.voyage}`.trim();
    const containerSummary = formatContainerSummary(booking);
    const now = new Date().toISOString();

    let quotesChanged = false;
    const syncedQuotes = quotations.map((q) => {
      if (
        matchByShipmentKeys(
          {
            bookingId: q.linkedBookingId,
            bookingNo: q.bookingNo,
            shipmentNo: q.shipmentNo,
            blNo: q.blNo,
          },
          targetKeys
        )
      ) {
        quotesChanged = true;
        const patched: Quotation = {
          ...q,
          linkedBookingId: booking.id,
          bookingNo: booking.bookingNumber,
          shipmentNo: booking.shipmentNo || q.shipmentNo,
          blNo: booking.blNo || q.blNo,
          customerName: booking.customerCompany || q.customerName,
          shippingCompany: booking.shippingCompany || q.shippingCompany,
          vesselVoyage: vesselVoy || q.vesselVoyage,
          portFrom: booking.pol || booking.por || q.portFrom,
          portTo: booking.pod || q.portTo,
          etd: booking.etd || q.etd,
          eta: booking.eta || q.eta,
          cyOpenDate: booking.cyCutOpen || booking.cyOpenDate || q.cyOpenDate,
          cyCutDate: booking.cyCutDate || q.cyCutDate,
          containerCount: booking.containerCount || q.containerCount,
          containerSize: booking.containerSize || q.containerSize,
          containerNumbers: booking.containerNumbers || q.containerNumbers,
          updatedAt: now,
        };
        saveQuotationToCloud(patched).catch(console.error);
        return patched;
      }
      return q;
    });
    if (quotesChanged) {
      setQuotations(syncedQuotes);
      saveQuotations(syncedQuotes);
    }

    let invsChanged = false;
    const syncedInvs = invoices.map((inv) => {
      if (
        matchByShipmentKeys(
          {
            bookingId: inv.linkedBookingId,
            bookingNo: inv.bookingNo,
            shipmentNo: inv.shipmentNo,
            blNo: inv.blNo,
          },
          targetKeys
        )
      ) {
        invsChanged = true;
        const patched: FreightInvoice = {
          ...inv,
          linkedBookingId: booking.id,
          bookingNo: booking.bookingNumber,
          shipmentNo: booking.shipmentNo || inv.shipmentNo,
          blNo: booking.blNo || inv.blNo,
          customerName: booking.customerCompany || inv.customerName,
          shippingCompany: booking.shippingCompany || inv.shippingCompany,
          vesselVoyage: vesselVoy || inv.vesselVoyage,
          portFrom: booking.pol || booking.por || inv.portFrom,
          portTo: booking.pod || inv.portTo,
          etd: booking.etd || inv.etd,
          eta: booking.eta || inv.eta,
          containerCount: booking.containerCount || inv.containerCount,
          containerSize: booking.containerSize || inv.containerSize,
          containerNumbers: booking.containerNumbers || inv.containerNumbers,
          updatedAt: now,
        };
        saveInvoiceToCloud(patched).catch(console.error);
        return patched;
      }
      return inv;
    });
    if (invsChanged) {
      setInvoices(syncedInvs);
      saveInvoices(syncedInvs);
    }

    let slChanged = false;
    const syncedSl = shippingLinePayments.map((p) => {
      if (
        matchByShipmentKeys(
          {
            bookingId: p.linkedBookingId,
            bookingNo: p.bookingNo,
            shipmentNo: p.shipmentNo,
            blNo: p.blNo,
          },
          targetKeys
        )
      ) {
        slChanged = true;
        const patched: ShippingLinePayment = {
          ...p,
          linkedBookingId: booking.id,
          bookingNo: booking.bookingNumber,
          shipmentNo: booking.shipmentNo || p.shipmentNo,
          blNo: booking.blNo || p.blNo,
          customerName: booking.customerCompany || p.customerName,
          shippingLineName: booking.shippingCompany || p.shippingLineName,
          vesselVoyage: vesselVoy || p.vesselVoyage,
          portFrom: booking.pol || booking.por || p.portFrom,
          portTo: booking.pod || p.portTo,
          containerCount: booking.containerCount || p.containerCount,
          containerSize: booking.containerSize || p.containerSize,
          containerDetails: containerSummary || p.containerDetails,
          updatedAt: now,
        };
        saveShippingLinePaymentToCloud(patched).catch(console.error);
        return patched;
      }
      return p;
    });
    if (slChanged) {
      setShippingLinePayments(syncedSl);
      saveShippingLinePayments(syncedSl);
    }
  };

  const handleDeleteBooking = (id: string) => {
    const updated = bookings.filter((b) => b.id !== id);
    setBookings(updated);
    saveBookings(updated);
    deleteBookingFromCloud(id).catch(console.error);
  };

  const handleDuplicateBooking = (booking: BookingConfirmation) => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const duplicated: BookingConfirmation = {
      ...booking,
      id: `bkg-${Date.now()}`,
      bookingNumber: `TYO${randomNum}`,
      date: new Date().toISOString().slice(0, 10),
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [duplicated, ...bookings];
    setBookings(updated);
    saveBookings(updated);
    saveBookingToCloud(duplicated).catch(console.error);
  };

  const handleViewBooking = (booking: BookingConfirmation) => {
    setViewingBooking(booking);
    setViewingInvoice(null);
    setViewingQuotation(null);
    setDocViewType('booking');
    setIsDocViewOpen(true);
  };

  const handleEditBooking = (booking: BookingConfirmation) => {
    setEditingBooking(booking);
    setIsBookingModalOpen(true);
  };

  // --- Quotation CRUD & Cascade Handlers (NO auto-costing on quotation save) ---
  const handleSaveQuotation = (quotation: Quotation) => {
    const exists = quotations.some((q) => q.id === quotation.id);
    const updated = exists
      ? quotations.map((q) => (q.id === quotation.id ? quotation : q))
      : [quotation, ...quotations];
    setQuotations(updated);
    saveQuotations(updated);
    saveQuotationToCloud(quotation).catch(console.error);

    const now = new Date().toISOString();

    // Propagate updated shipmentNo / blNo to linked booking & SL payments if changed
    const qKeys = {
      bookingId: quotation.linkedBookingId,
      bookingNo: quotation.bookingNo,
      shipmentNo: quotation.shipmentNo,
      blNo: quotation.blNo,
    };

    if (quotation.shipmentNo || quotation.blNo) {
      let bkChanged = false;
      const syncedBk = bookings.map((b) => {
        if (
          matchByShipmentKeys(
            { id: b.id, bookingNo: b.bookingNumber, shipmentNo: b.shipmentNo, blNo: b.blNo },
            qKeys
          )
        ) {
          bkChanged = true;
          const patched: BookingConfirmation = {
            ...b,
            shipmentNo: quotation.shipmentNo || b.shipmentNo,
            blNo: quotation.blNo || b.blNo,
            updatedAt: now,
          };
          saveBookingToCloud(patched).catch(console.error);
          return patched;
        }
        return b;
      });
      if (bkChanged) {
        setBookings(syncedBk);
        saveBookings(syncedBk);
      }

      let slChanged = false;
      const syncedSl = shippingLinePayments.map((p) => {
        if (
          p.linkedQuotationId === quotation.id ||
          matchByShipmentKeys(
            {
              bookingId: p.linkedBookingId,
              bookingNo: p.bookingNo,
              shipmentNo: p.shipmentNo,
              blNo: p.blNo,
            },
            qKeys
          )
        ) {
          slChanged = true;
          const patched: ShippingLinePayment = {
            ...p,
            linkedQuotationId: quotation.id,
            shipmentNo: quotation.shipmentNo || p.shipmentNo,
            blNo: quotation.blNo || p.blNo,
            customerName: quotation.customerName || p.customerName,
            updatedAt: now,
          };
          saveShippingLinePaymentToCloud(patched).catch(console.error);
          return patched;
        }
        return p;
      });
      if (slChanged) {
        setShippingLinePayments(syncedSl);
        saveShippingLinePayments(syncedSl);
      }
    }
  };

  const handleDeleteQuotation = (id: string) => {
    const updated = quotations.filter((q) => q.id !== id);
    setQuotations(updated);
    saveQuotations(updated);
    deleteQuotationFromCloud(id).catch(console.error);
  };

  const handleViewQuotation = (quotation: Quotation) => {
    setViewingQuotation(quotation);
    setViewingBooking(null);
    setViewingInvoice(null);
    setDocViewType('quotation');
    setIsDocViewOpen(true);
  };

  const handleCreateQuotationFromBooking = (booking: BookingConfirmation) => {
    setEditingQuotationForTab(null);
    setPrefillBookingForQuote(booking);
    setIsQuoteExternalOpen(true);
    setActiveTab('quotations');
  };

  const handleConvertQuotationToInvoice = (quotation: Quotation) => {
    setEditingInvoice(null);
    setInvoiceModalFocusSection('billing');
    setPrefillBookingForInvoice(null);
    setPrefillQuotationForInvoice(quotation);
    setIsInvoiceModalOpen(true);
  };

  // --- Shipping Line Payment CRUD & Cascade Handlers ---
  const handleSaveShippingPayment = (payment: ShippingLinePayment) => {
    const fin = computeShippingPaymentFinance(payment);
    const normalized: ShippingLinePayment = {
      ...payment,
      payableAmountJpy: fin.payableJpy,
      amountPaidJpy: fin.paidJpy,
      outstandingAmountJpy: fin.outstandingJpy,
      status: fin.storageStatus,
    };

    const exists = shippingLinePayments.some((p) => p.id === normalized.id);
    const updated = exists
      ? shippingLinePayments.map((p) => (p.id === normalized.id ? normalized : p))
      : [normalized, ...shippingLinePayments];
    setShippingLinePayments(updated);
    saveShippingLinePayments(updated);
    saveShippingLinePaymentToCloud(normalized).catch(console.error);

    // Cascade BL/Shipment ref back to booking if edited
    if (normalized.blNo || normalized.shipmentNo) {
      const pKeys = {
        bookingId: normalized.linkedBookingId,
        bookingNo: normalized.bookingNo,
        shipmentNo: normalized.shipmentNo,
        blNo: normalized.blNo,
      };
      let bkChanged = false;
      const syncedBk = bookings.map((b) => {
        if (
          matchByShipmentKeys(
            { id: b.id, bookingNo: b.bookingNumber, shipmentNo: b.shipmentNo, blNo: b.blNo },
            pKeys
          )
        ) {
          if (
            (normalized.blNo && b.blNo !== normalized.blNo) ||
            (normalized.shipmentNo && b.shipmentNo !== normalized.shipmentNo)
          ) {
            bkChanged = true;
            const patched: BookingConfirmation = {
              ...b,
              blNo: normalized.blNo || b.blNo,
              shipmentNo: normalized.shipmentNo || b.shipmentNo,
              updatedAt: new Date().toISOString(),
            };
            saveBookingToCloud(patched).catch(console.error);
            return patched;
          }
        }
        return b;
      });
      if (bkChanged) {
        setBookings(syncedBk);
        saveBookings(syncedBk);
      }
    }

    // Keep FreightInvoice P&L synced via Booking Number when linked SL payment changes (single entry)
    const pBk = (normalized.bookingNo || '').trim().toUpperCase();
    if (pBk) {
      let invPlChanged = false;
      const now = new Date().toISOString();
      const syncedInvoices = invoices.map((inv) => {
        const iBk = (inv.bookingNo || '').trim().toUpperCase();
        const matchesBk = iBk === pBk || inv.linkedShippingPaymentId === normalized.id;
        const onlyAutoSlImported =
          !inv.actualCostItems ||
          inv.actualCostItems.length === 0 ||
          inv.actualCostItems.every((ci) => ci.id.startsWith('aci-sl-'));
        if (matchesBk && (!inv.actualCostUpdatedAt || (inv.linkedShippingPaymentId === normalized.id && onlyAutoSlImported))) {
          invPlChanged = true;
          const totalSlForBk = updated
            .filter((s) => (s.bookingNo || '').trim().toUpperCase() === pBk)
            .reduce((sum, s) => sum + Math.max(0, Math.round(s.payableAmountJpy || 0)), 0);
          const net = Math.round(inv.grandTotalJpy || 0) - totalSlForBk;
          const margin =
            inv.grandTotalJpy > 0 ? Math.round((net / inv.grandTotalJpy) * 1000) / 10 : 0;
          const patched: FreightInvoice = {
            ...inv,
            linkedShippingPaymentId: normalized.id,
            actualShippingCostJpy: totalSlForBk,
            netProfitLossJpy: net,
            profitMarginPct: margin,
            actualCostUpdatedAt: now,
            updatedAt: now,
          };
          saveInvoiceToCloud(patched).catch(console.error);
          return patched;
        }
        return inv;
      });
      if (invPlChanged) {
        setInvoices(syncedInvoices);
        saveInvoices(syncedInvoices);
      }
    }
  };

  const handleDeleteShippingPayment = (id: string) => {
    const updated = shippingLinePayments.filter((p) => p.id !== id);
    setShippingLinePayments(updated);
    saveShippingLinePayments(updated);
    deleteShippingLinePaymentFromCloud(id).catch(console.error);
  };

  const handleCreateShippingPaymentFromBooking = (booking: BookingConfirmation) => {
    setPrefillBookingForSlPay(booking);
    setPrefillQuotationForSlPay(null);
    setIsSlPayExternalOpen(true);
    setActiveTab('shippingPayments');
  };

  // --- Invoice CRUD Handlers + Cascade Linking ---
  const handleSaveInvoice = (invoice: FreightInvoice) => {
    setCloudSaveError(null);
    const fin = computeCustomerInvoiceFinance(invoice);
    const normalized: FreightInvoice = {
      ...invoice,
      invoiceNo:
        (invoice.invoiceNo || '').trim() ||
        `YTL-FI-${Math.floor(100000 + Math.random() * 900000)}`,
      amountReceivedJpy: fin.receivedJpy,
      outstandingBalanceJpy: fin.outstandingJpy,
      status: fin.invoiceStatus,
    };

    const exists = invoices.some((i) => i.id === normalized.id);
    const updated = exists
      ? invoices.map((i) => (i.id === normalized.id ? normalized : i))
      : [normalized, ...invoices];
    setInvoices(updated);
    saveInvoices(updated);
    saveInvoiceToCloud(normalized)
      .then(() => {
        setDownloadSuccessMessage(`Invoice #${normalized.invoiceNo} saved to Cloud Database!`);
        setTimeout(() => setDownloadSuccessMessage(null), 3000);
      })
      .catch((err) => {
        console.error(err);
        setCloudSaveError(
          `Database save failed for Invoice #${normalized.invoiceNo}. Check network connection and try again.`
        );
      });

    // Mark linked quotation as CONVERTED & sync BL/Shipment numbers across connected modules
    const now = new Date().toISOString();
    const invKeys = {
      bookingId: normalized.linkedBookingId,
      bookingNo: normalized.bookingNo,
      shipmentNo: normalized.shipmentNo,
      blNo: normalized.blNo,
    };

    let qChanged = false;
    const syncedQuotes = quotations.map((q) => {
      const isLinkedQuote =
        q.id === normalized.linkedQuotationId ||
        matchByShipmentKeys(
          {
            bookingId: q.linkedBookingId,
            bookingNo: q.bookingNo,
            shipmentNo: q.shipmentNo,
            blNo: q.blNo,
          },
          invKeys
        );
      if (isLinkedQuote) {
        qChanged = true;
        const alreadyConverted = q.status === 'CONVERTED' && q.linkedInvoiceNo === normalized.invoiceNo;
        const patched: Quotation = {
          ...q,
          status: 'CONVERTED',
          linkedInvoiceId: normalized.id,
          linkedInvoiceNo: normalized.invoiceNo,
          blNo: normalized.blNo || q.blNo,
          shipmentNo: normalized.shipmentNo || q.shipmentNo,
          statusHistory: alreadyConverted
            ? q.statusHistory
            : [
                ...(q.statusHistory || []),
                {
                  id: `qh-${Date.now()}`,
                  status: 'CONVERTED',
                  date: now.slice(0, 10),
                  note: `Converted to Invoice #${normalized.invoiceNo}`,
                },
              ],
          updatedAt: now,
        };
        saveQuotationToCloud(patched).catch(console.error);
        return patched;
      }
      return q;
    });
    if (qChanged) {
      setQuotations(syncedQuotes);
      saveQuotations(syncedQuotes);
    }

    if (normalized.blNo || normalized.shipmentNo) {
      let bkChanged = false;
      const syncedBk = bookings.map((b) => {
        if (
          matchByShipmentKeys(
            { id: b.id, bookingNo: b.bookingNumber, shipmentNo: b.shipmentNo, blNo: b.blNo },
            invKeys
          )
        ) {
          if (
            (normalized.blNo && b.blNo !== normalized.blNo) ||
            (normalized.shipmentNo && b.shipmentNo !== normalized.shipmentNo)
          ) {
            bkChanged = true;
            const patched: BookingConfirmation = {
              ...b,
              blNo: normalized.blNo || b.blNo,
              shipmentNo: normalized.shipmentNo || b.shipmentNo,
              updatedAt: now,
            };
            saveBookingToCloud(patched).catch(console.error);
            return patched;
          }
        }
        return b;
      });
      if (bkChanged) {
        setBookings(syncedBk);
        saveBookings(syncedBk);
      }
    }
  };

  const handleDeleteInvoice = (id: string) => {
    const updated = invoices.filter((i) => i.id !== id);
    setInvoices(updated);
    saveInvoices(updated);
    deleteInvoiceFromCloud(id).catch(console.error);
  };

  const handleDuplicateInvoice = (invoice: FreightInvoice) => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const duplicated: FreightInvoice = {
      ...invoice,
      id: `inv-${Date.now()}`,
      invoiceNo: `YTL-FI-${randomNum}`,
      date: new Date().toISOString().slice(0, 10),
      paymentDueDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
      status: 'PENDING',
      amountReceivedJpy: 0,
      outstandingBalanceJpy: invoice.grandTotalJpy,
      paymentHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [duplicated, ...invoices];
    setInvoices(updated);
    saveInvoices(updated);
    saveInvoiceToCloud(duplicated).catch(console.error);
  };

  const handleToggleInvoiceStatus = (id: string) => {
    let changedInvoice: FreightInvoice | null = null;
    const updated: FreightInvoice[] = invoices.map((inv) => {
      if (inv.id === id) {
        const markPaid = inv.status !== 'PAID';
        const draft: FreightInvoice = {
          ...inv,
          amountReceivedJpy: markPaid ? inv.grandTotalJpy : 0,
          outstandingBalanceJpy: markPaid ? 0 : inv.grandTotalJpy,
          lastPaymentDate: markPaid ? new Date().toISOString().slice(0, 10) : inv.lastPaymentDate,
          status: (markPaid ? 'PAID' : 'PENDING') as InvoiceStatus,
          updatedAt: new Date().toISOString(),
        };
        const fin = computeCustomerInvoiceFinance(draft);
        changedInvoice = { ...draft, status: fin.invoiceStatus, outstandingBalanceJpy: fin.outstandingJpy };
        return changedInvoice;
      }
      return inv;
    });
    setInvoices(updated);
    saveInvoices(updated);
    if (changedInvoice) {
      saveInvoiceToCloud(changedInvoice).catch(console.error);
    }
  };

  const handleViewInvoice = (invoice: FreightInvoice) => {
    setViewingInvoice(invoice);
    setViewingBooking(null);
    setViewingQuotation(null);
    setDocViewType('invoice');
    setIsDocViewOpen(true);
  };

  const handleEditInvoice = (invoice: FreightInvoice) => {
    setEditingInvoice(invoice);
    setInvoiceModalFocusSection('billing');
    setPrefillBookingForInvoice(null);
    setPrefillQuotationForInvoice(null);
    setIsInvoiceModalOpen(true);
  };

  const handleEditInvoiceCosting = (invoice: FreightInvoice) => {
    setEditingInvoice(invoice);
    setInvoiceModalFocusSection('costing');
    setPrefillBookingForInvoice(null);
    setPrefillQuotationForInvoice(null);
    setIsInvoiceModalOpen(true);
  };

  const handleConvertToInvoice = (booking: BookingConfirmation) => {
    setEditingInvoice(null);
    setInvoiceModalFocusSection('billing');
    setPrefillQuotationForInvoice(null);
    setPrefillBookingForInvoice(booking);
    setIsInvoiceModalOpen(true);
  };

  // --- Customer CRUD (Module 1) ---
  const handleSaveCustomer = (customer: Customer) => {
    const exists = customers.some((c) => c.id === customer.id);
    const updated = exists
      ? customers.map((c) => (c.id === customer.id ? customer : c))
      : [customer, ...customers];
    setCustomers(updated);
    saveCustomers(updated);
    saveCustomerToCloud(customer).catch(console.error);
  };

  const handleDeleteCustomer = (id: string) => {
    const updated = customers.filter((c) => c.id !== id);
    setCustomers(updated);
    saveCustomers(updated);
    deleteCustomerFromCloud(id).catch(console.error);
  };

  // --- Stock CRUD (Module 3) ---
  const handleSaveStock = (stock: StockItem) => {
    const exists = stocks.some((s) => s.id === stock.id);
    const updated = exists
      ? stocks.map((s) => (s.id === stock.id ? stock : s))
      : [stock, ...stocks];
    setStocks(updated);
    saveStocks(updated);
    saveStockToCloud(stock).catch(console.error);
  };

  const handleDeleteStock = (id: string) => {
    const updated = stocks.filter((s) => s.id !== id);
    setStocks(updated);
    saveStocks(updated);
    deleteStockFromCloud(id).catch(console.error);
  };

  // --- Trucking Sheets CRUD (Module 3A) ---
  const handleSaveTruckingSheet = (sheet: TruckingSheet) => {
    const exists = truckingSheets.some((s) => s.id === sheet.id);
    const updated = exists
      ? truckingSheets.map((s) => (s.id === sheet.id ? sheet : s))
      : [sheet, ...truckingSheets];
    setTruckingSheets(updated);
    saveTruckingSheets(updated);
    saveTruckingSheetToCloud(sheet).catch(console.error);
  };

  const handleDeleteTruckingSheet = (id: string) => {
    const updated = truckingSheets.filter((s) => s.id !== id);
    setTruckingSheets(updated);
    saveTruckingSheets(updated);
    deleteTruckingSheetFromCloud(id).catch(console.error);
  };

  // --- Trucking Companies CRUD (Module 3B) ---
  const handleSaveTruckingCompany = (company: TruckingCompany) => {
    const exists = truckingCompanies.some((c) => c.id === company.id);
    const updated = exists
      ? truckingCompanies.map((c) => (c.id === company.id ? company : c))
      : [company, ...truckingCompanies];
    setTruckingCompanies(updated);
    saveTruckingCompanies(updated);
    saveTruckingCompanyToCloud(company).catch(console.error);
  };

  const handleDeleteTruckingCompany = (id: string) => {
    const updated = truckingCompanies.filter((c) => c.id !== id);
    setTruckingCompanies(updated);
    saveTruckingCompanies(updated);
    deleteTruckingCompanyFromCloud(id).catch(console.error);
  };

  // --- Masters Save ---
  const handleSaveMasters = (newMasters: MasterData) => {
    setMasters(newMasters);
    saveMasters(newMasters);
    saveMastersToCloud(newMasters).catch(console.error);
  };

  // --- Dedicated KYC Record Handlers ---
  const handleSaveKycRecord = async (record: KycRecord) => {
    const updated = kycRecords.some((r) => r.id === record.id)
      ? kycRecords.map((r) => (r.id === record.id ? record : r))
      : [record, ...kycRecords];
    setKycRecords(updated);
    saveKycRecords(updated);
    await saveKycRecordToCloud(record);
  };

  const handleDeleteKycRecord = async (recordId: string) => {
    const updated = kycRecords.filter((r) => r.id !== recordId);
    setKycRecords(updated);
    saveKycRecords(updated);
    await deleteKycRecordFromCloud(recordId);
  };

  // Company Profile save
  const handleSaveCompany = (updated: CompanyProfile) => {
    setCompany(updated);
    saveCompanyProfile(updated);
    saveCompanyProfileToCloud(updated).catch(console.error);
  };

  // Reset to default sample records
  const handleResetData = () => {
    resetAllToDefault();
    setCompany(getCompanyProfile());
    setBookings(getBookings());
    setInvoices(getInvoices());
    setQuotations(getQuotations());
    setShippingLinePayments(getShippingLinePayments());
    setCustomers(getCustomers());
    setKycRecords(getKycRecords());
    setStocks(getStocks());
    setTruckingSheets(getTruckingSheets());
    setTruckingCompanies(getTruckingCompanies());
    setMasters(getMasters());
    setUsers(getUsers());
  };

  const handleExportAllExcel = () => {
    exportAllRecordsToExcel(bookings, invoices, quotations, shippingLinePayments);
  };

  if (!session.isAuthenticated || !session.currentUser) {
    return (
      <LoginPage
        users={users}
        onLoginSuccess={handleLoginSuccess}
        companyName=""
        language={language}
        onToggleLanguage={handleToggleLanguage}
      />
    );
  }

  const isAdmin = session.currentUser.role === 'ADMIN';
  const plSummary = computeOverallProfitLossSummary(
    quotations,
    invoices,
    shippingLinePayments
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={session.currentUser}
        language={language}
        cloudStatus={cloudStatus}
        urgentCustomerCount={plSummary.urgentCustomerCount}
        urgentShippingLineCount={plSummary.urgentShippingLineCount}
        onToggleLanguage={handleToggleLanguage}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onExportAllExcel={handleExportAllExcel}
        onLogout={handleLogout}
      />

      {/* Download / Save Toast Notification */}
      {downloadSuccessMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 text-xs font-bold animate-bounce">
          <Check className="w-4 h-4 text-white" />
          <span>{downloadSuccessMessage}</span>
        </div>
      )}

      {/* Cloud Database Save Error Alert */}
      {cloudSaveError && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-rose-700 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center justify-between gap-3 text-xs font-semibold border border-rose-500">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
            <span>{cloudSaveError}</span>
          </div>
          <button
            type="button"
            onClick={() => setCloudSaveError(null)}
            className="text-rose-200 hover:text-white font-bold px-1.5"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 sm:pb-8">
        {/* Navigation Tabs for Mobile (Horizontally Scrollable) */}
        <div className="flex lg:hidden items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1.5 mb-4 overflow-x-auto shadow-xs scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'dashboard' ? 'bg-sky-700 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bookings')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'bookings' ? 'bg-sky-700 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Bookings ({bookings.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quotations')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'quotations' ? 'bg-indigo-700 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Quotations ({quotations.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('invoices')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'invoices' ? 'bg-sky-700 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Invoices ({invoices.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('customerPayments')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'customerPayments' ? 'bg-sky-700 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Cust. Pay</span>
            {plSummary.urgentCustomerCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px]">
                {plSummary.urgentCustomerCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('shippingPayments')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'shippingPayments' ? 'bg-sky-700 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>SL Pay</span>
            {plSummary.urgentShippingLineCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px]">
                {plSummary.urgentShippingLineCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('customers')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'customers' ? 'bg-sky-700 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Customers ({customers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('kyc')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'kyc' ? 'bg-indigo-700 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            KYC ({kycRecords.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('masters')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'masters' ? 'bg-sky-700 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Masters
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'admin' ? 'bg-sky-700 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Team
            </button>
          )}
        </div>

        {/* VIEW: OVERVIEW DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Hero Banner (Neutral Operations Title — Company Name kept strictly on official Documents) */}
            <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white rounded-2xl p-4 sm:p-7 shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6">
              <div className="space-y-1 sm:space-y-1.5 max-w-2xl w-full">
                <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold tracking-wider text-sky-400 uppercase">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400" />
                  <span className="truncate">
                    Interconnected Freight Operations &amp; Financial Control
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  Operations, Profit/Loss &amp; Payment Console
                </h1>
                <p className="text-xs sm:text-sm text-slate-300">
                  Manage Bookings, Quotations, Freight Invoices (with integrated Costing &amp; P/L), Customer Receivables, and Shipping Line Deadlines in one linked workflow.
                </p>

                {/* Cloud Firestore Live Status Indicator */}
                <div className="pt-2 flex items-center gap-2 flex-wrap">
                  <div className="inline-flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/50 px-3 py-1 rounded-xl text-emerald-300 text-xs font-semibold shadow-xs">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Cloud Sync: <strong className="text-white">Active</strong></span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setEditingBooking(null);
                    setIsBookingModalOpen(true);
                  }}
                  className="px-3 sm:px-3.5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Booking</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('quotations')}
                  className="px-3 sm:px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>Quotations</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('invoices')}
                  className="px-3 sm:px-3.5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Invoices &amp; P/L</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('customerPayments')}
                  className="px-3 sm:px-3.5 py-2 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Wallet className="w-4 h-4 text-sky-700" />
                  <span>Customer Pay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('shippingPayments')}
                  className="px-3 sm:px-3.5 py-2 text-xs font-bold text-slate-900 bg-amber-300 hover:bg-amber-200 rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Anchor className="w-4 h-4 text-slate-900" />
                  <span>SL Payables</span>
                </button>
              </div>
            </div>

            {/* Urgent Payment Deadlines Strip */}
            {(plSummary.urgentCustomerCount > 0 || plSummary.urgentShippingLineCount > 0) && (
              <div className="bg-rose-50 border-2 border-rose-400 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-rose-900">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <div className="text-xs sm:text-sm font-bold">
                    URGENT PAYMENT DEADLINES:
                    <span className="font-semibold ml-1.5">
                      {plSummary.urgentCustomerCount} customer invoice(s) &amp;{' '}
                      {plSummary.urgentShippingLineCount} shipping line payable(s) are overdue or due within 5 days.
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {plSummary.urgentCustomerCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('customerPayments')}
                      className="px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
                    >
                      View Customer Due
                    </button>
                  )}
                  {plSummary.urgentShippingLineCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('shippingPayments')}
                      className="px-3 py-1.5 text-xs font-bold bg-rose-800 hover:bg-rose-900 text-white rounded-lg"
                    >
                      View SL Due
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Metric KPI cards */}
            <StatsOverview
              bookings={bookings}
              invoices={invoices}
              quotations={quotations}
              shippingPayments={shippingLinePayments}
              onSelectBookingsTab={() => setActiveTab('bookings')}
              onSelectQuotationsTab={() => setActiveTab('quotations')}
              onSelectInvoicesTab={() => setActiveTab('invoices')}
              onSelectCustomerPaymentsTab={() => setActiveTab('customerPayments')}
              onSelectShippingPaymentsTab={() => setActiveTab('shippingPayments')}
            />

            {/* Split Grid: Recent Bookings & Invoices with Direct PDF Download */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Bookings Box */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-sky-700" />
                      <h2 className="text-sm font-bold text-slate-900">{t.recentBookings}</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('bookings')}
                      className="text-xs text-sky-700 hover:text-sky-900 font-semibold flex items-center gap-1"
                    >
                      {t.viewAll} ({bookings.length}) <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 mt-2">
                    {bookings.slice(0, 4).map((b) => (
                      <div
                        key={b.id}
                        className="py-3 flex items-center justify-between hover:bg-slate-50/70 px-2 rounded-lg transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sky-900 text-xs">
                              {b.bookingNumber}
                            </span>
                            <span className="text-[11px] text-slate-500">·</span>
                            <span className="font-semibold text-xs text-slate-900">
                              {b.customerCompany}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {b.shippingCompany} · {b.pol || 'Japan'} →{' '}
                            <span className="font-semibold text-slate-700">{b.pod}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Print KYC Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenKycModal(b)}
                            className="px-2 py-1 text-[11px] font-bold text-emerald-950 bg-emerald-300 hover:bg-emerald-200 rounded flex items-center gap-1 shadow-xs"
                            title="Print KYC Record"
                          >
                            <FileCheck2 className="w-3 h-3 text-emerald-900" />
                            KYC
                          </button>

                          {/* Direct PDF Download */}
                          <button
                            type="button"
                            onClick={() => handleDirectDownloadBooking(b)}
                            disabled={downloadingId === b.id}
                            className="px-2 py-1 text-[11px] font-bold text-white bg-sky-700 hover:bg-sky-800 rounded flex items-center gap-1 shadow-xs transition-colors disabled:opacity-50"
                            title={t.downloadPdf}
                          >
                            {downloadingId === b.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Download className="w-3 h-3" />
                            )}
                            PDF
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 mt-3 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBooking(null);
                      setIsBookingModalOpen(true);
                    }}
                    className="text-xs font-semibold text-sky-700 hover:text-sky-900"
                  >
                    {t.addNewBooking}
                  </button>
                </div>
              </div>

              {/* Recent Invoices Box */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-emerald-700" />
                      <h2 className="text-sm font-bold text-slate-900">{t.recentInvoices}</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('invoices')}
                      className="text-xs text-sky-700 hover:text-sky-900 font-semibold flex items-center gap-1"
                    >
                      {t.viewAll} ({invoices.length}) <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 mt-2">
                    {invoices.slice(0, 4).map((inv) => (
                      <div
                        key={inv.id}
                        className="py-3 flex items-center justify-between hover:bg-slate-50/70 px-2 rounded-lg transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sky-900 text-xs">
                              {inv.invoiceNo}
                            </span>
                            <span className="text-[11px] text-slate-500">·</span>
                            <span className="font-semibold text-xs text-slate-900">
                              {inv.customerName}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {inv.portFrom} → {inv.portTo} · Due: {inv.paymentDueDate}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right mr-1">
                            <div className="font-mono font-bold text-xs text-slate-900 tabular-nums">
                              ¥{inv.grandTotalJpy.toLocaleString()}
                            </div>
                            <span
                              className={`text-[10px] font-semibold ${
                                inv.status === 'PAID' ? 'text-emerald-700' : 'text-amber-700'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDirectDownloadInvoice(inv)}
                            disabled={downloadingId === inv.id}
                            className="px-2 py-1 text-[11px] font-bold text-white bg-sky-700 hover:bg-sky-800 rounded flex items-center gap-1 shadow-xs transition-colors disabled:opacity-50"
                            title={t.downloadPdf}
                          >
                            {downloadingId === inv.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Download className="w-3 h-3" />
                            )}
                            PDF
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 mt-3 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingInvoice(null);
                      setPrefillBookingForInvoice(null);
                      setIsInvoiceModalOpen(true);
                    }}
                    className="text-xs font-semibold text-sky-700 hover:text-sky-900"
                  >
                    {t.addNewInvoice}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: CUSTOMERS */}
        {activeTab === 'customers' && (
          <CustomerManagement
            customers={customers}
            onSaveCustomer={handleSaveCustomer}
            onDeleteCustomer={handleDeleteCustomer}
          />
        )}

        {/* VIEW: DEDICATED KYC MODULE */}
        {activeTab === 'kyc' && (
          <KycManagement
            kycRecords={kycRecords}
            companyProfile={company}
            customers={customers}
            onSaveKycRecord={handleSaveKycRecord}
            onDeleteKycRecord={handleDeleteKycRecord}
          />
        )}

        {/* VIEW: BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Shipping Bookings & Cargo Reservations
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vessel voyages, CY cutoff dates, container sizes, and Bill of Lading operations.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingBooking(null);
                  setIsBookingModalOpen(true);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg flex items-center gap-1.5 shadow-xs shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>New Booking Order</span>
              </button>
            </div>

            <BookingList
              bookings={bookings}
              invoices={invoices}
              language={language}
              onView={handleViewBooking}
              onEdit={handleEditBooking}
              onDelete={handleDeleteBooking}
              onDuplicate={handleDuplicateBooking}
              onConvertToInvoice={handleConvertToInvoice}
              onCreateQuotation={handleCreateQuotationFromBooking}
              onCreateShippingPayment={handleCreateShippingPaymentFromBooking}
              onDownloadPdf={handleDirectDownloadBooking}
              onSendCustomer={handleSendBooking}
              onPrintKyc={handleOpenKycModal}
              onCreateNew={() => {
                setEditingBooking(null);
                setIsBookingModalOpen(true);
              }}
            />
          </div>
        )}

        {/* VIEW: FREIGHT QUOTATIONS */}
        {activeTab === 'quotations' && (
          <QuotationManagement
            quotations={quotations}
            bookings={bookings}
            customers={customers}
            onSaveQuotation={handleSaveQuotation}
            onDeleteQuotation={handleDeleteQuotation}
            onViewQuotation={handleViewQuotation}
            onDownloadQuotationPdf={handleDirectDownloadQuotation}
            onConvertQuotationToInvoice={handleConvertQuotationToInvoice}
            prefillBooking={prefillBookingForQuote}
            isModalRequestedExternally={isQuoteExternalOpen}
            externalEditingQuotation={editingQuotationForTab}
            onClearExternalModal={() => {
              setIsQuoteExternalOpen(false);
              setPrefillBookingForQuote(null);
              setEditingQuotationForTab(null);
            }}
          />
        )}

        {/* VIEW: INVOICES TAB (With Integrated Selling, Actual Shipping Line Cost & P/L) */}
        {activeTab === 'invoices' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{t.invoiceTitle}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{t.invoiceDesc}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingInvoice(null);
                  setInvoiceModalFocusSection('billing');
                  setPrefillBookingForInvoice(null);
                  setPrefillQuotationForInvoice(null);
                  setIsInvoiceModalOpen(true);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                {t.addNewInvoice}
              </button>
            </div>

            <InvoiceList
              invoices={invoices}
              bookings={bookings}
              shippingPayments={shippingLinePayments}
              language={language}
              onView={handleViewInvoice}
              onEdit={handleEditInvoice}
              onEditCosting={handleEditInvoiceCosting}
              onDelete={handleDeleteInvoice}
              onDuplicate={handleDuplicateInvoice}
              onToggleStatus={handleToggleInvoiceStatus}
              onDownloadPdf={handleDirectDownloadInvoice}
              onSendCustomer={handleSendInvoice}
              onCreateNew={() => {
                setEditingInvoice(null);
                setInvoiceModalFocusSection('billing');
                setPrefillBookingForInvoice(null);
                setPrefillQuotationForInvoice(null);
                setIsInvoiceModalOpen(true);
              }}
            />
          </div>
        )}

        {/* VIEW: CUSTOMER PAYMENTS & DEADLINES */}
        {activeTab === 'customerPayments' && (
          <CustomerPaymentManagement
            invoices={invoices}
            onSaveInvoice={handleSaveInvoice}
            onViewInvoiceDocument={handleViewInvoice}
          />
        )}

        {/* VIEW: SHIPPING LINE PAYMENT MANAGEMENT */}
        {activeTab === 'shippingPayments' && (
          <ShippingLinePaymentManagement
            payments={shippingLinePayments}
            bookings={bookings}
            quotations={quotations}
            shippingLines={masters.shippingCompanies}
            onSavePayment={handleSaveShippingPayment}
            onDeletePayment={handleDeleteShippingPayment}
            prefillFromBooking={prefillBookingForSlPay}
            prefillFromQuotation={prefillQuotationForSlPay}
            isModalRequestedExternally={isSlPayExternalOpen}
            onClearExternalModal={() => {
              setIsSlPayExternalOpen(false);
              setPrefillBookingForSlPay(null);
              setPrefillQuotationForSlPay(null);
            }}
          />
        )}

        {/* VIEW: MASTER DATA */}
        {activeTab === 'masters' && (
          <MasterDataManager
            masters={masters}
            onSaveMasters={handleSaveMasters}
          />
        )}

        {/* VIEW: ADMIN TEAM & USER ACCESS CONTROL TAB */}
        {activeTab === 'admin' && isAdmin && (
          <AdminTeamManagement
            users={users}
            currentUser={session.currentUser}
            language={language}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <span className="font-semibold text-slate-700">Freight Operations &amp; Accounting Suite</span>
            <span>·</span>
            <span className="text-slate-500">Linked Booking, Quotation, P&amp;L &amp; Settlement Workspace</span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center">
            <button
              type="button"
              onClick={handleExportAllExcel}
              className="hover:text-slate-900 transition-colors flex items-center gap-1 font-semibold text-emerald-800"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Download All Records (.xlsx)
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="hover:text-slate-900 transition-colors"
              >
                Settings & Branding
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="text-rose-600 hover:text-rose-800 transition-colors font-medium"
            >
              Logout ({session.currentUser.userId})
            </button>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. Booking Form Modal */}
      <BookingFormModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setEditingBooking(null);
        }}
        onSave={handleSaveBooking}
        initialData={editingBooking}
        customers={customers}
        shippers={shippers}
        consignees={consignees}
        notifyParties={notifyParties}
        masters={masters}
      />

      {/* 2. Invoice Form Modal */}
      <InvoiceFormModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setEditingInvoice(null);
          setInvoiceModalFocusSection('billing');
          setPrefillBookingForInvoice(null);
          setPrefillQuotationForInvoice(null);
        }}
        onSave={handleSaveInvoice}
        initialData={editingInvoice}
        availableBookings={bookings}
        availableQuotations={quotations}
        availableShippingPayments={shippingLinePayments}
        customers={customers}
        prefillFromBooking={prefillBookingForInvoice}
        prefillFromQuotation={prefillQuotationForInvoice}
        initialFocusSection={invoiceModalFocusSection}
      />

      {/* 3. Document View & PDF Generator Modal */}
      <DocumentViewModal
        isOpen={isDocViewOpen}
        onClose={() => {
          setIsDocViewOpen(false);
          setViewingBooking(null);
          setViewingInvoice(null);
          setViewingQuotation(null);
        }}
        documentType={docViewType}
        booking={viewingBooking}
        invoice={viewingInvoice}
        quotation={viewingQuotation}
        company={company}
        onEdit={() => {
          if (docViewType === 'booking' && viewingBooking) {
            handleEditBooking(viewingBooking);
          } else if (docViewType === 'invoice' && viewingInvoice) {
            handleEditInvoice(viewingInvoice);
          } else if (docViewType === 'quotation' && viewingQuotation) {
            setEditingQuotationForTab(viewingQuotation);
            setIsQuoteExternalOpen(true);
            setActiveTab('quotations');
          }
        }}
        onConvertToInvoice={(b) => handleConvertToInvoice(b)}
        onConvertQuotationToInvoice={(q) => handleConvertQuotationToInvoice(q)}
        onOpenSendModal={() => {
          if (docViewType === 'booking' && viewingBooking) {
            handleSendBooking(viewingBooking);
          } else if (docViewType === 'invoice' && viewingInvoice) {
            handleSendInvoice(viewingInvoice);
          } else if (docViewType === 'quotation' && viewingQuotation) {
            handleSendQuotation(viewingQuotation);
          }
        }}
      />

      {/* 4. Company Profile & Settings Modal */}
      <CompanyProfileModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={company}
        onSave={handleSaveCompany}
        onResetData={handleResetData}
      />

      {/* 5. KYC Print Modal */}
      <KycPrintModal
        isOpen={isKycModalOpen}
        onClose={() => {
          setIsKycModalOpen(false);
          setKycBooking(null);
        }}
        booking={kycBooking}
        company={company}
      />

      {/* 6. Send to Customer Modal */}
      <SendCustomerModal
        isOpen={isSendModalOpen}
        onClose={() => {
          setIsSendModalOpen(false);
          setSendBooking(null);
          setSendInvoice(null);
          setSendQuotation(null);
        }}
        documentType={sendDocType}
        booking={sendBooking}
        invoice={sendInvoice}
        quotation={sendQuotation}
        company={company}
        onDownloadPdf={() => {
          if (sendDocType === 'booking' && sendBooking) {
            handleDirectDownloadBooking(sendBooking);
          } else if (sendDocType === 'invoice' && sendInvoice) {
            handleDirectDownloadInvoice(sendInvoice);
          } else if (sendDocType === 'quotation' && sendQuotation) {
            handleDirectDownloadQuotation(sendQuotation);
          }
        }}
      />

      {/* Hidden offscreen containers for direct table-row PDF downloads */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: '-9999px',
          width: '794px',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -999,
        }}
        aria-hidden="true"
      >
        {activeBookingForPdf && (
          <BookingDocumentView
            booking={activeBookingForPdf}
            company={company}
            id="direct-pdf-booking"
          />
        )}
        {activeInvoiceForPdf && (
          <InvoiceDocumentView
            invoice={activeInvoiceForPdf}
            company={company}
            id="direct-pdf-invoice"
          />
        )}
        {activeQuotationForPdf && (
          <QuotationDocumentView
            quotation={activeQuotationForPdf}
            company={company}
            id="direct-pdf-quotation"
          />
        )}
      </div>
    </div>
  );
}
