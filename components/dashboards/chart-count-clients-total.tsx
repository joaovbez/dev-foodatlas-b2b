"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

// Dados de exemplo de clientes atendidos
const chartData = [
  { date: "2024-04-01", clientes: 150 },
  { date: "2024-04-15", clientes: 180 },
  { date: "2024-05-01", clientes: 220 },
  { date: "2024-05-15", clientes: 290 },
  { date: "2024-06-01", clientes: 340 },
  { date: "2024-06-15", clientes: 280 },
  { date: "2024-07-01", clientes: 320 },
  { date: "2024-07-15", clientes: 290 },
]

// Mapa de meses em português
const mesesEmPortugues = {
  'Jan': 'Jan',
  'Feb': 'Fev',
  'Mar': 'Mar',
  'Apr': 'Abr',
  'May': 'Mai',
  'Jun': 'Jun',
  'Jul': 'Jul',
  'Aug': 'Ago',
  'Sep': 'Set',
  'Oct': 'Out',
  'Nov': 'Nov',
  'Dec': 'Dez'
}

const mesesCompletos = {
  'January': 'Janeiro',
  'February': 'Fevereiro',
  'March': 'Março',
  'April': 'Abril',
  'May': 'Maio',
  'June': 'Junho',
  'July': 'Julho',
  'August': 'Agosto',
  'September': 'Setembro',
  'October': 'Outubro',
  'November': 'Novembro',
  'December': 'Dezembro'
}

export function ChartCountClientsTotal() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("30d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const filteredData = React.useMemo(() => {
    // Em uma aplicação real, você filtraria baseado no timeRange
    return chartData
  }, [timeRange])

  return (
    <Card className="w-full h-full">
      <CardHeader className="relative">
        <CardTitle>Quantidade Diária de Clientes Atendidos</CardTitle>
        <CardDescription>
          <span className="hidden sm:block">Análise os momentos em que seu restaurante mais chama atenção!</span>
          <span className="sm:hidden">Análise os momentos em que seu restaurante mais chama atenção</span>
        </CardDescription>
        <div className="absolute right-4 top-4">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(value) => value && setTimeRange(value)}
            variant="outline"
            className="hidden md:flex"
          >
            <ToggleGroupItem value="90d" className="h-8 px-2.5">
              Este ano
            </ToggleGroupItem>
            <ToggleGroupItem value="30d" className="h-8 px-2.5">
              Este mês
            </ToggleGroupItem>
            <ToggleGroupItem value="7d" className="h-8 px-2.5">
              Esta semana
            </ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="md:hidden w-full max-w-[150px]" aria-label="Selecione um período">
              <SelectValue placeholder="Últimos 3 meses" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Últimos 3 meses
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Últimos 30 dias
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Últimos 7 dias
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <div className="h-[250px] sm:h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="colorClientes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tickMargin={8}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  const month = date.toLocaleDateString("en-US", { month: "short" })
                  const day = date.getDate()
                  return `${day} ${mesesEmPortugues[month as keyof typeof mesesEmPortugues]}`
                }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tickMargin={8}
                tickFormatter={(value) => value}
              />
              <Tooltip
                formatter={(value) => [value, "Clientes Atendidos"]}
                labelFormatter={(label) => {
                  const date = new Date(label)
                  const month = date.toLocaleDateString("en-US", { month: "long" })
                  const translatedMonth = mesesCompletos[month as keyof typeof mesesCompletos]
                  return `${date.getDate()} de ${translatedMonth} de ${date.getFullYear()}`
                }}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Area
                type="monotone"
                dataKey="clientes"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorClientes)"
                name="Clientes Atendidos"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

