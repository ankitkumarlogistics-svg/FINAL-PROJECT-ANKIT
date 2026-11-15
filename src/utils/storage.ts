import {
  CompanyProfile,
  BookingConfirmation,
  FreightInvoice,
  AppUser,
  AuthSession,
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
import { DEFAULT_QUOTATION_TERMS, formatTermsListToText } from './interconnection';

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  companyNameEn: 'YOKOHAMA TRADING & LOGISTICS',
  companyNameJp: '横浜トレーディング株式会社',
  ownerNameEn: 'Muhammad Fareed',
  ownerNameJp: 'ファリード ムハンマド',
  roleTitleEn: 'Owner of Yokohama TRADING & LOGISTICS & Prominent Car Export Company',
  registrationNumber: 'T9120001213448',
  postalCode: '〒306-0501',
  addressJp: '茨城県坂東市逆井2833番地165',
  addressEn: '2833-165 Sakasai, Bando-shi, Ibaraki-ken 306-0501, Japan',
  phone: '0280-33-3423',
  mobile: '090-6950-0555',
  fax: '0280-33-6367',
  email: 'logistics@ytandl.co.jp',
  website: 'www.yokohamalogistics.jp',
  customLogoUrl: '/logo.png',
  bankDetails: {
    accountNameJp: '横浜トレーディング(株)',
    bankNameJp: '三井住友銀行',
    bankCode: '0009',
    branchNameJp: '上町支店',
    branchCode: '106',
    accountTypeJp: '普通',
    accountNumber: '1439210',
    swiftCode: 'SMBCJPJT',
    accountNameEn: 'YOKOHAMA TRADING & LOGISTICS CO., LTD.',
    bankNameEn: 'SUMITOMO MITSUI BANKING CORPORATION',
    branchNameEn: 'UEMACHI BRANCH',
    accountTypeEn: 'NORMAL',
  },
};

// Initial Master Data
export const INITIAL_MASTERS: MasterData = {
  shippingCompanies: [
    'OCEAN NETWORK EXPRESS (ONE)',
    'CMA-CGM',
    'TS LINES',
    'MAERSK LINE',
    'MSC (MEDITERRANEAN SHIPPING CO.)',
    'EVERGREEN MARINE',
    'SITC CONTAINER LINES',
    'WAN HAI LINES',
    'HAPAG-LLOYD',
    'COSCO SHIPPING',
  ],
  destinations: [
    'DUBLIN, IRELAND',
    'KARACHI, PAKISTAN',
    'DAR ES SALAAM, TANZANIA',
    'MOMBASA, KENYA',
    'JEBEL ALI, UAE',
    'KINGSTON, JAMAICA',
    'COLOMBO, SRI LANKA',
    'CHITTAGONG, BANGLADESH',
    'PORT KELANG, MALAYSIA',
    'AUCKLAND, NEW ZEALAND',
  ],
  makeModels: [
    'TOYOTA PRIUS (ZVW50 / ZVW51)',
    'TOYOTA LAND CRUISER (URJ202 / VJA300)',
    'TOYOTA HIACE VAN (KDH201 / TRH200)',
    'TOYOTA HARRIER (MXUA80)',
    'TOYOTA RAV4 (MXAA54)',
    'NISSAN X-TRAIL (T32 / T33)',
    'NISSAN NOTE (E12 / E13)',
    'HONDA VEZEL (RU1 / RV3)',
    'HONDA FIT (GK3 / GR1)',
    'SUBARU FORESTER (SK9)',
    'MAZDA CX-5 (KF2P)',
    'SUZUKI JIMNY SIERRA (JB74W)',
  ],
  finalDestinations: [
    'DUBLIN (IE)',
    'KARACHI QASIM (PK)',
    'DAR ES SALAAM (TZ)',
    'MOMBASA (KE)',
    'JEBEL ALI FREE ZONE (AE)',
    'KINGSTON (JM)',
    'COLOMBO PORT (LK)',
    'KAMPALA (UG via MBA)',
    'LUSAKA (ZM via DAR)',
  ],
  portNames: [
    'NAGOYA, JAPAN',
    'YOKOHAMA, JAPAN',
    'KOBE, JAPAN',
    'TOKYO, JAPAN',
    'OSAKA, JAPAN',
    'MOJI, JAPAN',
    'HAKATA, JAPAN',
    'KAWASAKI, JAPAN',
  ],
  vehicleColors: [
    'PEARL WHITE (070)',
    'SOLID WHITE (040)',
    'BLACK (202 / 218)',
    'SILVER METALLIC (1F7)',
    'DARK GREY METALLIC (1G3)',
    'NAVY BLUE (8X8)',
    'WINE RED (3R3)',
    'BRONZE GOLD (4X7)',
    'BEIGE / KHAKI (6X3)',
  ],
};

// Module 1: Initial Customers
export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'HBI CO., LTD',
    addressLine1: '4-12-10 Sakae, Naka-ku, Nagoya-shi',
    addressLine2: 'Aichi 460-0008, Japan',
    tel: '+81-52-228-7611',
    fax: '+81-52-228-7612',
    email: 'operations@hbi-japan.com',
    taxId: 'T8180001045921',
    salesPerson: 'Kenji Sato',
    remark1: 'VIP Client for Dublin & Karachi auto consignments',
    remark2: 'Always require D/R prior to 2 days of cut off',
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-10-15T09:30:00Z',
  },
  {
    id: 'cust-2',
    name: 'AL-ZAHRA AUTO TRADING LLC',
    addressLine1: 'Warehouse No. 14, Ras Al Khor Industrial Area 2',
    addressLine2: 'PO Box 89201, Dubai, United Arab Emirates',
    tel: '+971-4-333-8812',
    fax: '+971-4-333-8813',
    email: 'import@alzahraauto.ae',
    taxId: 'TRN-100293847200003',
    salesPerson: 'Muhammad Fareed',
    remark1: 'Specializes in Toyota Land Cruiser & SUVs',
    remark2: 'Payment term: 30% advance, 70% against BL copy',
    createdAt: '2026-09-15T10:00:00Z',
    updatedAt: '2026-10-18T11:00:00Z',
  },
  {
    id: 'cust-3',
    name: 'CARCADE INTERNATIONAL LTD.',
    addressLine1: 'Room 502, Port View Tower, 1-3-1 Kaigandori',
    addressLine2: 'Chuo-ku, Kobe-shi, Hyogo 650-0024, Japan',
    tel: '+81-78-392-4400',
    fax: '+81-78-392-4401',
    email: 'info@carcade.co.jp',
    taxId: 'T4140001088732',
    salesPerson: 'Tariq Mehmood',
    remark1: 'Regular container exporter from Nagoya and Kobe',
    remark2: 'Requires photo inspection before yard loading',
    createdAt: '2026-08-10T09:00:00Z',
    updatedAt: '2026-10-01T12:00:00Z',
  },
];

// Module 2: Initial Shippers, Consignees, Notify Parties
export const INITIAL_SHIPPERS: Shipper[] = [
  {
    id: 'ship-1',
    name: 'YOKOHAMA TRADING & LOGISTICS CO., LTD.',
    addressLine1: '2833-165 Sakasai, Bando-shi',
    addressLine2: 'Ibaraki-ken 306-0501, Japan',
    tel: '0280-33-3423',
    fax: '0280-33-6367',
    email: 'logistics@ytandl.co.jp',
    taxId: 'T9120001213448',
    remark: 'Primary Export Entity',
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'ship-2',
    name: 'CARCADE INTERNATIONAL LTD.',
    addressLine1: 'Room 502, Port View Tower, 1-3-1 Kaigandori',
    addressLine2: 'Chuo-ku, Kobe-shi, Hyogo 650-0024, Japan',
    tel: '+81-78-392-4400',
    fax: '+81-78-392-4401',
    email: 'info@carcade.co.jp',
    taxId: 'T4140001088732',
    remark: 'Registered motor vehicle exporter',
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
  },
];

export const INITIAL_CONSIGNEES: Consignee[] = [
  {
    id: 'con-1',
    name: 'PAK CARGO LOGISTICS KARACHI',
    addressLine1: 'Plot 48/C, Commercial Area, Port Qasim',
    addressLine2: 'Karachi, Sindh 75020, Pakistan',
    tel: '+92-21-3472-8800',
    fax: '+92-21-3472-8801',
    email: 'customs@pakcargologistics.pk',
    taxId: 'NTN-4920192-7',
    remark: 'Authorized bonded carrier at Port Qasim',
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'con-2',
    name: 'AL-ZAHRA MOTORS JEBEL ALI',
    addressLine1: 'Showroom 22, Auto Zone, JAFZA South',
    addressLine2: 'PO Box 89201, Dubai, United Arab Emirates',
    tel: '+971-4-333-8812',
    fax: '+971-4-333-8813',
    email: 'customs@alzahraauto.ae',
    taxId: 'TRN-100293847200003',
    remark: 'Direct delivery in JAFZA Free Zone',
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'con-3',
    name: 'DUBLIN PORT AUTO LOGISTICS IRELAND',
    addressLine1: 'Terminal 3, Alexandra Road, Dublin Port',
    addressLine2: 'Dublin 1, D01 W672, Ireland',
    tel: '+353-1-855-4000',
    fax: '+353-1-855-4001',
    email: 'clearance@dublinportauto.ie',
    taxId: 'IE-9823471A',
    remark: 'Licensed automotive customs broker',
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
  },
];

