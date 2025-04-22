import { Cost, Revenue } from "@prisma/client"
import { subMonths, startOfMonth, endOfMonth } from "date-fns"

interface BreakEvenData {
  currentMonth: {
    fixedCosts: number
    variableCosts: number
    totalCosts: number
    revenue: number
    breakEvenPoint: number
  }
  lastMonth: {
    fixedCosts: number
    variableCosts: number
    totalCosts: number
    revenue: number
    breakEvenPoint: number
  }
  nextMonth: {
    fixedCosts: number
    variableCosts: number
    totalCosts: number
    projectedRevenue: number
    breakEvenPoint: number
  }
}

export function calculateBreakEven(costs: Cost[], revenues: Revenue[]): BreakEvenData {
  const now = new Date()
  const currentMonthStart = startOfMonth(now)
  const currentMonthEnd = endOfMonth(now)
  const lastMonthStart = startOfMonth(subMonths(now, 1))
  const lastMonthEnd = endOfMonth(subMonths(now, 1))

  // Filtra custos e receitas por período
  const currentMonthCosts = costs.filter(
    (cost) => cost.createdAt >= currentMonthStart && cost.createdAt <= currentMonthEnd
  )
  const lastMonthCosts = costs.filter(
    (cost) => cost.createdAt >= lastMonthStart && cost.createdAt <= lastMonthEnd
  )
  const currentMonthRevenues = revenues.filter(
    (revenue) => revenue.createdAt >= currentMonthStart && revenue.createdAt <= currentMonthEnd
  )
  const lastMonthRevenues = revenues.filter(
    (revenue) => revenue.createdAt >= lastMonthStart && revenue.createdAt <= lastMonthEnd
  )

  // Calcula custos fixos e variáveis
  const calculateCosts = (costs: Cost[]) => {
    const fixedCosts = costs
      .filter((cost) => cost.type === "FIXED")
      .reduce((sum, cost) => sum + cost.amount, 0)
    const variableCosts = costs
      .filter((cost) => cost.type === "VARIABLE")
      .reduce((sum, cost) => sum + cost.amount, 0)
    return {
      fixedCosts,
      variableCosts,
      totalCosts: fixedCosts + variableCosts,
    }
  }

  // Calcula receitas
  const calculateRevenue = (revenues: Revenue[]) => {
    return revenues.reduce((sum, revenue) => sum + revenue.amount, 0)
  }

  // Calcula ponto de break-even
  const calculateBreakEvenPoint = (fixedCosts: number, variableCosts: number, revenue: number) => {
    if (revenue === 0) return fixedCosts
    const variableCostPercentage = variableCosts / revenue
    return fixedCosts / (1 - variableCostPercentage)
  }

  // Dados do mês atual
  const currentMonthCostsData = calculateCosts(currentMonthCosts)
  const currentMonthRevenue = calculateRevenue(currentMonthRevenues)
  const currentMonthBreakEvenPoint = calculateBreakEvenPoint(
    currentMonthCostsData.fixedCosts,
    currentMonthCostsData.variableCosts,
    currentMonthRevenue
  )

  // Dados do mês anterior
  const lastMonthCostsData = calculateCosts(lastMonthCosts)
  const lastMonthRevenue = calculateRevenue(lastMonthRevenues)
  const lastMonthBreakEvenPoint = calculateBreakEvenPoint(
    lastMonthCostsData.fixedCosts,
    lastMonthCostsData.variableCosts,
    lastMonthRevenue
  )

  // Projeção para o próximo mês (usando média de crescimento dos últimos 2 meses)
  const revenueGrowth = currentMonthRevenue / lastMonthRevenue
  const projectedRevenue = currentMonthRevenue * revenueGrowth

  const projectedFixedCosts = currentMonthCostsData.fixedCosts
  const projectedVariableCosts = currentMonthCostsData.variableCosts * revenueGrowth
  const projectedTotalCosts = projectedFixedCosts + projectedVariableCosts
  const projectedBreakEvenPoint = calculateBreakEvenPoint(
    projectedFixedCosts,
    projectedVariableCosts,
    projectedRevenue
  )

  return {
    currentMonth: {
      fixedCosts: currentMonthCostsData.fixedCosts,
      variableCosts: currentMonthCostsData.variableCosts,
      totalCosts: currentMonthCostsData.totalCosts,
      revenue: currentMonthRevenue,
      breakEvenPoint: currentMonthBreakEvenPoint,
    },
    lastMonth: {
      fixedCosts: lastMonthCostsData.fixedCosts,
      variableCosts: lastMonthCostsData.variableCosts,
      totalCosts: lastMonthCostsData.totalCosts,
      revenue: lastMonthRevenue,
      breakEvenPoint: lastMonthBreakEvenPoint,
    },
    nextMonth: {
      fixedCosts: projectedFixedCosts,
      variableCosts: projectedVariableCosts,
      totalCosts: projectedTotalCosts,
      projectedRevenue,
      breakEvenPoint: projectedBreakEvenPoint,
    },
  }
} 