import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold text-gray-700">Integre os dados do seu restaurante com Inteligência Artificial!</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Crie uma conta em nossa plataforma.
        </p>
        <hr className="w-full border-t border-gray-300" />
      </div>
      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="m@example.com" required />
        </div>
        <div className="grid gap-2">        
            <Label htmlFor="password">Senha</Label>          
            <Input id="password" type="password" required />
        </div>
        <div className="grid gap-2">        
            <Label htmlFor="password">Confirme sua Senha</Label>          
            <Input id="password" type="password" required />
        </div>
        <Button type="submit" className="w-full" asChild>
          <Link href="/dashboard">Criar conta</Link>
        </Button>        
      </div>
      <div className="text-center text-sm">
        Já Possui uma conta?{" "}
        <a href="/login" className="underline underline-offset-4">
          Faça login!
        </a>
      </div>
    </form>
  )
}
