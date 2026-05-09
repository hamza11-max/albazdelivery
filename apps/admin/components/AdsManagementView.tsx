"use client"

import { useState, useEffect } from "react"
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Label, Textarea } from "@albaz/ui"
import { Plus, Edit, Trash2, Eye, EyeOff, Search, Image as ImageIcon, ExternalLink } from "lucide-react"
import { useToast } from "@/root/hooks/use-toast"
import { fetchWithCsrf } from "../lib/csrf-client"
import { apiErrorMessage } from "../lib/api-error-message"
import { useAdminI18n } from "../lib/AdminI18nProvider"

const SELECT_ALL = "__all__"

interface Ad {
  id: string
  title: string
  description: string
  imageUrl: string
  linkUrl?: string | null
  position: string
  priority: number
  isActive: boolean
  startDate?: Date | null
  endDate?: Date | null
  clickCount: number
  viewCount: number
  createdAt: Date
  updatedAt: Date
}

export function AdsManagementView() {
  const { toast } = useToast()
  const { t } = useAdminI18n()
  const [ads, setAds] = useState<Ad[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [filters, setFilters] = useState({
    position: "",
    isActive: "",
    search: "",
  })

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    linkUrl: "",
    position: "HOME_BANNER" as Ad["position"],
    priority: 0,
    isActive: true,
    startDate: "",
    endDate: "",
  })

  const fetchAds = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.position) params.append("position", filters.position)
      if (filters.isActive !== "") params.append("isActive", filters.isActive)

      const response = await fetch(`/api/admin/ads?${params.toString()}`, {
        credentials: 'include',
      })
      const data = await response.json()
      setAds(data?.data?.ads || [])
    } catch (error) {
      console.error("[Admin] Error fetching ads:", error)
      setAds([])
      toast({
        title: t("common.error"),
        description: t("ads.loadError"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAds()
  }, [filters.position, filters.isActive])

  const filteredAds = filters.search
    ? ads.filter((ad) =>
        ad.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        (ad.description && ad.description.toLowerCase().includes(filters.search.toLowerCase()))
      )
    : ads

  const handleCreate = () => {
    setSelectedAd(null)
    setFormData({
      title: "",
      description: "",
      imageUrl: "",
      linkUrl: "",
      position: "HOME_BANNER",
      priority: 0,
      isActive: true,
      startDate: "",
      endDate: "",
    })
    setShowDialog(true)
  }

  const handleEdit = (ad: Ad) => {
    setSelectedAd(ad)
    setFormData({
      title: ad.title,
      description: ad.description || "",
      imageUrl: ad.imageUrl,
      linkUrl: ad.linkUrl || "",
      position: ad.position,
      priority: ad.priority,
      isActive: ad.isActive,
      startDate: ad.startDate ? new Date(ad.startDate).toISOString().slice(0, 16) : "",
      endDate: ad.endDate ? new Date(ad.endDate).toISOString().slice(0, 16) : "",
    })
    setShowDialog(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const url = selectedAd ? `/api/admin/ads/${selectedAd.id}` : "/api/admin/ads"
      const method = selectedAd ? "PUT" : "POST"

      const payload = {
        ...formData,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
      }

      const response = await fetchWithCsrf(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: t("common.success"),
          description: selectedAd ? t("ads.updated") : t("ads.created"),
        })
        setShowDialog(false)
        fetchAds()
      } else {
        toast({
          title: t("common.error"),
          description: apiErrorMessage(data.error, t("ads.saveError")),
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("ads.saveErrorFull"),
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedAd) return

    setIsDeleting(true)
    try {
      const response = await fetchWithCsrf(`/api/admin/ads/${selectedAd.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: t("common.success"),
          description: t("ads.deleted"),
        })
        setShowDeleteDialog(false)
        setSelectedAd(null)
        fetchAds()
      } else {
        toast({
          title: t("common.error"),
          description: apiErrorMessage(data.error, t("ads.deleteError")),
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("ads.deleteErrorFull"),
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleActive = async (ad: Ad) => {
    try {
      const response = await fetchWithCsrf(`/api/admin/ads/${ad.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !ad.isActive }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: t("common.success"),
          description: ad.isActive ? t("ads.deactivated") : t("ads.activatedAd"),
        })
        fetchAds()
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("ads.toggleError"),
        variant: "destructive",
      })
    }
  }

  const getPositionLabel = (position: string) => t(`ads.pos.${position}`, position, position)


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t("ads.pageTitle")}</h2>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          {t("ads.newAd")}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder={t("ads.searchPlaceholder")}
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>

            <Select
              value={filters.position === "" ? SELECT_ALL : filters.position}
              onValueChange={(value) =>
                setFilters({ ...filters, position: value === SELECT_ALL ? "" : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("ads.allPositions")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SELECT_ALL}>{t("ads.allPositions")}</SelectItem>
                <SelectItem value="HOME_BANNER">{t("ads.pos.HOME_BANNER")}</SelectItem>
                <SelectItem value="HOME_SIDEBAR">{t("ads.pos.HOME_SIDEBAR")}</SelectItem>
                <SelectItem value="CATEGORY_TOP">{t("ads.pos.CATEGORY_TOP")}</SelectItem>
                <SelectItem value="CATEGORY_SIDEBAR">{t("ads.pos.CATEGORY_SIDEBAR")}</SelectItem>
                <SelectItem value="PRODUCT_PAGE">{t("ads.pos.PRODUCT_PAGE")}</SelectItem>
                <SelectItem value="CHECKOUT_PAGE">{t("ads.pos.CHECKOUT_PAGE")}</SelectItem>
                <SelectItem value="MOBILE_BANNER">{t("ads.pos.MOBILE_BANNER")}</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.isActive === "" ? SELECT_ALL : filters.isActive}
              onValueChange={(value) =>
                setFilters({ ...filters, isActive: value === SELECT_ALL ? "" : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("users.allStatuses")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SELECT_ALL}>{t("users.allStatuses")}</SelectItem>
                <SelectItem value="true">{t("ads.filterActive")}</SelectItem>
                <SelectItem value="false">{t("ads.filterInactive")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Ads List */}
      {isLoading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">{t("ads.loading")}</p>
          </CardContent>
        </Card>
      ) : filteredAds.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t("ads.empty")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredAds.map((ad) => (
            <Card key={ad.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-32 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {ad.imageUrl ? (
                      <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{ad.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{ad.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={ad.isActive ? "default" : "secondary"}>
                          {ad.isActive ? t("products.active") : t("products.inactive")}
                        </Badge>
                        <Badge variant="outline">{getPositionLabel(ad.position)}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span>
                        {t("ads.priority")}: {ad.priority}
                      </span>
                      <span>
                        {t("ads.views")}: {ad.viewCount}
                      </span>
                      <span>
                        {t("ads.clicks")}: {ad.clickCount}
                      </span>
                      {ad.linkUrl && (
                        <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                          <ExternalLink className="w-3 h-3" />
                          {t("ads.link")}
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => toggleActive(ad)}>
                        {ad.isActive ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                        {ad.isActive ? t("products.deactivate") : t("products.activateBtn")}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(ad)}>
                        <Edit className="w-4 h-4 mr-2" />
                        {t("common.edit")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setSelectedAd(ad)
                          setShowDeleteDialog(true)
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t("common.delete")}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          aria-describedby="ad-dialog-description"
        >
          <DialogHeader>
            <DialogTitle>{selectedAd ? t("ads.editTitle") : t("ads.createTitle")}</DialogTitle>
            <DialogDescription id="ad-dialog-description">
              {selectedAd ? t("ads.editDesc") : t("ads.createDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ad-title">{t("ads.fieldTitle")}</Label>
              <Input
                id="ad-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t("ads.phTitle")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ad-description">{t("ads.fieldDescription")}</Label>
              <Textarea
                id="ad-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t("ads.phDescription")}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ad-image">{t("ads.fieldImageUrl")}</Label>
              <Input
                id="ad-image"
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder={t("ads.phImageUrl")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ad-link">{t("ads.fieldLinkUrl")}</Label>
              <Input
                id="ad-link"
                type="url"
                value={formData.linkUrl}
                onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                placeholder={t("ads.phLinkUrl")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ad-position">{t("ads.fieldPosition")}</Label>
                <Select value={formData.position} onValueChange={(value: any) => setFormData({ ...formData, position: value })}>
                  <SelectTrigger id="ad-position">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOME_BANNER">{t("ads.pos.HOME_BANNER")}</SelectItem>
                    <SelectItem value="HOME_SIDEBAR">{t("ads.pos.HOME_SIDEBAR")}</SelectItem>
                    <SelectItem value="CATEGORY_TOP">{t("ads.pos.CATEGORY_TOP")}</SelectItem>
                    <SelectItem value="CATEGORY_SIDEBAR">{t("ads.pos.CATEGORY_SIDEBAR")}</SelectItem>
                    <SelectItem value="PRODUCT_PAGE">{t("ads.pos.PRODUCT_PAGE")}</SelectItem>
                    <SelectItem value="CHECKOUT_PAGE">{t("ads.pos.CHECKOUT_PAGE")}</SelectItem>
                    <SelectItem value="MOBILE_BANNER">{t("ads.pos.MOBILE_BANNER")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ad-priority">{t("ads.fieldPriority")}</Label>
                <Input
                  id="ad-priority"
                  type="number"
                  min="0"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ad-start-date">{t("ads.startDate")}</Label>
                <Input
                  id="ad-start-date"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ad-end-date">{t("ads.endDate")}</Label>
                <Input
                  id="ad-end-date"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="ad-active"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="ad-active" className="cursor-pointer">
                {t("ads.activeAd")}
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={isSaving}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? t("ads.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent aria-describedby="ad-delete-description">
          <DialogHeader>
            <DialogTitle>{t("ads.deleteConfirmTitle")}</DialogTitle>
            <DialogDescription id="ad-delete-description">
              {t("ads.deleteConfirmDesc")}
            </DialogDescription>
          </DialogHeader>
          {selectedAd && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-semibold">{selectedAd.title}</p>
              <p className="text-sm text-muted-foreground">{getPositionLabel(selectedAd.position)}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? t("ads.deleting") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

