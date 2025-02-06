"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cnpj: z.string().length(14, "CNPJ deve ter 14 dígitos"),
  address: z.string().optional(),
  phone: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function EditRestaurantPage({
  params,
}: {
  params: { id: string }
}) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      cnpj: "",
      address: "",
      phone: "",
    },
  })

  useEffect(() => {
    async function loadRestaurant() {
      try {
        const response = await fetch(`/api/restaurants/${params.id}`)
        if (!response.ok) throw new Error("Falha ao carregar dados do restaurante")
        const data = await response.json()
        
        form.reset({
          name: data.name,
          cnpj: data.cnpj,
          address: data.address || "",
          phone: data.phone || "",
        })
      } catch {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar os dados do restaurante",
        })
        router.push("/conta/restaurants")
      } finally {
        setLoading(false)
      }
    }

    loadRestaurant()
  }, [params.id, form, router, toast])

  async function onSubmit(data: FormValues) {
    setSaving(true)
    try {
      const response = await fetch(`/api/restaurants/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
      }

      toast({
        title: "Sucesso",
        description: "Restaurante atualizado com sucesso",
      })

      router.push(`/conta/restaurants/${params.id}`)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao atualizar restaurante",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 md:px-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/conta/restaurants/${params.id}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold md:text-xl">Editar Restaurante</h1>
      </header>

      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-2xl">
          {loading ? (
            <div className="flex h-[50vh] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Restaurante</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite o nome" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNPJ</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Digite apenas números" 
                            maxLength={14}
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "")
                              field.onChange(value)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite o endereço (opcional)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Digite o telefone (opcional)" 
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "")
                              field.onChange(value)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex flex-col gap-4 sm:flex-row">
                  <Button 
                    type="submit" 
                    disabled={saving}
                    className="hover:bg-[#A3E635]/10 hover:text-black hover:border-[#A3E635]"
                  >
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
                    onClick={() => router.push(`/conta/restaurants/${params.id}`)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </main>
    </>
  )
}