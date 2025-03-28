"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { Toaster } from "@/components/ui/toaster"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useTheme } from "next-themes"
import Image from 'next/image'
import { WhatsAppButton } from "@/components/support-button"
import { DynamicBreadcrumb } from "@/components/dynamicBreadCrumb"

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { theme } = useTheme()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <DynamicBreadcrumb />
          </div>
          <div className="flex flex-1 items-center justify-end gap-4 p-4">
            <ThemeToggle />
            <Image
              src={theme === 'light' ? '/foodatlas_LOGOS_Prancheta 1.svg' : '/foodatlas_logo_branco.png'}
              alt="Logo"
              width={80}
              height={80}
              className="h-20 w-auto"
              priority
            />
          </div>
        </header>
        {children}
      </SidebarInset>
      <Toaster />
      <div className="fixed bottom-6 right-6 z-50">
      <WhatsAppButton phoneNumber="551150265550" variant="default" size="support"/>
      </div>      
    </SidebarProvider>
  )
} 