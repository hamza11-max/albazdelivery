"use client"

export type Permission =
  | "pos.view"
  | "pos.create"
  | "pos.edit"
  | "pos.delete"
  | "inventory.view"
  | "inventory.create"
  | "inventory.edit"
  | "inventory.delete"
  | "sales.view"
  | "sales.create"
  | "sales.edit"
  | "sales.delete"
  | "orders.view"
  | "orders.edit"
  | "orders.delete"
  | "customers.view"
  | "customers.create"
  | "customers.edit"
  | "customers.delete"
  | "staff.view"
  | "staff.create"
  | "staff.edit"
  | "staff.delete"
  | "reports.view"
  | "settings.view"
  | "settings.edit"
  | "coupons.view"
  | "coupons.create"
  | "coupons.edit"
  | "coupons.delete"
  | "backup.view"
  | "backup.create"
  | "backup.restore"

export type Role = "owner" | "manager" | "cashier" | "staff"

export interface RolePermissions {
  role: Role
  permissions: Permission[]
  name: string
  description: string
}

export const DEFAULT_ROLE_PERMISSIONS: Record<Role, RolePermissions> = {
  owner: {
    role: "owner",
    name: "Propriétaire",
    description: "Accès complet à toutes les fonctionnalités",
    permissions: [
      "pos.view",
      "pos.create",
      "pos.edit",
      "pos.delete",
      "inventory.view",
      "inventory.create",
      "inventory.edit",
      "inventory.delete",
      "sales.view",
      "sales.create",
      "sales.edit",
      "sales.delete",
      "orders.view",
      "orders.edit",
      "orders.delete",
      "customers.view",
      "customers.create",
      "customers.edit",
      "customers.delete",
      "staff.view",
      "staff.create",
      "staff.edit",
      "staff.delete",
      "reports.view",
      "settings.view",
      "settings.edit",
      "coupons.view",
      "coupons.create",
      "coupons.edit",
      "coupons.delete",
      "backup.view",
      "backup.create",
      "backup.restore",
    ],
  },
  manager: {
    role: "manager",
    name: "Gestionnaire",
    description: "Gestion complète sauf paramètres système et personnel",
    permissions: [
      "pos.view",
      "pos.create",
      "pos.edit",
      "inventory.view",
      "inventory.create",
      "inventory.edit",
      "sales.view",
      "sales.create",
      "orders.view",
      "orders.edit",
      "customers.view",
      "customers.create",
      "customers.edit",
      "reports.view",
      "settings.view",
      "coupons.view",
      "coupons.create",
      "coupons.edit",
    ],
  },
  cashier: {
    role: "cashier",
    name: "Caissier",
    description: "Accès POS et ventes uniquement",
    permissions: [
      "pos.view",
      "pos.create",
      "sales.view",
      "sales.create",
      "customers.view",
      "customers.create",
    ],
  },
  staff: {
    role: "staff",
    name: "Employé",
    description: "Accès limité en lecture seule",
    permissions: [
      "pos.view",
      "inventory.view",
      "sales.view",
      "orders.view",
      "customers.view",
    ],
  },
}

export interface StaffMember {
  id: string
  name: string
  email: string
  role: Role
  permissions?: Permission[]
  isActive: boolean
  createdAt: string
}

export function getRolePermissions(role: Role): Permission[] {
  return DEFAULT_ROLE_PERMISSIONS[role]?.permissions || []
}

export function hasPermission(userPermissions: Permission[], permission: Permission): boolean {
  return userPermissions.includes(permission)
}

export function hasAnyPermission(userPermissions: Permission[], permissions: Permission[]): boolean {
  return permissions.some((perm) => userPermissions.includes(perm))
}

export function hasAllPermissions(userPermissions: Permission[], permissions: Permission[]): boolean {
  return permissions.every((perm) => userPermissions.includes(permission))
}

export function getStaffPermissions(staff: StaffMember): Permission[] {
  if (staff.permissions && staff.permissions.length > 0) {
    return staff.permissions
  }
  return getRolePermissions(staff.role)
}

export function saveStaffPermissions(staffId: string, permissions: Permission[]): void {
  const staffList: StaffMember[] = JSON.parse(localStorage.getItem('vendor-staff') || '[]')
  const updated = staffList.map((s) => {
    if (s.id === staffId) {
      return { ...s, permissions }
    }
    return s
  })
  localStorage.setItem('vendor-staff', JSON.stringify(updated))
}

export function getCurrentUserRole(): Role | null {
  if (typeof window === 'undefined') return null
  // In a real app, this would come from auth context
  const stored = localStorage.getItem('vendor-current-user-role')
  return stored ? (stored as Role) : null
}

export function setCurrentUserRole(role: Role): void {
  localStorage.setItem('vendor-current-user-role', role)
}

export function canAccess(userRole: Role | null, requiredPermission: Permission): boolean {
  if (!userRole) return false
  const rolePerms = getRolePermissions(userRole)
  return hasPermission(rolePerms, requiredPermission)
}

