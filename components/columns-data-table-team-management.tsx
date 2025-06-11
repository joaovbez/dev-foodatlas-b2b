"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TeamMember {
  id_funcionario: string
  funcao?: string
  taxa_hora_brl?: number
  custo_total_brl?: number
  total_horas_trabalhadas?: number
  dias_trabalhados?: number
}

function formatCurrency(value: number | null | undefined) {
  if (typeof value !== "number" || isNaN(value)) return "—"
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export const columns: ColumnDef<TeamMember>[] = [
  {
    accessorKey: "id_funcionario",
    header: "Funcionário",
    cell: ({ row }) => {
      const member = row.original
      return (
        <div>
          <div className="font-medium">{member.id_funcionario}</div>
          {member.funcao && <div className="text-xs text-muted-foreground">{member.funcao}</div>}
        </div>
      )
    },
  },
  {
    accessorKey: "total_horas_trabalhadas",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 lg:px-3"
        >
          Horas trabalhadas
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const hours = row.getValue("total_horas_trabalhadas") as number
      return <div className="text-right font-medium">{typeof hours === "number" ? hours : "—"}</div>
    },
  },
  {
    accessorKey: "dias_trabalhados",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 lg:px-3"
        >
          Dias trabalhados
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const days = row.getValue("dias_trabalhados") as number
      return <div className="text-right font-medium">{typeof days === "number" ? days : "—"}</div>
    },
  },
  {
    accessorKey: "taxa_hora_brl",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 lg:px-3"
        >
          Salário por hora
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const rate = row.getValue("taxa_hora_brl") as number
      return <div className="text-right font-medium">{formatCurrency(rate)}</div>
    },
  },
]
