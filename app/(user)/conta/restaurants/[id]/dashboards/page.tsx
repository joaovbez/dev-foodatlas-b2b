"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"

export default function RestaurantDashboardsPage() {
  const router = useRouter()
  const { id } = useParams() as { id: string }

  useEffect(() => {
    router.push(`/conta/restaurants/${id}/dashboards/overview`)
  }, [router, id])

  return null
} 