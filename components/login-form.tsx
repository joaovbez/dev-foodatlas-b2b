import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

import Link from "next/link"

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
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
          <Input id="email" type="email" placeholder="m@example.com" required />
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
          <Input id="password" type="password" required />
          <div className="flex items-center space-x-2">
            <Checkbox id="remember" />
            <Label htmlFor="remember">Lembrar-me</Label>
          </div>
        </div>

        <Button type="submit" className="w-full" asChild>
          <Link href="/chat">Login</Link>
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
