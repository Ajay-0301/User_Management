"use client";

import React from "react";
import {
  Edit3,
  Trash2,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Building,
  User as UserIcon,
} from "lucide-react";
import { User } from "@/types/user";

interface UserTableProps {
  users: User[];
  isLoading: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onViewDetails?: (user: User) => void;
}

export default function UserTable({
  users,
  isLoading,
  onEdit,
  onDelete,
  onViewDetails,
}: UserTableProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="divide-y divide-slate-100">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse" />
                <div className="space-y-1.5">
                  <div className="h-4 w-36 bg-slate-200 rounded animate-pulse" />
                  <div className="h-3 w-48 bg-slate-100 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-4 w-24 bg-slate-100 rounded animate-pulse hidden md:block" />
              <div className="h-6 w-16 bg-slate-100 rounded-full animate-pulse" />
              <div className="h-8 w-20 bg-slate-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="w-full bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-sm">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
          <UserIcon className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">
          No users found
        </h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          No matching records found in PostgreSQL. Try adjusting your search query, clearing filters, or adding a new user.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50/75 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th scope="col" className="py-3.5 px-4 w-16 text-center">
                ID
              </th>
              <th scope="col" className="py-3.5 px-4">
                User
              </th>
              <th scope="col" className="py-3.5 px-4 hidden md:table-cell">
                Contact
              </th>
              <th scope="col" className="py-3.5 px-4 hidden lg:table-cell">
                Department & Role
              </th>
              <th scope="col" className="py-3.5 px-4">
                Status
              </th>
              <th scope="col" className="py-3.5 px-4 hidden sm:table-cell">
                Created
              </th>
              <th scope="col" className="py-3.5 px-4 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-slate-50/60 transition-colors group"
              >
                {/* ID */}
                <td className="py-4 px-4 text-center font-mono text-xs text-slate-400 font-medium">
                  #{user.id}
                </td>

                {/* Full Name & Avatar */}
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-xs flex items-center justify-center flex-shrink-0 border border-indigo-200">
                      {getInitials(user.full_name)}
                    </div>
                    <div>
                      <div
                        onClick={() => onViewDetails?.(user)}
                        className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer"
                      >
                        {user.full_name}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 md:hidden">
                        <Mail className="w-3 h-3" />
                        <span className="truncate max-w-[150px]">{user.email}</span>
                      </div>
                    </div>
                  </div>
                </td>

                {/* Contact (Email & Phone) */}
                <td className="py-4 px-4 hidden md:table-cell">
                  <div className="space-y-0.5">
                    <div className="text-xs text-slate-700 flex items-center gap-1.5 font-medium">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                  </div>
                </td>

                {/* Department & Role */}
                <td className="py-4 px-4 hidden lg:table-cell">
                  <div>
                    {user.department ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        <Building className="w-3 h-3 text-slate-500" />
                        {user.department}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">None</span>
                    )}
                    {user.job_role && (
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-slate-400" />
                        <span>{user.job_role}</span>
                      </div>
                    )}
                  </div>
                </td>

                {/* Status */}
                <td className="py-4 px-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      user.status === "Active"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        user.status === "Active"
                          ? "bg-emerald-500"
                          : "bg-amber-500"
                      }`}
                    />
                    {user.status}
                  </span>
                </td>

                {/* Created Date */}
                <td className="py-4 px-4 text-xs text-slate-500 hidden sm:table-cell">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDate(user.created_at)}</span>
                  </div>
                </td>

                {/* Actions */}
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onEdit(user)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-colors"
                      title="Edit user"
                      aria-label={`Edit ${user.full_name}`}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(user)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                      title="Delete user"
                      aria-label={`Delete ${user.full_name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

