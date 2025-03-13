"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(event.currentTarget)
      const email = formData.get("email") as string

      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Erro ao enviar email")
      }

      toast({
        title: "Email enviado!",
        description: "Você receberá as instruções de recuperação no seu email.",
      })

      // Aguardar um momento para mostrar a mensagem de sucesso
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Usar router.push para navegação client-side
      router.push("/login")
    } catch (error) {
      console.error("Erro ao enviar email:", error)
      toast({
        variant: "destructive",
        title: "Erro ao enviar email",
        description: error instanceof Error ? error.message : "Algo deu errado",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold text-gray-700">Alteração de Senha</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Digite o seu email para prosseguir com a recuperação.
        </p>
        <hr className="w-full border-t border-gray-300" />
      </div>
      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            name="email" 
            id="email" 
            type="email" 
            placeholder="nome@email.com" 
            required 
          />
        </div>        
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <span className="mr-2">Enviando</span>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            </>
          ) : (
            "Enviar link de recuperação"
          )}
        </Button>        
      </div>
      <div className="text-center text-sm">        
        <Link href="/login" className="underline underline-offset-4">
          Voltar para página de login
        </Link>
      </div>
    </form>
  )
}
