"use client"

import * as React from "react"
import { ChevronsUpDown, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

interface Team {
  id: string
  name: string
  logo: React.ElementType
  plan: string
}

export function TeamSwitcher({
  teams,
  onTeamChange,
  defaultTeam,
}: {
  teams: Team[]
  onTeamChange?: (teamId: string) => void
  defaultTeam?: string | null
}) {
  const { isMobile, state } = useSidebar()
  const router = useRouter()
  
  // Encontrar o time padrão se existir
  const defaultTeamObject = defaultTeam && teams.length > 0
    ? teams.find(team => team.id === defaultTeam) || teams[0]
    : teams.length > 0 ? teams[0] : null;
  
  const [activeTeam, setActiveTeam] = React.useState<Team | null>(defaultTeamObject)

  // Avisar ao componente pai quando o time mudar
  React.useEffect(() => {
    if (activeTeam && onTeamChange) {
      onTeamChange(activeTeam.id)
    }
  }, [activeTeam, onTeamChange])

  const handleTeamSelect = (team: Team) => {
    setActiveTeam(team)
    
    // Chamar a callback se existir
    if (onTeamChange) {
      onTeamChange(team.id)
    }
    
    router.push(`/conta/restaurants/${team.id}`)
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {state === "collapsed" ? (
                <div className="flex w-full items-center justify-center">
                  <Plus className="size-4" />
                </div>
              ) : activeTeam ? (
                <>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#A3E635] text-sidebar-primary-foreground">
                    <activeTeam.logo className="size-4 text-black" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {activeTeam.name}
                    </span>
                    <span className="truncate text-xs">CNPJ: {activeTeam.plan}</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Plus className="size-4" />
                  <span>Selecione um Restaurante</span>
                </div>
              )}
              {state !== "collapsed" && <ChevronsUpDown className="ml-auto" />}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Seus Restaurantes
            </DropdownMenuLabel>
            {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.id}
                onClick={() => handleTeamSelect(team)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border bg-[#A3E635]">
                  <team.logo className="size-4 shrink-0 text-black" />
                </div>
                {team.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <Link href="/conta/restaurants/add">Adicionar Restaurante</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
