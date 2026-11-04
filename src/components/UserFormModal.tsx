"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, UserCheck, AlertCircle } from "lucide-react";
import { User } from "@/types/user";

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedUser: User, isNew: boolean) => void;
  userToEdit?: User | null;
}

const COMMON_DEPARTMENTS = [
  "Engineering",
  "Product",
  "Design",
  "Marketing",
  "Sales",
  "Human Resources",
  "Finance",
  "Operations",
  "Customer Success",
  "Legal",
];

export default function UserFormModal({
  isOpen,
  onClose,
  onSuccess,
  userToEdit,
}: UserFormModalProps) {
  const isEditing = Boolean(userToEdit);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    department: "Engineering",
    customDepartment: "",
    job_role: "",
    status: "Active" as "Active" | "Inactive",
  });

  const [isCustomDept, setIsCustomDept] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (userToEdit) {
      const isCustom =
        Boolean(userToEdit.department) &&
        !COMMON_DEPARTMENTS.includes(userToEdit.department || "");
      setIsCustomDept(isCustom);
      setFormData({
        full_name: userToEdit.full_name || "",
        email: userToEdit.email || "",
        phone: userToEdit.phone || "",
        department: isCustom ? "custom" : userToEdit.department || "Engineering",
        customDepartment: isCustom ? userToEdit.department || "" : "",
        job_role: userToEdit.job_role || "",
        status: userToEdit.status === "Inactive" ? "Inactive" : "Active",
      });
    } else {
      setIsCustomDept(false);
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        department: "Engineering",
        customDepartment: "",
        job_role: "",
        status: "Active",
      });
    }
    setErrors({});
    setServerError(null);
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full Name is required.";
    } else if (formData.full_name.length > 150) {
      newErrors.full_name = "Full Name cannot exceed 150 characters.";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email Address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    } else if (formData.email.length > 255) {
      newErrors.email = "Email cannot exceed 255 characters.";
    }

    if (formData.phone && formData.phone.length > 20) {
      newErrors.phone = "Phone number cannot exceed 20 characters.";
    }

    if (isCustomDept && !formData.customDepartment.trim()) {
      newErrors.department = "Please specify the custom department.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setSubmitting(true);
    const resolvedDepartment = isCustomDept
      ? formData.customDepartment.trim()
      : formData.department.trim();

    const payload = {
      full_name: formData.full_name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim() || null,
      department: resolvedDepartment || null,
      job_role: formData.job_role.trim() || null,
      status: formData.status,
    };

    try {
      const url = isEditing ? `/api/users/${userToEdit!.id}` : "/api/users";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || "Failed to save user information");
        setSubmitting(false);
        return;
      }

      onSuccess(data.data, !isEditing);
      onClose();
    } catch {
      setServerError("Network error: Unable to reach the server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {isEditing ? "Edit User Profile" : "Create New User"}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? `Updating record for ${userToEdit?.full_name}`
                  : "Add a new team member to PostgreSQL database"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {serverError && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={150}
              placeholder="e.g. Alexander Mitchell"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              className={`w-full px-3.5 py-2 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                errors.full_name
                  ? "border-rose-300 focus:ring-rose-400"
                  : "border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
              }`}
            />
            {errors.full_name && (
              <p className="text-rose-500 text-xs mt-1">{errors.full_name}</p>
            )}
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              maxLength={255}
              placeholder="e.g. alexander@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className={`w-full px-3.5 py-2 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                errors.email
                  ? "border-rose-300 focus:ring-rose-400"
                  : "border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
              }`}
            />
            {errors.email && (
              <p className="text-rose-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              maxLength={20}
              placeholder="e.g. +1 (555) 019-2834"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className={`w-full px-3.5 py-2 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                errors.phone
                  ? "border-rose-300 focus:ring-rose-400"
                  : "border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
              }`}
            />
            {errors.phone && (
              <p className="text-rose-500 text-xs mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Department & Job Role grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Department
              </label>
              <select
                value={isCustomDept ? "custom" : formData.department}
                onChange={(e) => {
                  if (e.target.value === "custom") {
                    setIsCustomDept(true);
                  } else {
                    setIsCustomDept(false);
                    setFormData({ ...formData, department: e.target.value });
                  }
                }}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {COMMON_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
                <option value="custom">+ Other / Custom</option>
              </select>

              {isCustomDept && (
                <input
                  type="text"
                  placeholder="Enter custom department"
                  value={formData.customDepartment}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customDepartment: e.target.value,
                    })
                  }
                  className="mt-2 w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Job Role
              </label>
              <input
                type="text"
                maxLength={100}
                placeholder="e.g. Lead Designer"
                value={formData.job_role}
                onChange={(e) =>
                  setFormData({ ...formData, job_role: e.target.value })
                }
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Account Status
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${
                  formData.status === "Active"
                    ? "border-emerald-300 bg-emerald-50/50 text-emerald-950 font-medium shadow-sm"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value="Active"
                  checked={formData.status === "Active"}
                  onChange={() =>
                    setFormData({ ...formData, status: "Active" })
                  }
                  className="accent-emerald-600"
                />
                <span className="text-xs">Active User</span>
              </label>

              <label
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${
                  formData.status === "Inactive"
                    ? "border-amber-300 bg-amber-50/50 text-amber-950 font-medium shadow-sm"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value="Inactive"
                  checked={formData.status === "Inactive"}
                  onChange={() =>
                    setFormData({ ...formData, status: "Inactive" })
                  }
                  className="accent-amber-600"
                />
                <span className="text-xs">Inactive User</span>
              </label>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-sm shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditing ? "Save Changes" : "Save User"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