export const INITIAL_NOTIFY_PARTIES: NotifyParty[] = [
  {
    id: 'not-1',
    name: 'SAME AS CONSIGNEE',
    addressLine1: 'AS PER CONSIGNEE ADDRESS',
    addressLine2: '',
    tel: '',
    fax: '',
    email: '',
    taxId: '',
    remark: 'Standard Also Notify convention',
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'not-2',
    name: 'GLOBAL FREIGHT CLEARING DUBLIN',
    addressLine1: 'Unit 9, North City Business Park, Finglas',
    addressLine2: 'Dublin 11, Ireland',
    tel: '+353-1-834-9200',
    fax: '+353-1-834-9201',
    email: 'notify@globalfreight.ie',
    taxId: 'IE-3458921C',
    remark: 'European customs discharge agent',
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
  },
];

// Initial Bookings (Module 2)
export const INITIAL_BOOKINGS: BookingConfirmation[] = [
  {
    id: 'bkg-1',
    bookingNumber: 'TYO0799646',
    shipmentNo: 'SHP-2026-0101',
    blNo: 'CMA-NGO-788912',
    date: '2026-10-14',
    status: 'CONFIRMED',
    customerCompany: 'HBI CO., LTD',
    forwarderCompany: 'YOKOHAMA TRADING & LOGISTICS',
    shipperCompany: 'CARCADE INTERNATIONAL LTD.',
    consigneeCompany: 'DUBLIN PORT AUTO LOGISTICS IRELAND',
    notifyParty: 'GLOBAL FREIGHT CLEARING DUBLIN',
    alsoNotifyParty: '',
    hasAlsoNotify: false,
    valueType: 'USD',
    incoterm: 'CIF',
    fpod: 'DUBLIN (IE)',
    pod: 'DUBLIN',
    shippingCompany: 'CMA-CGM',
    vessel: 'CMA CGM ELBE',
    voyage: '0R11MW1MA',
    cyOpenDate: '2026-10-14',
    cyCutDate: '2026-10-20',
    etd: '2026-10-23',
    eta: '2026-12-14',
    por: 'NAGOYA',
    pol: 'NAGOYA',
    pody: 'DUBLIN',
    cargoVolumeSize: "1 X 40' Dry High",
    commodity: 'USED VEHICLE',
    blType: 'WAYBILL',
    blDescription: 'SHIPPER REQUEST',
    freightTerm: 'PREPAID as arranged.',
    blIssuePlace: 'OSAKA, JAPAN',
    remarks: 'CUSTOM BY CUSTOMER >> DOC CUT: 10/20 >> CY CUT: 10/22 >> BOOKING SLIDE TO NEXT VESSEL, AS PER CUSTOMER REQUEST',
    note: 'KINDLY SEND US D/R(ACL) AND S/I ONE DAY PRIOR OF CY CUT DATE TO AVOID ANY PENALTY. FAX: 0280-33-6367',
    createdAt: '2026-10-14T08:30:00Z',
    updatedAt: '2026-10-14T08:30:00Z',
  },
  {
    id: 'bkg-2',
    bookingNumber: '120BK6009764',
    shipmentNo: 'SHP-2026-0088',
    blNo: '120610087601',
    date: '2026-08-25',
    status: 'SHIPPED',
    customerCompany: 'HBI CO., LTD',
    forwarderCompany: 'YOKOHAMA TRADING & LOGISTICS',
    shipperCompany: 'CARCADE INTERNATIONAL LTD.',
    consigneeCompany: 'PAK CARGO LOGISTICS KARACHI',
    notifyParty: 'SAME AS CONSIGNEE',
    alsoNotifyParty: '',
    hasAlsoNotify: false,
    valueType: 'JPY',
    incoterm: 'FOB',
    fpod: 'KARACHI QASIM (PK)',
    pod: 'KARACHI',
    shippingCompany: 'TS LINES',
    vessel: 'OKEE AURELIA',
    voyage: '167W',
    cyOpenDate: '2026-08-20',
    cyCutDate: '2026-08-27',
    etd: '2026-08-30',
    eta: '2026-09-20',
    por: 'NAGOYA',
    pol: 'NAGOYA',
    pody: 'KARACHI',
    cargoVolumeSize: "1 X 40' High Cube",
    commodity: 'USED MOTOR VEHICLES',
    blType: 'ORIGINAL B/L',
    blDescription: 'SHIPPER COUNT LOAD & SEAL',
    freightTerm: 'PREPAID',
    blIssuePlace: 'TOKYO, JAPAN',
    remarks: 'VEHICLE CHASSIS NUMBERS SUBMITTED WITH JAPAN EXPORT CERTIFICATE',
    note: 'PLEASE SUBMIT B/L SURRENDER REQUEST 2 DAYS BEFORE ARRIVAL.',
    createdAt: '2026-08-25T09:00:00Z',
    updatedAt: '2026-08-30T11:20:00Z',
  },
  {
    id: 'bkg-3',
    bookingNumber: 'ONE-YOK-99210',
    shipmentNo: 'SHP-2026-0115',
    blNo: 'ONEY-YOK-992104',
    date: '2026-10-18',
    status: 'DRAFT',
    customerCompany: 'AL-ZAHRA AUTO TRADING LLC',
    forwarderCompany: 'YOKOHAMA TRADING & LOGISTICS',
    shipperCompany: 'YOKOHAMA TRADING & LOGISTICS CO., LTD.',
    consigneeCompany: 'AL-ZAHRA MOTORS JEBEL ALI',
    notifyParty: 'SAME AS CONSIGNEE',
    alsoNotifyParty: 'GULF EXPRESS LOGISTICS SHARJAH',
    hasAlsoNotify: true,
    valueType: 'USD',
    incoterm: 'CFR',
    fpod: 'JEBEL ALI FREE ZONE (AE)',
    pod: 'JEBEL ALI',
    shippingCompany: 'OCEAN NETWORK EXPRESS (ONE)',
    vessel: 'ONE HUMBER',
    voyage: '024E',
    cyOpenDate: '2026-10-22',
    cyCutDate: '2026-10-28',
    etd: '2026-11-02',
    eta: '2026-11-24',
    por: 'YOKOHAMA',
    pol: 'YOKOHAMA',
    pody: 'JEBEL ALI',
    cargoVolumeSize: "2 X 40' High Cube",
    commodity: 'USED VEHICLES (TOYOTA LAND CRUISER)',
    blType: 'SEAWAY BILL',
    blDescription: 'AS PER SHIPPER DECLARATION',
    freightTerm: 'PREPAID as arranged.',
    blIssuePlace: 'YOKOHAMA, JAPAN',
    remarks: 'SPECIAL DECK STOWAGE REQUESTED. DIRECT DISCHARGE.',
    note: 'SEND ALL D/R DOCUMENTS TO FAX 0280-33-6367 OR EMAIL BEFORE CUT DATE.',
    createdAt: '2026-10-18T10:15:00Z',
    updatedAt: '2026-10-18T10:15:00Z',
  },
];

// Module 3: Initial Stock Items
export const INITIAL_STOCKS: StockItem[] = [
  {
    id: 'stk-1',
    chassisNumber: 'ZVW50-1092834',
    engineNumber: '2ZR-FXE-99120',
    auctionNumber: 'USS Tokyo #50921',
    customerStockNumber: 'CUST-HB-901',
    customerCompany: 'HBI CO., LTD',
    shipperCompany: 'CARCADE INTERNATIONAL LTD.',
    color: 'PEARL WHITE (070)',
    model: 'TOYOTA PRIUS (ZVW50 / ZVW51)',
    portTo: 'NAGOYA',
    destination: 'DUBLIN, IRELAND',
    yardIn: '2026-10-12',
    yardOut: '',
    yardName: 'Nagoya Tobishima Yard A-1',
    yardPosition: 'Bay 14-Row 3',
    status: 'IN YARD',
    remarks: 'Clean condition, auction grade 4.5. Key and docs secured in office.',
    createdAt: '2026-10-12T04:00:00Z',
    updatedAt: '2026-10-12T04:00:00Z',
  },
  {
    id: 'stk-2',
    chassisNumber: 'URJ202-0089123',
    engineNumber: '1UR-FE-44912',
    auctionNumber: 'TAA Kanto #1184',
    customerStockNumber: 'AZ-LC200-08',
    customerCompany: 'AL-ZAHRA AUTO TRADING LLC',
    shipperCompany: 'YOKOHAMA TRADING & LOGISTICS CO., LTD.',
    color: 'BLACK (202 / 218)',
    model: 'TOYOTA LAND CRUISER (URJ202 / VJA300)',
    portTo: 'YOKOHAMA',
    destination: 'JEBEL ALI, UAE',
    yardIn: '2026-10-15',
    yardOut: '',
    yardName: 'Yokohama Daikoku Pier Yard',
    yardPosition: 'Zone C - Spot 88',
    status: 'INSPECTED',
    remarks: 'Export radiation inspection passed. Ready for vanning on ONE HUMBER.',
    createdAt: '2026-10-15T06:00:00Z',
    updatedAt: '2026-10-17T02:00:00Z',
  },
  {
    id: 'stk-3',
    chassisNumber: 'KDH201-0182394',
    engineNumber: '1KD-FTV-88210',
    auctionNumber: 'CAA Chubu #7741',
    customerStockNumber: 'HB-HIACE-44',
    customerCompany: 'HBI CO., LTD',
    shipperCompany: 'CARCADE INTERNATIONAL LTD.',
    color: 'SILVER METALLIC (1F7)',
    model: 'TOYOTA HIACE VAN (KDH201 / TRH200)',
    portTo: 'NAGOYA',
    destination: 'KARACHI, PAKISTAN',
    yardIn: '2026-08-22',
    yardOut: '2026-08-28',
    yardName: 'Nagoya Port Yard 2',
    yardPosition: 'Loaded Cont #TGHU991204',
    status: 'SHIPPED',
    remarks: 'Loaded and sailed on OKEE AURELIA voyage 167W.',
    createdAt: '2026-08-22T08:00:00Z',
    updatedAt: '2026-08-30T10:00:00Z',
  },
];

