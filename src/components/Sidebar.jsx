import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  FileText, 
  Settings as SettingsIcon, 
  LogOut, 
  LogIn,
  X,
  Zap,
  CheckCircle2,
  BarChart,
  Trash2
} from 'lucide-react';

export default function Sidebar({ 
  isOpen, 
  onClose, 
  companyName = "TEKPOWER ENERGY SOLUTIONS", 
  isLoggedIn, 
  userRole, 
  onLogout, 
  onOpenSubscription,
  isSubscriptionPaid = false
}) {
  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/new', label: 'New Challan', icon: PlusCircle },
    { to: '/challans', label: 'All Challans', icon: FileText },
    { to: '/reports', label: 'Reports', icon: BarChart },
  ];

  if (userRole === 'admin') {
    links.push({ to: '/settings', label: 'Settings', icon: SettingsIcon });
    links.push({ to: '/recycle-bin', label: 'Recycle Bin', icon: Trash2 });
  }

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
      <div className="p-4 border-t border-[#334155] bg-[#0f172a]/40 space-y-3">
        <div className="px-3 py-2 rounded bg-[#334155]/30">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Company</div>
          <div className="text-xs font-medium text-slate-200 truncate" title={companyName}>
            {companyName}
          </div>
        </div>
        
        {/* Auth Action */}
        {userRole === 'admin' ? (
          <div className="flex items-center justify-between px-3 py-2 text-xs text-slate-400 bg-slate-800/40 rounded border border-slate-700/30">
            <span className="font-bold text-emerald-400 uppercase">ADMIN</span>
            <button 
              onClick={onLogout}
              className="font-bold text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <LogOut size={12} />
              Logout
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Link 
              to="/login"
              className="flex items-center justify-center gap-1.5 w-full py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs font-bold transition-all"
            >
              <LogIn size={12} />
              Admin Login
            </Link>
          </div>
        )}

        {/* Subscription Plan Action */}
        {isSubscriptionPaid ? (
          <button
            onClick={onOpenSubscription}
            className="flex items-center justify-between w-full px-3 py-2 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-semibold cursor-pointer hover:bg-emerald-900/50 transition-all shadow-sm"
            title="Subscription is active. Click to view renewal details."
          >
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              <span>Plan Active</span>
            </div>
            <span className="text-[10px] text-emerald-300/80 font-normal">Renews 1st</span>
          </button>
        ) : onOpenSubscription ? (
          <button
            onClick={onOpenSubscription}
            className="flex items-center justify-center gap-2 w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-md cursor-pointer"
          >
            <Zap size={14} className="fill-current" />
            <span>₹1/Mo Subscription</span>
          </button>
        ) : null}
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
