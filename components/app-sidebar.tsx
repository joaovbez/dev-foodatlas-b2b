"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import {
  Brain,
  Store,
  Loader2,
  Home,
  ChartNoAxesCombined
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

interface Restaurant {
  id: string
  name: string
  cnpj: string
  address?: string
  phone?: string
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null)
  
  const user = {
    name: session?.user?.name || "Usuário",
    email: session?.user?.email || "usuario@exemplo.com",
    avatar: ""
  }

  useEffect(() => {
    async function loadRestaurants() {
      try {
        const response = await fetch("/api/restaurants")
        if (!response.ok) throw new Error("Falha ao carregar restaurantes")
        const data = await response.json()
        setRestaurants(data)
        if (data.length > 0) {
          setSelectedRestaurantId(data[0].id)
        }
      } catch (error) {
        console.error("Erro ao carregar restaurantes:", error)
      } finally {
        setLoading(false)
      }
    }

    loadRestaurants()
  }, [])

  // Formatar dados dos restaurantes para o TeamSwitcher
  const teamsData = restaurants.map(restaurant => ({
    id: restaurant.id,
    name: restaurant.name,
    logo: Store,
    plan: restaurant.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5"),
  }))

  // Handler para quando o usuário trocar de restaurante
  const handleTeamChange = (teamId: string) => {
    setSelectedRestaurantId(teamId)
  }

  const generateDashboardsNavItems = () => {
    if (!selectedRestaurantId) {
      return []
    }

    return [
      {
        title: "Dashboards",
        url: `/conta/restaurants/${selectedRestaurantId}/dashboards`,
        icon: ChartNoAxesCombined,
        items: [
          {
            title: "Visão Geral",
            url: `/conta/restaurants/${selectedRestaurantId}/dashboards/overview`,          
          },
          {
            title: "Consumo por Cliente",
            url: `/conta/restaurants/${selectedRestaurantId}/dashboards/client-consumption`,
          },
          {
            title: "Controle de Custos",
            url: `/conta/restaurants/${selectedRestaurantId}/dashboards/cost-control`,
          },
          {
            title: "Gestão de Equipe",
            url: `/conta/restaurants/${selectedRestaurantId}/dashboards/team-management`,
          },
        ]
      }
    ]
  }

  const navMainData = [
    {
      title: "Início",
      url: "/conta",
      icon: Home,
      items: [
        {
          title: "Serviços",
          url: "/conta/services",
        },
      ],
    },    
    {
      title: "Inteligência Artificial",
      url: "/conta/ai",
      icon: Brain,
      items: [
        {
          title: "Chat",
          url: "/conta/ai/chat",
        },
      ],
    },
    ...(selectedRestaurantId ? generateDashboardsNavItems() : []),
    {
      title: "Restaurantes", 
      url: "/conta/restaurants",
      icon: Store,
      items: [
        {
          title: "Listar",
          url: "/conta/restaurants",
        },
        {
          title: "Adicionar",
          url: "/conta/restaurants/add",
        },
      ],
    },
  ]

  if (loading) {
    return (
      <Sidebar collapsible="icon" {...props}>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Sidebar>
    )
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teamsData} onTeamChange={handleTeamChange} defaultTeam={selectedRestaurantId} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainData} />
        <NavProjects projects={[]} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user}>
          <Avatar>
            <AvatarFallback>
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </NavUser>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
