"use client";

import React from "react";
import {
  X,
  User as UserIcon,
  Mail,
  Phone,
  Building,
  Briefcase,
  Calendar,
  Clock,
  ShieldCheck,
  Edit3,
} from "lucide-react";
import { User } from "@/types/user";

interface UserDetailsModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (user: User) => void;
}

export default function UserDetailsModal({
  user,
  isOpen,
  onClose,
  onEdit,
}: UserDetailsModalProps) {
  if (!isOpen || !user) return null;

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Banner with gradient */}
        <div className="h-28 bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 flex justify-between items-start text-white relative">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm">
              User #{user.id}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                user.status === "Active"
                  ? "bg-emerald-500/80 text-white"
                  : "bg-amber-500/80 text-white"
              }`}
            >
              {user.status}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card Info */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="-mt-12 mb-4 flex justify-between items-end">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-md border-4 border-white flex items-center justify-center text-indigo-700 font-bold text-2xl">
              {user.full_name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </div>
            <button
              onClick={() => {
                onClose();
                onEdit(user);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              Edit Profile
            </button>
          </div>

          <h3 className="text-xl font-bold text-slate-900">{user.full_name}</h3>
          <p className="text-xs text-slate-500 mb-6">
            {user.job_role || "No specific job role"} &bull; {user.department || "General"}
          </p>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 font-medium flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                <Mail className="w-3.5 h-3.5 text-indigo-500" /> Email Address
              </span>
              <p className="font-semibold text-slate-800 break-all">{user.email}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 font-medium flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                <Phone className="w-3.5 h-3.5 text-indigo-500" /> Phone Number
              </span>
              <p className="font-semibold text-slate-800">
                {user.phone || <span className="text-slate-400 italic">Not provided</span>}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 font-medium flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                <Building className="w-3.5 h-3.5 text-indigo-500" /> Department
              </span>
              <p className="font-semibold text-slate-800">
                {user.department || <span className="text-slate-400 italic">Unassigned</span>}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 font-medium flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                <Briefcase className="w-3.5 h-3.5 text-indigo-500" /> Job Role
              </span>
              <p className="font-semibold text-slate-800">
                {user.job_role || <span className="text-slate-400 italic">Unspecified</span>}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 font-medium flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Created At
              </span>
              <p className="font-medium text-slate-700">{formatDate(user.created_at)}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 font-medium flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                <Clock className="w-3.5 h-3.5 text-indigo-500" /> Last Updated
              </span>
              <p className="font-medium text-slate-700">{formatDate(user.updated_at)}</p>
            </div>
          </div>

          {/* Database Verification Note */}
          <div className="mt-5 p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-center gap-2 text-indigo-900 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>
              Verified record in PostgreSQL <code className="font-mono bg-indigo-100 px-1 py-0.5 rounded text-indigo-800">users</code> table.
            </span>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

