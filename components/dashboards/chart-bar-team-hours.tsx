"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, type TooltipProps } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp } from "lucide-react"

interface TeamMember {
  id_funcionario: string
  funcao?: string
  taxa_hora_brl?: number
  custo_total_brl?: number
  total_horas_trabalhadas?: number
  dias_trabalhados?: number
}

interface TeamHoursChartProps {
  restaurantId: string
}

function LoadingSkeleton() {
  return (
    <div className="h-[300px] w-full flex items-center justify-center bg-muted/20 rounded-md">
      <Skeleton className="h-[250px] w-[90%]" />
    </div>
  )
}

// Componente personalizado para o tooltip
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background p-3 border rounded-md shadow-sm">
        <p className="font-medium">{`${label}`}</p>
        <p className="text-primary">{`Horas: ${payload[0].value}`}</p>
        {payload[0].payload.funcao && <p className="text-xs text-muted-foreground">{payload[0].payload.funcao}</p>}
      </div>
    )
  }

  return null
}

export function TeamHoursChart({ restaurantId }: TeamHoursChartProps) {
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

  // Preparar dados para o gráfico
  const chartData = teamData
    ?.filter((member) => typeof member.total_horas_trabalhadas === "number")
    .map((member) => ({
      name: member.id_funcionario,
      horas: member.total_horas_trabalhadas,
      funcao: member.funcao,
    }))
    .sort((a, b) => (b.horas || 0) - (a.horas || 0)) // Ordenar por horas (decrescente)

  if (isLoading || !teamData) {
    return (
      <Card className="col-span-1 bg-gradient-to-t from-primary/5 to-card">
        <CardHeader>
          <CardTitle>Horas Trabalhadas por Funcionário</CardTitle>
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
          <CardTitle>Horas Trabalhadas por Funcionário</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>Visualização gráfica</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData && chartData.length > 0 ? (
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 60,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={70}
                  className="text-xs fill-muted-foreground"
                />
                <YAxis
                  className="fill-muted-foreground"
                  label={{
                    value: "Horas",
                    angle: -90,
                    position: "insideLeft",
                    className: "fill-muted-foreground text-xs",
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="horas"
                  name="Horas Trabalhadas"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  className="hover:opacity-80 transition-opacity"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
            Nenhum dado disponível para exibição.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
