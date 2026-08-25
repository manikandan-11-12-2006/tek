import React, { useState, useEffect } from 'react';
import { getChallans } from '../utils/storage';
import { BarChart, Calendar as CalendarIcon, Hash } from 'lucide-react';

export default function Reports() {
  const [challans, setChallans] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    // Default to current month YYYY-MM
    return new Date().toISOString().slice(0, 7);
  });

  useEffect(() => {
    setChallans(getChallans());
  }, []);

  // Filter challans for the selected month
  const monthlyChallans = challans.filter(c => c.date && c.date.startsWith(selectedMonth));
  
  // Sort them to find "from" and "to" easily
  const sortedChallans = [...monthlyChallans].sort((a, b) => a.challanNumber.localeCompare(b.challanNumber));
  
  const totalChallans = sortedChallans.length;
  const serialFrom = totalChallans > 0 ? sortedChallans[0].challanNumber : 'N/A';
  const serialTo = totalChallans > 0 ? sortedChallans[totalChallans - 1].challanNumber : 'N/A';

  // Format month for display
  const displayMonth = selectedMonth ? new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
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

      {/* Summary Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BarChart size={20} className="text-blue-700" />
            Summary for {displayMonth}
          </h2>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Total Delivery Challans */}
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex items-start gap-4">
            <div className="p-3 bg-blue-50 text-blue-700 rounded-lg shrink-0">
              <CalendarIcon size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Delivery Challans</p>
              <h3 className="text-3xl font-black text-slate-800">{totalChallans}</h3>
            </div>
          </div>

          {/* Serial Number Range */}
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex items-start gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg shrink-0">
              <Hash size={24} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Serial Number Range</p>
              {totalChallans > 0 ? (
                <div className="flex items-center justify-between mt-2">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">From</p>
                    <span className="inline-block px-3 py-1 bg-slate-100 text-slate-800 font-mono font-bold rounded-md text-sm">
                      {serialFrom}
                    </span>
                  </div>
                  <div className="text-slate-300 font-bold px-2">TO</div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">To</p>
                    <span className="inline-block px-3 py-1 bg-slate-100 text-slate-800 font-mono font-bold rounded-md text-sm">
                      {serialTo}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-sm font-semibold text-slate-400">No records found for this month.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
