"use client"

import { useState, useEffect } from "react"
import type { Order, User as UserType, RegistrationRequest } from "@/root/lib/types"

export function useAdminData() {
  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<UserType[]>([])
  const [drivers, setDrivers] = useState<UserType[]>([])
  const [vendors, setVendors] = useState<UserType[]>([])
  const [registrationRequests, setRegistrationRequests] = useState<RegistrationRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders", {
        credentials: 'include',
      })
      const data = await response.json()
      const orders = data?.data?.orders ?? []
      setOrders(orders)
    } catch (error) {
      console.error("[Admin] Error fetching orders:", error)
      setOrders([])
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users", {
        credentials: 'include',
      })
      const data = await response.json()
      const users = data?.data?.users ?? []
      
      setCustomers(users.filter((u: UserType) => u.role.toLowerCase() === "customer"))
      setDrivers(users.filter((u: UserType) => u.role.toLowerCase() === "driver"))
      setVendors(users.filter((u: UserType) => u.role.toLowerCase() === "vendor"))
    } catch (error) {
      console.error("[Admin] Error fetching users:", error)
      setCustomers([])
      setDrivers([])
      setVendors([])
    }
  }

  const fetchRegistrationRequests = async () => {
    try {
      const response = await fetch("/api/admin/registration-requests", {
        credentials: 'include',
      })
      const data = await response.json()
      const requests = data?.data?.requests ?? []
      setRegistrationRequests(requests)
    } catch (error) {
      console.error("[Admin] Error fetching registration requests:", error)
      setRegistrationRequests([])
    }
  }

  const refreshAll = async () => {
    setIsLoading(true)
    await Promise.all([
      fetchOrders(),
      fetchUsers(),
      fetchRegistrationRequests(),
    ])
    setIsLoading(false)
  }

  useEffect(() => {
    refreshAll()
  }, [])

  return {
    orders,
    customers,
    drivers,
    vendors,
    registrationRequests,
    isLoading,
    refreshAll,
    fetchUsers,
    fetchOrders,
    fetchRegistrationRequests,
  }
}

