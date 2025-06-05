"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowDown, ArrowUp, DollarSign } from "lucide-react"
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

function VariationIndicator({ value }: { value: number }) {
  if (typeof value !== 'number' || isNaN(value)) {
    return <span>—</span>;
  }
  
  // Para custos, diminuição é positiva (verde), aumento é negativa (vermelha)
  const isPositive = value < 0;
  const color = value === 0 ? "text-outline" : isPositive ? "text-green-500" : "text-red-500";
  
  const Icon = value === 0 ? null : value >= 0 ? ArrowUp : ArrowDown;

  return (
    <div className={cn("flex items-center gap-1", color)}>
      {Icon && <Icon className="h-4 w-4" />}
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
      {Array.from({ length: 6 }).map((_, i) => (
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

interface CostControlTableProps {
  restaurantId: string
}

export function CostControlTable({ restaurantId }: CostControlTableProps) {
  const { data: costData, isLoading, error } = useQuery({
    queryKey: ["cost-control", restaurantId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/restaurants/${restaurantId}/cost-control`)
        if (!response.ok) throw new Error("Failed to fetch cost control data")
        return response.json()
      } catch (err) {
        console.error("Erro ao buscar dados de controle de custos:", err)
        return null
      }
    },
  })

  const currentMonth = format(new Date(), "MMMM", { locale: ptBR })
  const lastMonth = format(new Date(new Date().setMonth(new Date().getMonth() - 1)), "MMMM", { locale: ptBR })

  if (isLoading || !costData) {
    return (
      <Card className="col-span-1 bg-gradient-to-t from-primary/5 to-card">
        <CardHeader>
          <CardTitle>Controle de Custos</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSkeleton />
        </CardContent>
      </Card>
    )
  }

  const current = costData.currentMonth || {};
  const last = costData.lastMonth || {};

  return (
    <Card className="col-span-1 bg-gradient-to-t from-primary/5 to-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Controle de Custos</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span>Análise de Custos</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-muted/50">
                <TableHead className="w-[200px]">Tipo de Custo</TableHead>
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
                <TableHead className="text-right">Variação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="hover:bg-muted/50">
                <TableCell className="font-medium">Custo de Estoque</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(last.stockCost)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(current.stockCost)}
                </TableCell>
                <TableCell className="text-right">
                  <VariationIndicator
                    value={calculateVariation(
                      current.stockCost || 0,
                      last.stockCost || 0
                    )}
                  />
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-muted/50">
                <TableCell className="font-medium">Custo de Alimentos</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(last.foodCost)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(current.foodCost)}
                </TableCell>
                <TableCell className="text-right">
                  <VariationIndicator
                    value={calculateVariation(
                      current.foodCost || 0,
                      last.foodCost || 0
                    )}
                  />
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-muted/50">
                <TableCell className="font-medium">Custo de Mão de Obra</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(last.laborCost)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(current.laborCost)}
                </TableCell>
                <TableCell className="text-right">
                  <VariationIndicator
                    value={calculateVariation(
                      current.laborCost || 0,
                      last.laborCost || 0
                    )}
                  />
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-muted/50">
                <TableCell className="font-medium">Despesas Promocionais</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(last.promoCost)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(current.promoCost)}
                </TableCell>
                <TableCell className="text-right">
                  <VariationIndicator
                    value={calculateVariation(
                      current.promoCost || 0,
                      last.promoCost || 0
                    )}
                  />
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-muted/50 bg-muted/20">
                <TableCell className="font-medium">Custos Variáveis</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(last.variableCosts)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(current.variableCosts)}
                </TableCell>
                <TableCell className="text-right">
                  <VariationIndicator
                    value={calculateVariation(
                      current.variableCosts || 0,
                      last.variableCosts || 0
                    )}
                  />
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-muted/50 bg-muted/20">
                <TableCell className="font-medium">Custos Fixos</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(last.fixedCosts)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(current.fixedCosts)}
                </TableCell>
                <TableCell className="text-right">
                  <VariationIndicator
                    value={calculateVariation(
                      current.fixedCosts || 0,
                      last.fixedCosts || 0
                    )}
                  />
                </TableCell>
              </TableRow>
              <TableRow className="hover:bg-muted/50 font-bold bg-primary/10">
                <TableCell className="font-bold">Total de Custos</TableCell>
                <TableCell className="text-right font-bold">
                  {formatCurrency(last.totalCosts)}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {formatCurrency(current.totalCosts)}
                </TableCell>
                <TableCell className="text-right">
                  <VariationIndicator
                    value={calculateVariation(
                      current.totalCosts || 0,
                      last.totalCosts || 0
                    )}
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
} 