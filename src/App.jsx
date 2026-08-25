import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Menu, FileSpreadsheet, Loader } from 'lucide-react';

// Components
import Sidebar from './components/Sidebar';
import ChallanPreview from './components/ChallanPreview';

// Pages
import Dashboard from './pages/Dashboard';
import NewChallan from './pages/NewChallan';
import Challans from './pages/Challans';
import ChallanDetails from './pages/ChallanDetails';
import Settings from './pages/Settings';

// Utilities
import { 
  getCompanyDetails, 
  createChallan, 
  updateChallan,
  getChallans
} from './utils/storage';
import { downloadChallanPDF } from './utils/pdfGenerator';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [companyDetails, setCompanyDetails] = useState(null);
  
  // Printing states
  const [printingChallan, setPrintingChallan] = useState(null);
  const [isPdfProcessing, setIsPdfProcessing] = useState(false);

  // Load company details on startup
  useEffect(() => {
    setCompanyDetails(getCompanyDetails());
  }, []);

  // Sync mobile sidebar state with routing
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  // Save/Update handler
  const handleSaveChallan = (formData, id, printAfterSave) => {
    let savedChallan;
    if (id) {
      // Edit mode
      savedChallan = updateChallan(id, formData);
    } else {
      // Create mode
      savedChallan = createChallan(formData);
    }

    if (printAfterSave) {
      // Set to print mount and trigger print
      setPrintingChallan(savedChallan);
      setTimeout(() => {
        window.print();
        navigate(`/view/${savedChallan.id}`);
      }, 150);
    } else {
      navigate(`/view/${savedChallan.id}`);
    }
  };

  // Direct Print Trigger
  const triggerDirectPrint = (challan) => {
    setPrintingChallan(challan);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Direct PDF Download Trigger
  const triggerPdfDownload = async (challan) => {
    setIsPdfProcessing(true);
    try {
      await downloadChallanPDF(challan, companyDetails);
    } catch (error) {
      console.error("PDF Download failed:", error);
      alert("An error occurred while generating the PDF. Please try again.");
    } finally {
      setIsPdfProcessing(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-800 font-sans">
      {/* 1. Sidebar Component (drawer on mobile, sticky sidebar on desktop) */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        companyName={companyDetails?.companyName}
      />

      {/* 2. Main Content Frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:hidden">
        {/* Top Header bar for mobile screen drawer toggling */}
        <header className="lg:hidden shrink-0 flex items-center justify-between px-6 py-4 bg-[#1e293b] text-white shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 hover:bg-slate-800 rounded transition-colors cursor-pointer"
              aria-label="Open sidebar menu"
            >
              <Menu size={20} />
            </button>
            <div className="bg-white px-2 py-1 rounded flex items-center justify-center shadow-sm">
              <img src="/logo.png" alt="TEK POWER Logo" className="h-5 w-auto object-contain" />
            </div>
          </div>
          <div className="text-xs text-slate-400 font-semibold">Challan Generator</div>
        </header>

        {/* Primary Page Canvas (Scrollable) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route 
              path="/" 
              element={
                <Dashboard 
                  triggerDirectPrint={triggerDirectPrint} 
                  triggerPdfDownload={triggerPdfDownload} 
                />
              } 
            />
            <Route 
              path="/new" 
              element={<NewChallan onSave={handleSaveChallan} />} 
            />
            <Route 
              path="/edit/:id" 
              element={<NewChallan onSave={handleSaveChallan} />} 
            />
            <Route 
              path="/challans" 
              element={
                <Challans 
                  triggerDirectPrint={triggerDirectPrint} 
                  triggerPdfDownload={triggerPdfDownload} 
                />
              } 
            />
            <Route 
              path="/view/:id" 
              element={
                <ChallanDetails 
                  companyDetails={companyDetails}
                  triggerDirectPrint={triggerDirectPrint}
                  triggerPdfDownload={triggerPdfDownload}
                />
              } 
            />
            <Route 
              path="/settings" 
              element={<Settings onUpdateDetails={(details) => setCompanyDetails(details)} />} 
            />
          </Routes>
        </main>
      </div>

      {/* 3. Global Print Mount (ONLY visible in @media print or positioned off-screen for html2canvas PDF rendering) */}
      {printingChallan && (
        <div id="print-mount" className="absolute -left-[9999px] top-0 print:left-0 print:relative">
          <ChallanPreview challan={printingChallan} companyDetails={companyDetails} />
        </div>
      )}

      {/* 4. Global PDF Processing Loader Overlay */}
      {isPdfProcessing && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xl flex flex-col items-center gap-3">
            <Loader className="animate-spin text-blue-700" size={28} />
            <div className="text-sm font-bold text-slate-800">Generating PDF...</div>
            <div className="text-xs text-slate-500 font-medium">Please wait while we render the challan.</div>
          </div>
        </div>
      )}
    </div>
  );
}
