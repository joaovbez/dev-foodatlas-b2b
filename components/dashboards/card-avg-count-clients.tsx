import { TrendingUpIcon, TrendingDownIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function AVGCountClient() {
  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardDescription>Média Diária de Clientes</CardDescription>
        <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">348</CardTitle>
        <div className="absolute right-4 top-4">
          <Badge variant="default" className="flex gap-1 rounded-lg text-xs">
            <TrendingUpIcon className="size-3" />
            +7%
          </Badge>
        </div>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1 text-sm">
        <div className="line-clamp-1 flex gap-2 font-medium">
          Aumento de 7% na média diária! <TrendingUpIcon className="size-4" />
        </div>
        <div className="text-muted-foreground">Reflexo da boa cultura de feedback.</div>
      </CardFooter>
    </Card>
  )
}

