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

interface BreakEvenProgressProps {
  restaurantId: string
}

export function BreakEvenProgress({ restaurantId }: BreakEvenProgressProps) {
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

  if (isLoading || !breakEvenData) {
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

  // Extrair dados de forma segura com valores padrão
  const receita = breakEvenData?.currentMonth?.revenue || 0;
  const meta = breakEvenData?.currentMonth?.breakEvenPoint || 0;
  const diaAtual = new Date().getDate();

  // Comentado o cálculo de previsão de break-even
  // let daysToBreakEven: number | null = null;
  // if (
  //   typeof receita === 'number' &&
  //   typeof meta === 'number' &&
  //   receita > 0 &&
  //   meta > receita &&
  //   diaAtual > 0
  // ) {
  //   const dailyAvg = receita / diaAtual;
  //   if (dailyAvg > 0) {
  //     daysToBreakEven = Math.ceil((meta - receita) / dailyAvg);
  //   }
  // }

  // let breakEvenDate: Date | null = null;
  // if (
  //   daysToBreakEven !== null &&
  //   daysToBreakEven > 0 &&
  //   Number.isFinite(daysToBreakEven)
  // ) {
  //   breakEvenDate = new Date();
  //   breakEvenDate.setDate(breakEvenDate.getDate() + daysToBreakEven);
  // }

  const progressPercentage = meta > 0 ? Math.min(100, (receita / meta) * 100) : 0;

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
              R$ {meta.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Receita Atual</p>
            <p className="text-2xl font-bold">
              R$ {receita.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Data prevista do Break-Even</p>
            <p className="text-lg font-semibold">—</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Dias Restantes</p>
            <p className="text-lg font-semibold">—</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 