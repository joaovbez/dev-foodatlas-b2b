"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ArrowLeft } from "lucide-react"
import { IMaskInput } from "react-imask"

export default function AddRestaurantPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

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

      const response = await fetch("/api/restaurants", {
        method: "POST",
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
        description: "Restaurante adicionado com sucesso",
      })

      router.push("/conta/restaurants")
      router.refresh()
    } catch (error) {
      console.error("Erro ao adicionar restaurante:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao adicionar restaurante",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b">
        <div className="flex items-center gap-2 px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/conta/restaurants")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">Adicionar Novo Restaurante</h1>
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <IMaskInput
                mask="(00) 00000-0000"
                id="phone"
                name="phone"
                placeholder="(00) 00000-0000"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  "Adicionar Restaurante"
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