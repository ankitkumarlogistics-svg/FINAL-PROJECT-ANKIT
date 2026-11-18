import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  BookingConfirmation,
  FreightInvoice,
  CompanyProfile,
  AppUser,
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
  ShipmentCosting,
  ShippingLinePayment,
} from '../types';
import {
  DEFAULT_COMPANY_PROFILE,
  INITIAL_BOOKINGS,
  INITIAL_INVOICES,
  INITIAL_USERS,
  INITIAL_CUSTOMERS,
  INITIAL_SHIPPERS,
  INITIAL_CONSIGNEES,
  INITIAL_NOTIFY_PARTIES,
  INITIAL_STOCKS,
  INITIAL_TRUCKING_SHEETS,
  INITIAL_TRUCKING_COMPANIES,
  INITIAL_MASTERS,
  INITIAL_KYC_RECORDS,
  INITIAL_QUOTATIONS,
  INITIAL_COSTINGS,
  INITIAL_SHIPPING_LINE_PAYMENTS,
  getCompanyProfile,
  getBookings,
  getInvoices,
  getUsers,
  getCustomers,
  getShippers,
  getConsignees,
  getNotifyParties,
  getStocks,
  getTruckingSheets,
  getTruckingCompanies,
  getMasters,
  getKycRecords,
  getQuotations,
  getCostings,
  getShippingLinePayments,
  saveCompanyProfile,
  saveBookings,
  saveInvoices,
  saveUsers,
  saveCustomers,
  saveShippers,
  saveConsignees,
  saveNotifyParties,
  saveStocks,
  saveTruckingSheets,
  saveTruckingCompanies,
  saveMasters,
  saveKycRecords,
  saveQuotations,
  saveCostings,
  saveShippingLinePayments,
} from '../utils/storage';

// Active Firebase configuration (supports env vars or firebase-applet-config.json)
const activeConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig?.projectId || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig?.appId || '',
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig?.apiKey || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig?.authDomain || '',
  firestoreDatabaseId:
    import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
    firebaseConfig?.firestoreDatabaseId ||
    '(default)',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig?.storageBucket || '',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig?.messagingSenderId || '',
};

// Initialize Firebase App
const app = initializeApp(activeConfig);

// CRITICAL: Must pass activeConfig.firestoreDatabaseId to getFirestore
export const db = getFirestore(app, activeConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Error Handling Definition adhering to skill specifications
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ==========================================
// CLOUD CONNECTION STATUS & HEALTH MONITOR
// ==========================================

export interface CloudSyncStatus {
  isConnected: boolean;
  isOnline: boolean;
  databaseId: string;
  projectId: string;
  lastSyncTime: Date | null;
  statusText: string;
  syncCount: number;
}

let syncCounter = 0;
let currentCloudStatus: CloudSyncStatus = {
  isConnected: true,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  databaseId: activeConfig.firestoreDatabaseId,
  projectId: activeConfig.projectId,
  lastSyncTime: new Date(),
  statusText: 'Cloud Firestore: Active & Synced',
  syncCount: 0,
};

const statusListeners = new Set<(status: CloudSyncStatus) => void>();

export function notifyCloudStatus(partial: Partial<CloudSyncStatus>) {
  syncCounter += 1;
  currentCloudStatus = {
    ...currentCloudStatus,
    ...partial,
    syncCount: syncCounter,
  };
  statusListeners.forEach((cb) => {
    try {
      cb(currentCloudStatus);
    } catch (e) {
      console.error('Error in cloud status listener:', e);
    }
  });
}

export function subscribeToCloudStatus(cb: (status: CloudSyncStatus) => void): () => void {
  cb(currentCloudStatus);
  statusListeners.add(cb);
  return () => {
    statusListeners.delete(cb);
  };
}

export function getCloudStatus(): CloudSyncStatus {
  return currentCloudStatus;
}

// Connection test on boot
export async function testConnection(): Promise<boolean> {
  try {
    // Ping Firestore server directly
    await getDocFromServer(doc(db, 'settings', 'company_profile'));
    notifyCloudStatus({
      isConnected: true,
      isOnline: true,
      lastSyncTime: new Date(),
      statusText: 'Cloud Firestore: Active & Synced',
    });
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network restricted.');
      notifyCloudStatus({
        isConnected: false,
        isOnline: false,
        statusText: 'Offline (Local Cache Active)',
      });
      return false;
    }
    // Connected to server even if doc doesn't exist yet
    notifyCloudStatus({
      isConnected: true,
      isOnline: true,
      lastSyncTime: new Date(),
      statusText: 'Cloud Firestore: Active & Synced',
    });
    return true;
  }
}

