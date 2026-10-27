import React from "react";

export function Card({ children, className = "", hover = false, ...props }) {
  return (
    <div
      className={`bg-white border border-slate-200/80 rounded-2xl shadow-sm ${
        hover ? "hover:shadow-md hover:border-slate-300 transition-all duration-200" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = "" }) {
  return (
    <div className={`p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-4 ${className}`}>
      <div>
        <h3 className="font-bold text-base text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ children, className = "" }) {
  return <div className={`p-5 sm:p-6 ${className}`}>{children}</div>;
}

export function StatCard({
  title,
  value,
  subtext,
  icon,
  iconBg = "bg-indigo-50 text-indigo-600",
  trend,
  className = "",
}) {
  return (
    <Card className={`p-5 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {title}
          </p>
          <div className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            {value}
          </div>
          {subtext && (
            <p className="text-xs text-slate-500 font-medium pt-0.5">
              {subtext}
            </p>
          )}
        </div>
        {icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 ${iconBg}`}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

export default Card;
