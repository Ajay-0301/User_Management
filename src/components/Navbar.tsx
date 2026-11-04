"use client";

import React, { useEffect, useState } from "react";
import { Menu, Database, RefreshCw, UserPlus, CheckCircle2, AlertTriangle } from "lucide-react";

interface NavbarProps {
  onToggleSidebar: () => void;
  title: string;
  onAddUser?: () => void;
}

export default function Navbar({ onToggleSidebar, title, onAddUser }: NavbarProps) {
  const [dbStatus, setDbStatus] = useState<"checking" | "connected" | "error">("checking");
  const [dbMessage, setDbMessage] = useState<string>("");

  const checkDb = async () => {
    try {
      setDbStatus("checking");
      const res = await fetch("/api/health", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.status === "connected") {
        setDbStatus("connected");
        setDbMessage("PostgreSQL Connected");
      } else {
        setDbStatus("error");
        setDbMessage(data.message || "Database disconnected");
      }
    } catch {
      setDbStatus("error");
      setDbMessage("Database connection failed");
    }
  };

  useEffect(() => {
    checkDb();
    const interval = setInterval(checkDb, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Database Connectivity Status Pill */}
        <div
          title={dbMessage}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer select-none ${
            dbStatus === "connected"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : dbStatus === "error"
              ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
              : "bg-slate-50 text-slate-600 border-slate-200"
          }`}
          onClick={checkDb}
        >
          {dbStatus === "connected" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
          {dbStatus === "error" && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
          {dbStatus === "checking" && <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />}
          
          <span className="hidden sm:inline">
            {dbStatus === "connected" ? "PostgreSQL Active" : dbStatus === "error" ? "DB Disconnected" : "Checking DB..."}
          </span>
          <span className="sm:hidden">
            {dbStatus === "connected" ? "DB OK" : dbStatus === "error" ? "DB Error" : "..."}
          </span>
        </div>

        {/* Optional Add User Action */}
        {onAddUser && (
          <button
            onClick={onAddUser}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add User</span>
          </button>
        )}
      </div>
    </header>
  );
}

