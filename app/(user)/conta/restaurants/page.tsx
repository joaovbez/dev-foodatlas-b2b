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

interface Restaurant {
  id: string
  name: string
  cnpj: string
  address?: string
  phone?: string
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState("")
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    async function loadRestaurants() {
      try {
        const response = await fetch("/api/restaurants")
        if (!response.ok) throw new Error("Falha ao carregar restaurantes")
        const data = await response.json()
        setRestaurants(data)
      } catch (error) {
        console.error("Erro:", error)
      } finally {
        setLoading(false)
      }
    }

    loadRestaurants()
  }, [])

  async function handleDelete(restaurant: Restaurant) {
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

      if (!response.ok) {
        throw new Error("Falha ao excluir restaurante")
      }

      toast({
        title: "Sucesso",
        description: "Restaurante excluído com sucesso",
      })

      // Atualizar a lista removendo o restaurante excluído
      setRestaurants(prev => prev.filter(r => r.id !== restaurant.id))
    } catch (error) {
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
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b">
        <div className="flex items-center gap-2 px-4">
          <h1 className="text-lg font-semibold">Meus Restaurantes</h1>
        </div>
      </header>

      <main className="flex-1 space-y-4 p-8">
        <div className="flex justify-end">
          <Button onClick={() => router.push("/conta/restaurants/add")}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Restaurante
          </Button>
        </div>

        {restaurants.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed p-8 text-center">
            <h2 className="text-lg font-medium">Nenhum restaurante cadastrado</h2>
            <p className="mt-2 text-muted-foreground">
              Comece adicionando seu primeiro restaurante
            </p>
            <Button
              onClick={() => router.push("/conta/restaurants/add")}
              className="mt-4"
            >
              Adicionar Restaurante
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="relative rounded-lg border p-4 transition-colors hover:bg-muted"
              >
                <div 
                  className="cursor-pointer pr-12"
                  onClick={() => router.push(`/conta/restaurants/${restaurant.id}`)}
                >
                  <h2 className="font-medium">{restaurant.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    CNPJ: {restaurant.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")}
                  </p>
                  {restaurant.address && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {restaurant.address}
                    </p>
                  )}
                  {restaurant.phone && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {restaurant.phone}
                    </p>
                  )}
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      onClick={() => setSelectedRestaurant(restaurant)}
                      variant="ghost"
                      className="absolute right-2 top-2 h-8 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/50 hover:border-destructive/50 border"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-destructive text-xl">
                        Excluir Restaurante
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Esta ação não pode ser desfeita. Isso excluirá permanentemente o restaurante{" "}
                          <span className="font-semibold text-destructive">
                            {selectedRestaurant?.name}
                          </span>{" "}
                          e todos os dados associados.
                        </p>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-destructive">
                            Digite o nome do restaurante para confirmar a exclusão:
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
                          {confirmDelete && confirmDelete !== selectedRestaurant?.name && (
                            <p className="text-xs text-destructive">
                              O nome digitado não corresponde ao nome do restaurante
                            </p>
                          )}
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel 
                        onClick={() => {
                          setConfirmDelete("")
                          setSelectedRestaurant(null)
                        }}
                        className="border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                      >
                        Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => selectedRestaurant && handleDelete(selectedRestaurant)}
                        disabled={deleting || confirmDelete !== selectedRestaurant?.name}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive disabled:bg-destructive/50"
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