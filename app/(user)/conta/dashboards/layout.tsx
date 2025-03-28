"use client"

import type React from "react"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface DashboardsLayoutProps {
  children: React.ReactNode
}

export default function DashboardsLayout({ children }: DashboardsLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState("overview")
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Set the active tab based on the current pathname
  useEffect(() => {
    if (pathname.includes("/dashboards/client-consumption")) {
      setActiveTab("client-consumption")
    } else if (pathname.includes("/dashboards/cost-control")) {
      setActiveTab("cost-control")
    } else if (pathname.includes("/dashboards/team-management")) {
      setActiveTab("team-management")
    } else {
      setActiveTab("overview")
    }
  }, [pathname])

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    router.push(`/conta/dashboards/${value}`)
    setIsDrawerOpen(false)
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6 flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboards</h1>

        {/* Mobile Drawer Trigger */}
        <div className="sm:hidden">
          <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="p-4">
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                  <TabsList className="w-full grid grid-cols-1 gap-2">
                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                    <TabsTrigger value="client-consumption">Consumo por Cliente</TabsTrigger>
                    <TabsTrigger value="cost-control">Controle de Custo</TabsTrigger>
                    <TabsTrigger value="team-management">Gestão de Equipe</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      {/* Desktop Tabs */}
      <div className="px-4 lg:px-6 hidden sm:block">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-4 gap-2">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="client-consumption">Consumo por Cliente</TabsTrigger>
            <TabsTrigger value="cost-control">Controle de Custos</TabsTrigger>
            <TabsTrigger value="team-management">Gestão de Equipe</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  )
}

