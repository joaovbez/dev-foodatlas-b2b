"use client"

import { SettingsForm } from "@/components/settings-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const router = useRouter()

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b">
        <div className="flex items-center gap-2 px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/conta/services")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">Configurações da Conta</h1>
        </div>
      </header>

      <main className="flex-1">
        <SettingsForm />
      </main>
    </>
  )
}