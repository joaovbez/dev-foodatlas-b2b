"use client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, X } from "lucide-react"

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState("")

  // Requisitos da senha
  const requirements = [
    { 
      text: "Mínimo de 8 caracteres",
      validator: (pass: string) => pass.length >= 8 
    },
    { 
      text: "Pelo menos uma letra maiúscula",
      validator: (pass: string) => /[A-Z]/.test(pass)
    },
    { 
      text: "Pelo menos um número",
      validator: (pass: string) => /\d/.test(pass)
    },
    { 
      text: "Pelo menos um caractere especial",
      validator: (pass: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pass)
    }
  ]

  // Verifica força da senha
  const getPasswordStrength = (password: string) => {
    const validRequirements = requirements.filter(req => req.validator(password)).length
    if (validRequirements === 0) return ''
    if (validRequirements <= 2) return 'fraca'
    if (validRequirements <= 3) return 'média'
    return 'forte'
  }

  const passwordStrength = getPasswordStrength(password)

  const strengthColors = {
    fraca: 'bg-red-500',
    média: 'bg-yellow-500',
    forte: 'bg-green-500'
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string
    const name = formData.get("name") as string

    // Validar senha
    if (getPasswordStrength(password) !== 'forte') {
      toast({
        variant: "destructive",
        title: "Senha fraca",
        description: "Por favor, atenda a todos os requisitos de senha."
      })
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Senhas diferentes",
        description: "As senhas digitadas não coincidem."
      })
      setLoading(false)
      return
    }

    try {
      // 1. Registrar usuário
      const registerRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          name,
        }),
      })

      if (!registerRes.ok) {
        const error = await registerRes.text()
        throw new Error(error)
      }

      // 2. Enviar código de verificação
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
        title: "Conta criada com sucesso!",
        description: "Verifique seu email para ativar sua conta.",
      })

      // Redirecionar para página de verificação
      router.push(`/verify-email?email=${encodeURIComponent(email)}`)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao criar conta",
        description: error instanceof Error ? error.message : "Algo deu errado",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-xl font-bold text-gray-700">
          Integre os dados do seu restaurante com Inteligência Artificial!
        </h1>
        <p className="text-balance text-sm text-muted-foreground">
          Crie uma conta em nossa plataforma.
        </p>
        <hr className="w-full border-t border-gray-300" />
      </div>
      
      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="name">Nome completo</Label>
          <Input name="name" id="name" type="text" required />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            name="email" 
            id="email" 
            type="email" 
            placeholder="m@examplo.com" 
            required 
          />
        </div>
        
        <div className="grid gap-2">        
          <Label htmlFor="password">Senha</Label>          
          <Input 
            name="password" 
            id="password" 
            type="password" 
            required 
            onChange={(e) => setPassword(e.target.value)}
          />
          
          {password && (
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <div className="h-2 w-full rounded-full bg-gray-100">
                  {passwordStrength && (
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${strengthColors[passwordStrength as keyof typeof strengthColors]}`}
                      style={{ 
                        width: passwordStrength === 'fraca' ? '33.33%' : 
                               passwordStrength === 'média' ? '66.66%' : '100%' 
                      }}
                    />
                  )}
                </div>
                {passwordStrength && (
                  <p className="text-sm text-gray-600">
                    Força da senha: <span className="font-medium">{passwordStrength}</span>
                  </p>
                )}
              </div>
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm font-semibold text-gray-800">Requisitos da senha:</p>
                <ul className="space-y-2.5">
                  {requirements.map((requirement, index) => (
                    <li 
                      key={index} 
                      className="flex items-center gap-3 text-sm bg-white p-2.5 rounded-md shadow-sm"
                    >
                      {requirement.validator(password) ? (
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                      ) : (
                        <X className="h-5 w-5 text-red-500 flex-shrink-0" />
                      )}
                      <span className={cn(
                        "transition-colors duration-200",
                        requirement.validator(password) ? "text-green-800 font-medium" : "text-gray-700"
                      )}>
                        {requirement.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-2">        
          <Label htmlFor="confirmPassword">Confirme sua Senha</Label>          
          <Input 
            name="confirmPassword" 
            id="confirmPassword" 
            type="password" 
            required 
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <span className="mr-2">Criando conta</span>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            </>
          ) : (
            "Criar conta"
          )}
        </Button>        
      </div>

      <div className="text-center text-sm">
        Já possui uma conta?{" "}
        <a href="/login" className="underline underline-offset-4 hover:text-gray-600">
          Faça login!
        </a>
      </div>
    </form>
  )
}
