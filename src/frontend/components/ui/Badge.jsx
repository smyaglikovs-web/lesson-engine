import React from 'react';

export const Badge = ({ children, variant = 'default', className = '' }) => {
  const base = "inline-flex items-center px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider";

  const variants = {
    default: "bg-slate-100 text-slate-600 border border-slate-200/60",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
    warning: "bg-amber-50 text-amber-700 border border-amber-200/60",
    brand: "bg-indigo-50 text-indigo-700 border border-indigo-200/60",
    danger: "bg-rose-50 text-rose-700 border border-rose-200/60",
  };

  return (
    <span className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
