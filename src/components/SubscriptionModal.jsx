import React, { useState } from 'react';
import { ShieldCheck, Zap, CheckCircle2, X, AlertCircle, Calendar } from 'lucide-react';
import { loadRazorpayScript, recordSubscriptionPaid, getNextRenewalDate } from '../utils/razorpay';

/**
 * SubscriptionModal
 * Props:
 *   isOpen    - boolean: show or hide modal
 *   isBlocked - boolean: if true, no X/close button (hard block on day 3+)
 *   isPaid    - boolean: if true, subscription is already active this month
 *   onClose   - optional: called when user closes
 *   onSuccess - called after successful payment
 */
export default function SubscriptionModal({ 
  isOpen, 
  isBlocked = false, 
  isPaid = false, 
  onSuccess, 
  onClose 
}) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const now = new Date();
  const monthName = now.toLocaleString("en-IN", { month: "long" });
  const year = now.getFullYear();
  const nextRenewalDate = getNextRenewalDate();

  const handlePayment = async () => {
    if (isPaid) return; // Guard against payment if already paid

    setLoading(true);

    const res = await loadRazorpayScript();
    if (!res) {
      alert("Razorpay SDK failed to load. Please check your internet connection.");
      setLoading(false);
      return;
    }

    // 1. Create Razorpay Order via backend/Netlify API to ensure automatic capture
    let orderId = null;
    let serverKeyId = null;
    try {
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 50000 }) // ₹500 = 50000 paise
      });
      if (orderRes.ok) {
        const orderData = await orderRes.json();
        if (orderData && orderData.id) {
          orderId = orderData.id;
        }
        if (orderData && orderData.keyId) {
          serverKeyId = orderData.keyId;
        }
      } else {
        console.warn("Order creation response not OK, proceeding with direct checkout.");
      }
    } catch (orderErr) {
      console.warn("Could not connect to /api/create-order:", orderErr);
    }

    const keyId = serverKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID || "";
    if (!keyId) {
      alert("Razorpay Key ID not available. Please check environment configuration.");
      setLoading(false);
      return;
    }

    // Amount: ₹500 (Inclusive 18% GST) = 50000 paise
    const options = {
      key: keyId,
      amount: 50000,
      currency: "INR",
      name: "TekPower",
      description: "Monthly Access Subscription",
      order_id: orderId || undefined, // Binds to Order for 100% Auto-Capture!
      payment_capture: 1,
      handler: async function (response) {
        if (response.razorpay_payment_id) {
          // Record this month as paid in Firebase and localStorage
          await recordSubscriptionPaid(response.razorpay_payment_id);
          if (onSuccess) onSuccess(response.razorpay_payment_id);
        }
      },
      prefill: {
        name: "TekPower User",
        email: "user@tekpower.in",
        contact: "9999999999"
      },
      config: {
        display: {
          blocks: {
            upi: {
              name: "Pay using UPI / QR Code",
              instruments: [{ method: "upi" }]
            },
            other: {
              name: "Other Payment Modes",
              instruments: [
                { method: "card" },
                { method: "netbanking" },
                { method: "wallet" }
              ]
            }
          },
          sequence: ["block.upi", "block.other"],
          preferences: { show_default_blocks: true }
        }
      },
      theme: { color: "#1e293b" }
    };

    try {
      const paymentObject = new window.Razorpay(options);
      paymentObject.on("payment.failed", function (response) {
        alert(`Payment Failed: ${response.error.description || 'Unknown error'}`);
      });
      paymentObject.open();
    } catch (err) {
      console.error("Razorpay error:", err);
      alert("Could not open Razorpay checkout. Please verify your Razorpay Key ID.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 relative">
        
        {/* Close button — shown in warning or paid mode (not when blocked) */}
        {!isBlocked && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-700/40 hover:bg-slate-800 rounded-full p-1.5 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        )}

        {/* Header */}
        <div className={`text-white p-6 text-center ${
          isBlocked 
            ? 'bg-red-700' 
            : isPaid 
              ? 'bg-emerald-800' 
              : 'bg-slate-900'
        }`}>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg ${
            isBlocked 
              ? 'bg-red-500/30' 
              : isPaid
                ? 'bg-emerald-600 shadow-emerald-500/30'
                : 'bg-blue-600 shadow-blue-500/30'
          }`}>
            {isBlocked ? (
              <AlertCircle className="text-white" size={28} />
            ) : isPaid ? (
              <CheckCircle2 className="text-white" size={28} />
            ) : (
              <Zap className="text-white" size={26} />
            )}
          </div>

          {isBlocked ? (
            <>
              <h2 className="text-xl font-bold">Access Suspended</h2>
              <p className="text-xs text-red-200 mt-1">
                Your subscription for <strong>{monthName} {year}</strong> is unpaid.<br />
                Please renew to continue using TekPower.
              </p>
            </>
          ) : isPaid ? (
            <>
              <h2 className="text-xl font-bold">Subscription Active</h2>
              <p className="text-xs text-emerald-200 mt-1">
                Your plan is fully paid for <strong>{monthName} {year}</strong>.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold">Renew Your Subscription</h2>
              <p className="text-xs text-slate-400 mt-1">
                Renew now for <strong>{monthName} {year}</strong> to keep using TekPower.
              </p>
            </>
          )}
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className={`rounded-xl p-4 border text-center ${
            isBlocked 
              ? 'bg-red-50 border-red-200' 
              : isPaid
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="text-3xl font-extrabold text-slate-900">
              ₹500 <span className="text-sm font-normal text-slate-500">/ month</span>
            </div>
            {isPaid ? (
              <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <CheckCircle2 size={13} className="text-emerald-600" />
                Paid for {monthName} {year}
              </div>
            ) : (
              <div className="text-xs text-slate-500 mt-1">Includes 18% GST • Tax Invoice via Razorpay</div>
            )}
          </div>

          {/* Renewal timing banner if paid */}
          {isPaid && (
            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
              <Calendar size={18} className="text-blue-600 shrink-0" />
              <div>
                <span className="font-semibold block text-slate-900">Next Renewal Date: {nextRenewalDate}</span>
                <span className="text-slate-500 text-[11px]">Next month's payment option will open on the 1st.</span>
              </div>
            </div>
          )}

          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
              <span>Unlimited Delivery Challan Creation & Downloads</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
              <span>Instant PDF Generation & Direct Printing</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
              <span>Cloud Database Sync & Realtime Storage</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
              <span>GST Compliant Invoices via Razorpay</span>
            </li>
          </ul>

          {/* Action button */}
          {isPaid ? (
            <button
              disabled={true}
              className="w-full bg-slate-100 text-slate-500 font-semibold py-3.5 rounded-xl border border-slate-200 flex items-center justify-center gap-2 cursor-not-allowed opacity-80"
            >
              <CheckCircle2 size={18} className="text-emerald-600" />
              <span>Paid for {monthName} • Renews on {nextRenewalDate}</span>
            </button>
          ) : (
            <button
              onClick={handlePayment}
              disabled={loading}
              className={`w-full text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shadow-lg ${
                isBlocked
                  ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
              }`}
            >
              <ShieldCheck size={18} />
              {loading ? "Initializing Payment..." : `Pay ₹500 for ${monthName} ${year}`}
            </button>
          )}

          {isBlocked && (
            <p className="text-center text-xs text-slate-400 pt-1">
              Access is locked from the 3rd of every month until subscription is renewed.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
