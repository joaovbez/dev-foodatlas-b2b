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
  if (typeof value !== 'number' || isNaN(value)) {
    return <span>—</span>;
  }
  
  const isPositive = type === "cost" ? value < 0 : value >= 0;
  const color = isPositive ? "text-green-500" : "text-red-500";
  
  const Icon = value >= 0 ? ArrowUp : ArrowDown;

  return (
    <div className={cn("flex items-center gap-1", color)}>
      <Icon className="h-4 w-4" />
      <span>{Math.abs(value).toFixed(1)}%</span>
    </div>
  )
}

function calculateVariation(current: number, previous: number) {
  if (!current || !previous || previous === 0) return 0;
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

interface BreakEvenDetailsProps {
  restaurantId: string
}

export function BreakEvenDetails({ restaurantId }: BreakEvenDetailsProps) {
  const { data: breakEvenData, isLoading, error } = useQuery({
    queryKey: ["break-even", restaurantId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/restaurants/${restaurantId}/break-even`)
        if (!response.ok) throw new Error("Failed to fetch break-even data")
        return response.json()
      } catch (err) {
        console.error("Erro ao buscar dados de break-even:", err)
        return null
      }
    },
  })

  const currentMonth = format(new Date(), "MMMM", { locale: ptBR })
  const lastMonth = format(new Date(new Date().setMonth(new Date().getMonth() - 1)), "MMMM", { locale: ptBR })
  const nextMonth = format(new Date(new Date().setMonth(new Date().getMonth() + 1)), "MMMM", { locale: ptBR })

  if (isLoading || !breakEvenData) {
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

  const current = breakEvenData.currentMonth || {};
  const last = breakEvenData.lastMonth || {};
  const next = breakEvenData.nextMonth || {};

  if (!current.totalCosts) current.totalCosts = (current.fixedCosts || 0) + (current.variableCosts || 0);
  if (!last.totalCosts) last.totalCosts = (last.fixedCosts || 0) + (last.variableCosts || 0);
  if (!next.totalCosts) next.totalCosts = (next.fixedCosts || 0) + (next.variableCosts || 0);

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
                  {formatCurrency(last.fixedCosts)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span>{formatCurrency(current.fixedCosts)}</span>
                    <VariationIndicator
                      value={calculateVariation(
                        current.fixedCosts || 0,
                        last.fixedCosts || 0
                      )}
                      type="cost"
                    />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span>—</span>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-muted/50">
                <TableCell className="font-medium">Custos Variáveis</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(last.variableCosts)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span>{formatCurrency(current.variableCosts)}</span>
                    <VariationIndicator
                      value={calculateVariation(
                        current.variableCosts || 0,
                        last.variableCosts || 0
                      )}
                      type="cost"
                    />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span>—</span>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-muted/50">
                <TableCell className="font-medium">Total de Custos</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(last.totalCosts)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span>{formatCurrency(current.totalCosts)}</span>
                    <VariationIndicator
                      value={calculateVariation(
                        current.totalCosts || 0,
                        last.totalCosts || 0
                      )}
                      type="cost"
                    />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span>—</span>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-muted/50">
                <TableCell className="font-medium">Receita</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(last.revenue)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span>{formatCurrency(current.revenue)}</span>
                    <VariationIndicator
                      value={calculateVariation(
                        current.revenue || 0,
                        last.revenue || 0
                      )}
                      type="revenue"
                    />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span>—</span>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-muted/50 font-bold">
                <TableCell className="font-medium">Ponto de Break-Even</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(last.breakEvenPoint)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span>{formatCurrency(current.breakEvenPoint)}</span>
                    <VariationIndicator
                      value={calculateVariation(
                        current.breakEvenPoint || 0,
                        last.breakEvenPoint || 0
                      )}
                      type="cost"
                    />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span>—</span>
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