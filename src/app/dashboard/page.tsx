"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  ArrowRight,
  TrendingUp,
  Building,
  RefreshCw,
  Plus,
} from "lucide-react";
import StatsCard from "@/components/StatsCard";
import UserTable from "@/components/UserTable";
import UserFormModal from "@/components/UserFormModal";
import DeleteDialog from "@/components/DeleteDialog";
import UserDetailsModal from "@/components/UserDetailsModal";
import DbStatusBanner from "@/components/DbStatusBanner";
import { useToast } from "@/components/Toast";
import { DashboardStats, User } from "@/types/user";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const toast = useToast();

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setDbError(null);
      const res = await fetch("/api/dashboard/stats", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        setDbError(data.error || "Failed to load dashboard metrics");
        return;
      }

      setStats(data.data);
    } catch {
      setDbError("Unable to reach backend API. Ensure PostgreSQL server is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleEdit = (user: User) => {
    setUserToEdit(user);
    setIsFormOpen(true);
  };

  const handleDeletePrompt = (user: User) => {
    setUserToDelete(user);
  };

  const handleConfirmDelete = async (userId: number) => {
    const res = await fetch(`/api/users/${userId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to delete user");
    }
    toast.success("User deleted successfully from database");
    fetchStats();
  };

  const handleFormSuccess = (_user: User, isNew: boolean) => {
    toast.success(
      isNew
        ? "New user registered in PostgreSQL"
        : "User details updated successfully"
    );
    fetchStats();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Dashboard Overview
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time user analytics and directory management powered by PostgreSQL.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchStats()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => {
              setUserToEdit(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-sm shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Database Error Banner if any */}
      <DbStatusBanner error={dbError} onRetry={fetchStats} />

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Users"
          value={stats?.totalUsers ?? 0}
          subtitle="All registered records"
          icon={Users}
          variant="indigo"
          isLoading={loading}
        />
        <StatsCard
          title="Active Users"
          value={stats?.activeUsers ?? 0}
          subtitle="Operational accounts"
          icon={UserCheck}
          variant="emerald"
          isLoading={loading}
        />
        <StatsCard
          title="Inactive Users"
          value={stats?.inactiveUsers ?? 0}
          subtitle="Disabled or pending"
          icon={UserX}
          variant="amber"
          isLoading={loading}
        />
        <StatsCard
          title="Recently Added"
          value={stats?.recentlyAddedUsers ?? 0}
          subtitle="Added within last 30 days"
          icon={UserPlus}
          variant="sky"
          isLoading={loading}
        />
      </div>

      {/* Department Distribution Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm lg:col-span-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Department Distribution
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {stats?.departments?.length || 0} depts
            </span>
          </div>

          <div className="flex-1 space-y-3.5 pt-2">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-3 w-28 bg-slate-200 rounded animate-pulse" />
                  <div className="h-2 w-full bg-slate-100 rounded-full animate-pulse" />
                </div>
              ))
            ) : stats?.departments && stats.departments.length > 0 ? (
              stats.departments.map((dept) => {
                const total = stats.totalUsers || 1;
                const percent = Math.round((dept.count / total) * 100);
                return (
                  <div key={dept.department} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700">
                        {dept.department}
                      </span>
                      <span className="text-slate-400 font-medium">
                        {dept.count} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-6">
                No department data available.
              </p>
            )}
          </div>
        </div>

        {/* Quick Highlights / Architecture Summary */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-2xl border border-slate-800 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <TrendingUp className="w-4 h-4" />
              <span>Production-Grade Architecture</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Full-Stack PostgreSQL Engine
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
              This application communicates directly with PostgreSQL via connection
              pooling (`pg.Pool`), executing parameterized raw SQL queries for all
              CRUD actions. Fully prepared for Nimbus deployment with private hostnames.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Database</span>
              <strong className="text-white font-semibold">PostgreSQL</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Query Mechanism</span>
              <strong className="text-emerald-400 font-semibold">Raw SQL (No ORM)</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Safety</span>
              <strong className="text-indigo-300 font-semibold">Parameterized</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Users Table Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Recently Added Users
            </h3>
            <p className="text-xs text-slate-500">
              Latest user accounts created in PostgreSQL
            </p>
          </div>
          <Link
            href="/users"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <span>View All Users</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <UserTable
          users={stats?.recentUsers || []}
          isLoading={loading}
          onEdit={handleEdit}
          onDelete={handleDeletePrompt}
          onViewDetails={(u) => setSelectedUser(u)}
        />
      </div>

      {/* Modals */}
      <UserFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleFormSuccess}
        userToEdit={userToEdit}
      />

      <DeleteDialog
        isOpen={Boolean(userToDelete)}
        user={userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      <UserDetailsModal
        isOpen={Boolean(selectedUser)}
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onEdit={(u) => {
          setSelectedUser(null);
          handleEdit(u);
        }}
      />
    </div>
  );
}

