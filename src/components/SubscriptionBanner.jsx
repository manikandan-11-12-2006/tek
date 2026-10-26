import React from 'react';
import { AlertTriangle, X, CreditCard } from 'lucide-react';

/**
 * SubscriptionBanner
 * A non-blocking top banner shown on Day 1 and Day 2 of the month
 * if subscription has not been paid yet.
 *
 * Props:
 *   onPay      - called when user clicks "Pay Now"
 *   onDismiss  - called when user clicks X (dismisses for current session)
 */
export default function SubscriptionBanner({ onPay, onDismiss }) {
  const now = new Date();
  const day = now.getDate();
  const monthName = now.toLocaleString("en-IN", { month: "long" });
  const year = now.getFullYear();

  // Day 2 is last chance before block
  const isLastChance = day === 2;

  return (
    <div className={`print:hidden shrink-0 flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium ${
      isLastChance
        ? 'bg-red-600 text-white'
        : 'bg-amber-400 text-amber-950'
    }`}>
      <div className="flex items-center gap-2 min-w-0">
        <AlertTriangle size={17} className="shrink-0" />
        <span className="truncate">
          {isLastChance
            ? `⚠️ Last day to renew! TekPower will be locked from tomorrow (3rd ${monthName} ${year}) until you pay ₹500.`
            : `🔔 Subscription reminder: Please pay ₹500 for ${monthName} ${year}. Access will be locked from the 3rd.`
          }
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onPay}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            isLastChance
              ? 'bg-white text-red-600 hover:bg-red-50'
              : 'bg-amber-900 text-amber-100 hover:bg-amber-800'
          }`}
        >
          <CreditCard size={13} />
          Pay Now
        </button>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`p-1 rounded transition-colors cursor-pointer ${
              isLastChance
                ? 'hover:bg-red-700 text-red-100'
                : 'hover:bg-amber-500 text-amber-900'
            }`}
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
