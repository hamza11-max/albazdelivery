"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@albaz/ui"
import { Loader2, Package, RefreshCw } from "lucide-react"
import { useToast } from "@/root/hooks/use-toast"
import { fetchWithCsrf } from "../lib/csrf-client"
import { useAdminI18n } from "../lib/AdminI18nProvider"

type StoreOpt = { id: string; name: string; city: string }
type ProductRow = {
  id: string
  name: string
  price: number
  available: boolean
  store: { id: string; name: string; city: string }
}

export function AdminProductsView() {
  const { toast } = useToast()
  const { t } = useAdminI18n()
  const [stores, setStores] = useState<StoreOpt[]>([])
  const [storeId, setStoreId] = useState("")
  const [search, setSearch] = useState("")
  const [searchApplied, setSearchApplied] = useState("")
  const [availableFilter, setAvailableFilter] = useState("all")
  const [products, setProducts] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/admin/stores", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.stores) {
          setStores(
            (d.data.stores as { id: string; name: string; city: string }[]).map((s) => ({
              id: s.id,
              name: s.name,
              city: s.city,
            })),
          )
        }
      })
      .catch(() => {})
  }, [])

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: "80", page: "1" })
      if (storeId) params.set("storeId", storeId)
      if (searchApplied.trim()) params.set("search", searchApplied.trim())
      if (availableFilter === "true" || availableFilter === "false") params.set("available", availableFilter)
      const res = await fetch(`/api/admin/products?${params}`, { credentials: "include" })
      const data = await res.json()
      if (data.success && data.data?.products) {
        setProducts(data.data.products)
      } else {
        setProducts([])
        toast({
          title: t("common.error"),
          description: data.error?.message || t("products.loadError"),
          variant: "destructive",
        })
      }
    } catch {
      setProducts([])
      toast({ title: t("common.error"), description: t("common.networkError"), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [storeId, searchApplied, availableFilter, toast, t])

  useEffect(() => {
    void loadProducts()
  }, [loadProducts])

  const toggleAvailable = async (p: ProductRow) => {
    setTogglingId(p.id)
    try {
      const res = await fetchWithCsrf("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: p.id, available: !p.available }),
      })
      const data = await res.json()
      if (data.success) {
        toast({
          title: t("products.saved"),
          description: p.available ? t("products.deactivated") : t("products.activated"),
        })
        void loadProducts()
      } else {
        toast({
          title: t("common.error"),
          description: data.error?.message || t("products.patchFail"),
          variant: "destructive",
        })
      }
    } catch {
      toast({ title: t("common.error"), variant: "destructive" })
    } finally {
      setTogglingId(null)
    }
  }

  const storeSelectValue = storeId || "all"

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t("products.adminTitle")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("products.adminSubtitle")}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>{t("products.store")}</Label>
              <Select
                value={storeSelectValue}
                onValueChange={(v) => setStoreId(v === "all" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("products.all")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("products.allStores")}</SelectItem>
                  {stores.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} — {s.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("products.availability")}</Label>
              <Select value={availableFilter} onValueChange={setAvailableFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("products.all")}</SelectItem>
                  <SelectItem value="true">{t("products.forSale")}</SelectItem>
                  <SelectItem value="false">{t("products.unavailable")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="admin-product-search">{t("products.searchLabel")}</Label>
              <div className="flex gap-2">
                <Input
                  id="admin-product-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("products.searchPlaceholder")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setSearchApplied(search)
                  }}
                />
                <Button type="button" variant="secondary" onClick={() => setSearchApplied(search)}>
                  {t("products.filter")}
                </Button>
              </div>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => void loadProducts()}>
            <RefreshCw className="mr-2 h-4 w-4" /> {t("common.refresh")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : products.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {t("products.emptyFilters")}
            </p>
          ) : (
            <div className="divide-y">
              {products.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{p.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {p.store.name} · {p.store.city}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="tabular-nums font-semibold">{p.price} DZD</span>
                    <Badge variant={p.available ? "default" : "secondary"}>
                      {p.available ? t("products.active") : t("products.inactive")}
                    </Badge>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={togglingId === p.id}
                      onClick={() => void toggleAvailable(p)}
                    >
                      {togglingId === p.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : p.available ? (
                        t("products.deactivate")
                      ) : (
                        t("products.activateBtn")
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
