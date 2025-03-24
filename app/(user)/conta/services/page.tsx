'use client'

import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import {
  Bot,
  Building2,
  FileSpreadsheet,
  Settings,
  Sparkles,
  Store,
  Upload,
  Users,
  Wallet,
  LayoutDashboard,
} from "lucide-react"
import { GridPattern } from "@/components/ui/grid-pattern"
import { cn } from "@/lib/utils"

interface QuickAction {
  title: string
  description: string
  icon: React.ElementType
  href: string
  color: string
  gradient: string
  badge?: {
    text: string
    variant: "default" | "secondary" | "destructive" | "outline" | "success"
  }
}

export default function ServicesPage() {
  const router = useRouter()

  const quickActions: QuickAction[] = [
    {
      title: "Chat IA",
      description: "Analise seus dados com inteligência artificial",
      icon: Bot,
      href: "/conta/ai/chat",
      color: "text-primary",
      gradient: "from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-800",
      badge: {
        text: "Disponível",
        variant: "default"
      }
    },
    {
      title: "Restaurantes",
      description: "Gerencie seus estabelecimentos",
      icon: Store,
      href: "/conta/restaurants",
      color: "text-primary",
      gradient: "from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-800",
      badge: {
        text: "Disponível",
        variant: "default"
      }
    },
    {
      title: "Arquivos",
      description: "Gerencie seus arquivos e planilhas",
      icon: FileSpreadsheet,
      href: "/conta/files",
      color: "text-primary",
      gradient: "from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-800",
      badge: {
        text: "Disponível",
        variant: "default"
      }
    },
    {
      title: "Configurações",
      description: "Configure sua conta",
      icon: Settings,
      href: "/conta/settings",
      color: "text-primary",
      gradient: "from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-800",
      badge: {
        text: "Disponível",
        variant: "default"
      }
    },
    {
      title: "Funcionários",
      description: "Gerencie sua equipe",
      icon: Users,
      href: "#",
      color: "text-primary",
      gradient: "from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-800",
      badge: {
        text: "Em breve",
        variant: "destructive"
      }
    },
      {
      title: "Financeiro",
      description: "Acompanhe suas finanças",
      icon: Wallet,
      href: "#",
      color: "text-primary",
      gradient: "from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-800",
      badge: {
        text: "Em breve",
        variant: "destructive"
      }
    },  
      {
      title: "Dashboard",
      description: "escrever descrição dashboard",
      icon: LayoutDashboard,
      href: "#",
      color: "text-primary",
      gradient: "from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-800",
      badge: {
        text: "Em breve",
        variant: "destructive"
      }
    },  
    {
      title: "Premium",
      description: "Conheça nossos planos premium",
      icon: Sparkles,
      href: "#",
      color: "text-primary",
      gradient: "from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-800",
      badge: {
        text: "Em breve",
        variant: "destructive"
      }
    },
  ]

  return (
    <div className="container p-6 mx-auto relative min-h-screen">
      <GridPattern
        width={30}
        height={30}
        x={-1}
        y={-1}
        strokeDasharray="4 2"
        className="fixed inset-0 w-screen h-screen [mask-image:radial-gradient(900px_circle_at_center,white,transparent)]"
      />

      <div className="flex flex-col gap-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Serviços</h1>
            <p className="text-sm text-muted-foreground">
              Acesse rapidamente todas as funcionalidades da plataforma
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Card
              key={action.title}
              className={`group relative overflow-hidden border-none bg-gradient-to-br ${action.gradient} p-6 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg`}
              onClick={() => router.push(action.href)}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className={`${action.color} p-2 w-fit rounded-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm`}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  {action.badge && (
                    <span className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full",
                      {
                        "bg-primary text-primary-foreground": action.badge.variant === "default",
                        "bg-secondary text-secondary-foreground": action.badge.variant === "secondary",
                        "bg-destructive text-destructive-foreground": action.badge.variant === "destructive",
                        "border border-input bg-background hover:bg-accent hover:text-accent-foreground": action.badge.variant === "outline",
                        "bg-green-500 text-white": action.badge.variant === "success",
                      }
                    )}>
                      {action.badge.text}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">{action.title}</h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {action.description}
                  </p>
                </div>
              </div>

              {/* Efeito Shine melhorado */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-[100%] group-hover:animate-shine pointer-events-none" />
            </Card>
          ))}
        </div>

        {/* Seção de Estatísticas */}
        <div className="grid gap-4 mt-6 md:grid-cols-3">
          <Card className="p-6 bg-zinc-100 dark:bg-zinc-800">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-white/80 dark:bg-zinc-900/80">
                <Store className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Restaurantes Ativos
                </p>
                <h3 className="text-2xl font-bold">3</h3>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-zinc-100 dark:bg-zinc-800">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-white/80 dark:bg-zinc-900/80">
                <FileSpreadsheet className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Arquivos Processados
                </p>
                <h3 className="text-2xl font-bold">28</h3>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-zinc-100 dark:bg-zinc-800">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-white/80 dark:bg-zinc-900/80">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Análises por IA
                </p>
                <h3 className="text-2xl font-bold">152</h3>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
