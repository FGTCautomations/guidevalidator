"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

type User = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: string;
  verified?: boolean;
  isFrozen?: boolean;
  organizationName?: string | null;
};

type DashboardUsersTableProps = {
  users: User[];
  locale: string;
  roleLabels: Record<string, string>;
  translations: {
    nameColumn: string;
    emailColumn: string;
    roleColumn: string;
    createdColumn: string;
    statusColumn: string;
    actionsColumn: string;
    viewAction: string;
    fallbackName: string;
    empty: string;
    searchPlaceholder: string;
    filterByRole: string;
    filterByStatus: string;
    allRoles: string;
    allStatuses: string;
    active: string;
    frozen: string;
    unverified: string;
  };
};

export function DashboardUsersTable({ users, locale, roleLabels, translations }: DashboardUsersTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase());

      // Role filter
      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      // Status filter
      let matchesStatus = true;
      if (statusFilter === "active") {
        matchesStatus = (user.verified ?? false) && !(user.isFrozen ?? false);
      } else if (statusFilter === "frozen") {
        matchesStatus = user.isFrozen ?? false;
      } else if (statusFilter === "unverified") {
        matchesStatus = !(user.verified ?? false) && !(user.isFrozen ?? false);
      }

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const availableRoles = useMemo(() => {
    const roles = new Set(users.map(u => u.role));
    return Array.from(roles).sort();
  }, [users]);

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
        <input
          type="text"
          placeholder={translations.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
        >
          <option value="all">{translations.allRoles}</option>
          {availableRoles.map((role) => (
            <option key={role} value={role}>
              {roleLabels[role] || role}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
        >
          <option value="all">{translations.allStatuses}</option>
          <option value="active">{translations.active}</option>
          <option value="frozen">{translations.frozen}</option>
          <option value="unverified">{translations.unverified}</option>
        </select>
      </div>

      {/* Results count */}
      {(searchQuery || roleFilter !== "all" || statusFilter !== "all") && (
        <div className="text-sm text-foreground/70">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-foreground/60">
            <tr>
              <th className="px-3 py-2">{translations.nameColumn}</th>
              <th className="px-3 py-2">{translations.emailColumn}</th>
              <th className="px-3 py-2">{translations.roleColumn}</th>
              <th className="px-3 py-2">{translations.createdColumn}</th>
              <th className="px-3 py-2">{translations.statusColumn}</th>
              <th className="px-3 py-2 text-right">{translations.actionsColumn}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground/10">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center text-sm text-foreground/60">
                  {translations.empty}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const createdLabel = new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                  new Date(user.createdAt)
                );
                const roleLabel = roleLabels[user.role] || user.role;
                return (
                  <tr key={user.id} className="bg-white/40">
                    <td className="px-3 py-3 text-foreground">
                      <div className="flex flex-col">
                        <span className="font-medium">{user.name ?? translations.fallbackName}</span>
                        {user.organizationName ? (
                          <span className="text-xs text-foreground/60">{user.organizationName}</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-foreground/70">{user.email ?? "--"}</td>
                    <td className="px-3 py-3 text-foreground/70">{roleLabel}</td>
                    <td className="px-3 py-3 text-foreground/70">{createdLabel}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        {(user.isFrozen ?? false) ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800">
                            ❄️ Frozen
                          </span>
                        ) : (user.verified ?? false) ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                            ✅ Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                            Unverified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Link
                        href={`/${locale}/admin/users/${user.id}`}
                        className="text-sm font-semibold text-secondary transition hover:text-secondary/80"
                      >
                        {translations.viewAction}
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
