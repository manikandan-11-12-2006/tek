import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({ isOpen, title, message, confirmText = "Delete", cancelText = "Cancel", onConfirm, onCancel }) {
  const [userInputCode, setUserInputCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  // Prevent body scroll when open and generate verification code
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
      setVerificationCode(randomCode);
      setUserInputCode('');
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden transform scale-100 transition-all">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          </div>
          <button 
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          <p className="text-sm leading-relaxed text-slate-600">{message}</p>
          
          {/* Verification Code Box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col gap-2">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Type the code below to confirm this action:
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-black text-slate-800 bg-slate-200/80 border border-slate-300/40 px-3 py-1.5 rounded select-all font-mono tracking-widest">
                {verificationCode}
              </span>
              <input
                type="text"
                maxLength={4}
                placeholder="Enter code"
                value={userInputCode}
                onChange={(e) => setUserInputCode(e.target.value.replace(/\D/g, ''))}
                className="flex-1 text-center font-mono font-black text-sm tracking-widest border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-white"
              />
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={userInputCode !== verificationCode}
            className={`px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors ${
              userInputCode !== verificationCode 
                ? 'opacity-35 cursor-not-allowed bg-red-500 hover:bg-red-500' 
                : 'cursor-pointer'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
