import React from 'react';

export const Input = ({ className = '', label, error, ...props }) => (
  <div className="space-y-1.5 w-full">
    {label && <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider">{label}</label>}
    <input
      className={`w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-sm font-medium text-slate-800 ${className}`}
      {...props}
    />
    {error && <p className="text-xs text-rose-600 font-bold">{error}</p>}
  </div>
);
