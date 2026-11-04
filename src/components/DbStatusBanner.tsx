"use client";

import React, { useState } from "react";
import { AlertOctagon, Terminal, RefreshCw, DatabaseZap, Loader2 } from "lucide-react";

interface DbStatusBannerProps {
  error: string | null;
  onRetry?: () => void;
}

export default function DbStatusBanner({
  error,
  onRetry,
}: DbStatusBannerProps) {
  const [migrating, setMigrating] = useState(false);
  const [migrationMsg, setMigrationMsg] = useState<string | null>(null);

  if (!error) return null;

  const handleRunMigration = async () => {
    try {
      setMigrating(true);
      setMigrationMsg(null);
      const res = await fetch("/api/migrate");
      const data = await res.json();
      if (res.ok && data.success) {
        setMigrationMsg("✓ Schema applied successfully! Reloading...");
        setTimeout(() => {
          onRetry?.();
        }, 1500);
      } else {
        setMigrationMsg(`Migration failed: ${data.error || "Unknown error"}`);
      }
    } catch (err: unknown) {
      const e = err as Error;
      setMigrationMsg(`Network error: ${e.message}`);
    } finally {
      setMigrating(false);
    }
  };

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
              <span>Diagnostic Checklist:</span>
            </div>
            <p>1. Check PGHOST matches the private hostname in the PostgreSQL tool Networking tab</p>
            <p>2. Verify PostgreSQL password matches PGPASSWORD</p>
            <p>3. If database table is missing, click &quot;Initialize Schema&quot; below</p>
          </div>

          {migrationMsg && (
            <div className="mt-3 p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-medium">
              {migrationMsg}
            </div>
          )}

          <div className="mt-3.5 flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleRunMigration}
              disabled={migrating}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {migrating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Running Migration...</span>
                </>
              ) : (
                <>
                  <DatabaseZap className="w-3.5 h-3.5" />
                  <span>Initialize Schema (Run Migrations)</span>
                </>
              )}
            </button>

            {onRetry && (
              <button
                onClick={onRetry}
                disabled={migrating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-rose-300 text-rose-800 text-xs font-semibold hover:bg-rose-100/60 transition-colors shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Connection</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