// Module 3A: Initial Trucking Sheets
export const INITIAL_TRUCKING_SHEETS: TruckingSheet[] = [
  {
    id: 'ts-1',
    sheetNumber: 'TRK-2026-0041',
    customerCompany: 'HBI CO., LTD',
    shipperCompany: 'CARCADE INTERNATIONAL LTD.',
    truckingCompany: 'TOKYO EXPRESS TRANSPORT (東京エクスプレス輸送)',
    isNonBillable: false,
    pickupDate: '2026-10-20',
    deliveryDate: '2026-10-21',
    pickupLocation: 'USS Tokyo Auction Yard, Noda, Chiba',
    deliveryLocation: 'Nagoya Tobishima Container Terminal Yard',
    auctionBuyer: 'Buyer Member #39012 (Kenji)',
    posNumber: 'POS-8921-TK',
    truckingCompanyRemarks: 'Car carrier trailer capacity 6 units. Pickup 09:00 AM sharp.',
    customerRemarks: 'Deliver to Yard A before 15:00 on the 21st.',
    internalRemarks: 'Driver contact: Sato 090-1234-5678. Toll receipt to be submitted.',
    chassisNumbers: ['ZVW50-1092834'],
    createdAt: '2026-10-19T03:00:00Z',
    updatedAt: '2026-10-19T03:00:00Z',
  },
  {
    id: 'ts-2',
    sheetNumber: 'TRK-2026-0042',
    customerCompany: 'AL-ZAHRA AUTO TRADING LLC',
    shipperCompany: 'YOKOHAMA TRADING & LOGISTICS CO., LTD.',
    truckingCompany: 'KANTO YARD LOGISTICS (関東ヤード陸送)',
    isNonBillable: true,
    pickupDate: '2026-10-22',
    deliveryDate: '2026-10-22',
    pickupLocation: 'TAA Kanto Auction, Saitama',
    deliveryLocation: 'Yokohama Daikoku Pier Yard',
    auctionBuyer: 'Direct Purchase Staff #01',
    posNumber: 'POS-7744-YT',
    truckingCompanyRemarks: 'Single loader specialized for large 4WD SUV.',
    customerRemarks: 'Inspection report copy to be signed at gate receipt.',
    internalRemarks: 'Non-billable internal inter-yard transfer.',
    chassisNumbers: ['URJ202-0089123'],
    createdAt: '2026-10-20T08:00:00Z',
    updatedAt: '2026-10-20T08:00:00Z',
  },
];

// Module 3B: Initial Trucking Companies
export const INITIAL_TRUCKING_COMPANIES: TruckingCompany[] = [
  {
    id: 'tc-1',
    companyNameEn: 'TOKYO EXPRESS TRANSPORT CO., LTD.',
    companyNameJp: '東京エクスプレス輸送株式会社',
    contactPersonEn: 'Takeshi Yamada (Dispatch Mgr)',
    contactPersonJp: '山田 健司 (配車センター長)',
    email: 'dispatch@tokyo-express-transport.co.jp',
    phoneNumber: '03-5599-8800',
    fax: '03-5599-8801',
    mobileNumber: '090-3344-9988',
    postBox: '136-0082',
    prefectureEn: 'Tokyo',
    prefectureJp: '東京都',
    cityEn: 'Koto-ku',
    cityJp: '江東区',
    addressEn: '3-5-18 Shinsuna, Koto-ku, Tokyo 136-0082',
    addressJp: '東京都江東区新砂3-5-18 エクスプレス物流ビル4F',
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'tc-2',
    companyNameEn: 'KANTO YARD LOGISTICS & CARRIERS',
    companyNameJp: '関東ヤード陸送株式会社',
    contactPersonEn: 'Hiroshi Suzuki (Fleet Coordinator)',
    contactPersonJp: '鈴木 浩 (運行管理者)',
    email: 'kanto.trans@yard-logi.jp',
    phoneNumber: '045-680-3311',
    fax: '045-680-3312',
    mobileNumber: '080-7711-2299',
    postBox: '231-0005',
    prefectureEn: 'Kanagawa',
    prefectureJp: '神奈川県',
    cityEn: 'Yokohama-shi Naka-ku',
    cityJp: '横浜市中区',
    addressEn: '1-1 Daikoku Pier, Tsurumi-ku, Yokohama, Kanagawa',
    addressJp: '神奈川県横浜市鶴見区大黒ふ頭1-1 海運センタービル2F',
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'tc-3',
    companyNameEn: 'CHUBU MEITETSU AUTO HAULERS',
    companyNameJp: '中部名鉄自動車輸送有限会社',
    contactPersonEn: 'Daiki Kato',
    contactPersonJp: '加藤 大樹',
    email: 'chubu.meitetsu@haulers.jp',
    phoneNumber: '052-651-4490',
    fax: '052-651-4491',
    mobileNumber: '090-8833-1100',
    postBox: '455-0032',
    prefectureEn: 'Aichi',
    prefectureJp: '愛知県',
    cityEn: 'Nagoya-shi Minato-ku',
    cityJp: '名古屋市港区',
    addressEn: '2-1-4 Irifune, Minato-ku, Nagoya-shi, Aichi',
    addressJp: '愛知県名古屋市港区入船2-1-4 名港ターミナル内',
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
  },
];

// Initial Invoices
export const INITIAL_INVOICES: FreightInvoice[] = [
  {
    id: 'inv-1',
    invoiceNo: 'YTL-FI-133916',
    date: '2026-08-31',
    paymentDueDate: '2026-09-22',
    status: 'PAID',
    customerName: 'HBI CO., LTD',
    customerAddress: 'YATOMI-SHI, TOKAI, AICHI, JAPAN',
    portFrom: 'NAGOYA',
    portTo: 'KARACHI',
    shippingCompany: 'TS LINES',
    vesselVoyage: 'OKEE AURELIA 167W',
    etd: '2026-08-30',
    eta: '2026-09-20',
    blNo: '120610087601',
    bookingNo: '120BK6009764',
    shipmentNo: 'SHP-2026-0088',
    shipmentMode: 'Container',
    freightTerm: 'PREPAID',
    exchangeRate: 162.22,
    containerCount: 1,
    items: [
      {
        id: 'item-1',
        details: 'Freight',
        description: 'FREIGHT - $ 1830 X 1 CONT. TAX FREE',
        currency: 'USD',
        unitPrice: 1830,
        quantity: 1,
        taxRate: 0,
        lineTotalJpy: 296863,
      },
      {
        id: 'item-2',
        details: 'Doc Fee',
        description: 'DOC FEE - 6100 YEN X 1 B/L',
        currency: 'JPY',
        unitPrice: 6100,
        quantity: 1,
        taxRate: 0,
        lineTotalJpy: 6100,
      },
      {
        id: 'item-3',
        details: 'THC',
        description: 'SEAL FEE - 2800 YEN X 1 CONT.',
        currency: 'JPY',
        unitPrice: 2800,
        quantity: 1,
        taxRate: 0,
        lineTotalJpy: 2800,
      },
    ],
    subTotalJpy: 305763,
    discountJpy: 0,
    remarks: 'SHIPPER - CARCADE INTERNATIONAL LTD.',
    grandTotalJpy: 305763,
    amountReceivedJpy: 305763,
    outstandingBalanceJpy: 0,
    lastPaymentDate: '2026-09-20',
    paymentHistory: [
      {
        id: 'pay-init-1',
        date: '2026-09-20',
        amountJpy: 305763,
        method: 'Bank Transfer (SMBC)',
        reference: 'RM-20260920-01',
        notes: 'Full settlement received',
      },
    ],
    linkedBookingId: 'bkg-2',
    linkedQuotationId: 'quo-2',
    quotationNo: 'QT-2026-0088',
    createdAt: '2026-08-31T05:00:00Z',
    updatedAt: '2026-09-20T04:00:00Z',
  },
  {
    id: 'inv-2',
    invoiceNo: 'YTL-FI-133988',
    date: '2026-10-15',
    paymentDueDate: '2026-11-16',
    status: 'PARTIAL',
    customerName: 'HBI CO., LTD',
    customerAddress: 'YATOMI-SHI, TOKAI, AICHI, JAPAN',
    portFrom: 'NAGOYA',
    portTo: 'DUBLIN',
    shippingCompany: 'CMA-CGM',
    vesselVoyage: 'CMA CGM ELBE 0R11MW1MA',
    etd: '2026-10-23',
    eta: '2026-12-14',
    blNo: 'CMA-NGO-788912',
    bookingNo: 'TYO0799646',
    shipmentNo: 'SHP-2026-0101',
    shipmentMode: "Container (1 X 40' HC)",
    freightTerm: 'PREPAID',
    exchangeRate: 153.5,
    containerCount: 1,
    items: [
      {
        id: 'item-201',
        details: 'Freight',
        description: "OCEAN FREIGHT TO DUBLIN - $ 2,450 X 1 CONT.",
        currency: 'USD',
        unitPrice: 2450,
        quantity: 1,
        taxRate: 0,
        lineTotalJpy: 376075,
      },
      {
        id: 'item-202',
        details: 'Doc Fee',
        description: 'DOCUMENTATION FEE',
        currency: 'JPY',
        unitPrice: 6600,
        quantity: 1,
        taxRate: 10,
        lineTotalJpy: 7260,
      },
      {
        id: 'item-203',
        details: 'THC',
        description: 'TERMINAL HANDLING CHARGE (THC)',
        currency: 'JPY',
        unitPrice: 35000,
        quantity: 1,
        taxRate: 10,
        lineTotalJpy: 38500,
      },
    ],
    subTotalJpy: 421835,
    discountJpy: 0,
    remarks: 'COMMODITY: USED MOTOR VEHICLE (ZVW50)',
    grandTotalJpy: 421835,
    amountReceivedJpy: 200000,
    outstandingBalanceJpy: 221835,
    lastPaymentDate: '2026-11-01',
    paymentHistory: [
      {
        id: 'pay-init-2',
        date: '2026-11-01',
        amountJpy: 200000,
        method: 'Bank Transfer (SMBC)',
        reference: 'RM-20261101-88',
        notes: 'Partial advance payment received',
      },
    ],
    linkedBookingId: 'bkg-1',
    linkedQuotationId: 'quo-1',
    quotationNo: 'QT-2026-0101',
    createdAt: '2026-10-15T09:00:00Z',
    updatedAt: '2026-11-01T09:00:00Z',
  },
];

