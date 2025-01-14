import { DataTable} from "./data-table"
 
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
      <AppSidebar/>
      <SidebarInset>
        <header className=" flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
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
        <header className=" flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">                        
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-black/5 border-2 border-black/20">Gerir Restaurantes</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="bg-green/70 grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
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
                      <ListItem href="/conta/restaurants/list-restaurants" title="Ver restaurantes" className="bg-green/50 border-2 border-green"/>                                      
                      <ListItem href="/conta/restaurants/add-restaurants" title="Adicionar Restaurantes" className="bg-green/50 border-2 border-green"/>                        
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-black/5 border-2 border-black/20">Gerir Usuários</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="bg-purple/70 grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
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
                      <ListItem href="/conta/users/list-users" title="Ver usuários" className="bg-purple/50 border-2 border-purple"/>                                      
                      <ListItem href="/conta/users/add-users" title="Adicionar usuários" className="bg-purple/50 border-2 border-purple"/>                        
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>        
              </NavigationMenuList>
            </NavigationMenu>          
          </div>
        </header>            
        <div className="p-4">
          <DataTable/>
        </div>        
      </SidebarInset>
    </SidebarProvider>
    
  )
}