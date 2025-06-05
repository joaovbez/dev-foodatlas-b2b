"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Legend } from "recharts"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { TrendingDown } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuery } from "@tanstack/react-query"

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-[300px] w-full" />
    </div>
  )
}

// Traduções de mês
const mesesEmPortugues: Record<string, string> = {
  Jan: "Jan",
  Feb: "Fev",
  Mar: "Mar",
  Apr: "Abr",
  May: "Mai",
  Jun: "Jun",
  Jul: "Jul",
  Aug: "Ago",
  Sep: "Set",
  Oct: "Out",
  Nov: "Nov",
  Dec: "Dez",
}

const mesesCompletos: Record<string, string> = {
  January: "Janeiro",
  February: "Fevereiro",
  March: "Março",
  April: "Abril",
  May: "Maio",
  June: "Junho",
  July: "Julho",
  August: "Agosto",
  September: "Setembro",
  October: "Outubro",
  November: "Novembro",
  December: "Dezembro",
}

interface ChartCostControlProps {
  restaurantId: string
}

export function ChartCostControl({ restaurantId }: ChartCostControlProps) {
  const { data: costData, isLoading, error } = useQuery({
    queryKey: ["cost-control-chart", restaurantId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/restaurants/${restaurantId}/cost-control-chart`)
        if (!response.ok) throw new Error("Failed to fetch cost control chart data")
        return response.json()
      } catch (err) {
        console.error("Erro ao buscar dados do gráfico de custos:", err)
        return null
      }
    },
  })

  if (isLoading || !costData) {
    return (
      <Card className="col-span-1 bg-gradient-to-t from-primary/5 to-card">
        <CardHeader>
          <CardTitle>Evolução dos Custos</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSkeleton />
        </CardContent>
      </Card>
    )
  }

  const chartData = costData.map((item: any) => {
    // Tratar a data de forma segura
    let formattedMonth = "N/A";
    try {
      if (item.month) {
        // Se a data vier como string do BigQuery (formato YYYY-MM-DD ou similar)
        const date = new Date(item.month);
        if (!isNaN(date.getTime())) {
          formattedMonth = format(date, "MMM/yy", { locale: ptBR });
        } else {
          // Se não conseguir parsear, usar o valor original
          formattedMonth = item.month.toString();
        }
      }
    } catch (error) {
      console.error("Erro ao formatar data:", error, item.month);
      formattedMonth = item.month?.toString() || "N/A";
    }

    return {
      month: formattedMonth,
      "Custos Fixos": item.fixedCosts || 0,
      "Custos Variáveis": item.variableCosts || 0,
      "Custo de Estoque": item.stockCost || 0,
      "Custo de Alimentos": item.foodCost || 0,
      "Mão de Obra": item.laborCost || 0,
      "Despesas Promocionais": item.promoCost || 0,
    }
  })

  const chartConfig = {
    "Custos Fixos": {
      label: "Custos Fixos",
      color: "hsl(var(--chart-1))",
    },
    "Custos Variáveis": {
      label: "Custos Variáveis", 
      color: "hsl(var(--chart-2))",
    },
    "Custo de Estoque": {
      label: "Custo de Estoque",
      color: "hsl(var(--chart-3))",
    },
    "Custo de Alimentos": {
      label: "Custo de Alimentos",
      color: "hsl(var(--chart-4))",
    },
    "Mão de Obra": {
      label: "Mão de Obra",
      color: "hsl(var(--chart-5))",
    },
    "Despesas Promocionais": {
      label: "Despesas Promocionais",
      color: "hsl(var(--chart-6))",
    },
  }

  return (
    <Card className="col-span-1 bg-gradient-to-t from-primary/5 to-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Evolução dos Custos</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingDown className="h-4 w-4" />
            <span>Últimos 6 meses</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name
                ]}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="Custos Fixos"
                stackId="1"
                stroke={chartConfig["Custos Fixos"].color}
                fill={chartConfig["Custos Fixos"].color}
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="Custos Variáveis"
                stackId="1"
                stroke={chartConfig["Custos Variáveis"].color}
                fill={chartConfig["Custos Variáveis"].color}
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="Custo de Estoque"
                stackId="2"
                stroke={chartConfig["Custo de Estoque"].color}
                fill={chartConfig["Custo de Estoque"].color}
                fillOpacity={0.4}
              />
              <Area
                type="monotone"
                dataKey="Custo de Alimentos"
                stackId="2"
                stroke={chartConfig["Custo de Alimentos"].color}
                fill={chartConfig["Custo de Alimentos"].color}
                fillOpacity={0.4}
              />
              <Area
                type="monotone"
                dataKey="Mão de Obra"
                stackId="3"
                stroke={chartConfig["Mão de Obra"].color}
                fill={chartConfig["Mão de Obra"].color}
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="Despesas Promocionais"
                stackId="3"
                stroke={chartConfig["Despesas Promocionais"].color}
                fill={chartConfig["Despesas Promocionais"].color}
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}