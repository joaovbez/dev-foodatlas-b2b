import { AVGTicket } from "@/components/dashboards/card-avg-ticket"
import { CountClient } from "@/components/dashboards/card-count-clients"
import { ChartRevenueTotal } from "@/components/dashboards/chart-revenue-total"
import { ChartShiftCompare } from "@/components/dashboards/chart-shift-compare"

export default function TeamManagementPage() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-4 px-4 lg:px-6">
      {/* Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 *:data-[slot=card]:shadow-xs *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card">
        <AVGTicket />
        <CountClient />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartRevenueTotal />
        <ChartShiftCompare />
      </div>
    </div>
  )
}

