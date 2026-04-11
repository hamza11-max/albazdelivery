"use client"

import type { LucideIcon } from "lucide-react"
import {
  BarChart3,
  Cloud,
  Gift,
  History,
  LayoutDashboard,
  Mail,
  Package,
  Percent,
  Radio,
  Settings,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Truck,
  UserCog,
} from "lucide-react"

export interface VendorMenuItem {
  id: string
  icon: LucideIcon
  labelFr: string
  labelAr: string
}

export const vendorMenuItems: VendorMenuItem[] = [
  { id: "dashboard", icon: LayoutDashboard, labelFr: "Tableau de bord", labelAr: "لوحة التحكم" },
  { id: "inventory", icon: Package, labelFr: "Inventaire", labelAr: "المخزون" },
  { id: "pos", icon: ShoppingCart, labelFr: "Point de Vente", labelAr: "نقطة البيع" },
  { id: "orders", icon: ShoppingBag, labelFr: "Commandes", labelAr: "الطلبات" },
  { id: "sales", icon: History, labelFr: "Ventes", labelAr: "المبيعات" },
  { id: "reports", icon: BarChart3, labelFr: "Rapports", labelAr: "التقارير" },
  { id: "coupons", icon: Percent, labelFr: "Coupons", labelAr: "الكوبونات" },
  { id: "sync-save", icon: Cloud, labelFr: "Sync & Sauvegarde", labelAr: "المزامنة والنسخ الاحتياطي" },
  { id: "email", icon: Mail, labelFr: "Email", labelAr: "البريد الإلكتروني" },
  { id: "staff-permissions", icon: Shield, labelFr: "Personnel & Permissions", labelAr: "الموظفون والصلاحيات" },
  { id: "clients-loyalty", icon: Gift, labelFr: "Clients & Fidélité", labelAr: "العملاء والولاء" },
  { id: "drivers", icon: UserCog, labelFr: "Chauffeurs", labelAr: "السائقون" },
  { id: "suppliers", icon: Truck, labelFr: "Fournisseurs", labelAr: "الموردون" },
  { id: "ai", icon: BarChart3, labelFr: "Analyse IA", labelAr: "تحليلات الذكاء الاصطناعي" },
  { id: "rfid", icon: Radio, labelFr: "RFID", labelAr: "RFID" },
  { id: "settings", icon: Settings, labelFr: "Paramètres", labelAr: "الإعدادات" },
]
