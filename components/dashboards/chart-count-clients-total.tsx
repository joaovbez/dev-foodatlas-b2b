"use client"

import { useEffect, useState, useMemo } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useIsMobile } from "@/hooks/use-mobile"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Skeleton } from "@/components/ui/skeleton"

// Traduções de mês (você pode manter ou remover conforme necessidade)
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

interface DailyClients {
  date: string
  clientes: number
}

interface ChartCountClientsTotalProps {
  restaurantId: string
}

export function ChartCountClientsTotal({ restaurantId }: ChartCountClientsTotalProps) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d")
  const [data, setData] = useState<DailyClients[]>([])
  const [loading, setLoading] = useState(true)

  // Ajusta o período padrão para mobile
  useEffect(() => {
    if (isMobile) setTimeRange("7d")
  }, [isMobile])

  // Busca dados sempre que mudar restaurantId ou timeRange
  useEffect(() => {
    setLoading(true)
    fetch(
      `/api/restaurants/${restaurantId}/analytics/count-clients-total?range=${timeRange}`
    )
      .then((res) => {
        if (!res.ok) throw new Error("Falha ao carregar clientes")
        return res.json() as Promise<DailyClients[]>
      })
      .then((json) => setData(json))
      .catch((err) => {
        console.error(err)
        setData([])
      })
      .finally(() => setLoading(false))
  }, [restaurantId, timeRange])

  const filteredData = useMemo(() => data, [data])

  return (
    <Card className="w-full h-full">
      <CardHeader className="relative">
        <CardTitle>Quantidade Diária de Clientes Atendidos</CardTitle>
        <CardDescription>
          <span className="hidden sm:block">
            Analise os momentos em que seu restaurante mais chama atenção!
          </span>
          <span className="sm:hidden">
            Analise os momentos em que seu restaurante mais chama atenção
          </span>
        </CardDescription>

        <div className="absolute right-4 top-4 flex items-center space-x-2">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(v) => v && setTimeRange(v as any)}
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

          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
            <SelectTrigger className="md:hidden w-full max-w-[150px]" aria-label="Selecione um período">
              <SelectValue placeholder="Período" />
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

      {loading ? (
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      ) : (
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="h-[250px] sm:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredData}>
                <defs>
                  <linearGradient id="colorClientes" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => {
                    const d = new Date(value)
                    const month = d.toLocaleDateString("en-US", { month: "short" })
                    return `${d.getDate()} ${mesesEmPortugues[month]}`
                  }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                  tickFormatter={(v) => v}
                />
                <Tooltip
                  formatter={(v: number) => [v, "Clientes Atendidos"]}
                  labelFormatter={(label) => {
                    const d = new Date(label)
                    const month = d.toLocaleDateString("en-US", { month: "long" })
                    return `${d.getDate()} de ${mesesCompletos[month]} de ${d.getFullYear()}`
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
      )}
    </Card>
  )
}
