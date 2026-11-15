import React from 'react';
import { Quotation, CompanyProfile } from '../types';
import { CompanyLogo } from './CompanyLogo';
import { getQuotationTermsArray } from '../utils/interconnection';

interface QuotationDocumentViewProps {
  quotation: Quotation;
  company: CompanyProfile;
  id?: string;
}

export const QuotationDocumentView: React.FC<QuotationDocumentViewProps> = ({
  quotation,
  company,
  id = 'quotation-print-document',
}) => {
  const rate = quotation.exchangeRate || 155;
  const bookingNo = (quotation.bookingNo || '').trim();
  const shipmentNo = (quotation.shipmentNo || '').trim();
  const blNo = (quotation.blNo || '').trim();
  const hasBookingOrShipment = Boolean(bookingNo || shipmentNo);
  const hasAnyShipmentRef = Boolean(bookingNo || shipmentNo || blNo);
  const termsList = getQuotationTermsArray(quotation);

  return (
    <div
      id={id}
      className="printable-sheet bg-white text-slate-900 mx-auto w-[794px] max-w-[794px] border border-slate-300 shadow-sm p-4 sm:p-5 font-sans print:border-none print:shadow-none print:p-0 print:max-w-none"
      style={{ boxSizing: 'border-box' }}
    >
      <div className="border border-slate-400 p-4 bg-white flex flex-col justify-between">
        <div>
          {/* Official Corporate Letterhead Header (Logo & Company Name kept on documents; NO invoice reg no or bank details) */}
          <div className="flex items-start justify-between gap-4 pb-3 border-b-2 border-slate-800">
            <div className="flex flex-col justify-center shrink-0">
              <CompanyLogo
                customLogoUrl={company.customLogoUrl}
                size="document"
                className="max-h-[72px]"
              />
            </div>

            <div className="text-right text-[11px] leading-tight text-slate-700 flex flex-col items-end">
              <div className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 font-sans">
                {company.companyNameEn}
              </div>
              {company.companyNameJp && (
                <div className="text-xs text-slate-700 font-medium tracking-wide mt-0.5">
                  {company.companyNameJp}
                </div>
              )}
              <div className="text-[10.5px] text-slate-600 mt-1">
                {company.postalCode} {company.addressJp}
              </div>
              <div className="text-[10px] text-slate-500">
                {company.addressEn}
              </div>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-700 font-mono">
                <span><strong className="text-slate-900">TEL:</strong> {company.phone}</span>
                {company.fax && (
                  <>
                    <span>•</span>
                    <span><strong className="text-slate-900">FAX:</strong> {company.fax}</span>
                  </>
                )}
                {company.email && (
                  <>
                    <span>•</span>
                    <span><strong className="text-slate-900">EMAIL:</strong> {company.email}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Document Main Heading */}
          <div className="mt-2.5 text-center">
            <div className="bg-sky-900 text-white font-extrabold tracking-widest text-sm sm:text-base py-1.5 px-6 rounded-xs shadow-xs uppercase">
              FREIGHT QUOTATION
            </div>
          </div>

          {/* Customer & Quotation Details Table */}
          <div className="mt-3 border-t-2 border-slate-700">
            <table className="w-full text-[11.5px] border-collapse border border-slate-400">
              <tbody>
                <tr className="border-b border-slate-300">
                  <td className="w-[18%] p-1.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    TO
                  </td>
                  <td className="w-[32%] p-1.5 font-bold text-slate-900 border-r border-slate-300">
                    {quotation.customerName}
                  </td>
                  <td className="w-[18%] p-1.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    QUOTATION NO.
                  </td>
                  <td className="w-[32%] p-1.5 font-mono font-bold text-sky-900">
                    {quotation.quotationNo}
                  </td>
                </tr>

                <tr className="border-b border-slate-300">
                  <td className="p-1.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    ADDRESS
                  </td>
                  <td className="p-1.5 text-slate-800 border-r border-slate-300">
                    {quotation.customerAddress || '—'}
                  </td>
                  <td className="p-1.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    DATE / VALIDITY
                  </td>
                  <td className="p-1.5 font-mono font-semibold text-slate-900">
                    {quotation.date} (Valid to: {quotation.validUntil || '—'})
                  </td>
                </tr>

                {/* BOOKING / SHIPMENT / B/L NO. — Displayed ONLY if available */}
                {hasAnyShipmentRef && (
                  <tr className="border-b border-slate-300">
                    {hasBookingOrShipment ? (
                      <>
                        <td className="p-1.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                          BOOKING / SHIPMENT NO.
                        </td>
                        <td
                          colSpan={blNo ? 1 : 3}
                          className={`p-1.5 font-mono font-semibold text-slate-900 ${
                            blNo ? 'border-r border-slate-300' : ''
                          }`}
                        >
                          {[bookingNo, shipmentNo].filter(Boolean).join(' / ')}
                        </td>
                      </>
                    ) : null}
                    {blNo ? (
                      <>
                        <td className="p-1.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                          B/L NO.
                        </td>
                        <td
                          colSpan={hasBookingOrShipment ? 1 : 3}
                          className="p-1.5 font-mono font-semibold text-slate-900"
                        >
                          {blNo}
                        </td>
                      </>
                    ) : null}
                  </tr>
                )}

                <tr className="border-b border-slate-300">
                  <td className="p-1.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    POL → POD
                  </td>
                  <td className="p-1.5 font-bold text-slate-900 border-r border-slate-300">
                    {quotation.portFrom} → {quotation.portTo}
                  </td>
                  <td className="p-1.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    SHIPPING LINE
                  </td>
                  <td className="p-1.5 font-semibold text-slate-900">
                    {quotation.shippingCompany || '—'}
                  </td>
                </tr>

                <tr className="border-b border-slate-300">
                  <td className="p-1.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    VESSEL / VOYAGE
                  </td>
                  <td className="p-1.5 font-semibold text-slate-900 border-r border-slate-300">
                    {quotation.vesselVoyage || '—'}
                  </td>
                  <td className="p-1.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    ETD / ETA
                  </td>
                  <td className="p-1.5 font-mono text-slate-800">
                    {quotation.etd || '—'} / {quotation.eta || '—'}
                  </td>
                </tr>

                <tr>
                  <td className="p-1.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    EQUIPMENT / TERM
                  </td>
                  <td className="p-1.5 font-semibold text-slate-900 border-r border-slate-300">
                    {quotation.shipmentMode || `${quotation.containerCount || 1} X ${quotation.containerSize || "40' HC"}`} · {quotation.freightTerm}
                  </td>
                  <td className="p-1.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    EST. EXCHANGE RATE
                  </td>
                  <td className="p-1.5 font-mono font-bold text-sky-900">
                    1 USD = ¥{rate.toFixed(2)} JPY
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Quotation Freight Charges Table (Customer Selling Prices Only) */}
          <div className="mt-4">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
              Quotation Details &amp; Freight Charges
            </div>
            <table className="w-full text-[11.5px] border-collapse border border-slate-400">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="p-2 text-left border-r border-slate-600 w-[16%]">CHARGE</th>
                  <th className="p-2 text-left border-r border-slate-600">DESCRIPTION</th>
                  <th className="p-2 text-right border-r border-slate-600 w-[14%]">RATE</th>
                  <th className="p-2 text-center border-r border-slate-600 w-[8%]">QTY</th>
                  <th className="p-2 text-center border-r border-slate-600 w-[8%]">TAX</th>
                  <th className="p-2 text-right w-[18%]">TOTAL (JPY)</th>
                </tr>
              </thead>
              <tbody>
                {quotation.sellingItems.map((item) => {
                  const qtyDisplay =
                    item.quantity === undefined || item.quantity === null || item.quantity === 0
                      ? '—'
                      : item.quantity;
                  const unitSym =
                    item.currency === 'USD' ? '$' : item.currency === 'EURO' ? '€' : '¥';
                  return (
                    <tr key={item.id} className="border-b border-slate-300">
                      <td className="p-2 font-bold text-slate-900 border-r border-slate-300">
                        {item.details}
                      </td>
                      <td className="p-2 text-slate-800 border-r border-slate-300">
                        {item.description}
                      </td>
                      <td className="p-2 text-right font-mono text-slate-900 border-r border-slate-300">
                        {unitSym}
                        {Number(item.unitPrice || 0).toLocaleString()}
                      </td>
                      <td className="p-2 text-center font-mono text-slate-800 border-r border-slate-300">
                        {qtyDisplay}
                      </td>
                      <td className="p-2 text-center font-mono text-slate-700 border-r border-slate-300">
                        {item.taxRate || 0}%
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-slate-900">
                        ¥{Math.round(item.lineTotalJpy || 0).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-sky-50 border-t-2 border-slate-700">
                  <td colSpan={5} className="p-2.5 text-right font-extrabold text-slate-900 uppercase">
                    TOTAL QUOTED FREIGHT &amp; CHARGES (JPY)
                  </td>
                  <td className="p-2.5 text-right font-mono font-black text-base text-sky-950">
                    ¥{Math.round(quotation.totalSellingJpy || 0).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Remarks (if any) */}
          {quotation.remarks && (
            <div className="mt-3 border border-slate-300 rounded p-2.5 bg-slate-50 text-[11px]">
              <span className="font-bold text-slate-800 uppercase">Remarks: </span>
              <span className="text-slate-700">{quotation.remarks}</span>
            </div>
          )}

          {/* Terms & Conditions (Editable Numbered Clauses) */}
          <div className="mt-3.5 border border-slate-300 rounded p-3 bg-slate-50/70">
            <div className="text-[11px] font-extrabold text-slate-900 uppercase tracking-wider mb-1.5 border-b border-slate-200 pb-1">
              Terms &amp; Conditions
            </div>
            <ol className="list-decimal list-outside ml-4 space-y-1 text-[10.5px] leading-snug text-slate-700">
              {termsList.map((term, idx) => (
                <li key={idx} className="pl-0.5">
                  {term}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Clean Quotation Footer (NO Bank Details / NO Invoice Copy) */}
        <div className="mt-5 pt-3 border-t border-slate-300 flex items-center justify-between gap-4 text-[10px] text-slate-600">
          <div>
            Please confirm booking details in writing prior to vessel cut-off.
          </div>
          <div className="text-right shrink-0">
            <span className="text-slate-500">Issued By: </span>
            <strong className="text-slate-900">{company.companyNameEn}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
