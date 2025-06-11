<<<<<<< HEAD
"use client"

import { useEffect, useState } from "react"
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
=======
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
>>>>>>> c4ab1e42fce547a2b9eff6931444865f90d205e5

interface AVGCountClientProps {
  restaurantId: string
}

<<<<<<< HEAD
interface AVGCountClientData {
  avg_count: number
  percentage: number
  period: string
  compared_to: string
  is_fallback?: boolean
}

export function AVGCountClient({ restaurantId }: AVGCountClientProps) {
  const [data, setData] = useState<AVGCountClientData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/restaurants/${restaurantId}/analytics/avg-count-clients`)       
        if (!res.ok) throw new Error("Falha ao carregar dados")
        setData(await res.json())
      } catch (error) {
        console.error("Erro ao carregar média diária de clientes:", error)
        setData({
          avg_count: 348,
          percentage: 7,
          period: "month",
          compared_to: "last_month",
          is_fallback: true,
        })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [restaurantId])

  if (loading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Média Diária de Clientes</CardDescription>
          <Skeleton className="h-8 w-40 mt-1" />
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardFooter>
      </Card>
    )
  }
  
  if (!data) 
    return null

  
  const positive = data.percentage > 0
  const icon = data.percentage === 0 ? null : positive ? <TrendingUpIcon className="size-3" /> : <TrendingDownIcon className="size-3" />
  const badgeVariant = data.percentage === 0 ? "secondary" : positive ? "default" : "destructive"

=======
export function AVGCountClient({ restaurantId }: AVGCountClientProps) {
>>>>>>> c4ab1e42fce547a2b9eff6931444865f90d205e5
  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardDescription>Média Diária de Clientes</CardDescription>
<<<<<<< HEAD
        <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
          {data.avg_count.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </CardTitle>
        <div className="absolute right-4 top-4">
          <Badge variant={badgeVariant} className="flex gap-1 rounded-lg text-xs">
            {icon}
            {positive ? `+${data.percentage}%` : `${data.percentage}%`}
=======
        <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">348</CardTitle>
        <div className="absolute right-4 top-4">
          <Badge variant="default" className="flex gap-1 rounded-lg text-xs">
            <TrendingUpIcon className="size-3" />
            +7%
>>>>>>> c4ab1e42fce547a2b9eff6931444865f90d205e5
          </Badge>
        </div>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1 text-sm">
        <div className="line-clamp-1 flex gap-2 font-medium">
<<<<<<< HEAD
          {positive
            ? `Aumento de ${data.percentage}% na média diária`
            : `Queda de ${Math.abs(data.percentage)}% na média diária`}
          {icon}
        </div>
        <div className="text-muted-foreground">
          Comparação com {data.compared_to === "last_month" ? "o mês anterior" : "período anterior"}
        </div>
=======
          Aumento de 7% na média diária! <TrendingUpIcon className="size-4" />
        </div>
        <div className="text-muted-foreground">Reflexo da boa cultura de feedback.</div>
>>>>>>> c4ab1e42fce547a2b9eff6931444865f90d205e5
      </CardFooter>
    </Card>
  )
}
<<<<<<< HEAD
=======

>>>>>>> c4ab1e42fce547a2b9eff6931444865f90d205e5
