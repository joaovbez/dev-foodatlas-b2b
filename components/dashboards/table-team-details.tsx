"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { TrendingUp } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuery } from "@tanstack/react-query"
import { columns } from "../columns-data-table-team-management"
import { DataTable } from "../data-table"

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[100px]" />
        </div>
      ))}
    </div>
  )
}

interface TeamMember {
  id_funcionario: string
  funcao?: string
  taxa_hora_brl?: number
  custo_total_brl?: number
  total_horas_trabalhadas?: number
  dias_trabalhados?: number
}

interface TeamTableDetailsProps {
  restaurantId: string
}

export function TableTeamDetails({ restaurantId }: TeamTableDetailsProps) {
  const {
    data: teamData,
    isLoading,
    error,
  } = useQuery<TeamMember[]>({
    queryKey: ["team-management", restaurantId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/restaurants/${restaurantId}/team-management`)
        if (!response.ok) throw new Error("Failed to fetch team-management data")
        return response.json()
      } catch (err) {
        console.error("Erro ao buscar dados da equipe:", err)
        return []
      }
    },
  })

  const currentMonth = format(new Date(), "MMMM", { locale: ptBR })

  if (isLoading || !teamData) {
    return (
      <Card className="col-span-1 bg-gradient-to-t from-primary/5 to-card">
        <CardHeader>
          <CardTitle>Equipe - Detalhes dos Funcionários</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSkeleton />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-1 bg-gradient-to-t from-primary/5 to-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Equipe - Detalhes dos Funcionários</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>Dados individuais dos funcionários</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={teamData} />
      </CardContent>
    </Card>
  )
}
