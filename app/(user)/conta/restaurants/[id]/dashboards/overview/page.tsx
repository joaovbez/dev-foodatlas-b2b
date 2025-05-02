"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { AVGTicket } from "@/components/dashboards/card-avg-ticket"
import { CountClient } from "@/components/dashboards/card-count-clients"
import { ChartRevenueTotal } from "@/components/dashboards/chart-revenue-total"
import { ChartCountClientsTotal } from "@/components/dashboards/chart-count-clients-total"
import { AVGCountClient } from "@/components/dashboards/card-avg-count-clients"
import { BreakEvenProgress } from "@/components/dashboards/break-even-progress"
import { BreakEvenDetails } from "@/components/dashboards/break-even-details"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

interface RestaurantData {
  id: string
  name: string
  // Outros campos necessários
}

export default function RestaurantOverviewPage() {
  const { id } = useParams() as { id: string }
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    async function loadRestaurantData() {
      try {
        const response = await fetch(`/api/restaurants/${id}`)
        if (!response.ok) throw new Error("Falha ao carregar dados do restaurante")
        const data = await response.json()
        setRestaurant(data)
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar os dados do restaurante",
        })
      } finally {
        setLoading(false)
      }
    }

    loadRestaurantData()
  }, [id, toast])

  if (loading) {
    return (
      <div className="@container/main flex flex-1 flex-col gap-4 px-4 lg:px-6">
        <div className="grid grid-cols-1">
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="grid grid-cols-1">
          <Skeleton className="h-40 w-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-4 px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Dashboard: {restaurant?.name}
        </h1>
      </div>
      <div className="grid grid-cols-1">
        <BreakEvenProgress restaurantId={id} />
      </div>
      <div className="grid grid-cols-1">
        <BreakEvenDetails restaurantId={id} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 *:data-[slot=card]:shadow-xs *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card">
        <AVGTicket restaurantId={id} />
        <CountClient restaurantId={id} />
        <AVGCountClient restaurantId={id} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartRevenueTotal restaurantId={id} />
        <ChartCountClientsTotal restaurantId={id} />
      </div>
    </div>
  )
} 