import React, { useState } from 'react';
import { BookingConfirmation, CompanyProfile } from '../types';
import { CompanyLogo } from './CompanyLogo';
import { CheckSquare, Square, Building2, UserCheck } from 'lucide-react';

interface BookingDocumentViewProps {
  booking: BookingConfirmation;
  company: CompanyProfile;
  id?: string;
}

export const BookingDocumentView: React.FC<BookingDocumentViewProps> = ({
  booking,
  company,
  id = 'booking-print-document',
}) => {
  const hasDetailedPartyInfo = Boolean(
    booking.showFullPartyDetails ||
    booking.shipperAddress ||
    booking.consigneeAddress ||
    booking.shipperTaxId ||
    booking.consigneeTaxId
  );
  const [showFullDetails, setShowFullDetails] = useState(hasDetailedPartyInfo);

  return (
    <div className="space-y-2">
      {/* Document View Toolbar (Hidden in Print) */}
      <div className="print:hidden flex items-center justify-between bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <Building2 className="w-4 h-4 text-sky-700" />
          <span className="font-semibold">Party Address Details Mode:</span>
        </div>
        <button
          type="button"
          onClick={() => setShowFullDetails(!showFullDetails)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-colors ${
            showFullDetails
              ? 'bg-sky-700 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
          }`}
          title="Toggle Full Shipper, Consignee & Notify Party Address, Tel & Tax ID details"
        >
          {showFullDetails ? <CheckSquare className="w-3.5 h-3.5 text-sky-200" /> : <Square className="w-3.5 h-3.5 text-slate-400" />}
          <span>{showFullDetails ? 'Full Party Details (Customer Copy Active)' : 'Compact Party View'}</span>
        </button>
      </div>

      <div
        id={id}
        className="printable-sheet bg-white text-slate-900 mx-auto w-[794px] max-w-[794px] border border-slate-300 shadow-sm p-4 sm:p-5 font-sans print:border-none print:shadow-none print:p-0 print:max-w-none"
        style={{ boxSizing: 'border-box' }}
      >
        {/* Outer Border */}
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
                <div className="text-base font-extrabold tracking-tight text-slate-900 font-sans">
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

            {/* Title Banner */}
            <div className="mt-2 text-center">
              <div className="bg-sky-950 text-white font-extrabold tracking-widest text-sm sm:text-base py-1.5 px-6 rounded-xs uppercase shadow-xs">
                BOOKING CONFIRMATION
              </div>
            </div>

            {/* Issue Date & Status Bar */}
            <div className="flex items-center justify-between py-1 px-2.5 bg-slate-100 border-t-2 border-b border-slate-700 text-xs text-slate-700 mt-1.5">
              <div>
                <span className="font-semibold text-slate-900">Issue Date:</span> {booking.date}
                <span className="mx-2 text-slate-400">|</span>
                <span className="font-semibold text-slate-900">Status:</span>{' '}
                <span className="font-bold text-sky-900">{booking.status}</span>
              </div>
              <div className="font-mono font-bold text-sky-950">
                BOOKING REF: {booking.bookingNumber}
              </div>
            </div>

            {/* Main Booking Details Table */}
            <div className="mt-2.5">
              <table className="w-full text-[11.5px] border-collapse border border-slate-400">
                <tbody>
                  {/* Customer Company */}
                  <tr className="border-b border-slate-300">
                    <td className="w-2/5 py-1.5 px-2.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                      Customer Company
                    </td>
                    <td className="w-3/5 py-1.5 px-2.5 font-bold text-slate-900 text-xs">
                      {booking.customerCompany || '—'}
                    </td>
                  </tr>

                  {/* Forwarder Company */}
                  <tr className="border-b border-slate-300">
                    <td className="py-1.5 px-2.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                      Forwarder Company
                    </td>
                    <td className="py-1.5 px-2.5 text-slate-900 font-semibold">
                      {booking.forwarderCompany || company.companyNameEn}
                    </td>
                  </tr>

                  {/* Shipper Company on B/L */}
                  <tr className="border-b border-slate-300">
                    <td className="py-1.5 px-2.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800 align-top">
                      Shipper Company on B/L
                    </td>
                    <td className="py-1.5 px-2.5 text-slate-900">
                      <div className="font-bold text-slate-900">{booking.shipperCompany || 'AS ACTUAL'}</div>
                      {showFullDetails && (booking.shipperAddress || booking.shipperTel || booking.shipperTaxId) && (
                        <div className="mt-1 pt-1 border-t border-slate-200 text-[10.5px] leading-tight space-y-0.5 text-slate-700">
                          {booking.shipperAddress && (
                            <div><strong className="text-slate-800">Address:</strong> {booking.shipperAddress}</div>
                          )}
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px]">
                            {booking.shipperTel && (
                              <span><strong>TEL/Contact:</strong> {booking.shipperTel}</span>
                            )}
                            {booking.shipperTaxId && (
                              <span className="font-mono text-sky-900"><strong>TAX ID:</strong> {booking.shipperTaxId}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* Consignee Company on B/L */}
                  <tr className="border-b border-slate-300">
                    <td className="py-1.5 px-2.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800 align-top">
                      Consignee Company on B/L
                    </td>
                    <td className="py-1.5 px-2.5 text-slate-900">
                      <div className="font-bold text-slate-900">{booking.consigneeCompany || 'AS ACTUAL'}</div>
                      {showFullDetails && (booking.consigneeAddress || booking.consigneeTel || booking.consigneeTaxId) && (
                        <div className="mt-1 pt-1 border-t border-slate-200 text-[10.5px] leading-tight space-y-0.5 text-slate-700">
                          {booking.consigneeAddress && (
                            <div><strong className="text-slate-800">Address:</strong> {booking.consigneeAddress}</div>
                          )}
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px]">
                            {booking.consigneeTel && (
                              <span><strong>TEL/Contact:</strong> {booking.consigneeTel}</span>
                            )}
                            {booking.consigneeTaxId && (
                              <span className="font-mono text-sky-900"><strong>TAX ID:</strong> {booking.consigneeTaxId}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* Notify Party on B/L */}
                  <tr className="border-b border-slate-300">
                    <td className="py-1.5 px-2.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800 align-top">
                      Notify Party on B/L
                    </td>
                    <td className="py-1.5 px-2.5 text-slate-900">
                      <div className="font-bold text-slate-900">{booking.notifyParty || 'SAME AS CONSIGNEE'}</div>
                      {showFullDetails && (booking.notifyAddress || booking.notifyTel || booking.notifyTaxId) && (
                        <div className="mt-1 pt-1 border-t border-slate-200 text-[10.5px] leading-tight space-y-0.5 text-slate-700">
                          {booking.notifyAddress && booking.notifyAddress !== 'SAME AS CONSIGNEE' && (
                            <div><strong className="text-slate-800">Address:</strong> {booking.notifyAddress}</div>
                          )}
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px]">
                            {booking.notifyTel && (
                              <span><strong>TEL/Contact:</strong> {booking.notifyTel}</span>
                            )}
                            {booking.notifyTaxId && (
                              <span className="font-mono text-sky-900"><strong>TAX ID:</strong> {booking.notifyTaxId}</span>
                            )}
                          </div>
                        </div>
                      )}
                      {booking.alsoNotifyParty && (
                        <div className="mt-1 text-[10.5px] text-slate-700 bg-slate-50 p-1 rounded border border-slate-200">
                          <span className="font-bold text-slate-800">Also Notify:</span> {booking.alsoNotifyParty}
                        </div>
                      )}
                    </td>
                  </tr>

                {/* Booking Number */}
                <tr className="border-b border-slate-300 bg-sky-50/50">
                  <td className="py-1.5 px-2.5 font-bold bg-sky-100/70 border-r border-slate-300 text-sky-950">
                    Booking Number
                  </td>
                  <td className="py-1.5 px-2.5 font-mono font-bold text-sky-900 text-xs">
                    {booking.bookingNumber}
                  </td>
                </tr>

                {/* Shipping Company */}
                <tr className="border-b border-slate-300">
                  <td className="py-1.5 px-2.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    Shipping Company
                  </td>
                  <td className="py-1.5 px-2.5 font-semibold text-slate-900">
                    {booking.shippingCompany}
                  </td>
                </tr>

                {/* Vessel & Voyage */}
                <tr className="border-b border-slate-300">
                  <td className="py-1.5 px-2.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    Vessel / Voyage
                  </td>
                  <td className="py-1.5 px-2.5 text-slate-900">
                    <span className="font-semibold">{booking.vessel}</span>
                    <span className="text-slate-500 mx-2">/</span>
                    <span className="font-mono font-semibold">{booking.voyage}</span>
                  </td>
                </tr>

                {/* Schedule Dates: CY Cut Open, Doc CY Cut, CY Cut Off */}
                <tr className="border-b border-slate-300">
                  <td className="py-1.5 px-2.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    CY Cut Open / Doc CY Cut / Cut Off
                  </td>
                  <td className="py-1.5 px-2.5 text-slate-900">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <div>
                        <span className="text-slate-600 font-medium">CY Cut Open:</span>{' '}
                        <span className="font-bold text-emerald-800">
                          {booking.cyCutOpen || booking.cyOpenDate || '—'}
                        </span>
                      </div>
                      <span className="text-slate-300">|</span>
                      <div>
                        <span className="text-slate-600 font-medium">Doc CY Cut:</span>{' '}
                        <span className="font-bold text-amber-800">
                          {booking.docCyCut || '—'}
                        </span>
                      </div>
                      <span className="text-slate-300">|</span>
                      <div>
                        <span className="text-slate-600 font-medium">CY Cut Off:</span>{' '}
                        <span className="font-bold text-rose-700">
                          {booking.cyCutDate || '—'}
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>

                {/* ETD & ETA */}
                <tr className="border-b border-slate-300">
                  <td className="py-1.5 px-2.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    ETD / ETA
                  </td>
                  <td className="py-1.5 px-2.5 text-slate-900">
                    <span className="font-semibold">ETD: {booking.etd || '—'}</span>
                    <span className="text-slate-400 mx-2">|</span>
                    <span className="font-semibold">ETA: {booking.eta || '—'}</span>
                  </td>
                </tr>

                {/* POR & POL */}
                <tr className="border-b border-slate-300">
                  <td className="py-1.5 px-2.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    POR / POL
                  </td>
                  <td className="py-1.5 px-2.5 text-slate-900">
                    <span>{booking.por || '—'}</span>
                    <span className="text-slate-400 mx-2">→</span>
                    <span className="font-semibold">{booking.pol || '—'}</span>
                  </td>
                </tr>

                {/* POD & FPOD (Manual Free-form Port Entries) */}
                <tr className="border-b border-slate-300">
                  <td className="py-1.5 px-2.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    POD / FPOD (Discharge Ports)
                  </td>
                  <td className="py-1.5 px-2.5 text-slate-900">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <div>
                        <span className="text-slate-500 font-medium">POD:</span>{' '}
                        <span className="font-bold text-sky-900">{booking.pod || '—'}</span>
                      </div>
                      {booking.fpod && (
                        <>
                          <span className="text-slate-400">→</span>
                          <div>
                            <span className="text-slate-500 font-medium">FPOD:</span>{' '}
                            <span className="font-bold text-purple-950 font-mono">{booking.fpod}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Cargo Volume & Size */}
                <tr className="border-b border-slate-300">
                  <td className="py-1.5 px-2.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    Cargo Volume &amp; Size
                  </td>
                  <td className="py-1.5 px-2.5 text-slate-900">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sky-950 text-xs">
                        {booking.containerCount ? `${booking.containerCount} X ${booking.containerSize || "40' HC"}` : (booking.cargoVolumeSize || "1 X 40' HC")}
                      </span>
                      {booking.containerCount && booking.containerCount > 1 && (
                        <span className="px-2 py-0.5 bg-sky-100 text-sky-800 text-[10.5px] font-bold rounded border border-sky-200">
                          {booking.containerCount} CONTAINERS
                        </span>
                      )}
                    </div>
                    {booking.containerNumbers && (
                      <div className="mt-1 text-[11px] font-mono text-slate-800">
                        <span className="font-sans font-bold text-slate-600">Container Nos: </span>
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-semibold tracking-wide">
                          {booking.containerNumbers}
                        </span>
                      </div>
                    )}
                    {booking.sealNumbers && (
                      <div className="mt-0.5 text-[10.5px] font-mono text-slate-800">
                        <span className="font-sans font-bold text-slate-600">Seal No(s): </span>
                        <span className="font-semibold text-sky-950">{booking.sealNumbers}</span>
                      </div>
                    )}
                    {(booking.grossWeightKg || booking.measurementCbm) && (
                      <div className="mt-0.5 text-[10px] text-slate-700 flex flex-wrap gap-3 font-mono">
                        {booking.grossWeightKg && (
                          <span><strong className="font-sans text-slate-600">Gross Wt:</strong> {booking.grossWeightKg}</span>
                        )}
                        {booking.measurementCbm && (
                          <span><strong className="font-sans text-slate-600">Volume:</strong> {booking.measurementCbm}</span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>

                {/* Commodity */}
                <tr className="border-b border-slate-300">
                  <td className="py-1.5 px-2.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    Commodity
                  </td>
                  <td className="py-1.5 px-2.5 font-semibold text-slate-900">
                    {booking.commodity || 'USED VEHICLES'}
                  </td>
                </tr>

                {/* B/L Type */}
                <tr className="border-b border-slate-300">
                  <td className="py-1.5 px-2.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    B/L Type
                  </td>
                  <td className="py-1.5 px-2.5 text-slate-900">
                    <span className="font-semibold">{booking.blType || 'ORIGINAL'}</span>
                    {booking.blDescription && (
                      <span className="text-slate-500 ml-2">({booking.blDescription})</span>
                    )}
                  </td>
                </tr>

                {/* FREIGHT */}
                <tr className="border-b border-slate-300">
                  <td className="py-1.5 px-2.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    FREIGHT
                  </td>
                  <td className="py-1.5 px-2.5 font-bold text-slate-900">
                    {booking.freightTerm || 'PREPAID'}
                  </td>
                </tr>

                {/* BL Issue Place */}
                <tr>
                  <td className="py-1.5 px-2.5 font-bold bg-slate-100 border-r border-slate-300 text-slate-800">
                    BL Issue Place
                  </td>
                  <td className="py-1.5 px-2.5 text-slate-900">
                    {booking.blIssuePlace || 'TOKYO, JAPAN'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Remarks Section */}
          <div className="mt-2 p-2 bg-slate-50 border border-slate-300 text-[11px] leading-relaxed rounded-xs">
            <span className="font-bold text-slate-900">Remarks : </span>
            <span className="text-slate-700">{booking.remarks || 'None'}</span>
          </div>

          {/* Note Box */}
          <div className="mt-2 p-2 bg-amber-50/80 border border-amber-200 text-[10.5px] text-amber-950 leading-relaxed rounded-xs">
            <div className="font-bold text-amber-900 mb-0.5">Important Instructions :</div>
            <div>{booking.note || 'KINDLY SEND US D/R(ACL) AND S/I ONE DAY PRIOR OF CY CUT DATE TO AVOID ANY PENALTY.'}</div>
            <div className="mt-0.5 font-mono text-[10px] text-amber-900">
              DOCUMENT CUTOFF / FAX: {company.fax} · TEL: {company.phone} · EMAIL: {company.email}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-3 pt-2 border-t border-slate-300 flex justify-between items-end text-[9.5px] text-slate-500">
          <div>
            <div className="font-semibold text-slate-700">{company.companyNameEn} · Logistics Department</div>
            <div>This document is electronically generated and valid without a handwritten signature.</div>
          </div>
          <div className="text-right">
            <div className="font-mono">Ref: {booking.bookingNumber}</div>
            <div>Print Date: {new Date().toLocaleDateString('ja-JP')}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};
