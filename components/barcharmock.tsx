"use client";

import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartData = [
  { month: "Janeiro", vendas: 323 },
  { month: "Fevereiro", vendas: 274 },
  { month: "Março", vendas: 283 },
  { month: "Abril", vendas: 353 },
  { month: "Maio", vendas: 401 },
  { month: "Junho", vendas: 512 },
];

const chartConfig = {
  vendas: {
    label: "Vendas",    
    color: "#C9E543",
  },
} satisfies ChartConfig;

export function BarChartMock() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quantidade de Vendas Mensal</CardTitle>
        <CardDescription>Janeiro - Junho 2025</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="vendas" fill="var(--color-vendas)" radius={8}>
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Aumento de 21% após a última promoção! <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Mostrando o total de vendas nos meses selecionados
        </div>
      </CardFooter>
    </Card>
  );
}
