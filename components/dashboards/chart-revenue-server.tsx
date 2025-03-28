"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { LabelList, Pie, PieChart } from "recharts"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"



const chartData = [
  { browser: "server_1", visitors: 4820.00, fill: "var(--color-server_1)" },
  { browser: "server_2", visitors: 3600.00, fill: "var(--color-server_2)" },
  { browser: "server_3", visitors: 3500.00, fill: "var(--color-server_3)" },
  { browser: "server_4", visitors: 2000.00, fill: "var(--color-server_4)" },
  { browser: "server_5", visitors: 1950.00, fill: "var(--color-server_5)" },
]

const chartConfig = {
  revenue: {
    label: "Faturamento",
  },
  server_1: {
    label: "Carlos",
    color: "hsl(var(--chart-1))",
  },
  server_2: {
    label: "João",
    color: "hsl(var(--chart-2))",
  },
  server_3: {
    label: "Rafaela",
    color: "hsl(var(--chart-3))",
  },
  server_4: {
    label: "Carla",
    color: "hsl(var(--chart-4))",
  },
  server_5: {
    label: "Mário",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig

export function ChartRevenueServer() {
  const [period, setPeriod] = React.useState("month")

  const periodLabels = {
    month: "Este mês",
    year: "Este ano",
    all: "Desde o início",
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="space-y-1">
          <CardTitle>Faturamento por Garçom</CardTitle>
          <CardDescription>Contribuição dos 5 melhores garçons para o faturamento no período selecionado</CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Este mês</SelectItem>
              <SelectItem value="year">Este ano</SelectItem>
              <SelectItem value="all">Desde o início</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px] [&_.recharts-text]:fill-background"
        >
          <PieChart>
            <ChartTooltip
              content={<ChartTooltipContent nameKey="visitors" hideLabel />}
            />
            <Pie data={chartData} dataKey="visitors">
              <LabelList
                dataKey="browser"
                className="fill-background"
                stroke="none"
                fontSize={12}
                formatter={(value: keyof typeof chartConfig) =>
                  chartConfig[value]?.label
                }
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Carlos é o garçom com melhor desempenho neste período! <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground">Faturamento gerado por Carlos: R$ 4.350,00</div>
      </CardFooter>
    </Card>
  )
}
