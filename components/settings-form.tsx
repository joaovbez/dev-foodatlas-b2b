"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Check, Save, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"

export function SettingsForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  useEffect(() => {
    async function loadUserData() {
      try {
        const response = await fetch("/api/settings")
        if (!response.ok) {
          throw new Error("Falha ao carregar dados do usuário")
        }
        const userData = await response.json()
        setFormData(prevData => ({
          ...prevData,
          name: userData.name || "",
          email: userData.email || "",
          password: "",
          confirmPassword: "",
        }))
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error)
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar seus dados. Tente novamente mais tarde.",
        })
      }
    }

    loadUserData()
  }, [toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }
  

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    if (!formData.password) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, insira sua senha para confirmar alterações",
      })
      setLoading(false)
      return
    }

    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "As senhas não coincidem",
      })
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(errorData || "Erro ao atualizar configurações")
      }

      toast({
        title: "Configurações atualizadas com sucesso",
        description: "As configurações foram atualizadas com sucesso",
      })    
  
      setFormData(prevData => ({
        ...prevData,
        password: "",
        confirmPassword: "",
      }))

      router.refresh()
    } catch (error) {
      console.error("Erro ao atualizar configurações:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao atualizar as configurações",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn(className)} {...props}>
      <div className="flex-1 p-8">
        <div className="mx-auto max-w-2xl">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Seu nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>  
              <Input
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="seu@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha*</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Digite sua senha atual"
              />
            </div>
            {/*<div className="space-y-2">
              <Label htmlFor="confirmPassword">Nova senha (opcional)</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Digite apenas se desejar alterar sua senha"
              />
            </div>*/}
            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Salvar alterações
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}   