// Initial Quotations (linked to Bookings & Invoices)
export const INITIAL_QUOTATIONS: Quotation[] = [
  {
    id: 'quo-1',
    quotationNo: 'QT-2026-0101',
    date: '2026-10-13',
    validUntil: '2026-10-30',
    status: 'CONVERTED',
    quotationMethod: 'CONFIRMED_BOOKING',
    linkedBookingId: 'bkg-1',
    bookingNo: 'TYO0799646',
    shipmentNo: 'SHP-2026-0101',
    blNo: 'CMA-NGO-788912',
    customerId: 'cust-1',
    customerName: 'HBI CO., LTD',
    customerAddress: '4-12-10 Sakae, Naka-ku, Nagoya-shi, Aichi 460-0008, Japan',
    customerEmail: 'operations@hbi-japan.com',
    portFrom: 'NAGOYA',
    portTo: 'DUBLIN',
    shippingCompany: 'CMA-CGM',
    vesselVoyage: 'CMA CGM ELBE 0R11MW1MA',
    etd: '2026-10-23',
    eta: '2026-12-14',
    shipmentMode: "1 X 40' Dry High",
    freightTerm: 'PREPAID',
    exchangeRate: 153.5,
    containerCount: 1,
    containerSize: "40' HC",
    sellingItems: [
      {
        id: 'qsi-1',
        details: 'Freight',
        description: "OCEAN FREIGHT TO DUBLIN - $ 2,450 X 1 CONT.",
        currency: 'USD',
        unitPrice: 2450,
        quantity: 1,
        taxRate: 0,
        lineTotalJpy: 376075,
      },
      {
        id: 'qsi-2',
        details: 'Doc Fee',
        description: 'DOCUMENTATION FEE',
        currency: 'JPY',
        unitPrice: 6600,
        quantity: 1,
        taxRate: 10,
        lineTotalJpy: 7260,
      },
      {
        id: 'qsi-3',
        details: 'THC',
        description: 'TERMINAL HANDLING CHARGE (THC)',
        currency: 'JPY',
        unitPrice: 35000,
        quantity: 1,
        taxRate: 10,
        lineTotalJpy: 38500,
      },
    ],
    totalSellingJpy: 421835,
    costItems: [
      {
        id: 'qci-1',
        category: 'Shipping Line Ocean Freight',
        description: 'CMA-CGM Ocean Freight Buy Rate',
        supplierName: 'CMA-CGM',
        currency: 'USD',
        unitCost: 2100,
        quantity: 1,
        taxRate: 0,
        lineCostJpy: 322350,
      },
      {
        id: 'qci-2',
        category: 'THC & Port Charges',
        description: 'Nagoya Port THC & Seal Cost',
        supplierName: 'CMA-CGM',
        currency: 'JPY',
        unitCost: 31000,
        quantity: 1,
        taxRate: 10,
        lineCostJpy: 34100,
      },
      {
        id: 'qci-3',
        category: 'Customs / Doc Handling',
        description: 'Export B/L & ACL Filing Cost',
        supplierName: 'Port Broker',
        currency: 'JPY',
        unitCost: 4200,
        quantity: 1,
        taxRate: 10,
        lineCostJpy: 4620,
      },
    ],
    totalCostJpy: 361070,
    netProfitLossJpy: 60765,
    profitMarginPct: 14.4,
    linkedCostingId: 'cst-1',
    linkedCostingNo: 'CST-2026-0101',
    linkedInvoiceId: 'inv-2',
    linkedInvoiceNo: 'YTL-FI-133988',
    statusHistory: [
      { id: 'qh-1', status: 'DRAFT', date: '2026-10-13', note: 'Quotation drafted' },
      { id: 'qh-2', status: 'ACCEPTED', date: '2026-10-14', note: 'Confirmed by HBI CO., LTD' },
      { id: 'qh-3', status: 'CONVERTED', date: '2026-10-15', note: 'Converted to Invoice YTL-FI-133988' },
    ],
    remarks: 'COMMODITY: USED MOTOR VEHICLE (ZVW50)',
    termsList: [...DEFAULT_QUOTATION_TERMS],
    termsAndConditions: formatTermsListToText(DEFAULT_QUOTATION_TERMS),
    createdAt: '2026-10-13T09:00:00Z',
    updatedAt: '2026-10-15T09:00:00Z',
  },
  {
    id: 'quo-2',
    quotationNo: 'QT-2026-0088',
    date: '2026-08-24',
    validUntil: '2026-09-10',
    status: 'CONVERTED',
    quotationMethod: 'CONFIRMED_BOOKING',
    linkedBookingId: 'bkg-2',
    bookingNo: '120BK6009764',
    shipmentNo: 'SHP-2026-0088',
    blNo: '120610087601',
    customerId: 'cust-1',
    customerName: 'HBI CO., LTD',
    customerAddress: 'YATOMI-SHI, TOKAI, AICHI, JAPAN',
    customerEmail: 'operations@hbi-japan.com',
    portFrom: 'NAGOYA',
    portTo: 'KARACHI',
    shippingCompany: 'TS LINES',
    vesselVoyage: 'OKEE AURELIA 167W',
    etd: '2026-08-30',
    eta: '2026-09-20',
    shipmentMode: "1 X 40' High Cube",
    freightTerm: 'PREPAID',
    exchangeRate: 162.22,
    containerCount: 1,
    containerSize: "40' HC",
    sellingItems: [
      {
        id: 'q2si-1',
        details: 'Freight',
        description: 'FREIGHT - $ 1830 X 1 CONT. TAX FREE',
        currency: 'USD',
        unitPrice: 1830,
        quantity: 1,
        taxRate: 0,
        lineTotalJpy: 296863,
      },
      {
        id: 'q2si-2',
        details: 'Doc Fee',
        description: 'DOC FEE - 6100 YEN X 1 B/L',
        currency: 'JPY',
        unitPrice: 6100,
        quantity: 1,
        taxRate: 0,
        lineTotalJpy: 6100,
      },
      {
        id: 'q2si-3',
        details: 'THC',
        description: 'SEAL FEE - 2800 YEN X 1 CONT.',
        currency: 'JPY',
        unitPrice: 2800,
        quantity: 1,
        taxRate: 0,
        lineTotalJpy: 2800,
      },
    ],
    totalSellingJpy: 305763,
    costItems: [
      {
        id: 'q2ci-1',
        category: 'Shipping Line Ocean Freight',
        description: 'TS LINES Slot Cost',
        supplierName: 'TS LINES',
        currency: 'USD',
        unitCost: 1580,
        quantity: 1,
        taxRate: 0,
        lineCostJpy: 256308,
      },
      {
        id: 'q2ci-2',
        category: 'Doc & Seal Fee',
        description: 'B/L & Container Seal Cost',
        supplierName: 'TS LINES',
        currency: 'JPY',
        unitCost: 6500,
        quantity: 1,
        taxRate: 0,
        lineCostJpy: 6500,
      },
    ],
    totalCostJpy: 262808,
    netProfitLossJpy: 42955,
    profitMarginPct: 14.0,
    linkedCostingId: 'cst-2',
    linkedCostingNo: 'CST-2026-0088',
    linkedInvoiceId: 'inv-1',
    linkedInvoiceNo: 'YTL-FI-133916',
    statusHistory: [
      { id: 'q2h-1', status: 'ACCEPTED', date: '2026-08-25', note: 'Approved by HBI CO., LTD' },
      { id: 'q2h-2', status: 'CONVERTED', date: '2026-08-31', note: 'Converted to Invoice YTL-FI-133916' },
    ],
    remarks: 'SHIPPER - CARCADE INTERNATIONAL LTD.',
    termsList: [...DEFAULT_QUOTATION_TERMS],
    termsAndConditions: formatTermsListToText(DEFAULT_QUOTATION_TERMS),
    createdAt: '2026-08-24T08:00:00Z',
    updatedAt: '2026-08-31T05:00:00Z',
  },
  {
    id: 'quo-3',
    quotationNo: 'QT-2026-0115',
    date: '2026-10-18',
    validUntil: '2026-11-25',
    status: 'SENT',
    linkedBookingId: 'bkg-3',
    bookingNo: 'ONE-YOK-99210',
    shipmentNo: 'SHP-2026-0115',
    blNo: 'ONEY-YOK-992104',
    customerId: 'cust-2',
    customerName: 'AL-ZAHRA AUTO TRADING LLC',
    customerAddress: 'Warehouse No. 14, Ras Al Khor Industrial Area 2, Dubai, UAE',
    customerEmail: 'import@alzahraauto.ae',
    portFrom: 'YOKOHAMA',
    portTo: 'JEBEL ALI',
    shippingCompany: 'OCEAN NETWORK EXPRESS (ONE)',
    vesselVoyage: 'ONE HUMBER 024E',
    etd: '2026-11-02',
    eta: '2026-11-24',
    shipmentMode: "2 X 40' High Cube",
    freightTerm: 'PREPAID',
    exchangeRate: 154.0,
    containerCount: 2,
    containerSize: "40' HC",
    sellingItems: [
      {
        id: 'q3si-1',
        details: 'Freight',
        description: "OCEAN FREIGHT YOKOHAMA -> JEBEL ALI - $ 1,950 X 2 CONT.",
        currency: 'USD',
        unitPrice: 1950,
        quantity: 2,
        taxRate: 0,
        lineTotalJpy: 600600,
      },
      {
        id: 'q3si-2',
        details: 'THC',
        description: 'TERMINAL HANDLING & VANNING PREP - 2 CONT.',
        currency: 'JPY',
        unitPrice: 36000,
        quantity: 2,
        taxRate: 10,
        lineTotalJpy: 79200,
      },
    ],
    totalSellingJpy: 679800,
    costItems: [
      {
        id: 'q3ci-1',
        category: 'Shipping Line Ocean Freight',
        description: 'ONE Carrier Buy Rate ($1,700 x 2)',
        supplierName: 'OCEAN NETWORK EXPRESS (ONE)',
        currency: 'USD',
        unitCost: 1700,
        quantity: 2,
        taxRate: 0,
        lineCostJpy: 523600,
      },
      {
        id: 'q3ci-2',
        category: 'THC & Port Charges',
        description: 'Yokohama Terminal Cost (2 Cont.)',
        supplierName: 'OCEAN NETWORK EXPRESS (ONE)',
        currency: 'JPY',
        unitCost: 32000,
        quantity: 2,
        taxRate: 10,
        lineCostJpy: 70400,
      },
    ],
    totalCostJpy: 594000,
    netProfitLossJpy: 85800,
    profitMarginPct: 12.6,
    statusHistory: [
      { id: 'q3h-1', status: 'DRAFT', date: '2026-10-18', note: 'Initial quote created' },
      { id: 'q3h-2', status: 'SENT', date: '2026-10-19', note: 'Sent to AL-ZAHRA AUTO TRADING LLC' },
    ],
    linkedCostingId: 'cst-3',
    linkedCostingNo: 'CST-2026-0115',
    remarks: 'SPECIAL DECK STOWAGE FOR LAND CRUISERS',
    termsList: [...DEFAULT_QUOTATION_TERMS],
    termsAndConditions: formatTermsListToText(DEFAULT_QUOTATION_TERMS),
    createdAt: '2026-10-18T10:15:00Z',
    updatedAt: '2026-10-19T10:15:00Z',
  },
  {
    id: 'quo-4',
    quotationNo: 'QT-2026-0140',
    date: '2026-11-10',
    validUntil: '2026-11-30',
    status: 'SENT',
    quotationMethod: 'REFERENCE',
    bookingNo: '',
    shipmentNo: '',
    blNo: '',
    customerId: 'cust-1',
    customerName: 'HBI CO., LTD',
    customerAddress: '4-12-10 Sakae, Naka-ku, Nagoya-shi, Aichi 460-0008, Japan',
    customerEmail: 'operations@hbi-japan.com',
    portFrom: 'YOKOHAMA',
    portTo: 'DAR ES SALAAM',
    shippingCompany: 'MSC',
    vesselVoyage: 'TBA (Spot Schedule)',
    etd: '',
    eta: '',
    shipmentMode: "2 X 40' HC",
    freightTerm: 'PREPAID',
    exchangeRate: 155.0,
    containerCount: 2,
    containerSize: "40' HC",
    sellingItems: [
      {
        id: 'q4si-1',
        details: 'Freight',
        description: "OCEAN FREIGHT YOKOHAMA -> DAR ES SALAAM (40' HC)",
        currency: 'USD',
        unitPrice: 2850,
        quantity: 2,
        taxRate: 0,
        lineTotalJpy: 883500,
      },
      {
        id: 'q4si-2',
        details: 'Doc Fee',
        description: 'B/L DOCUMENTATION FEE',
        currency: 'JPY',
        unitPrice: 6600,
        quantity: 1,
        taxRate: 10,
        lineTotalJpy: 7260,
      },
    ],
    totalSellingJpy: 890760,
    costItems: [],
    totalCostJpy: 0,
    netProfitLossJpy: 0,
    profitMarginPct: 0,
    statusHistory: [
      { id: 'q4h-1', status: 'DRAFT', date: '2026-11-10', note: 'Reference quotation drafted (No Booking No)' },
      { id: 'q4h-2', status: 'SENT', date: '2026-11-10', note: 'Sent to customer for rate approval' },
    ],
    remarks: 'Spot rate quotation awaiting customer confirmation.',
    termsList: [...DEFAULT_QUOTATION_TERMS],
    termsAndConditions: formatTermsListToText(DEFAULT_QUOTATION_TERMS),
    createdAt: '2026-11-10T09:00:00Z',
    updatedAt: '2026-11-10T09:00:00Z',
  },
  {
    id: 'quo-5',
    quotationNo: 'QT-2026-0132',
    date: '2026-11-02',
    validUntil: '2026-11-12',
    status: 'REJECTED',
    quotationMethod: 'REFERENCE',
    bookingNo: '',
    shipmentNo: '',
    blNo: '',
    customerId: 'cust-2',
    customerName: 'AL-ZAHRA AUTO TRADING LLC',
    customerAddress: 'Warehouse No. 14, Ras Al Khor Industrial Area 2, Dubai, UAE',
    customerEmail: 'import@alzahraauto.ae',
    portFrom: 'KOBE',
    portTo: 'MOMBASA',
    shippingCompany: 'MAERSK',
    vesselVoyage: 'TBA',
    etd: '',
    eta: '',
    shipmentMode: "1 X 40' HC",
    freightTerm: 'PREPAID',
    exchangeRate: 155.0,
    containerCount: 1,
    containerSize: "40' HC",
    sellingItems: [
      {
        id: 'q5si-1',
        details: 'Freight',
        description: "OCEAN FREIGHT KOBE -> MOMBASA (40' HC)",
        currency: 'USD',
        unitPrice: 3100,
        quantity: 1,
        taxRate: 0,
        lineTotalJpy: 480500,
      },
    ],
    totalSellingJpy: 480500,
    costItems: [],
    totalCostJpy: 0,
    netProfitLossJpy: 0,
    profitMarginPct: 0,
    statusHistory: [
      { id: 'q5h-1', status: 'SENT', date: '2026-11-02', note: 'Quoted spot rate' },
      { id: 'q5h-2', status: 'REJECTED', date: '2026-11-05', note: 'Customer used another carrier (Not counted in P&L)' },
    ],
    remarks: 'Reference quote declined by customer.',
    termsList: [...DEFAULT_QUOTATION_TERMS],
    termsAndConditions: formatTermsListToText(DEFAULT_QUOTATION_TERMS),
    createdAt: '2026-11-02T09:00:00Z',
    updatedAt: '2026-11-05T09:00:00Z',
  },
];

