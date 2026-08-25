import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FileText, 
  Calendar, 
  TrendingUp, 
  Hash, 
  Plus, 
  Eye, 
  Edit, 
  Printer, 
  Download, 
  Trash2 
} from 'lucide-react';
import { getChallans, deleteChallan } from '../utils/storage';
import { formatCurrency } from '../utils/calculations';
import StatCard from '../components/StatCard';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Dashboard({ triggerDirectPrint, triggerPdfDownload }) {
  const navigate = useNavigate();
  const [challans, setChallans] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteNo, setDeleteNo] = useState('');

  useEffect(() => {
    setChallans(getChallans());
  }, []);

  // Compute stats
  const totalChallansCount = challans.length;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todayChallansCount = challans.filter(c => c.date === todayStr).length;

  const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
  const thisMonthChallansCount = challans.filter(c => c.date && c.date.startsWith(currentMonthStr)).length;

  // Get last challan number
  const getLastChallanNumber = () => {
    if (challans.length === 0) return 'None';
    // Sort by challanNumber or date descending
    const sorted = [...challans].sort((a, b) => b.challanNumber.localeCompare(a.challanNumber));
    return sorted[0].challanNumber;
  };

  const handleEdit = (id) => {
    navigate(`/edit/${id}`);
  };

  const handleOpenDelete = (id, challanNo) => {
    setDeleteId(id);
    setDeleteNo(challanNo);
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      deleteChallan(deleteId);
      setChallans(getChallans()); // reload
      setDeleteId(null);
      setDeleteNo('');
    }
  };

  // Trim customer text for table display
  const getCustomerName = (custString) => {
    if (!custString) return '';
    return custString.split('\n')[0];
  };

  // Summarize products list
  const getProductsSummary = (products = []) => {
    if (products.length === 0) return 'No items';
    const names = products.map(p => p.name).filter(Boolean);
    if (names.length === 1) return names[0];
    return `${names[0]} (+${names.length - 1} more)`;
  };

  // Get recent 5 challans sorted by date descending
  const recentChallans = [...challans]
    .sort((a, b) => new Date(b.date + 'T00:00:00') - new Date(a.date + 'T00:00:00') || b.challanNumber.localeCompare(a.challanNumber))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Dashboard Overview</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Welcome to the TEKPOWER ENERGY SOLUTIONS challan manager.
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

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          title="Total Challans" 
          value={totalChallansCount} 
          icon={FileText} 
          description="Total generated in local database"
          colorClass="border-slate-200 bg-white"
        />
        <StatCard 
          title="Today's Challans" 
          value={todayChallansCount} 
          icon={Calendar} 
          description="Created today"
          colorClass="border-blue-100 bg-blue-50/20"
        />
        <StatCard 
          title="This Month" 
          value={thisMonthChallansCount} 
          icon={TrendingUp} 
          description="Created in current month"
          colorClass="border-amber-100 bg-amber-50/25"
        />
        <StatCard 
          title="Last Challan No" 
          value={getLastChallanNumber()} 
          icon={Hash} 
          description="Highest index generated"
          colorClass="border-emerald-100 bg-emerald-50/20"
        />
      </div>

      {/* Recent Challans Panel */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
          <div>
            <h2 className="text-base font-bold text-slate-800">Recent Delivery Challans</h2>
            <p className="text-xs text-slate-500">Quick view of the last 5 created documents</p>
          </div>
          <Link
            to="/challans"
            className="text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline"
          >
            View All Challans &rarr;
          </Link>
        </div>

        {recentChallans.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold text-slate-400">No delivery challans generated yet.</p>
            <Link
              to="/new"
              className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline"
            >
              Create your first challan &rarr;
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <th className="py-3 px-6 w-[12%]">Challan No</th>
                  <th className="py-3 px-6 w-[12%]">Date</th>
                  <th className="py-3 px-6 w-[28%]">Customer / Receiver</th>
                  <th className="py-3 px-6 w-[22%]">Products / Items</th>
                  <th className="py-3 px-6 w-[14%] text-right">Total Amount</th>
                  <th className="py-3 px-6 w-[12%] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium">
                {recentChallans.map((challan) => (
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
                    
                    {/* Action buttons */}
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/view/${challan.id}`}
                          className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                          title="View detailed A4"
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          onClick={() => handleEdit(challan.id)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                          title="Edit details"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => triggerDirectPrint(challan)}
                          className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="Direct Print"
                        >
                          <Printer size={16} />
                        </button>
                        <button
                          onClick={() => triggerPdfDownload(challan)}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                          title="Download PDF"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(challan.id, challan.challanNumber)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                          title="Delete challan"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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
    </div>
  );
}
