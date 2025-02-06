import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "title" | "text" | "avatar" | "button" | "card" | "table-row"
}

function Skeleton({ className, variant, ...props }: SkeletonProps) {
  const baseClass = "animate-pulse rounded-md bg-muted"

  const variants = {
    title: "h-7 w-48",
    text: "h-4 w-full",
    avatar: "h-12 w-12 rounded-full",
    button: "h-9 w-24",
    card: "h-48 w-full",
    "table-row": "h-16 w-full"
  }

  return (
    <div
      className={cn(
        baseClass,
        variant && variants[variant],
        className
      )}
      {...props}
    />
  )
}

function SkeletonRestaurantCard() {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <Skeleton variant="title" className="w-3/4" />
      <div className="space-y-2">
        <Skeleton variant="text" className="w-1/2" />
        <Skeleton variant="text" className="w-2/3" />
      </div>
      <div className="flex justify-end">
        <Skeleton variant="button" />
      </div>
    </div>
  )
}

function SkeletonFileCard() {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-4">
        <Skeleton variant="avatar" className="h-8 w-8" />
        <div className="space-y-2">
          <Skeleton variant="text" className="w-48" />
          <Skeleton variant="text" className="w-24" />
        </div>
      </div>
      <Skeleton variant="button" />
    </div>
  )
}

function SkeletonRestaurantInfo() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton variant="title" />
          <Skeleton variant="button" />
        </div>
        <div className="rounded-lg border p-4 space-y-3">
          <div className="space-y-2">
            <Skeleton variant="text" className="w-1/4" />
            <Skeleton variant="text" className="w-1/2" />
          </div>
          <div className="space-y-2">
            <Skeleton variant="text" className="w-1/4" />
            <Skeleton variant="text" className="w-3/4" />
          </div>
          <div className="space-y-2">
            <Skeleton variant="text" className="w-1/4" />
            <Skeleton variant="text" className="w-1/3" />
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton variant="title" />
          <Skeleton variant="button" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonFileCard key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

export { 
  Skeleton, 
  SkeletonRestaurantCard, 
  SkeletonFileCard, 
  SkeletonRestaurantInfo 
}
