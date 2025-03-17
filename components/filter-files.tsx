"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Filter } from "lucide-react"
import { ptBR } from "date-fns/locale"

export interface FilterOptions {
  dateRange: {
    from: Date | undefined
    to: Date | undefined
  }
  fileTypes: string[]
}

interface FilterButtonProps {
  onApplyFilters: (filters: FilterOptions) => void
  availableFileTypes?: string[]
  defaultFilters?: FilterOptions
}

export default function FilterButton({
  onApplyFilters,
  availableFileTypes = [
    "Relatório Integrado",
    "Relatório de Vendas",
    "Ficha Técnica de um Prato",
    "Controle de Estoque",
    "Escala de Funcionários",
    "Fluxo de Caixa",
    "Pesquisas de Satisfação",
    "Cardápio Digital",
    "DRE ou Relatório Contábil",
    "Relatório de Delivery",
  ],
  defaultFilters,
}: FilterButtonProps) {
  const [date, setDate] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>(
    defaultFilters?.dateRange || {
      from: undefined,
      to: undefined,
    },
  )

  const [selectedFileTypes, setSelectedFileTypes] = useState<string[]>(defaultFilters?.fileTypes || [])

  const [open, setOpen] = useState(false)

  // Create a custom locale with capitalized month names
  const ptBRCustom = {
    ...ptBR,
    localize: {
      ...ptBR.localize,
      month: (monthIndex: number, options: { width?: string } = {}) => {
        const months = {
          0: "Janeiro",
          1: "Fevereiro",
          2: "Março",
          3: "Abril",
          4: "Maio",
          5: "Junho",
          6: "Julho",
          7: "Agosto",
          8: "Setembro",
          9: "Outubro",
          10: "Novembro",
          11: "Dezembro",
        }
        return months[monthIndex as keyof typeof months]
      },
    },
  }

  const handleFileTypeChange = (fileType: string, checked: boolean) => {
    if (checked) {
      setSelectedFileTypes([...selectedFileTypes, fileType])
    } else {
      setSelectedFileTypes(selectedFileTypes.filter((type) => type !== fileType))
    }
  }

  const applyFilters = () => {
    onApplyFilters({
      dateRange: date,
      fileTypes: selectedFileTypes,
    })
    setOpen(false)
  }

  const resetFilters = () => {
    // Reset date range
    setDate({
      from: undefined,
      to: undefined,
    })
    // Reset selected file types
    setSelectedFileTypes([])
  }

  const hasActiveFilters = date.from || date.to || selectedFileTypes.length > 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          data-active={hasActiveFilters}
          className={`gap-2 ${hasActiveFilters ? "border-primary text-primary" : ""}`}
        >
          <Filter className="h-4 w-4" />
          Filtros
          {hasActiveFilters && (
            <span className="ml-1 rounded-full bg-primary text-primary-foreground w-5 h-5 text-xs flex items-center justify-center">
              {(date.from || date.to ? 1 : 0) + (selectedFileTypes.length > 0 ? 1 : 0)}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Filtros</DialogTitle>
          <DialogDescription>Selecione os filtros para visualizar os arquivos desejados.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Range de Data</h3>
            <div className="flex justify-center">
              <Calendar
                mode="range"
                selected={date}
                onSelect={(range) => setDate(range ? { from: range.from, to: range.to ?? range.from } : { from: undefined, to: undefined })}
                className="rounded-md border"
                disabled={(date) => {
                  // Disable dates after today
                  const today = new Date()
                  today.setHours(0, 0, 0, 0) // Reset time to start of day for accurate comparison
                  return date > today
                }}
                locale={ptBRCustom}
              />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Tipos de Arquivos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-1">
              {availableFileTypes.map((fileType) => (
                <div key={fileType} className="flex items-center space-x-2">
                  <Checkbox
                    id={fileType}
                    checked={selectedFileTypes.includes(fileType)}
                    onCheckedChange={(checked) => handleFileTypeChange(fileType, checked === true)}
                  />
                  <Label htmlFor={fileType} className="text-sm">
                    {fileType}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="outline" onClick={resetFilters}>
            Resetar Filtros
          </Button>
          <Button variant="outline" onClick={applyFilters}>
            Aplicar Filtros
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

