"use client"

import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  LineChart, 
  UsersRound, 
  DollarSign, 
  Users,
  ArrowLeft
} from "lucide-react"

export default function RestaurantDashboardsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { id } = useParams() as { id: string }
  
  // Determinar qual aba está ativa
  const getActiveTab = () => {
    if (pathname.includes("/overview")) return "overview"
    if (pathname.includes("/client-consumption")) return "client-consumption"
    if (pathname.includes("/cost-control")) return "cost-control"
    if (pathname.includes("/team-management")) return "team-management"
    return "overview"
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">
        <div className="container py-4">
          <main className="flex flex-col w-full">
            <div className="mb-6 space-y-4">
              <div className="flex items-center">
                <Button variant="ghost" size="icon" asChild className="mr-2">
                  <Link href={`/conta/restaurants/${id}`}>
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <h1 className="text-2xl font-bold">Dashboard</h1>
              </div>
              
              <Tabs defaultValue={getActiveTab()} className="w-full">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="overview" asChild>
                    <Link href={`/conta/restaurants/${id}/dashboards/overview`}>
                      <LineChart className="mr-2 h-4 w-4" /> Visão Geral
                    </Link>
                  </TabsTrigger>
                  <TabsTrigger value="client-consumption" asChild>
                    <Link href={`/conta/restaurants/${id}/dashboards/client-consumption`}>
                      <UsersRound className="mr-2 h-4 w-4" /> Consumo
                    </Link>
                  </TabsTrigger>
                  <TabsTrigger value="cost-control" asChild>
                    <Link href={`/conta/restaurants/${id}/dashboards/cost-control`}>
                      <DollarSign className="mr-2 h-4 w-4" /> Custos
                    </Link>
                  </TabsTrigger>
                  <TabsTrigger value="team-management" asChild>
                    <Link href={`/conta/restaurants/${id}/dashboards/team-management`}>
                      <Users className="mr-2 h-4 w-4" /> Equipe
                    </Link>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  )
} 