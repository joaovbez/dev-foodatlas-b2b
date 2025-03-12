"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff } from "lucide-react"

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  useEffect(() => {
    const savedCredentials = localStorage.getItem("rememberedCredentials")
    if (savedCredentials) {
      const { email, password } = JSON.parse(savedCredentials)
      setEmail(email)
      setPassword(password)
      setRememberMe(true)
    }
  }, [])

  const handleRememberMeChange = (checked: boolean) => {
    setRememberMe(checked)
    if (!checked) {
      localStorage.removeItem("rememberedCredentials")
      setEmail("")
      setPassword("")
    }
  }

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

      if (result?.error === "EMAIL_NOT_VERIFIED") {
        const verifyRes = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        })

        if (!verifyRes.ok) {
          throw new Error("Erro ao enviar código de verificação")
        }

        toast({
          title: "Email não verificado",
          description: "Enviamos um novo código de verificação para seu email.",
        })

        router.push(`/verify-email?email=${encodeURIComponent(email)}`)
        return
      }

      if (result?.error) {
        throw new Error(result.error)
      }

      if (result?.ok) {
        if (rememberMe) {
          localStorage.setItem("rememberedCredentials", JSON.stringify({ email, password }))
        }

        toast({
          title: "Login realizado com sucesso!",
          description: "Redirecionando para sua conta...",
        })

        const callbackUrl = searchParams.get("callbackUrl")
        router.push(callbackUrl || "/conta")
        router.refresh()
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: error instanceof Error ? error.message : "Algo deu errado",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold text-white">Seja bem vindo!</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Faça login em sua conta.
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
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
          <div className="relative">
            <Input 
              name="password" 
              id="password" 
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-500" />
              ) : (
                <Eye className="h-4 w-4 text-gray-500" />
              )}
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="remember" 
              checked={rememberMe}
              onCheckedChange={(checked) => handleRememberMeChange(checked as boolean)}
            />
            <Label 
              htmlFor="remember" 
              className="text-sm cursor-pointer"
            >
              Lembrar-me
            </Label>
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
