"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, FileText, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Progress } from "@/components/ui/progress"
import { Skeleton, SkeletonFileCard } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { UploadDialog } from "@/components/dialog-upload"
import FilterButton, { type FilterOptions } from "@/components/filter-files"

interface RestaurantFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  createdAt: string
  documentType: string
}

interface StorageUsage {
  files: RestaurantFile[]
  totalSize: number
  usedStorage: number
  availableStorage: number
  percentageUsed: number
}

export default function RestaurantFilesPage({
  params,
}: {
  params: { id: string }
}) {
  const [files, setFiles] = useState<RestaurantFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<RestaurantFile | null>(null)
  const [usage, setUsage] = useState<StorageUsage | null>(null)
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: { from: undefined, to: undefined },
    fileTypes: [],
  })
  const router = useRouter()
  const { toast } = useToast()

  const loadFiles = useCallback(async () => {
    try {
      const response = await fetch(`/api/restaurants/${params.id}/files`)
      if (!response.ok) throw new Error("Falha ao carregar arquivos")
      const data = await response.json()
      setFiles(data.files)
      setUsage(data)
    } catch {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os arquivos",
      })
    } finally {
      setLoading(false)
    }
  }, [params.id, toast])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  // Aparecer nos filtros apenas os tipos de documentos que o usuário possui
  const availableDocumentTypes = useMemo(() => {
    if (!files.length) return []
    return Array.from(new Set(files.map((file) => file.documentType)))
  }, [files])

  
  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      // Filtrar pela data
      if (filters.dateRange.from || filters.dateRange.to) {
        const fileDate = new Date(file.createdAt)

        if (filters.dateRange.from && fileDate < filters.dateRange.from) {
          return false
        }

        if (filters.dateRange.to) {
          const endDate = new Date(filters.dateRange.to)
          endDate.setHours(23, 59, 59, 999)
          if (fileDate > endDate) {
            return false
          }
        }
      }

      // Filtrar pelos tipos de documento
      if (filters.fileTypes.length > 0 && !filters.fileTypes.includes(file.documentType)) {
        return false
      }

      return true
    })
  }, [files, filters])

  async function uploadFile({ file, documentType }: { file: File; documentType: string }) {
    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("documentType", documentType)

    try {
      const response = await fetch(`/api/restaurants/${params.id}/files`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Falha ao fazer upload")

      toast({
        title: "Sucesso",
        description: "Arquivo enviado com sucesso",
      })

      loadFiles() // Recarregar a lista de arquivos
    } catch {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao enviar arquivo",
      })
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(file: RestaurantFile) {
    setDeleting(true)
    try {
      const response = await fetch(`/api/restaurants/${params.id}/files/${file.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Falha ao excluir arquivo")

      toast({
        title: "Sucesso",
        description: "Arquivo excluído com sucesso",
      })

      setFiles(files.filter((f) => f.id !== file.id))
    } catch {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao excluir arquivo",
      })
    } finally {
      setDeleting(false)
      setFileToDelete(null)
    }
  }

  function handleApplyFilters(newFilters: FilterOptions) {
    setFilters(newFilters)
  }

  if (loading) {
    return (
      <>
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.push(`/conta/restaurants/${params.id}`)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Skeleton variant="title" />
          </div>
          <Skeleton variant="button" />
        </header>

        <main className="flex-1 space-y-4 p-4 md:p-6">
          <div className="rounded-lg border p-4 space-y-3">
            <div className="space-y-2">
              <Skeleton variant="text" className="w-48" />
              <Skeleton variant="text" className="w-full" />
            </div>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonFileCard key={i} />
            ))}
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/conta/restaurants/${params.id}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold md:text-xl">Arquivos do Restaurante</h1>
          <FilterButton
            onApplyFilters={handleApplyFilters}
            availableFileTypes={availableDocumentTypes}
            defaultFilters={filters}
          />
        </div>
        <div className="flex items-center gap-2">          
          <UploadDialog onUpload={uploadFile} uploading={uploading} />
        </div>
      </header>

      <main className="flex-1 space-y-4 p-4 md:p-6">
        {usage && (
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Armazenamento Utilizado</span>
              <span className="font-medium">
                {usage.usedStorage.toFixed(2)}MB de {usage.availableStorage}MB
              </span>
            </div>
            <Progress
              value={usage.percentageUsed}
              className={cn(
                "h-2",
                usage.percentageUsed < 70
                  ? "bg-[#A3E635]/20 [&>div]:bg-[#A3E635]"
                  : usage.percentageUsed < 90
                    ? "bg-yellow-500/20 [&>div]:bg-yellow-500"
                    : "bg-destructive/20 [&>div]:bg-destructive",
              )}
            />
            <p className="text-xs text-muted-foreground">
              {usage.percentageUsed < 90 ? (
                `Você ainda tem ${(usage.availableStorage - usage.usedStorage).toFixed(2)}MB disponíveis`
              ) : (
                <span className="text-destructive">Atenção: Seu armazenamento está quase cheio!</span>
              )}
            </p>
          </div>
        )}

        {files.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed p-8 text-center">
            <h2 className="font-medium">Nenhum arquivo encontrado</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Você tem {usage?.availableStorage}MB disponíveis para upload
            </p>
            <UploadDialog onUpload={uploadFile} uploading={uploading} />
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed p-8 text-center">
            <h2 className="font-medium">Nenhum arquivo corresponde aos filtros selecionados</h2>
            <p className="mt-2 text-sm text-muted-foreground">Tente ajustar seus filtros para ver mais resultados</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() =>
                setFilters({
                  dateRange: { from: undefined, to: undefined },
                  fileTypes: [],
                })
              }
            >
              Limpar Filtros
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {file.name} • <Badge className="bg-lime-300 border border-lime-200">{file.documentType}</Badge>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {new Date(file.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => window.open(file.url, "_blank")}>
                    <FileText className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setFileToDelete(file)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive">Excluir Arquivo</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o arquivo{" "}
                          <span className="font-semibold text-destructive">{fileToDelete?.name}</span>? Esta ação não
                          pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel
                          onClick={() => setFileToDelete(null)}
                          className="border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                        >
                          Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => fileToDelete && handleDelete(fileToDelete)}
                          disabled={deleting}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deleting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Excluindo...
                            </>
                          ) : (
                            "Excluir Arquivo"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}

