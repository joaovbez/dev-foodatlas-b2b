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
} from "lucide-react"

interface QuickAction {
  title: string
  description: string
  icon: React.ElementType
  href: string
  color: string
  gradient: string
}

export default function ServicesPage() {
  const router = useRouter()

  const quickActions: QuickAction[] = [
    {
      title: "Chat IA",
      description: "Analise seus dados com inteligência artificial",
      icon: Bot,
      href: "/conta/ai/chat",
      color: "text-purple-500",
      gradient: "from-purple-500/10 to-purple-500/5"
    },
    {
      title: "Restaurantes",
      description: "Gerencie seus estabelecimentos",
      icon: Store,
      href: "/conta/restaurants",
      color: "text-green-500",
      gradient: "from-green-500/10 to-green-500/5"
    },
    {
      title: "Arquivos",
      description: "Gerencie seus arquivos e planilhas",
      icon: FileSpreadsheet,
      href: "/conta/files",
      color: "text-blue-500",
      gradient: "from-blue-500/10 to-blue-500/5"
    },
    {
      title: "Funcionários",
      description: "Gerencie sua equipe",
      icon: Users,
      href: "/conta/employees",
      color: "text-orange-500",
      gradient: "from-orange-500/10 to-orange-500/5"
    },
    {
      title: "Financeiro",
      description: "Acompanhe suas finanças",
      icon: Wallet,
      href: "/conta/finance",
      color: "text-emerald-500",
      gradient: "from-emerald-500/10 to-emerald-500/5"
    },
    {
      title: "Importar Dados",
      description: "Importe seus dados e planilhas",
      icon: Upload,
      href: "/conta/import",
      color: "text-pink-500",
      gradient: "from-pink-500/10 to-pink-500/5"
    },
    {
      title: "Configurações",
      description: "Configure sua conta",
      icon: Settings,
      href: "/conta/settings",
      color: "text-gray-500",
      gradient: "from-gray-500/10 to-gray-500/5"
    },
    {
      title: "Premium",
      description: "Conheça nossos planos premium",
      icon: Sparkles,
      href: "/conta/premium",
      color: "text-yellow-500",
      gradient: "from-yellow-500/10 to-yellow-500/5"
    },
  ]

  return (
    <div className="container p-6 mx-auto">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-primary/10">
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
                <div className={`${action.color} p-2 w-fit rounded-lg bg-white/40 backdrop-blur-sm`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-semibold">{action.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {action.description}
                  </p>
                </div>
              </div>

              {/* Efeito de hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-[100%] group-hover:animate-shimmer" />
            </Card>
          ))}
        </div>

        {/* Seção de Estatísticas */}
        <div className="grid gap-4 mt-6 md:grid-cols-3">
          <Card className="p-6 bg-primary/5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
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

          <Card className="p-6 bg-primary/5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
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

          <Card className="p-6 bg-primary/5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
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
