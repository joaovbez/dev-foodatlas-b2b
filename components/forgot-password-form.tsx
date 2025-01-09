import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
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
          <Input id="email" type="email" placeholder="m@example.com" required />
        </div>        
        <Button type="submit" className="w-full" asChild>
          <Link href="#">Enviar link de recuperação</Link>
        </Button>        
      </div>
      <div className="text-center text-sm">        
        <a href="/login" className="underline underline-offset-4">
          Voltar para página de login
        </a>
      </div>
    </form>
  )
}
