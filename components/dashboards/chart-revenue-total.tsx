"use client"

<<<<<<< HEAD
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
=======
import * as React from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Sample data
const data = [
  { month: "Jan", revenue: 4000 },
  { month: "Fev", revenue: 3000 },
  { month: "Mar", revenue: 2000 },
  { month: "Abr", revenue: 2780 },
  { month: "Mai", revenue: 1890 },
  { month: "Jun", revenue: 2390 },
  { month: "Jul", revenue: 3490 },
  { month: "Ago", revenue: 4000 },
  { month: "Set", revenue: 3200 },
  { month: "Out", revenue: 2800 },
  { month: "Nov", revenue: 3300 },
  { month: "Dez", revenue: 5000 },
]
>>>>>>> c4ab1e42fce547a2b9eff6931444865f90d205e5

interface ChartRevenueTotalProps {
  restaurantId: string
}

export function ChartRevenueTotal({ restaurantId }: ChartRevenueTotalProps) {
<<<<<<< HEAD
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
=======
  const [period, setPeriod] = React.useState("yearly")

  return (
    <Card className="w-full h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-8">
        <div className="space-y-1">
          <CardTitle>Faturamento Diário</CardTitle>
          <CardDescription>Observe os dias de alta e e baixo desempenho do seu restaurante!</CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yearly">Este ano</SelectItem>
              <SelectItem value="quarterly">Este mês</SelectItem>
              <SelectItem value="monthly">Esta semana</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tickMargin={8} />
              <YAxis axisLine={false} tickLine={false} tickMargin={8} tickFormatter={(value) => `R$ ${value}`} />
              <Tooltip
                formatter={(value) => [`R$ ${value}`, "Revenue"]}
                labelFormatter={(label) => `Month: ${label}`}
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
                activeBar={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

>>>>>>> c4ab1e42fce547a2b9eff6931444865f90d205e5
