export interface BankDetails {
  accountNameJp: string;
  bankNameJp: string;
  bankCode: string;
  branchNameJp: string;
  branchCode: string;
  accountTypeJp: string;
  accountNumber: string;
  swiftCode: string;
  accountNameEn: string;
  bankNameEn: string;
  branchNameEn: string;
  accountTypeEn: string;
}

export interface CompanyProfile {
  companyNameEn: string;
  companyNameJp: string;
  ownerNameEn: string;
  ownerNameJp: string;
  roleTitleEn: string;
  registrationNumber: string; // 登録番号 e.g. T9120001213448
  addressJp: string;
  addressEn: string;
  postalCode: string;
  phone: string;
  mobile: string;
  fax: string;
  email: string;
  website: string;
  customLogoUrl?: string;
  bankDetails: BankDetails;
}

// Module 1: Customer Details
export interface Customer {
  id: string;
  name: string;
  addressLine1: string;
  addressLine2: string;
  tel: string;
  fax: string;
  email: string;
  taxId: string;
  salesPerson: string;
  remark1: string;
  remark2: string;
  createdAt: string;
  updatedAt: string;
}

// Module 2: Logistics Parties
export interface Shipper {
  id: string;
  name: string;
  addressLine1: string;
  addressLine2: string;
  tel: string;
  fax: string;
  email: string;
  taxId: string;
  remark: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Consignee {
  id: string;
  name: string;
  addressLine1: string;
  addressLine2: string;
  tel: string;
  fax: string;
  email: string;
  taxId: string;
  remark: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotifyParty {
  id: string;
  name: string;
  addressLine1: string;
  addressLine2: string;
  tel: string;
  fax: string;
  email: string;
  taxId: string;
  remark: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CurrencyValueType = 'JPY' | 'USD' | 'EURO';

// Dedicated KYC Module Types (Compliance & Logistics Party Verification)
export interface KycParty {
  name: string;
  addressLine1: string;
  addressLine2: string;
  tel: string;
  fax: string;
  email: string;
  taxId: string;
  remark: string;
}

export type KycStatus = 'VERIFIED' | 'PENDING' | 'IN_REVIEW';

export interface KycRecord {
  id: string;
  kycNumber: string; // e.g. KYC-2026-0001
  customerCompany: string;
  shipper: KycParty;
  consignee: KycParty;
  notifyParty: KycParty;
  hasAlsoNotify?: boolean;
  alsoNotifyParty?: KycParty; // "1 in 1000 times" conditional party
  valueType?: CurrencyValueType; // Optional (removed from active UI)
  incoterm?: string; // Optional (removed from active UI)
  fpod?: string; // Final Port of Discharge (Manual)
  pod?: string; // Port of Discharge (Manual)
  status: KycStatus;
  documentDate: string;
  remarks: string;
  createdAt: string;
  updatedAt: string;
}

export type BookingStatus = 'DRAFT' | 'CONFIRMED' | 'SHIPPED' | 'CANCELLED';

export interface BookingConfirmation {
  id: string;
  bookingNumber: string;
  shipmentNo?: string;
  blNo?: string;
  date: string;
  status: BookingStatus;
  customerCompany: string;
  forwarderCompany?: string;
  shipperCompany: string;
  consigneeCompany: string;
  notifyParty: string;
  alsoNotifyParty?: string; // Rare: "1 in 1000 times" conditional party
  hasAlsoNotify?: boolean;
  valueType?: CurrencyValueType; // Optional (removed from active UI)
  incoterm?: string; // Optional (removed from active UI)
  fpod: string; // Final Port of Discharge (Manual text)
  pod: string; // Port of Discharge (Manual text)
  shippingCompany: string;
  vessel: string;
  voyage: string;
  cyCutOpen?: string; // CY Cut Open
  docCyCut?: string; // Doc CY Cut
  cyOpenDate?: string;
  cyCutDate: string; // CY Cut off
  etd: string;
  eta: string;
  por?: string;
  pol?: string;
  pody?: string;
  cargoVolumeSize: string;
  containerCount?: number; // Container Qty e.g. 1, 2, 3
  containerSize?: string; // Container Type e.g. 40' HC, 20' GP, 40' GP, 45' HC
  containerNumbers?: string; // e.g. MSCU1234567, TGHU7654321, TEMU9876543
  sealNumbers?: string; // Container Seal No(s)
  grossWeightKg?: string; // Cargo Gross Weight e.g. "14,500 KG"
  measurementCbm?: string; // Volume e.g. "68.4 M3 / CBM"
  hsCode?: string; // Harmonized Tariff Code e.g. "8703.23"
  commodity: string;
  blType?: string;
  blDescription?: string;
  freightTerm?: string;
  blIssuePlace?: string;
  // Full Logistics Party Details (Address, Phone, Tax ID for customer copy)
  showFullPartyDetails?: boolean;
  shipperAddress?: string;
  shipperTel?: string;
  shipperTaxId?: string;
  consigneeAddress?: string;
  consigneeTel?: string;
  consigneeTaxId?: string;
  notifyAddress?: string;
  notifyTel?: string;
  notifyTaxId?: string;
  alsoNotifyAddress?: string;
  alsoNotifyTel?: string;
  alsoNotifyTaxId?: string;
  remarks: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

// Module 3: Trucking - Add Stock (Inventory)
export type StockStatus = 'IN YARD' | 'DISPATCHED' | 'SHIPPED' | 'PENDING' | 'AUCTION' | 'INSPECTED';

export interface StockItem {
  id: string;
  chassisNumber: string; // Required *
  engineNumber: string;
  auctionNumber: string;
  customerStockNumber: string;
  customerCompany: string; // Required *
  shipperCompany: string; // Required *
  color: string;
  model: string; // Required *
  portTo: string;
  destination: string;
  yardIn: string; // Date
  yardOut: string; // Date
  yardName: string;
  yardPosition: string;
  status: StockStatus | string; // Required *
  remarks: string;
  createdAt: string;
  updatedAt: string;
}

// Module 3A: Add Trucking Sheet
export interface TruckingSheet {
  id: string;
  sheetNumber: string;
  customerCompany: string; // Required *
  shipperCompany: string; // Required *
  truckingCompany: string; // Required *
  isNonBillable: boolean;
  pickupDate: string; // Required *
  deliveryDate: string; // Required *
  pickupLocation: string; // Required *
  deliveryLocation: string; // Required *
  auctionBuyer: string;
  posNumber: string;
  truckingCompanyRemarks: string;
  customerRemarks: string;
  internalRemarks: string;
  chassisNumbers?: string[];
  createdAt: string;
  updatedAt: string;
}

// Module 3B: Trucking Company Directory & Dashboard
export interface TruckingCompany {
  id: string;
  companyNameEn: string; // Required *
  companyNameJp: string; // Required *
  contactPersonEn: string; // Required *
  contactPersonJp: string; // Required *
  email: string;
  phoneNumber: string; // Required *
  fax: string; // Required *
  mobileNumber: string;
  postBox: string;
  prefectureEn: string;
  prefectureJp: string;
  cityEn: string;
  cityJp: string;
  addressEn: string;
  addressJp: string;
  createdAt: string;
  updatedAt: string;
}

// Master Data
export interface MasterData {
  shippingCompanies: string[];
  destinations: string[];
  makeModels: string[];
  finalDestinations: string[];
  portNames: string[];
  vehicleColors: string[];
}

export interface InvoiceItem {
  id: string;
  details: string; // Freight, Doc Fee, THC, Seal Fee, Custom, etc.
  description: string;
  currency: 'USD' | 'JPY' | 'EURO';
  unitPrice: number;
  quantity?: number | null;
  taxRate: number; // 0 or 10
  lineTotalJpy: number;
}

export type InvoiceStatus = 'UNPAID' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'PENDING';

export interface PaymentTransaction {
  id: string;
  date: string;
  amountJpy: number;
  method?: string;
  reference?: string;
  notes?: string;
}

export interface FreightInvoice {
  id: string;
  invoiceNo: string;
  date: string;
  paymentDueDate: string;
  status: InvoiceStatus;
  customerName: string;
  customerAddress: string;
  portFrom: string;
  portTo: string;
  shippingCompany: string;
  vesselVoyage: string;
  etd: string;
  eta: string;
  blNo: string;
  bookingNo: string;
  shipmentNo?: string;
  shipmentMode: string;
  freightTerm: string; // PREPAID, COLLECT
  exchangeRate: number;
  containerCount: number; // e.g. 1, 2, 3
  containerSize?: string; // e.g. "40' HC", "20' GP", "40' GP", "45' HC"
  containerNumbers?: string; // e.g. "MSCU1234567, TGHU7654321, TEMU9876543"
  sealNumbers?: string; // Container Seal No(s)
  grossWeightKg?: string; // Weight e.g. "14,500 KG"
  measurementCbm?: string; // Volume e.g. "68.4 M3"
  items: InvoiceItem[];
  subTotalJpy: number;
  discountJpy: number;
  remarks: string;
  grandTotalJpy: number;
  amountReceivedJpy?: number;
  outstandingBalanceJpy?: number;
  lastPaymentDate?: string;
  paymentHistory?: PaymentTransaction[];
  linkedBookingId?: string;
  linkedQuotationId?: string;
  quotationNo?: string;
  // Internal Accounting Only (never displayed on customer-facing invoice PDF)
  actualCostItems?: QuotationCostItem[];
  actualShippingCostJpy?: number;
  netProfitLossJpy?: number;
  profitMarginPct?: number;
  linkedShippingPaymentId?: string;
  actualCostUpdatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Module: Quotation Management & Profit/Loss Analysis
export type QuotationStatus =
  | 'DRAFT'
  | 'SENT'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CONVERTED';

export type QuotationMethod = 'REFERENCE' | 'CONFIRMED_BOOKING';

export interface QuotationCostItem {
  id: string;
  category: string; // Ocean Freight Cost, THC Cost, Trucking/Drayage, Customs, Doc Cost, Other
  description: string;
  supplierName?: string;
  currency: 'USD' | 'JPY' | 'EURO';
  unitCost: number;
  quantity?: number | null;
  taxRate: number; // 0 or 10
  lineCostJpy: number;
}

export interface QuotationStatusHistoryEntry {
  id: string;
  status: QuotationStatus;
  date: string;
  note?: string;
}

export interface Quotation {
  id: string;
  quotationNo: string;
  date: string;
  validUntil: string;
  status: QuotationStatus;
  quotationMethod?: QuotationMethod;
  linkedBookingId?: string;
  bookingNo?: string;
  shipmentNo?: string;
  blNo?: string;
  customerId?: string;
  customerName: string;
  customerAddress: string;
  customerEmail?: string;
  portFrom: string;
  portTo: string;
  shippingCompany: string;
  vesselVoyage: string;
  etd: string;
  eta: string;
  cyOpenDate?: string;
  cyCutDate?: string;
  shipmentMode: string;
  freightTerm: string;
  exchangeRate: number;
  containerCount: number;
  containerSize?: string;
  containerNumbers?: string;
  sellingItems: InvoiceItem[];
  totalSellingJpy: number;
  costItems: QuotationCostItem[];
  totalCostJpy: number;
  netProfitLossJpy: number;
  profitMarginPct: number;
  statusHistory?: QuotationStatusHistoryEntry[];
  linkedCostingId?: string;
  linkedCostingNo?: string;
  linkedInvoiceId?: string;
  linkedInvoiceNo?: string;
  remarks: string;
  termsAndConditions?: string;
  termsList?: string[];
  createdAt: string;
  updatedAt: string;
}

// Module: Confirmed Shipment Costing & Profit/Loss
export interface ShipmentCosting {
  id: string;
  costingNo: string;
  date: string;
  linkedQuotationId?: string;
  quotationNo: string;
  linkedBookingId?: string;
  bookingNo: string;
  shipmentNo?: string;
  blNo?: string;
  customerId?: string;
  customerName: string;
  customerAddress?: string;
  portFrom: string;
  portTo: string;
  shippingCompany: string;
  vesselVoyage: string;
  etd: string;
  eta: string;
  shipmentMode: string;
  freightTerm: string;
  exchangeRate: number;
  containerCount: number;
  containerSize?: string;
  containerNumbers?: string;
  sellingItems: InvoiceItem[];
  totalSellingJpy: number;
  costItems: QuotationCostItem[];
  totalCostJpy: number;
  netProfitLossJpy: number;
  profitMarginPct: number;
  linkedInvoiceId?: string;
  linkedInvoiceNo?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

// Module: Shipping Line Payment Management
export type ShippingLinePaymentStatus = 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';

export interface ShippingLinePayment {
  id: string;
  paymentRefNo: string;
  shippingLineName: string;
  bookingNo: string;
  shipmentNo?: string;
  blNo?: string;
  customerName?: string;
  linkedBookingId?: string;
  linkedQuotationId?: string;
  linkedCostingId?: string;
  linkedInvoiceId?: string;
  containerCount: number;
  containerSize?: string;
  containerDetails: string;
  vesselVoyage?: string;
  portFrom?: string;
  portTo?: string;
  payableAmountJpy: number;
  amountPaidJpy: number;
  outstandingAmountJpy: number;
  paymentDeadline: string;
  paymentDate?: string;
  status: ShippingLinePaymentStatus;
  paymentHistory?: PaymentTransaction[];
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'ADMIN' | 'STAFF';

export interface AppUser {
  id: string;
  userId: string; // Login ID / Email e.g. admin or staff@ytandl.co.jp
  name: string;
  password: string;
  role: UserRole;
  department?: string;
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
  lastLoginAt?: string;
}

export type Language = 'en' | 'ja';

export interface AuthSession {
  currentUser: AppUser | null;
  isAuthenticated: boolean;
  loginTimestamp?: number;
  expiresAt?: number;
}

export type ActiveTab =
  | 'dashboard'
  | 'bookings'
  | 'quotations'
  | 'invoices'
  | 'customerPayments'
  | 'shippingPayments'
  | 'customers'
  | 'kyc'
  | 'masters'
  | 'admin'
  | 'settings';
