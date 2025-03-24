"use client";

import { TrendingDown, TrendingUp, Minus } from "lucide-react";
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

// Define the props interface for the chart component
export interface BarChartProps {
  title: string;
  subtitle: string;
  data: any[];
  dataKey: string;
  xAxisKey: string;
  insight?: string;
  trendDirection?: "up" | "down" | "neutral";
  trendValue?: string;
  footer?: string;
}

// Renamed to DynamicBarChart to reflect its dynamic nature
export function DynamicBarChart({
  title,
  subtitle,
  data,
  dataKey,
  xAxisKey,
  insight,
  trendDirection = "neutral",
  trendValue = "",
  footer = ""
}: BarChartProps) {

  // Generate chart config dynamically based on dataKey
  const chartConfig = {
    [dataKey]: {
      label: dataKey.charAt(0).toUpperCase() + dataKey.slice(1),
      color: "#C9E543",
    },
  } as ChartConfig;

  // Display trend icon based on direction
  const TrendIcon = trendDirection === "up" 
    ? TrendingUp 
    : trendDirection === "down" 
      ? TrendingDown 
      : Minus;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
        {insight && (
          <div className="mt-2 text-sm text-muted-foreground">
            {insight}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={data}
            margin={{
              top: 20,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={xAxisKey}
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => 
                typeof value === 'string' && value.length > 10 
                  ? value.slice(0, 10) + '...' 
                  : value
              }
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey={dataKey} fill={`var(--color-${dataKey})`} radius={8}>
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
        {trendValue && (
          <div className="flex gap-2 font-medium leading-none">
            {trendValue} <TrendIcon className="h-4 w-4" />
          </div>
        )}
        {footer && (
          <div className="leading-none text-muted-foreground">
            {footer}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

