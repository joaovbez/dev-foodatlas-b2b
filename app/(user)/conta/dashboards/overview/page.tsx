'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SectionCards } from "@/components/dashboards/section-cards"


export default function DashboardsPage() {
    const [loading, setLoading] = useState(true);

    return(
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                    <SectionCards />
                </div>
            </div>
        </div>
    )
}