// Initial Confirmed Shipment Costing Records (Linked strictly to Confirmed Bookings + Quotations)
export const INITIAL_COSTINGS: ShipmentCosting[] = [
  {
    id: 'cst-1',
    costingNo: 'CST-2026-0101',
    date: '2026-10-15',
    linkedQuotationId: 'quo-1',
    quotationNo: 'QT-2026-0101',
    linkedBookingId: 'bkg-1',
    bookingNo: 'TYO0799646',
    shipmentNo: 'SHP-2026-0101',
    blNo: 'CMA-NGO-788912',
    customerId: 'cust-1',
    customerName: 'HBI CO., LTD',
    customerAddress: '4-12-10 Sakae, Naka-ku, Nagoya-shi, Aichi 460-0008, Japan',
    portFrom: 'NAGOYA',
    portTo: 'DUBLIN',
    shippingCompany: 'CMA-CGM',
    vesselVoyage: 'CMA CGM ELBE 0R11MW1MA',
    etd: '2026-10-23',
    eta: '2026-12-14',
    shipmentMode: "1 X 40' Dry High",
    freightTerm: 'PREPAID',
    exchangeRate: 153.5,
    containerCount: 1,
    containerSize: "40' HC",
    sellingItems: [
      {
        id: 'c1si-1',
        details: 'Freight',
        description: "OCEAN FREIGHT TO DUBLIN - $ 2,450 X 1 CONT.",
        currency: 'USD',
        unitPrice: 2450,
        quantity: 1,
        taxRate: 0,
        lineTotalJpy: 376075,
      },
      {
        id: 'c1si-2',
        details: 'Doc Fee',
        description: 'DOCUMENTATION FEE',
        currency: 'JPY',
        unitPrice: 6600,
        quantity: 1,
        taxRate: 10,
        lineTotalJpy: 7260,
      },
      {
        id: 'c1si-3',
        details: 'THC',
        description: 'TERMINAL HANDLING CHARGE (THC)',
        currency: 'JPY',
        unitPrice: 35000,
        quantity: 1,
        taxRate: 10,
        lineTotalJpy: 38500,
      },
    ],
    totalSellingJpy: 421835,
    costItems: [
      {
        id: 'c1ci-1',
        category: 'Shipping Line Ocean Freight',
        description: 'CMA-CGM Ocean Freight Buy Rate',
        supplierName: 'CMA-CGM',
        currency: 'USD',
        unitCost: 2100,
        quantity: 1,
        taxRate: 0,
        lineCostJpy: 322350,
      },
      {
        id: 'c1ci-2',
        category: 'THC & Port Charges',
        description: 'Nagoya Port THC & Seal Cost',
        supplierName: 'CMA-CGM',
        currency: 'JPY',
        unitCost: 31000,
        quantity: 1,
        taxRate: 10,
        lineCostJpy: 34100,
      },
      {
        id: 'c1ci-3',
        category: 'Customs / Doc Handling',
        description: 'Export B/L & ACL Filing Cost',
        supplierName: 'Port Broker',
        currency: 'JPY',
        unitCost: 4200,
        quantity: 1,
        taxRate: 10,
        lineCostJpy: 4620,
      },
    ],
    totalCostJpy: 361070,
    netProfitLossJpy: 60765,
    profitMarginPct: 14.4,
    linkedInvoiceId: 'inv-2',
    linkedInvoiceNo: 'YTL-FI-133988',
    remarks: 'Confirmed booking costing reconciled against CMA-CGM carrier invoice.',
    createdAt: '2026-10-15T09:00:00Z',
    updatedAt: '2026-10-15T09:00:00Z',
  },
  {
    id: 'cst-2',
    costingNo: 'CST-2026-0088',
    date: '2026-08-31',
    linkedQuotationId: 'quo-2',
    quotationNo: 'QT-2026-0088',
    linkedBookingId: 'bkg-2',
    bookingNo: '120BK6009764',
    shipmentNo: 'SHP-2026-0088',
    blNo: '120610087601',
    customerId: 'cust-1',
    customerName: 'HBI CO., LTD',
    customerAddress: 'YATOMI-SHI, TOKAI, AICHI, JAPAN',
    portFrom: 'NAGOYA',
    portTo: 'KARACHI',
    shippingCompany: 'TS LINES',
    vesselVoyage: 'OKEE AURELIA 167W',
    etd: '2026-08-30',
    eta: '2026-09-20',
    shipmentMode: "1 X 40' High Cube",
    freightTerm: 'PREPAID',
    exchangeRate: 162.22,
    containerCount: 1,
    containerSize: "40' HC",
    sellingItems: [
      {
        id: 'c2si-1',
        details: 'Freight',
        description: 'FREIGHT - $ 1830 X 1 CONT. TAX FREE',
        currency: 'USD',
        unitPrice: 1830,
        quantity: 1,
        taxRate: 0,
        lineTotalJpy: 296863,
      },
      {
        id: 'c2si-2',
        details: 'Doc Fee',
        description: 'DOC FEE - 6100 YEN X 1 B/L',
        currency: 'JPY',
        unitPrice: 6100,
        quantity: 1,
        taxRate: 0,
        lineTotalJpy: 6100,
      },
      {
        id: 'c2si-3',
        details: 'THC',
        description: 'SEAL FEE - 2800 YEN X 1 CONT.',
        currency: 'JPY',
        unitPrice: 2800,
        quantity: 1,
        taxRate: 0,
        lineTotalJpy: 2800,
      },
    ],
    totalSellingJpy: 305763,
    costItems: [
      {
        id: 'c2ci-1',
        category: 'Shipping Line Ocean Freight',
        description: 'TS LINES Slot Cost',
        supplierName: 'TS LINES',
        currency: 'USD',
        unitCost: 1580,
        quantity: 1,
        taxRate: 0,
        lineCostJpy: 256308,
      },
      {
        id: 'c2ci-2',
        category: 'Customs / Doc Handling',
        description: 'B/L & Container Seal Cost',
        supplierName: 'TS LINES',
        currency: 'JPY',
        unitCost: 6500,
        quantity: 1,
        taxRate: 0,
        lineCostJpy: 6500,
      },
    ],
    totalCostJpy: 262808,
    netProfitLossJpy: 42955,
    profitMarginPct: 14.0,
    linkedInvoiceId: 'inv-1',
    linkedInvoiceNo: 'YTL-FI-133916',
    remarks: 'Completed shipment costing.',
    createdAt: '2026-08-31T05:00:00Z',
    updatedAt: '2026-08-31T05:00:00Z',
  },
  {
    id: 'cst-3',
    costingNo: 'CST-2026-0115',
    date: '2026-10-22',
    linkedQuotationId: 'quo-3',
    quotationNo: 'QT-2026-0115',
    linkedBookingId: 'bkg-3',
    bookingNo: 'ONE-YOK-99210',
    shipmentNo: 'SHP-2026-0115',
    blNo: 'ONEY-YOK-992104',
    customerId: 'cust-2',
    customerName: 'AL-ZAHRA AUTO TRADING LLC',
    customerAddress: 'Warehouse No. 14, Ras Al Khor Industrial Area 2, Dubai, UAE',
    portFrom: 'YOKOHAMA',
    portTo: 'JEBEL ALI',
    shippingCompany: 'OCEAN NETWORK EXPRESS (ONE)',
    vesselVoyage: 'ONE HUMBER 024E',
    etd: '2026-11-02',
    eta: '2026-11-24',
    shipmentMode: "2 X 40' High Cube",
    freightTerm: 'PREPAID',
    exchangeRate: 154.0,
    containerCount: 2,
    containerSize: "40' HC",
    sellingItems: [
      {
        id: 'c3si-1',
        details: 'Freight',
        description: "OCEAN FREIGHT YOKOHAMA -> JEBEL ALI - $ 1,950 X 2 CONT.",
        currency: 'USD',
        unitPrice: 1950,
        quantity: 2,
        taxRate: 0,
        lineTotalJpy: 600600,
      },
      {
        id: 'c3si-2',
        details: 'THC',
        description: 'TERMINAL HANDLING & VANNING PREP - 2 CONT.',
        currency: 'JPY',
        unitPrice: 36000,
        quantity: 2,
        taxRate: 10,
        lineTotalJpy: 79200,
      },
    ],
    totalSellingJpy: 679800,
    costItems: [
      {
        id: 'c3ci-1',
        category: 'Shipping Line Ocean Freight',
        description: 'ONE Carrier Buy Rate ($1,700 x 2)',
        supplierName: 'OCEAN NETWORK EXPRESS (ONE)',
        currency: 'USD',
        unitCost: 1700,
        quantity: 2,
        taxRate: 0,
        lineCostJpy: 523600,
      },
      {
        id: 'c3ci-2',
        category: 'THC & Port Charges',
        description: 'Yokohama Terminal Cost (2 Cont.)',
        supplierName: 'OCEAN NETWORK EXPRESS (ONE)',
        currency: 'JPY',
        unitCost: 32000,
        quantity: 2,
        taxRate: 10,
        lineCostJpy: 70400,
      },
    ],
    totalCostJpy: 594000,
    netProfitLossJpy: 85800,
    profitMarginPct: 12.6,
    remarks: 'Confirmed booking costing for Land Cruisers.',
    createdAt: '2026-10-22T10:15:00Z',
    updatedAt: '2026-10-22T10:15:00Z',
  },
];