// Attach browser online/offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    testConnection();
  });
  window.addEventListener('offline', () => {
    notifyCloudStatus({
      isConnected: false,
      isOnline: false,
      statusText: 'Offline (Check Network)',
    });
  });
}

// Initial connection test
testConnection();

// ==========================================
// REAL-TIME FIRESTORE DATA SYNC HELPERS
// ==========================================

const BOOKINGS_COLLECTION = 'bookings';
const INVOICES_COLLECTION = 'invoices';
const USERS_COLLECTION = 'users';
const SETTINGS_COLLECTION = 'settings';
const COMPANY_DOC_ID = 'company_profile';

const CUSTOMERS_COLLECTION = 'customers';
const SHIPPERS_COLLECTION = 'shippers';
const CONSIGNEES_COLLECTION = 'consignees';
const NOTIFY_COLLECTION = 'notifyParties';
const STOCKS_COLLECTION = 'stocks';
const TRUCKING_SHEETS_COLLECTION = 'truckingSheets';
const TRUCKING_COMPANIES_COLLECTION = 'truckingCompanies';
const MASTERS_COLLECTION = 'masters';
const MASTER_DOC_ID = 'logistics_masters';
const KYC_COLLECTION = 'kyc';
const QUOTATIONS_COLLECTION = 'quotations';
const COSTINGS_COLLECTION = 'shipmentCostings';
const SHIPPING_LINE_PAYMENTS_COLLECTION = 'shippingLinePayments';

let hasSeeded = false;

/**
 * Recursively strips `undefined` properties (and invalid NaN/Infinity numbers)
 * so Cloud Firestore `setDoc` never fails with "Unsupported field value: undefined".
 */
function sanitizeForFirestore<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === 'number') {
    return (Number.isFinite(value) ? value : 0) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof value === 'object') {
    if (value instanceof Date) {
      return value;
    }
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        clean[k] = sanitizeForFirestore(v);
      }
    }
    return clean as T;
  }
  return value;
}

/**
 * Seed initial data to cloud Firestore if empty
 */
