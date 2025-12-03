"use client"

import { useState } from "react"
import {
  ShoppingCart,
  Settings,
  BarChart3,
  Users,
  Package,
  Zap,
  HelpCircle,
  Home,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Minus,
  DollarSign,
} from "lucide-react"

interface Product {
  id: string
  name: string
  price: number
  image: string
  category: string
  quantity?: number
}

interface CartItem extends Product {
  cartQuantity: number
}

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Product full name goes here",
    price: 100,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop",
    category: "Clothing",
  },
  {
    id: "2",
    name: "Product full name goes here",
    price: 100,
    image: "https://images.unsplash.com/photo-1598033129519-396e95c8f14e?w=300&h=300&fit=crop",
    category: "Clothing",
  },
  {
    id: "3",
    name: "Product full name goes here",
    price: 100,
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=300&h=300&fit=crop",
    category: "Clothing",
  },
  {
    id: "4",
    name: "Product full name goes here",
    price: 100,
    image: "https://images.unsplash.com/photo-1564584684050-fde1c2ae2a45?w=300&h=300&fit=crop",
    category: "Clothing",
  },
  {
    id: "5",
    name: "Product full name goes here",
    price: 100,
    image: "https://images.unsplash.com/photo-1495385794356-15371f348c6d?w=300&h=300&fit=crop",
    category: "Clothing",
  },
  {
    id: "6",
    name: "Product full name goes here",
    price: 100,
    image: "https://images.unsplash.com/photo-1593618998160-e34014e67546?w=300&h=300&fit=crop",
    category: "Clothing",
  },
  {
    id: "7",
    name: "Product full name goes here",
    price: 100,
    image: "https://images.unsplash.com/photo-1542272604-787c62d465d1?w=300&h=300&fit=crop",
    category: "Clothing",
  },
  {
    id: "8",
    name: "Product full name goes here",
    price: 100,
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300&h=300&fit=crop",
    category: "Clothing",
  },
  {
    id: "9",
    name: "Product full name goes here",
    price: 100,
    image: "https://images.unsplash.com/photo-1506435773649-6f3db1b912d2?w=300&h=300&fit=crop",
    category: "Clothing",
  },
]

