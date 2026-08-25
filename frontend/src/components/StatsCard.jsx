import React from "react";

export const StatsCard = ({ title, value, icon: Icon, description, trendColor = "emerald" }) => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <h3 className="text-2xl lg:text-3xl font-extrabold text-slate-900 mt-1">{value}</h3>
          {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
        </div>
        <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;