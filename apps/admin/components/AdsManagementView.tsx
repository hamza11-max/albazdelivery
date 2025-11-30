"use client"

import { useState, useEffect } from "react"
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Label, Textarea } from "@albaz/ui"
import { Plus, Edit, Trash2, Eye, EyeOff, Search, Image as ImageIcon, ExternalLink } from "lucide-react"
import { useToast } from "@/root/hooks/use-toast"

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
        title: "Erreur",
        description: "Impossible de charger les publicités",
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

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Succès",
          description: selectedAd ? "Publicité mise à jour" : "Publicité créée",
        })
        setShowDialog(false)
        fetchAds()
      } else {
        toast({
          title: "Erreur",
          description: data.error || "Impossible de sauvegarder",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la publicité",
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
      const response = await fetch(`/api/admin/ads/${selectedAd.id}`, {
        method: "DELETE",
        credentials: 'include',
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Succès",
          description: "Publicité supprimée",
        })
        setShowDeleteDialog(false)
        setSelectedAd(null)
        fetchAds()
      } else {
        toast({
          title: "Erreur",
          description: data.error || "Impossible de supprimer",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la publicité",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleActive = async (ad: Ad) => {
    try {
      const response = await fetch(`/api/admin/ads/${ad.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ isActive: !ad.isActive }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Succès",
          description: ad.isActive ? "Publicité désactivée" : "Publicité activée",
        })
        fetchAds()
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut",
        variant: "destructive",
      })
    }
  }

  const getPositionLabel = (position: string) => {
    const labels: Record<string, string> = {
      HOME_BANNER: "Bannière principale",
      HOME_SIDEBAR: "Barre latérale",
      CATEGORY_TOP: "Haut de catégorie",
      CATEGORY_SIDEBAR: "Barre latérale catégorie",
      PRODUCT_PAGE: "Page produit",
      CHECKOUT_PAGE: "Page paiement",
      MOBILE_BANNER: "Bannière mobile",
    }
    return labels[position] || position
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestion des Publicités</h2>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle publicité
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>

            <Select value={filters.position} onValueChange={(value) => setFilters({ ...filters, position: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les positions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes les positions</SelectItem>
                <SelectItem value="HOME_BANNER">Bannière principale</SelectItem>
                <SelectItem value="HOME_SIDEBAR">Barre latérale</SelectItem>
                <SelectItem value="CATEGORY_TOP">Haut de catégorie</SelectItem>
                <SelectItem value="CATEGORY_SIDEBAR">Barre latérale catégorie</SelectItem>
                <SelectItem value="PRODUCT_PAGE">Page produit</SelectItem>
                <SelectItem value="CHECKOUT_PAGE">Page paiement</SelectItem>
                <SelectItem value="MOBILE_BANNER">Bannière mobile</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.isActive} onValueChange={(value) => setFilters({ ...filters, isActive: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les statuts</SelectItem>
                <SelectItem value="true">Actives</SelectItem>
                <SelectItem value="false">Inactives</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Ads List */}
      {isLoading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Chargement...</p>
          </CardContent>
        </Card>
      ) : filteredAds.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucune publicité trouvée</p>
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
                          {ad.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">{getPositionLabel(ad.position)}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span>Priorité: {ad.priority}</span>
                      <span>Vues: {ad.viewCount}</span>
                      <span>Clics: {ad.clickCount}</span>
                      {ad.linkUrl && (
                        <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                          <ExternalLink className="w-3 h-3" />
                          Lien
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => toggleActive(ad)}>
                        {ad.isActive ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                        {ad.isActive ? "Désactiver" : "Activer"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(ad)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Modifier
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
                        Supprimer
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedAd ? "Modifier la publicité" : "Nouvelle publicité"}</DialogTitle>
            <DialogDescription>
              {selectedAd ? "Modifiez les informations de la publicité" : "Créez une nouvelle publicité"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ad-title">Titre *</Label>
              <Input
                id="ad-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Titre de la publicité"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ad-description">Description</Label>
              <Textarea
                id="ad-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description de la publicité"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ad-image">URL de l'image *</Label>
              <Input
                id="ad-image"
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ad-link">URL de destination</Label>
              <Input
                id="ad-link"
                type="url"
                value={formData.linkUrl}
                onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                placeholder="https://example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ad-position">Position *</Label>
                <Select value={formData.position} onValueChange={(value: any) => setFormData({ ...formData, position: value })}>
                  <SelectTrigger id="ad-position">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOME_BANNER">Bannière principale</SelectItem>
                    <SelectItem value="HOME_SIDEBAR">Barre latérale</SelectItem>
                    <SelectItem value="CATEGORY_TOP">Haut de catégorie</SelectItem>
                    <SelectItem value="CATEGORY_SIDEBAR">Barre latérale catégorie</SelectItem>
                    <SelectItem value="PRODUCT_PAGE">Page produit</SelectItem>
                    <SelectItem value="CHECKOUT_PAGE">Page paiement</SelectItem>
                    <SelectItem value="MOBILE_BANNER">Bannière mobile</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ad-priority">Priorité</Label>
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
                <Label htmlFor="ad-start-date">Date de début</Label>
                <Input
                  id="ad-start-date"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ad-end-date">Date de fin</Label>
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
                Publicité active
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={isSaving}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette publicité ? Cette action est irréversible.
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
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

