"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-2 w-full" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
      </div>
    </div>
  )
}

export function BreakEvenProgress() {
  const { data: breakEvenData, isLoading } = useQuery({
    queryKey: ["break-even"],
    queryFn: async () => {
      const response = await fetch("/api/restaurants/break-even")
      if (!response.ok) throw new Error("Failed to fetch break-even data")
      return response.json()
    },
  })

  if (isLoading) {
    return (
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Break-Even Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSkeleton />
        </CardContent>
      </Card>
    )
  }

  const receita = breakEvenData.currentMonth.revenue;
  const meta = breakEvenData.currentMonth.breakEvenPoint;
  const diaAtual = new Date().getDate();

  let daysToBreakEven: number | null = null;
  if (
    typeof receita === 'number' &&
    typeof meta === 'number' &&
    receita > 0 &&
    meta > receita &&
    diaAtual > 0
  ) {
    const dailyAvg = receita / diaAtual;
    if (dailyAvg > 0) {
      daysToBreakEven = Math.ceil((meta - receita) / dailyAvg);
    }
  }

  let breakEvenDate: Date | null = null;
  if (
    daysToBreakEven !== null &&
    daysToBreakEven > 0 &&
    Number.isFinite(daysToBreakEven)
  ) {
    breakEvenDate = new Date();
    breakEvenDate.setDate(breakEvenDate.getDate() + daysToBreakEven);
  }

  const progressPercentage = meta > 0 ? (receita / meta) * 100 : 0;

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Break-Even Mensal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso do Mês</span>
            <span>{progressPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Meta Mensal</p>
            <p className="text-2xl font-bold">
              R$ {meta.toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Receita Atual</p>
            <p className="text-2xl font-bold">
              R$ {receita.toLocaleString("pt-BR")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Data prevista do Break-Even</p>
            <p className="text-lg font-semibold">
              {breakEvenDate && !isNaN(breakEvenDate.getTime())
                ? format(breakEvenDate, "dd 'de' MMMM", { locale: ptBR })
                : "—"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Dias Restantes</p>
            <p className="text-lg font-semibold">{daysToBreakEven && daysToBreakEven > 0 ? daysToBreakEven + ' dias' : '—'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 