"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import logo_1 from "@/public/foodatlas_LOGOS-09.svg"

export default function VerifyEmailPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <Suspense fallback={<div>Carregando...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  )
}

function VerifyEmailContent() {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const email = searchParams.get("email")

  useEffect(() => {
    if (!email) {
      router.push("/login")
    }
  }, [email, router])

  if (!email) {
    return null
  }

  async function resendCode() {
    setResending(true)
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const error = await res.text()
        throw new Error(error)
      }

      toast({
        title: "Código reenviado!",
        description: "Verifique seu email para o novo código.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao reenviar código",
        description: error instanceof Error ? error.message : "Algo deu errado",
      })
    } finally {
      setResending(false)
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/auth/confirm-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code }),
      })

      if (!res.ok) {
        const error = await res.text()
        throw new Error(error)
      }

      toast({
        title: "Email verificado com sucesso!",
        description: "Você já pode fazer login.",
      })

      router.push("/login")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro na verificação",
        description: error instanceof Error ? error.message : "Algo deu errado",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-4 justify-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary text-primary-foreground">
        <img
          src={logo_1.src}
          alt="Custom Icon"
          className="h-14 w-14"
        />
      </div>
      
      <div className="w-full max-w-xs space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-700">Verifique seu email</h1>
          <p className="mt-2 text-sm text-gray-600">
            Digite o código de verificação enviado para {email}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <Input
            type="text"
            placeholder="Digite o código"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            className="text-center text-2xl tracking-widest"
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Verificando..." : "Verificar"}
          </Button>
        </form>

        <div className="text-center">
          <Button
            variant="link"
            onClick={resendCode}
            disabled={resending}
            className="text-sm text-muted-foreground"
          >
            {resending ? "Reenviando..." : "Não recebeu o código? Clique para reenviar"}
          </Button>
        </div>
      </div>
    </div>
  )
}
