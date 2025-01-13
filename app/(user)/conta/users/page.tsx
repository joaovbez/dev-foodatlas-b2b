"use client"
 
import * as React from "react"
 
import { cn } from "@/lib/utils"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
 



import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,  
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"
export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="conta">
                    Conta
                  </BreadcrumbLink>
                </BreadcrumbItem>                                
              </BreadcrumbList>
            </Breadcrumb>            
          </div>
          <div className="flex flex-1 justify-end p-4">
            <img
              src="/foodatlas_LOGOS_Prancheta 1.svg"
              alt="Logo"
              className="h-20 w-auto" 
            />
          </div>
        </header>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">                        
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Gerir Restaurantes</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="bg-green grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                      <li className="row-span-3">
                        <NavigationMenuLink className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md">
                                             
                            <div className="mb-2 mt-4 text-lg font-medium">
                              Gestão de Restaurantes
                            </div>
                            <p className="text-sm leading-tight text-muted-foreground">
                              Nesta aba você ver, adicionar ou remover as informações de seus restaurantes.
                            </p>
                          
                        </NavigationMenuLink>
                      </li>
                      <ListItem href="#" title="Ver restaurantes" className="bg-green2"/>                                      
                      <ListItem href="/conta/users" title="Adicionar Restaurantes" className="bg-green2"/>                        
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Gerir Usuários</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="bg-green grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                      <li className="row-span-3">
                        <NavigationMenuLink className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md">
                                             
                            <div className="mb-2 mt-4 text-lg font-medium">
                              Gestão de Usuários
                            </div>
                            <p className="text-sm leading-tight text-muted-foreground">
                              Nesta aba você ver, adicionar ou remover usuários que podem acessar a sua conta.
                            </p>
                          
                        </NavigationMenuLink> 
                      </li>
                      <ListItem href="#" title="Ver usuários" className="bg-green2"/>                                      
                      <ListItem href="/conta/users" title="Adicionar usuários" className="bg-green2"/>                        
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>        
              </NavigationMenuList>
            </NavigationMenu>          
          </div>
        </header>
        
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid auto-rows-min gap-4 md:grid-cols-2">
            <div className="aspect-video rounded-xl bg-muted/50" />
            <div className="aspect-video rounded-xl bg-muted/50" />            
          </div>          
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
