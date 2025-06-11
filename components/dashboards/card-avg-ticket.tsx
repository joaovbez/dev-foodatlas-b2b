"use client"

<<<<<<< HEAD
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react"
=======
import { TrendingUpIcon } from "lucide-react"
>>>>>>> c4ab1e42fce547a2b9eff6931444865f90d205e5
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface AVGTicketProps {
  restaurantId: string
}

interface AVGTicketData {
  avg_ticket: number;
  percentage: number;
  currency: string;
  period: string;
  compared_to: string;
  is_fallback?: boolean;
}

export function AVGTicket({ restaurantId }: AVGTicketProps) {
  const [data, setData] = useState<AVGTicketData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
<<<<<<< HEAD
=======
        // Exemplo de chamada à API com o ID do restaurante
>>>>>>> c4ab1e42fce547a2b9eff6931444865f90d205e5
        const response = await fetch(`/api/restaurants/${restaurantId}/analytics/avg-ticket`)
        if (!response.ok) throw new Error("Falha ao carregar dados")
        const result = await response.json()
        setData(result)
      } catch (error) {
        console.error("Erro ao carregar dados de ticket médio:", error)
        // Dados temporários para desenvolvimento
        setData({ 
          avg_ticket: 153.28, 
          percentage: 12, 
          currency: "BRL", 
          period: "month", 
          compared_to: "last_month", 
          is_fallback: true 
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
          <CardDescription>Ticket Médio</CardDescription>
          <Skeleton className="h-8 w-40 mt-1" />
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardFooter>
      </Card>
    )
  }

<<<<<<< HEAD
  if(!data)
    return null

  const positive = data.percentage > 0
  const icon = data.percentage === 0 ? null : positive ? <TrendingUpIcon className="size-3" /> : <TrendingDownIcon className="size-3" />
  const badgeVariant = data.percentage === 0 ? "secondary" : positive ? "default" : "destructive"

=======
>>>>>>> c4ab1e42fce547a2b9eff6931444865f90d205e5
  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardDescription>Ticket Médio</CardDescription>
        <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
          {data ? `R$ ${data.avg_ticket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "R$ 0,00"}
        </CardTitle>
        <div className="absolute right-4 top-4">
<<<<<<< HEAD
          <Badge variant={badgeVariant} className="flex gap-1 rounded-lg text-xs">
            {icon}
            {positive ? `+${data.percentage}%` : `${data.percentage}%`}
=======
          <Badge variant={data && data.percentage > 0 ? "default" : "destructive"} className="flex gap-1 rounded-lg text-xs">
            <TrendingUpIcon className="size-3" />
            {data ? `${data.percentage > 0 ? '+' : ''}${data.percentage}%` : "0%"}
>>>>>>> c4ab1e42fce547a2b9eff6931444865f90d205e5
          </Badge>
        </div>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1 text-sm">
        <div className="line-clamp-1 flex gap-2 font-medium">
          {data && data.percentage > 0 
            ? "Ticket médio em crescimento" 
            : "Ticket médio em queda"}
          <TrendingUpIcon className="size-4" />
        </div>
        <div className="text-muted-foreground">
          Comparação com {data?.compared_to === "last_month" ? "o mês anterior" : "período anterior"}
        </div>
      </CardFooter>
    </Card>
  )
}

