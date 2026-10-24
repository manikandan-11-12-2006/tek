import { ref, get, set, update, onValue } from "firebase/database";
import { database } from "./firebase";

/**
 * Dynamically loads the Razorpay Checkout SDK script
 * @returns {Promise<boolean>}
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Returns the current month key as "YYYY-MM" string
 * @returns {string}
 */
export const getCurrentMonthKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

/**
 * Records that the subscription was paid for the current month.
 * Saves to both localStorage AND Firebase Realtime Database.
 * Status values used: "paid" or "unpaid"
 * @param {string} paymentId - Razorpay payment ID
 */
export const recordSubscriptionPaid = async (paymentId) => {
  const monthKey = getCurrentMonthKey();
  const paidAt = new Date().toISOString();

  // 1. Save to local storage for instant cache
  localStorage.setItem("tekpower_paid_month", monthKey);
  localStorage.setItem("tekpower_payment_id", paymentId);
  localStorage.setItem("tekpower_paid_at", paidAt);

  // 2. Save to Firebase Realtime Database (status: "paid")
  try {
    await update(ref(database, "subscription"), {
      paidMonth: monthKey,
      lastPaymentId: paymentId,
      lastPaidAt: paidAt,
      status: "paid"
    });

    // Also keep payment history record in database
    await set(ref(database, `subscription/history/${monthKey}`), {
      paymentId,
      amount: 1, // ₹1 for testing
      paidAt,
      month: monthKey
    });
  } catch (error) {
    console.error("Error saving subscription to Firebase:", error);
  }
};

/**
 * Fetches subscription record from Firebase Realtime Database
 * and synchronizes with localStorage.
 * Only two statuses: "paid" and "unpaid".
 * @returns {Promise<boolean>} returns true if paid for current month
 */
export const syncSubscriptionFromDatabase = async () => {
  try {
    const snapshot = await get(ref(database, "subscription"));
    if (snapshot.exists()) {
      const data = snapshot.val();
      const currentMonth = getCurrentMonthKey();

      // Only paid if status is "paid" AND paidMonth matches current month
      const isPaid = data && data.status === "paid" && data.paidMonth === currentMonth;

      if (isPaid) {
        localStorage.setItem("tekpower_paid_month", data.paidMonth);
        if (data.lastPaymentId) localStorage.setItem("tekpower_payment_id", data.lastPaymentId);
        if (data.lastPaidAt) localStorage.setItem("tekpower_paid_at", data.lastPaidAt);
        return true;
      } else {
        localStorage.removeItem("tekpower_paid_month");
        localStorage.removeItem("tekpower_payment_id");
        localStorage.removeItem("tekpower_paid_at");
        return false;
      }
    }
    return false;
  } catch (error) {
    console.error("Error fetching subscription from Firebase:", error);
    return isSubscriptionPaidThisMonth();
  }
};

/**
 * Listens to Realtime Database updates on subscription.
 * Only two statuses: "paid" and "unpaid".
 * @param {Function} onStatusChange - callback with new status string
 * @returns {Function} unsubscribe function
 */
export const listenToSubscription = (onStatusChange) => {
  try {
    const subRef = ref(database, "subscription");
    const unsubscribe = onValue(subRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const currentMonth = getCurrentMonthKey();

        const isPaid = data && data.status === "paid" && data.paidMonth === currentMonth;

        if (isPaid) {
          localStorage.setItem("tekpower_paid_month", data.paidMonth);
          if (data.lastPaymentId) localStorage.setItem("tekpower_payment_id", data.lastPaymentId);
          if (data.lastPaidAt) localStorage.setItem("tekpower_paid_at", data.lastPaidAt);
        } else {
          localStorage.removeItem("tekpower_paid_month");
          localStorage.removeItem("tekpower_payment_id");
          localStorage.removeItem("tekpower_paid_at");
        }
      }
      if (onStatusChange) {
        onStatusChange(getSubscriptionStatus());
      }
    }, (error) => {
      console.error("Subscription listener error:", error);
    });
    return unsubscribe;
  } catch (error) {
    console.error("Error attaching subscription listener:", error);
    return () => {};
  }
};

/**
 * Checks if subscription is paid for the current calendar month in localStorage.
 * @returns {boolean}
 */
export const isSubscriptionPaidThisMonth = () => {
  const paidMonth = localStorage.getItem("tekpower_paid_month");
  if (!paidMonth) return false;
  return paidMonth === getCurrentMonthKey();
};

/**
 * Returns the current day of month (1-31).
 * Supports test simulation via localStorage key 'tekpower_test_day'.
 * @returns {number}
 */
export const getCurrentDayOfMonth = () => {
  const simulatedDay = localStorage.getItem("tekpower_test_day");
  if (simulatedDay !== null && !isNaN(parseInt(simulatedDay, 10))) {
    return parseInt(simulatedDay, 10);
  }
  return new Date().getDate();
};

/**
 * Returns the subscription status for the current date:
 * - "active"   → paid this month, no warnings
 * - "warning"  → not paid, but it's day 1 or 2 (reminder banner)
 * - "blocked"  → not paid, and it's day 3 or later (full block)
 * @returns {"active" | "warning" | "blocked"}
 */
export const getSubscriptionStatus = () => {
  if (isSubscriptionPaidThisMonth()) return "active";
  const day = getCurrentDayOfMonth();
  if (day <= 2) return "warning";
  return "blocked";
};

/**
 * Returns the 1st of next month formatted nicely (e.g. "1st November 2026")
 * @returns {string}
 */
export const getNextRenewalDate = () => {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
};

/**
 * Returns a formatted date string of when this month's payment was made.
 * @returns {string}
 */
export const getPaidAtFormatted = () => {
  const paidAt = localStorage.getItem("tekpower_paid_at");
  if (!paidAt) return "";
  return new Date(paidAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};
