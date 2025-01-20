"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        if (result.error.includes("verifique seu email")) {
          toast({
            variant: "destructive",
            title: "Email não verificado",
            description: "Por favor, verifique seu email antes de fazer login.",
          })
          
          // Redirecionar para página de verificação
          router.push(`/verify-email?email=${encodeURIComponent(email)}`)
          return
        }

        toast({
          variant: "destructive",
          title: "Erro ao fazer login",
          description: result.error,
        })
        return
      }

      toast({
        title: "Login realizado com sucesso!",
        description: "Redirecionando para sua conta...",
      })

      setTimeout(() => {
        const callbackUrl = searchParams.get("callbackUrl") || "/conta"
        router.push(callbackUrl)
        router.refresh()
      }, 1500)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro inesperado",
        description: "Ocorreu um erro ao fazer login. Tente novamente mais tarde.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold text-gray-700">Seja bem vindo de volta!</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Faça login em sua conta.
        </p>
        <hr className="w-full border-t border-gray-300" />
      </div>
      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input name="email" id="email" type="email" placeholder="m@example.com" required />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">Senha</Label>
            <a
              href="/forgot-password"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Esqueceu sua senha?
            </a>
          </div>
          <Input name="password" id="password" type="password" required />
          <div className="flex items-center space-x-2">
            <Checkbox id="remember" />
            <Label htmlFor="remember">Lembrar-me</Label>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <span className="mr-2">Entrando</span>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            </>
          ) : (
            "Entrar"
          )}
        </Button>
      </div>
      <div className="text-center text-sm">
        Não possui uma conta?{" "}
        <a href="/sign-up" className="underline underline-offset-4">
          Registre-se!
        </a>
      </div>
    </form>
  )
}