export default function POSDashboard() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [activeTab, setActiveTab] = useState("pos")
  const [quantity, setQuantity] = useState("1")
  const [showKeypad, setShowKeypad] = useState(true)
  const [touchedLabel, setTouchedLabel] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>("All")
  const [isSummaryOpen, setIsSummaryOpen] = useState(true)
  const [discount, setDiscount] = useState(0)
  const [coupon, setCoupon] = useState("")

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id)
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, cartQuantity: item.cartQuantity + 1 }
            : item
        )
      }
      return [...prevCart, { ...product, cartQuantity: 1 }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId))
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, cartQuantity: newQuantity } : item
      )
    )
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.cartQuantity, 0)
  const tax = subtotal * 0.1 // 10% tax
  const total = subtotal - discount + tax

  const handleKeypadInput = (value: string) => {
    if (value === "clear") {
      setQuantity("0")
    } else if (value === "backspace") {
      setQuantity(quantity.slice(0, -1) || "0")
    } else {
      setQuantity((prev) => (prev === "0" ? value : prev + value))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Main Container */}
      <div className="flex h-screen flex-col md:flex-row">
        {/* Sidebar */}
          <aside className="hidden md:flex w-24 bg-gradient-to-b from-white to-slate-50 border-r border-slate-200/50 flex-col items-center py-8 gap-8 shadow-sm">
          {/* Logo */}
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-bold text-sm">
            Ab
          </div>

          {/* Navigation Items (icons only, slide labels on hover) */}
          <nav className="flex flex-col gap-6 flex-1">
            {/* POS Tab - Highlighted */}
            <button
              onClick={() => {
                setActiveTab("pos")
                if (typeof window !== "undefined" && window.innerWidth < 768) {
                  setTouchedLabel((p) => (p === "pos" ? null : "pos"))
                }
              }}
              className={`relative group w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
                activeTab === "pos"
                  ? "bg-yellow-300 text-slate-900 shadow-lg shadow-yellow-300/30"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              title="POS"
            >
              <ShoppingCart size={24} />
              <span className={`pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 transform transition-all bg-white/80 backdrop-blur rounded-md px-3 py-1 text-sm text-slate-900 shadow ${
                touchedLabel === "pos"
                  ? "opacity-100 translate-x-0 scale-100"
                  : "opacity-0 -translate-x-2 scale-95"
              } group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100`}>
                POS
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("sales")
                if (typeof window !== "undefined" && window.innerWidth < 768) {
                  setTouchedLabel((p) => (p === "sales" ? null : "sales"))
                }
              }}
              className={`relative group w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
                activeTab === "sales"
                  ? "bg-yellow-300 text-slate-900"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              title="Sales"
            >
              <BarChart3 size={24} />
              <span className={`pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 transform transition-all bg-white/80 backdrop-blur rounded-md px-3 py-1 text-sm text-slate-900 shadow ${
                touchedLabel === "sales"
                  ? "opacity-100 translate-x-0 scale-100"
                  : "opacity-0 -translate-x-2 scale-95"
              } group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100`}>
                Sales
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("inventory")
                if (typeof window !== "undefined" && window.innerWidth < 768) {
                  setTouchedLabel((p) => (p === "inventory" ? null : "inventory"))
                }
              }}
              className={`relative group w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
                activeTab === "inventory"
                  ? "bg-yellow-300 text-slate-900"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              title="Inventory"
            >
              <Package size={24} />
              <span className={`pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 transform transition-all bg-white/80 backdrop-blur rounded-md px-3 py-1 text-sm text-slate-900 shadow ${
                touchedLabel === "inventory"
                  ? "opacity-100 translate-x-0 scale-100"
                  : "opacity-0 -translate-x-2 scale-95"
              } group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100`}>
                Inventory
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("customers")
                if (typeof window !== "undefined" && window.innerWidth < 768) {
                  setTouchedLabel((p) => (p === "customers" ? null : "customers"))
                }
              }}
              className={`relative group w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
                activeTab === "customers"
                  ? "bg-yellow-300 text-slate-900"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              title="Customers"
            >
              <Users size={24} />
              <span className={`pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 transform transition-all bg-white/80 backdrop-blur rounded-md px-3 py-1 text-sm text-slate-900 shadow ${
                touchedLabel === "customers"
                  ? "opacity-100 translate-x-0 scale-100"
                  : "opacity-0 -translate-x-2 scale-95"
              } group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100`}>
                Customers
              </span>
            </button>

            <button
              onClick={() => setActiveTab("quick")}
              className={`relative group w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
                activeTab === "quick"
                  ? "bg-yellow-300 text-slate-900"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              title="Quick Access"
            >
              <Zap size={24} />
              <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 ml-2 w-max origin-left scale-75 opacity-0 group-hover:opacity-100 group-hover:scale-100 transform transition-all bg-white/80 backdrop-blur rounded-md px-3 py-1 text-sm text-slate-900 shadow">
                Quick
              </span>
            </button>
          </nav>

          {/* Bottom Navigation */}
          <div className="flex flex-col gap-6 mt-auto">
            <button className="w-12 h-12 rounded-lg text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all duration-200">
              <Settings size={24} />
            </button>
            <button className="w-12 h-12 rounded-lg text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all duration-200">
              <HelpCircle size={24} />
            </button>
          </div>
        </aside>

        {/* Mobile bottom nav (phones) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 border-t border-slate-200/50 flex items-center justify-around py-2 shadow-lg z-50">
          {[
            { id: 'pos', Icon: ShoppingCart, label: 'POS' },
            { id: 'sales', Icon: BarChart3, label: 'Sales' },
            { id: 'inventory', Icon: Package, label: 'Inventory' },
            { id: 'customers', Icon: Users, label: 'Customers' },
            { id: 'quick', Icon: Zap, label: 'Quick' },
          ].map((it) => (
            <button
              key={it.id}
              onClick={() => {
                setActiveTab(it.id)
                setTouchedLabel((p) => (p === it.id ? null : it.id))
              }}
              className={`relative flex flex-col items-center justify-center gap-1 text-sm text-slate-700 ${
                activeTab === it.id ? 'text-amber-600' : 'text-slate-500'
              }`}
            >
              <it.Icon size={20} />
              <span className={`text-xs transition-opacity ${touchedLabel === it.id ? 'opacity-100' : 'opacity-0'}`}>
                {it.label}
              </span>
            </button>
          ))}
        </nav>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top header removed for clean POS view */}

          {/* Tabs */}
          <div className="bg-white border-b border-slate-200/50 px-8 py-4 flex gap-8">
            <button
              onClick={() => setActiveTab("pos")}
              className={`pb-2 px-2 font-medium text-sm transition-all ${
                activeTab === "pos"
                  ? "text-slate-900 border-b-2 border-amber-400"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              POS Merchant
            </button>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`pb-2 px-2 font-medium text-sm transition-all ${
                activeTab === "dashboard"
                  ? "text-slate-900 border-b-2 border-amber-400"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              POS Dashboard
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Products Grid */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
              <div className="mb-4">
                {/* Category Filters Horizontal Bar */}
                <div className="flex gap-3 overflow-x-auto pb-2">
                  <button onClick={() => setFilterCategory("All")} className={`whitespace-nowrap px-3 py-1 rounded-lg text-sm font-medium transition-all ${filterCategory === "All" ? "bg-emerald-100 text-emerald-800" : "bg-white/60 text-slate-700"}`}>
                    All
                  </button>
                  {Array.from(new Set(SAMPLE_PRODUCTS.map((p) => p.category))).map((cat) => (
                    <button key={cat} onClick={() => setFilterCategory(cat)} className={`whitespace-nowrap px-3 py-1 rounded-lg text-sm font-medium transition-all ${filterCategory === cat ? "bg-emerald-100 text-emerald-800" : "bg-white/60 text-slate-700"}`}>
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-4">
                  {SAMPLE_PRODUCTS.filter((p) => filterCategory === "All" || p.category === filterCategory).map((product) => (
                    <div key={product.id} onClick={() => addToCart(product)} className="rounded-xl bg-white shadow-md hover:shadow-xl transition-shadow duration-200 p-3 cursor-pointer">
                      <div className="rounded-lg overflow-hidden bg-gradient-to-br from-emerald-50 to-slate-50">
                        <img src={product.image} alt="" className="w-full h-40 object-cover" />
                      </div>
                      <div className="mt-3">
                        <div className="text-sm font-medium text-slate-800">{product.name}</div>
                        <div className="text-xs text-slate-500">{product.category}</div>
                        <div className="mt-2 font-semibold text-slate-900">${product.price}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    <p className="text-sm">No items in cart</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white/50 backdrop-blur-sm border border-slate-100/50 rounded-lg p-3 hover:bg-slate-50/50 transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {item.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            ${item.price} each
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-100/50 rounded-lg p-1 w-fit">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.cartQuantity - 1
                            )
                          }
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-200 transition-colors"
                        >
                          <Minus size={14} className="text-slate-600" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-slate-900">
                          {item.cartQuantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.cartQuantity + 1
                            )
                          }
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-200 transition-colors"
                        >
                          <Plus size={14} className="text-slate-600" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

              {/* Summary */}
              <div className="px-6 py-4 space-y-3 bg-white/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-medium text-slate-900">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Tax (10%)</span>
                  <span className="font-medium text-slate-900">
                    ${tax.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Discount</span>
                  <span className="font-medium text-slate-900">$0.00</span>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">Total</span>
                  <span className="text-2xl font-bold text-slate-900">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Keypad Toggle */}
              <div className="border-t border-slate-200/50 px-6 py-3">
                <button
                  onClick={() => setShowKeypad(!showKeypad)}
                  className="w-full py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  {showKeypad ? "Hide" : "Show"} Calculator
                </button>
              </div>

              {/* Numeric Keypad */}
              {showKeypad && (
                <div className="bg-white/50 border-t border-slate-200/50 px-6 py-4">
                  <div className="mb-3 text-right">
                    <div className="text-3xl font-bold text-slate-900">
                      {quantity || "0"}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Enter quantity
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      "1",
                      "2",
                      "3",
                      "4",
                      "5",
                      "6",
                      "7",
                      "8",
                      "9",
                      ".",
                      "0",
                      "00",
                    ].map((num) => (
                      <button
                        key={num}
                        onClick={() => handleKeypadInput(num)}
                        className="py-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold transition-all active:scale-95"
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleKeypadInput("backspace")}
                      className="py-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold transition-all text-sm active:scale-95"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={() => handleKeypadInput("clear")}
                      className="py-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold transition-all text-sm active:scale-95"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="bg-gradient-to-t from-white to-slate-50 border-t border-slate-200/50 px-6 py-4 space-y-3">
                <button className="w-full py-3 rounded-lg bg-gradient-to-r from-slate-800 to-slate-900 text-white font-semibold hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
                  <ShoppingCart size={18} />
                  Refund
                </button>
                <button className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold hover:shadow-lg transition-all active:scale-95">
                  Print Session
                </button>
                <button className="w-full py-3 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:shadow-lg hover:shadow-green-500/30 transition-all active:scale-95">
                  Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
