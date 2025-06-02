"use client"

import { useEffect, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

interface DailyRevenue {
  date: string
  revenue: number
}

interface ChartRevenueTotalProps {
  restaurantId: string
}

export function ChartRevenueTotal({ restaurantId }: ChartRevenueTotalProps) {
  const [period, setPeriod] = useState<"yearly" | "quarterly" | "monthly">("yearly")
  const [data, setData] = useState<DailyRevenue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(
      `/api/restaurants/${restaurantId}/analytics/revenue-total?period=${period}`
    )
      .then((res) => {
        if (!res.ok) throw new Error("Falha ao carregar receita")
        return res.json() as Promise<DailyRevenue[]>
      })
      .then((json) => setData(json))
      .catch((err) => {
        console.error(err)
        setData([])
      })
      .finally(() => setLoading(false))
  }, [restaurantId, period])

  return (
    <Card className="w-full h-full">
      <CardHeader className="flex items-center justify-between pb-8">
        <div className="space-y-1">
          <CardTitle>Faturamento Diário</CardTitle>
          <CardDescription>
            Observe os dias de alta e baixo desempenho do seu restaurante!
          </CardDescription>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yearly">Este ano</SelectItem>
            <SelectItem value="quarterly">Este mês</SelectItem>
            <SelectItem value="monthly">Esta semana</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>

      {loading ? (
        <CardContent className="pl-2">
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      ) : (
        <CardContent className="pl-2">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                  tickFormatter={(v) => `R$ ${v}`}
                />
                <Tooltip
                  formatter={(v: number) => [`R$ ${v}`, "Receita"]}
                  labelFormatter={(date) => date}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  cursor={{ fill: "transparent" }}
                />
                <Bar
                  dataKey="revenue"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
