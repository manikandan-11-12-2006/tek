import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Trash2, 
  Edit, 
  Eye, 
  Copy, 
  Printer, 
  Download, 
  Plus,
  ArrowUpDown,
  Calendar,
  Ban,
  RotateCcw
} from 'lucide-react';
import { getChallans, deleteChallan, duplicateChallan, updateChallan } from '../utils/storage';
import { formatCurrency } from '../utils/calculations';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Challans({ triggerDirectPrint, triggerPdfDownload, isLoggedIn, userRole }) {
  const navigate = useNavigate();
  const [challans, setChallans] = useState([]);
  
  // Search, Filter, Sort States
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month, custom
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  
  // Modal Delete state
  const [deleteId, setDeleteId] = useState(null);
  const [deleteNo, setDeleteNo] = useState('');
  const [cancelId, setCancelId] = useState(null);
  const [cancelNo, setCancelNo] = useState('');

  const fetchChallans = async () => {
    const data = await getChallans();
    setChallans(data);
  };

  useEffect(() => {
    fetchChallans();
  }, []);

  const handleDuplicate = async (id) => {
    const newChallan = await duplicateChallan(id);
    if (newChallan) {
      await fetchChallans(); // reload
      alert(`Challan duplicated as ${newChallan.challanNumber}`);
      navigate(`/view/${newChallan.id}`);
    } else {
      alert("Failed to duplicate challan.");
    }
  };

  const handleOpenDelete = (id, dcNo) => {
    setDeleteId(id);
    setDeleteNo(dcNo);
  };

  const handleConfirmDelete = async () => {
    if (deleteId) {
      await deleteChallan(deleteId);
      await fetchChallans();
      setDeleteId(null);
      setDeleteNo('');
    }
  };

  const handleOpenCancel = (id, challanNo) => {
    setCancelId(id);
    setCancelNo(challanNo);
  };

  const handleConfirmCancel = async () => {
    if (cancelId) {
      await updateChallan(cancelId, { status: 'Cancelled' });
      await fetchChallans(); // reload
      setCancelId(null);
      setCancelNo('');
    }
  };

  const handleReactivate = async (id) => {
    await updateChallan(id, { status: 'Active' });
    await fetchChallans(); // reload
  };

  // Filter & Sort implementation
  const filteredChallans = challans
    .filter(c => {
      // 1. Search filter
      const term = searchTerm.toLowerCase().trim();
      if (!term) return true;
      
      const matchNo = c.challanNumber.toLowerCase().includes(term);
      const matchCustomer = c.customer.toLowerCase().includes(term);
      const matchProducts = c.products.some(p => p.name.toLowerCase().includes(term));
      
      return matchNo || matchCustomer || matchProducts;
    })
    .filter(c => {
      // 2. Date filter
      if (dateFilter === 'all') return true;
      if (!c.date) return false;
      
      const today = new Date();
      today.setHours(0,0,0,0);
      const todayStr = today.toISOString().split('T')[0];
      
      const challanDate = new Date(c.date + 'T00:00:00');
      
      switch (dateFilter) {
        case 'today':
          return c.date === todayStr;
        case 'week': {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(today.getDate() - 7);
          oneWeekAgo.setHours(0,0,0,0);
          return challanDate >= oneWeekAgo && challanDate <= today;
        }
        case 'month': {
          const currentMonthPrefix = todayStr.substring(0, 7); // YYYY-MM
          return c.date.startsWith(currentMonthPrefix);
        }
        case 'custom': {
          if (customStart && customEnd) {
            return c.date >= customStart && c.date <= customEnd;
          }
          if (customStart) {
            return c.date >= customStart;
          }
          if (customEnd) {
            return c.date <= customEnd;
          }
          return true;
        }
        default:
          return true;
      }
    })
    .sort((a, b) => {
      // 3. Sorting implementation
      switch (sortBy) {
        case 'latest':
          return new Date(b.date + 'T00:00:00') - new Date(a.date + 'T00:00:00') || b.challanNumber.localeCompare(a.challanNumber);
        case 'oldest':
          return new Date(a.date + 'T00:00:00') - new Date(b.date + 'T00:00:00') || a.challanNumber.localeCompare(b.challanNumber);
        case 'no-asc':
          return a.challanNumber.localeCompare(b.challanNumber);
        case 'no-desc':
          return b.challanNumber.localeCompare(a.challanNumber);
        case 'amount-desc':
          return b.totalAmount - a.totalAmount;
        case 'amount-asc':
          return a.totalAmount - b.totalAmount;
        default:
          return 0;
      }
    });

  // UI Helpers
  const getCustomerName = (addressText) => {
    return addressText ? addressText.split('\n')[0] : '';
  };

  const getProductsSummary = (products = []) => {
    if (products.length === 0) return 'No items';
    const names = products.map(p => p.name).filter(Boolean);
    if (names.length === 1) return names[0];
    return `${names[0]} (+${names.length - 1} items)`;
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Delivery Challans Archive</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Search, filter, print, duplicate and manage all generated challans.
          </p>
        </div>
        <Link
          to="/new"
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold shadow-md shadow-blue-700/10 transition-all cursor-pointer"
        >
          <Plus size={16} />
          Create New Challan
        </Link>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Search box */}
          <div className="relative md:col-span-1 lg:col-span-2">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by DC No, Customer, or Product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-sm font-medium pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700"
            />
          </div>

          {/* Date range filter */}
          <div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full text-sm font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white cursor-pointer"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">Past 7 Days</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Sort selection */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full text-sm font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white cursor-pointer"
            >
              <option value="latest">Sort: Latest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="no-asc">Sort: DC No (Asc)</option>
              <option value="no-desc">Sort: DC No (Desc)</option>
              <option value="amount-desc">Sort: Amount (High-Low)</option>
              <option value="amount-asc">Sort: Amount (Low-High)</option>
            </select>
          </div>
        </div>

        {/* Custom date range boxes (visible only if custom selected) */}
        {dateFilter === 'custom' && (
          <div className="flex flex-wrap items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 animate-slide-down">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date range:</span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="text-xs font-semibold px-3 py-1.5 border border-slate-200 rounded-md bg-white"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="text-xs font-semibold px-3 py-1.5 border border-slate-200 rounded-md bg-white"
              />
            </div>
            {(customStart || customEnd) && (
              <button
                onClick={() => { setCustomStart(''); setCustomEnd(''); }}
                className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
              >
                Clear Range
              </button>
            )}
          </div>
        )}
      </div>

      {/* Challans Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredChallans.length === 0 ? (
          <div className="p-16 text-center">
            <Calendar className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="text-base font-bold text-slate-800">No delivery challans found</h3>
            <p className="text-sm font-medium text-slate-400 mt-1 max-w-md mx-auto">
              {searchTerm || dateFilter !== 'all' 
                ? "No records matched your search term or date filters. Reset your filters and try again."
                : "Generate your first delivery challan to begin digitising your shipping."}
            </p>
            {!searchTerm && dateFilter === 'all' && (
              <Link
                to="/new"
                className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
              >
                Create New Challan
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="py-3 px-6 w-[11%]">Challan No</th>
                  <th className="py-3 px-6 w-[11%]">Date</th>
                  <th className="py-3 px-6 w-[24%]">Customer / Receiver</th>
                  <th className="py-3 px-6 w-[20%]">Products / Items</th>
                  <th className="py-3 px-6 w-[12%] text-right">Total Amount</th>
                  <th className="py-3 px-6 w-[10%] text-center">Status</th>
                  <th className="py-3 px-6 w-[12%] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium">
                {filteredChallans.map((challan) => (
                  <tr key={challan.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Challan No */}
                    <td className="py-4 px-6 font-bold text-blue-900 font-mono">
                      {challan.challanNumber}
                    </td>
                    
                    {/* Date */}
                    <td className="py-4 px-6 text-slate-500 font-mono text-xs">
                      {challan.date ? challan.date.split('-').reverse().join('/') : ''}
                    </td>
                    
                    {/* Customer */}
                    <td className="py-4 px-6 font-semibold text-slate-800 truncate max-w-[200px]" title={challan.customer}>
                      {getCustomerName(challan.customer)}
                    </td>
                    
                    {/* Items */}
                    <td className="py-4 px-6 text-slate-600 truncate max-w-[180px]" title={challan.products.map(p => p.name).join(', ')}>
                      {getProductsSummary(challan.products)}
                    </td>
                    
                    {/* Total Amount */}
                    <td className="py-4 px-6 text-right font-bold text-slate-900 font-mono">
                      {formatCurrency(challan.totalAmount)}
                    </td>
                    
                    {/* Status */}
                    <td className="py-4 px-6 text-center">
                      {challan.status === 'Cancelled' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100 font-sans">
                          Cancelled
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 font-sans">
                          Active
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4">
                      {(() => {
                        const targetId = challan.id || challan.challanNumber;
                        return (
                          <div className="flex flex-col items-center gap-1.5">
                            <div className="flex items-center gap-1.5 justify-center">
                              <Link
                                to={`/view/${targetId}`}
                                className="p-1 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                                title="View detailed A4"
                              >
                                <Eye size={15} />
                              </Link>
                              <button
                                onClick={() => navigate(`/edit/${targetId}`)}
                                className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                                title="Edit details"
                                disabled={!isLoggedIn || userRole !== 'admin' || challan.status === 'Cancelled'}
                                style={{ opacity: (!isLoggedIn || userRole !== 'admin' || challan.status === 'Cancelled') ? 0.35 : 1, cursor: (!isLoggedIn || userRole !== 'admin' || challan.status === 'Cancelled') ? 'not-allowed' : 'pointer' }}
                              >
                                <Edit size={15} />
                              </button>
                              <button
                                onClick={() => handleDuplicate(targetId)}
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                                title="Duplicate challan"
                                disabled={!isLoggedIn}
                                style={{ opacity: !isLoggedIn ? 0.35 : 1, cursor: !isLoggedIn ? 'not-allowed' : 'pointer' }}
                              >
                                <Copy size={15} />
                              </button>
                              <button
                                onClick={() => triggerDirectPrint(challan)}
                                className="p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                title="Direct Print"
                              >
                                <Printer size={15} />
                              </button>
                              <button
                                onClick={() => triggerPdfDownload(challan)}
                                className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                                title="Download PDF"
                              >
                                <Download size={15} />
                              </button>
                            </div>
                            
                            <div className="flex items-center gap-2 border-t border-slate-100 pt-1.5 w-full justify-center">
                              {challan.status === 'Cancelled' ? (
                                <button
                                  onClick={() => handleReactivate(targetId)}
                                  className="px-2 py-0.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-extrabold uppercase bg-emerald-50/20"
                                  title="Reactivate Challan"
                                  disabled={!isLoggedIn || userRole !== 'admin'}
                                  style={{ opacity: (!isLoggedIn || userRole !== 'admin') ? 0.35 : 1, cursor: (!isLoggedIn || userRole !== 'admin') ? 'not-allowed' : 'pointer' }}
                                >
                                  <RotateCcw size={11} />
                                  <span>Reactivate</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleOpenCancel(targetId, challan.challanNumber)}
                                  className="px-2 py-0.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded border border-red-200 transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-extrabold uppercase bg-red-50/20"
                                  title="Cancel Challan"
                                  disabled={!isLoggedIn || userRole !== 'admin'}
                                  style={{ opacity: (!isLoggedIn || userRole !== 'admin') ? 0.35 : 1, cursor: (!isLoggedIn || userRole !== 'admin') ? 'not-allowed' : 'pointer' }}
                                >
                                  <Ban size={11} />
                                  <span>Cancel</span>
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenDelete(targetId, challan.challanNumber)}
                                className="px-2 py-0.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded border border-red-200 transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-extrabold uppercase bg-red-50/20"
                                title="Delete challan"
                                disabled={!isLoggedIn || userRole !== 'admin'}
                                style={{ opacity: (!isLoggedIn || userRole !== 'admin') ? 0.35 : 1, cursor: (!isLoggedIn || userRole !== 'admin') ? 'not-allowed' : 'pointer' }}
                              >
                                <Trash2 size={11} />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog 
        isOpen={deleteId !== null}
        title="Delete Delivery Challan?"
        message={`Are you sure you want to delete ${deleteNo}? This action cannot be undone and will remove it from LocalStorage.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteId(null);
          setDeleteNo('');
        }}
      />

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog 
        isOpen={cancelId !== null}
        title="Cancel Delivery Challan?"
        message={`Are you sure you want to cancel ${cancelNo}? This will mark it as CANCELLED on the document and PDF exports.`}
        confirmText="Cancel Challan"
        cancelText="Back"
        onConfirm={handleConfirmCancel}
        onCancel={() => {
          setCancelId(null);
          setCancelNo('');
        }}
      />
    </div>
  );
}
