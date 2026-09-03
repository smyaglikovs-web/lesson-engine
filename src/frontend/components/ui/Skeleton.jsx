import React from 'react';

export const Skeleton = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-pulse bg-slate-200/80 rounded-2xl ${className}`}
      {...props}
    />
  );
};

export const LessonCardSkeleton = () => (
  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
    <div className="flex justify-between items-center">
      <Skeleton className="h-5 w-14 rounded-full" />
      <div className="flex gap-2">
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-7 w-16" />
      </div>
    </div>
    <div className="space-y-2">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
      <Skeleton className="h-10 rounded-2xl" />
      <Skeleton className="h-10 rounded-2xl" />
    </div>
  </div>
);

export const StudentRowSkeleton = () => (
  <tr className="border-b border-slate-100">
    <td className="p-4 pl-6"><Skeleton className="h-5 w-32" /></td>
    <td className="p-4"><Skeleton className="h-5 w-20" /></td>
    <td className="p-4"><Skeleton className="h-5 w-24" /></td>
    <td className="p-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
    <td className="p-4 pr-6"><Skeleton className="h-5 w-28" /></td>
  </tr>
);
