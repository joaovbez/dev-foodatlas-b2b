"use client"

import * as React from "react"
import {
  Frame,
  Brain,
  ChartSpline,
  Package,
  Utensils,
  Building,
  CircleDollarSign,
  Star,
  Settings, 
  HelpCircle,
} from "lucide-react"

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

// This is sample data.
const data = {
  user: {
    name: "João Victor",
    email: "joaovictor@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Restaurante 1",
      logo: Utensils,
      plan: "Comida Italiana",
    },
    {
      name: "Restaurante 2",
      logo: Utensils,
      plan: "Comida Mexicana",
    },
    {
      name: "Restaurante 3",
      logo: Utensils,
      plan: "Comida Japonesa",
    },
  ],
  navMain: [
    {
      title: "Inteligência Artificial",
      url: "#",
      icon: Brain, 
      isActive: true,     
      items: [
        {
          title: "Chat",
          url: "#",
        },
        {
          title: "Insights Salvos",
          url: "#",
        },        
      ],
    },
    {
      title: "DashBoard",
      url: "#",
      icon: ChartSpline,
      items: [
        {
          title: "Opção 1",
          url: "#",
        },
        {
          title: "Opção 2",
          url: "#",
        },
        {
          title: "Opção 3",
          url: "#",
        },
      ],
    },
    {
      title: "Delivery",
      url: "#",
      icon: Package,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Loja Física",
      url: "#",
      icon: Building,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
    {
      title: "Financeiro",
      url: "#",
      icon: CircleDollarSign,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
    {
      title: "Avaliações",
      url: "#",
      icon: Star,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Integrações",
      url: "#",
      icon: Frame,
    },    
    {
      name: "Configurações",
      url: "#",
      icon: Settings,
    },
    {
      name: "Ajuda",
      url: "#",
      icon: HelpCircle,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
