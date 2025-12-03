"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/root/components/ui/checkbox"
import { Search, Plus, Edit, Trash2, MoreVertical, Ban, CheckCircle2 } from "lucide-react"
import type { User as UserType } from "@/root/lib/types"
// DropdownMenu not available, using Button instead

interface UserListViewWithBulkProps {
  users: UserType[]
  title: string
  icon: React.ReactNode
  emptyMessage: string
  searchPlaceholder: string
  onEdit: (user: UserType) => void
  onDelete: (user: UserType) => void
  onBulkAction: (action: string, userIds: string[]) => Promise<void>
  onAdd?: () => void
}

export function UserListViewWithBulk({
  users,
  title,
  icon,
  emptyMessage,
  searchPlaceholder,
  onEdit,
  onDelete,
  onBulkAction,
  onAdd,
}: UserListViewWithBulkProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [roleFilter, setRoleFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const filteredUsers = users.filter((user) => {
    const matchesSearch = !searchQuery.trim() ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.phone && user.phone.includes(searchQuery))

    const matchesRole = !roleFilter || user.role?.toLowerCase() === roleFilter.toLowerCase()
    
    const userWithStatus = user as UserType & { status?: string }
    const matchesStatus = !statusFilter || userWithStatus.status?.toUpperCase() === statusFilter.toUpperCase()

    return matchesSearch && matchesRole && matchesStatus
  })

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers)
    if (newSelection.has(userId)) {
      newSelection.delete(userId)
    } else {
      newSelection.add(userId)
    }
    setSelectedUsers(newSelection)
  }

  const toggleAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(filteredUsers.map((u) => u.id)))
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.size === 0) return

    setIsProcessing(true)
    try {
      await onBulkAction(action, Array.from(selectedUsers))
      setSelectedUsers(new Set())
    } catch (error) {
      console.error("[Admin] Bulk action error:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        {onAdd && (
          <Button onClick={onAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les rôles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les rôles</SelectItem>
                <SelectItem value="CUSTOMER">Client</SelectItem>
                <SelectItem value="VENDOR">Vendeur</SelectItem>
                <SelectItem value="DRIVER">Livreur</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les statuts</SelectItem>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="APPROVED">Approuvé</SelectItem>
                <SelectItem value="REJECTED">Rejeté</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedUsers.size > 0 && (
        <Card className="bg-primary/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {selectedUsers.size} utilisateur{selectedUsers.size > 1 ? "s" : ""} sélectionné{selectedUsers.size > 1 ? "s" : ""}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction("suspend")}
                  disabled={isProcessing}
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Suspendre
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction("unsuspend")}
                  disabled={isProcessing}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Activer
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleBulkAction("delete")}
                  disabled={isProcessing}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 text-muted-foreground mx-auto mb-4 flex items-center justify-center">
              {icon}
            </div>
            <p className="text-lg text-muted-foreground">
              {searchQuery || roleFilter || statusFilter ? `Aucun résultat trouvé` : emptyMessage}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {/* Select All */}
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                  onCheckedChange={toggleAll}
                />
                <span className="text-sm font-medium">Sélectionner tout</span>
              </div>
            </CardContent>
          </Card>

          {filteredUsers.map((user) => {
            const userWithStatus = user as UserType & { status?: string }
            return (
              <Card key={user.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedUsers.has(user.id)}
                      onCheckedChange={() => toggleUserSelection(user.id)}
                    />
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        {icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-sm text-muted-foreground">{user.phone}</p>
                        {userWithStatus.status && (
                          <Badge variant="outline" className="mt-1">
                            {userWithStatus.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => onEdit(user)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-red-600 hover:text-red-700 bg-transparent"
                        onClick={() => onDelete(user)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

