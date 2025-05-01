"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Upload } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Exemplo de tipos de arquivo (você pode refinar essa lista)
const FILE_TYPES = [
  {
    label: "Relatório Integrado",
    accept: ".csv,.xlsx,.xls",
  },
  {
    label: "Relatório de Vendas e Comandas",
    accept: ".csv,.xlsx,.xls",
  },
  {
    label: "Ficha Técnica de um Prato",
    accept: ".pdf",
  },
  {
    label: "Controle de Estoque",
    accept: ".pdf,.csv",
  },
  {
    label: "Escala de Funcionários",
    accept: ".xlsx,.xls,.csv",
  },
  {
    label: "Fluxo de Caixa",
    accept: ".csv,.xlsx,.xls",
  },
  {
    label: "Pesquisas de Satisfação",
    accept: ".pdf",
  },
  {
    label: "Cardápio Digital",
    accept: ".pdf",
  },
  {
    label: "DRE ou Relatório Contábil",
    accept: ".pdf",
  },
  {
    label: "Relatório de Delivery",
    accept: ".csv,.xlsx,.xls",
  },
]

interface UploadDialogProps {
  onUpload: (data: { file: File; documentType: string }) => Promise<void>
  uploading: boolean
}

/**
 * Este componente exibe um botão que abre um Dialog para o usuário selecionar
 * qual tipo de arquivo vai anexar, e depois faz o upload via onUpload().
 */
export function UploadDialog({ onUpload, uploading }: UploadDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<string>("")
  const [accept, setAccept] = useState<string>("")

  // Resetar a seleção quando o dialog for aberto
  useEffect(() => {
    if (open) {
      setSelectedType("")
      setAccept("")
    }
  }, [open])

  // Handler para quando o usuário seleciona um tipo de arquivo
  function handleSelectType(value: string) {
    setSelectedType(value)
    // Acha o objeto correspondente para definir o accept
    const fileType = FILE_TYPES.find((f) => f.label === value)
    setAccept(fileType ? fileType.accept : "")
  }

  // Handler para quando o usuário seleciona o arquivo
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // Fecha o dialog (opcional)
    setOpen(false)
    // Chama a função de upload que você passou via props
    await onUpload({ file, documentType: selectedType })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          className="hover:bg-[#A3E635]/10 hover:text-black hover:border-[#A3E635]"
          disabled={uploading}
        >
          {uploading ? (
            <>Enviando...</>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Selecione o tipo de arquivo</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file-type" className="text-sm font-medium">
              Tipo de Arquivo
            </Label>
            <Select onValueChange={handleSelectType} value={selectedType}>
              <SelectTrigger id="file-type" className="w-full">
                <SelectValue placeholder="Selecione uma opção" />
              </SelectTrigger>
              <SelectContent>
                {FILE_TYPES.map((fileType) => (
                  <SelectItem key={fileType.label} value={fileType.label}>
                    {fileType.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedType && (
            <div className="mt-4 p-3 bg-lime-50 border border-lime-200 rounded-md">
              <p className="text-sm text-lime-700">
                Você selecionou: <span className="font-medium">{selectedType}</span>
              </p>
              <p className="text-xs text-lime-600 mt-1">Formatos aceitos: {accept.split(",").join(", ")}</p>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
          <div className="text-sm text-muted-foreground">
            Não sabe qual tipo de documento anexar?{" "}
            <a
              href="https://docs.google.com/document/d/1nNbh1JRLKvEbYZWk7TKF9dfsvegmDdkE0fEN1Qjltds/edit?tab=t.0"              
              target="_blank"
              rel="noopener noreferrer"
              className="text-lime-600 hover:text-lime-700 hover:underline font-medium"
            >
              Veja nosso guia!
            </a>
          </div>
          <Button variant="default" disabled={!selectedType || uploading} asChild>
            <label className="cursor-pointer">
              <input
                type="file"
                className="hidden"
                accept={accept}
                onChange={handleFileChange}
                disabled={!selectedType || uploading}
              />
              Selecionar Arquivo
            </label>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