// Initial Shipping Line Payments
export const INITIAL_SHIPPING_LINE_PAYMENTS: ShippingLinePayment[] = [
  {
    id: 'slp-1',
    paymentRefNo: 'SLP-2026-0101',
    shippingLineName: 'CMA-CGM',
    bookingNo: 'TYO0799646',
    shipmentNo: 'SHP-2026-0101',
    blNo: 'CMA-NGO-788912',
    customerName: 'HBI CO., LTD',
    linkedBookingId: 'bkg-1',
    linkedQuotationId: 'quo-1',
    linkedInvoiceId: 'inv-2',
    containerCount: 1,
    containerSize: "40' HC",
    containerDetails: "1 X 40' Dry High (USED VEHICLE)",
    vesselVoyage: 'CMA CGM ELBE 0R11MW1MA',
    portFrom: 'NAGOYA',
    portTo: 'DUBLIN',
    payableAmountJpy: 356450,
    amountPaidJpy: 150000,
    outstandingAmountJpy: 206450,
    paymentDeadline: '2026-11-12',
    paymentDate: '2026-11-02',
    status: 'OVERDUE',
    paymentHistory: [
      {
        id: 'slh-1',
        date: '2026-11-02',
        amountJpy: 150000,
        method: 'Bank Wire',
        reference: 'CMA-ADV-1102',
        notes: 'Initial deposit paid to CMA-CGM Japan',
      },
    ],
    remarks: 'Balance required urgently before B/L surrender release.',
    createdAt: '2026-10-20T09:00:00Z',
    updatedAt: '2026-11-02T09:00:00Z',
  },
  {
    id: 'slp-2',
    paymentRefNo: 'SLP-2026-0088',
    shippingLineName: 'TS LINES',
    bookingNo: '120BK6009764',
    shipmentNo: 'SHP-2026-0088',
    blNo: '120610087601',
    customerName: 'HBI CO., LTD',
    linkedBookingId: 'bkg-2',
    linkedQuotationId: 'quo-2',
    linkedInvoiceId: 'inv-1',
    containerCount: 1,
    containerSize: "40' HC",
    containerDetails: "1 X 40' High Cube (USED MOTOR VEHICLES)",
    vesselVoyage: 'OKEE AURELIA 167W',
    portFrom: 'NAGOYA',
    portTo: 'KARACHI',
    payableAmountJpy: 262808,
    amountPaidJpy: 262808,
    outstandingAmountJpy: 0,
    paymentDeadline: '2026-09-15',
    paymentDate: '2026-09-12',
    status: 'PAID',
    paymentHistory: [
      {
        id: 'slh-2',
        date: '2026-09-12',
        amountJpy: 262808,
        method: 'SMBC Domestic Transfer',
        reference: 'TSL-0912-88',
        notes: 'Full carrier freight settled on time',
      },
    ],
    remarks: 'Original B/L released.',
    createdAt: '2026-08-30T10:00:00Z',
    updatedAt: '2026-09-12T14:00:00Z',
  },
  {
    id: 'slp-3',
    paymentRefNo: 'SLP-2026-0115',
    shippingLineName: 'OCEAN NETWORK EXPRESS (ONE)',
    bookingNo: 'ONE-YOK-99210',
    shipmentNo: 'SHP-2026-0115',
    blNo: 'ONEY-YOK-992104',
    customerName: 'AL-ZAHRA AUTO TRADING LLC',
    linkedBookingId: 'bkg-3',
    linkedQuotationId: 'quo-3',
    containerCount: 2,
    containerSize: "40' HC",
    containerDetails: "2 X 40' High Cube (LAND CRUISERS)",
    vesselVoyage: 'ONE HUMBER 024E',
    portFrom: 'YOKOHAMA',
    portTo: 'JEBEL ALI',
    payableAmountJpy: 594000,
    amountPaidJpy: 0,
    outstandingAmountJpy: 594000,
    paymentDeadline: '2026-11-17',
    paymentDate: '',
    status: 'PENDING',
    paymentHistory: [],
    remarks: 'Payable before ETD B/L release cutoff.',
    createdAt: '2026-10-25T10:00:00Z',
    updatedAt: '2026-10-25T10:00:00Z',
  },
];

