import React from 'react';

export default function StatCard({ title, value, icon: Icon, description, colorClass = "border-slate-200 bg-white text-slate-800" }) {
  return (
    <div className={`p-6 rounded-xl border shadow-sm transition-all duration-200 ${colorClass}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold tracking-wide text-slate-500 uppercase">{title}</span>
        {Icon && (
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-600">
            <Icon size={20} className="stroke-[2.2]" />
          </div>
        )}
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold tracking-tight text-slate-900">{value}</span>
      </div>
      {description && (
        <p className="mt-2 text-xs text-slate-500 font-medium">{description}</p>
      )}
    </div>
  );
}
