"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Trash2 } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Skeleton, SkeletonRestaurantCard } from "@/components/ui/skeleton"

interface restaurant {
  id: string
  name: string
  cnpj: string
  address?: string
  phone?: string
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState("")
  const [selectedRestaurant, setSelectedRestaurant] = useState<restaurant | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    async function loadRestaurants() {
      try {
        const response = await fetch("/api/restaurants")
        if (!response.ok) throw new Error("Falha ao carregar restaurantes")
        const data = await response.json()
        setRestaurants(data)
      } catch {
        console.error("Erro ao carregar restaurantes")
      } finally {
        setLoading(false)
      }
    }

    loadRestaurants()
  }, [])

  async function handleDelete(restaurant: restaurant) {
    if (confirmDelete !== restaurant.name) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "O nome digitado não corresponde ao nome do restaurante",
      })
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/restaurants/${restaurant.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Falha ao excluir restaurante")

      toast({
        title: "Sucesso",
        description: "Restaurante excluído com sucesso",
      })

      // Atualizar a lista removendo o restaurante excluído
      setRestaurants(prev => prev.filter(r => r.id !== restaurant.id))
    } catch {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao excluir restaurante",
      })
    } finally {
      setDeleting(false)
      setConfirmDelete("")
      setSelectedRestaurant(null)
    }
  }

  if (loading) {
    return (
      <>
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 md:px-6">
          <Skeleton variant="title" />
          <Skeleton variant="button" />
        </header>

        <main className="flex-1 p-4 md:p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonRestaurantCard key={i} />
            ))}
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 md:px-6">
        <h1 className="text-lg font-semibold md:text-xl">Meus Restaurantes</h1>
        <Button onClick={() => router.push("/conta/restaurants/add")}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar
        </Button>
      </header>

      <main className="flex-1 p-4 md:p-6">
        {restaurants.length === 0 ? (
          <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
            <div className="text-center">
              <h2 className="text-lg font-semibold">Nenhum restaurante encontrado</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Comece adicionando seu primeiro restaurante.
              </p>
            </div>
            <Button onClick={() => router.push("/conta/restaurants/add")}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Restaurante
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {restaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="relative rounded-lg border p-4 transition-colors hover:bg-[#A3E635]/10"
              >
                <div 
                  className="cursor-pointer pr-12"
                  onClick={() => router.push(`/conta/restaurants/${restaurant.id}`)}
                >
                  <h2 className="font-medium line-clamp-1">{restaurant.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    CNPJ: {restaurant.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")}
                  </p>
                  {restaurant.address && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                      {restaurant.address}
                    </p>
                  )}
                  {restaurant.phone && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {restaurant.phone.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3")}
                    </p>
                  )}
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      onClick={() => setSelectedRestaurant(restaurant)}
                      variant="ghost"
                      className="absolute right-2 top-2 h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="sm:max-w-[425px]">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-destructive">
                        Excluir Restaurante
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        <div className="space-y-4">
                          <p>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o restaurante{" "}
                            <span className="font-semibold text-destructive">
                              {selectedRestaurant?.name}
                            </span>{" "}
                            e todos os dados associados.
                          </p>
                          <div className="space-y-2">
                            <p className="font-medium text-destructive">
                              Digite o nome do restaurante para confirmar:
                            </p>
                            <Input
                              value={confirmDelete}
                              onChange={(e) => setConfirmDelete(e.target.value)}
                              placeholder={selectedRestaurant?.name}
                              className={cn(
                                "border-destructive/50 focus-visible:ring-destructive",
                                confirmDelete && confirmDelete !== selectedRestaurant?.name && "border-destructive"
                              )}
                            />
                          </div>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel 
                        onClick={() => {
                          setConfirmDelete("")
                          setSelectedRestaurant(null)
                        }}
                      >
                        Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => selectedRestaurant && handleDelete(selectedRestaurant)}
                        disabled={deleting || confirmDelete !== selectedRestaurant?.name}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Excluindo...
                          </>
                        ) : (
                          "Excluir Restaurante"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
} 