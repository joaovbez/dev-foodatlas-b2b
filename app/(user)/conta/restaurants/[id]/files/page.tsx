"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, Upload, FileText, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"

interface RestaurantFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  createdAt: string
}

export default function RestaurantFilesPage({
  params,
}: {
  params: { id: string }
}) {
  const [files, setFiles] = useState<RestaurantFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    loadFiles()
  }, [params.id])

  async function loadFiles() {
    try {
      const response = await fetch(`/api/restaurants/${params.id}/files`)
      if (!response.ok) throw new Error("Falha ao carregar arquivos")
      const data = await response.json()
      setFiles(data)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os arquivos",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)

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
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao enviar arquivo",
      })
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(fileId: string) {
    try {
      const response = await fetch(`/api/restaurants/${params.id}/files/${fileId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Falha ao excluir arquivo")

      toast({
        title: "Sucesso",
        description: "Arquivo excluído com sucesso",
      })

      setFiles(files.filter(f => f.id !== fileId))
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao excluir arquivo",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/conta/restaurants/${params.id}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">Arquivos do Restaurante</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button disabled={uploading} asChild>
            <label className="cursor-pointer">
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.txt,.csv"
              />
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload de Arquivo
                </>
              )}
            </label>
          </Button>
        </div>
      </header>

      <main className="flex-1 space-y-4 p-8">
        {files.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed p-8 text-center">
            <h2 className="font-medium">Nenhum arquivo encontrado</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Faça upload do primeiro arquivo do seu restaurante
            </p>
            <Button className="mt-4" asChild>
              <label className="cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.txt,.csv"
                />
                <Upload className="mr-2 h-4 w-4" />
                Upload de Arquivo
              </label>
            </Button>
          </div>
        ) : (
          <div className="divide-y rounded-lg border">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 hover:bg-muted"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(file.createdAt).toLocaleDateString("pt-BR")} •{" "}
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDelete(file.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
} 