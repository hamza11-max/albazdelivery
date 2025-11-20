// Re-export shared UI components from the root components directory
// Use the explicit @/root/* alias so apps resolve the global components
export { Button } from '@/root/components/ui/button'
export { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/root/components/ui/card'
export { Badge } from '@/root/components/ui/badge'
export { Input } from '@/root/components/ui/input'
export { Label } from '@/root/components/ui/label'
export { Textarea } from '@/root/components/ui/textarea'
export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from '@/root/components/ui/dialog'
export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/root/components/ui/table'
export { Tabs, TabsContent, TabsList, TabsTrigger } from '@/root/components/ui/tabs'
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/root/components/ui/select'
export { Toaster } from '@/root/components/ui/toaster'
export { useToast, toast } from '@/root/hooks/use-toast'
