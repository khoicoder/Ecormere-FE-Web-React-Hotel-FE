import React from "react";

export function PageHeader({
  title,
  subtitle,
  badge,
  badgeColor = "indigo", // indigo, emerald, amber, purple
  actions,
  className = "",
}) {
  const badgeColors = {
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-200/80 ${className}`}>
      <div className="space-y-1">
        {badge && (
          <div className="inline-flex items-center gap-1.5 mb-1">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${badgeColors[badgeColor] || badgeColors.indigo}`}
            >
              {badge}
            </span>
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-slate-500 max-w-3xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

export default PageHeader;
