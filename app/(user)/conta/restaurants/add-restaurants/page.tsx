import * as React from "react"
 
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

async function handleSubmit(formData: FormData) {
  'use server'
  // Aqui você pode adicionar a lógica para processar os dados do formulário
  const nome = formData.get('nome')
  const unidade = formData.get('unidade')
  const endereco = formData.get('endereco')
  const cnpj = formData.get('cnpj')
  console.log('Dados do restaurante:', { nome, unidade, endereco, cnpj })
  // Implementar lógica de redirecionamento ou processamento adicional
}

import {  
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"

import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

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

const [completedSteps] = [1, 4]
const totalSteps = 4
const progress = (completedSteps / totalSteps) * 100

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
                      <ListItem href="/conta/restaurants/list-restaurants" title="Ver restaurantes" className="bg-green2"/>                                      
                      <ListItem href="/conta/restaurants/add-restaurants" title="Adicionar Restaurantes" className="bg-green2"/>                        
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
                      <ListItem href="/conta/users/list-users" title="Ver usuários" className="bg-green2"/>                                      
                      <ListItem href="/conta/users/add-users" title="Adicionar usuários" className="bg-green2"/>                        
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>        
              </NavigationMenuList>
            </NavigationMenu>          
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="h-80 grid auto-rows-min gap-4 grid-cols-1 md:grid-cols-[2fr_1fr]">            
            <div className="rounded-lg bg-muted/50">
            <Card className="w-full bg-gray">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center text-gray2">1. Dados do Restaurante</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={handleSubmit} method="POST" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome" className="text-gray2">Nome do Restaurante</Label>
                    <Input
                      id="nome"
                      name="nome"
                      required
                      className={cn("text-black", "placeholder:text-gray2/80")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unidade" className="text-gray2">Unidade</Label>
                    <Input
                      id="unidade"
                      name="unidade"
                      required
                      className={cn("text-black", "placeholder:text-gray2/50")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endereco" className="text-gray2">Endereço</Label>
                    <Input
                      id="endereco"
                      name="endereco"
                      required
                      className={cn("text-black", "placeholder:text-gray2/50")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj" className="text-gray2">CNPJ</Label>
                    <Input
                      id="cnpj"
                      name="cnpj"
                      required
                      className={cn("text-black", "placeholder:text-gray2/50")}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-[#C9E543] text-black hover:bg-[#B8D32F]">
                    Ir para comprovação de propriedade
                  </Button>
                </form>
              </CardContent>
            </Card>
            </div>
            <Card className="w-full max-w-md bg-[#F6F6F6] p-6 shadow-sm">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-xl font-medium text-gray-700">Checklist</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-6">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-medium text-gray-700">1. Registrar restaurantes e unidades</h3>
                      <span className="text-green-600 text-sm">Completo</span>
                    </div>
                    <p className="text-[#7D7E80] text-sm">
                      Adicione aqui os principais dados (nome, local, CNPJ, etc.) das suas unidades
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-medium text-gray-700">2. Comprovar propriedade dos restaurantes</h3>
                      <span className="text-amber-600 text-sm">Pendente</span>
                    </div>
                    <p className="text-[#7D7E80] text-sm">
                      Faça upload dos documentos de propriedade para ter acesso à nossa solução.
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-medium text-gray-700">3. Integrar com paginas de avaliações</h3>
                      <span className="text-amber-600 text-sm">Pendente</span>
                    </div>
                    <p className="text-[#7D7E80] text-sm">
                      Realize a integração com as principais plataformas de avaliações como Google, TripAdvisor, etc.
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-medium text-gray-700">4. Integrar com sistemas e softwares</h3>
                      <span className="text-amber-600 text-sm">Pendente</span>
                    </div>
                    <p className="text-[#7D7E80] text-sm">
                      Realize a integração com os principais sistemas e softwares de gestão de restaurantes, como ERP, PDV, Delivery, etc. 
                    </p>
                  </div>

                  <div className="space-y-2 pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Progresso</span>
                      <span className="text-gray-600">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {completedSteps < totalSteps && (
                    <Alert variant="default" className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Você ainda tem {totalSteps - completedSteps} etapas pendentes para completar.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>          
          </div>          
        </div>                       
      </SidebarInset>
    </SidebarProvider>
    
  )
}