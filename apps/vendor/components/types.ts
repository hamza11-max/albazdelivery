// Shared types for staff management
export interface StaffUser {
  id: string
  name: string
  email: string
  role: "owner" | "manager" | "cashier" | "staff"
  password?: string
}

