import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseClasses = "inline-flex items-center justify-center font-bold transition-all duration-200 ease-out active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer touch-manipulation select-none";

  const sizes = {
    sm: "text-xs px-3.5 py-1.5 rounded-xl",
    md: "text-sm px-5 py-2.5 rounded-2xl",
    lg: "text-base px-6 py-3.5 rounded-2xl",
  };

  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/20 active:bg-indigo-800",
    secondary: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100/80 active:bg-indigo-200/80",
    outline: "border-2 border-slate-200 text-slate-700 hover:border-indigo-600 hover:text-indigo-600 bg-white",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    danger: "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200",
    ai: "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white hover:opacity-95 hover:shadow-lg hover:shadow-purple-500/25",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/20"
  };

  return (
    <button className={`${baseClasses} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};
