import { usePathname } from 'next/navigation'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

// Mapa de rotas para títulos
const routeMap = {
  'conta': {
    title: 'Conta',
    children: {
      'restaurants': {
        title: 'Restaurantes',
        children: {
          'add': {title: 'Adicionar'},
          'list': {title: 'Listagem'}
        }
      },
      'ai': {
        title: 'Inteligência Artificial',
        children: {
          'chat': {title: 'Chat'}
        }
      },
      'dashboards': {
        title: 'Dashboards',
        children: {
          'overview': {title: 'Visão Geral'},
          'client-consumption': {title: 'Consumo por Cliente'},
          'cost-control': {title: 'Controle de Custos'},
          'team-management': {title: 'Gestão de Equipe'}
        }
      },
      'services': {
        title: 'Serviços',        
      },
      'settings': {
        title: 'Configurações',
      }
    }
  }
}

export function DynamicBreadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)
  
  const generateBreadcrumbItems = () => {
    let currentPath = ''
    let currentRoute : any;
    const items: JSX.Element[] = []
    currentRoute = routeMap
    
    segments.map((segment, index) => {
      currentPath += `/${segment}`
      
      const title = currentRoute[segment as keyof typeof currentRoute]?.title;
    
      currentRoute = currentRoute[segment as keyof typeof currentRoute]?.children;
      

      if (index > 0) {
        items.push(
          <BreadcrumbSeparator key={`sep-${segment}`} className="hidden md:block" />
        )
      }

      if (index === segments.length - 1) {
        items.push(
            <BreadcrumbItem key={segment}>
              <BreadcrumbPage>{title}</BreadcrumbPage>
            </BreadcrumbItem>
        )
      } else {
        items.push(
          <BreadcrumbItem key={segment} className="hidden md:block">
            <BreadcrumbLink href={currentPath}>
              {title}
            </BreadcrumbLink>
          </BreadcrumbItem>
        )
      }    
    })
    return items
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {generateBreadcrumbItems()}
      </BreadcrumbList>
    </Breadcrumb>
  )
}