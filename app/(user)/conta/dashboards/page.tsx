"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DashboardsPage() {
  const router = useRouter()

  useEffect(() => {
    router.push("/dashboards/overview")
  }, [router])

  return null
}

