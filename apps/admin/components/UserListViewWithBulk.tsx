"use client"

import { useState } from "react"
import { Button, Card, CardContent, Input, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@albaz/ui"
import { Checkbox } from "@/root/components/ui/checkbox"
import { Search, Plus, Edit, Trash2, MoreVertical, Ban, CheckCircle2 } from "lucide-react"
import type { User as UserType } from "@/root/lib/types"
import { useAdminI18n } from "../lib/AdminI18nProvider"
// DropdownMenu not available, using Button instead

/** Radix Select forbids SelectItem value=""; use this sentinel for "no filter". */
const SELECT_ALL = "__all__"

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
  /** Show text labels next to edit/delete (clearer for vendor management). */
  showActionLabels?: boolean
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
  showActionLabels = false,
}: UserListViewWithBulkProps) {
  const { t } = useAdminI18n()
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
            {t("users.add")}
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

            <Select
              value={roleFilter === "" ? SELECT_ALL : roleFilter}
              onValueChange={(v) => setRoleFilter(v === SELECT_ALL ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("users.allRoles")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SELECT_ALL}>{t("users.allRoles")}</SelectItem>
                <SelectItem value="CUSTOMER">{t("common.client")}</SelectItem>
                <SelectItem value="VENDOR">{t("common.vendor")}</SelectItem>
                <SelectItem value="DRIVER">{t("common.driver")}</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter === "" ? SELECT_ALL : statusFilter}
              onValueChange={(v) => setStatusFilter(v === SELECT_ALL ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("users.allStatuses")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SELECT_ALL}>{t("users.allStatuses")}</SelectItem>
                <SelectItem value="PENDING">{t("common.pending")}</SelectItem>
                <SelectItem value="APPROVED">{t("common.approved")}</SelectItem>
                <SelectItem value="REJECTED">{t("common.rejected")}</SelectItem>
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
                {t("users.bulkSelected", undefined, undefined, { count: String(selectedUsers.size) })}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction("suspend")}
                  disabled={isProcessing}
                >
                  <Ban className="w-4 h-4 mr-2" />
                  {t("users.suspend")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction("unsuspend")}
                  disabled={isProcessing}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {t("users.activate")}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleBulkAction("delete")}
                  disabled={isProcessing}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t("common.delete")}
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
              {searchQuery || roleFilter || statusFilter ? t("users.noResults") : emptyMessage}
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
                <span className="text-sm font-medium">{t("users.selectAll")}</span>
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
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size={showActionLabels ? "sm" : "icon"}
                        onClick={() => onEdit(user)}
                      >
                        <Edit className="w-4 h-4" />
                        {showActionLabels ? <span className="ml-1">{t("common.edit")}</span> : null}
                      </Button>
                      <Button
                        variant="outline"
                        size={showActionLabels ? "sm" : "icon"}
                        className="text-red-600 hover:text-red-700 bg-transparent"
                        onClick={() => onDelete(user)}
                      >
                        <Trash2 className="w-4 h-4" />
                        {showActionLabels ? <span className="ml-1">{t("common.delete")}</span> : null}
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

