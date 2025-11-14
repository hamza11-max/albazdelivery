import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Sales Cards */}
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <Skeleton className="h-4 w-[100px]" />
            </CardTitle>
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-[120px]" />
            <Skeleton className="h-4 w-[80px] mt-4" />
          </CardContent>
        </Card>
      ))}

      {/* Top Products */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-5 w-[150px]" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[100px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Alerts */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-5 w-[180px]" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-4 w-[80px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}