"use client";

import React from "react";
import { AlertOctagon, Terminal, RefreshCw } from "lucide-react";

interface DbStatusBannerProps {
  error: string | null;
  onRetry?: () => void;
}

export default function DbStatusBanner({
  error,
  onRetry,
}: DbStatusBannerProps) {
  if (!error) return null;

  return (
    <div className="mb-6 p-5 rounded-2xl bg-rose-50 border border-rose-200 shadow-sm animate-in fade-in duration-200">
      <div className="flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0 mt-0.5">
          <AlertOctagon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-rose-900">
            PostgreSQL Connection Issue Detected
          </h3>
          <p className="text-xs text-rose-700 mt-1 leading-relaxed">
            {error}
          </p>

          <div className="mt-3 p-3 rounded-xl bg-rose-950/90 text-rose-100 font-mono text-[11px] space-y-1">
            <div className="flex items-center gap-1.5 text-rose-300 font-sans font-medium text-xs mb-1">
              <Terminal className="w-3.5 h-3.5" />
              <span>Recommended fix steps:</span>
            </div>
            <p>1. Check your .env file credentials (PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE)</p>
            <p>2. Ensure PostgreSQL service is active</p>
            <p>3. Run migration: npm run db:migrate</p>
          </div>

          {onRetry && (
            <div className="mt-3">
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Connection
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