export async function initializeAndSeedCloudData(): Promise<void> {
  try {
    // 1. Check bookings
    const bookingsSnap = await getDocs(collection(db, BOOKINGS_COLLECTION));
    if (bookingsSnap.empty) {
      const localBookings = getBookings();
      const seedBookings = localBookings.length > 0 ? localBookings : INITIAL_BOOKINGS;
      for (const b of seedBookings) {
        await setDoc(doc(db, BOOKINGS_COLLECTION, b.id), sanitizeForFirestore(b), { merge: true });
      }
    }

    // 2. Check invoices
    const invoicesSnap = await getDocs(collection(db, INVOICES_COLLECTION));
    if (invoicesSnap.empty) {
      const localInvoices = getInvoices();
      const seedInvoices = localInvoices.length > 0 ? localInvoices : INITIAL_INVOICES;
      for (const inv of seedInvoices) {
        await setDoc(doc(db, INVOICES_COLLECTION, inv.id), sanitizeForFirestore(inv), { merge: true });
      }
    }

    // 3. Check company profile
    const settingsSnap = await getDocs(collection(db, SETTINGS_COLLECTION));
    if (settingsSnap.empty) {
      const localProfile = getCompanyProfile();
      const profileToSave = localProfile || DEFAULT_COMPANY_PROFILE;
      await setDoc(doc(db, SETTINGS_COLLECTION, COMPANY_DOC_ID), sanitizeForFirestore(profileToSave), { merge: true });
    }

    // 4. Check users
    const usersSnap = await getDocs(collection(db, USERS_COLLECTION));
    if (usersSnap.empty) {
      const localUsers = getUsers();
      const seedUsers = localUsers.length > 0 ? localUsers : INITIAL_USERS;
      for (const u of seedUsers) {
        await setDoc(doc(db, USERS_COLLECTION, u.id), sanitizeForFirestore(u), { merge: true });
      }
    }

    // 5. Customers
    const custSnap = await getDocs(collection(db, CUSTOMERS_COLLECTION));
    if (custSnap.empty) {
      const localCust = getCustomers();
      const seedCust = localCust.length > 0 ? localCust : INITIAL_CUSTOMERS;
      for (const c of seedCust) {
        await setDoc(doc(db, CUSTOMERS_COLLECTION, c.id), sanitizeForFirestore(c), { merge: true });
      }
    }

    // 6. Shippers
    const shipSnap = await getDocs(collection(db, SHIPPERS_COLLECTION));
    if (shipSnap.empty) {
      const localShip = getShippers();
      const seedShip = localShip.length > 0 ? localShip : INITIAL_SHIPPERS;
      for (const s of seedShip) {
        await setDoc(doc(db, SHIPPERS_COLLECTION, s.id), sanitizeForFirestore(s), { merge: true });
      }
    }

    // 7. Consignees
    const conSnap = await getDocs(collection(db, CONSIGNEES_COLLECTION));
    if (conSnap.empty) {
      const localCon = getConsignees();
      const seedCon = localCon.length > 0 ? localCon : INITIAL_CONSIGNEES;
      for (const c of seedCon) {
        await setDoc(doc(db, CONSIGNEES_COLLECTION, c.id), sanitizeForFirestore(c), { merge: true });
      }
    }

    // 8. Notify Parties
    const notSnap = await getDocs(collection(db, NOTIFY_COLLECTION));
    if (notSnap.empty) {
      const localNot = getNotifyParties();
      const seedNot = localNot.length > 0 ? localNot : INITIAL_NOTIFY_PARTIES;
      for (const n of seedNot) {
        await setDoc(doc(db, NOTIFY_COLLECTION, n.id), sanitizeForFirestore(n), { merge: true });
      }
    }

    // 9. Stocks
    const stkSnap = await getDocs(collection(db, STOCKS_COLLECTION));
    if (stkSnap.empty) {
      const localStk = getStocks();
      const seedStk = localStk.length > 0 ? localStk : INITIAL_STOCKS;
      for (const s of seedStk) {
        await setDoc(doc(db, STOCKS_COLLECTION, s.id), sanitizeForFirestore(s), { merge: true });
      }
    }

    // 10. Trucking Sheets
    const tsSnap = await getDocs(collection(db, TRUCKING_SHEETS_COLLECTION));
    if (tsSnap.empty) {
      const localTs = getTruckingSheets();
      const seedTs = localTs.length > 0 ? localTs : INITIAL_TRUCKING_SHEETS;
      for (const t of seedTs) {
        await setDoc(doc(db, TRUCKING_SHEETS_COLLECTION, t.id), sanitizeForFirestore(t), { merge: true });
      }
    }

    // 11. Trucking Companies
    const tcSnap = await getDocs(collection(db, TRUCKING_COMPANIES_COLLECTION));
    if (tcSnap.empty) {
      const localTc = getTruckingCompanies();
      const seedTc = localTc.length > 0 ? localTc : INITIAL_TRUCKING_COMPANIES;
      for (const tc of seedTc) {
        await setDoc(doc(db, TRUCKING_COMPANIES_COLLECTION, tc.id), sanitizeForFirestore(tc), { merge: true });
      }
    }

    // 12. Masters
    const masterSnap = await getDocs(collection(db, MASTERS_COLLECTION));
    if (masterSnap.empty) {
      const localM = getMasters();
      const seedM = localM || INITIAL_MASTERS;
      await setDoc(doc(db, MASTERS_COLLECTION, MASTER_DOC_ID), sanitizeForFirestore(seedM), { merge: true });
    }

    // 13. KYC Records (Dedicated Compliance & Logistics Party Verification)
    const kycSnap = await getDocs(collection(db, KYC_COLLECTION));
    if (kycSnap.empty) {
      const localKyc = getKycRecords();
      const seedKyc = localKyc.length > 0 ? localKyc : INITIAL_KYC_RECORDS;
      for (const k of seedKyc) {
        await setDoc(doc(db, KYC_COLLECTION, k.id), sanitizeForFirestore(k), { merge: true });
      }
    }

    // 14. Quotations
    const quoSnap = await getDocs(collection(db, QUOTATIONS_COLLECTION));
    if (quoSnap.empty) {
      const localQuo = getQuotations();
      const seedQuo = localQuo.length > 0 ? localQuo : INITIAL_QUOTATIONS;
      for (const q of seedQuo) {
        await setDoc(doc(db, QUOTATIONS_COLLECTION, q.id), sanitizeForFirestore(q), { merge: true });
      }
    }

    // 15. Confirmed Shipment Costings
    const cstSnap = await getDocs(collection(db, COSTINGS_COLLECTION));
    if (cstSnap.empty) {
      const localCst = getCostings();
      const seedCst = localCst.length > 0 ? localCst : INITIAL_COSTINGS;
      for (const c of seedCst) {
        await setDoc(doc(db, COSTINGS_COLLECTION, c.id), sanitizeForFirestore(c), { merge: true });
      }
    }

    // 16. Shipping Line Payments
    const slpSnap = await getDocs(collection(db, SHIPPING_LINE_PAYMENTS_COLLECTION));
    if (slpSnap.empty) {
      const localSlp = getShippingLinePayments();
      const seedSlp = localSlp.length > 0 ? localSlp : INITIAL_SHIPPING_LINE_PAYMENTS;
      for (const p of seedSlp) {
        await setDoc(doc(db, SHIPPING_LINE_PAYMENTS_COLLECTION, p.id), sanitizeForFirestore(p), { merge: true });
      }
    }

    hasSeeded = true;
    notifyCloudStatus({
      isConnected: true,
      lastSyncTime: new Date(),
      statusText: 'Cloud Firestore: Active & Synced',
    });
  } catch (error) {
    console.error('Failed to initialize and seed Firestore:', error);
  }
}

