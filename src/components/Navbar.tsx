"use client";

import React from "react";
import { Menu, UserPlus } from "lucide-react";

interface NavbarProps {
  onToggleSidebar: () => void;
  title: string;
  onAddUser?: () => void;
}

export default function Navbar({ onToggleSidebar, title, onAddUser }: NavbarProps) {
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
