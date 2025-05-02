"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

interface RestaurantData {
  id: string
  name: string
  // Outros campos necessários
}

// Dados de exemplo para o gráfico
const sampleData = [
  { name: "Seg", clientes: 150, média: 65.3 },
  { name: "Ter", clientes: 180, média: 75.1 },
  { name: "Qua", clientes: 220, média: 82.4 },
  { name: "Qui", clientes: 240, média: 78.5 },
  { name: "Sex", clientes: 310, média: 92.6 },
  { name: "Sáb", clientes: 350, média: 110.2 },
  { name: "Dom", clientes: 270, média: 105.8 },
]

export default function ClientConsumptionPage() {
  const { id } = useParams() as { id: string }
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null)
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState(sampleData)
  const { toast } = useToast()

  useEffect(() => {
    async function loadRestaurantData() {
      try {
        const response = await fetch(`/api/restaurants/${id}`)
        if (!response.ok) throw new Error("Falha ao carregar dados do restaurante")
        const data = await response.json()
        setRestaurant(data)

        // Aqui você faria uma chamada para carregar os dados específicos para esta página
        // Exemplo: const consumptionData = await fetch(`/api/restaurants/${id}/consumption`)
        // Por enquanto, usamos dados de exemplo após um atraso para simular carregamento
        setTimeout(() => {
          setChartData(sampleData)
          setLoading(false)
        }, 500)
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar os dados do restaurante",
        })
        setLoading(false)
      }
    }

    loadRestaurantData()
  }, [id, toast])

  if (loading) {
    return (
      <div className="@container/main flex flex-1 flex-col gap-4 px-4 lg:px-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <div className="grid grid-cols-1 gap-4">
          <Card className="p-6">
            <Skeleton className="h-[400px] w-full" />
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-4 px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Consumo de Clientes: {restaurant?.name}
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Frequência de Clientes e Ticket Médio por Dia da Semana</h3>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 20,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === "clientes") return [`${value} clientes`, "Quantidade de Clientes"]
                    if (name === "média") return [`R$ ${value}`, "Ticket Médio"]
                    return [value, name]
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="clientes" name="Quantidade de Clientes" fill="#8884d8" />
                <Bar yAxisId="right" dataKey="média" name="Ticket Médio (R$)" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
} 