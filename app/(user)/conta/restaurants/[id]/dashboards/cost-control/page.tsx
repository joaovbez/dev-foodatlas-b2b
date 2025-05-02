"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

interface RestaurantData {
  id: string
  name: string
  // Outros campos necessários
}

export default function CostControlPage() {
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
        setLoading(false)
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar os dados do restaurante",
        })
        setLoading(false)
      }
    }

    loadRestaurantData()
  }, [id, toast])

  if (loading) {
    return (
      <div className="@container/main flex flex-1 flex-col gap-4 px-4 lg:px-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <div className="grid grid-cols-1 gap-4">
          <Card className="p-6">
            <Skeleton className="h-[400px] w-full" />
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-4 px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Controle de Custos: {restaurant?.name}
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <Card className="p-6 flex items-center justify-center h-[400px]">
          <p className="text-muted-foreground text-center">
            Dados de controle de custos serão exibidos aqui.
            <br />
            Em desenvolvimento...
          </p>
        </Card>
      </div>
    </div>
  )
} 