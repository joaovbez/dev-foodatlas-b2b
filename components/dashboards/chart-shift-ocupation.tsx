"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Sample data
const data = [
  { name: "Morning", occupied: 40, available: 60 },
  { name: "Afternoon", occupied: 60, available: 40 },
  { name: "Evening", occupied: 80, available: 20 },
  { name: "Night", occupied: 30, available: 70 },
]

export function ChartShiftOcupation() {
  const [period, setPeriod] = React.useState("weekly")

  return (
    <Card className="w-full h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-8">
        <div className="space-y-1">
          <CardTitle>Shift Occupation</CardTitle>
          <CardDescription>Occupied vs available capacity by shift</CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={8} />
              <YAxis axisLine={false} tickLine={false} tickMargin={8} tickFormatter={(value) => `${value}%`} />
              <Tooltip
                formatter={(value) => [`${value}%`, ""]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "8px",
                }}
                cursor={{ fill: "transparent" }}
              />
              <Legend />
              <Bar
                dataKey="occupied"
                stackId="a"
                fill="hsl(var(--primary))"
                name="Occupied"
                radius={[4, 4, 0, 0]}
                activeBar={false}
              />
              <Bar
                dataKey="available"
                stackId="a"
                fill="hsl(var(--muted))"
                name="Available"
                radius={[4, 4, 0, 0]}
                activeBar={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