export const INITIAL_USERS: AppUser[] = [
  {
    id: 'usr-admin',
    userId: 'admin',
    name: 'Muhammad Fareed (Super Admin)',
    password: 'admin123',
    role: 'ADMIN',
    department: 'Executive Management',
    status: 'ACTIVE',
    createdAt: '2026-10-01T00:00:00Z',
  },
  {
    id: 'usr-staff1',
    userId: 'staff1',
    name: 'Nagoya Shipping Staff',
    password: 'staff123',
    role: 'STAFF',
    department: 'Documentation & Customs',
    status: 'ACTIVE',
    createdAt: '2026-10-10T00:00:00Z',
  },
];

// Dedicated KYC Records Initial Data
export const INITIAL_KYC_RECORDS: KycRecord[] = [
  {
    id: 'kyc-1',
    kycNumber: 'KYC-2026-001',
    customerCompany: 'HBI CO., LTD',
    shipper: {
      name: 'YOKOHAMA TRADING & LOGISTICS CO., LTD.',
      addressLine1: '2833-165 SAKASAI, BANDO-SHI',
      addressLine2: 'IBARAKI-KEN 306-0501, JAPAN',
      tel: '+81-280-33-3423',
      fax: '+81-280-33-6367',
      email: 'logistics@ytandl.co.jp',
      taxId: 'T9120001213448',
      remark: 'OFFICIAL VEHICLE EXPORT LICENSE HOLDER (VERIFIED)',
    },
    consignee: {
      name: 'ROYAL DUBLIN MOTORS IRELAND LTD',
      addressLine1: 'UNIT 4, CLONDALKIN INDUSTRIAL ESTATE',
      addressLine2: 'DUBLIN 22, D22 X2N4, IRELAND',
      tel: '+353-1-457-8900',
      fax: '+353-1-457-8901',
      email: 'customs@royaldublinmotors.ie',
      taxId: 'IE9845120M',
      remark: 'EORI REGISTERED & REGULAR COMMERCE IMPORTER',
    },
    notifyParty: {
      name: 'CELTIC FREIGHT FORWARDING & LOGISTICS LTD',
      addressLine1: 'TERMINAL ROAD SOUTH, DUBLIN PORT',
      addressLine2: 'DUBLIN 1, D01 K8F2, IRELAND',
      tel: '+353-1-855-4300',
      fax: '+353-1-855-4301',
      email: 'clearance@celticfreight.ie',
      taxId: 'IE3391820B',
      remark: 'AUTHORIZED DISCHARGE PORT CUSTOMS CLEARANCE AGENT',
    },
    hasAlsoNotify: false,
    valueType: 'USD',
    incoterm: 'CIF',
    fpod: 'DUBLIN PORT BONDED COMPLEX, IRELAND',
    pod: 'DUBLIN',
    status: 'VERIFIED',
    documentDate: '2026-10-15',
    remarks: 'Verified against Japanese MLIT / customs export documentation.',
    createdAt: '2026-10-15T10:00:00Z',
    updatedAt: '2026-10-15T10:00:00Z',
  },
  {
    id: 'kyc-2',
    kycNumber: 'KYC-2026-002',
    customerCompany: 'GLOBAL MOTORS DUBAI FZE',
    shipper: {
      name: 'YOKOHAMA TRADING & LOGISTICS CO., LTD.',
      addressLine1: '2833-165 SAKASAI, BANDO-SHI',
      addressLine2: 'IBARAKI-KEN 306-0501, JAPAN',
      tel: '+81-280-33-3423',
      fax: '+81-280-33-6367',
      email: 'logistics@ytandl.co.jp',
      taxId: 'T9120001213448',
      remark: 'DIRECT SHIPPER & COMMERCIAL INVOICE ISSUER',
    },
    consignee: {
      name: 'AL-MANSOOR AUTOMOTIVE TRADING LLC',
      addressLine1: 'WAREHOUSE #14, AL AWEER AUTO MARKET',
      addressLine2: 'RAS AL KHOR INDUSTRIAL 3, DUBAI, UAE',
      tel: '+971-4-333-8822',
      fax: '+971-4-333-8823',
      email: 'import@almansoormotors.ae',
      taxId: 'TRN-100293847500003',
      remark: 'TAX REGISTRATION NUMBER VERIFIED IN UAE FTA PORTAL',
    },
    notifyParty: {
      name: 'EMIRATES NATIONAL CLEARING & FORWARDING EST.',
      addressLine1: 'PORT RASHID CARGO GATE 4, PO BOX 9201',
      addressLine2: 'BUR DUBAI, DUBAI, UAE',
      tel: '+971-4-393-5500',
      fax: '+971-4-393-5501',
      email: 'ops@emiratesclearing.ae',
      taxId: 'TRN-100384759200003',
      remark: 'PRIMARY NOTIFY PARTY / CARRIER RELEASE REPRESENTATIVE',
    },
    hasAlsoNotify: true,
    alsoNotifyParty: {
      name: 'GULF LOGISTICS ALLIANCE LTD',
      addressLine1: 'OFFICE 702, AL ITTIHAD ROAD, DEIRA',
      addressLine2: 'PO BOX 4410, DUBAI, UAE',
      tel: '+971-4-298-1100',
      fax: '+971-4-298-1101',
      email: 'secondary-notify@gulfalliance.ae',
      taxId: 'TRN-100492837100003',
      remark: 'SPECIAL SECONDARY NOTIFY FOR BONDED TRANSIT DEPOT',
    },
    valueType: 'JPY',
    incoterm: 'FOB',
    fpod: 'JEBEL ALI FREE ZONE (JAFZA), DUBAI',
    pod: 'JEBEL ALI',
    status: 'VERIFIED',
    documentDate: '2026-10-18',
    remarks: 'Secondary notify configured per bilateral agreement for bonded clearance.',
    createdAt: '2026-10-18T08:30:00Z',
    updatedAt: '2026-10-18T08:30:00Z',
  },
];

