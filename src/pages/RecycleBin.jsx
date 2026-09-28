import React, { useState, useEffect } from 'react';
import { getRecycleBin, restoreChallan, permanentDeleteChallan } from '../utils/storage';
import { RotateCcw, Trash2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RecycleBin() {
  const [deletedItems, setDeletedItems] = useState([]);
  
  const fetchDeleted = async () => {
    const data = await getRecycleBin();
    setDeletedItems(data);
  };
  
  useEffect(() => {
    fetchDeleted();
  }, []);

  const handleRestore = async (id) => {
    const success = await restoreChallan(id);
    if (success) {
      await fetchDeleted();
    }
  };

  const handlePermanentDelete = async (id) => {
    const confirmed = window.confirm("Are you sure you want to permanently delete this challan? This cannot be undone.");
    if (confirmed) {
      await permanentDeleteChallan(id);
      await fetchDeleted();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <Link to="/challans" className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Recycle Bin</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Restore or permanently delete removed challans.</p>
        </div>
      </div>
      
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {deletedItems.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Trash2 size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-semibold text-lg">Recycle Bin is empty</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <th className="py-3 px-6">Challan No</th>
                  <th className="py-3 px-6">Customer</th>
                  <th className="py-3 px-6">Deleted At</th>
                  <th className="py-3 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium">
                {deletedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-6 font-mono text-blue-900">{item.challanNumber}</td>
                    <td className="py-3 px-6 truncate max-w-[200px]">{item.customer?.split('\n')[0]}</td>
                    <td className="py-3 px-6 text-slate-500">
                      {new Date(item.deletedAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleRestore(item.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-xs font-bold transition-colors"
                        >
                          <RotateCcw size={14} />
                          Restore
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(item.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded text-xs font-bold transition-colors"
                        >
                          <Trash2 size={14} />
                          Delete Forever
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
    </div>
  );
}
