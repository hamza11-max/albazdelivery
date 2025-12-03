"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Edit, Trash2, Users, Truck, Store } from "lucide-react"
import type { User as UserType } from "@/root/lib/types"

interface UserListViewProps {
  users: UserType[]
  title: string
  icon: React.ReactNode
  emptyMessage: string
  searchPlaceholder: string
  onEdit: (user: UserType) => void
  onDelete: (user: UserType) => void
  onAdd?: () => void
}

export function UserListView({
  users,
  title,
  icon,
  emptyMessage,
  searchPlaceholder,
  onEdit,
  onDelete,
  onAdd,
}: UserListViewProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredUsers = searchQuery.trim()
    ? users.filter((user) => {
        const query = searchQuery.toLowerCase()
        return (
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          (user.phone && user.phone.includes(query))
        )
      })
    : users

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

      {filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 text-muted-foreground mx-auto mb-4 flex items-center justify-center">
              {icon}
            </div>
            <p className="text-lg text-muted-foreground">
              {searchQuery ? `Aucun résultat trouvé` : emptyMessage}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      {icon}
                    </div>
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-sm text-muted-foreground">{user.phone}</p>
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
          ))}
        </div>
      )}
    </div>
  )
}

