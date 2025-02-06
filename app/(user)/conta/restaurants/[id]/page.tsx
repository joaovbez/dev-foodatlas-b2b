"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, PenSquare, FolderOpen, ArrowLeft, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Skeleton, SkeletonRestaurantInfo } from "@/components/ui/skeleton"

interface restaurant {
  id: string
  name: string
  cnpj: string
  address?: string
  phone?: string
  createdAt: string
}

interface restaurantFile {
  id: string
  name: string
  size: number
  createdAt: string
  type: string
  url: string
}

export default function RestaurantDetailsPage({
  params,
}: {
  params: { id: string }
}) {
  const [restaurant, setRestaurant] = useState<restaurant | null>(null)
  const [recentFiles, setRecentFiles] = useState<restaurantFile[]>([])
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
          setRecentFiles(filesData.files)
        }
      } catch {
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
      <>
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/conta/restaurants")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Skeleton variant="title" />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 space-y-6">
          <SkeletonRestaurantInfo />
        </main>
      </>
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
      <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/conta/restaurants")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold md:text-xl line-clamp-1">
            {restaurant?.name}
          </h1>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 space-y-6">
        {loading ? (
          <div className="flex h-[50vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Informações do Restaurante */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Informações</h2>
                  <Button 
                    variant="outline" 
                    className="hover:bg-[#A3E635]/10 hover:text-black hover:border-[#A3E635]"
                    onClick={() => router.push(`/conta/restaurants/${params.id}/edit`)}
                  >
                    <PenSquare className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                </div>
                <div className="rounded-lg border p-4 space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">CNPJ</p>
                    <p className="font-medium">
                      {restaurant?.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")}
                    </p>
                  </div>
                  {restaurant?.address && (
                    <div>
                      <p className="text-sm text-muted-foreground">Endereço</p>
                      <p className="font-medium">{restaurant.address}</p>
                    </div>
                  )}
                  {restaurant?.phone && (
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <p className="font-medium">
                        {restaurant.phone.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3")}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Arquivos Recentes */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Arquivos Recentes</h2>
                  <Button variant="outline" onClick={() => router.push(`/conta/restaurants/${params.id}/files`)}>
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Gerenciar Arquivos
                  </Button>
                </div>

                {recentFiles.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed p-6 text-center">
                    <h3 className="font-medium">Nenhum arquivo encontrado</h3>
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
                  <div className="rounded-lg border divide-y">
                    {recentFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium truncate">{file.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(2)} MB •{" "}
                              {new Date(file.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(file.url, "_blank")}
                          className="flex-shrink-0"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </>
  )
}