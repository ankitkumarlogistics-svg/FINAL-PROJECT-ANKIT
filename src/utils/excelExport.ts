import * as XLSX from 'xlsx';
import {
  BookingConfirmation,
  FreightInvoice,
  KycRecord,
  Quotation,
  ShippingLinePayment,
} from '../types';
import {
  computeCustomerInvoiceFinance,
  computeShippingPaymentFinance,
  computeInvoiceProfitLoss,
  computeOverallProfitLossSummary,
} from './interconnection';

export const exportAllRecordsToExcel = (
  bookings: BookingConfirmation[],
  invoices: FreightInvoice[],
  quotations: Quotation[] = [],
  shippingPayments: ShippingLinePayment[] = []
): void => {
  const wb = XLSX.utils.book_new();

  // 1. Booking Confirmations Sheet
  const bookingsData = bookings.map((b) => ({
    'Booking Number': b.bookingNumber,
    'Shipment No': b.shipmentNo || '',
    'B/L No': b.blNo || '',
    'Status': b.status,
    'Date': b.date,
    'Customer Company': b.customerCompany,
    'Forwarder Company': b.forwarderCompany || '',
    'Shipper on B/L': b.shipperCompany,
    'Consignee on B/L': b.consigneeCompany,
    'Notify Party': b.notifyParty,
    'Shipping Line': b.shippingCompany,
    'Vessel': b.vessel,
    'Voyage': b.voyage,
    'CY Cut Open': b.cyCutOpen || b.cyOpenDate || '',
    'Doc CY Cut': b.docCyCut || '',
    'CY Cut Date (Cut-off)': b.cyCutDate,
    'ETD': b.etd,
    'ETA': b.eta,
    'Port of Receipt (POR)': b.por,
    'Port of Loading (POL)': b.pol,
    'Port of Discharge (POD)': b.pod,
    'Port of Delivery (PODY)': b.pody,
    'Cargo Volume & Size': b.cargoVolumeSize,
    'Commodity': b.commodity,
    'B/L Type': b.blType,
    'B/L Description': b.blDescription,
    'Freight Terms': b.freightTerm,
    'B/L Issue Place': b.blIssuePlace,
    'Remarks': b.remarks,
    'Special Instructions / Note': b.note,
    'Created At': b.createdAt,
  }));

  const wsBookings = XLSX.utils.json_to_sheet(bookingsData);
  wsBookings['!cols'] = [
    { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 22 }, { wch: 25 },
    { wch: 22 }, { wch: 22 }, { wch: 20 }, { wch: 18 }, { wch: 18 },
    { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 20 },
    { wch: 22 }, { wch: 16 }, { wch: 20 }, { wch: 16 }, { wch: 16 },
    { wch: 35 }, { wch: 40 }, { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsBookings, 'Booking Confirmations');

  // 2. Freight Quotations Sheet
  if (quotations.length > 0) {
    const quotesData = quotations.map((q) => ({
      'Quotation No': q.quotationNo,
      'Method': q.bookingNo ? 'Confirmed Booking' : 'Reference Quote Only',
      'Status': q.status,
      'Date': q.date,
      'Valid Until': q.validUntil,
      'Customer': q.customerName,
      'Booking No': q.bookingNo || '',
      'Shipment No': q.shipmentNo || '',
      'B/L No': q.blNo || '',
      'Shipping Line': q.shippingCompany,
      'Route': `${q.portFrom} -> ${q.portTo}`,
      'CY Open': q.cyOpenDate || '',
      'CY Cut': q.cyCutDate || '',
      'ETD': q.etd || '',
      'ETA': q.eta || '',
      'Containers': `${q.containerCount} x ${q.containerSize || "40' HC"}`,
      'Quoted Amount (JPY)': q.totalSellingJpy,
      'Linked Invoice': q.linkedInvoiceNo || '',
    }));
    const wsQuotes = XLSX.utils.json_to_sheet(quotesData);
    XLSX.utils.book_append_sheet(wb, wsQuotes, 'Freight Quotations');
  }

  // 2B. Internal Freight Invoice Selling, Actual Cost & Profit/Loss Sheet
  if (invoices.length > 0) {
    const plData = invoices.map((inv) => {
      const pl = computeInvoiceProfitLoss(inv, shippingPayments);
      return {
        'Invoice No': inv.invoiceNo,
        'Booking No': inv.bookingNo || '',
        'Shipment No': inv.shipmentNo || '',
        'B/L No': inv.blNo || '',
        'Date': inv.date,
        'Customer': inv.customerName,
        'Shipping Line': inv.shippingCompany,
        'Route': `${inv.portFrom} -> ${inv.portTo}`,
        'Selling Price (JPY)': pl.sellingJpy,
        'Actual Shipping Line Cost (JPY)': pl.actualCostJpy,
        'Net Profit / Loss (JPY)': pl.netProfitLossJpy,
        'Margin (%)': pl.marginPct,
        'Cost Source': pl.costSource,
      };
    });
    const wsPl = XLSX.utils.json_to_sheet(plData);
    XLSX.utils.book_append_sheet(wb, wsPl, 'Internal Invoice P&L');
  }

  // 3. Freight Invoices & Customer Payments Sheet
  const invoicesData = invoices.map((inv) => {
    const fin = computeCustomerInvoiceFinance(inv);
    return {
      'Invoice Number': inv.invoiceNo,
      'Payment Status': fin.displayStatus,
      'Invoice Date': inv.date,
      'Payment Due Date': inv.paymentDueDate,
      'Deadline Alert': fin.deadlineInfo.badgeLabel,
      'Customer (M/S)': inv.customerName,
      'Customer Address': inv.customerAddress,
      'Port From': inv.portFrom,
      'Port To': inv.portTo,
      'Shipping Company': inv.shippingCompany,
      'Vessel & Voyage': inv.vesselVoyage,
      'ETD': inv.etd,
      'ETA': inv.eta,
      'B/L No': inv.blNo,
      'Booking No': inv.bookingNo,
      'Shipment No': inv.shipmentNo || '',
      'Quotation No': inv.quotationNo || '',
      'Shipment Mode': inv.shipmentMode,
      'Containers Count': inv.containerCount,
      'Freight Term': inv.freightTerm,
      'Exchange Rate (USD/JPY)': inv.exchangeRate,
      'Sub Total (JPY)': inv.subTotalJpy,
      'Discount (JPY)': inv.discountJpy,
      'Grand Total (JPY)': inv.grandTotalJpy,
      'Amount Received (JPY)': fin.receivedJpy,
      'Outstanding Balance (JPY)': fin.outstandingJpy,
      'Remarks': inv.remarks,
      'Created At': inv.createdAt,
    };
  });

  const wsInvoices = XLSX.utils.json_to_sheet(invoicesData);
  wsInvoices['!cols'] = [
    { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 25 },
    { wch: 30 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 22 },
    { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 18 },
    { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 14 },
    { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 35 }, { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsInvoices, 'Freight Invoices');

  // 4. Shipping Line Payments Sheet
  if (shippingPayments.length > 0) {
    const slData = shippingPayments.map((p) => {
      const fin = computeShippingPaymentFinance(p);
      return {
        'Payment Ref': p.paymentRefNo,
        'Shipping Line': p.shippingLineName,
        'Booking No': p.bookingNo,
        'Shipment No': p.shipmentNo || '',
        'B/L No': p.blNo || '',
        'Customer': p.customerName || '',
        'Containers': p.containerDetails,
        'Payable Amount (JPY)': fin.payableJpy,
        'Amount Paid (JPY)': fin.paidJpy,
        'Outstanding (JPY)': fin.outstandingJpy,
        'Payment Deadline': p.paymentDeadline,
        'Deadline Alert': fin.deadlineInfo.badgeLabel,
        'Status': fin.displayStatus,
        'Last Payment Date': p.paymentDate || '',
      };
    });
    const wsSl = XLSX.utils.json_to_sheet(slData);
    XLSX.utils.book_append_sheet(wb, wsSl, 'Shipping Line Payments');
  }

  // 5. Itemized Invoice Items Sheet
  const itemsData: Array<{
    'Invoice Number': string;
    'Customer': string;
    'Item Type': string;
    'Description': string;
    'Currency': string;
    'Unit Price': number;
    'Quantity': number | string;
    'Tax Rate (%)': number;
    'Total JPY': number;
  }> = [];

  invoices.forEach((inv) => {
    inv.items.forEach((item) => {
      itemsData.push({
        'Invoice Number': inv.invoiceNo,
        'Customer': inv.customerName,
        'Item Type': item.details,
        'Description': item.description,
        'Currency': item.currency,
        'Unit Price': item.unitPrice,
        'Quantity': item.quantity ?? '',
        'Tax Rate (%)': item.taxRate,
        'Total JPY': item.lineTotalJpy,
      });
    });
  });

  const wsItems = XLSX.utils.json_to_sheet(itemsData);
  wsItems['!cols'] = [
    { wch: 18 }, { wch: 22 }, { wch: 16 }, { wch: 35 }, { wch: 10 },
    { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsItems, 'Invoice Line Items');

  // 6. Overall Financial Summary Sheet
  const pl = computeOverallProfitLossSummary(quotations, invoices, shippingPayments);

  const summaryData = [
    { Metric: 'Total Booking Records', Value: bookings.length },
    { Metric: 'Total Quotations', Value: quotations.length },
    { Metric: 'Total Invoice Records', Value: invoices.length },
    { Metric: 'Invoices With Actual Cost', Value: pl.costEnteredCount },
    { Metric: 'Total Selling Amount (JPY)', Value: `¥${pl.totalRevenueJpy.toLocaleString()}` },
    { Metric: 'Total Shipment Cost (JPY)', Value: `¥${pl.totalCostJpy.toLocaleString()}` },
    { Metric: 'Total Profit (JPY)', Value: `¥${pl.totalProfitJpy.toLocaleString()}` },
    { Metric: 'Total Loss (JPY)', Value: `¥${pl.totalLossJpy.toLocaleString()}` },
    { Metric: 'Overall Net Profit / Loss (JPY)', Value: `¥${pl.netProfitLossJpy.toLocaleString()}` },
    { Metric: 'Customer Collected (JPY)', Value: `¥${pl.collectedCustomerJpy.toLocaleString()}` },
    { Metric: 'Pending Customer Payments (JPY)', Value: `¥${pl.pendingCustomerJpy.toLocaleString()}` },
    { Metric: 'Shipping Line Paid (JPY)', Value: `¥${pl.paidShippingLineJpy.toLocaleString()}` },
    { Metric: 'Pending Shipping Line Payments (JPY)', Value: `¥${pl.pendingShippingLineJpy.toLocaleString()}` },
    { Metric: 'Report Generated At', Value: new Date().toLocaleString() },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 36 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary Overview');

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Freight_Logistics_Records_${dateStr}.xlsx`);
};

export const exportQuotationsToExcel = (quotations: Quotation[]): void => {
  const wb = XLSX.utils.book_new();
  const data = quotations.map((q) => ({
    'Quotation No': q.quotationNo,
    'Method': q.bookingNo ? 'Confirmed Booking' : 'Reference Quote Only',
    'Status': q.status,
    'Date': q.date,
    'Valid Until': q.validUntil,
    'Customer': q.customerName,
    'Booking No': q.bookingNo || '',
    'Shipment No': q.shipmentNo || '',
    'B/L No': q.blNo || '',
    'Shipping Line': q.shippingCompany,
    'Vessel & Voy': q.vesselVoyage,
    'Port From': q.portFrom,
    'Port To': q.portTo,
    'CY Open': q.cyOpenDate || '',
    'CY Cut': q.cyCutDate || '',
    'ETD': q.etd || '',
    'ETA': q.eta || '',
    'Containers': `${q.containerCount} x ${q.containerSize || "40' HC"}`,
    'Quoted Selling Price (JPY)': q.totalSellingJpy,
    'Linked Invoice No': q.linkedInvoiceNo || '',
    'Remarks': q.remarks,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Freight Quotations');
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Freight_Quotations_${dateStr}.xlsx`);
};

export const exportShippingLinePaymentsToExcel = (payments: ShippingLinePayment[]): void => {
  const wb = XLSX.utils.book_new();
  const data = payments.map((p) => {
    const fin = computeShippingPaymentFinance(p);
    return {
      'Payment Ref': p.paymentRefNo,
      'Shipping Line': p.shippingLineName,
      'Booking No': p.bookingNo,
      'Shipment No': p.shipmentNo || '',
      'B/L No': p.blNo || '',
      'Customer': p.customerName || '',
      'Container Details': p.containerDetails,
      'Payable Amount (JPY)': fin.payableJpy,
      'Amount Paid (JPY)': fin.paidJpy,
      'Outstanding Amount (JPY)': fin.outstandingJpy,
      'Payment Deadline': p.paymentDeadline,
      'Last Payment Date': p.paymentDate || '',
      'Deadline Alert': fin.deadlineInfo.badgeLabel,
      'Status': fin.displayStatus,
      'Remarks': p.remarks || '',
    };
  });
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Shipping Line Payments');
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Shipping_Line_Payments_${dateStr}.xlsx`);
};

export const exportBookingsToExcel = (bookings: BookingConfirmation[]): void => {
  const wb = XLSX.utils.book_new();
  const bookingsData = bookings.map((b) => ({
    'Booking Number': b.bookingNumber,
    'Shipment No': b.shipmentNo || '',
    'B/L No': b.blNo || '',
    'Status': b.status,
    'Date': b.date,
    'Customer Company': b.customerCompany,
    'Forwarder Company': b.forwarderCompany || '',
    'Shipper on B/L': b.shipperCompany,
    'Consignee on B/L': b.consigneeCompany,
    'Notify Party': b.notifyParty,
    'Shipping Line': b.shippingCompany,
    'Vessel': b.vessel,
    'Voyage': b.voyage,
    'CY Open Date': b.cyOpenDate,
    'CY Cut Date': b.cyCutDate,
    'ETD': b.etd,
    'ETA': b.eta,
    'Port of Receipt': b.por,
    'Port of Loading': b.pol,
    'Port of Discharge': b.pod,
    'Port of Delivery': b.pody,
    'Cargo Volume & Size': b.cargoVolumeSize,
    'Commodity': b.commodity,
    'B/L Type': b.blType,
    'B/L Description': b.blDescription,
    'Freight': b.freightTerm,
    'BL Issue Place': b.blIssuePlace,
    'Remarks': b.remarks,
    'Instructions': b.note,
  }));
  const ws = XLSX.utils.json_to_sheet(bookingsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Bookings');
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Bookings_${dateStr}.xlsx`);
};

export const exportInvoicesToExcel = (invoices: FreightInvoice[]): void => {
  const wb = XLSX.utils.book_new();
  const invoicesData = invoices.map((inv) => {
    const fin = computeCustomerInvoiceFinance(inv);
    return {
      'Invoice Number': inv.invoiceNo,
      'Status': fin.displayStatus,
      'Date': inv.date,
      'Due Date': inv.paymentDueDate,
      'Customer': inv.customerName,
      'Address': inv.customerAddress,
      'Port From': inv.portFrom,
      'Port To': inv.portTo,
      'Shipping Line': inv.shippingCompany,
      'Vessel & Voy': inv.vesselVoyage,
      'ETD': inv.etd,
      'ETA': inv.eta,
      'B/L No': inv.blNo,
      'Booking No': inv.bookingNo,
      'Shipment No': inv.shipmentNo || '',
      'Shipment Mode': inv.shipmentMode,
      'Containers': inv.containerCount,
      'Exchange Rate': inv.exchangeRate,
      'Grand Total (JPY)': inv.grandTotalJpy,
      'Amount Received (JPY)': fin.receivedJpy,
      'Outstanding Balance (JPY)': fin.outstandingJpy,
      'Remarks': inv.remarks,
    };
  });
  const ws = XLSX.utils.json_to_sheet(invoicesData);
  XLSX.utils.book_append_sheet(wb, ws, 'Invoices');
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Invoices_${dateStr}.xlsx`);
};

export const exportDedicatedKycRecordsToExcel = (kycRecords: KycRecord[]): void => {
  const wb = XLSX.utils.book_new();
  const kycData = kycRecords.map((k) => ({
    'KYC File No': k.kycNumber,
    'Status': k.status,
    'Date': k.documentDate,
    'Customer Company': k.customerCompany,
    // Value & Terms
    'Value Type (Currency)': k.valueType,
    'Incoterm': k.incoterm,
    'POD (Port of Discharge)': k.pod,
    'FPOD (Final Port of Discharge)': k.fpod,
    // Shipper
    'Shipper Name': k.shipper.name,
    'Shipper Address 1': k.shipper.addressLine1,
    'Shipper Address 2': k.shipper.addressLine2,
    'Shipper Tel': k.shipper.tel,
    'Shipper Fax': k.shipper.fax,
    'Shipper Mail ID': k.shipper.email,
    'Shipper Tax ID': k.shipper.taxId,
    'Shipper Remark': k.shipper.remark,
    // Consignee
    'Consignee Name': k.consignee.name,
    'Consignee Address 1': k.consignee.addressLine1,
    'Consignee Address 2': k.consignee.addressLine2,
    'Consignee Tel': k.consignee.tel,
    'Consignee Fax': k.consignee.fax,
    'Consignee Mail ID': k.consignee.email,
    'Consignee Tax ID': k.consignee.taxId,
    'Consignee Remark': k.consignee.remark,
    // Notify Party
    'Notify Party Name': k.notifyParty.name,
    'Notify Address 1': k.notifyParty.addressLine1,
    'Notify Address 2': k.notifyParty.addressLine2,
    'Notify Tel': k.notifyParty.tel,
    'Notify Fax': k.notifyParty.fax,
    'Notify Mail ID': k.notifyParty.email,
    'Notify Tax ID': k.notifyParty.taxId,
    'Notify Remark': k.notifyParty.remark,
    // Also Notify Party (Rare)
    'Has Also Notify': k.hasAlsoNotify ? 'YES' : 'NO',
    'Also Notify Name': k.alsoNotifyParty?.name || '',
    'Also Notify Address 1': k.alsoNotifyParty?.addressLine1 || '',
    'Also Notify Address 2': k.alsoNotifyParty?.addressLine2 || '',
    'Also Notify Tel': k.alsoNotifyParty?.tel || '',
    'Also Notify Fax': k.alsoNotifyParty?.fax || '',
    'Also Notify Mail ID': k.alsoNotifyParty?.email || '',
    'Also Notify Tax ID': k.alsoNotifyParty?.taxId || '',
    'Also Notify Remark': k.alsoNotifyParty?.remark || '',
    // General
    'General Remarks': k.remarks,
    'Created At': k.createdAt,
  }));
  const ws = XLSX.utils.json_to_sheet(kycData);
  XLSX.utils.book_append_sheet(wb, ws, 'KYC Registry');
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Yokohama_KYC_Registry_${dateStr}.xlsx`);
};

export const exportKycToExcel = (bookings: BookingConfirmation[]): void => {
  const wb = XLSX.utils.book_new();
  const kycData = bookings.map((b) => ({
    'Customer / Account': b.customerCompany,
    'Booking Reference': b.bookingNumber,
    'Shipper on Record': b.shipperCompany,
    'Consignee (Receiver)': b.consigneeCompany,
    'Notify Party': b.notifyParty,
    'Also Notify Party': b.alsoNotifyParty || 'N/A',
    'Value Currency': b.valueType || 'USD',
    'Incoterm': b.incoterm || 'CIF',
    'Commodity': b.commodity,
    'Cargo Volume': b.cargoVolumeSize,
    'Issue Date': b.date,
    'Compliance Status': 'AUTHENTICATED KYC',
    'Remarks': b.remarks,
  }));
  const ws = XLSX.utils.json_to_sheet(kycData);
  ws['!cols'] = [
    { wch: 25 }, { wch: 18 }, { wch: 25 }, { wch: 25 }, { wch: 22 },
    { wch: 22 }, { wch: 14 }, { wch: 12 }, { wch: 30 }, { wch: 18 },
    { wch: 14 }, { wch: 20 }, { wch: 35 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'KYC Verification Records');
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Yokohama_KYC_Verification_${dateStr}.xlsx`);
};

