"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, PenSquare, FolderOpen, ArrowLeft, FileText } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"

interface Restaurant {
  id: string
  name: string
  cnpj: string
  address?: string
  phone?: string
  createdAt: string
}

interface RestaurantFile {
  id: string
  name: string
  size: number
  createdAt: string
  type: string
}

export default function RestaurantDetailsPage({
  params,
}: {
  params: { id: string }
}) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [recentFiles, setRecentFiles] = useState<RestaurantFile[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    async function loadRestaurantData() {
      try {
        const response = await fetch(`/api/restaurants/${params.id}`)
        if (!response.ok) throw new Error("Falha ao carregar dados do restaurante")
        const data = await response.json()
        setRestaurant(data)

        // Carregar arquivos recentes
        const filesResponse = await fetch(`/api/restaurants/${params.id}/files?limit=5`)
        if (filesResponse.ok) {
          const filesData = await filesResponse.json()
          setRecentFiles(filesData)
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar os dados do restaurante",
        })
      } finally {
        setLoading(false)
      }
    }

    loadRestaurantData()
  }, [params.id, toast])

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Restaurante não encontrado</p>
      </div>
    )
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/conta/restaurants")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex flex-col">
            <p className="text-sm font-medium text-muted-foreground">Restaurante</p>
            <h1 className="text-xl font-bold tracking-tight">{restaurant.name}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/conta/restaurants/${params.id}/files`)}
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            Gerenciar Arquivos
          </Button>
          <Button 
            onClick={() => router.push(`/conta/restaurants/${params.id}/edit`)}
          >
            <PenSquare className="mr-2 h-4 w-4" />
            Editar Restaurante
          </Button>
        </div>
      </header>

      <main className="flex-1 space-y-8 p-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight">Informações do Restaurante</h2>
            <div className="h-4 w-[2px] bg-border" />
            <p className="text-sm text-muted-foreground">CNPJ: {restaurant.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")}</p>
          </div>
          <div className="grid gap-6 rounded-lg border p-6">
            {restaurant.address && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Endereço</p>
                <p className="mt-1 text-base">{restaurant.address}</p>
              </div>
            )}
            {restaurant.phone && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                <p className="mt-1 text-base">{restaurant.phone}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Data de Cadastro</p>
              <p className="mt-1 text-base">
                {new Date(restaurant.createdAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric"
                })}
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold tracking-tight">Arquivos Recentes</h2>
              <p className="text-sm text-muted-foreground">
                Últimos arquivos adicionados ao restaurante
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => router.push(`/conta/restaurants/${params.id}/files`)}
            >
              Ver todos
            </Button>
          </div>

          {recentFiles.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed p-8 text-center">
              <h3 className="text-lg font-medium">Nenhum arquivo encontrado</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Comece fazendo upload dos arquivos do seu restaurante
              </p>
              <Button
                onClick={() => router.push(`/conta/restaurants/${params.id}/files`)}
                className="mt-4"
              >
                Gerenciar Arquivos
              </Button>
            </div>
          ) : (
            <div className="divide-y rounded-lg border">
              {recentFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
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
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}