import React from 'react';
import { formatCurrency, calculateTotals } from '../utils/calculations';
import { defaultCompanyDetails } from '../data/sampleData';

export default function ChallanPreview({ challan, companyDetails, showSeal }) {
  const details = companyDetails || defaultCompanyDetails;
  const includeSeal = showSeal !== undefined ? showSeal : (challan?.includeSeal !== false);
  
  if (!challan) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        No challan data selected
      </div>
    );
  }

  // Calculate totals
  const { totalQuantity, totalAmount } = calculateTotals(challan.products || []);

  // Paginate exactly 20 rows per page
  const ROWS_PER_PAGE = 20;
  const allProducts = [...(challan.products || [])];
  
  while (allProducts.length < ROWS_PER_PAGE || allProducts.length % ROWS_PER_PAGE !== 0) {
    allProducts.push({ name: '', quantity: '', rate: '', amount: '' });
  }

  const pages = [];
  for (let i = 0; i < allProducts.length; i += ROWS_PER_PAGE) {
    pages.push(allProducts.slice(i, i + ROWS_PER_PAGE));
  }

  // Format date helper: converts YYYY-MM-DD to DD/MM/YYYY
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <div className="flex flex-col gap-8 print:gap-0 bg-transparent">
      {pages.map((pageProducts, pageIdx) => {
        const isLastPage = pageIdx === pages.length - 1;
        const startIdx = pageIdx * ROWS_PER_PAGE;

        return (
          <div 
            key={pageIdx}
            id={isLastPage ? "challan-print-area" : undefined}
            className="challan-a4-preview flex flex-col justify-between text-black relative select-none print:m-0 print:shadow-none shadow-2xl overflow-hidden bg-white"
            style={{ pageBreakAfter: isLastPage ? 'auto' : 'always' }}
          >
            {/* Cancelled Watermark Stamp */}
            {challan.status === 'Cancelled' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 select-none overflow-hidden">
                <div className="border-[8px] border-red-600/30 rounded-2xl px-12 py-4 text-red-600/30 text-7xl font-black tracking-widest uppercase transform -rotate-12 border-double">
                  Cancelled
                </div>
              </div>
            )}
            <div>
              {/* 1. Header */}
              <div className="flex justify-between items-start">
                {/* Logo Section */}
                <div className="w-[42%] flex flex-col pt-1">
                  <img 
                    src="/logo.png" 
                    alt="TEK POWER Logo" 
                    style={{ height: '58px', width: 'auto', display: 'block' }}
                    className="object-contain self-start"
                  />
                </div>

                {/* Company Details Section */}
                <div className="w-[58%] text-right font-sans">
                  <h1 className="text-xl font-extrabold text-[#d32f2f] uppercase tracking-wide leading-none mb-1">
                    {details.companyName}
                  </h1>
                  <p className="text-[10px] text-slate-800 leading-tight font-semibold whitespace-pre-line">
                    {details.address}
                  </p>
                  <div className="mt-1.5 space-y-0.5 text-[10px] text-slate-900 font-bold">
                    <p>GSTN No: <span className="font-mono">{details.gstNumber}</span></p>
                    <p>Mobile No: {details.mobileNumber}</p>
                    <p>Phone: {details.phoneNumber}</p>
                  </div>
                </div>
              </div>

              {/* Delivery Challan Title Capsule */}
              <div className="my-3 text-center">
                <span className="inline-block border-2 border-slate-900 rounded-full px-8 py-0.5 text-xs font-black uppercase tracking-widest bg-white">
                  Delivery Challan
                </span>
              </div>

              {/* 2. Customer & Challan Metadata Boxes */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Receiver Address Box */}
                <div className="border border-slate-900 rounded-xl p-3 min-h-[110px] flex flex-col">
                  <span className="text-[11px] font-extrabold text-slate-800 block mb-1">To :</span>
                  <span className="text-xs font-semibold whitespace-pre-wrap leading-tight text-slate-950 flex-1">
                    {challan.customer}
                  </span>
                </div>

                {/* Challan Metadata Box */}
                <div className="border border-slate-900 rounded-xl p-3 min-h-[110px] flex flex-col justify-center space-y-2">
                  <div>
                    <span className="text-[11px] font-extrabold text-slate-800">DC No.: </span>
                    <span className="text-xs font-bold text-slate-950">{challan.challanNumber}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-extrabold text-slate-800">Date : </span>
                    <span className="text-xs font-bold text-slate-950">{formatDate(challan.date)}</span>
                  </div>
                  {challan.vehicleNumber && (
                    <div>
                      <span className="text-[11px] font-extrabold text-slate-800">Vehicle No: </span>
                      <span className="text-xs font-bold text-slate-950">{challan.vehicleNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Product Entry Table */}
              <div className="bg-white">
                <table className="w-full text-left border-collapse table-fixed border border-slate-900">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-900">
                      <th className="w-[8%] py-1.5 px-2 border-r border-b border-slate-900 text-center">S.No</th>
                      <th className="w-[52%] py-1.5 px-3 border-r border-b border-slate-900 text-left">Products</th>
                      <th className="w-[12%] py-1.5 px-2 border-r border-b border-slate-900 text-right">Quantity</th>
                      <th className="w-[14%] py-1.5 px-2 border-r border-b border-slate-900 text-right">Rate</th>
                      <th className="w-[14%] py-1.5 px-2 border-b border-slate-900 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageProducts.map((prod, idx) => {
                      const isPlaceholder = !prod.name;
                      const globalIdx = startIdx + idx + 1;
                      return (
                        <tr 
                          key={idx} 
                          className={`text-[11px] font-semibold ${isPlaceholder ? 'h-[25px]' : 'min-h-[25px]'}`}
                        >
                          <td className={`py-1 px-2 border-r border-slate-900 text-center text-slate-500 font-mono align-middle ${!isPlaceholder ? 'border-b border-slate-900' : ''}`}>
                            {!isPlaceholder ? globalIdx : ''}
                          </td>
                          <td className={`py-1 px-3 border-r border-slate-900 break-words whitespace-normal leading-tight text-slate-900 font-medium align-middle ${!isPlaceholder ? 'border-b border-slate-900' : ''}`}>
                            {prod.name}
                          </td>
                          <td className={`py-1 px-2 border-r border-slate-900 text-right font-mono text-slate-900 align-middle ${!isPlaceholder ? 'border-b border-slate-900' : ''}`}>
                            {!isPlaceholder ? (parseFloat(prod.quantity) > 0 ? `${prod.quantity} ${prod.unit || ''}` : '') : ''}
                          </td>
                          <td className={`py-1 px-2 border-r border-slate-900 text-right font-mono text-slate-900 align-middle ${!isPlaceholder ? 'border-b border-slate-900' : ''}`}>
                            {!isPlaceholder ? (prod.rate !== undefined && prod.rate !== '' && !isNaN(parseFloat(prod.rate)) && parseFloat(prod.rate) > 0 ? parseFloat(prod.rate).toFixed(2) : (parseFloat(prod.quantity) > 0 ? '0.00' : '')) : ''}
                          </td>
                          <td className={`py-1 px-2 text-right font-mono text-slate-900 align-middle ${!isPlaceholder ? 'border-b border-slate-900' : ''}`}>
                            {!isPlaceholder ? (prod.amount !== undefined && prod.amount !== '' && !isNaN(parseFloat(prod.amount)) ? parseFloat(prod.amount).toFixed(2) : '0.00') : ''}
                          </td>
                        </tr>
                      );
                    })}
                    
                    {/* Total Calculation Row only on last page */}
                    {isLastPage && (
                      <tr className="bg-slate-50 text-[11px] font-black uppercase tracking-wide h-[32px]">
                        <td colSpan="2" className="py-1.5 px-3 border-t border-b border-r border-slate-900 text-right font-bold text-slate-800">
                          TOTAL
                        </td>
                        <td className="py-1.5 px-2 border-t border-b border-r border-slate-900 text-right font-mono text-slate-900">
                          {totalQuantity}
                        </td>
                        <td className="py-1.5 px-2 border-t border-b border-r border-slate-900"></td>
                        <td className="py-1.5 px-2 border-t border-b border-slate-900 text-right font-mono text-slate-950 font-black">
                          {formatCurrency(totalAmount)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Section */}
            {isLastPage ? (
              <div className="flex flex-col">
                {/* Description / Notes Box */}
                <div className="mt-3 px-2 border border-slate-300 rounded-lg bg-slate-50/50 flex flex-col min-h-[50px]">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider pt-2 block">
                    Remarks / Description:
                  </span>
                  <div className="w-full bg-transparent border-none text-xs text-slate-900 font-bold p-0 py-1 whitespace-pre-wrap">
                    {challan.remarks || ""}
                  </div>
                </div>

                {/* 4. Bottom Footer Signatures */}
                <div className="mt-3 mb-1">
                  <div className="flex justify-between items-end mb-1">
                    {/* Left signature */}
                    <div className="w-1/3">
                      <div className="text-[10px] font-extrabold text-slate-700 uppercase">Received By :</div>
                      <div className="h-8 border-b border-dashed border-slate-400 mt-2 w-4/5"></div>
                      <div className="text-[8px] text-slate-500 mt-1 italic">(Name & Signature)</div>
                    </div>
                    
                    {/* Right signature */}
                    <div className="w-1/2 text-right relative">
                      <span className="text-[9px] font-bold text-slate-600 block leading-none">For</span>
                      <span className="text-xs font-black text-[#d32f2f] uppercase leading-none block mt-1 tracking-wider">
                        {details.companyName}
                      </span>
                      <div className="h-8 mt-2 relative">
                        {includeSeal && (
                          <img 
                            src="/seal.png" 
                            alt="Company Seal" 
                            className="absolute -top-2.5 right-[135px] h-16 w-16 object-contain opacity-90 pointer-events-none select-none" 
                          />
                        )}
                      </div>
                      <div className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">
                        Authorised Signatory
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1"></div>
            )}

            {/* Bottom tag tagline banner - ON EVERY PAGE */}
            <div className="bg-slate-900 text-white text-center py-2.5 rounded-lg border border-slate-800 mt-auto">
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                {details.footerTagline}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
