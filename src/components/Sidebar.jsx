import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  FileText, 
  Settings as SettingsIcon, 
  LogOut, 
  X,
  Zap,
  BarChart
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose, companyName = "TEKPOWER ENERGY SOLUTIONS" }) {
  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/new', label: 'New Challan', icon: PlusCircle },
    { to: '/challans', label: 'All Challans', icon: FileText },
    { to: '/reports', label: 'Reports', icon: BarChart },
    { to: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#1e293b] text-white select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between p-6 border-b border-[#334155]">
        <div className="bg-white px-3 py-2 rounded-lg flex items-center justify-center shadow-sm">
          <img src="/logo.png" alt="TEK POWER Logo" className="h-7 w-auto object-contain" />
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onClose}
            className={({ isActive }) => 
              `flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-amber-500 text-slate-950 font-semibold' 
                  : 'text-slate-300 hover:bg-[#334155] hover:text-white'
              }`
            }
            end={link.to === '/'}
          >
            <link.icon size={18} className="shrink-0" />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-[#334155] bg-[#0f172a]/40">
        <div className="px-3 py-2 rounded bg-[#334155]/30">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Company</div>
          <div className="text-xs font-medium text-slate-200 truncate" title={companyName}>
            {companyName}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Desktop Sidebar (Persistent) */}
      <aside className="hidden lg:block w-64 h-screen shrink-0 sticky top-0 border-r border-slate-200 print:hidden">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Slide in) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {sidebarContent}
      </aside>
    </>
  );
}