// ---------------- Bookings ----------------
export function subscribeToCloudBookings(
  onData: (bookings: BookingConfirmation[]) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, BOOKINGS_COLLECTION),
    (snapshot) => {
      notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
      if (!snapshot.empty) {
        const cloudBookings: BookingConfirmation[] = snapshot.docs.map(
          (docSnap) => docSnap.data() as BookingConfirmation
        );
        cloudBookings.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        saveBookings(cloudBookings);
        onData(cloudBookings);
      } else if (hasSeeded) {
        saveBookings([]);
        onData([]);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, BOOKINGS_COLLECTION);
    }
  );
}

export async function saveBookingToCloud(booking: BookingConfirmation): Promise<void> {
  const path = `${BOOKINGS_COLLECTION}/${booking.id}`;
  try {
    await setDoc(doc(db, BOOKINGS_COLLECTION, booking.id), sanitizeForFirestore(booking), { merge: true });
    notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteBookingFromCloud(bookingId: string): Promise<void> {
  const path = `${BOOKINGS_COLLECTION}/${bookingId}`;
  try {
    await deleteDoc(doc(db, BOOKINGS_COLLECTION, bookingId));
    notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- Invoices ----------------
export function subscribeToCloudInvoices(
  onData: (invoices: FreightInvoice[]) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, INVOICES_COLLECTION),
    (snapshot) => {
      notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
      if (!snapshot.empty) {
        const cloudInvoices: FreightInvoice[] = snapshot.docs.map(
          (docSnap) => docSnap.data() as FreightInvoice
        );
        cloudInvoices.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        saveInvoices(cloudInvoices);
        onData(cloudInvoices);
      } else if (hasSeeded) {
        saveInvoices([]);
        onData([]);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, INVOICES_COLLECTION);
    }
  );
}

export async function saveInvoiceToCloud(invoice: FreightInvoice): Promise<void> {
  const path = `${INVOICES_COLLECTION}/${invoice.id}`;
  try {
    await setDoc(doc(db, INVOICES_COLLECTION, invoice.id), sanitizeForFirestore(invoice), { merge: true });
    notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteInvoiceFromCloud(invoiceId: string): Promise<void> {
  const path = `${INVOICES_COLLECTION}/${invoiceId}`;
  try {
    await deleteDoc(doc(db, INVOICES_COLLECTION, invoiceId));
    notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- Customers ----------------
export function subscribeToCloudCustomers(onData: (customers: Customer[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, CUSTOMERS_COLLECTION),
    (snapshot) => {
      notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
      if (!snapshot.empty) {
        const cloudCustomers: Customer[] = snapshot.docs.map(
          (docSnap) => docSnap.data() as Customer
        );
        cloudCustomers.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        saveCustomers(cloudCustomers);
        onData(cloudCustomers);
      } else if (hasSeeded) {
        saveCustomers([]);
        onData([]);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, CUSTOMERS_COLLECTION);
    }
  );
}

export async function saveCustomerToCloud(customer: Customer): Promise<void> {
  const path = `${CUSTOMERS_COLLECTION}/${customer.id}`;
  try {
    await setDoc(doc(db, CUSTOMERS_COLLECTION, customer.id), sanitizeForFirestore(customer), { merge: true });
    notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCustomerFromCloud(customerId: string): Promise<void> {
  const path = `${CUSTOMERS_COLLECTION}/${customerId}`;
  try {
    await deleteDoc(doc(db, CUSTOMERS_COLLECTION, customerId));
    notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- Shippers, Consignees, Notify ----------------
export function subscribeToCloudShippers(onData: (shippers: Shipper[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, SHIPPERS_COLLECTION),
    (snapshot) => {
      notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
      if (!snapshot.empty) {
        const list: Shipper[] = snapshot.docs.map((d) => d.data() as Shipper);
        saveShippers(list);
        onData(list);
      } else if (hasSeeded) {
        saveShippers([]);
        onData([]);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, SHIPPERS_COLLECTION);
    }
  );
}

export async function saveShipperToCloud(shipper: Shipper): Promise<void> {
  try {
    await setDoc(doc(db, SHIPPERS_COLLECTION, shipper.id), sanitizeForFirestore(shipper), { merge: true });
    notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${SHIPPERS_COLLECTION}/${shipper.id}`);
  }
}

export async function deleteShipperFromCloud(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, SHIPPERS_COLLECTION, id));
    notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${SHIPPERS_COLLECTION}/${id}`);
  }
}

export function subscribeToCloudConsignees(onData: (consignees: Consignee[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, CONSIGNEES_COLLECTION),
    (snapshot) => {
      notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
      if (!snapshot.empty) {
        const list: Consignee[] = snapshot.docs.map((d) => d.data() as Consignee);
        saveConsignees(list);
        onData(list);
      } else if (hasSeeded) {
        saveConsignees([]);
        onData([]);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, CONSIGNEES_COLLECTION);
    }
  );
}

export async function saveConsigneeToCloud(consignee: Consignee): Promise<void> {
  try {
    await setDoc(doc(db, CONSIGNEES_COLLECTION, consignee.id), sanitizeForFirestore(consignee), { merge: true });
    notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${CONSIGNEES_COLLECTION}/${consignee.id}`);
  }
}

export async function deleteConsigneeFromCloud(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, CONSIGNEES_COLLECTION, id));
    notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${CONSIGNEES_COLLECTION}/${id}`);
  }
}

export function subscribeToCloudNotifyParties(onData: (parties: NotifyParty[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, NOTIFY_COLLECTION),
    (snapshot) => {
      notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
      if (!snapshot.empty) {
        const list: NotifyParty[] = snapshot.docs.map((d) => d.data() as NotifyParty);
        saveNotifyParties(list);
        onData(list);
      } else if (hasSeeded) {
        saveNotifyParties([]);
        onData([]);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, NOTIFY_COLLECTION);
    }
  );
}

export async function saveNotifyPartyToCloud(party: NotifyParty): Promise<void> {
  try {
    await setDoc(doc(db, NOTIFY_COLLECTION, party.id), sanitizeForFirestore(party), { merge: true });
    notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${NOTIFY_COLLECTION}/${party.id}`);
  }
}

export async function deleteNotifyPartyFromCloud(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, NOTIFY_COLLECTION, id));
    notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${NOTIFY_COLLECTION}/${id}`);
  }
}

// ---------------- Stocks ----------------
export function subscribeToCloudStocks(onData: (stocks: StockItem[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, STOCKS_COLLECTION),
    (snapshot) => {
      notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
      if (!snapshot.empty) {
        const list: StockItem[] = snapshot.docs.map((d) => d.data() as StockItem);
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        saveStocks(list);
        onData(list);
      } else if (hasSeeded) {
        saveStocks([]);
        onData([]);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, STOCKS_COLLECTION);
    }
  );
}

export async function saveStockToCloud(stock: StockItem): Promise<void> {
  const path = `${STOCKS_COLLECTION}/${stock.id}`;
  try {
    await setDoc(doc(db, STOCKS_COLLECTION, stock.id), sanitizeForFirestore(stock), { merge: true });
    notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteStockFromCloud(id: string): Promise<void> {
  const path = `${STOCKS_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, STOCKS_COLLECTION, id));
    notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- Trucking Sheets ----------------
export function subscribeToCloudTruckingSheets(
  onData: (sheets: TruckingSheet[]) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, TRUCKING_SHEETS_COLLECTION),
    (snapshot) => {
      notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
      if (!snapshot.empty) {
        const list: TruckingSheet[] = snapshot.docs.map((d) => d.data() as TruckingSheet);
        list.sort((a, b) => (b.pickupDate || '').localeCompare(a.pickupDate || ''));
        saveTruckingSheets(list);
        onData(list);
      } else if (hasSeeded) {
        saveTruckingSheets([]);
        onData([]);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, TRUCKING_SHEETS_COLLECTION);
    }
  );
}

export async function saveTruckingSheetToCloud(sheet: TruckingSheet): Promise<void> {
  const path = `${TRUCKING_SHEETS_COLLECTION}/${sheet.id}`;
  try {
    await setDoc(doc(db, TRUCKING_SHEETS_COLLECTION, sheet.id), sanitizeForFirestore(sheet), { merge: true });
    notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteTruckingSheetFromCloud(id: string): Promise<void> {
  const path = `${TRUCKING_SHEETS_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, TRUCKING_SHEETS_COLLECTION, id));
    notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- Trucking Companies ----------------
export function subscribeToCloudTruckingCompanies(
  onData: (companies: TruckingCompany[]) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, TRUCKING_COMPANIES_COLLECTION),
    (snapshot) => {
      notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
      if (!snapshot.empty) {
        const list: TruckingCompany[] = snapshot.docs.map((d) => d.data() as TruckingCompany);
        list.sort((a, b) => (a.companyNameEn || '').localeCompare(b.companyNameEn || ''));
        saveTruckingCompanies(list);
        onData(list);
      } else if (hasSeeded) {
        saveTruckingCompanies([]);
        onData([]);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, TRUCKING_COMPANIES_COLLECTION);
    }
  );
}

export async function saveTruckingCompanyToCloud(company: TruckingCompany): Promise<void> {
  const path = `${TRUCKING_COMPANIES_COLLECTION}/${company.id}`;
  try {
    await setDoc(doc(db, TRUCKING_COMPANIES_COLLECTION, company.id), sanitizeForFirestore(company), { merge: true });
    notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteTruckingCompanyFromCloud(id: string): Promise<void> {
  const path = `${TRUCKING_COMPANIES_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, TRUCKING_COMPANIES_COLLECTION, id));
    notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- Masters ----------------
export function subscribeToCloudMasters(onData: (masters: MasterData) => void): Unsubscribe {
  const path = `${MASTERS_COLLECTION}/${MASTER_DOC_ID}`;
  return onSnapshot(
    doc(db, MASTERS_COLLECTION, MASTER_DOC_ID),
    (docSnap) => {
      notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
      if (docSnap.exists()) {
        const data = docSnap.data() as MasterData;
        saveMasters(data);
        onData(data);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveMastersToCloud(masters: MasterData): Promise<void> {
  const path = `${MASTERS_COLLECTION}/${MASTER_DOC_ID}`;
  try {
    await setDoc(doc(db, MASTERS_COLLECTION, MASTER_DOC_ID), sanitizeForFirestore(masters), { merge: true });
    saveMasters(masters);
    notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ---------------- Company Profile ----------------
export function subscribeToCloudCompanyProfile(
  onData: (profile: CompanyProfile) => void
): Unsubscribe {
  const path = `${SETTINGS_COLLECTION}/${COMPANY_DOC_ID}`;
  return onSnapshot(
    doc(db, SETTINGS_COLLECTION, COMPANY_DOC_ID),
    (docSnap) => {
      notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
      if (docSnap.exists()) {
        const cloudProfile = docSnap.data() as CompanyProfile;
        saveCompanyProfile(cloudProfile);
        onData(cloudProfile);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveCompanyProfileToCloud(profile: CompanyProfile): Promise<void> {
  const path = `${SETTINGS_COLLECTION}/${COMPANY_DOC_ID}`;
  try {
    await setDoc(doc(db, SETTINGS_COLLECTION, COMPANY_DOC_ID), sanitizeForFirestore(profile), { merge: true });
    notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ---------------- Users ----------------
export function subscribeToCloudUsers(onData: (users: AppUser[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, USERS_COLLECTION),
    (snapshot) => {
      notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
      if (!snapshot.empty) {
        const cloudUsers: AppUser[] = snapshot.docs.map(
          (docSnap) => docSnap.data() as AppUser
        );
        saveUsers(cloudUsers);
        onData(cloudUsers);
      } else if (hasSeeded) {
        saveUsers([]);
        onData([]);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, USERS_COLLECTION);
    }
  );
}

export async function saveUserToCloud(user: AppUser): Promise<void> {
  const path = `${USERS_COLLECTION}/${user.id}`;
  try {
    await setDoc(doc(db, USERS_COLLECTION, user.id), sanitizeForFirestore(user), { merge: true });
    notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserFromCloud(userId: string): Promise<void> {
  const path = `${USERS_COLLECTION}/${userId}`;
  try {
    await deleteDoc(doc(db, USERS_COLLECTION, userId));
    notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- Dedicated KYC Records ----------------
export function subscribeToCloudKycRecords(onData: (records: KycRecord[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, KYC_COLLECTION),
    (snapshot) => {
      notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
      if (!snapshot.empty) {
        const cloudKyc: KycRecord[] = snapshot.docs.map(
          (docSnap) => docSnap.data() as KycRecord
        );
        cloudKyc.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        saveKycRecords(cloudKyc);
        onData(cloudKyc);
      } else if (hasSeeded) {
        saveKycRecords([]);
        onData([]);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, KYC_COLLECTION);
    }
  );
}

export async function saveKycRecordToCloud(record: KycRecord): Promise<void> {
  const path = `${KYC_COLLECTION}/${record.id}`;
  try {
    await setDoc(doc(db, KYC_COLLECTION, record.id), sanitizeForFirestore(record), { merge: true });
    notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteKycRecordFromCloud(recordId: string): Promise<void> {
  const path = `${KYC_COLLECTION}/${recordId}`;
  try {
    await deleteDoc(doc(db, KYC_COLLECTION, recordId));
    notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- Quotations ----------------
export function subscribeToCloudQuotations(onData: (quotations: Quotation[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, QUOTATIONS_COLLECTION),
    (snapshot) => {
      notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
      if (!snapshot.empty) {
        const list: Quotation[] = snapshot.docs.map((d) => d.data() as Quotation);
        list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        saveQuotations(list);
        onData(list);
      } else if (hasSeeded) {
        saveQuotations([]);
        onData([]);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, QUOTATIONS_COLLECTION);
    }
  );
}

export async function saveQuotationToCloud(quotation: Quotation): Promise<void> {
  const path = `${QUOTATIONS_COLLECTION}/${quotation.id}`;
  try {
    await setDoc(doc(db, QUOTATIONS_COLLECTION, quotation.id), sanitizeForFirestore(quotation), { merge: true });
    notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteQuotationFromCloud(quotationId: string): Promise<void> {
  const path = `${QUOTATIONS_COLLECTION}/${quotationId}`;
  try {
    await deleteDoc(doc(db, QUOTATIONS_COLLECTION, quotationId));
    notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- Shipping Line Payments ----------------
export function subscribeToCloudShippingLinePayments(
  onData: (payments: ShippingLinePayment[]) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, SHIPPING_LINE_PAYMENTS_COLLECTION),
    (snapshot) => {
      notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
      if (!snapshot.empty) {
        const list: ShippingLinePayment[] = snapshot.docs.map(
          (d) => d.data() as ShippingLinePayment
        );
        list.sort((a, b) => (a.paymentDeadline || '').localeCompare(b.paymentDeadline || ''));
        saveShippingLinePayments(list);
        onData(list);
      } else if (hasSeeded) {
        saveShippingLinePayments([]);
        onData([]);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, SHIPPING_LINE_PAYMENTS_COLLECTION);
    }
  );
}

export async function saveShippingLinePaymentToCloud(
  payment: ShippingLinePayment
): Promise<void> {
  const path = `${SHIPPING_LINE_PAYMENTS_COLLECTION}/${payment.id}`;
  try {
    await setDoc(doc(db, SHIPPING_LINE_PAYMENTS_COLLECTION, payment.id), sanitizeForFirestore(payment), {
      merge: true,
    });
    notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteShippingLinePaymentFromCloud(paymentId: string): Promise<void> {
  const path = `${SHIPPING_LINE_PAYMENTS_COLLECTION}/${paymentId}`;
  try {
    await deleteDoc(doc(db, SHIPPING_LINE_PAYMENTS_COLLECTION, paymentId));
    notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------- Confirmed Shipment Costings ----------------
export function subscribeToCloudCostings(onData: (costings: ShipmentCosting[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, COSTINGS_COLLECTION),
    (snapshot) => {
      notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
      if (!snapshot.empty) {
        const list: ShipmentCosting[] = snapshot.docs.map((d) => d.data() as ShipmentCosting);
        list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        saveCostings(list);
        onData(list);
      } else if (hasSeeded) {
        saveCostings([]);
        onData([]);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, COSTINGS_COLLECTION);
    }
  );
}

export async function saveCostingToCloud(costing: ShipmentCosting): Promise<void> {
  const path = `${COSTINGS_COLLECTION}/${costing.id}`;
  try {
    await setDoc(doc(db, COSTINGS_COLLECTION, costing.id), sanitizeForFirestore(costing), { merge: true });
    notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCostingFromCloud(costingId: string): Promise<void> {
  const path = `${COSTINGS_COLLECTION}/${costingId}`;
  try {
    await deleteDoc(doc(db, COSTINGS_COLLECTION, costingId));
    notifyCloudStatus({ isConnected: true, lastSyncTime: new Date() });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
