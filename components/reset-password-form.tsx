"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff } from "lucide-react"

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const tokenParam = searchParams.get("token")
    if (!tokenParam) {
      toast({
        variant: "destructive",
        title: "Token inválido",
        description: "Este link de recuperação de senha é inválido ou expirou.",
      })
      router.push("/login")
      return
    }
    setToken(tokenParam)
  }, [searchParams, router, toast])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) return

    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Senhas diferentes",
        description: "As senhas digitadas não coincidem.",
      })
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      })

      if (!res.ok) {
        const error = await res.text()
        throw new Error(error)
      }

      toast({
        title: "Senha alterada!",
        description: "Sua senha foi alterada com sucesso.",
      })

      router.push("/login")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao alterar senha",
        description: error instanceof Error ? error.message : "Algo deu errado",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!token) return null

  return (
    <form onSubmit={onSubmit} className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold text-white">Redefinir Senha</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Digite sua nova senha abaixo.
        </p>
        <hr className="w-full border-t border-gray-300" />
      </div>
      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="password">Nova Senha</Label>
          <div className="relative">
            <Input 
              name="password"
              id="password" 
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••" 
              required 
              className="bg-white/10 border-gray-700"
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
        </div>

        <div className="grid gap-2">
          <Label htmlFor="confirmPassword">Confirme a Nova Senha</Label>
          <div className="relative">
            <Input 
              name="confirmPassword"
              id="confirmPassword" 
              type={showConfirmPassword ? "text" : "password"} 
              placeholder="••••••••" 
              required 
              className="bg-white/10 border-gray-700"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-gray-500" />
              ) : (
                <Eye className="h-4 w-4 text-gray-500" />
              )}
            </Button>
          </div>
        </div>
        
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <span className="mr-2">Alterando senha</span>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            </>
          ) : (
            "Alterar Senha"
          )}
        </Button>        
      </div>
      <div className="text-center text-sm">        
        <a href="/login" className="underline underline-offset-4 hover:text-gray-300">
          Voltar para página de login
        </a>
      </div>
    </form>
  )
} 