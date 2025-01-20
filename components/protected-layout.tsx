"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Carregando...</h2>
          <p className="text-sm text-muted-foreground">
            Por favor, aguarde enquanto verificamos sua sessão.
          </p>
        </div>
      </div>
    )
  }

  if (status === "authenticated") {
    return <>{children}</>
  }

  return null
}
