import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Menu, Loader2 } from 'lucide-react';

// Components
import Sidebar from './components/Sidebar';
import ChallanPreview from './components/ChallanPreview';
import SubscriptionModal from './components/SubscriptionModal';
import SubscriptionBanner from './components/SubscriptionBanner';

// Pages
import Dashboard from './pages/Dashboard';
import NewChallan from './pages/NewChallan';
import Challans from './pages/Challans';
import ChallanDetails from './pages/ChallanDetails';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import RecycleBin from './pages/RecycleBin';

// Utilities
import { 
  getCompanyDetails, 
  createChallan, 
  updateChallan
} from './utils/storage';
import { downloadChallanPDF } from './utils/pdfGenerator';
import { checkLogin, logout, getUserRole } from './utils/auth';
import { 
  getSubscriptionStatus, 
  syncSubscriptionFromDatabase, 
  listenToSubscription 
} from './utils/razorpay';

// Route Guard component
function RequireAuth({ children, redirectTo, isLoggedIn, allowedRoles, userRole }) {
  const location = useLocation();
  if (!isLoggedIn) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [companyDetails, setCompanyDetails] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(checkLogin());
  const [userRole, setUserRole] = useState(getUserRole());

  // Subscription state
  // status: "active" | "warning" | "blocked"
  const [subStatus, setSubStatus] = useState(() => getSubscriptionStatus());
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  // Printing states
  const [printingChallan, setPrintingChallan] = useState(null);
  const [isPdfProcessing, setIsPdfProcessing] = useState(false);

  // Load company details on startup
  useEffect(() => {
    const fetchCompanyDetails = async () => {
      const details = await getCompanyDetails();
      setCompanyDetails(details);
    };
    fetchCompanyDetails();
  }, []);

  // Sync and listen to subscription status from Firebase Realtime Database
  useEffect(() => {
    syncSubscriptionFromDatabase().then(() => {
      setSubStatus(getSubscriptionStatus());
    });

    const unsubscribe = listenToSubscription((newStatus) => {
      setSubStatus(newStatus);
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  // Re-check subscription status every time the page becomes visible
  // (handles midnight crossing when user leaves browser open)
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) {
        setSubStatus(getSubscriptionStatus());
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // Sync mobile sidebar state with routing
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  // Save/Update handler
  const handleSaveChallan = async (formData, id, printAfterSave) => {
    let savedChallan;
    if (id) {
      savedChallan = await updateChallan(id, formData);
    } else {
      savedChallan = await createChallan(formData);
    }

    if (printAfterSave) {
      setPrintingChallan(savedChallan);
      setTimeout(() => {
        window.print();
        setPrintingChallan(null);
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
      setPrintingChallan(null);
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

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setUserRole(getUserRole());
  };

  const handleLogout = () => {
    logout();
    setIsLoggedIn(true);
    setUserRole('laa');
    navigate('/');
  };

  // Called after successful payment — refresh subscription status
  const handleSubscriptionSuccess = useCallback((paymentId) => {
    setSubStatus(getSubscriptionStatus());
    setIsSubModalOpen(false);
    setIsBannerDismissed(false);
  }, []);

  // Show banner when status is "warning" and not manually dismissed
  const showBanner = subStatus === "warning" && !isBannerDismissed;
  // Show hard-block modal when status is "blocked"
  const showBlockModal = subStatus === "blocked";
  const isPaidThisMonth = subStatus === "active";

  return (
    <div className="flex print:block h-screen print:h-auto print:overflow-visible overflow-hidden bg-slate-50 print:bg-white text-slate-800 font-sans">
      {/* 1. Sidebar Component (drawer on mobile, sticky sidebar on desktop) */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        companyName={companyDetails?.companyName}
        isLoggedIn={isLoggedIn}
        userRole={userRole}
        onLogout={handleLogout}
        onOpenSubscription={() => setIsSubModalOpen(true)}
        isSubscriptionPaid={isPaidThisMonth}
      />

      {/* 2. Main Content Frame */}
      <div className={`flex-1 flex flex-col print:block min-w-0 overflow-hidden print:overflow-visible ${printingChallan ? 'print:hidden' : ''}`}>
        {/* Top Header bar for mobile screen drawer toggling */}
        <header className="lg:hidden shrink-0 flex items-center justify-between px-6 py-4 bg-[#1e293b] text-white shadow-md print:hidden">
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

        {/* Subscription Reminder Banner — shown on Day 1 & 2 if not paid */}
        {showBanner && (
          <SubscriptionBanner
            onPay={() => setIsSubModalOpen(true)}
            onDismiss={() => setIsBannerDismissed(true)}
          />
        )}

        {/* Primary Page Canvas (Scrollable) */}
        <main className="flex-1 print:block overflow-y-auto print:overflow-visible p-4 sm:p-6 lg:p-8 print:p-0">
          <Routes>
            <Route 
              path="/" 
              element={
                <Dashboard 
                  triggerDirectPrint={triggerDirectPrint} 
                  triggerPdfDownload={triggerPdfDownload} 
                  isLoggedIn={isLoggedIn}
                  userRole={userRole}
                />
              } 
            />
            <Route 
              path="/new" 
              element={
                <RequireAuth redirectTo="/login" isLoggedIn={isLoggedIn} userRole={userRole} allowedRoles={['admin', 'laa']}>
                  <NewChallan onSave={handleSaveChallan} />
                </RequireAuth>
              } 
            />
            <Route 
              path="/edit/:id" 
              element={
                <RequireAuth redirectTo="/login" isLoggedIn={isLoggedIn} userRole={userRole} allowedRoles={['admin']}>
                  <NewChallan onSave={handleSaveChallan} />
                </RequireAuth>
              } 
            />
            <Route 
              path="/challans" 
              element={
                <Challans 
                  triggerDirectPrint={triggerDirectPrint} 
                  triggerPdfDownload={triggerPdfDownload} 
                  isLoggedIn={isLoggedIn}
                  userRole={userRole}
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
                  isLoggedIn={isLoggedIn}
                  userRole={userRole}
                />
              } 
            />
            <Route 
              path="/reports" 
              element={<Reports userRole={userRole} />} 
            />
            <Route 
              path="/settings" 
              element={
                <RequireAuth redirectTo="/login" isLoggedIn={isLoggedIn} userRole={userRole} allowedRoles={['admin']}>
                  <Settings onUpdateDetails={(details) => setCompanyDetails(details)} />
                </RequireAuth>
              } 
            />
            <Route 
              path="/recycle-bin" 
              element={
                <RequireAuth redirectTo="/login" isLoggedIn={isLoggedIn} userRole={userRole} allowedRoles={['admin']}>
                  <RecycleBin />
                </RequireAuth>
              } 
            />
            <Route 
              path="/login" 
              element={<Login onLoginSuccess={handleLoginSuccess} />} 
            />
          </Routes>
        </main>
      </div>

      {/* 3. Global Print Mount */}
      {printingChallan && (
        <div id="print-mount" className="absolute -left-[9999px] top-0 print:left-0 print:relative">
          <ChallanPreview challan={printingChallan} companyDetails={companyDetails} />
        </div>
      )}

      {/* 4. Global PDF Processing Loader Overlay */}
      {isPdfProcessing && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xl flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-blue-700" size={28} />
            <div className="text-sm font-bold text-slate-800">Generating PDF...</div>
            <div className="text-xs text-slate-500 font-medium">Please wait while we render the challan.</div>
          </div>
        </div>
      )}

      {/* 5. Subscription Modal — Manual open from sidebar button */}
      <SubscriptionModal
        isOpen={isSubModalOpen && !showBlockModal}
        isBlocked={false}
        isPaid={isPaidThisMonth}
        onClose={() => setIsSubModalOpen(false)}
        onSuccess={handleSubscriptionSuccess}
      />

      {/* 6. Hard Block Modal — shown from Day 3 if not paid (no close button) */}
      <SubscriptionModal
        isOpen={showBlockModal}
        isBlocked={true}
        isPaid={false}
        onSuccess={handleSubscriptionSuccess}
      />
    </div>
  );
}
