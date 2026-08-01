import React from 'react';

export const Card = ({ children, className = '', interactive = false, ...props }) => {
  const base = "bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden";
  const interactiveClasses = interactive ? "transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:border-indigo-200 cursor-pointer" : "";

  return (
    <div className={`${base} ${interactiveClasses} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader = ({ title, subtitle, className = '' }) => (
  <div className={`p-6 pb-2 ${className}`}>
    {title && <h3 className="text-xl font-extrabold text-slate-900 leading-snug">{title}</h3>}
    {subtitle && <p className="text-xs font-medium text-slate-500 mt-1">{subtitle}</p>}
  </div>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);
