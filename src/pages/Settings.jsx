import React, { useState, useEffect } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import { getCompanyDetails, saveCompanyDetails } from '../utils/storage';
import { defaultCompanyDetails } from '../data/sampleData';

export default function Settings({ onUpdateDetails }) {
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [footerTagline, setFooterTagline] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const details = getCompanyDetails();
    loadDetails(details);
  }, []);

  const loadDetails = (details) => {
    setCompanyName(details.companyName || '');
    setAddress(details.address || '');
    setGstNumber(details.gstNumber || '');
    setMobileNumber(details.mobileNumber || '');
    setPhoneNumber(details.phoneNumber || '');
    setFooterTagline(details.footerTagline || '');
  };

  const handleSave = (e) => {
    e.preventDefault();
    const updated = {
      companyName: companyName.trim(),
      address: address.trim(),
      gstNumber: gstNumber.trim().toUpperCase(),
      mobileNumber: mobileNumber.trim(),
      phoneNumber: phoneNumber.trim(),
      footerTagline: footerTagline.trim()
    };
    
    saveCompanyDetails(updated);
    if (onUpdateDetails) {
      onUpdateDetails(updated);
    }
    
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset company details to default values?")) {
      saveCompanyDetails(defaultCompanyDetails);
      loadDetails(defaultCompanyDetails);
      if (onUpdateDetails) {
        onUpdateDetails(defaultCompanyDetails);
      }
      alert("Company details reset to factory settings!");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight font-sans">System Settings</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Configure default company details printed on the header and footer of delivery challans.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden max-w-3xl">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-base font-bold text-slate-800">Company Letterhead Settings</h2>
          <p className="text-xs text-slate-500">Updates here apply immediately to all screen and print previews</p>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Company Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Company Name
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full text-sm font-bold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-900"
            />
          </div>

          {/* Address */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Registered Address
            </label>
            <textarea
              rows="3"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full text-sm font-medium px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-900"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* GST */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                GSTN Number
              </label>
              <input
                type="text"
                required
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                className="w-full text-sm font-mono font-bold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-900"
              />
            </div>

            {/* Mobile Numbers */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Mobile Number(s)
              </label>
              <input
                type="text"
                required
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="w-full text-sm font-medium px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-900"
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Landline Phone
              </label>
              <input
                type="text"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full text-sm font-medium px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-900"
              />
            </div>
          </div>

          {/* Tagline */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Bottom Tagline / Category
            </label>
            <input
              type="text"
              required
              value={footerTagline}
              onChange={(e) => setFooterTagline(e.target.value)}
              className="w-full text-sm font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-900"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <RotateCcw size={14} />
              Reset to default
            </button>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {isSaved && (
                <span className="text-xs font-bold text-emerald-600 animate-pulse">
                  Settings saved successfully!
                </span>
              )}
              <button
                type="submit"
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <Save size={16} />
                Save Settings
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
