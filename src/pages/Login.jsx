import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, User, AlertCircle } from 'lucide-react';
import { login } from '../utils/auth';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect back to original page or fallback to dashboard
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    const success = login(username, password);
    if (success) {
      onLoginSuccess();
      navigate(from, { replace: true });
    } else {
      setError('Invalid username or password. (Hint: admin / tekpower)');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4 font-sans">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl max-w-md w-full">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-inner mb-4">
            <img src="/logo.png" alt="TEK POWER Logo" className="h-10 w-auto object-contain" />
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Admin Authentication</h2>
          <p className="text-xs text-slate-400 mt-1">Sign in to edit and manage delivery challans</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs font-bold flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <User size={16} />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full text-sm font-semibold pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-slate-50/50"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Lock size={16} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full text-sm font-semibold pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-slate-50/50"
              />
            </div>
          </div>

          {/* Hint info */}
          <div className="bg-blue-50/40 p-3 rounded-lg border border-blue-100/50 text-[11px] text-blue-800 font-semibold leading-relaxed">
            <span className="font-extrabold uppercase text-blue-900 block mb-0.5">Default Credentials:</span>
            <span>Username: <code className="bg-blue-100/60 px-1 rounded font-mono text-[10px]">admin</code> | Password: <code className="bg-blue-100/60 px-1 rounded font-mono text-[10px]">tekpower</code></span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-700/10 hover:shadow-lg transition-all cursor-pointer mt-2"
          >
            Authenticate
          </button>
        </form>
      </div>
    </div>
  );
}
