"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { IMaskInput } from "react-imask"

interface Restaurant {
  id: string
  name: string
  cnpj: string
  address?: string
  phone?: string
}

export default function RestaurantDetailsPage({
  params,
}: {
  params: { id: string }
}) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    async function loadRestaurant() {
      try {
        const response = await fetch(`/api/restaurants/${params.id}`)
        if (!response.ok) throw new Error("Falha ao carregar restaurante")
        const data = await response.json()
        setRestaurant(data)
      } catch (error) {
        console.error("Erro:", error)
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Falha ao carregar dados do restaurante",
        })
      } finally {
        setLoading(false)
      }
    }

    loadRestaurant()
  }, [params.id, toast])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)

    try {
      const formData = new FormData(event.currentTarget)
      const cnpjValue = formData.get("cnpj") as string
      const phoneValue = formData.get("phone") as string

      const data = {
        name: (formData.get("name") as string).trim(),
        cnpj: cnpjValue ? cnpjValue.replace(/\D/g, "") : "",
        address: (formData.get("address") as string)?.trim() || "",
        phone: phoneValue ? phoneValue.replace(/\D/g, "") : "",
      }

      // Validações
      if (!data.name) {
        throw new Error("Nome do restaurante é obrigatório")
      }

      if (!data.cnpj || data.cnpj.length !== 14) {
        throw new Error("CNPJ inválido")
      }

      const response = await fetch(`/api/restaurants/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText)
      }

      toast({
        title: "Sucesso",
        description: "Restaurante atualizado com sucesso",
      })

      router.push("/conta/restaurants")
      router.refresh()
    } catch (error) {
      console.error("Erro ao atualizar:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao atualizar restaurante",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!restaurant) {
    return <div>Restaurante não encontrado</div>
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b">
        <div className="flex items-center gap-2 px-4">
          <h1 className="text-lg font-semibold">Editar Restaurante</h1>
        </div>
      </header>

      <main className="flex-1 p-8">
        <div className="mx-auto max-w-2xl">
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Restaurante</Label>
              <Input
                id="name"
                name="name"
                placeholder="Ex: Restaurante do João"
                defaultValue={restaurant.name}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <IMaskInput
                mask="00.000.000/0000-00"
                id="cnpj"
                name="cnpj"
                placeholder="00.000.000/0000-00"
                defaultValue={restaurant.cnpj}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                name="address"
                placeholder="Ex: Rua das Flores, 123 - Centro"
                defaultValue={restaurant.address}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <IMaskInput
                mask="(00) 00000-0000"
                id="phone"
                name="phone"
                placeholder="(00) 00000-0000"
                defaultValue={restaurant.phone}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/conta/restaurants")}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      </main>
    </>
  )
}