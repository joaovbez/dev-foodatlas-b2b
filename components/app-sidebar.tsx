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
    {
      title: "Dashboards",
      url: "/conta/dashboards",
      icon: ChartNoAxesCombined,
      items: [
        {
          title: "Visão Geral",
          url: "/conta/dashboards/overview",          
        },
        {
          title: "Consumo por Cliente",
          url: "/conta/dashboards/client-consumption",
        },
        {
          title: "Controle de Custos",
          url: "/conta/dashboards/cost-control",
        },
        {
          title: "Gestão de Equipe",
          url: "/conta/dashboards/team-management",
        },
      ]
    },
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
        <TeamSwitcher teams={teamsData} />
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
