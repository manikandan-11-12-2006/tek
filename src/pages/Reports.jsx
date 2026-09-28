import React, { useState, useEffect } from 'react';
import { getChallans } from '../utils/storage';
import { formatCurrency } from '../utils/calculations';
import { BarChart, Calendar as CalendarIcon, Hash, IndianRupee, Package, Printer, Download, Eye, Ban } from 'lucide-react';
import { Link } from 'react-router-dom';

import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

export default function Reports() {
  const [challans, setChallans] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return new Date().toISOString().slice(0, 7);
  });

  useEffect(() => {
    const fetchData = async () => {
      setChallans(await getChallans());
    };
    fetchData();
  }, []);

  const monthlyChallans = challans.filter(c => c.date && c.date.startsWith(selectedMonth));
  const sortedChallans = [...monthlyChallans].sort((a, b) => a.challanNumber.localeCompare(b.challanNumber));
  
  const totalChallans = sortedChallans.length;
  const serialFrom = totalChallans > 0 ? sortedChallans[0].challanNumber : 'N/A';
  const serialTo = totalChallans > 0 ? sortedChallans[totalChallans - 1].challanNumber : 'N/A';

  const totalAmount = sortedChallans.reduce((sum, c) => sum + (c.status === 'Cancelled' ? 0 : (c.totalAmount || 0)), 0);
  const totalItems = sortedChallans.reduce((sum, c) => sum + (c.status === 'Cancelled' ? 0 : (c.totalQuantity || 0)), 0);
  const cancelledCount = sortedChallans.filter(c => c.status === 'Cancelled').length;

  const displayMonth = selectedMonth ? new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '';

  const downloadReport = async () => {
    const reportElement = document.getElementById('report-content');
    if (!reportElement) return;
    
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(reportElement, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Monthly_Report_${selectedMonth}.pdf`);
    } catch (error) {
      console.error('Failed to generate report PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:hidden">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Monthly Reports</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Generate and view monthly summaries for delivery challans.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="monthPicker" className="text-sm font-bold text-slate-700">Select Month:</label>
          <input
            id="monthPicker"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-sm font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white cursor-pointer"
          />
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-end gap-3 print:hidden">
        <button 
          onClick={downloadReport}
          disabled={isDownloading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          <Download size={16} />
          {isDownloading ? 'Generating...' : 'Download PDF'}
        </button>
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-semibold shadow-sm transition-all cursor-pointer"
        >
          <Printer size={16} />
          Print Report
        </button>
      </div>

      <div id="report-content" className="space-y-6 bg-slate-50 print:bg-white">
        {/* Summary Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden print:shadow-none print:border-slate-800">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 print:bg-transparent">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BarChart size={20} className="text-blue-700" />
            Summary for {displayMonth}
          </h2>
        </div>
        
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Total Delivery Challans */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col gap-3 print:border-slate-400">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg shrink-0 print:bg-transparent print:border print:border-slate-300">
                <CalendarIcon size={20} />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Challans</p>
            </div>
            <h3 className="text-3xl font-black text-slate-800">{totalChallans}</h3>
          </div>

          {/* Cancelled Challans */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col gap-3 print:border-slate-400">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-50 text-rose-700 rounded-lg shrink-0 print:bg-transparent print:border print:border-slate-300">
                <Ban size={20} />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cancelled</p>
            </div>
            <h3 className="text-3xl font-black text-slate-800">{cancelledCount}</h3>
          </div>

          {/* Total Amount (Revenue) */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col gap-3 print:border-slate-400">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg shrink-0 print:bg-transparent print:border print:border-slate-300">
                <IndianRupee size={20} />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Value</p>
            </div>
            <h3 className="text-2xl font-black text-slate-800 font-mono truncate" title={formatCurrency(totalAmount)}>
              {formatCurrency(totalAmount)}
            </h3>
          </div>

          {/* Total Items Shipped */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col gap-3 print:border-slate-400">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-50 text-purple-700 rounded-lg shrink-0 print:bg-transparent print:border print:border-slate-300">
                <Package size={20} />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Items Shipped</p>
            </div>
            <h3 className="text-3xl font-black text-slate-800 font-mono">{totalItems}</h3>
          </div>

          {/* Serial Number Range */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col gap-3 print:border-slate-400">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg shrink-0 print:bg-transparent print:border print:border-slate-300">
                <Hash size={20} />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Serial Range</p>
            </div>
            {totalChallans > 0 ? (
              <div className="flex flex-col gap-1 mt-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">From:</span>
                  <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded print:bg-transparent print:p-0">{serialFrom}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">To:</span>
                  <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded print:bg-transparent print:p-0">{serialTo}</span>
                </div>
              </div>
            ) : (
              <div className="mt-2 text-xs font-semibold text-slate-400">No records found.</div>
            )}
          </div>
        </div>
      </div>

      {/* Challans List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden print:shadow-none print:border-slate-800">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 print:bg-transparent">
          <h2 className="text-lg font-bold text-slate-800">Challans in {displayMonth}</h2>
        </div>
        
        {sortedChallans.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium">
            No delivery challans generated in {displayMonth}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse print:text-xs">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 print:bg-transparent print:border-slate-400">
                  <th className="py-3 px-6 w-[15%]">Challan No</th>
                  <th className="py-3 px-6 w-[15%]">Date</th>
                  <th className="py-3 px-6 w-[40%]">Customer</th>
                  <th className="py-3 px-6 w-[15%] text-center">Items</th>
                  <th className="py-3 px-6 w-[15%] text-right">Amount</th>
                  <th className="py-3 px-6 w-[10%] text-center print:hidden">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                {sortedChallans.map((challan) => {
                  const isCancelled = challan.status === 'Cancelled';
                  return (
                    <tr key={challan.id} className={`hover:bg-slate-50/50 transition-colors ${isCancelled ? 'opacity-60 bg-red-50/30' : ''}`}>
                      <td className="py-3 px-6 font-bold text-blue-900 font-mono relative">
                        <span className={isCancelled ? 'line-through text-slate-400' : ''}>
                          {challan.challanNumber}
                        </span>
                        {isCancelled && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-700 print:border print:border-red-300">
                            CANCELLED
                          </span>
                        )}
                      </td>
                      <td className={`py-3 px-6 font-mono text-sm ${isCancelled ? 'text-red-400/80 line-through' : 'text-slate-500'}`}>
                        {challan.date ? challan.date.split('-').reverse().join('/') : ''}
                      </td>
                      <td className={`py-3 px-6 font-semibold truncate max-w-[200px] ${isCancelled ? 'text-red-900/60' : 'text-slate-800'}`} title={challan.customer}>
                        {challan.customer.split('\n')[0]}
                      </td>
                      <td className="py-3 px-6 text-center text-slate-600 font-mono font-medium">
                        {isCancelled ? '-' : challan.totalQuantity}
                      </td>
                      <td className="py-3 px-6 text-right font-bold text-slate-900 font-mono">
                        {isCancelled ? <span className="text-red-400/80 line-through">{formatCurrency(challan.totalAmount)}</span> : formatCurrency(challan.totalAmount)}
                      </td>
                    <td className="py-3 px-6 text-center print:hidden">
                      <Link
                        to={`/view/${challan.id}`}
                        className="inline-flex p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                        title="View Challan"
                      >
                        <Eye size={16} />
                      </Link>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
