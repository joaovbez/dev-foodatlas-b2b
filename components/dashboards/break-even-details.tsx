"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowDown, ArrowUp, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuery } from "@tanstack/react-query"

function formatCurrency(value: number | null | undefined) {
  if (typeof value !== "number" || isNaN(value)) return "—";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function VariationIndicator({ value, type = "cost" }: { value: number; type?: "cost" | "revenue" }) {
  const isPositive = value >= 0
  const color = type === "revenue" 
    ? (isPositive ? "text-green-500" : "text-red-500")
    : "text-red-500" // Sempre vermelho para custos
  const Icon = type === "revenue"
    ? (isPositive ? ArrowUp : ArrowDown)
    : (isPositive ? ArrowUp : ArrowDown) // Sempre seta para cima quando aumenta, para baixo quando diminui

  return (
    <div className={cn("flex items-center gap-1", color)}>
      <Icon className="h-4 w-4" />
      <span>{Math.abs(value).toFixed(1)}%</span>
    </div>
  )
}

function calculateVariation(current: number, previous: number) {
  return ((current - previous) / previous) * 100
}

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

export function BreakEvenDetails() {
    const { data: breakEvenData, isLoading } = useQuery({
    queryKey: ["break-even"],
    queryFn: async () => {
      const response = await fetch("/api/restaurants/break-even")
      if (!response.ok) throw new Error("Failed to fetch break-even data")
      return response.json()
    },
  })

  const currentMonth = format(new Date(), "MMMM", { locale: ptBR })
  const lastMonth = format(new Date(new Date().setMonth(new Date().getMonth() - 1)), "MMMM", { locale: ptBR })
  const nextMonth = format(new Date(new Date().setMonth(new Date().getMonth() + 1)), "MMMM", { locale: ptBR })

  if (isLoading) {
    return (
      <Card className="col-span-1 bg-gradient-to-t from-primary/5 to-card">
        <CardHeader>
          <CardTitle>Detalhes do Break-Even</CardTitle>
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
          <CardTitle>Detalhes do Break-Even</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>Análise Comparativa</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-muted/50">
                <TableHead className="w-[200px]">Item</TableHead>
                <TableHead className="text-right">
                  <div className="flex flex-col">
                    <span>{lastMonth}</span>
                    <span className="text-xs text-muted-foreground">Mês Anterior</span>
                  </div>
                </TableHead>
                <TableHead className="text-right">
                  <div className="flex flex-col">
                    <span>{currentMonth}</span>
                    <span className="text-xs text-muted-foreground">Mês Atual</span>
                  </div>
                </TableHead>
                <TableHead className="text-right">
                  <div className="flex flex-col">
                    <span>{nextMonth}</span>
                    <span className="text-xs text-muted-foreground">Projeção</span>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="hover:bg-muted/50">
                <TableCell className="font-medium">Custos Fixos</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(breakEvenData.lastMonth.fixedCosts)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span>{formatCurrency(breakEvenData.currentMonth.fixedCosts)}</span>
                    <VariationIndicator
                      value={calculateVariation(
                        breakEvenData.currentMonth.fixedCosts,
                        breakEvenData.lastMonth.fixedCosts
                      )}
                      type="cost"
                    />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span>{formatCurrency(breakEvenData.nextMonth.fixedCosts)}</span>
                    <VariationIndicator
                      value={calculateVariation(
                        breakEvenData.nextMonth.fixedCosts,
                        breakEvenData.currentMonth.fixedCosts
                      )}
                      type="cost"
                    />
                  </div>
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-muted/50">
                <TableCell className="font-medium">Custos Variáveis</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(breakEvenData.lastMonth.variableCosts)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span>{formatCurrency(breakEvenData.currentMonth.variableCosts)}</span>
                    <VariationIndicator
                      value={calculateVariation(
                        breakEvenData.currentMonth.variableCosts,
                        breakEvenData.lastMonth.variableCosts
                      )}
                      type="cost"
                    />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span>{formatCurrency(breakEvenData.nextMonth.variableCosts)}</span>
                    <VariationIndicator
                      value={calculateVariation(
                        breakEvenData.nextMonth.variableCosts,
                        breakEvenData.currentMonth.variableCosts
                      )}
                      type="cost"
                    />
                  </div>
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-muted/50">
                <TableCell className="font-medium">Total de Custos</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(breakEvenData.lastMonth.totalCosts)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span>{formatCurrency(breakEvenData.currentMonth.totalCosts)}</span>
                    <VariationIndicator
                      value={calculateVariation(
                        breakEvenData.currentMonth.totalCosts,
                        breakEvenData.lastMonth.totalCosts
                      )}
                      type="cost"
                    />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span>{formatCurrency(breakEvenData.nextMonth.totalCosts)}</span>
                    <VariationIndicator
                      value={calculateVariation(
                        breakEvenData.nextMonth.totalCosts,
                        breakEvenData.currentMonth.totalCosts
                      )}
                      type="cost"
                    />
                  </div>
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-muted/50">
                <TableCell className="font-medium">Receita</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(breakEvenData.lastMonth.revenue)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span>{formatCurrency(breakEvenData.currentMonth.revenue)}</span>
                    <VariationIndicator
                      value={calculateVariation(
                        breakEvenData.currentMonth.revenue,
                        breakEvenData.lastMonth.revenue
                      )}
                      type="revenue"
                    />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span>{formatCurrency(breakEvenData.nextMonth.projectedRevenue)}</span>
                    <VariationIndicator
                      value={calculateVariation(
                        breakEvenData.nextMonth.projectedRevenue,
                        breakEvenData.currentMonth.revenue
                      )}
                      type="revenue"
                    />
                  </div>
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-muted/50 font-bold">
                <TableCell className="font-medium">Ponto de Break-Even</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(breakEvenData.lastMonth.breakEvenPoint)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span>{formatCurrency(breakEvenData.currentMonth.breakEvenPoint)}</span>
                    <VariationIndicator
                      value={calculateVariation(
                        breakEvenData.currentMonth.breakEvenPoint,
                        breakEvenData.lastMonth.breakEvenPoint
                      )}
                      type="cost"
                    />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span>{formatCurrency(breakEvenData.nextMonth.breakEvenPoint)}</span>
                    <VariationIndicator
                      value={calculateVariation(
                        breakEvenData.nextMonth.breakEvenPoint,
                        breakEvenData.currentMonth.breakEvenPoint
                      )}
                      type="cost"
                    />
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
} 