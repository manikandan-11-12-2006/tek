import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Printer, 
  Download, 
  Edit, 
  Copy, 
  Trash2, 
  ArrowLeft,
  Loader
} from 'lucide-react';
import { getChallanById, deleteChallan, duplicateChallan } from '../utils/storage';
import ChallanPreview from '../components/ChallanPreview';
import ConfirmDialog from '../components/ConfirmDialog';

export default function ChallanDetails({ companyDetails, triggerDirectPrint, triggerPdfDownload }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [challan, setChallan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    const data = getChallanById(id);
    if (data) {
      setChallan(data);
    } else {
      alert("Challan not found!");
      navigate('/challans');
    }
    setLoading(false);
  }, [id, navigate]);

  const handleDuplicate = () => {
    const copy = duplicateChallan(challan.id);
    if (copy) {
      alert(`Challan duplicated as ${copy.challanNumber}`);
      navigate(`/view/${copy.id}`);
    } else {
      alert("Failed to duplicate challan.");
    }
  };

  const handleDelete = () => {
    const isDeleted = deleteChallan(challan.id);
    if (isDeleted) {
      setDeleteOpen(false);
      navigate('/challans');
    } else {
      alert("Failed to delete challan.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-white border rounded-xl">
        <Loader className="animate-spin text-blue-700" size={32} />
        <span className="text-sm font-semibold text-slate-500 mt-2">Loading document preview...</span>
      </div>
    );
  }

  if (!challan) return null;

  return (
    <div className="space-y-6">
      {/* View Header Control Bar */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:hidden">
        {/* Back Link */}
        <div className="flex items-center gap-3">
          <Link
            to="/challans"
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Back to archive"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
              <span>{challan.challanNumber}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 font-bold border border-blue-100 font-mono">
                {challan.date ? challan.date.split('-').reverse().join('/') : ''}
              </span>
            </h1>
            <p className="text-xs font-semibold text-slate-500">Document detailed preview and output operations</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate(`/edit/${challan.id}`)}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <Edit size={14} />
            Edit
          </button>
          
          <button
            onClick={handleDuplicate}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <Copy size={14} />
            Duplicate
          </button>

          <button
            onClick={() => setDeleteOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <Trash2 size={14} />
            Delete
          </button>

          <div className="h-6 w-px bg-slate-200 mx-1"></div>

          <button
            onClick={() => triggerPdfDownload(challan)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            <Download size={14} />
            Download PDF
          </button>

          <button
            onClick={() => triggerDirectPrint(challan)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            <Printer size={14} />
            Print Challan
          </button>
        </div>
      </div>

      {/* Centered A4 Page Sheet */}
      <div className="flex justify-center p-4 bg-slate-100/50 rounded-2xl border border-dashed border-slate-300 overflow-x-auto min-h-[310mm] print:p-0 print:border-none print:bg-white">
        <div className="shadow-2xl shadow-slate-900/10 origin-top scale-95 md:scale-100">
          <ChallanPreview challan={challan} companyDetails={companyDetails} />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog 
        isOpen={deleteOpen}
        title="Delete Delivery Challan?"
        message={`Are you sure you want to delete ${challan.challanNumber}? This action cannot be undone and will permanently remove this record.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
