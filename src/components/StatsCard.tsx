"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "indigo" | "emerald" | "amber" | "sky";
  isLoading?: boolean;
}

const variantStyles = {
  indigo: {
    iconBg: "bg-indigo-50 border-indigo-100 text-indigo-600",
    accent: "text-indigo-600",
  },
  emerald: {
    iconBg: "bg-emerald-50 border-emerald-100 text-emerald-600",
    accent: "text-emerald-600",
  },
  amber: {
    iconBg: "bg-amber-50 border-amber-100 text-amber-600",
    accent: "text-amber-600",
  },
  sky: {
    iconBg: "bg-sky-50 border-sky-100 text-sky-600",
    accent: "text-sky-600",
  },
};

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "indigo",
  isLoading = false,
}: StatsCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div
          className={`w-10 h-10 rounded-xl border flex items-center justify-center ${styles.iconBg}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3">
        {isLoading ? (
          <div className="h-8 w-16 bg-slate-200 rounded animate-pulse" />
        ) : (
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {value}
          </div>
        )}

        {subtitle && (
          <p className="mt-1 text-xs text-slate-400 font-medium">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

