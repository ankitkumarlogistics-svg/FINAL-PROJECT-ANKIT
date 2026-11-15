import React from 'react';
import { FreightInvoice, CompanyProfile } from '../types';
import { CompanyLogo } from './CompanyLogo';

interface InvoiceDocumentViewProps {
  invoice: FreightInvoice;
  company: CompanyProfile;
  id?: string;
}

export const InvoiceDocumentView: React.FC<InvoiceDocumentViewProps> = ({
  invoice,
  company,
  id = 'invoice-print-document',
}) => {
  return (
    <div
      id={id}
      className="printable-sheet bg-white text-slate-900 mx-auto w-[794px] max-w-[794px] border border-slate-300 shadow-sm p-4 sm:p-5 font-sans print:border-none print:shadow-none print:p-0 print:max-w-none"
      style={{ boxSizing: 'border-box' }}
    >
      {/* Outer Border wrapping the entire invoice */}
      <div className="border border-slate-400 p-4 bg-white flex flex-col justify-between">
        <div>
          {/* Professional Corporate Letterhead Header */}
          <div className="flex items-start justify-between gap-4 pb-3 border-b-2 border-slate-800">
            {/* Left: Official Company Emblem (Clean & Properly Sized) */}
            <div className="flex flex-col justify-center shrink-0">
              <CompanyLogo
                customLogoUrl={company.customLogoUrl}
                size="document"
                className="max-h-[72px]"
              />
            </div>

            {/* Right: Company Legal Information & Registration */}
            <div className="text-right text-[11px] leading-tight text-slate-700 flex flex-col items-end">
              <div className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 font-sans">
                {company.companyNameEn}
              </div>
              <div className="text-xs text-slate-700 font-medium tracking-wide mt-0.5">
                {company.companyNameJp}
              </div>
              <div className="text-[10.5px] text-slate-600 mt-1">
                〒{company.postalCode} {company.addressJp}
              </div>
              <div className="text-[10px] text-slate-500">
                {company.addressEn}
              </div>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-700 font-mono">
                <span><strong className="text-slate-900">TEL:</strong> {company.phone}</span>
                <span>•</span>
                <span><strong className="text-slate-900">FAX:</strong> {company.fax}</span>
                <span>•</span>
                <span><strong className="text-slate-900">EMAIL:</strong> {company.email}</span>
              </div>
              <div className="text-[10.5px] font-mono font-bold text-sky-900 mt-0.5">
                登録番号 (Invoice Reg. No.): {company.registrationNumber}
              </div>
            </div>
          </div>

          {/* Title banner */}
          <div className="mt-2 text-center">
            <div className="bg-sky-900 text-white font-extrabold tracking-widest text-sm sm:text-base py-1.5 px-6 rounded-xs shadow-xs uppercase">
              FREIGHT INVOICE
            </div>
          </div>

          {/* Primary Invoice Header Grid (Customer, Vessel, Voyage, Dates, BL, Rate) */}
          <div className="mt-3 border-t-2 border-slate-700">
            <table className="w-full text-xs sm:text-[12px] border-collapse border border-slate-400">
              <tbody>
                {/* Row 1: M/S & Invoice No */}
                <tr className="border-b border-slate-300">
                  <td className="w-[18%] p-1.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    M / S
                  </td>
                  <td className="w-[32%] p-1.5 font-bold text-slate-900 border-r border-slate-300">
                    {invoice.customerName}
                  </td>
                  <td className="w-[18%] p-1.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    INVOICE NO
                  </td>
                  <td className="w-[32%] p-1.5 font-mono font-bold text-sky-900">
                    {invoice.invoiceNo}
                  </td>
                </tr>

                {/* Row 2: Address & Date */}
                <tr className="border-b border-slate-300">
                  <td className="p-1.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    ADDRESS
                  </td>
                  <td className="p-1.5 text-slate-800 border-r border-slate-300">
                    {invoice.customerAddress}
                  </td>
                  <td className="p-1.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    DATE
                  </td>
                  <td className="p-1.5 font-semibold text-slate-900">
                    {invoice.date}
                  </td>
                </tr>

                {/* Row 3: Port from & Port to */}
                <tr className="border-b border-slate-300">
                  <td className="p-1.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    Port from
                  </td>
                  <td className="p-1.5 font-semibold text-slate-900 border-r border-slate-300">
                    {invoice.portFrom}
                  </td>
                  <td className="p-1.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    Port to
                  </td>
                  <td className="p-1.5 font-semibold text-slate-900">
                    {invoice.portTo}
                  </td>
                </tr>

                {/* Row 4: Shipping company & Vessel & Voy */}
                <tr className="border-b border-slate-300">
                  <td className="p-1.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    Shipping company
                  </td>
                  <td className="p-1.5 text-slate-900 border-r border-slate-300">
                    {invoice.shippingCompany}
                  </td>
                  <td className="p-1.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    Vessel & Voy
                  </td>
                  <td className="p-1.5 font-semibold text-slate-900">
                    {invoice.vesselVoyage}
                  </td>
                </tr>

                {/* Row 5: ETD & ETA */}
                <tr className="border-b border-slate-300">
                  <td className="p-1.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    ETD
                  </td>
                  <td className="p-1.5 text-slate-900 border-r border-slate-300">
                    {invoice.etd}
                  </td>
                  <td className="p-1.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    ETA
                  </td>
                  <td className="p-1.5 text-slate-900">
                    {invoice.eta}
                  </td>
                </tr>

                {/* Row 6: B/L No. & Booking No */}
                <tr className="border-b border-slate-300">
                  <td className="p-1.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    B/L No.
                  </td>
                  <td className="p-1.5 font-mono text-slate-900 border-r border-slate-300">
                    {invoice.blNo}
                  </td>
                  <td className="p-1.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    Booking No
                  </td>
                  <td className="p-1.5 font-mono text-slate-900">
                    {invoice.bookingNo}
                  </td>
                </tr>

                {/* Row 7: Shipment mode & Freight */}
                <tr className="border-b border-slate-300">
                  <td className="p-1.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    Shipment mode
                  </td>
                  <td className="p-1.5 text-slate-900 border-r border-slate-300">
                    {invoice.shipmentMode}
                  </td>
                  <td className="p-1.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    Freight
                  </td>
                  <td className="p-1.5 font-bold text-slate-900">
                    {invoice.freightTerm}
                  </td>
                </tr>

                {/* Row 8: Exchange Rate & No. of Containers */}
                <tr>
                  <td className="p-1.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    Exchange Rate
                  </td>
                  <td className="p-1.5 font-mono text-slate-900 border-r border-slate-300">
                    {invoice.exchangeRate > 0 ? `1 USD = ¥${invoice.exchangeRate.toFixed(2)}` : '—'}
                  </td>
                  <td className="p-1.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    Containers &amp; Qty
                  </td>
                  <td className="p-1.5 text-slate-900">
                    <div className="flex flex-wrap items-center gap-x-2">
                      <span className="font-extrabold text-sky-950 font-mono text-xs">
                        {invoice.containerCount || 1} {invoice.containerCount > 1 ? 'CONTAINERS' : 'CONTAINER'}
                      </span>
                      {invoice.containerSize && (
                        <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                          {invoice.containerSize}
                        </span>
                      )}
                    </div>
                    {invoice.containerNumbers && (
                      <div className="text-[10px] font-mono text-slate-600 mt-0.5">
                        <strong className="text-slate-800">Nos:</strong> {invoice.containerNumbers}
                      </div>
                    )}
                    {invoice.sealNumbers && (
                      <div className="text-[10px] font-mono text-slate-600 mt-0.5">
                        <strong className="text-slate-800">Seal:</strong> {invoice.sealNumbers}
                      </div>
                    )}
                    {(invoice.grossWeightKg || invoice.measurementCbm) && (
                      <div className="text-[9.5px] font-mono text-slate-500 mt-0.5 flex gap-2">
                        {invoice.grossWeightKg && <span>Wt: {invoice.grossWeightKg}</span>}
                        {invoice.measurementCbm && <span>Vol: {invoice.measurementCbm}</span>}
                      </div>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Line Items Table with full price, container quantity, and tax transparency */}
          <div className="mt-4">
            <table className="w-full text-[10.5px] border-collapse border border-slate-400">
              <thead>
                <tr className="bg-slate-200 text-slate-900 border-b border-slate-400 font-bold">
                  <th className="p-1.5 text-left border-r border-slate-400 w-[12%]">
                    DETAILS
                  </th>
                  <th className="p-1.5 text-left border-r border-slate-400 w-[24%]">
                    DESCRIPTION
                  </th>
                  <th className="p-1.5 text-right border-r border-slate-400 w-[12%]">
                    UNIT PRICE
                  </th>
                  <th className="p-1.5 text-center border-r border-slate-400 w-[8%]">
                    QTY
                  </th>
                  <th className="p-1.5 text-right border-r border-slate-400 w-[12%]">
                    ORIGINAL AMT
                  </th>
                  <th className="p-1.5 text-left border-r border-slate-400 w-[14%]">
                    EXCHANGE / CALC
                  </th>
                  <th className="p-1.5 text-center border-r border-slate-400 w-[8%]">
                    TAX
                  </th>
                  <th className="p-1.5 text-right w-[10%]">
                    TOTAL (JPY)
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, idx) => {
                  const hasQty =
                    item.quantity !== undefined &&
                    item.quantity !== null &&
                    String(item.quantity).trim() !== '' &&
                    Number(item.quantity) > 0;
                  const qty = hasQty ? Number(item.quantity) : 1;
                  const originalTotal = item.unitPrice * qty;
                  const rate = invoice.exchangeRate || 155;
                  const isUsd = item.currency === 'USD';

                  return (
                    <tr
                      key={item.id || idx}
                      className="border-b border-slate-300 hover:bg-slate-50/50"
                    >
                      <td className="p-1.5 font-bold text-slate-800 border-r border-slate-300">
                        {item.details}
                      </td>
                      <td className="p-1.5 text-slate-800 border-r border-slate-300">
                        {item.description}
                      </td>
                      <td className="p-1.5 text-right font-mono text-slate-800 border-r border-slate-300">
                        {isUsd
                          ? `$${item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : `¥${item.unitPrice.toLocaleString()}`}
                      </td>
                      <td className="p-1.5 text-center font-mono font-bold text-sky-950 border-r border-slate-300 bg-sky-50/30">
                        {hasQty ? (
                          <span>{item.quantity}</span>
                        ) : (
                          <span className="text-transparent select-none"> </span>
                        )}
                      </td>
                      <td className="p-1.5 text-right font-mono font-bold text-slate-900 border-r border-slate-300">
                        {isUsd
                          ? `$${originalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : `¥${originalTotal.toLocaleString()}`}
                      </td>
                      <td className="p-1.5 text-[10px] text-slate-700 border-r border-slate-300 font-mono">
                        {isUsd ? (
                          <span className="text-sky-900 font-semibold">
                            {hasQty && qty > 1
                              ? `$${item.unitPrice.toLocaleString()} × ${qty} × ¥${rate}`
                              : `$${originalTotal.toLocaleString()} × ¥${rate}`}
                          </span>
                        ) : (
                          <span className="text-slate-500 font-sans">
                            {hasQty && qty > 1 ? `¥${item.unitPrice.toLocaleString()} × ${qty}` : 'Domestic JPY'}
                          </span>
                        )}
                      </td>
                      <td className="p-1.5 text-center text-[10px] font-mono text-slate-700 border-r border-slate-300">
                        {item.taxRate > 0 ? (
                          <span className="text-amber-900 font-semibold">10%</span>
                        ) : (
                          <span className="text-slate-600 font-semibold">0%</span>
                        )}
                      </td>
                      <td className="p-1.5 text-right font-mono font-bold text-slate-900">
                        ¥{item.lineTotalJpy.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}

                {/* Sub Total */}
                <tr className="border-b border-slate-300 font-bold bg-slate-50">
                  <td colSpan={4} className="p-1.5 border-r border-slate-300 text-slate-800">
                    Sub Total (小計)
                  </td>
                  <td colSpan={3} className="border-r border-slate-300 text-right pr-2 text-[10px] text-slate-500 font-normal">
                    Total Amount before Discount
                  </td>
                  <td className="p-1.5 text-right font-mono text-slate-900 text-xs">
                    ¥{invoice.subTotalJpy.toLocaleString()}
                  </td>
                </tr>

                {/* Discount (if applicable) */}
                {invoice.discountJpy > 0 && (
                  <tr className="border-b border-slate-300">
                    <td colSpan={4} className="p-1.5 font-bold text-slate-800 border-r border-slate-300">
                      Discount (特別値引き)
                    </td>
                    <td colSpan={3} className="border-r border-slate-300"></td>
                    <td className="p-1.5 text-right font-mono text-rose-700 font-semibold">
                      -¥{invoice.discountJpy.toLocaleString()}
                    </td>
                  </tr>
                )}

                {/* Remarks */}
                <tr className="border-b border-slate-400">
                  <td className="p-1.5 font-bold text-slate-800 border-r border-slate-300">
                    Remarks
                  </td>
                  <td colSpan={7} className="p-1.5 text-slate-800 font-medium">
                    {invoice.remarks || '—'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>


          {/* Grand Total Highlight Bar */}
          <div className="mt-2.5 border-2 border-emerald-600 rounded-sm overflow-hidden shadow-xs">
            <div className="flex items-center justify-between bg-emerald-700 text-white px-5 py-2">
              <div>
                <span className="text-base sm:text-lg font-extrabold tracking-wide uppercase">
                  Grand Total (請求総額)
                </span>
                <span className="text-[10.5px] text-emerald-100 block">
                  Total Payable Amount in Japanese Yen (円)
                </span>
              </div>
              <span className="text-2xl sm:text-3xl font-mono font-extrabold text-white tracking-tight">
                ¥{invoice.grandTotalJpy.toLocaleString()}
              </span>
            </div>
            {/* Payment Due Date row */}
            <div className="flex items-center justify-between bg-white px-5 py-1.5 border-t border-emerald-600">
              <span className="text-xs font-bold text-slate-800">
                Payment Due Date (お支払い期日):
              </span>
              <span className="text-sm font-bold text-rose-700 tracking-wide font-mono">
                {invoice.paymentDueDate || 'AS AGREED'}
              </span>
            </div>
          </div>

          {/* Dual Bank Account Section (Japanese & English) */}
          <div className="mt-4 border border-sky-900 rounded-sm overflow-hidden">
            <div className="grid grid-cols-2 bg-sky-900 text-white text-xs font-bold py-1.5 px-4 text-center">
              <div>JAPANESE</div>
              <div className="border-l border-sky-800">ENGLISH</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 text-[10.5px] leading-snug divide-y md:divide-y-0 md:divide-x divide-slate-300 p-2.5 bg-slate-50">
              {/* Japanese Bank Box */}
              <div className="space-y-0.5 pr-3">
                <div className="flex">
                  <span className="font-bold w-20 text-slate-700">口座名義:</span>
                  <span className="font-semibold text-slate-900">{company.bankDetails.accountNameJp}</span>
                </div>
                <div className="flex">
                  <span className="font-bold w-20 text-slate-700">銀行名:</span>
                  <span className="text-slate-900">{company.bankDetails.bankNameJp}</span>
                </div>
                <div className="flex">
                  <span className="font-bold w-20 text-slate-700">銀行コード:</span>
                  <span className="font-mono text-slate-900">{company.bankDetails.bankCode}</span>
                </div>
                <div className="flex">
                  <span className="font-bold w-20 text-slate-700">支店名:</span>
                  <span className="text-slate-900">{company.bankDetails.branchNameJp}</span>
                </div>
                <div className="flex">
                  <span className="font-bold w-20 text-slate-700">支店コード:</span>
                  <span className="font-mono text-slate-900">{company.bankDetails.branchCode}</span>
                </div>
                <div className="flex">
                  <span className="font-bold w-20 text-slate-700">口座種別:</span>
                  <span className="text-slate-900">{company.bankDetails.accountTypeJp}</span>
                </div>
                <div className="flex items-center pt-1 mt-1 border-t border-slate-200">
                  <span className="font-bold w-20 text-slate-800">口座番号:</span>
                  <span className="font-mono font-extrabold text-sky-950 text-xs bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded shadow-xs">
                    {company.bankDetails.accountNumber}
                  </span>
                  <span className="ml-3 font-bold text-slate-700">SWIFT:</span>
                  <span className="font-mono font-bold text-slate-900 ml-1 bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px]">
                    {company.bankDetails.swiftCode}
                  </span>
                </div>
              </div>

              {/* English Bank Box */}
              <div className="space-y-0.5 pl-3 pt-2 md:pt-0">
                <div className="flex">
                  <span className="font-bold w-24 text-slate-700">ACCOUNT NAME:</span>
                  <span className="font-semibold text-slate-900">{company.bankDetails.accountNameEn}</span>
                </div>
                <div className="flex">
                  <span className="font-bold w-24 text-slate-700">BANK NAME:</span>
                  <span className="text-slate-900">{company.bankDetails.bankNameEn}</span>
                </div>
                <div className="flex">
                  <span className="font-bold w-24 text-slate-700">BANK CODE:</span>
                  <span className="font-mono text-slate-900">{company.bankDetails.bankCode}</span>
                </div>
                <div className="flex">
                  <span className="font-bold w-24 text-slate-700">BRANCH:</span>
                  <span className="text-slate-900">{company.bankDetails.branchNameEn} (CODE: {company.bankDetails.branchCode})</span>
                </div>
                <div className="flex">
                  <span className="font-bold w-24 text-slate-700">ACCOUNT TYPE:</span>
                  <span className="text-slate-900">{company.bankDetails.accountTypeEn}</span>
                </div>
                <div className="flex items-center pt-1 mt-1 border-t border-slate-200">
                  <span className="font-bold w-24 text-slate-800">ACCOUNT NO:</span>
                  <span className="font-mono font-extrabold text-sky-950 text-xs bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded shadow-xs">
                    {company.bankDetails.accountNumber}
                  </span>
                  <span className="ml-3 font-bold text-slate-700">SWIFT:</span>
                  <span className="font-mono font-bold text-slate-900 ml-1 bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px]">
                    {company.bankDetails.swiftCode}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info & watermark */}
        <div className="mt-3 pt-2 border-t border-slate-300 flex justify-between items-center text-[10px] text-slate-500">
          <div>{company.companyNameEn} · Official Tax Invoice</div>
          <div className="font-mono">Invoice #{invoice.invoiceNo} · Status: {invoice.status}</div>
        </div>
      </div>
    </div>
  );
};
