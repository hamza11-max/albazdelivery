"use client"

import { useState, useEffect } from "react"
import { Button } from "@/root/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/root/components/ui/card"
import { Badge } from "@/root/components/ui/badge"
import { Input } from "@/root/components/ui/input"
import { Label } from "@/root/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/root/components/ui/select"
import { Radio, Plus, Trash2, RefreshCw } from "lucide-react"
import type { RfidReader } from "../../lib/electron-api"

interface RfidDeviceManagementProps {
  translate: (fr: string, ar: string) => string
  isElectron: boolean
  getReaders: () => Promise<RfidReader[]>
  addReader: (data: { name?: string; type?: string; serialPath?: string | null; baudRate?: number }) => Promise<RfidReader>
  deleteReader: (id: string) => Promise<boolean>
  listPorts: () => Promise<Array<{ path: string; manufacturer?: string }>>
  connectSerial: (portPath: string, baudRate?: number) => Promise<{ success: boolean }>
}

export function RfidDeviceManagement({
  translate,
  isElectron,
  getReaders,
  addReader,
  deleteReader,
  listPorts,
}: RfidDeviceManagementProps) {
  const [readers, setReaders] = useState<RfidReader[]>([])
  const [ports, setPorts] = useState<Array<{ path: string; manufacturer?: string }>>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState("")
  const [newType, setNewType] = useState<"keyboard" | "serial">("serial")
  const [newPort, setNewPort] = useState("")
  const [newBaud, setNewBaud] = useState(9600)

  const load = async () => {
    if (!isElectron) return
    try {
      const [r, p] = await Promise.all([getReaders(), listPorts()])
      setReaders(r)
      setPorts(p)
    } catch (e) {
      console.warn("RFID load failed:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [isElectron])

  const handleAdd = async () => {
    if (!isElectron) return
    try {
      await addReader({
        name: newName.trim() || (newType === "keyboard" ? translate("Clavier RFID", "قارئ لوحة المفاتيح") : newPort),
        type: newType,
        serialPath: newType === "serial" ? newPort || null : null,
        baudRate: newType === "serial" ? newBaud : 9600,
      })
      setNewName("")
      setNewPort("")
      setNewBaud(9600)
      await load()
    } catch (e) {
      console.warn("Add reader failed:", e)
    }
  }

  const handleDelete = async (id: string) => {
    if (!isElectron) return
    try {
      await deleteReader(id)
      await load()
    } catch (e) {
      console.warn("Delete reader failed:", e)
    }
  }

  if (!isElectron) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-sm">
            {translate("RFID est disponible dans l'application de bureau.", "RFID متاح في تطبيق سطح المكتب فقط.")}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            {translate("Ajouter un lecteur", "إضافة قارئ")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>{translate("Type", "النوع")}</Label>
              <Select value={newType} onValueChange={(v) => setNewType(v as "keyboard" | "serial")}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="keyboard">{translate("Clavier (wedge)", "لوحة المفاتيح")}</SelectItem>
                  <SelectItem value="serial">{translate("Série (COM)", "التسلسلي")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{translate("Nom", "الاسم")}</Label>
              <Input
                placeholder={translate("ex: Porte 1", "مثال: البوابة 1")}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-[180px]"
              />
            </div>
            {newType === "serial" && (
              <>
                <div className="space-y-2">
                  <Label>{translate("Port", "المنفذ")}</Label>
                  <Select
                    value={newPort || (ports.length === 0 ? "__no_ports__" : "__none__")}
                    onValueChange={(v) => setNewPort(v === "__no_ports__" || v === "__none__" ? "" : v)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder={translate("Choisir", "اختر")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">
                        {translate("Choisir", "اختر")}
                      </SelectItem>
                      {ports.map((p) => (
                        <SelectItem key={p.path} value={p.path}>
                          {p.path} {p.manufacturer ? `(${p.manufacturer})` : ""}
                        </SelectItem>
                      ))}
                      {ports.length === 0 && (
                        <SelectItem value="__no_ports__" disabled>
                          {translate("Aucun port", "لا منفذ")}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Baud</Label>
                  <Input
                    type="number"
                    value={newBaud}
                    onChange={(e) => setNewBaud(Number(e.target.value) || 9600)}
                    className="w-[100px]"
                  />
                </div>
              </>
            )}
            <Button onClick={handleAdd} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              {translate("Ajouter", "إضافة")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Radio className="w-4 h-4" />
            {translate("Lecteurs configurés", "أجهزة القراءة")}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={load}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">{translate("Chargement...", "جاري التحميل...")}</p>
          ) : readers.length === 0 ? (
            <p className="text-sm text-muted-foreground">{translate("Aucun lecteur. Le lecteur clavier (RFID:) est ajouté automatiquement au premier scan.", "لا قارئ. يُضاف قارئ لوحة المفاتيح تلقائياً عند أول مسح.")}</p>
          ) : (
            <ul className="space-y-2">
              {readers.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{r.name}</span>
                    <Badge variant={r.status === "online" ? "default" : "secondary"} className="text-xs">
                      {r.type}
                    </Badge>
                    {r.serialPath && (
                      <span className="text-muted-foreground text-sm">{r.serialPath}</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(r.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