// Local Storage Keys
export const STORAGE_KEYS = {
  PROFILE: 'ytl_company_profile_v2',
  BOOKINGS: 'ytl_bookings_v2',
  INVOICES: 'ytl_invoices_v2',
  USERS: 'ytl_users_v2',
  CUSTOMERS: 'ytl_customers_v2',
  SHIPPERS: 'ytl_shippers_v2',
  CONSIGNEES: 'ytl_consignees_v2',
  NOTIFY_PARTIES: 'ytl_notify_parties_v2',
  STOCKS: 'ytl_stocks_v2',
  TRUCKING_SHEETS: 'ytl_trucking_sheets_v2',
  TRUCKING_COMPANIES: 'ytl_trucking_companies_v2',
  MASTERS: 'ytl_masters_v2',
  KYC: 'ytl_kyc_records_v2',
  QUOTATIONS: 'ytl_quotations_v2',
  COSTINGS: 'ytl_shipment_costings_v2',
  SHIPPING_LINE_PAYMENTS: 'ytl_shipping_line_payments_v2',
  SESSION: 'ytl_auth_session_v2',
};

// Generic safe getters & setters
export const getCompanyProfile = (): CompanyProfile => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) return DEFAULT_COMPANY_PROFILE;
    const parsed = JSON.parse(raw);
    if (!parsed.customLogoUrl || parsed.customLogoUrl === '/assets/aistudio/image_3ee25e69.png') {
      parsed.customLogoUrl = '/logo.png';
    }
    return parsed;
  } catch {
    return DEFAULT_COMPANY_PROFILE;
  }
};

export const saveCompanyProfile = (profile: CompanyProfile): void => {
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
};

export const getBookings = (): BookingConfirmation[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    return raw ? JSON.parse(raw) : INITIAL_BOOKINGS;
  } catch {
    return INITIAL_BOOKINGS;
  }
};

export const saveBookings = (bookings: BookingConfirmation[]): void => {
  localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
};

export const getInvoices = (): FreightInvoice[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INVOICES);
    return raw ? JSON.parse(raw) : INITIAL_INVOICES;
  } catch {
    return INITIAL_INVOICES;
  }
};

export const saveInvoices = (invoices: FreightInvoice[]): void => {
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
};

export const getCustomers = (): Customer[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return raw ? JSON.parse(raw) : INITIAL_CUSTOMERS;
  } catch {
    return INITIAL_CUSTOMERS;
  }
};

export const saveCustomers = (customers: Customer[]): void => {
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
};

export const getShippers = (): Shipper[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SHIPPERS);
    return raw ? JSON.parse(raw) : INITIAL_SHIPPERS;
  } catch {
    return INITIAL_SHIPPERS;
  }
};

export const saveShippers = (shippers: Shipper[]): void => {
  localStorage.setItem(STORAGE_KEYS.SHIPPERS, JSON.stringify(shippers));
};

export const getConsignees = (): Consignee[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONSIGNEES);
    return raw ? JSON.parse(raw) : INITIAL_CONSIGNEES;
  } catch {
    return INITIAL_CONSIGNEES;
  }
};

export const saveConsignees = (consignees: Consignee[]): void => {
  localStorage.setItem(STORAGE_KEYS.CONSIGNEES, JSON.stringify(consignees));
};

export const getNotifyParties = (): NotifyParty[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFY_PARTIES);
    return raw ? JSON.parse(raw) : INITIAL_NOTIFY_PARTIES;
  } catch {
    return INITIAL_NOTIFY_PARTIES;
  }
};

export const saveNotifyParties = (parties: NotifyParty[]): void => {
  localStorage.setItem(STORAGE_KEYS.NOTIFY_PARTIES, JSON.stringify(parties));
};

export const getStocks = (): StockItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STOCKS);
    return raw ? JSON.parse(raw) : INITIAL_STOCKS;
  } catch {
    return INITIAL_STOCKS;
  }
};

export const saveStocks = (stocks: StockItem[]): void => {
  localStorage.setItem(STORAGE_KEYS.STOCKS, JSON.stringify(stocks));
};

export const getTruckingSheets = (): TruckingSheet[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRUCKING_SHEETS);
    return raw ? JSON.parse(raw) : INITIAL_TRUCKING_SHEETS;
  } catch {
    return INITIAL_TRUCKING_SHEETS;
  }
};

export const saveTruckingSheets = (sheets: TruckingSheet[]): void => {
  localStorage.setItem(STORAGE_KEYS.TRUCKING_SHEETS, JSON.stringify(sheets));
};

export const getTruckingCompanies = (): TruckingCompany[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRUCKING_COMPANIES);
    return raw ? JSON.parse(raw) : INITIAL_TRUCKING_COMPANIES;
  } catch {
    return INITIAL_TRUCKING_COMPANIES;
  }
};

export const saveTruckingCompanies = (companies: TruckingCompany[]): void => {
  localStorage.setItem(STORAGE_KEYS.TRUCKING_COMPANIES, JSON.stringify(companies));
};

export const getMasters = (): MasterData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MASTERS);
    return raw ? JSON.parse(raw) : INITIAL_MASTERS;
  } catch {
    return INITIAL_MASTERS;
  }
};

export const saveMasters = (masters: MasterData): void => {
  localStorage.setItem(STORAGE_KEYS.MASTERS, JSON.stringify(masters));
};

export const getUsers = (): AppUser[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    return raw ? JSON.parse(raw) : INITIAL_USERS;
  } catch {
    return INITIAL_USERS;
  }
};

export const saveUsers = (users: AppUser[]): void => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const getCurrentSession = (): AuthSession => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!raw) return { currentUser: null, isAuthenticated: false };
    const session: AuthSession = JSON.parse(raw);
    if (session && session.isAuthenticated && session.currentUser) {
      if (session.expiresAt && Date.now() > session.expiresAt) {
        localStorage.removeItem(STORAGE_KEYS.SESSION);
        return { currentUser: null, isAuthenticated: false };
      }
      return session;
    }
    return { currentUser: null, isAuthenticated: false };
  } catch {
    return { currentUser: null, isAuthenticated: false };
  }
};

export const saveCurrentSession = (session: AuthSession): void => {
  const sessionWithExpiry: AuthSession = {
    ...session,
    loginTimestamp: session.loginTimestamp || Date.now(),
    expiresAt: session.expiresAt || Date.now() + 24 * 60 * 60 * 1000,
  };
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sessionWithExpiry));
};

export const clearCurrentSession = (): void => {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
};

export const getKycRecords = (): KycRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.KYC);
    return raw ? JSON.parse(raw) : INITIAL_KYC_RECORDS;
  } catch {
    return INITIAL_KYC_RECORDS;
  }
};

export const saveKycRecords = (records: KycRecord[]): void => {
  localStorage.setItem(STORAGE_KEYS.KYC, JSON.stringify(records));
};

export const getQuotations = (): Quotation[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUOTATIONS);
    return raw ? JSON.parse(raw) : INITIAL_QUOTATIONS;
  } catch {
    return INITIAL_QUOTATIONS;
  }
};

export const saveQuotations = (quotations: Quotation[]): void => {
  localStorage.setItem(STORAGE_KEYS.QUOTATIONS, JSON.stringify(quotations));
};

export const getCostings = (): ShipmentCosting[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COSTINGS);
    return raw ? JSON.parse(raw) : INITIAL_COSTINGS;
  } catch {
    return INITIAL_COSTINGS;
  }
};

export const saveCostings = (costings: ShipmentCosting[]): void => {
  localStorage.setItem(STORAGE_KEYS.COSTINGS, JSON.stringify(costings));
};

export const getShippingLinePayments = (): ShippingLinePayment[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SHIPPING_LINE_PAYMENTS);
    return raw ? JSON.parse(raw) : INITIAL_SHIPPING_LINE_PAYMENTS;
  } catch {
    return INITIAL_SHIPPING_LINE_PAYMENTS;
  }
};

export const saveShippingLinePayments = (payments: ShippingLinePayment[]): void => {
  localStorage.setItem(STORAGE_KEYS.SHIPPING_LINE_PAYMENTS, JSON.stringify(payments));
};

export const resetAllToDefault = (): void => {
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_COMPANY_PROFILE));
  localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(INITIAL_BOOKINGS));
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(INITIAL_INVOICES));
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
  localStorage.setItem(STORAGE_KEYS.SHIPPERS, JSON.stringify(INITIAL_SHIPPERS));
  localStorage.setItem(STORAGE_KEYS.CONSIGNEES, JSON.stringify(INITIAL_CONSIGNEES));
  localStorage.setItem(STORAGE_KEYS.NOTIFY_PARTIES, JSON.stringify(INITIAL_NOTIFY_PARTIES));
  localStorage.setItem(STORAGE_KEYS.STOCKS, JSON.stringify(INITIAL_STOCKS));
  localStorage.setItem(STORAGE_KEYS.TRUCKING_SHEETS, JSON.stringify(INITIAL_TRUCKING_SHEETS));
  localStorage.setItem(STORAGE_KEYS.TRUCKING_COMPANIES, JSON.stringify(INITIAL_TRUCKING_COMPANIES));
  localStorage.setItem(STORAGE_KEYS.MASTERS, JSON.stringify(INITIAL_MASTERS));
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  localStorage.setItem(STORAGE_KEYS.KYC, JSON.stringify(INITIAL_KYC_RECORDS));
  localStorage.setItem(STORAGE_KEYS.QUOTATIONS, JSON.stringify(INITIAL_QUOTATIONS));
  localStorage.setItem(STORAGE_KEYS.COSTINGS, JSON.stringify(INITIAL_COSTINGS));
  localStorage.setItem(
    STORAGE_KEYS.SHIPPING_LINE_PAYMENTS,
    JSON.stringify(INITIAL_SHIPPING_LINE_PAYMENTS)
  );
};
